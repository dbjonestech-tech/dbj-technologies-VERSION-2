"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";
import { recordChange } from "@/lib/canopy/audit";
import { canFireScan, incrementScanUsage } from "@/lib/canopy/pathlight-gate";
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
 * the budget (one per competitor). Gate fails fast if any single scan
 * would exceed the cap; partial-fire is intentionally avoided so the
 * operator gets either all-or-none and the budget reading on the next
 * page load is accurate. */
export async function scanCompetitorsAction(input: {
  contactId: number;
}): Promise<
  CompetitorActionResult<{ scanned: number; remaining: number | null }>
> {
  try {
    const admin = await requireAdmin();

    const gate = await canFireScan("competitive_intel");
    if (!gate.allowed) {
      return { ok: false, error: gate.reason ?? "Scan gate denied", reason: gate.reason };
    }

    const sql = getDb();
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

    if ((gate.remaining ?? 0) < rows.length) {
      return {
        ok: false,
        error: `Need ${rows.length} scans for this contact's competitors but only ${gate.remaining ?? 0} remaining in the monthly budget.`,
      };
    }

    let scanned = 0;
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

    await incrementScanUsage(scanned);

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
      data: { scanned, remaining: (gate.remaining ?? 0) - scanned },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}
