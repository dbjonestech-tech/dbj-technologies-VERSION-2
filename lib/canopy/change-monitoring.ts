import { getDb } from "@/lib/db";

export type ChangeKind =
  | "etag"
  | "last_modified"
  | "content_hash"
  | "first_seen"
  | "error";

export interface WebsiteChangeSignal {
  id: number;
  contact_id: number | null;
  url: string;
  etag: string | null;
  last_modified: string | null;
  content_hash: string | null;
  prev_etag: string | null;
  prev_last_modified: string | null;
  prev_content_hash: string | null;
  change_kind: ChangeKind;
  status_code: number | null;
  error_message: string | null;
  acknowledged_at: string | null;
  acknowledged_by_email: string | null;
  observed_at: string;
}

export interface SignalWithContact extends WebsiteChangeSignal {
  contact_email: string | null;
  contact_name: string | null;
  contact_company: string | null;
}

/* Read the most recent signal for (contact_id, url) so the cron knows
 * what to compare against. The composite index covers the contact path;
 * url is filtered in the WHERE. */
export async function getLastSignal(
  contactId: number,
  url: string
): Promise<WebsiteChangeSignal | null> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT *
      FROM website_change_signals
      WHERE contact_id = ${contactId}
        AND url = ${url}
      ORDER BY observed_at DESC
      LIMIT 1
    `) as WebsiteChangeSignal[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export interface RecordSignalInput {
  contactId: number | null;
  url: string;
  etag: string | null;
  lastModified: string | null;
  contentHash: string | null;
  prev: WebsiteChangeSignal | null;
  changeKind: ChangeKind;
  statusCode: number | null;
  errorMessage: string | null;
}

export async function recordSignal(input: RecordSignalInput): Promise<number> {
  const sql = getDb();
  const rows = (await sql`
    INSERT INTO website_change_signals (
      contact_id, url,
      etag, last_modified, content_hash,
      prev_etag, prev_last_modified, prev_content_hash,
      change_kind, status_code, error_message
    ) VALUES (
      ${input.contactId},
      ${input.url},
      ${input.etag},
      ${input.lastModified},
      ${input.contentHash},
      ${input.prev?.etag ?? null},
      ${input.prev?.last_modified ?? null},
      ${input.prev?.content_hash ?? null},
      ${input.changeKind},
      ${input.statusCode},
      ${input.errorMessage}
    )
    RETURNING id
  `) as Array<{ id: number }>;
  return rows[0]?.id ?? 0;
}

export async function listUnacknowledgedSignals(
  limit = 50
): Promise<SignalWithContact[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT s.*,
             c.email AS contact_email,
             c.name AS contact_name,
             c.company AS contact_company
      FROM website_change_signals s
      LEFT JOIN contacts c ON c.id = s.contact_id
      WHERE s.acknowledged_at IS NULL
      ORDER BY s.observed_at DESC
      LIMIT ${limit}
    `) as SignalWithContact[];
    return rows;
  } catch {
    return [];
  }
}

export async function countUnacknowledgedSignals(): Promise<number> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT COUNT(*)::int AS n
      FROM website_change_signals
      WHERE acknowledged_at IS NULL
    `) as Array<{ n: number }>;
    return rows[0]?.n ?? 0;
  } catch {
    return 0;
  }
}

export async function acknowledgeSignal(
  signalId: number,
  byEmail: string
): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE website_change_signals
    SET acknowledged_at = NOW(),
        acknowledged_by_email = ${byEmail}
    WHERE id = ${signalId}
      AND acknowledged_at IS NULL
  `;
}

/* Contacts to monitor: every contact with an open deal whose contact
 * record carries a website. Excludes archived/closed deals so the cron
 * doesn't HEAD-request stale sites forever. */
export interface MonitorTarget {
  contact_id: number;
  url: string;
  contact_email: string;
}

export async function getMonitorTargets(): Promise<MonitorTarget[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT DISTINCT c.id::int AS contact_id,
             c.website AS url,
             c.email AS contact_email
      FROM contacts c
      JOIN deals d ON d.contact_id = c.id
      WHERE c.website IS NOT NULL
        AND TRIM(c.website) <> ''
        AND d.closed_at IS NULL
    `) as MonitorTarget[];
    return rows;
  } catch {
    return [];
  }
}
