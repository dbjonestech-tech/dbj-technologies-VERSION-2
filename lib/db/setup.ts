import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDb } from "./index";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(envPath);
}

function splitStatements(raw: string): string[] {
  return raw
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function runFile(label: string, path: string) {
  const sql = getDb();
  const statements = splitStatements(readFileSync(path, "utf8"));
  console.log(`[${label}] running ${statements.length} statements...`);
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
}

async function main() {
  await runFile("schema", resolve(process.cwd(), "lib/db/schema.sql"));

  const migrationsDir = resolve(process.cwd(), "lib/db/migrations");
  if (existsSync(migrationsDir)) {
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of files) {
      await runFile(`migration:${file}`, resolve(migrationsDir, file));
    }
  }

  console.log("Schema applied successfully.");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
