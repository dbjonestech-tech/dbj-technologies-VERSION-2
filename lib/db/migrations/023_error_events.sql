-- Migration 023: First-party application error events.
--
-- Ported from operations-cockpit migration 007. Receives client and
-- server-side runtime errors via /api/track/error (and any future
-- server-side handler that wants to log into the same table). Each
-- event is grouped by fingerprint (sha256 of message + first stack
-- frame) so repeated errors collapse into a single row in the
-- dashboard, which makes /admin/errors usable without a paid Sentry
-- seat per Canopy install.
--
-- Coexists with the existing Sentry integration. Sentry remains the
-- DBJ-internal source of truth; error_events is the productized,
-- self-hosted equivalent that ships with every Canopy install.
--
-- Idempotent. Running this migration twice is a no-op.

CREATE TABLE IF NOT EXISTS error_events (
  id                BIGSERIAL   PRIMARY KEY,
  occurred_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fingerprint       TEXT        NOT NULL,
  source            TEXT        NOT NULL CHECK (source IN ('client', 'server', 'edge', 'cron')),
  severity          TEXT        NOT NULL CHECK (severity IN ('error', 'warning', 'info')),
  message           TEXT        NOT NULL,
  stack             TEXT,
  url               TEXT,
  user_agent        TEXT,
  visitor_id        TEXT,
  session_id        TEXT,
  release_sha       TEXT,
  detail            JSONB
);

CREATE INDEX IF NOT EXISTS error_events_occurred_idx    ON error_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS error_events_fingerprint_idx ON error_events (fingerprint, occurred_at DESC);
CREATE INDEX IF NOT EXISTS error_events_severity_idx    ON error_events (severity, occurred_at DESC);
CREATE INDEX IF NOT EXISTS error_events_source_idx      ON error_events (source, occurred_at DESC);
