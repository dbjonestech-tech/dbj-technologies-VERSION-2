import { getDb } from "@/lib/db";

/* DB-backed client allowlist + profile queries.
 *
 * Mirrors lib/auth/users.ts (which handles admin_users) but for the
 * `clients` table. Sign-in resolution priority is in lib/auth/access.ts;
 * once a client signs in, the events.signIn hook calls
 * acceptInvitationFor (lib/auth/users.ts) to consume any pending
 * invitation, or updateClientLastSignin to bump the timestamp on a
 * known existing client.
 */

export type ClientRow = {
  email: string;
  name: string | null;
  company: string | null;
  notes: string | null;
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string;
  last_signin_at: string | null;
  status: "active" | "archived";
  created_at: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function isClientUser(
  email: string | null | undefined
): Promise<boolean> {
  if (!email) return false;
  try {
    const sql = getDb();
    const e = normalizeEmail(email);
    const rows = (await sql`
      SELECT 1 FROM clients WHERE email = ${e} AND status = 'active' LIMIT 1
    `) as { "?column?": number }[];
    return rows.length > 0;
  } catch (err) {
    console.warn("[clients] isClientUser failed:", err);
    return false;
  }
}

export async function getClient(email: string): Promise<ClientRow | null> {
  const sql = getDb();
  const e = normalizeEmail(email);
  const rows = (await sql`
    SELECT email, name, company, notes, invited_by, invited_at, accepted_at,
           last_signin_at, status, created_at
    FROM clients
    WHERE email = ${e}
    LIMIT 1
  `) as ClientRow[];
  return rows[0] ?? null;
}

export async function listClients(): Promise<ClientRow[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT email, name, company, notes, invited_by, invited_at, accepted_at,
           last_signin_at, status, created_at
    FROM clients
    ORDER BY status ASC, accepted_at DESC
  `) as ClientRow[];
  return rows;
}

export async function updateClientLastSignin(email: string): Promise<void> {
  try {
    const sql = getDb();
    const e = normalizeEmail(email);
    await sql`
      UPDATE clients
      SET last_signin_at = now()
      WHERE email = ${e} AND status = 'active'
    `;
  } catch (err) {
    console.warn("[clients] updateClientLastSignin failed:", err);
  }
}

export async function updateClient(args: {
  email: string;
  name: string | null;
  company: string | null;
  notes: string | null;
}): Promise<void> {
  const sql = getDb();
  const e = normalizeEmail(args.email);
  await sql`
    UPDATE clients
    SET name = ${args.name},
        company = ${args.company},
        notes = ${args.notes}
    WHERE email = ${e}
  `;
}

export async function archiveClient(email: string): Promise<void> {
  const sql = getDb();
  const e = normalizeEmail(email);
  await sql`UPDATE clients SET status = 'archived' WHERE email = ${e}`;
}

export async function reactivateClient(email: string): Promise<void> {
  const sql = getDb();
  const e = normalizeEmail(email);
  await sql`UPDATE clients SET status = 'active' WHERE email = ${e}`;
}

export type ClientStats = {
  totalClients: number;
  activeClients: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
};

export async function getClientStats(): Promise<ClientStats> {
  const sql = getDb();
  const clientRows = (await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'active')::int AS active
    FROM clients
  `) as { total: number; active: number }[];
  const projectRows = (await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'active')::int AS active,
      COUNT(*) FILTER (WHERE status = 'completed')::int AS completed
    FROM client_projects
  `) as { total: number; active: number; completed: number }[];
  const c = clientRows[0] ?? { total: 0, active: 0 };
  const p = projectRows[0] ?? { total: 0, active: 0, completed: 0 };
  return {
    totalClients: Number(c.total ?? 0),
    activeClients: Number(c.active ?? 0),
    totalProjects: Number(p.total ?? 0),
    activeProjects: Number(p.active ?? 0),
    completedProjects: Number(p.completed ?? 0),
  };
}
