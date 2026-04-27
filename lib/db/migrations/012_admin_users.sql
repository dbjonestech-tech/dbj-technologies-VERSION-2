-- DB-backed admin allowlist + invitation flow.
-- Pairs with lib/auth/users.ts (query helpers), the auth.config signIn
-- callback (consults this table on every sign-in), and /admin/users
-- (the dashboard surface where Joshy invites collaborators).
--
-- Two tables:
--
-- admin_users
--   Source of truth for who is allowed to sign in to /admin BEYOND the
--   ADMIN_EMAILS env allowlist. The env list remains the permanent
--   bootstrap fallback (so a DB outage cannot lock Joshy out of his own
--   admin shell). Rows here are added when an invitation is accepted.
--
--   role TEXT defaults to 'admin'. The CHECK constraint will expand to
--   ('admin', 'client') in the planned client portal initiative; doing
--   it now keeps the schema forward-compatible without committing to
--   client surfaces.
--
-- admin_invitations
--   Pending invite tokens. Each row carries a single-use random token,
--   the invited email, and an expiration. used_at marks consumption,
--   revoked_at marks manual cancellation, expires_at + interval check
--   gates validity. Two partial indexes keep the lookup fast for the
--   "is there an open invitation for this email" check used by signIn.

CREATE TABLE IF NOT EXISTS admin_users (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  invited_by TEXT,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_signin_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_status
  ON admin_users(status, email)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS admin_invitations (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  invited_by TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_invitations_email_open
  ON admin_invitations(email)
  WHERE used_at IS NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_invitations_created_at
  ON admin_invitations(created_at DESC);
