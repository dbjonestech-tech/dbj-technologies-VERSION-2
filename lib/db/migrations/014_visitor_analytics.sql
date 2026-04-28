-- First-party visitor analytics.
-- Pairs with lib/services/analytics.ts (the recordPageView + read APIs),
-- lib/services/visitor-id.ts (cookie issuance + IP hashing), the client
-- beacons in components/analytics/*, the ingestion routes at
-- /api/track/view + /api/track/engage, and the dashboard surfaces under
-- /admin/visitors and /admin/funnel.
--
-- Why first-party when GoogleAnalytics.tsx already exists:
--   GA gives aggregates we don't own and cannot join to scans /
--   contact_submissions. First-party lets the funnel cohort views ask
--   "of N visitors from referrer X, how many ran a Pathlight scan and
--   how many submitted the contact form" in pure SQL. The privacy
--   surface is also tighter: raw IP is never persisted, only a daily-
--   salted hash and (separately) the geo derived from it.
--
-- Four tables:
--
-- visitors
--   Stable identity tied to the dbj_vid cookie (13-month rolling).
--   first_seen_at / last_seen_at give returning-visitor signals
--   without joining the firehose page_views table.
--
-- sessions
--   30-minute idle window. Stitched server-side at view-record time.
--   converted_scan_id / converted_contact_id are populated when the
--   matching scan or contact_submission lands in the same session, so
--   funnel queries are a single join against this table rather than
--   a window-function reconstruction over page_views.
--
-- page_views
--   The event firehose. BIGSERIAL because at scale (one row per route
--   change per visitor) the row volume outgrows UUID-keyed tables.
--   No raw IP is stored; ip_hash is sha256(ip || daily_salt) so the
--   same visitor's hash rotates day-over-day, preventing cross-day
--   correlation by anyone with DB access. Geo (country/region/city)
--   is read from the Vercel edge headers (x-vercel-ip-*) which makes
--   the MaxMind license dance unnecessary.
--   scan_id / contact_submission_id are NULLable references that get
--   set when the visitor's session converts.
--
-- page_view_engagement
--   1:1 with page_views, populated by the engagement beacon
--   (visibilitychange + beforeunload) which fires after the initial
--   /api/track/view. Carries dwell, max scroll percentage, and the
--   four Core Web Vitals captured from the web-vitals package on
--   real visits. This is RUM data -- what real users on real networks
--   experience -- distinct from the synthetic Lighthouse history.
--
-- Retention: page_views + page_view_engagement kept 90 days raw,
-- sessions kept 13 months, visitors kept 13 months from last_seen.
-- The monitoringPurgeDaily Inngest cron will be extended to drop old
-- rows; aggregates roll forward via funnel_daily (migration 014b).
--
-- New env vars referenced (set in Vercel):
--   ANALYTICS_IP_SALT_BASE  required, base secret combined with the
--                           current UTC date to derive the daily salt
--                           used to hash IPs

CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_count INTEGER NOT NULL DEFAULT 1,
  page_view_count INTEGER NOT NULL DEFAULT 0,
  is_bot BOOLEAN NOT NULL DEFAULT false,
  country TEXT,
  device_type TEXT,
  first_referrer_host TEXT,
  first_utm_source TEXT,
  first_utm_medium TEXT,
  first_utm_campaign TEXT
);

CREATE INDEX IF NOT EXISTS idx_visitors_last_seen
  ON visitors(last_seen_at DESC) WHERE is_bot = false;

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  page_count INTEGER NOT NULL DEFAULT 0,
  entry_path TEXT,
  exit_path TEXT,
  referrer TEXT,
  referrer_host TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  device_type TEXT,
  is_bot BOOLEAN NOT NULL DEFAULT false,
  converted_scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  converted_contact_id UUID REFERENCES contact_submissions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_visitor_started
  ON sessions(visitor_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_started
  ON sessions(started_at DESC) WHERE is_bot = false;

CREATE INDEX IF NOT EXISTS idx_sessions_referrer_host
  ON sessions(referrer_host, started_at DESC) WHERE referrer_host IS NOT NULL AND is_bot = false;

CREATE INDEX IF NOT EXISTS idx_sessions_utm_source
  ON sessions(utm_source, started_at DESC) WHERE utm_source IS NOT NULL AND is_bot = false;

CREATE INDEX IF NOT EXISTS idx_sessions_converted_scan
  ON sessions(converted_scan_id) WHERE converted_scan_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_converted_contact
  ON sessions(converted_contact_id) WHERE converted_contact_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY,
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  query TEXT,
  referrer TEXT,
  referrer_host TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  ip_hash TEXT NOT NULL,
  country TEXT,
  region TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  os_version TEXT,
  is_bot BOOLEAN NOT NULL DEFAULT false,
  bot_reason TEXT,
  viewport_w INTEGER,
  viewport_h INTEGER,
  scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  contact_submission_id UUID REFERENCES contact_submissions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created
  ON page_views(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_views_session
  ON page_views(session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_page_views_visitor_created
  ON page_views(visitor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_views_path_created
  ON page_views(path, created_at DESC) WHERE is_bot = false;

CREATE INDEX IF NOT EXISTS idx_page_views_referrer_host
  ON page_views(referrer_host, created_at DESC) WHERE referrer_host IS NOT NULL AND is_bot = false;

CREATE INDEX IF NOT EXISTS idx_page_views_country
  ON page_views(country, created_at DESC) WHERE country IS NOT NULL AND is_bot = false;

CREATE INDEX IF NOT EXISTS idx_page_views_is_bot_created
  ON page_views(is_bot, created_at DESC);

CREATE TABLE IF NOT EXISTS page_view_engagement (
  page_view_id BIGINT PRIMARY KEY REFERENCES page_views(id) ON DELETE CASCADE,
  dwell_ms INTEGER,
  max_scroll_pct INTEGER,
  cwv_lcp_ms INTEGER,
  cwv_inp_ms INTEGER,
  cwv_cls NUMERIC(7, 4),
  cwv_ttfb_ms INTEGER,
  cwv_fcp_ms INTEGER,
  exited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_engagement_exited
  ON page_view_engagement(exited_at DESC);
