-- Funnel + cohort views over the visitor analytics tables.
-- Pairs with /admin/funnel and lib/services/funnel.ts.
--
-- Materialized views (refreshed hourly by the funnelRefreshHourly
-- Inngest cron) so the Sankey + cohort retention queries do not
-- aggregate the firehose on every page load.
--
-- funnel_daily_v
--   Daily roll-up of sessions split by source/country, with conversion
--   counts joined from the sessions.converted_* foreign keys. Backs
--   the source-level conversion table.
--
-- funnel_cohort_weekly_v
--   Weekly cohort retention: for each (start_week) cohort, how many of
--   its sessions ran a Pathlight scan in week N+0, +1, +2, etc. Used
--   to spot whether cold visitors come back and convert later.

CREATE MATERIALIZED VIEW IF NOT EXISTS funnel_daily_v AS
SELECT
  date_trunc('day', s.started_at) AS day,
  COALESCE(s.utm_source, s.referrer_host, '(direct)') AS source,
  COALESCE(s.country, 'unknown') AS country,
  COALESCE(s.device_type, 'unknown') AS device_type,
  COUNT(*)::int AS sessions,
  COUNT(*) FILTER (WHERE s.page_count = 1)::int AS bounced,
  COUNT(*) FILTER (WHERE s.converted_scan_id IS NOT NULL)::int AS scan_starts,
  COUNT(*) FILTER (WHERE s.converted_contact_id IS NOT NULL)::int AS contact_submissions,
  COUNT(*) FILTER (
    WHERE s.converted_scan_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM scans
        WHERE scans.id = s.converted_scan_id
          AND scans.status IN ('complete', 'partial')
      )
  )::int AS scans_completed
FROM sessions s
WHERE s.is_bot = false
  AND s.started_at > now() - interval '180 days'
GROUP BY 1, 2, 3, 4;

CREATE INDEX IF NOT EXISTS idx_funnel_daily_v_day ON funnel_daily_v(day);
CREATE INDEX IF NOT EXISTS idx_funnel_daily_v_source ON funnel_daily_v(source);
CREATE INDEX IF NOT EXISTS idx_funnel_daily_v_country ON funnel_daily_v(country);

CREATE MATERIALIZED VIEW IF NOT EXISTS funnel_cohort_weekly_v AS
WITH cohort AS (
  SELECT
    s.id AS session_id,
    s.visitor_id,
    date_trunc('week', s.started_at) AS cohort_week,
    s.started_at,
    s.converted_scan_id,
    s.converted_contact_id
  FROM sessions s
  WHERE s.is_bot = false
    AND s.started_at > now() - interval '12 weeks'
), follow AS (
  SELECT
    c.cohort_week,
    GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (s2.started_at - c.cohort_week)) / (7 * 24 * 3600))::int) AS week_offset,
    s2.id AS later_session_id,
    s2.converted_scan_id,
    s2.converted_contact_id
  FROM cohort c
  LEFT JOIN sessions s2
    ON s2.visitor_id = c.visitor_id
    AND s2.is_bot = false
    AND s2.started_at >= c.cohort_week
    AND s2.started_at < c.cohort_week + interval '12 weeks'
)
SELECT
  cohort_week,
  week_offset,
  COUNT(DISTINCT later_session_id)::int AS active_sessions,
  COUNT(DISTINCT later_session_id) FILTER (WHERE converted_scan_id IS NOT NULL)::int AS scan_conversions,
  COUNT(DISTINCT later_session_id) FILTER (WHERE converted_contact_id IS NOT NULL)::int AS contact_conversions
FROM follow
WHERE week_offset IS NOT NULL
GROUP BY 1, 2;

CREATE INDEX IF NOT EXISTS idx_cohort_weekly_v_week ON funnel_cohort_weekly_v(cohort_week, week_offset);
