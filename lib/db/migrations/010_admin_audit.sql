-- Admin authentication + audit trail.
-- Pairs with lib/auth/* (Auth.js v5 wiring), the /admin/* dashboard, and
-- lib/auth/audit.ts (the writeAdminAudit helper).
--
-- One table:
--
-- admin_audit_log
--   Append-only log of every admin-relevant event: sign-in attempts,
--   successes, denials (allowlist rejection or rate-limit), sign-outs,
--   and protected-page accesses. Used by /admin/audit-log to surface
--   recent activity and by lib/auth/notify.ts to detect new-device
--   sign-ins (no row in last 30 days for the same email + ip+ua hash
--   triggers an email notification).
--
--   Generic schema (event TEXT, metadata JSONB) keeps the writer side
--   trivial: every writeAdminAudit({ event, ... }) call lands here.
--
--   Retention: kept 365 days for forensic value. A future purge cron
--   can drop older rows; the tables-touch-prod doc note will mention
--   this if it ships.

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  email TEXT,
  event TEXT NOT NULL,
  result TEXT NOT NULL DEFAULT 'success' CHECK (result IN ('success', 'denied', 'error')),
  ip TEXT,
  user_agent TEXT,
  device_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at
  ON admin_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_email_event_created
  ON admin_audit_log(email, event, created_at DESC) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_event_created
  ON admin_audit_log(event, created_at DESC);

-- Partial index for new-device lookups: only successful sign-ins, keyed
-- on (email, device_hash) so the "have we seen this device before"
-- check is a single-row probe.
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_device
  ON admin_audit_log(email, device_hash, created_at DESC)
  WHERE event = 'signin.success' AND device_hash IS NOT NULL;
