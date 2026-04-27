-- In-house real-time monitoring infrastructure.
-- Pairs with lib/services/monitoring.ts (the track() helper + dashboard
-- readers), lib/services/lighthouse-monitor.ts (daily Lighthouse audits
-- per page), the new Inngest crons in lib/inngest/functions.ts
-- (lighthouseMonitorDaily, pathlightSyntheticCheck, monitoringPurgeDaily),
-- the /internal/monitor server-component dashboard, and the SSE live
-- tail at /internal/monitor/api/stream.
--
-- Two new tables:
--
-- monitoring_events
--   High-write capture of business and operational events. Generic
--   schema (event TEXT, payload JSONB) keeps the writer side trivial:
--   every track(name, payload, level?) call lands here. Reader side
--   slices by event prefix and time window. BIGSERIAL because at
--   scale (hundreds of events per scan, tens of scans per day, plus
--   webhook + chat events) the row volume outgrows UUID-keyed tables.
--
--   Retention: monitoringPurgeDaily Inngest cron drops rows older
--   than 30 days. Forensic window vs table size is a deliberate
--   trade-off; extend by editing the cron's interval if needed.
--
-- lighthouse_history
--   One row per (page, strategy) Lighthouse audit. Trended over time
--   so the dashboard can show 30-day sparklines and the regression
--   alert can compare today vs the rolling 7-day median.
--
-- New env vars referenced (set in Vercel):
--   MONITORING_LIGHTHOUSE_FLOOR  (optional, hard floor below which
--                                 any category drop becomes a Sentry
--                                 error; defaults to 90)

CREATE TABLE IF NOT EXISTS monitoring_events (
  id BIGSERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error')),
  scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_events_created_at
  ON monitoring_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_monitoring_events_event_created
  ON monitoring_events(event, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_monitoring_events_scan_id
  ON monitoring_events(scan_id) WHERE scan_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_monitoring_events_level_created
  ON monitoring_events(level, created_at DESC) WHERE level <> 'info';


CREATE TABLE IF NOT EXISTS lighthouse_history (
  id BIGSERIAL PRIMARY KEY,
  page TEXT NOT NULL,
  strategy TEXT NOT NULL CHECK (strategy IN ('mobile', 'desktop')),
  performance INTEGER,
  accessibility INTEGER,
  best_practices INTEGER,
  seo INTEGER,
  duration_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'fail')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lighthouse_history_page_strategy_created
  ON lighthouse_history(page, strategy, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lighthouse_history_created_at
  ON lighthouse_history(created_at DESC);
