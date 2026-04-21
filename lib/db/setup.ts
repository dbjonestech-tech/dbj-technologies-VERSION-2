import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDb } from "./index";

async function main() {
  const sql = getDb();
  const schemaPath = resolve(process.cwd(), "lib/db/schema.sql");
  const schema = readFileSync(schemaPath, "utf8");

  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`Running ${statements.length} statements against Postgres...`);

  for (const statement of statements) {
    try {
      await sql.query(statement);
      const preview = statement.replace(/\s+/g, " ").slice(0, 80);
      console.log(`  ok  ${preview}${statement.length > 80 ? "..." : ""}`);
    } catch (err) {
      console.error("  FAIL", statement);
      console.error(err);
      process.exit(1);
    }
  }

  console.log("Schema applied successfully.");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
