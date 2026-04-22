-- Email delivery + unsubscribe migration.
-- Adds email_events (delivery log), email_unsubscribes (standalone opt-out table),
-- and an unsubscribed_at column on leads.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS email_unsubscribes (
  email TEXT PRIMARY KEY,
  unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('report_delivery', 'followup_48h', 'followup_5d', 'breakup_8d')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'skipped', 'failed')),
  resend_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_events_scan ON email_events(scan_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(email_type);
