"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { recordChange } from "@/lib/canopy/audit";
import { requireRole } from "@/lib/canopy/rbac";
import {
  generateWebhookSecret,
  WEBHOOK_EVENTS,
} from "@/lib/canopy/webhooks";

export type WebhookActionResult =
  | { ok: true; id: number; secret?: string }
  | { ok: false; error: string };

function validateEvents(events: string[]): { ok: true } | { ok: false; error: string } {
  if (events.length === 0) return { ok: false, error: "at least one event required" };
  for (const e of events) {
    if (!WEBHOOK_EVENTS.includes(e)) return { ok: false, error: `unknown event '${e}'` };
  }
  return { ok: true };
}

export async function createWebhookAction(input: {
  name: string;
  url: string;
  events: string[];
  enabled?: boolean;
}): Promise<WebhookActionResult> {
  const me = await requireRole("admin");
  const name = input.name.trim();
  const url = input.url.trim();
  if (!name) return { ok: false, error: "name required" };
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      return { ok: false, error: "URL must be http(s)" };
    }
  } catch {
    return { ok: false, error: "invalid URL" };
  }
  const v = validateEvents(input.events);
  if (!v.ok) return v;

  try {
    const sql = getDb();
    /* Like api_tokens, env-only admins need a row to satisfy the
     * FK on created_by_email if we ever add one - we don't add one
     * here, the column is plain TEXT. But upsert anyway so the team
     * page renders the env-admin in /admin/canopy/team. */
    await sql`
      INSERT INTO admin_users (email, role, status)
      VALUES (${me.email}, 'admin', 'active')
      ON CONFLICT (email) DO NOTHING
    `;

    const secret = generateWebhookSecret();
    /* Set last_audit_log_id to current MAX so the webhook starts
     * firing forward, never retroactively against old events. */
    const maxRow = (await sql`SELECT COALESCE(MAX(id), 0)::bigint AS max_id FROM canopy_audit_log`) as Array<{ max_id: number }>;
    const startFrom = Number(maxRow[0]?.max_id ?? 0);

    const rows = (await sql`
      INSERT INTO webhooks
        (name, url, events, secret, enabled, last_audit_log_id, created_by_email)
      VALUES
        (${name}, ${url}, ${input.events}::text[], ${secret},
         ${input.enabled ?? false}, ${startFrom}, ${me.email})
      RETURNING id
    `) as Array<{ id: number }>;
    revalidatePath("/admin/canopy/api");
    await recordChange({
      entityType: "webhook",
      entityId: String(rows[0]!.id),
      action: "webhook.create",
      after: { name, url, events: input.events, enabled: input.enabled ?? false },
    });
    return { ok: true, id: rows[0]!.id, secret };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "insert failed" };
  }
}

export async function updateWebhookAction(input: {
  id: number;
  name?: string;
  url?: string;
  events?: string[];
  enabled?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole("admin");
  if (input.events) {
    const v = validateEvents(input.events);
    if (!v.ok) return v;
  }
  if (input.url) {
    try {
      new URL(input.url);
    } catch {
      return { ok: false, error: "invalid URL" };
    }
  }
  try {
    const sql = getDb();
    await sql`
      UPDATE webhooks
      SET name       = COALESCE(${input.name ?? null}, name),
          url        = COALESCE(${input.url ?? null}, url),
          events     = COALESCE(${input.events ? (input.events as string[]) : null}::text[], events),
          enabled    = COALESCE(${input.enabled ?? null}, enabled),
          updated_at = NOW()
      WHERE id = ${input.id}
    `;
    revalidatePath("/admin/canopy/api");
    await recordChange({
      entityType: "webhook",
      entityId: String(input.id),
      action: "webhook.update",
      after: input as unknown as Record<string, unknown>,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "update failed" };
  }
}

export async function deleteWebhookAction(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole("admin");
  try {
    const sql = getDb();
    await sql`DELETE FROM webhooks WHERE id = ${id}`;
    revalidatePath("/admin/canopy/api");
    await recordChange({
      entityType: "webhook",
      entityId: String(id),
      action: "webhook.delete",
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "delete failed" };
  }
}
