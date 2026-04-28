-- Email KPI daily rollup view.
-- Pairs with lib/services/email-kpi.ts and the emailKpiRefreshHourly
-- Inngest cron. Surfaces in /admin/email.
--
-- The materialized view aggregates email_events into per-day, per-type
-- counts of each lifecycle status. Sent/delivered ratios, bounce
-- rates, and complaint rates fall out of one query against this view
-- rather than scanning the full email_events table on every render.
--
-- Refreshed hourly. Like funnel_daily_v, no UNIQUE index is required
-- because we use plain REFRESH (no CONCURRENTLY).

CREATE MATERIALIZED VIEW IF NOT EXISTS email_kpi_daily_v AS
SELECT
  date_trunc('day', sent_at) AS day,
  email_type,
  COUNT(*) FILTER (WHERE status = 'sent')::int AS sent,
  COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered,
  COUNT(*) FILTER (WHERE status = 'bounced')::int AS bounced,
  COUNT(*) FILTER (WHERE status = 'complained')::int AS complained,
  COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
  COUNT(*) FILTER (WHERE status = 'skipped')::int AS skipped,
  COUNT(*) FILTER (WHERE status = 'delivery_delayed')::int AS delayed
FROM email_events
WHERE sent_at > now() - interval '180 days'
GROUP BY 1, 2;

CREATE INDEX IF NOT EXISTS idx_email_kpi_day ON email_kpi_daily_v(day);
CREATE INDEX IF NOT EXISTS idx_email_kpi_type_day ON email_kpi_daily_v(email_type, day);
