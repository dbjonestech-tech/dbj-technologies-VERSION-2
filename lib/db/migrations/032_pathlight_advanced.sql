-- Phase 9: Pathlight Advanced (gated). Six tables that pair with the
-- prospecting, change-monitoring, competitive-intel, and attribution
-- beacon services in lib/canopy/. Every Pathlight-billable surface is
-- routed through canFireScan() (Phase 0), so this migration adds no
-- triggers or constraints that fire scans automatically.
--
-- Tables:
--   1. prospect_lists           - operator-created lists of candidate sites
--   2. prospect_candidates      - per-row sites in a list, with vertical match
--                                 + scan_status; the scan only fires from an
--                                 explicit click that goes through the gate
--   3. website_change_signals   - cron-emitted signals when a tracked site's
--                                 etag/last-modified/content-hash changes;
--                                 NEVER auto-fires a scan, only surfaces
--                                 actionable items in the dashboard
--   4. competitors              - per-contact competitor URLs (max 5 per
--                                 contact enforced in app code, not schema)
--   5. attribution_events       - structured events on a deal's case study
--                                 (scan_sent, deal_won, site_launched, etc.)
--   6. attribution_beacon_data  - per-client metric pings from the embedded
--                                 beacon snippet on the post-launch site
--
-- All idempotent. NULLABLE FKs use ON DELETE SET NULL so deleting a
-- contact / deal / list doesn't cascade and obliterate history.

-- 1. Prospect lists -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS prospect_lists (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','csv','generated')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','archived')),
  created_by_user_id TEXT,
  created_by_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS prospect_lists_status_idx
  ON prospect_lists(status, created_at DESC);
CREATE INDEX IF NOT EXISTS prospect_lists_owner_idx
  ON prospect_lists(created_by_email)
  WHERE created_by_email IS NOT NULL;

-- 2. Prospect candidates ------------------------------------------------------
CREATE TABLE IF NOT EXISTS prospect_candidates (
  id BIGSERIAL PRIMARY KEY,
  list_id BIGINT NOT NULL REFERENCES prospect_lists(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  location TEXT,
  vertical TEXT,
  vertical_confidence TEXT
    CHECK (vertical_confidence IN ('high','medium','low','none') OR vertical_confidence IS NULL),
  scan_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (scan_status IN ('pending','scanning','scanned','failed','skipped')),
  scan_id TEXT,
  scanned_contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL,
  pathlight_score INTEGER CHECK (pathlight_score BETWEEN 0 AND 100 OR pathlight_score IS NULL),
  scanned_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS prospect_candidates_list_idx
  ON prospect_candidates(list_id, created_at DESC);
CREATE INDEX IF NOT EXISTS prospect_candidates_status_idx
  ON prospect_candidates(list_id, scan_status);
CREATE INDEX IF NOT EXISTS prospect_candidates_url_idx
  ON prospect_candidates(LOWER(website_url));

-- 3. Website change signals ---------------------------------------------------
CREATE TABLE IF NOT EXISTS website_change_signals (
  id BIGSERIAL PRIMARY KEY,
  contact_id BIGINT REFERENCES contacts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  etag TEXT,
  last_modified TEXT,
  content_hash TEXT,
  prev_etag TEXT,
  prev_last_modified TEXT,
  prev_content_hash TEXT,
  change_kind TEXT NOT NULL
    CHECK (change_kind IN ('etag','last_modified','content_hash','first_seen','error')),
  status_code INTEGER,
  error_message TEXT,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by_email TEXT,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS website_change_signals_contact_idx
  ON website_change_signals(contact_id, observed_at DESC)
  WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS website_change_signals_unack_idx
  ON website_change_signals(observed_at DESC)
  WHERE acknowledged_at IS NULL;

-- 4. Competitors --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS competitors (
  id BIGSERIAL PRIMARY KEY,
  contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  last_pathlight_score INTEGER CHECK (last_pathlight_score BETWEEN 0 AND 100 OR last_pathlight_score IS NULL),
  last_scan_id TEXT,
  last_scanned_at TIMESTAMPTZ,
  scan_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (scan_status IN ('pending','scanning','scanned','failed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS competitors_contact_idx
  ON competitors(contact_id, created_at);

-- 5. Attribution events -------------------------------------------------------
CREATE TABLE IF NOT EXISTS attribution_events (
  id BIGSERIAL PRIMARY KEY,
  contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id BIGINT REFERENCES deals(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN (
      'scan_sent',
      'meeting_booked',
      'proposal_sent',
      'deal_won',
      'site_launched',
      'metric_recorded',
      'milestone'
    )),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS attribution_events_deal_idx
  ON attribution_events(deal_id, recorded_at DESC)
  WHERE deal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS attribution_events_contact_idx
  ON attribution_events(contact_id, recorded_at DESC)
  WHERE contact_id IS NOT NULL;

-- 6. Attribution beacon data --------------------------------------------------
CREATE TABLE IF NOT EXISTS attribution_beacon_data (
  id BIGSERIAL PRIMARY KEY,
  contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  metric_kind TEXT NOT NULL
    CHECK (metric_kind IN (
      'pageview',
      'session_start',
      'conversion',
      'form_submit',
      'core_web_vital',
      'custom'
    )),
  value NUMERIC(14,4),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  origin TEXT,
  user_agent TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS attribution_beacon_data_contact_idx
  ON attribution_beacon_data(contact_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS attribution_beacon_data_kind_idx
  ON attribution_beacon_data(contact_id, metric_kind, recorded_at DESC);
