#!/usr/bin/env node
/* Apply a single SQL migration file to the Postgres pointed at by
 * POSTGRES_URL (or POSTGRES_DATABASE_URL). Idempotent because the
 * migrations themselves use IF NOT EXISTS guards.
 *
 * Usage:
 *   node --env-file=.env.local scripts/run-migration.mjs <relative-path-to-sql>
 *
 * Example:
 *   node --env-file=.env.local scripts/run-migration.mjs lib/db/migrations/010_admin_audit.sql
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node --env-file=.env.local scripts/run-migration.mjs <sql-file>");
  process.exit(1);
}

const url = process.env.POSTGRES_URL ?? process.env.POSTGRES_DATABASE_URL;
if (!url) {
  console.error("POSTGRES_URL not set. Did you pass --env-file=.env.local?");
  process.exit(1);
}

const path = resolve(process.cwd(), file);
const raw = readFileSync(path, "utf8");

/* Split on `;` outside comments. Same logic as lib/db/setup.ts. */
const statements = raw
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

const sql = neon(url);
console.log(`Running ${statements.length} statements from ${file}`);

for (const statement of statements) {
  const preview = statement.replace(/\s+/g, " ").slice(0, 80);
  try {
    await sql.query(statement);
    console.log(`  ok  ${preview}${statement.length > 80 ? "..." : ""}`);
  } catch (err) {
    console.error(`  FAIL ${preview}`);
    console.error(err);
    process.exit(1);
  }
}

console.log("Migration applied successfully.");
