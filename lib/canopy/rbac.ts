import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { isAdminEmail } from "@/lib/auth/allowlist";
import { ROLES, type Role, roleAtLeast } from "./rbac-types";

export {
  ROLES,
  ROLE_LABELS,
  roleAtLeast,
  type Role,
} from "./rbac-types";

export interface SessionRole {
  email: string;
  role: Role;
  /* When true, the email matched the env-based ADMIN_EMAILS allowlist
   * (the bootstrap path that runs even with a DB outage). Env admins
   * always get role='admin' regardless of DB state. */
  source: "env" | "db";
}

export async function getSessionRole(): Promise<SessionRole | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  const email = session.user.email.toLowerCase().trim();

  if (isAdminEmail(email)) {
    return { email, role: "admin", source: "env" };
  }

  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT role::text AS role
      FROM admin_users
      WHERE email = ${email} AND status = 'active'
      LIMIT 1
    `) as Array<{ role: string }>;
    const role = rows[0]?.role;
    if (role && ROLES.includes(role as Role)) {
      return { email, role: role as Role, source: "db" };
    }
  } catch {
    /* fall through */
  }
  /* Authenticated user without a matching admin_users row: treat as
   * viewer so the UI renders read-only rather than crashing. */
  return { email, role: "viewer", source: "db" };
}

export async function requireRole(required: Role): Promise<SessionRole> {
  const sr = await getSessionRole();
  if (!sr) throw new Error("not authenticated");
  if (!roleAtLeast(sr.role, required)) {
    throw new Error(`requires ${required} role; have ${sr.role}`);
  }
  return sr;
}

/* Returns the email a list query should filter ownership by. Returns
 * null when the role has no per-row scope (admin / manager / viewer
 * all see every record). Sales role returns the user's own email so
 * the query layer can apply WHERE owner_email = ${filter} or, when
 * targeting unassigned-or-mine rows, WHERE owner_email = ${filter}.
 *
 * Note: viewer is intentionally NOT scoped - it's a read-only role
 * for principals like an outside auditor or finance lead, not a
 * customer-facing role. If we add that role later, narrow this. */
export function getQueryOwnerFilter(sr: SessionRole | null): string | null {
  if (!sr) return null;
  if (sr.role === "sales") return sr.email;
  return null;
}

export async function listAdminUsers(): Promise<Array<{
  email: string;
  role: Role;
  status: "active" | "disabled";
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string;
  last_signin_at: string | null;
  created_at: string;
}>> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT email, role, status, invited_by,
             invited_at::text AS invited_at,
             accepted_at::text AS accepted_at,
             last_signin_at::text AS last_signin_at,
             created_at::text AS created_at
      FROM admin_users
      ORDER BY created_at ASC
    `) as Array<{
      email: string;
      role: Role;
      status: "active" | "disabled";
      invited_by: string | null;
      invited_at: string | null;
      accepted_at: string;
      last_signin_at: string | null;
      created_at: string;
    }>;
    return rows;
  } catch {
    return [];
  }
}
