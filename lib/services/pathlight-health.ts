import { getDb } from "../db";

/**
 * Aggregations for the Pathlight Health section of /admin/monitor.
 * Three lenses on the same underlying data so a glance at the page
 * answers "is Pathlight healthy right now, and if not, what stage is
 * breaking and against which provider?"
 *
 * Read-only. All writes still go through track() in monitoring.ts and
 * recordAnthropicUsage / recordBrowserlessUsage etc. in api-usage.ts.
 */

/* The Pathlight pipeline stages we group failures into. Order matches
 * the runtime order so the breakdown table reads chronologically. */
export const PATHLIGHT_STAGES = [
  "screenshot",
  "audit",
  "vision",
  "remediation",
  "revenue",
  "score",
  "audio",
  "email",
] as const;

export type PathlightStage = (typeof PATHLIGHT_STAGES)[number];

/* Map a sub-error label inside scans.error_message to the stage it
 * belongs to. The pipeline writes labels like "desktop:" and "mobile:"
 * for the two screenshot calls, "audit:" for Lighthouse, and so on. */
const LABEL_TO_STAGE: Record<string, PathlightStage> = {
  desktop: "screenshot",
  mobile: "screenshot",
  audit: "audit",
  vision: "vision",
  remediation: "remediation",
  revenue: "revenue",
  score: "score",
  audio: "audio",
  email: "email",
};

export type PartialStageBreakdown = {
  stage: PathlightStage;
  count: number;
};

/* Parse the semicolon-separated error_message into individual labelled
 * sub-errors. Each entry looks like "<label>: <message>". Returns the
 * pairs in original order. */
function parseSubErrors(
  errorMessage: string,
): Array<{ label: string; message: string }> {
  return errorMessage
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((part) => {
      const idx = part.indexOf(":");
      if (idx <= 0) return { label: "unknown", message: part };
      return {
        label: part.slice(0, idx).trim().toLowerCase(),
        message: part.slice(idx + 1).trim(),
      };
    });
}

/* Pull the primary failure stage from a partial scan's error_message.
 * The pipeline emits "stage: skipped: <upstream> did not succeed" for
 * every stage downstream of the real failure, so we walk the entries
 * and return the first one that is NOT a skip. */
function primaryFailureStage(errorMessage: string | null): PathlightStage | null {
  if (!errorMessage) return null;
  const parts = parseSubErrors(errorMessage);
  for (const p of parts) {
    if (p.message.toLowerCase().startsWith("skipped:")) continue;
    const stage = LABEL_TO_STAGE[p.label];
    if (stage) return stage;
  }
  // All entries were skips (rare). Attribute to the first labelled stage.
  for (const p of parts) {
    const stage = LABEL_TO_STAGE[p.label];
    if (stage) return stage;
  }
  return null;
}

/**
 * Count partial scans grouped by the primary failure stage over the
 * given Postgres interval ("1 day", "7 days", etc.). Skipped-cascade
 * stages do not count; only the stage that actually broke.
 */
export async function getPartialStageBreakdown(
  interval: string,
): Promise<{ rows: PartialStageBreakdown[]; total: number }> {
  const sql = getDb();
  const partials = (await sql`
    SELECT error_message
    FROM scans
    WHERE status = 'partial'
      AND error_message IS NOT NULL
      AND created_at > now() - (${interval})::interval
  `) as Array<{ error_message: string | null }>;

  const counts = new Map<PathlightStage, number>();
  for (const r of partials) {
    const stage = primaryFailureStage(r.error_message);
    if (stage) counts.set(stage, (counts.get(stage) ?? 0) + 1);
  }

  const rows: PartialStageBreakdown[] = PATHLIGHT_STAGES.filter((s) =>
    counts.has(s),
  )
    .map((s) => ({ stage: s, count: counts.get(s) ?? 0 }))
    .sort((a, b) => b.count - a.count);

  return { rows, total: partials.length };
}

export type ErrorPatternRow = {
  stage: PathlightStage | "unknown";
  signature: string;
  count: number;
  sampleMessage: string;
};

/* Normalize an error message into a coarse signature so the same root
 * cause clusters even when individual instances differ in URLs, hex
 * tokens, scan IDs, durations, etc. */
