import { getDb } from "../db";

/**
 * In-house monitoring event capture and read APIs.
 *
 * track() is the single write path for the monitoring_events table.
 * Pairs with the dashboard at /internal/monitor, the SSE live tail at
 * /internal/monitor/api/stream, the Inngest threshold crons in
 * lib/inngest/functions.ts, and the public /api/status JSON endpoint.
 *
 * Design intent: writes are best-effort and never throw to the caller.
 * A monitoring infrastructure that breaks the request path it observes
 * is worse than no monitoring at all. Read APIs return typed rows so
 * the dashboard server components stay terse.
 */

export type MonitoringLevel = "info" | "warn" | "error";

export type MonitoringEventRow = {
  id: string;
  event: string;
  level: MonitoringLevel;
  scan_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

type TrackOptions = {
  level?: MonitoringLevel;
  scanId?: string | null;
};

/**
 * Insert a monitoring event. Failures are swallowed (logged via
 * console.warn but never thrown) so a monitoring outage cannot
 * cascade into a request failure on the caller's hot path.
 */
export async function track(
  event: string,
  payload: Record<string, unknown> = {},
  options: TrackOptions = {}
): Promise<void> {
  const sql = getDb();
  const level = options.level ?? "info";
  const scanId = options.scanId ?? null;
  try {
    await sql`
      INSERT INTO monitoring_events (event, level, scan_id, payload)
      VALUES (${event}, ${level}, ${scanId}, ${JSON.stringify(payload)}::jsonb)
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[monitoring] track('${event}') failed: ${message}`);
  }
}

/**
 * Fetch the most recent N events. Used by the dashboard's Recent
 * Events panel and as the seed batch on SSE connect (so the live tail
 * has context before the first push arrives).
 */
export async function getRecentEvents(
  limit = 50
): Promise<MonitoringEventRow[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT id::text, event, level, scan_id::text, payload, created_at
    FROM monitoring_events
    ORDER BY id DESC
    LIMIT ${Math.max(1, Math.min(500, limit))}
  `) as MonitoringEventRow[];
  return rows;
}

/**
 * Fetch events with id strictly greater than `afterId`, oldest first.
 * Drives the SSE live tail's incremental polling.
 */
export async function getEventsAfterId(
  afterId: string,
  limit = 100
): Promise<MonitoringEventRow[]> {
  const sql = getDb();
  const cleaned = afterId.replace(/[^0-9]/g, "");
  const safe = cleaned.length > 0 ? cleaned : "0";
  const rows = (await sql`
    SELECT id::text, event, level, scan_id::text, payload, created_at
    FROM monitoring_events
    WHERE id > ${safe}::bigint
    ORDER BY id ASC
    LIMIT ${Math.max(1, Math.min(500, limit))}
  `) as MonitoringEventRow[];
  return rows;
}

export async function getMaxEventId(): Promise<string> {
  const sql = getDb();
  const rows = (await sql`SELECT COALESCE(MAX(id), 0)::text AS id FROM monitoring_events`) as { id: string }[];
  return rows[0]?.id ?? "0";
}

/**
 * Pull all events tied to a single scan, oldest first. Powers the
 * /internal/monitor/scan/[scanId] drill-down view.
 */
export async function getEventsForScan(
  scanId: string
): Promise<MonitoringEventRow[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT id::text, event, level, scan_id::text, payload, created_at
    FROM monitoring_events
    WHERE scan_id = ${scanId}::uuid
    ORDER BY id ASC
  `) as MonitoringEventRow[];
  return rows;
}

export type FunnelCounts = {
  scansRequested: number;
  scansCompleted: number;
  scansPartial: number;
  scansFailed: number;
  audioGenerated: number;
  audioFailed: number;
  emailsSent: number;
  emailsDelivered: number;
  emailsBounced: number;
  emailsComplained: number;
  chatMessages: number;
  contactsSubmitted: number;
};

/**
 * Build funnel counts for a window. Each event count is independent;
 * the dashboard renders them as a horizontal funnel so visual drop-off
 * between adjacent rows is the signal. Window is a Postgres interval
 * literal (e.g. "1 day", "7 days", "30 days").
 */
