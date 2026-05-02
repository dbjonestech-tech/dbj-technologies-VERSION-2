-- Migration 026: Activities (Phase 2 of the Canopy v2 build).
--
-- A unified store for operator-driven interactions and task management:
-- notes, calls, meetings, tasks, and (in Phase 4) emails. Pairs with
-- lib/services/activities.ts, lib/services/tasks.ts, lib/actions/activities.ts.
--
-- Coexists with the existing contact_notes table; this migration does
-- NOT migrate contact_notes rows. The legacy ContactNotes component
-- continues writing to contact_notes for now; new ActivityComposer
-- writes to activities. The contact detail timeline UNIONs both
-- sources so the operator sees a unified view either way.
--
-- Type-specific shape:
--   - note     : payload.{ body }
--   - call     : payload.{ direction: 'in'|'out', duration_seconds, outcome, body }
--   - meeting  : payload.{ scheduled_at, attendees, location, body }
--   - task     : payload.{ title, body? }; due_at, priority required
--   - email    : payload.{ subject, body, from?, to?[] } (Phase 4 wires real send)
--
-- Idempotent.

CREATE TABLE IF NOT EXISTS activities (
  id              BIGSERIAL    PRIMARY KEY,
  type            TEXT         NOT NULL CHECK (type IN ('note', 'call', 'meeting', 'task', 'email')),
  contact_id      BIGINT       REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id         BIGINT       REFERENCES deals(id)    ON DELETE CASCADE,
  owner_user_id   TEXT,
  owner_email     TEXT,
  payload         JSONB        NOT NULL DEFAULT '{}'::jsonb,
  occurred_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  due_at          TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  priority        TEXT         CHECK (priority IS NULL OR priority IN ('low', 'medium', 'high', 'urgent')),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Either contact_id or deal_id must be set (an activity is always
  -- attached to at least one entity). Both can be set when an activity
  -- is for a specific deal (which carries its contact link).
  CONSTRAINT activities_attachment CHECK (contact_id IS NOT NULL OR deal_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS activities_contact_idx
  ON activities (contact_id, occurred_at DESC) WHERE contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS activities_deal_idx
  ON activities (deal_id, occurred_at DESC) WHERE deal_id IS NOT NULL;

-- Powers the "today + overdue" tasks card on the dashboard and the
-- /admin/tasks page. Only indexes open tasks (uncompleted) so the
-- index stays small and the dashboard query never scans completed rows.
CREATE INDEX IF NOT EXISTS activities_open_tasks_idx
  ON activities (owner_user_id, due_at)
  WHERE type = 'task' AND completed_at IS NULL;

-- Powers the "all open tasks across all owners" filter on /admin/tasks.
CREATE INDEX IF NOT EXISTS activities_open_tasks_global_idx
  ON activities (due_at)
  WHERE type = 'task' AND completed_at IS NULL;

-- Powers the type-filtered timeline view ("show me only calls").
CREATE INDEX IF NOT EXISTS activities_type_idx
  ON activities (type, occurred_at DESC);
