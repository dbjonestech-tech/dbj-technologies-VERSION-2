-- Adds the 'held' terminal status to email_events.status.
--
-- Pairs with the send-time integrity gate added to
-- sendPathlightReport / sendFollowUp in lib/services/email.ts. When
-- the AI side of a scan does not produce a real Pathlight score and
-- monthly-revenue estimate, the email is held instead of dispatched
-- so the customer never receives an "n/a/100" score or a placeholder
-- revenue line. Held events surface in /admin/monitor; Joshua manually
-- triggers a rescan via the Re-scan button.
--
-- Migrations 003 and 006 established the prior CHECK constraint
-- vocabulary; this migration is the same shape (drop and re-add).

ALTER TABLE email_events DROP CONSTRAINT IF EXISTS email_events_status_check;

ALTER TABLE email_events ADD CONSTRAINT email_events_status_check
  CHECK (status IN ('sent', 'skipped', 'failed', 'held', 'bounced', 'complained', 'delivered', 'delivery_delayed'));
