import { isAdminEmail } from "./allowlist";
import { isAdminUser, findValidInvitationRole } from "./users";
import { isClientUser } from "./clients";

/* Single source of truth for "who can sign in and what role do they
 * have." Called by both the signIn callback (deny if null) and the JWT
 * callback (extract role for the session token).
 *
 * Priority order, from cheapest to most expensive lookup:
 *   1. ADMIN_EMAILS env (sync set lookup; the bootstrap admin path)
 *   2. admin_users active row
 *   3. clients active row
 *   4. valid pending invitation (role from invitation row)
 *
 * Steps 2-4 are issued in parallel because they read disjoint tables.
 * In practice an email matches at most one source: the invitation flow
 * only adds to one user table per acceptance, env users skip both DB
 * tables, and admin/client emails do not overlap by design. The
 * priority above is the tiebreaker if data drift produces a duplicate. */

export type AccessRole = "admin" | "client";
export type AccessSource = "env" | "admin_user" | "client" | "invitation";

export type AccessGrant = {
  role: AccessRole;
  source: AccessSource;
};

export async function resolveAccess(
  email: string | null | undefined
): Promise<AccessGrant | null> {
  if (!email) return null;
  const e = email.toLowerCase().trim();
  if (!e) return null;

  if (isAdminEmail(e)) {
    return { role: "admin", source: "env" };
  }

  const [admin, client, invitationRole] = await Promise.all([
    isAdminUser(e),
    isClientUser(e),
    findValidInvitationRole(e),
  ]);

  if (admin) return { role: "admin", source: "admin_user" };
  if (client) return { role: "client", source: "client" };
  if (invitationRole)
    return { role: invitationRole, source: "invitation" };

  return null;
}
