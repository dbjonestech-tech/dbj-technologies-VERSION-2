-- Inngest pipeline run history.
-- Pairs with lib/services/inngest-health.ts and the dashboard at
-- /admin/pipeline. Two write paths:
--   1. /api/webhooks/inngest receives realtime lifecycle events and
--      upserts each one.
--   2. inngestHealthHourly cron back-fills anything missed.
--
-- One table:
--
-- inngest_runs
--   One row per function run (not per step). function_id is the
--   Inngest createFunction id (stable across deploys), scan_id ties
--   the run back to a Pathlight scan when applicable, status tracks
--   the run lifecycle, and step_count + retry_count are populated
--   by the webhook payload as steps complete.
--
-- Retention: kept 30 days; the monitoringPurgeDaily cron will be
-- extended to drop older rows once the table grows.

CREATE TABLE IF NOT EXISTS inngest_runs (
  run_id TEXT PRIMARY KEY,
  function_id TEXT NOT NULL,
  scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_ms INTEGER,
  step_count INTEGER NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inngest_runs_function_started
  ON inngest_runs(function_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_inngest_runs_status
  ON inngest_runs(status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_inngest_runs_started
  ON inngest_runs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_inngest_runs_scan
  ON inngest_runs(scan_id) WHERE scan_id IS NOT NULL;
