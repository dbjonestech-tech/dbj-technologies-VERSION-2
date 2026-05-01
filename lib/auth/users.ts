import { getDb } from "@/lib/db";

/* DB-backed admin allowlist + invitation queries.
 *
 * The env-based ADMIN_EMAILS allowlist (lib/auth/allowlist.ts) remains
 * the bootstrap path so a DB outage cannot lock the original admin
 * out. This module layers a second source: rows in admin_users.
 *
 * The signIn callback in auth.config.ts permits a session if any of:
 *   1. email is in ADMIN_EMAILS env (synchronous Set lookup)
 *   2. email matches an active row in admin_users
 *   3. email has a valid pending row in admin_invitations
 *
 * Case 3 is the invitation-acceptance path. The auth.ts events.signIn
 * hook detects it post-authentication and consumes the invitation
 * (writes admin_users row, marks the invitation used).
 */

export type AdminUserRow = {
  email: string;
  role: "admin";
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string;
  last_signin_at: string | null;
  status: "active" | "disabled";
  created_at: string;
};

export type AdminInvitationRow = {
  token: string;
  email: string;
  invited_by: string;
  role: "admin" | "client";
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

const INVITE_VALID_DAYS = 7;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function isAdminUser(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  try {
    const sql = getDb();
    const e = normalizeEmail(email);
    const rows = (await sql`
      SELECT 1 FROM admin_users WHERE email = ${e} AND status = 'active' LIMIT 1
    `) as { "?column?": number }[];
    return rows.length > 0;
  } catch (err) {
    console.warn("[admin-users] isAdminUser failed:", err);
    return false;
  }
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT email, role, invited_by, invited_at, accepted_at, last_signin_at,
           status, created_at
    FROM admin_users
    ORDER BY accepted_at DESC
  `) as AdminUserRow[];
  return rows;
}

export async function getAdminUser(
  email: string
): Promise<AdminUserRow | null> {
  const sql = getDb();
  const e = normalizeEmail(email);
  const rows = (await sql`
    SELECT email, role, invited_by, invited_at, accepted_at, last_signin_at,
           status, created_at
    FROM admin_users
    WHERE email = ${e}
    LIMIT 1
  `) as AdminUserRow[];
  return rows[0] ?? null;
}

export async function updateLastSignin(email: string): Promise<void> {
  try {
    const sql = getDb();
    const e = normalizeEmail(email);
    await sql`
      UPDATE admin_users
      SET last_signin_at = now()
      WHERE email = ${e} AND status = 'active'
    `;
  } catch (err) {
    console.warn("[admin-users] updateLastSignin failed:", err);
  }
}

export async function disableAdminUser(email: string): Promise<void> {
  const sql = getDb();
  const e = normalizeEmail(email);
  await sql`UPDATE admin_users SET status = 'disabled' WHERE email = ${e}`;
}

export async function reactivateAdminUser(email: string): Promise<void> {
  const sql = getDb();
  const e = normalizeEmail(email);
  await sql`UPDATE admin_users SET status = 'active' WHERE email = ${e}`;
}

/* Invitation API */

export async function createInvitation(args: {
  email: string;
  invitedBy: string;
  role?: "admin" | "client";
}): Promise<AdminInvitationRow> {
  const sql = getDb();
  const e = normalizeEmail(args.email);
  const inviter = normalizeEmail(args.invitedBy);
  const role = args.role ?? "admin";
  const token = crypto.randomUUID();
  /* Postgres interval arithmetic via a literal string, since interval
   * cannot be parameterized directly. Day count is a hard-coded const,
   * never user input, so the interpolation is safe. */
  const rows = (await sql`
    INSERT INTO admin_invitations (token, email, invited_by, role, expires_at)
    VALUES (
      ${token},
      ${e},
      ${inviter},
      ${role},
      now() + (${`${INVITE_VALID_DAYS} days`})::interval
    )
    RETURNING token, email, invited_by, role, expires_at, used_at, revoked_at, created_at
  `) as AdminInvitationRow[];
  if (!rows[0]) throw new Error("invitation insert returned no row");
  return rows[0];
}

export async function getInvitationByToken(
  token: string
): Promise<AdminInvitationRow | null> {
  if (!token) return null;
  const sql = getDb();
  const rows = (await sql`
    SELECT token, email, invited_by, role, expires_at, used_at, revoked_at, created_at
    FROM admin_invitations
    WHERE token = ${token}
    LIMIT 1
  `) as AdminInvitationRow[];
  return rows[0] ?? null;
}

/* True when the email has at least one open invitation (any role) that
 * has not expired, been used, or been revoked. Called by the signIn
 * callback to permit Google OAuth completion for invited users. */
export async function hasValidInvitationFor(
  email: string | null | undefined
): Promise<boolean> {
  return (await findValidInvitationRole(email)) !== null;
}

/* Returns the role of the most recent valid invitation for this email,
 * or null if none exists. Used by the JWT callback to set token.role
 * for first-time-invited users at sign-in time. */
export async function findValidInvitationRole(
  email: string | null | undefined
): Promise<"admin" | "client" | null> {
  if (!email) return null;
  try {
    const sql = getDb();
    const e = normalizeEmail(email);
    const rows = (await sql`
      SELECT role
      FROM admin_invitations
      WHERE email = ${e}
        AND used_at IS NULL
        AND revoked_at IS NULL
        AND expires_at > now()
      ORDER BY created_at DESC
      LIMIT 1
    `) as { role: "admin" | "client" }[];
    return rows[0]?.role ?? null;
  } catch (err) {
    console.warn("[admin-users] findValidInvitationRole failed:", err);
    return null;
  }
}

/* Invitation acceptance: consume the most recent valid invitation for
 * this email and upsert the corresponding row in admin_users OR clients
 * based on the invitation's role. Single CTE so consume + upsert
 * succeed or fail together. Returns the role consumed, or null on
 * miss. */
export async function acceptInvitationFor(
  email: string
): Promise<"admin" | "client" | null> {
  try {
    const sql = getDb();
    const e = normalizeEmail(email);
    /* Two CTE branches via UNION ALL after consuming. Only one of
     * upserted_admin / upserted_client populates per call because the
     * consumed row carries a single role. */
    const rows = (await sql`
      WITH consumed AS (
        UPDATE admin_invitations
        SET used_at = now()
        WHERE token = (
          SELECT token
          FROM admin_invitations
          WHERE email = ${e}
            AND used_at IS NULL
            AND revoked_at IS NULL
            AND expires_at > now()
          ORDER BY created_at DESC
          LIMIT 1
        )
        RETURNING email, invited_by, role, created_at
      ),
      upserted_admin AS (
        INSERT INTO admin_users (email, invited_by, invited_at, accepted_at, last_signin_at, status)
        SELECT email, invited_by, created_at, now(), now(), 'active'
        FROM consumed WHERE role = 'admin'
        ON CONFLICT (email) DO UPDATE
          SET status = 'active',
              last_signin_at = now(),
              accepted_at = COALESCE(admin_users.accepted_at, EXCLUDED.accepted_at)
        RETURNING 'admin'::text AS role
      ),
      upserted_client AS (
        INSERT INTO clients (email, invited_by, invited_at, accepted_at, last_signin_at, status)
        SELECT email, invited_by, created_at, now(), now(), 'active'
        FROM consumed WHERE role = 'client'
        ON CONFLICT (email) DO UPDATE
          SET status = 'active',
              last_signin_at = now(),
              accepted_at = COALESCE(clients.accepted_at, EXCLUDED.accepted_at)
        RETURNING 'client'::text AS role
      )
      SELECT role FROM upserted_admin
      UNION ALL
      SELECT role FROM upserted_client
    `) as { role: string }[];
    const r = rows[0]?.role;
    if (r === "admin" || r === "client") {
      /* Client invitation accepted: ensure a CRM contact exists with
       * the terminal status (won) and source (client_import). Best-
       * effort: a failure here MUST NOT block sign-in. */
      if (r === "client") {
        try {
          const detail = (await sql`
            SELECT email, name, company FROM clients WHERE email = ${e} LIMIT 1
          `) as { email: string; name: string | null; company: string | null }[];
          const c = detail[0];
          if (c) {
            const { upsertContactFromClient } = await import(
              "@/lib/services/contacts"
            );
            await upsertContactFromClient({
              email: c.email,
              name: c.name,
              company: c.company,
            });
          }
        } catch (err) {
          console.warn(
            `[admin-users] client contact upsert failed: ${err instanceof Error ? err.message : err}`
          );
        }
      }
      return r;
    }
    return null;
  } catch (err) {
    console.warn("[admin-users] acceptInvitationFor failed:", err);
    return null;
  }
}

export async function listInvitations(args?: {
  includeUsed?: boolean;
  includeRevoked?: boolean;
}): Promise<AdminInvitationRow[]> {
  const sql = getDb();
  const includeUsed = args?.includeUsed ?? true;
  const includeRevoked = args?.includeRevoked ?? true;
  const rows = (await sql`
    SELECT token, email, invited_by, expires_at, used_at, revoked_at, created_at
    FROM admin_invitations
    WHERE
      (${includeUsed} OR used_at IS NULL)
      AND (${includeRevoked} OR revoked_at IS NULL)
    ORDER BY created_at DESC
    LIMIT 200
  `) as AdminInvitationRow[];
  return rows;
}

export async function revokeInvitation(token: string): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE admin_invitations
    SET revoked_at = now()
    WHERE token = ${token} AND used_at IS NULL AND revoked_at IS NULL
  `;
}

export type InvitationState = "valid" | "expired" | "used" | "revoked" | "missing";

export function classifyInvitation(row: AdminInvitationRow | null): InvitationState {
  if (!row) return "missing";
  if (row.revoked_at) return "revoked";
  if (row.used_at) return "used";
  if (new Date(row.expires_at).getTime() < Date.now()) return "expired";
  return "valid";
}
