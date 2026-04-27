/* ADMIN_EMAILS is a comma-separated list of fully-qualified email
 * addresses that are allowed to sign in to /admin. Read once at module
 * load (process.env is stable across requests in serverless), normalized
 * to lowercase, and exposed as a Set for O(1) membership checks. */

function parseAllowlist(): ReadonlySet<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0 && s.includes("@"))
  );
}

const ALLOWLIST = parseAllowlist();

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWLIST.has(email.trim().toLowerCase());
}

export function getAllowlistSize(): number {
  return ALLOWLIST.size;
}
