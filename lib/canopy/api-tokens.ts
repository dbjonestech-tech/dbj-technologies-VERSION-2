import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { getDb } from "@/lib/db";

/* API tokens for /api/v1/* Bearer auth.
 *
 * Wire format: tokens look like `cnpy_<24-byte-base64url>`. The
 * prefix `cnpy_` is stable so an integrator can spot-check whether a
 * leaked string is one of ours. The body is 32 bytes of CSPRNG
 * material; we hash it once with SHA-256 and store only the hash so
 * a DB compromise can't reveal active tokens.
 *
 * We also store the first 8 chars of the prefix-stripped token so
 * the UI can display a "cnpy_a1B2..." preview row for token
 * recognition without leaking the full secret. */

const TOKEN_PREFIX = "cnpy_";

export type Scope = "read" | "write";
export const SCOPES: readonly Scope[] = ["read", "write"];

export interface ApiTokenRow {
  id: number;
  user_email: string;
  name: string;
  prefix: string;
  scopes: Scope[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export function generatePlaintextToken(): { plaintext: string; hashed: string; prefix: string } {
  const raw = randomBytes(24).toString("base64url");
  const plaintext = `${TOKEN_PREFIX}${raw}`;
  const hashed = createHash("sha256").update(plaintext).digest("hex");
  const prefix = plaintext.slice(0, TOKEN_PREFIX.length + 6);
  return { plaintext, hashed, prefix };
}

export function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export async function listTokensForUser(email: string): Promise<ApiTokenRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, user_email, name, prefix, scopes,
             last_used_at::text AS last_used_at,
             expires_at::text   AS expires_at,
             created_at::text   AS created_at,
             revoked_at::text   AS revoked_at
      FROM api_tokens
      WHERE user_email = ${email}
      ORDER BY created_at DESC
    `) as ApiTokenRow[];
    return rows;
  } catch {
    return [];
  }
}

export async function listAllTokens(): Promise<ApiTokenRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, user_email, name, prefix, scopes,
             last_used_at::text AS last_used_at,
             expires_at::text   AS expires_at,
             created_at::text   AS created_at,
             revoked_at::text   AS revoked_at
      FROM api_tokens
      ORDER BY created_at DESC
    `) as ApiTokenRow[];
    return rows;
  } catch {
    return [];
  }
}

export interface VerifyTokenResult {
  ok: boolean;
  user_email?: string;
  scopes?: Scope[];
  reason?: string;
}

/* Verify an Authorization: Bearer <token> header. Returns the
 * resolved user_email + scopes on success, or a structured failure
 * reason for the API route to surface in 401 responses. Updates
 * last_used_at on success (best-effort; failures are swallowed so
 * a transient DB hiccup never blocks an authenticated request). */
export async function verifyBearer(authHeader: string | null): Promise<VerifyTokenResult> {
  if (!authHeader) return { ok: false, reason: "missing Authorization header" };
  const m = authHeader.match(/^Bearer\s+(\S+)$/i);
  if (!m) return { ok: false, reason: "header must be 'Bearer <token>'" };
  const plaintext = m[1]!;
  if (!plaintext.startsWith(TOKEN_PREFIX)) {
    return { ok: false, reason: "token prefix mismatch" };
  }
  const hashed = hashToken(plaintext);

  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, user_email, hashed_token, scopes,
             expires_at::text AS expires_at,
             revoked_at::text AS revoked_at
      FROM api_tokens
      WHERE hashed_token = ${hashed}
      LIMIT 1
    `) as Array<{
      id: number;
      user_email: string;
      hashed_token: string;
      scopes: Scope[];
      expires_at: string | null;
      revoked_at: string | null;
    }>;

    const row = rows[0];
    if (!row) return { ok: false, reason: "token not found" };

    /* Constant-time comparison even though we already matched on the
     * hash via SQL: belts and suspenders against any unforeseen
     * timing leak from the SQL driver. */
    const a = Buffer.from(row.hashed_token);
    const b = Buffer.from(hashed);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: "token hash mismatch" };
    }

    if (row.revoked_at) return { ok: false, reason: "token revoked" };
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return { ok: false, reason: "token expired" };
    }

    /* Best-effort touch. */
    try {
      await sql`UPDATE api_tokens SET last_used_at = NOW() WHERE id = ${row.id}`;
    } catch {
      /* swallow */
    }

    return { ok: true, user_email: row.user_email, scopes: row.scopes };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "verification failed",
    };
  }
}
