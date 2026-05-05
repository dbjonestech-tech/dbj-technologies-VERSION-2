"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";
import { recordChange } from "@/lib/canopy/audit";
import { releaseScanReservation, tryReserveScan } from "@/lib/canopy/pathlight-gate";
import { inferCandidateVertical } from "@/lib/canopy/prospect-lists";

export type ProspectActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; reason?: string };

async function requireAdmin(): Promise<{ email: string; userId: string | null }> {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.email) {
    throw new Error("Unauthorized");
  }
  return { email: session.user.email, userId: session.user.id ?? null };
}

function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

export async function createProspectListAction(input: {
  name: string;
  notes?: string;
}): Promise<ProspectActionResult<{ id: number }>> {
  try {
    const admin = await requireAdmin();
    const name = input.name.trim();
    if (!name) return { ok: false, error: "Name is required" };

    const sql = getDb();
    const rows = (await sql`
      INSERT INTO prospect_lists (name, source, status, created_by_email, notes)
      VALUES (${name}, 'manual', 'active', ${admin.email}, ${input.notes?.trim() || null})
      RETURNING id
    `) as Array<{ id: number }>;
    const id = rows[0]?.id ?? 0;

    await recordChange({
      entityType: "prospect_list",
      entityId: String(id),
      action: "create",
      after: { name, source: "manual", status: "active" },
    });

    revalidatePath("/admin/prospecting");
    return { ok: true, data: { id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function addProspectCandidateAction(input: {
  listId: number;
  businessName: string;
  websiteUrl: string;
  location?: string;
  vertical?: string;
  businessModel?: string;
  notes?: string;
}): Promise<ProspectActionResult<{ id: number }>> {
  try {
    await requireAdmin();
    const businessName = input.businessName.trim();
    if (!businessName) return { ok: false, error: "Business name is required" };
    const url = normalizeUrl(input.websiteUrl);
    if (!url) return { ok: false, error: "Website URL is required" };

    const vert = inferCandidateVertical({
      vertical: input.vertical ?? null,
      businessModel: input.businessModel ?? null,
    });

    const sql = getDb();
    const rows = (await sql`
      INSERT INTO prospect_candidates (
        list_id, business_name, website_url, location,
        vertical, vertical_confidence, notes
      ) VALUES (
        ${input.listId},
        ${businessName},
        ${url},
        ${input.location?.trim() || null},
        ${vert.vertical},
        ${vert.confidence},
        ${input.notes?.trim() || null}
      )
      RETURNING id
    `) as Array<{ id: number }>;
    const id = rows[0]?.id ?? 0;

    await recordChange({
      entityType: "prospect_candidate",
      entityId: String(id),
      action: "create",
      after: {
        list_id: input.listId,
        business_name: businessName,
        website_url: url,
        vertical: vert.vertical,
        vertical_confidence: vert.confidence,
      },
    });

    revalidatePath(`/admin/prospecting/${input.listId}`);
    return { ok: true, data: { id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function removeProspectCandidateAction(input: {
  candidateId: number;
  listId: number;
}): Promise<ProspectActionResult<{ removed: number }>> {
  try {
    await requireAdmin();
    const sql = getDb();
    await sql`
      DELETE FROM prospect_candidates
      WHERE id = ${input.candidateId} AND list_id = ${input.listId}
    `;
    await recordChange({
      entityType: "prospect_candidate",
      entityId: String(input.candidateId),
      action: "delete",
    });
    revalidatePath(`/admin/prospecting/${input.listId}`);
    return { ok: true, data: { removed: input.candidateId } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

/* Fire a Pathlight scan against a single prospect candidate. Routes
 * through tryReserveScan('prospecting') so master kill / prospecting
 * toggle / monthly budget all gate the action atomically. On success
 * creates a scans row, sends the inngest pipeline event, and writes
 * back the scan_id + scanning status to the candidate row. Refunds
 * the reservation on any pre-Inngest failure or if Inngest itself
 * rejects the send. The pipeline's finalize step doesn't currently
 * know about prospect_candidates; the candidate's pathlight_score
 * column gets backfilled when the operator clicks the row in the UI
 * (which calls a thin server action to read scans/scan_results and
 * update). */
export async function scanProspectCandidateAction(input: {
  candidateId: number;
}): Promise<
  ProspectActionResult<{ scan_id: string; remaining: number | null }>
> {
  try {
    const admin = await requireAdmin();

    const reservation = await tryReserveScan("prospecting", 1);
    if (!reservation.allowed) {
      return { ok: false, error: reservation.reason ?? "Scan gate denied", reason: reservation.reason };
    }

    const sql = getDb();
    const candRows = (await sql`
      SELECT id, list_id, business_name, website_url, scan_status
      FROM prospect_candidates
      WHERE id = ${input.candidateId}
      LIMIT 1
    `) as Array<{
      id: number;
      list_id: number;
      business_name: string;
      website_url: string;
      scan_status: string;
    }>;
    const cand = candRows[0];
    if (!cand) {
      await releaseScanReservation(1);
      return { ok: false, error: "Candidate not found" };
    }
    if (cand.scan_status === "scanning" || cand.scan_status === "scanned") {
      await releaseScanReservation(1);
      return { ok: false, error: `Candidate already ${cand.scan_status}` };
    }

    const scanRows = (await sql`
      INSERT INTO scans (url, email, business_name, city, status)
      VALUES (
        ${cand.website_url},
        ${`prospect+${cand.id}@dbjtechnologies.com`},
        ${cand.business_name},
        ${"Dallas"},
        'pending'
      )
      RETURNING id::text AS id
    `) as Array<{ id: string }>;
    const scanId = scanRows[0]?.id;
    if (!scanId) {
      await releaseScanReservation(1);
      return { ok: false, error: "Could not create scan row" };
    }

    await sql`
      UPDATE prospect_candidates
      SET scan_status = 'scanning',
          scan_id = ${scanId},
          scanned_at = NOW()
      WHERE id = ${cand.id}
    `;

    try {
      await inngest.send({
        name: "pathlight/scan.requested",
        data: { scanId },
      });
    } catch (err) {
      await releaseScanReservation(1);
      throw err;
    }

    await recordChange({
      entityType: "prospect_candidate",
      entityId: String(cand.id),
      action: "scan_started",
      after: { scan_id: scanId },
      metadata: { triggered_by_email: admin.email },
    });

    revalidatePath(`/admin/prospecting/${cand.list_id}`);
    return {
      ok: true,
      data: { scan_id: scanId, remaining: reservation.remaining ?? null },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function archiveProspectListAction(input: {
  listId: number;
}): Promise<ProspectActionResult<{ archived: number }>> {
  try {
    await requireAdmin();
    const sql = getDb();
    await sql`
      UPDATE prospect_lists
      SET status = 'archived', updated_at = NOW()
      WHERE id = ${input.listId}
    `;
    await recordChange({
      entityType: "prospect_list",
      entityId: String(input.listId),
      action: "archive",
    });
    revalidatePath("/admin/prospecting");
    return { ok: true, data: { archived: input.listId } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function acknowledgeWebsiteSignalAction(input: {
  signalId: number;
}): Promise<ProspectActionResult<{ acknowledged: number }>> {
  try {
    const admin = await requireAdmin();
    const sql = getDb();
    await sql`
      UPDATE website_change_signals
      SET acknowledged_at = NOW(),
          acknowledged_by_email = ${admin.email}
      WHERE id = ${input.signalId}
        AND acknowledged_at IS NULL
    `;
    await recordChange({
      entityType: "website_change_signal",
      entityId: String(input.signalId),
      action: "acknowledge",
    });
    revalidatePath("/admin");
    revalidatePath("/admin/website-changes");
    return { ok: true, data: { acknowledged: input.signalId } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}
