import { getDb } from "@/lib/db";
import { lookupVertical } from "@/lib/services/vertical-lookup";

export type ProspectListStatus = "draft" | "active" | "archived";
export type ProspectListSource = "manual" | "csv" | "generated";
export type CandidateScanStatus =
  | "pending"
  | "scanning"
  | "scanned"
  | "failed"
  | "skipped";
export type VerticalConfidence = "high" | "medium" | "low" | "none";

export interface ProspectList {
  id: number;
  name: string;
  source: ProspectListSource;
  status: ProspectListStatus;
  created_by_user_id: string | null;
  created_by_email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  candidate_count?: number;
  scanned_count?: number;
}

export interface ProspectCandidate {
  id: number;
  list_id: number;
  business_name: string;
  website_url: string;
  location: string | null;
  vertical: string | null;
  vertical_confidence: VerticalConfidence | null;
  scan_status: CandidateScanStatus;
  scan_id: string | null;
  scanned_contact_id: number | null;
  pathlight_score: number | null;
  scanned_at: string | null;
  notes: string | null;
  created_at: string;
}

export async function listProspectLists(): Promise<ProspectList[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT l.*,
             COALESCE((
               SELECT COUNT(*) FROM prospect_candidates c WHERE c.list_id = l.id
             ), 0)::int AS candidate_count,
             COALESCE((
               SELECT COUNT(*) FROM prospect_candidates c
                WHERE c.list_id = l.id AND c.scan_status = 'scanned'
             ), 0)::int AS scanned_count
      FROM prospect_lists l
      WHERE l.status <> 'archived'
      ORDER BY l.created_at DESC
    `) as ProspectList[];
    return rows;
  } catch {
    return [];
  }
}

export async function getProspectList(id: number): Promise<ProspectList | null> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT *
      FROM prospect_lists
      WHERE id = ${id}
      LIMIT 1
    `) as ProspectList[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getProspectCandidates(
  listId: number
): Promise<ProspectCandidate[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT *
      FROM prospect_candidates
      WHERE list_id = ${listId}
      ORDER BY created_at DESC
    `) as ProspectCandidate[];
    return rows;
  } catch {
    return [];
  }
}

/* Normalize the curated database confidence ("single-source") to the
 * column constraint ("low") and report "none" when no match was found.
 * Used by the prospecting flow so the UI can show a quick visual cue
 * for which candidates the curated database covers vs. which would
 * fall through to web research at scan time. */
export function inferCandidateVertical(input: {
  vertical?: string | null;
  businessModel?: string | null;
}): { vertical: string | null; confidence: VerticalConfidence } {
  if (!input.vertical || input.vertical.trim().length === 0) {
    return { vertical: null, confidence: "none" };
  }
  const entry = lookupVertical(input.vertical, input.businessModel ?? undefined);
  if (!entry) {
    return { vertical: input.vertical.trim(), confidence: "none" };
  }
  const confidence: VerticalConfidence =
    entry.confidence === "high"
      ? "high"
      : entry.confidence === "medium"
        ? "medium"
        : "low";
  return { vertical: entry.name, confidence };
}
