import { getDb } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";
import { canFireScan, incrementScanUsage } from "@/lib/canopy/pathlight-gate";

export interface RescanInput {
  contactId: number;
  triggeredByUserId?: string | null;
  triggeredByEmail: string;
  reason?: string | null;
  /* Operator can override the URL the scan runs against. Defaults to
   * the contact's most recent scan URL, then to contacts.website. */
  url?: string;
}

export interface RescanResult {
  scan_id: string;
  previous_scan_id: string | null;
  previous_score: number | null;
  log_id: number;
}

/* Trigger a fresh Pathlight scan for an existing contact. Always
 * passes through canFireScan first; on success increments the budget
 * counter and writes a row to pathlight_scans_log so the contact
 * detail page can render the rescan ledger. The actual scan runs
 * asynchronously in the existing Inngest pipeline; the score_delta
 * column on the log row is filled in later by the pipeline's finalize
 * step (Phase 6.5 wiring) - for now the row carries previous_score
 * and the operator sees the new score appear when the pipeline
 * finishes via the existing Pathlight scan card on the contact page. */
export async function triggerRescanForContact(
  input: RescanInput
): Promise<{ ok: true; data: RescanResult } | { ok: false; error: string; reason?: string }> {
  const gate = await canFireScan("rescan");
  if (!gate.allowed) {
    return { ok: false, error: gate.reason ?? "Scan gate denied", reason: gate.reason };
  }

  const sql = getDb();
  const contactRows = (await sql`
    SELECT id, email, name, company, website
    FROM contacts
    WHERE id = ${input.contactId}
    LIMIT 1
  `) as Array<{ id: number; email: string; name: string | null; company: string | null; website: string | null }>;
  const contact = contactRows[0];
  if (!contact) {
    return { ok: false, error: "Contact not found" };
  }

  /* Resolve URL: explicit override -> latest scan URL -> contact.website. */
  let url = input.url?.trim() || null;
  if (!url) {
    const lastScan = (await sql`
      SELECT url, id::text AS id, COALESCE((
        SELECT pathlight_score::int FROM scan_results sr WHERE sr.scan_id = s.id
      ), NULL) AS score
      FROM scans s
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(${contact.email}))
      ORDER BY created_at DESC
      LIMIT 1
    `) as Array<{ url: string; id: string; score: number | null }>;
    if (lastScan[0]) {
      url = lastScan[0].url;
    }
  }
  if (!url && contact.website) {
    url = contact.website;
  }
  if (!url) {
    return {
      ok: false,
      error: "No URL on file for this contact. Add a website to the contact, or provide a URL with the rescan.",
    };
  }

  /* Pull the previous-most-recent scan id + score for delta tracking. */
  const previous = (await sql`
    SELECT s.id::text AS id, sr.pathlight_score::int AS score
    FROM scans s
    LEFT JOIN scan_results sr ON sr.scan_id = s.id
    WHERE LOWER(TRIM(s.email)) = LOWER(TRIM(${contact.email}))
      AND s.url = ${url}
    ORDER BY s.created_at DESC
    LIMIT 1
  `) as Array<{ id: string | null; score: number | null }>;
  const previousScanId = previous[0]?.id ?? null;
  const previousScore = previous[0]?.score ?? null;

  /* Insert a fresh scans row and send the pipeline event. Match the
   * shape of app/(grade)/api/scan/route.ts but skip Turnstile + rate
   * limits since this is admin-triggered behind canFireScan. */
  const scanRows = (await sql`
    INSERT INTO scans (url, email, business_name, city, status)
    VALUES (
      ${url},
      ${contact.email},
      ${contact.company ?? null},
      ${"Dallas"},
      'pending'
    )
    RETURNING id
  `) as Array<{ id: string }>;
  const scanId = scanRows[0]?.id;
  if (!scanId) {
    return { ok: false, error: "Could not create scan row" };
  }

  await inngest.send({
    name: "pathlight/scan.requested",
    data: { scanId },
  });

  const logRows = (await sql`
    INSERT INTO pathlight_scans_log
      (contact_id, scan_id, previous_scan_id, previous_score,
       triggered_by_user_id, triggered_by_email, triggered_reason)
    VALUES (
      ${input.contactId},
      ${scanId},
      ${previousScanId},
      ${previousScore},
      ${input.triggeredByUserId ?? null},
      ${input.triggeredByEmail},
      ${input.reason?.trim() || null}
    )
    RETURNING id
  `) as Array<{ id: number }>;

  await incrementScanUsage(1);

  return {
    ok: true,
    data: {
      scan_id: scanId,
      previous_scan_id: previousScanId,
      previous_score: previousScore,
      log_id: logRows[0]?.id ?? 0,
    },
  };
}