function signatureFor(message: string): string {
  // Strip JSON object/array tails (long noise after the headline).
  // Avoid the /s regex flag (ES2018+); manual substring instead.
  const firstBracket = message.search(/[\[{]/);
  const head = firstBracket >= 0 ? message.slice(0, firstBracket) : message;
  return head
    // Collapse Browserless replay URLs and other URL-shaped noise.
    .replace(/https?:\/\/\S+/g, "<url>")
    // Hex tokens (Browserless replay, request_id, hashes).
    .replace(/\b[0-9a-f]{16,}\b/gi, "<hex>")
    // UUIDs.
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<uuid>")
    // Big numeric durations / sizes.
    .replace(/\b\d{4,}\b/g, "<n>")
    .trim()
    .slice(0, 120);
}

/**
 * Top error signatures across all partial scans in the window. Each
 * partial may contribute multiple sub-errors; we cluster by signature
 * and keep one sample message per cluster.
 */
export async function getTopErrorPatterns(
  interval: string,
  limit = 8,
): Promise<ErrorPatternRow[]> {
  const sql = getDb();
  const partials = (await sql`
    SELECT error_message
    FROM scans
    WHERE status IN ('partial', 'failed')
      AND error_message IS NOT NULL
      AND created_at > now() - (${interval})::interval
  `) as Array<{ error_message: string | null }>;

  type Bucket = {
    stage: PathlightStage | "unknown";
    signature: string;
    count: number;
    sampleMessage: string;
  };
  const map = new Map<string, Bucket>();

  for (const r of partials) {
    if (!r.error_message) continue;
    const parts = parseSubErrors(r.error_message);
    for (const p of parts) {
      // Skip the cascade noise; we only want primary failures.
      if (p.message.toLowerCase().startsWith("skipped:")) continue;
      const stage: PathlightStage | "unknown" =
        LABEL_TO_STAGE[p.label] ?? "unknown";
      const sig = signatureFor(p.message);
      if (!sig) continue;
      const key = `${stage}::${sig}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          stage,
          signature: sig,
          count: 1,
          sampleMessage: p.message.slice(0, 200),
        });
      }
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export type ProviderHealthRow = {
  provider: string;
  operation: string;
  total: number;
  ok: number;
  retry: number;
  fail: number;
  successPct: number;
  avgDurationMs: number | null;
};

/**
 * Per-provider, per-operation success / retry / fail breakdown sourced
 * from api_usage_events. successPct is ok / total. retry rows are calls
 * that failed but were retried successfully later in the chain by
 * callWithRetry; they are tracked separately so a noisy retry pattern
 * is visible without being lumped in with fatal failures.
 */
export async function getProviderHealth(
  interval: string,
): Promise<ProviderHealthRow[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT
      provider,
      operation,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'ok')::int AS ok,
      COUNT(*) FILTER (WHERE status = 'retry')::int AS retry,
      COUNT(*) FILTER (WHERE status = 'fail')::int AS fail,
      AVG(duration_ms)::int AS avg_duration_ms
    FROM api_usage_events
    WHERE occurred_at > now() - (${interval})::interval
    GROUP BY provider, operation
    ORDER BY provider ASC, operation ASC
  `) as Array<{
    provider: string;
    operation: string;
    total: number;
    ok: number;
    retry: number;
    fail: number;
    avg_duration_ms: number | null;
  }>;

  return rows.map((r) => ({
    provider: r.provider,
    operation: r.operation,
    total: Number(r.total),
    ok: Number(r.ok),
    retry: Number(r.retry),
    fail: Number(r.fail),
    successPct: r.total > 0 ? (Number(r.ok) / Number(r.total)) * 100 : 0,
    avgDurationMs: r.avg_duration_ms,
  }));
}

export type PartialRatePoint = {
  hourIso: string;
  requested: number;
  partial: number;
  failed: number;
};

/**
 * Hourly partial+failed rate over the last N hours. Output is one row
 * per hour from oldest to newest, including hours with zero scans
 * (zeros render as a flat line on the sparkline rather than a gap).
 */
export async function getPartialRateBuckets(
  hours = 24,
): Promise<PartialRatePoint[]> {
  const sql = getDb();
  const cleanHours = Math.max(1, Math.min(168, Math.floor(hours)));
  const rows = (await sql`
    WITH hours AS (
      SELECT generate_series(
        date_trunc('hour', now()) - (${`${cleanHours - 1} hours`})::interval,
        date_trunc('hour', now()),
        '1 hour'::interval
      ) AS hr
    )
    SELECT
      hours.hr AS hr,
      COALESCE(SUM(CASE WHEN m.event = 'scan.requested' THEN 1 ELSE 0 END), 0)::int AS requested,
      COALESCE(SUM(CASE WHEN m.event = 'scan.partial'   THEN 1 ELSE 0 END), 0)::int AS partial,
      COALESCE(SUM(CASE WHEN m.event = 'scan.failed'    THEN 1 ELSE 0 END), 0)::int AS failed
    FROM hours
    LEFT JOIN monitoring_events m
      ON date_trunc('hour', m.created_at) = hours.hr
     AND m.event IN ('scan.requested', 'scan.partial', 'scan.failed')
    GROUP BY hours.hr
    ORDER BY hours.hr ASC
  `) as Array<{
    hr: string;
    requested: number;
    partial: number;
    failed: number;
  }>;

  return rows.map((r) => ({
    hourIso: new Date(r.hr).toISOString(),
    requested: Number(r.requested),
    partial: Number(r.partial),
    failed: Number(r.failed),
  }));
}
