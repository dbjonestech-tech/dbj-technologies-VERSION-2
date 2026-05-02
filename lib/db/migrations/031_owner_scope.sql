-- Phase 8 follow-up: contact ownership for sales-role query scoping.
--
-- deals + activities already have owner_email + owner_user_id from
-- their Phase 1 / Phase 2 migrations. contacts didn't, so a sales
-- role had no per-row scope to filter against. This adds the column
-- and an index keyed on owned-only rows (NULL excluded) so the
-- partial index stays small even as the contacts table grows.
--
-- Existing rows get NULL owner_email which means "unassigned"; the
-- query layer treats unassigned as invisible to sales role, but
-- visible to admin / manager / viewer. To bring legacy contacts into
-- a sales user's view, an admin reassigns them via /admin/contacts/[id]
-- (UI for that ships with Phase 9 alongside the prospecting flow).

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS owner_email TEXT;

CREATE INDEX IF NOT EXISTS contacts_owner_idx
  ON contacts(owner_email)
  WHERE owner_email IS NOT NULL;
