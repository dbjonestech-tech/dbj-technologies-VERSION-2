-- Google Search Console daily import.
-- Pairs with lib/services/search-console.ts and the searchConsoleDaily
-- Inngest cron (06:00 UTC). Surfaces in /admin/search.
--
-- One table:
--
-- search_console_daily
--   One row per (date, page, query, country, device). Page count grows
--   slowly (a few thousand rows per month at our traffic level). The
--   composite PK doubles as the dedupe key for ON CONFLICT updates,
--   so the cron can re-import recent days as GSC's late-arriving data
--   stabilizes.
--
-- Retention: 16 months (GSC's own retention horizon).

CREATE TABLE IF NOT EXISTS search_console_daily (
  date DATE NOT NULL,
  page TEXT NOT NULL,
  query TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'unknown',
  device TEXT NOT NULL DEFAULT 'unknown',
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC(7, 4),
  position NUMERIC(7, 2),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (date, page, query, country, device)
);

CREATE INDEX IF NOT EXISTS idx_gsc_date
  ON search_console_daily(date DESC);

CREATE INDEX IF NOT EXISTS idx_gsc_page_date
  ON search_console_daily(page, date DESC);

CREATE INDEX IF NOT EXISTS idx_gsc_query_date
  ON search_console_daily(query, date DESC);

CREATE INDEX IF NOT EXISTS idx_gsc_clicks_date
  ON search_console_daily(date DESC, clicks DESC);
