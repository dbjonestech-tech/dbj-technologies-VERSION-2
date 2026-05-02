"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { recordChange } from "@/lib/canopy/audit";
import { requireRole } from "@/lib/canopy/rbac";
import {
  generatePlaintextToken,
  type Scope,
  SCOPES,
} from "@/lib/canopy/api-tokens";

export type TokenActionResult =
  | { ok: true; id: number; plaintext?: string; prefix?: string }
  | { ok: false; error: string };

export async function createApiTokenAction(input: {
  name: string;
  scopes: Scope[];
  expires_at?: string | null;
}): Promise<TokenActionResult> {
  const me = await requireRole("admin");
  const name = input.name.trim();
  if (!name) return { ok: false, error: "name required" };
  const scopes = (input.scopes ?? []).filter((s) => SCOPES.includes(s));
  if (scopes.length === 0) return { ok: false, error: "at least one scope required" };

  try {
    const sql = getDb();
    /* The current user must exist in admin_users to own a token.
     * Env-only admins (ADMIN_EMAILS) need a row to satisfy the FK -
     * upsert one as needed. */
    await sql`
      INSERT INTO admin_users (email, role, status)
      VALUES (${me.email}, 'admin', 'active')
      ON CONFLICT (email) DO NOTHING
    `;

    const { plaintext, hashed, prefix } = generatePlaintextToken();
    const rows = (await sql`
      INSERT INTO api_tokens
        (user_email, name, hashed_token, prefix, scopes, expires_at)
      VALUES
        (${me.email}, ${name}, ${hashed}, ${prefix},
         ${scopes}::text[], ${input.expires_at ?? null})
      RETURNING id
    `) as Array<{ id: number }>;
    revalidatePath("/admin/canopy/api");
    await recordChange({
      entityType: "api_token",
      entityId: String(rows[0]!.id),
      action: "api_token.create",
      after: { name, scopes, prefix },
    });
    return { ok: true, id: rows[0]!.id, plaintext, prefix };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "insert failed" };
  }
}

export async function revokeApiTokenAction(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole("admin");
  try {
    const sql = getDb();
    await sql`
      UPDATE api_tokens
      SET revoked_at = NOW()
      WHERE id = ${id} AND revoked_at IS NULL
    `;
    revalidatePath("/admin/canopy/api");
    await recordChange({
      entityType: "api_token",
      entityId: String(id),
      action: "api_token.revoke",
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "revoke failed" };
  }
}
