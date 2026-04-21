import { neon } from "@neondatabase/serverless";

export function getDb() {
  const url = process.env.POSTGRES_URL ?? process.env.POSTGRES_DATABASE_URL;
  if (!url) {
    throw new Error(
      "Database URL not set: define POSTGRES_URL (or POSTGRES_DATABASE_URL)."
    );
  }
  return neon(url);
}
