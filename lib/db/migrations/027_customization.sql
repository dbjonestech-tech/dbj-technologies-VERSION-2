-- Migration 027: Customization layer (Phase 3 of the Canopy v2 build).
--
-- Three additions that make Canopy adapt to each client's vertical
-- without per-install schema changes:
--
--   1. custom_field_definitions  - operator-defined fields with a
--      kind discriminator (text / number / date / select / multi_select
--      / checkbox / url). Pairs with lib/canopy/custom-fields.ts.
--   2. contacts.custom_fields and deals.custom_fields JSONB columns -
--      the actual values keyed by definition.key.
--   3. contacts.tags and deals.tags TEXT[] columns - free-form labels.
--   4. saved_segments table - named filter configurations operators
--      can save and reload.
--
-- Idempotent. Safe to re-run.

CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id              BIGSERIAL    PRIMARY KEY,
  entity_type     TEXT         NOT NULL CHECK (entity_type IN ('contact', 'deal')),
  key             TEXT         NOT NULL,
  label           TEXT         NOT NULL,
  kind            TEXT         NOT NULL CHECK (kind IN ('text','number','date','select','multi_select','checkbox','url')),
  options         JSONB,
  display_order   INTEGER      NOT NULL DEFAULT 100,
  required        BOOLEAN      NOT NULL DEFAULT FALSE,
  description     TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, key)
);

CREATE INDEX IF NOT EXISTS custom_field_definitions_entity_idx
  ON custom_field_definitions (entity_type, display_order);

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE deals    ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE deals    ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS contacts_tags_gin ON contacts USING GIN (tags);
CREATE INDEX IF NOT EXISTS deals_tags_gin    ON deals    USING GIN (tags);

CREATE TABLE IF NOT EXISTS saved_segments (
  id              BIGSERIAL    PRIMARY KEY,
  owner_user_id   TEXT,
  owner_email     TEXT,
  entity_type     TEXT         NOT NULL CHECK (entity_type IN ('contact', 'deal')),
  name            TEXT         NOT NULL,
  filter_config   JSONB        NOT NULL DEFAULT '{}'::jsonb,
  is_shared       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS saved_segments_lookup_idx
  ON saved_segments (entity_type, owner_email, name);