export async function getFunnelCounts(
  interval: string
): Promise<FunnelCounts> {
  const sql = getDb();
  const rows = (await sql`
    SELECT event, COUNT(*)::int AS n
    FROM monitoring_events
    WHERE created_at > now() - (${interval})::interval
    GROUP BY event
  `) as { event: string; n: number }[];

  const lookup = new Map<string, number>();
  for (const r of rows) lookup.set(r.event, Number(r.n));

  return {
    scansRequested: lookup.get("scan.requested") ?? 0,
    scansCompleted: lookup.get("scan.complete") ?? 0,
    scansPartial: lookup.get("scan.partial") ?? 0,
    scansFailed: lookup.get("scan.failed") ?? 0,
    audioGenerated: lookup.get("audio.generated") ?? 0,
    audioFailed: lookup.get("audio.failed") ?? 0,
    emailsSent: lookup.get("email.report.sent") ?? 0,
    emailsDelivered: lookup.get("email.delivered") ?? 0,
    emailsBounced: lookup.get("email.bounced") ?? 0,
    emailsComplained: lookup.get("email.complained") ?? 0,
    chatMessages: lookup.get("chat.message") ?? 0,
    contactsSubmitted: lookup.get("contact.submitted") ?? 0,
  };
}

export type LevelSummary = {
  info: number;
  warn: number;
  error: number;
};

export async function getLevelSummary(
  interval: string
): Promise<LevelSummary> {
  const sql = getDb();
  const rows = (await sql`
    SELECT level, COUNT(*)::int AS n
    FROM monitoring_events
    WHERE created_at > now() - (${interval})::interval
    GROUP BY level
  `) as { level: string; n: number }[];
  const out: LevelSummary = { info: 0, warn: 0, error: 0 };
  for (const r of rows) {
    if (r.level === "info" || r.level === "warn" || r.level === "error") {
      out[r.level] = Number(r.n);
    }
  }
  return out;
}

export type LighthouseRow = {
  id: string;
  page: string;
  strategy: "mobile" | "desktop";
  performance: number | null;
  accessibility: number | null;
  best_practices: number | null;
  seo: number | null;
  duration_ms: number | null;
  status: "ok" | "fail";
  error_message: string | null;
  created_at: string;
};

/**
 * Most recent Lighthouse row per (page, strategy). Used for the
 * "latest scores" grid on the dashboard.
 */
export async function getLatestLighthousePerPage(): Promise<LighthouseRow[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT DISTINCT ON (page, strategy)
      id::text, page, strategy, performance, accessibility, best_practices, seo,
      duration_ms, status, error_message, created_at
    FROM lighthouse_history
    ORDER BY page, strategy, created_at DESC
  `) as LighthouseRow[];
  return rows;
}

/**
 * 30-day Lighthouse history for one page+strategy. Drives the
 * sparkline trend on the dashboard.
 */
export async function getLighthouseHistory(
  page: string,
  strategy: "mobile" | "desktop",
  days = 30
): Promise<LighthouseRow[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT
      id::text, page, strategy, performance, accessibility, best_practices, seo,
      duration_ms, status, error_message, created_at
    FROM lighthouse_history
    WHERE page = ${page}
      AND strategy = ${strategy}
      AND created_at > now() - (${`${days} days`})::interval
    ORDER BY created_at ASC
  `) as LighthouseRow[];
  return rows;
}

export type CanaryStatus = {
  lastEventAt: string | null;
  lastLevel: MonitoringLevel | null;
  consecutiveFailures: number;
};

/**
 * Pull canary status from the most recent canary events. Used by the
 * dashboard's Canary section and the public /api/status endpoint.
 */
export async function getCanaryStatus(): Promise<CanaryStatus> {
  const sql = getDb();
  const rows = (await sql`
    SELECT level, created_at
    FROM monitoring_events
    WHERE event IN ('canary.ok', 'canary.fail')
    ORDER BY id DESC
    LIMIT 10
  `) as { level: MonitoringLevel; created_at: string }[];

  if (rows.length === 0) {
    return { lastEventAt: null, lastLevel: null, consecutiveFailures: 0 };
  }
  let consecutive = 0;
  for (const r of rows) {
    if (r.level === "error") consecutive += 1;
    else break;
  }
  return {
    lastEventAt: rows[0]?.created_at ?? null,
    lastLevel: rows[0]?.level ?? null,
    consecutiveFailures: consecutive,
  };
}
