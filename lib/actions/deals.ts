"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { recordChange } from "@/lib/canopy/audit";
import {
  DEAL_STAGES,
  STAGE_PROBABILITY,
  type DealRow,
  type DealStage,
} from "@/lib/services/deals";

export type DealActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireAdmin(): Promise<{ email: string }> {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.email) {
    throw new Error("Unauthorized");
  }
  return { email: session.user.email };
}

const REVALIDATE_PATHS = [
  "/admin",
  "/admin/deals",
  "/admin/contacts",
  "/admin/relationships/pipeline",
] as const;

function revalidateAll(): void {
  for (const p of REVALIDATE_PATHS) revalidatePath(p);
}

async function loadDealRaw(id: number): Promise<DealRow | null> {
  const sql = getDb();
  const rows = (await sql`
    SELECT
      d.id, d.name, d.contact_id,
      c.email AS contact_email, c.name AS contact_name, c.company AS contact_company,
      d.owner_user_id, d.owner_email,
      d.value_cents::bigint, d.currency, d.stage, d.probability_pct,
      d.expected_close_at, d.closed_at, d.won, d.loss_reason,
      d.source, d.notes, d.created_at, d.updated_at
    FROM deals d
    JOIN contacts c ON c.id = d.contact_id
    WHERE d.id = ${id}
    LIMIT 1
  `) as DealRow[];
  return rows[0] ?? null;
}

