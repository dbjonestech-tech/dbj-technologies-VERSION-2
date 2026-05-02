import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { isAdminEmail } from "@/lib/auth/allowlist";

export type Role = "admin" | "manager" | "sales" | "viewer";

export const ROLES: readonly Role[] = ["admin", "manager", "sales", "viewer"];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  sales: "Sales",
  viewer: "Viewer",
};

/* Capability ranking: a role allows everything its position in the
 * order or higher allows. admin > manager > sales > viewer. The
 * canonical "is at least" check uses the indexes below. */
const ROLE_RANK: Record<Role, number> = {
  admin: 3,
  manager: 2,
  sales: 1,
  viewer: 0,
};

export function roleAtLeast(actual: Role, required: Role): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

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
