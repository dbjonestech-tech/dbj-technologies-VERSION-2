-- API usage instrumentation table.
-- Pairs with lib/services/api-usage.ts and the wrapped call sites in
-- lib/services/claude-analysis.ts, lib/services/browserless.ts,
-- lib/services/pagespeed.ts, and app/(grade)/api/chat/route.ts.
--
-- One row per outbound API call attempt, including retries. Capturing
-- retries separately is the whole point: a bug that causes the retry
-- chain to fire on every scan is the cost regression most likely to
-- escape notice without this table.
--
-- scan_id is nullable on DELETE SET NULL because admin/chat usage
-- is scan-scoped today but future flows (cost-alert cron self-checks,
-- one-off internal tooling) may not be, and we never want to drop a
-- spend row just because the parent scan was purged.
--
-- cost_usd uses NUMERIC(12,6) so a single row can store up to
-- $999,999.999999 without floating-point drift. SUM() over millions
-- of rows still aggregates exactly.
--
-- New env vars referenced by the dashboard + cron (set in Vercel):
--   INTERNAL_ADMIN_PIN     (required by /internal/cost dashboard)
--   COST_DAILY_ALERT_USD   (optional, defaults to 10 USD)

CREATE TABLE IF NOT EXISTS api_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'browserless', 'pagespeed', 'resend')),
  operation TEXT NOT NULL,
  model TEXT,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  cache_write_tokens INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('ok', 'retry', 'fail')),
  attempt INTEGER NOT NULL DEFAULT 1,
  cost_usd NUMERIC(12, 6) NOT NULL DEFAULT 0,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_scan ON api_usage_events(scan_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_provider ON api_usage_events(provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_occurred_at ON api_usage_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_provider_occurred_at ON api_usage_events(provider, occurred_at DESC);
