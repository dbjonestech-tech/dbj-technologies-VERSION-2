-- Phase 8: Multi-User Enterprise - RBAC, API tokens, webhooks.
--
-- Three concerns:
--   1. Role widening on admin_users so a single admin install can
--      grow into multi-role (admin / manager / sales / viewer).
--      CHECK was previously locked to 'admin' - this opens it.
--   2. api_tokens for the REST API at /api/v1/*. Plaintext token is
--      returned ONCE at creation; the DB only stores SHA-256 hash.
--      scopes TEXT[] gates which endpoints the token can call.
--   3. webhooks + webhook_deliveries: a webhook subscribes to
--      named events from canopy_audit_log; the dispatcher cron
--      delivers HMAC-signed POSTs and records every attempt in the
--      ledger so a flaky receiver never causes redelivery to the
--      same audit event.

ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('admin', 'manager', 'sales', 'viewer'));

CREATE TABLE IF NOT EXISTS api_tokens (
  id              BIGSERIAL    PRIMARY KEY,
  user_email      TEXT         NOT NULL REFERENCES admin_users(email) ON DELETE CASCADE,
  name            TEXT         NOT NULL,
  hashed_token    TEXT         NOT NULL UNIQUE,
  prefix          TEXT         NOT NULL,
  scopes          TEXT[]       NOT NULL DEFAULT ARRAY['read']::TEXT[],
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  revoked_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS api_tokens_user_idx
  ON api_tokens(user_email)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS webhooks (
  id                BIGSERIAL    PRIMARY KEY,
  name              TEXT         NOT NULL,
  url               TEXT         NOT NULL,
  events            TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  secret            TEXT         NOT NULL,
  enabled           BOOLEAN      NOT NULL DEFAULT FALSE,
  last_audit_log_id BIGINT       NOT NULL DEFAULT 0,
  fire_count        INT          NOT NULL DEFAULT 0,
  fail_count        INT          NOT NULL DEFAULT 0,
  created_by_email  TEXT,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS webhooks_enabled_idx
  ON webhooks(enabled)
  WHERE enabled = TRUE;

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id            BIGSERIAL    PRIMARY KEY,
  webhook_id    BIGINT       NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  audit_log_id  BIGINT       NOT NULL,
  event_name    TEXT         NOT NULL,
  status_code   INT,
  response_body TEXT,
  error_message TEXT,
  attempt       INT          NOT NULL DEFAULT 1,
  delivered_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (webhook_id, audit_log_id)
);

CREATE INDEX IF NOT EXISTS webhook_deliveries_webhook_idx
  ON webhook_deliveries(webhook_id, delivered_at DESC);
