-- Vercel platform telemetry: deployments + function metrics.
-- Pairs with lib/services/vercel-platform.ts, the webhook ingestion at
-- /api/webhooks/vercel, the vercelTelemetryHourly Inngest cron (catch-
-- up + metrics pull), and the /admin/platform dashboard.
--
-- Two tables:
--
-- vercel_deployments
--   One row per deploy. Webhook ingestion sets state on each lifecycle
--   event (BUILDING/READY/ERROR/CANCELED); ON CONFLICT updates so a
--   missed initial event still lands the final state. meta JSONB
--   carries branch, commit sha, author, and message for the
--   dashboard's deploy log.
--
-- vercel_function_metrics
--   Hourly per-function rollup. Sourced from the Vercel REST API by
--   the cron. Holds invocations, errors, and p50/p95/p99 latency so
--   the dashboard can spot a route that started timing out without a
--   user complaint surfacing first.
--
-- Env vars required:
--   VERCEL_API_TOKEN        token with read access to the project
--   VERCEL_PROJECT_ID       project id from the dashboard
--   VERCEL_TEAM_ID          team id (optional; omit for personal)
--   VERCEL_WEBHOOK_SECRET   shared secret for HMAC verification on
--                           webhook ingestion

CREATE TABLE IF NOT EXISTS vercel_deployments (
  id TEXT PRIMARY KEY,
  url TEXT,
  state TEXT NOT NULL,
  target TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  ready_at TIMESTAMPTZ,
  build_duration_ms INTEGER,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vercel_deployments_created
  ON vercel_deployments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vercel_deployments_state
  ON vercel_deployments(state, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vercel_deployments_target
  ON vercel_deployments(target, created_at DESC);

CREATE TABLE IF NOT EXISTS vercel_function_metrics (
  hour TIMESTAMPTZ NOT NULL,
  function_path TEXT NOT NULL,
  invocations INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  p50_ms INTEGER,
  p95_ms INTEGER,
  p99_ms INTEGER,
  PRIMARY KEY (hour, function_path)
);

CREATE INDEX IF NOT EXISTS idx_vercel_fn_metrics_hour
  ON vercel_function_metrics(hour DESC);

CREATE INDEX IF NOT EXISTS idx_vercel_fn_metrics_path_hour
  ON vercel_function_metrics(function_path, hour DESC);
