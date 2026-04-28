/* Verifies the admin_audit_log table exists in whatever Postgres
 * POSTGRES_URL points to. Pair with --env-file=.env.local for the
 * local DB and --env-file=.env.production.local (after `vercel env
 * pull --environment=production`) for the production Neon branch.
 *
 * Usage:
 *   node --env-file=.env.local scripts/check-admin-audit-table.mjs
 *   node --env-file=.env.production.local scripts/check-admin-audit-table.mjs
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.POSTGRES_URL;
if (!url) {
  console.error("POSTGRES_URL is not set. Did you pass --env-file=...?");
  process.exit(1);
}

/* Strip credentials before printing the host so the output is safe to
 * paste into chat. */
let host = "(unknown)";
try {
  const u = new URL(url);
  host = `${u.hostname}${u.pathname}`;
} catch {
  /* leave default */
}
console.log(`Connecting to: ${host}`);

const sql = neon(url);

const rows = await sql`
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'admin_audit_log'
  ) AS exists
`;

const exists = Boolean(rows[0]?.exists);
if (exists) {
  const counts = await sql`SELECT COUNT(*)::int AS n FROM admin_audit_log`;
  console.log(`admin_audit_log: PRESENT (${counts[0]?.n ?? 0} rows)`);
  process.exit(0);
} else {
  console.log("admin_audit_log: MISSING -- run migration 010 against this DB");
  process.exit(2);
}
