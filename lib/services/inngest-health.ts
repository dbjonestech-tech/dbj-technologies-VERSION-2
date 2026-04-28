import { getDb } from "@/lib/db";

/**
 * Inngest pipeline health service.
 *
 * Webhook ingestion via /api/webhooks/inngest is the realtime path;
 * snapshotInngestRuns runs hourly (catch-up) and computes derived
 * fields like duration_ms when both started_at and ended_at are known.
 *
 * Read APIs back the /admin/pipeline dashboard: queue depth, p95
 * duration trend, failure rate per function over rolling windows.
 */

export type InngestRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type UpsertInngestRunInput = {
  runId: string;
  functionId: string;
  scanId: string | null;
  status: InngestRunStatus;
  startedAt: number | null;
  endedAt: number | null;
  stepCount: number;
  retryCount: number;
  errorMessage: string | null;
};

export async function upsertInngestRun(
  input: UpsertInngestRunInput
): Promise<void> {
  try {
    const sql = getDb();
    const startedIso = input.startedAt ? new Date(input.startedAt).toISOString() : null;
    const endedIso = input.endedAt ? new Date(input.endedAt).toISOString() : null;
    const durationMs =
      input.startedAt && input.endedAt
        ? input.endedAt - input.startedAt
        : null;

    await sql`
      INSERT INTO inngest_runs
        (run_id, function_id, scan_id, status, started_at, ended_at, duration_ms,
         step_count, retry_count, error_message, observed_at)
      VALUES (
        ${input.runId},
        ${input.functionId},
        ${input.scanId},
        ${input.status},
        ${startedIso}::timestamptz,
        ${endedIso}::timestamptz,
        ${durationMs},
        ${input.stepCount},
        ${input.retryCount},
        ${input.errorMessage},
        now()
      )
      ON CONFLICT (run_id) DO UPDATE SET
        status = EXCLUDED.status,
        started_at = COALESCE(EXCLUDED.started_at, inngest_runs.started_at),
        ended_at = COALESCE(EXCLUDED.ended_at, inngest_runs.ended_at),
        duration_ms = COALESCE(EXCLUDED.duration_ms, inngest_runs.duration_ms),
        step_count = GREATEST(inngest_runs.step_count, EXCLUDED.step_count),
        retry_count = GREATEST(inngest_runs.retry_count, EXCLUDED.retry_count),
        error_message = COALESCE(EXCLUDED.error_message, inngest_runs.error_message),
        observed_at = now()
    `;
  } catch (err) {
    console.warn(
      `[inngest-health] upsert failed: ${err instanceof Error ? err.message : err}`
    );
  }
}

/**
 * Hourly snapshot. There is no public Inngest API to list arbitrary
 * runs, so this catch-up function has limited reach: it derives a
 * synthetic queued/running snapshot from monitoring_events that the
 * scan pipeline already emits, ensuring the dashboard has at least a
 * coarse view if the webhook is ever down.
 *
 * The richer per-step view comes from the webhook itself.
 */
