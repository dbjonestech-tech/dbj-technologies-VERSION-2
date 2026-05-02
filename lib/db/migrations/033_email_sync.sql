-- Phase 4: Canopy Email Integration (Gmail two-way sync via OAuth).
--
-- Three concerns:
--
--   1. oauth_tokens
--      Per-admin-user OAuth credentials for Google (provider column
--      reserved for outlook/microsoft365 later). Access and refresh
--      tokens are NEVER stored in cleartext. lib/integrations/google-
--      oauth.ts encrypts each token with AES-256-GCM keyed off the
--      OAUTH_TOKEN_ENCRYPTION_KEY env var; the DB string format is
--      'iv:authTag:ciphertext' (all hex) so each row is fully self-
--      contained and IV reuse is structurally impossible.
--      One row per (user_email, provider) pair via the UNIQUE.
--
--   2. email_messages
--      Inbound and outbound messages tied to a contact and (optionally)
--      a deal. gmail_message_id is the idempotency key for the ingest
--      cron - UNIQUE so a replay never double-writes. opened_at is an
--      array because a recipient can open the email many times and we
--      keep the full timeline; clicked_links is JSONB ({ url, ts } objs)
--      for the same reason.
--
--   3. email_templates
--      Reusable copy with merge-field placeholders ({{contact.name}},
--      {{deal.value}}, etc). Owned per-admin so different reps maintain
--      independent libraries. archived_at is a soft-delete so a template
--      that has been used in past sends keeps its referential history.

CREATE TABLE IF NOT EXISTS oauth_tokens (
  id                       BIGSERIAL    PRIMARY KEY,
  user_email               TEXT         NOT NULL REFERENCES admin_users(email) ON DELETE CASCADE,
  provider                 TEXT         NOT NULL CHECK (provider IN ('google')),
  connected_email          TEXT         NOT NULL,
  scopes                   TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  encrypted_access_token   TEXT         NOT NULL,
  encrypted_refresh_token  TEXT,
  access_token_expires_at  TIMESTAMPTZ,
  last_refreshed_at        TIMESTAMPTZ,
  last_ingest_history_id   TEXT,
  last_ingest_at           TIMESTAMPTZ,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT oauth_tokens_user_provider_uniq UNIQUE (user_email, provider)
);

CREATE INDEX IF NOT EXISTS oauth_tokens_user_idx
  ON oauth_tokens (user_email);


CREATE TABLE IF NOT EXISTS email_messages (
  id                BIGSERIAL    PRIMARY KEY,
  contact_id        BIGINT       NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id           BIGINT       REFERENCES deals(id) ON DELETE SET NULL,
  user_email        TEXT         REFERENCES admin_users(email) ON DELETE SET NULL,
  direction         TEXT         NOT NULL CHECK (direction IN ('in', 'out')),
  gmail_message_id  TEXT         UNIQUE,
  thread_id         TEXT,
  subject           TEXT,
  from_address      TEXT         NOT NULL,
  to_addresses      TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  cc_addresses      TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  body_html         TEXT,
  body_text         TEXT,
  sent_at           TIMESTAMPTZ,
  received_at       TIMESTAMPTZ,
  opened_at         TIMESTAMPTZ[] NOT NULL DEFAULT ARRAY[]::TIMESTAMPTZ[],
  clicked_links     JSONB         NOT NULL DEFAULT '[]'::jsonb,
  template_id       BIGINT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_messages_contact_idx
  ON email_messages (contact_id, COALESCE(received_at, sent_at, created_at) DESC);

CREATE INDEX IF NOT EXISTS email_messages_thread_idx
  ON email_messages (thread_id)
  WHERE thread_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS email_messages_deal_idx
  ON email_messages (deal_id, COALESCE(received_at, sent_at, created_at) DESC)
  WHERE deal_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS email_messages_user_idx
  ON email_messages (user_email, created_at DESC)
  WHERE user_email IS NOT NULL;


CREATE TABLE IF NOT EXISTS email_templates (
  id              BIGSERIAL    PRIMARY KEY,
  owner_email     TEXT         NOT NULL REFERENCES admin_users(email) ON DELETE CASCADE,
  name            TEXT         NOT NULL,
  subject         TEXT         NOT NULL,
  body_markdown   TEXT         NOT NULL,
  merge_fields    TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  archived_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_templates_owner_idx
  ON email_templates (owner_email, name)
  WHERE archived_at IS NULL;

ALTER TABLE email_messages
  DROP CONSTRAINT IF EXISTS email_messages_template_fk;

ALTER TABLE email_messages
  ADD CONSTRAINT email_messages_template_fk
  FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL;
