-- Contacts CRM (Phase 2 of the visitors-page-upgrade build).
--
-- Lightweight relationship-management layer on top of the existing
-- leads / contact_submissions / clients / email_events / scans data.
-- Contacts are unified by email address. There is intentionally no
-- visitor_id column: anonymous visitors stay on /admin/visitors.
-- A contact is created only when there is an email to follow up to.
--
-- Pairs with lib/services/contacts.ts (read APIs) and
-- lib/actions/contacts.ts (mutations as Server Actions). Surfaces at
-- /admin/contacts, /admin/contacts/[id], /admin/pipeline, plus a
-- Relationships card on the /admin dashboard.
--
-- Idempotent. Running this migration twice is a no-op.

CREATE TABLE IF NOT EXISTS contacts (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  phone TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  follow_up_date DATE,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('pathlight_scan', 'contact_form', 'manual', 'client_import')),
  -- Most recent Pathlight scan id for this contact (text because
  -- scans.id is a UUID rendered to text at upsert time). Nullable
  -- because manual contacts and contact-form-only contacts have no
  -- scan. Not a foreign key on scans(id) because scans can be
  -- purged/expired without orphaning the contact record.
  pathlight_scan_id TEXT,
  -- Denormalized count of contact_notes rows for this contact. Saves
  -- a JOIN in the list view.
  notes_count INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Status filter on the list view + Pipeline kanban column counts.
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);

-- Sidebar overdue badge + list-view "overdue" filter chip. Partial
-- index so only rows with a follow-up scheduled appear; the index is
-- small even at scale.
CREATE INDEX IF NOT EXISTS idx_contacts_follow_up
  ON contacts(follow_up_date)
  WHERE follow_up_date IS NOT NULL;

-- Note: no separate idx_contacts_email is created. The UNIQUE NOT NULL
-- constraint on the email column already creates a unique B-tree index
-- that the search/upsert paths use.

CREATE TABLE IF NOT EXISTS contact_notes (
  id BIGSERIAL PRIMARY KEY,
  contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  -- Three classes:
  --   note          - manually authored by an admin, deletable
  --   status_change - auto-inserted by updateContact when status moves
  --   system        - reserved for any future pipeline-side automation
  note_type TEXT NOT NULL DEFAULT 'note'
    CHECK (note_type IN ('note', 'status_change', 'system')),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_notes_contact
  ON contact_notes(contact_id);
