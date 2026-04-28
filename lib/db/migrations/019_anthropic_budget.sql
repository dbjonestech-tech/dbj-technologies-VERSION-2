-- Anthropic budget snapshots.
-- Pairs with lib/services/anthropic-budget.ts and the
-- anthropicBudgetHourly Inngest cron. Surfaces in /admin/costs as a
-- "budget headroom" banner; standalone /admin/budget page renders the
-- trend.
--
-- One table:
--
-- anthropic_budget_snapshots
--   Hourly snapshot of monthly spend, monthly cap, and rate-limit
--   utilization. The Anthropic Admin API is the source of truth;
--   we cache rows here so the dashboard does not call out to
--   Anthropic on every render and so trend lines remain available
--   even if the API is briefly unreachable.
--
-- Retention: 13 months (we may want year-over-year spend comparison).

CREATE TABLE IF NOT EXISTS anthropic_budget_snapshots (
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  monthly_spend_usd NUMERIC(12, 2),
  monthly_limit_usd NUMERIC(12, 2),
  rate_limit_rpm INTEGER,
  rate_limit_tpm BIGINT,
  current_rpm INTEGER,
  current_tpm BIGINT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (snapshot_at)
);

CREATE INDEX IF NOT EXISTS idx_anthropic_budget_snapshot
  ON anthropic_budget_snapshots(snapshot_at DESC);
