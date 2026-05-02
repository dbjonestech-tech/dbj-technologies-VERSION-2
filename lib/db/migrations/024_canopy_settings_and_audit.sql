-- Migration 024: Canopy product settings, entity audit log, and feature flags.
--
-- The first migration of the Canopy v2 build (the productized CRM).
-- Pairs with lib/canopy/{settings,pathlight-gate,audit}.ts.
--
-- Three tables:
--   1. canopy_settings        - singleton (id = 1) holding the three
--                              independent Pathlight lock layers
--                              (feature toggles + monthly budget) plus
--                              white-label, timezone, and digest config.
--   2. canopy_audit_log       - entity-change audit trail. Distinct from
--                              the existing admin_audit_log (which tracks
--                              auth/access events). Every Server Action
--                              that mutates a contact, deal, activity,
--                              setting, or other Canopy entity writes one
--                              row here with before/after JSONB so the
--                              detail page can render a system log and
--                              compliance-style audits are answerable.
--   3. canopy_feature_flags   - generic key/value scope JSONB for
--                              non-Pathlight gradual rollouts.
--
-- Idempotent. Running this twice is a no-op.

CREATE TABLE IF NOT EXISTS canopy_settings (
  id                          INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  -- Layer 1: Pathlight feature toggles. Default everything OFF on
  -- install. The master kill collapses every Pathlight surface in the
  -- UI even if the per-feature toggles are on.
  pathlight_master_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
  manual_rescan_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  prospecting_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  competitive_intel_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  change_monitoring_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  attribution_beacon_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  -- Layer 3: monthly budget cap. 0 = hard off (no scans regardless of
  -- toggles). Positive = max scans per period. The period rolls when
  -- now() >= period_resets_at; the gate helper handles the reset.
  monthly_scan_budget         INTEGER NOT NULL DEFAULT 0 CHECK (monthly_scan_budget >= 0),
  scans_used_this_period      INTEGER NOT NULL DEFAULT 0 CHECK (scans_used_this_period >= 0),
  period_resets_at            TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),
  -- Lead-scoring weights (Phase 6 reads these). JSONB so weights can
  -- evolve without a migration; default mirrors the lib/canopy
  -- helper's fallback.
  lead_score_weights          JSONB NOT NULL DEFAULT '{"pathlight":30,"engagement":20,"recency":15,"touchpoints":15,"deal_value":15,"source":5}'::jsonb,
  -- White-label config (Phase 8 reads these).
  brand_logo_url              TEXT,
  brand_accent_color          TEXT,
  brand_email_from_name       TEXT,
  -- Operator-facing display defaults.
  timezone                    TEXT NOT NULL DEFAULT 'America/Chicago',
  -- Digest cadence (Phase 7 reads these).
  digest_enabled              BOOLEAN NOT NULL DEFAULT FALSE,
  digest_day_of_week          SMALLINT NOT NULL DEFAULT 1 CHECK (digest_day_of_week BETWEEN 0 AND 6),
  digest_hour_local           SMALLINT NOT NULL DEFAULT 8 CHECK (digest_hour_local BETWEEN 0 AND 23),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the singleton row on first run only.
INSERT INTO canopy_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS canopy_audit_log (
  id                BIGSERIAL    PRIMARY KEY,
  occurred_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actor_user_id     TEXT,
  actor_email       TEXT,
  entity_type       TEXT         NOT NULL,
  entity_id         TEXT         NOT NULL,
  action            TEXT         NOT NULL,
  before            JSONB,
  after             JSONB,
  ip                TEXT,
  user_agent        TEXT,
  metadata          JSONB        NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS canopy_audit_log_entity_idx
  ON canopy_audit_log (entity_type, entity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS canopy_audit_log_actor_idx
  ON canopy_audit_log (actor_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS canopy_audit_log_occurred_idx
  ON canopy_audit_log (occurred_at DESC);
CREATE INDEX IF NOT EXISTS canopy_audit_log_action_idx
  ON canopy_audit_log (action, occurred_at DESC);

CREATE TABLE IF NOT EXISTS canopy_feature_flags (
  key            TEXT PRIMARY KEY,
  enabled        BOOLEAN NOT NULL DEFAULT FALSE,
  scope          JSONB NOT NULL DEFAULT '{}'::jsonb,
  description    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
