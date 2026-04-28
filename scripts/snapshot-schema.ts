import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { getDb } from "../lib/db";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(envPath);
}

async function main() {
  const sql = getDb();
  const tables = (await sql`
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_type, table_name
  `) as { table_name: string; table_type: string }[];

  const matviews = (await sql`
    SELECT matviewname AS name
    FROM pg_matviews
    WHERE schemaname = 'public'
    ORDER BY matviewname
  `) as { name: string }[];

  console.log("=== Public schema snapshot ===");
  for (const t of tables) console.log("  " + t.table_type.padEnd(18) + " " + t.table_name);
  for (const v of matviews) console.log("  MATERIALIZED VIEW  " + v.name);
  console.log("Tables/views: " + tables.length);
  console.log("Materialized views: " + matviews.length);
}

main().catch((e) => {
  console.error("ERROR:", e instanceof Error ? e.message : e);
  process.exit(1);
});
