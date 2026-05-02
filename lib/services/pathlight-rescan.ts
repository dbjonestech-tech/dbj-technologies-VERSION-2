import { getDb } from "@/lib/db";

export interface PathlightScanLogRow {
  id: number;
  contact_id: number;
  scan_id: string;
  previous_scan_id: string | null;
  score: number | null;
  previous_score: number | null;
  score_delta: number | null;
  triggered_by_email: string | null;
  triggered_reason: string | null;
  scanned_at: string;
  completed_at: string | null;
  /* Joined live data from scans + scan_results. */
  scan_status: string | null;
  scan_score: number | null;
  scan_url: string | null;
}

export async function getRescansForContact(contactId: number, limit = 20): Promise<PathlightScanLogRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        psl.id,
        psl.contact_id,
        psl.scan_id,
        psl.previous_scan_id,
        psl.score,
        psl.previous_score,
        psl.score_delta,
        psl.triggered_by_email,
        psl.triggered_reason,
        psl.scanned_at,
        psl.completed_at,
        s.status::text  AS scan_status,
        sr.pathlight_score::int AS scan_score,
        s.url           AS scan_url
      FROM pathlight_scans_log psl
      LEFT JOIN scans s          ON s.id::text  = psl.scan_id
      LEFT JOIN scan_results sr  ON sr.scan_id  = s.id
      WHERE psl.contact_id = ${contactId}
      ORDER BY psl.scanned_at DESC
      LIMIT ${limit}
    `) as PathlightScanLogRow[];
    return rows;
  } catch {
    return [];
  }
}
