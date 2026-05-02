-- Migration 028: Pathlight manual integrations (Phase 6 of the Canopy v2 build).
--
-- Three tables that pair with lib/canopy/pathlight-client.ts,
-- lib/canopy/lead-scoring.ts, and the new contact-detail UI:
--
--   1. pathlight_scans_log - operator-triggered rescan ledger.
--      One row per gated rescan that fired, with the resulting scan_id
--      (text) and the score delta vs. the previous scan for this
--      contact. Distinct from the existing scans table (which holds
--      the actual scan data); this table tracks WHO triggered WHAT
--      and WHY through Canopy.
--   2. ai_search_checks - manual AI search visibility log. Operator
--      pastes the engine's response after running a query like "best
--      auto shop in Richardson"; we store the raw text plus a
--      mentioned/sentiment classification.
--   3. lead_scores - point-in-time lead score snapshots with
--      component breakdown (pathlight, engagement, recency,
--      touchpoints, deal_value, source). Recomputed on relevant
--      events (scan completed, deal stage changed, new activity).
--
-- Idempotent.

CREATE TABLE IF NOT EXISTS pathlight_scans_log (
  id                       BIGSERIAL    PRIMARY KEY,
  contact_id               BIGINT       NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  scan_id                  TEXT         NOT NULL,
  previous_scan_id         TEXT,
  score                    INTEGER,
  previous_score           INTEGER,
  score_delta              INTEGER,
  triggered_by_user_id     TEXT,
  triggered_by_email       TEXT,
  triggered_reason         TEXT,
  scanned_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  completed_at             TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS pathlight_scans_log_contact_idx
  ON pathlight_scans_log (contact_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS pathlight_scans_log_scan_id_idx
  ON pathlight_scans_log (scan_id);

CREATE TABLE IF NOT EXISTS ai_search_checks (
  id                BIGSERIAL    PRIMARY KEY,
  contact_id        BIGINT       NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  engine            TEXT         NOT NULL CHECK (engine IN ('chatgpt','claude','gemini','perplexity','other')),
  query             TEXT         NOT NULL,
  result_text       TEXT,
  mentioned         BOOLEAN      NOT NULL DEFAULT FALSE,
  sentiment         TEXT         NOT NULL DEFAULT 'unknown' CHECK (sentiment IN ('positive','neutral','negative','unknown')),
  checked_by_user_id TEXT,
  checked_by_email  TEXT,
  checked_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_search_checks_contact_idx
  ON ai_search_checks (contact_id, checked_at DESC);

CREATE TABLE IF NOT EXISTS lead_scores (
  id              BIGSERIAL    PRIMARY KEY,
  contact_id      BIGINT       NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  score           INTEGER      NOT NULL CHECK (score BETWEEN 0 AND 100),
  components      JSONB        NOT NULL DEFAULT '{}'::jsonb,
  computed_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lead_scores_contact_idx
  ON lead_scores (contact_id, computed_at DESC);
