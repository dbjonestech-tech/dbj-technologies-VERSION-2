-- Domain + TLS + DNS authentication tracking.
-- Pairs with lib/services/infrastructure.ts and the infrastructureCheckDaily
-- Inngest cron (08:00 UTC). Surfaces in /admin/infrastructure.
--
-- One table:
--
-- infra_checks
--   Append-only history of infrastructure checks. Generic schema lets
--   the cron probe any of TLS expiry, WHOIS expiry, MX presence, SPF
--   presence, DKIM selector lookup, DMARC TXT presence -- or future
--   probe types -- without a schema migration.
--
--   resource: 'tls' | 'whois' | 'mx' | 'spf' | 'dkim' | 'dmarc'
--   target: the FQDN being checked
--   status: 'ok' | 'warn' | 'fail'
--   expires_at: cert/registration expiry (NULL for non-expiring checks)
--   details: JSONB with probe-specific findings
--
-- Retention: indefinite. The table is human-paced (1 row per
-- (target, resource) per day) so it stays small.

CREATE TABLE IF NOT EXISTS infra_checks (
  id BIGSERIAL PRIMARY KEY,
  resource TEXT NOT NULL CHECK (resource IN ('tls', 'whois', 'mx', 'spf', 'dkim', 'dmarc')),
  target TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ok', 'warn', 'fail')),
  expires_at TIMESTAMPTZ,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_infra_checks_target_resource_checked
  ON infra_checks(target, resource, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_infra_checks_status_checked
  ON infra_checks(status, checked_at DESC);
