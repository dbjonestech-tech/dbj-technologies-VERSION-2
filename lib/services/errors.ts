import { getDb } from "@/lib/db";

export interface ErrorHeadline {
  errors_24h: number;
  errors_prev_24h: number;
  unique_24h: number;
  errors_7d: number;
  affected_users_24h: number;
  releases_with_errors_7d: number;
}

export interface ErrorBucketRow {
  bucket: Date;
  n: number;
}

export interface ErrorGroupRow {
  fingerprint: string;
  message: string;
  severity: string;
  source: string;
  events: number;
  users: number;
  first_at: Date;
  last_at: Date;
}

export interface ErrorSourceRow {
  source: string;
  events: number;
}

export async function loadErrorHeadline(): Promise<ErrorHeadline> {
  const sql = getDb();
  const rows = (await sql`
    SELECT
      (SELECT COUNT(*)::int FROM error_events WHERE occurred_at > NOW() - INTERVAL '24 hours')                                              AS errors_24h,
      (SELECT COUNT(*)::int FROM error_events WHERE occurred_at BETWEEN NOW() - INTERVAL '48 hours' AND NOW() - INTERVAL '24 hours')        AS errors_prev_24h,
      (SELECT COUNT(DISTINCT fingerprint)::int FROM error_events WHERE occurred_at > NOW() - INTERVAL '24 hours')                           AS unique_24h,
      (SELECT COUNT(*)::int FROM error_events WHERE occurred_at > NOW() - INTERVAL '7 days')                                                AS errors_7d,
      (SELECT COUNT(DISTINCT visitor_id)::int FROM error_events WHERE occurred_at > NOW() - INTERVAL '24 hours' AND visitor_id IS NOT NULL) AS affected_users_24h,
      (SELECT COUNT(DISTINCT release_sha)::int FROM error_events WHERE occurred_at > NOW() - INTERVAL '7 days' AND release_sha IS NOT NULL) AS releases_with_errors_7d
  `) as ErrorHeadline[];
  return rows[0];
}

export async function loadErrorHourlyBuckets(): Promise<number[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT date_trunc('hour', occurred_at) AS bucket, COUNT(*)::int AS n
    FROM error_events
    WHERE occurred_at > NOW() - INTERVAL '24 hours'
    GROUP BY 1 ORDER BY 1
  `) as ErrorBucketRow[];
  return bucketizeHourly(rows, 24);
}

export async function loadTopErrorGroups(limit = 12): Promise<ErrorGroupRow[]> {
  const sql = getDb();
  return (await sql`
    SELECT
      fingerprint,
      MAX(message)                              AS message,
      MAX(severity)                             AS severity,
      MAX(source)                               AS source,
      COUNT(*)::int                             AS events,
      COUNT(DISTINCT visitor_id)::int           AS users,
      MIN(occurred_at)                          AS first_at,
      MAX(occurred_at)                          AS last_at
    FROM error_events
    WHERE occurred_at > NOW() - INTERVAL '7 days'
    GROUP BY fingerprint
    ORDER BY events DESC
    LIMIT ${limit}
  `) as ErrorGroupRow[];
}

export async function loadErrorsBySource(): Promise<ErrorSourceRow[]> {
  const sql = getDb();
  return (await sql`
    SELECT source, COUNT(*)::int AS events
    FROM error_events
    WHERE occurred_at > NOW() - INTERVAL '7 days'
    GROUP BY source ORDER BY events DESC
  `) as ErrorSourceRow[];
}

function bucketizeHourly(rows: ErrorBucketRow[], hours: number): number[] {
  const result = new Array<number>(hours).fill(0);
  const now = Date.now();
  const cutoff = now - hours * 3600_000;
  for (const r of rows) {
    const t = new Date(r.bucket).getTime();
    if (t < cutoff) continue;
    const idx = Math.floor((t - cutoff) / 3600_000);
    if (idx >= 0 && idx < hours) result[idx] = r.n;
  }
  return result;
}

export function relativeTime(d: Date | string | null): string {
  if (!d) return "-";
  const ms = Date.now() - new Date(d).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}