export async function snapshotInngestRuns(): Promise<{ ok: boolean; observed: number }> {
  try {
    const sql = getDb();
    /* Fold monitoring_events that the scan pipeline already emits
     * (scan.requested / scan.complete / scan.failed) into a coarse
     * inngest_runs view. The webhook fills in the rest with richer
     * per-step data when it lands. */
    const rows = (await sql`
      WITH events AS (
        SELECT
          'pathlight-scan-requested' AS function_id,
          'scan-' || scan_id::text AS run_id,
          scan_id,
          MAX(created_at) FILTER (WHERE event = 'scan.requested') AS started_at,
          MAX(created_at) FILTER (WHERE event IN ('scan.complete', 'scan.partial')) AS completed_at,
          MAX(created_at) FILTER (WHERE event = 'scan.failed') AS failed_at,
          COUNT(*)::int AS step_count
        FROM monitoring_events
        WHERE created_at > now() - interval '2 hours'
          AND scan_id IS NOT NULL
          AND event IN ('scan.requested', 'scan.complete', 'scan.partial', 'scan.failed')
        GROUP BY scan_id
      )
      SELECT * FROM events
    `) as Array<{
      function_id: string;
      run_id: string;
      scan_id: string;
      started_at: string | null;
      completed_at: string | null;
      failed_at: string | null;
      step_count: number;
    }>;

    for (const row of rows) {
      const status: InngestRunStatus = row.failed_at
        ? "failed"
        : row.completed_at
        ? "completed"
        : "running";
      const endedIso = row.completed_at ?? row.failed_at ?? null;
      await upsertInngestRun({
        runId: row.run_id,
        functionId: row.function_id,
        scanId: row.scan_id,
        status,
        startedAt: row.started_at ? new Date(row.started_at).getTime() : null,
        endedAt: endedIso ? new Date(endedIso).getTime() : null,
        stepCount: Number(row.step_count),
        retryCount: 0,
        errorMessage: null,
      });
    }
    return { ok: true, observed: rows.length };
  } catch (err) {
    console.warn(
      `[inngest-health] snapshot failed: ${err instanceof Error ? err.message : err}`
    );
    return { ok: false, observed: 0 };
  }
}

/* ─────────────── Read APIs ─────────────── */

export type FunctionHealth = {
  functionId: string;
  invocations: number;
  failed: number;
  failureRatePct: number;
  p50Ms: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
  inflight: number;
};

export async function getFunctionHealth(
  intervalDays: number
): Promise<FunctionHealth[]> {
  try {
    const sql = getDb();
    const days = Math.max(1, Math.min(30, intervalDays));
    const interval = `${days} days`;
    const rows = (await sql`
      SELECT
        function_id,
        COUNT(*)::int AS invocations,
        COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
        COUNT(*) FILTER (WHERE status = 'running')::int AS inflight,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms)::int AS p50,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)::int AS p95,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms)::int AS p99
      FROM inngest_runs
      WHERE COALESCE(started_at, observed_at) > now() - (${interval})::interval
      GROUP BY function_id
      ORDER BY invocations DESC
    `) as Array<{
      function_id: string;
      invocations: number;
      failed: number;
      inflight: number;
      p50: number | null;
      p95: number | null;
      p99: number | null;
    }>;
    return rows.map((r) => {
      const inv = Number(r.invocations);
      const fail = Number(r.failed);
      return {
        functionId: r.function_id,
        invocations: inv,
        failed: fail,
        failureRatePct: inv > 0 ? Number(((fail / inv) * 100).toFixed(2)) : 0,
        p50Ms: r.p50,
        p95Ms: r.p95,
        p99Ms: r.p99,
        inflight: Number(r.inflight),
      };
    });
  } catch (err) {
    console.warn(
      `[inngest-health] getFunctionHealth failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

export type RecentInngestRun = {
  runId: string;
  functionId: string;
  scanId: string | null;
  status: InngestRunStatus;
  startedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
};

export async function getRecentInngestRuns(limit = 50): Promise<RecentInngestRun[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        run_id, function_id, scan_id::text AS scan_id, status,
        started_at, duration_ms, error_message
      FROM inngest_runs
      ORDER BY COALESCE(started_at, observed_at) DESC
      LIMIT ${Math.max(1, Math.min(200, limit))}
    `) as Array<{
      run_id: string;
      function_id: string;
      scan_id: string | null;
      status: InngestRunStatus;
      started_at: string | null;
      duration_ms: number | null;
      error_message: string | null;
    }>;
    return rows.map((r) => ({
      runId: r.run_id,
      functionId: r.function_id,
      scanId: r.scan_id,
      status: r.status,
      startedAt: r.started_at,
      durationMs: r.duration_ms,
      errorMessage: r.error_message,
    }));
  } catch (err) {
    console.warn(
      `[inngest-health] getRecentInngestRuns failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}
