-- Migration 025: Deals (the architectural pivot from contact-stage to deal-stage CRM).
--
-- Pairs with lib/services/deals.ts (reads) and lib/actions/deals.ts
-- (writes as Server Actions). Backfills one deal per existing contact
-- mirroring the contact's current status so the new /admin/deals
-- kanban hydrates with real data on first load.
--
-- The existing contacts.status column is preserved as a denormalized
-- "primary deal stage". The existing /admin/relationships/pipeline
-- (contact-stage kanban) keeps working; a banner on that page directs
-- operators to /admin/deals as the new primary deal board. Server
-- Actions that change a deal's stage also update contacts.status when
-- the deal is the contact's most recently-updated open deal, keeping
-- the legacy UX consistent without forcing a hard cutover.
--
-- Idempotent. Backfill skips any contact already having a deal.

CREATE TABLE IF NOT EXISTS deals (
  id                BIGSERIAL PRIMARY KEY,
  name              TEXT NOT NULL,
  contact_id        BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  owner_user_id     TEXT,
  owner_email       TEXT,
  value_cents       BIGINT NOT NULL DEFAULT 0 CHECK (value_cents >= 0),
  currency          TEXT NOT NULL DEFAULT 'USD',
  stage             TEXT NOT NULL CHECK (stage IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  probability_pct   INTEGER NOT NULL DEFAULT 10 CHECK (probability_pct BETWEEN 0 AND 100),
  expected_close_at DATE,
  closed_at         TIMESTAMPTZ,
  won               BOOLEAN,
  loss_reason       TEXT,
  source            TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS deals_contact_idx       ON deals (contact_id);
CREATE INDEX IF NOT EXISTS deals_stage_idx         ON deals (stage, expected_close_at);
CREATE INDEX IF NOT EXISTS deals_owner_idx         ON deals (owner_user_id, stage);
CREATE INDEX IF NOT EXISTS deals_closed_idx        ON deals (closed_at) WHERE closed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS deals_open_per_contact  ON deals (contact_id, updated_at DESC) WHERE closed_at IS NULL;

-- Backfill: one deal per contact, mirroring the contact's current status.
-- COALESCE picks the most informative non-empty name available.
-- Won contacts become won deals (probability 100, won=true); lost contacts
-- become lost deals with a placeholder reason recorded.
INSERT INTO deals (
  name, contact_id, stage, probability_pct, value_cents, currency,
  won, closed_at, loss_reason, source, created_at, updated_at, notes
)
SELECT
  COALESCE(NULLIF(c.company, ''), NULLIF(c.name, ''), c.email),
  c.id,
  c.status,
  CASE c.status
    WHEN 'new'       THEN 10
    WHEN 'contacted' THEN 25
    WHEN 'qualified' THEN 50
    WHEN 'proposal'  THEN 70
    WHEN 'won'       THEN 100
    WHEN 'lost'      THEN 0
  END,
  0,
  'USD',
  CASE c.status WHEN 'won' THEN TRUE WHEN 'lost' THEN FALSE ELSE NULL END,
  CASE WHEN c.status IN ('won', 'lost') THEN c.updated_at ELSE NULL END,
  CASE WHEN c.status = 'lost' THEN 'Backfilled (no original reason recorded)' ELSE NULL END,
  c.source,
  c.created_at,
  c.updated_at,
  'Backfilled from contact status during migration 025.'
FROM contacts c
WHERE NOT EXISTS (SELECT 1 FROM deals d WHERE d.contact_id = c.id);
