import { getDb } from "@/lib/db";

export type CompetitorScanStatus = "pending" | "scanning" | "scanned" | "failed";

export interface Competitor {
  id: number;
  contact_id: number;
  competitor_name: string;
  website_url: string;
  last_pathlight_score: number | null;
  last_scan_id: string | null;
  last_scanned_at: string | null;
  scan_status: CompetitorScanStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/* App-level cap (not enforced by schema) so an operator can't drown
 * a contact in 50 competitor URLs. Spec says "up to 5". */
export const MAX_COMPETITORS_PER_CONTACT = 5;

export async function listCompetitors(contactId: number): Promise<Competitor[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT *
      FROM competitors
      WHERE contact_id = ${contactId}
      ORDER BY created_at ASC
    `) as Competitor[];
    return rows;
  } catch {
    return [];
  }
}

export async function countCompetitors(contactId: number): Promise<number> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT COUNT(*)::int AS n FROM competitors WHERE contact_id = ${contactId}
    `) as Array<{ n: number }>;
    return rows[0]?.n ?? 0;
  } catch {
    return 0;
  }
}

export async function insertCompetitor(input: {
  contactId: number;
  competitorName: string;
  websiteUrl: string;
  notes?: string | null;
}): Promise<Competitor | null> {
  try {
    const sql = getDb();
    const rows = (await sql`
      INSERT INTO competitors (contact_id, competitor_name, website_url, notes)
      VALUES (${input.contactId}, ${input.competitorName}, ${input.websiteUrl}, ${input.notes ?? null})
      RETURNING *
    `) as Competitor[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function deleteCompetitor(id: number, contactId: number): Promise<void> {
  const sql = getDb();
  await sql`
    DELETE FROM competitors
    WHERE id = ${id} AND contact_id = ${contactId}
  `;
}

export async function setCompetitorScanResult(input: {
  id: number;
  scanId: string;
  status: CompetitorScanStatus;
  score?: number | null;
}): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE competitors
    SET last_scan_id = ${input.scanId},
        last_scanned_at = NOW(),
        scan_status = ${input.status},
        last_pathlight_score = ${input.score ?? null},
        updated_at = NOW()
    WHERE id = ${input.id}
  `;
}
