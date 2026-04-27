-- Email webhook event support.
-- Pairs with app/(grade)/api/webhooks/resend/route.ts and the
-- handleResendWebhookEvent + markRecipientUnsubscribed +
-- checkBounceRateAlert helpers in lib/services/email.ts.
--
-- Extends the email_events.status enum with the four webhook-driven
-- terminal states (Resend's email.delivered / email.delivery_delayed /
-- email.bounced / email.complained). Existing rows with status
-- 'sent' / 'skipped' / 'failed' are unaffected.
--
-- Adds a partial unique index on (resend_id, status) so we can ingest
-- webhook events idempotently. Svix may deliver the same event more
-- than once on transient network failures or our own 5xx responses,
-- and the same email_id may legitimately progress through several
-- statuses (sent -> delivered, sent -> bounced) so the index is on the
-- pair, not on resend_id alone.
--
-- The partial WHERE clause keeps NULL resend_ids out of the index
-- (skipped / failed sends never receive a Resend ID and their
-- email_events row is uniqueness-irrelevant).
--
-- New env var required by this migration: RESEND_WEBHOOK_SECRET.
-- Set it in Vercel (the value comes from the Resend dashboard's
-- webhook configuration page after registering /api/webhooks/resend
-- as the destination URL).

ALTER TABLE email_events DROP CONSTRAINT IF EXISTS email_events_status_check;

ALTER TABLE email_events ADD CONSTRAINT email_events_status_check
  CHECK (status IN ('sent', 'skipped', 'failed', 'bounced', 'complained', 'delivered', 'delivery_delayed'));

CREATE UNIQUE INDEX IF NOT EXISTS uniq_email_event_resend_id_status
  ON email_events (resend_id, status)
  WHERE resend_id IS NOT NULL;
