"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";
import { recordChange } from "@/lib/canopy/audit";
import { releaseScanReservation, tryReserveScan } from "@/lib/canopy/pathlight-gate";
import {
  countCompetitors,
  insertCompetitor,
  deleteCompetitor,
  MAX_COMPETITORS_PER_CONTACT,
} from "@/lib/canopy/competitors";

export type CompetitorActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; reason?: string };

async function requireAdmin(): Promise<{ email: string }> {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.email) {
    throw new Error("Unauthorized");
  }
  return { email: session.user.email };
}

function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

export async function addCompetitorAction(input: {
  contactId: number;
  competitorName: string;
  websiteUrl: string;
  notes?: string;
}): Promise<CompetitorActionResult<{ id: number }>> {
  try {
    await requireAdmin();
    const competitorName = input.competitorName.trim();
    if (!competitorName) return { ok: false, error: "Competitor name is required" };
    const url = normalizeUrl(input.websiteUrl);
    if (!url) return { ok: false, error: "Website URL is required" };

    const existing = await countCompetitors(input.contactId);
    if (existing >= MAX_COMPETITORS_PER_CONTACT) {
      return {
        ok: false,
        error: `A contact can have at most ${MAX_COMPETITORS_PER_CONTACT} competitors. Remove one before adding another.`,
      };
    }

    const row = await insertCompetitor({
      contactId: input.contactId,
      competitorName,
      websiteUrl: url,
      notes: input.notes ?? null,
    });
    if (!row) return { ok: false, error: "Could not insert competitor" };

    await recordChange({
      entityType: "competitor",
      entityId: String(row.id),
      action: "create",
      after: { contact_id: input.contactId, competitor_name: competitorName, website_url: url },
    });

    revalidatePath(`/admin/contacts/${input.contactId}`);
    return { ok: true, data: { id: row.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function removeCompetitorAction(input: {
  competitorId: number;
  contactId: number;
}): Promise<CompetitorActionResult<{ removed: number }>> {
  try {
    await requireAdmin();
    await deleteCompetitor(input.competitorId, input.contactId);
    await recordChange({
      entityType: "competitor",
      entityId: String(input.competitorId),
      action: "delete",
    });
    revalidatePath(`/admin/contacts/${input.contactId}`);
    return { ok: true, data: { removed: input.competitorId } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

/* Scan all the competitors for one contact. Counts as N scans against
 * the budget (one per competitor). Reservation is atomic on the full
 * batch via tryReserveScan(N): either N slots reserve cleanly or the
 * call fails before any scan fires, so two operators clicking on the
 * same contact cannot both partially-overshoot the cap. Any individual
 * row whose INSERT or Inngest send fails refunds its slot via the
 * try/finally below. */
export async function scanCompetitorsAction(input: {
  contactId: number;
}): Promise<
  CompetitorActionResult<{ scanned: number; remaining: number | null }>
> {
  try {
    const admin = await requireAdmin();
    const sql = getDb();

    /* Fetch the row count first so the atomic reservation knows how
     * many slots to reserve. Two-step is unavoidable because the budget
     * cap depends on N, and N comes from the DB. */
    const rows = (await sql`
      SELECT id, competitor_name, website_url
      FROM competitors
      WHERE contact_id = ${input.contactId}
        AND scan_status IN ('pending','failed')
      ORDER BY created_at ASC
    `) as Array<{ id: number; competitor_name: string; website_url: string }>;

    if (rows.length === 0) {
      return { ok: false, error: "No competitors pending a scan" };
    }

    /* Atomically reserve all N slots. Fails fast (and undoes nothing,
     * since nothing was reserved) if the budget cannot fit the batch.
     * The "need N have M" message is now produced inside the reserver. */
    const reservation = await tryReserveScan("competitive_intel", rows.length);
    if (!reservation.allowed) {
      return { ok: false, error: reservation.reason ?? "Scan gate denied", reason: reservation.reason };
    }

    let scanned = 0;
    try {
      for (const c of rows) {
        const scanRows = (await sql`
          INSERT INTO scans (url, email, business_name, city, status)
          VALUES (
            ${c.website_url},
            ${`competitor+${c.id}@dbjtechnologies.com`},
            ${c.competitor_name},
            ${"Dallas"},
            'pending'
          )
          RETURNING id::text AS id
        `) as Array<{ id: string }>;
        const scanId = scanRows[0]?.id;
        if (!scanId) continue;

        await sql`
          UPDATE competitors
          SET scan_status = 'scanning',
              last_scan_id = ${scanId},
              last_scanned_at = NOW(),
              updated_at = NOW()
          WHERE id = ${c.id}
        `;

        await inngest.send({
          name: "pathlight/scan.requested",
          data: { scanId },
        });
        scanned++;
      }
    } finally {
      /* Refund any reserved-but-not-fired slots whether the loop
       * completed cleanly or threw. Without this, a mid-loop failure
       * (or any row whose INSERT returned no id) would leak budget. */
      const unfired = rows.length - scanned;
      if (unfired > 0) {
        await releaseScanReservation(unfired);
      }
    }

    await recordChange({
      entityType: "contact",
      entityId: String(input.contactId),
      action: "competitors_scanned",
      after: { scanned },
      metadata: { triggered_by_email: admin.email },
    });

    revalidatePath(`/admin/contacts/${input.contactId}`);
    return {
      ok: true,
      data: {
        scanned,
        remaining: (reservation.remaining ?? 0) + (rows.length - scanned),
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}