export async function createDealAction(input: {
  contactId: number;
  name: string;
  valueDollars?: number;
  stage?: DealStage;
  probabilityPct?: number;
  expectedCloseAt?: string | null;
  notes?: string | null;
}): Promise<DealActionResult<DealRow>> {
  try {
    const admin = await requireAdmin();
    const name = input.name?.trim();
    if (!name) return { ok: false, error: "Name is required" };
    const stage: DealStage = input.stage ?? "new";
    if (!DEAL_STAGES.includes(stage)) return { ok: false, error: "Invalid stage" };
    const probability = clampProb(input.probabilityPct ?? STAGE_PROBABILITY[stage]);
    const valueCents = Math.max(0, Math.round(((input.valueDollars ?? 0)) * 100));

    const sql = getDb();
    const inserted = (await sql`
      INSERT INTO deals (name, contact_id, owner_email, value_cents, stage, probability_pct, expected_close_at, notes)
      VALUES (
        ${name},
        ${input.contactId},
        ${admin.email},
        ${valueCents},
        ${stage},
        ${probability},
        ${input.expectedCloseAt ?? null},
        ${input.notes?.trim() ?? null}
      )
      RETURNING id
    `) as Array<{ id: number }>;
    const id = inserted[0]?.id;
    if (!id) return { ok: false, error: "Insert failed" };

    const row = await loadDealRaw(id);
    if (!row) return { ok: false, error: "Could not reload created deal" };

    await recordChange({
      entityType: "deal",
      entityId: String(id),
      action: "deal.create",
      after: { name, stage, value_cents: valueCents, probability_pct: probability, contact_id: input.contactId },
    });

    revalidateAll();
    return { ok: true, data: row };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateDealFieldAction(
  id: number,
  field: "name" | "value_cents" | "expected_close_at" | "probability_pct" | "notes",
  value: string | number | null
): Promise<DealActionResult<DealRow>> {
  try {
    await requireAdmin();
    const before = await loadDealRaw(id);
    if (!before) return { ok: false, error: "Deal not found" };
    if (before.closed_at) return { ok: false, error: "Cannot edit a closed deal. Reopen it first." };

    const sql = getDb();
    switch (field) {
      case "name": {
        const v = String(value ?? "").trim();
        if (!v) return { ok: false, error: "Name cannot be empty" };
        await sql`UPDATE deals SET name = ${v}, updated_at = NOW() WHERE id = ${id}`;
        break;
      }
      case "value_cents": {
        const v = Math.max(0, Math.round(Number(value) || 0));
        await sql`UPDATE deals SET value_cents = ${v}, updated_at = NOW() WHERE id = ${id}`;
        break;
      }
      case "expected_close_at": {
        const v = value === null || value === "" ? null : String(value);
        await sql`UPDATE deals SET expected_close_at = ${v}, updated_at = NOW() WHERE id = ${id}`;
        break;
      }
      case "probability_pct": {
        const v = clampProb(Number(value) || 0);
        await sql`UPDATE deals SET probability_pct = ${v}, updated_at = NOW() WHERE id = ${id}`;
        break;
      }
      case "notes": {
        const v = value === null ? null : String(value);
        await sql`UPDATE deals SET notes = ${v}, updated_at = NOW() WHERE id = ${id}`;
        break;
      }
    }

    const after = await loadDealRaw(id);
    if (!after) return { ok: false, error: "Could not reload deal after update" };

    await recordChange({
      entityType: "deal",
      entityId: String(id),
      action: `deal.update.${field}`,
      before: { [field]: pickField(before, field) },
      after: { [field]: pickField(after, field) },
    });

    revalidateAll();
    return { ok: true, data: after };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function changeDealStageAction(
  id: number,
  nextStage: DealStage
): Promise<DealActionResult<DealRow>> {
  try {
    await requireAdmin();
    if (!DEAL_STAGES.includes(nextStage)) return { ok: false, error: "Invalid stage" };
    if (nextStage === "won" || nextStage === "lost") {
      return {
        ok: false,
        error: `Use "Close as ${nextStage === "won" ? "Won" : "Lost"}" on the deal detail page to record the outcome.`,
      };
    }

    const before = await loadDealRaw(id);
    if (!before) return { ok: false, error: "Deal not found" };
    if (before.closed_at) {
      return { ok: false, error: "This deal is closed. Reopen it before changing stage." };
    }
    if (before.stage === nextStage) {
      return { ok: true, data: before };
    }

    /* Probability rule: never decrease via stage change. If the new
     * stage's default is higher than the current probability, raise to
     * the default. Otherwise leave the operator's custom value alone. */
    const defaultProb = STAGE_PROBABILITY[nextStage];
    const newProb = Math.max(before.probability_pct, defaultProb);

    const sql = getDb();
    await sql`
      UPDATE deals
      SET stage = ${nextStage},
          probability_pct = ${newProb},
          updated_at = NOW()
      WHERE id = ${id}
    `;
    /* Mirror the contact's primary status when this deal is the
     * contact's most-recently-updated open deal. Keeps the existing
     * /admin/relationships/pipeline kanban consistent. */
    await mirrorContactStatusFromPrimaryDeal(before.contact_id);

    const after = await loadDealRaw(id);
    if (!after) return { ok: false, error: "Could not reload deal after stage change" };

    await recordChange({
      entityType: "deal",
      entityId: String(id),
      action: "deal.stage_change",
      before: { stage: before.stage, probability_pct: before.probability_pct },
      after: { stage: after.stage, probability_pct: after.probability_pct },
    });

    revalidateAll();
    return { ok: true, data: after };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function closeDealWonAction(
  id: number,
  finalValueDollars?: number
): Promise<DealActionResult<DealRow>> {
  try {
    await requireAdmin();
    const before = await loadDealRaw(id);
    if (!before) return { ok: false, error: "Deal not found" };
    if (before.closed_at) return { ok: false, error: "Deal already closed" };

    const sql = getDb();
    const finalCents =
      typeof finalValueDollars === "number" && finalValueDollars >= 0
        ? Math.round(finalValueDollars * 100)
        : before.value_cents;

    await sql`
      UPDATE deals
      SET stage = 'won',
          probability_pct = 100,
          won = TRUE,
          closed_at = NOW(),
          loss_reason = NULL,
          value_cents = ${finalCents},
          updated_at = NOW()
      WHERE id = ${id}
    `;
    await mirrorContactStatusFromPrimaryDeal(before.contact_id);

    const after = await loadDealRaw(id);
    if (!after) return { ok: false, error: "Could not reload deal after close" };

    await recordChange({
      entityType: "deal",
      entityId: String(id),
      action: "deal.close.won",
      before: { stage: before.stage, value_cents: before.value_cents, closed_at: before.closed_at },
      after: { stage: "won", value_cents: finalCents, closed_at: after.closed_at },
    });

    revalidateAll();
    return { ok: true, data: after };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function closeDealLostAction(
  id: number,
  lossReason: string
): Promise<DealActionResult<DealRow>> {
  try {
    await requireAdmin();
    const reason = lossReason?.trim();
    if (!reason) return { ok: false, error: "Loss reason is required" };

    const before = await loadDealRaw(id);
    if (!before) return { ok: false, error: "Deal not found" };
    if (before.closed_at) return { ok: false, error: "Deal already closed" };

    const sql = getDb();
    await sql`
      UPDATE deals
      SET stage = 'lost',
          probability_pct = 0,
          won = FALSE,
          closed_at = NOW(),
          loss_reason = ${reason},
          updated_at = NOW()
      WHERE id = ${id}
    `;
    await mirrorContactStatusFromPrimaryDeal(before.contact_id);

    const after = await loadDealRaw(id);
    if (!after) return { ok: false, error: "Could not reload deal after close" };

    await recordChange({
      entityType: "deal",
      entityId: String(id),
      action: "deal.close.lost",
      before: { stage: before.stage, closed_at: before.closed_at },
      after: { stage: "lost", closed_at: after.closed_at, loss_reason: reason },
    });

    revalidateAll();
    return { ok: true, data: after };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function reopenDealAction(id: number): Promise<DealActionResult<DealRow>> {
  try {
    await requireAdmin();
    const before = await loadDealRaw(id);
    if (!before) return { ok: false, error: "Deal not found" };
    if (!before.closed_at) return { ok: false, error: "Deal is not closed" };

    const sql = getDb();
    await sql`
      UPDATE deals
      SET stage = 'qualified',
          probability_pct = 50,
          won = NULL,
          closed_at = NULL,
          loss_reason = NULL,
          updated_at = NOW()
      WHERE id = ${id}
    `;
    await mirrorContactStatusFromPrimaryDeal(before.contact_id);

    const after = await loadDealRaw(id);
    if (!after) return { ok: false, error: "Could not reload deal after reopen" };

    await recordChange({
      entityType: "deal",
      entityId: String(id),
      action: "deal.reopen",
      before: { stage: before.stage, closed_at: before.closed_at, won: before.won },
      after: { stage: after.stage, closed_at: null, won: null },
    });

    revalidateAll();
    return { ok: true, data: after };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/* When a deal changes stage, the contact's denormalized status mirrors
 * the most-recently-updated deal: open deals win over closed deals,
 * within each set the most recent updated_at wins. Best-effort: a
 * mirror failure must not roll back the deal change. */
async function mirrorContactStatusFromPrimaryDeal(contactId: number): Promise<void> {
  try {
    const sql = getDb();
    await sql`
      UPDATE contacts
      SET status = primary_deal.stage,
          updated_at = NOW()
      FROM (
        SELECT stage
        FROM deals
        WHERE contact_id = ${contactId}
        ORDER BY
          CASE WHEN closed_at IS NULL THEN 0 ELSE 1 END,
          updated_at DESC
        LIMIT 1
      ) AS primary_deal
      WHERE contacts.id = ${contactId}
        AND contacts.status IS DISTINCT FROM primary_deal.stage
    `;
  } catch {
    /* swallow */
  }
}

function clampProb(n: number): number {
  if (!Number.isFinite(n)) return 10;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function pickField(row: DealRow, field: string): unknown {
  return (row as unknown as Record<string, unknown>)[field];
}
