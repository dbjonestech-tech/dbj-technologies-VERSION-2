import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { auth } from "@/auth";

export interface AuditChangeInput {
  entityType: string;
  entityId: string;
  action: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}

export interface CanopyAuditRow {
  id: string;
  occurred_at: string;
  actor_user_id: string | null;
  actor_email: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
}

/* Append-only entity-change writer for canopy_audit_log.
 *
 * Best-effort: a DB outage must not block the underlying mutation.
 * Logs the failure to console so Sentry instrumentation captures it
 * but the mutation continues. Callers do NOT need to await this in
 * critical paths if they want to fire-and-forget. */
export async function recordChange(input: AuditChangeInput): Promise<void> {
  try {
    const session = await auth().catch(() => null);
    const actorEmail = session?.user?.email
      ? session.user.email.toLowerCase().trim()
      : null;
    const actorUserId = session?.user?.id ?? null;

    let ip: string | null = null;
    let userAgent: string | null = null;
    try {
      const h = await headers();
      const fwd = h.get("x-forwarded-for");
      ip = fwd ? fwd.split(",")[0]!.trim() : h.get("x-real-ip");
      userAgent = h.get("user-agent");
    } catch {
      /* not in a request context - leave nulls */
    }

    const sql = getDb();
    await sql`
      INSERT INTO canopy_audit_log
        (actor_user_id, actor_email, entity_type, entity_id, action, before, after, ip, user_agent, metadata)
      VALUES (
        ${actorUserId},
        ${actorEmail},
        ${input.entityType},
        ${input.entityId},
        ${input.action},
        ${input.before ? JSON.stringify(input.before) : null}::jsonb,
        ${input.after ? JSON.stringify(input.after) : null}::jsonb,
        ${ip},
        ${userAgent},
        ${JSON.stringify(input.metadata ?? {})}::jsonb
      )
    `;
  } catch (err) {
    console.error("[canopy-audit] write failed:", err);
  }
}

/* Read recent audit rows for a given entity. Used by the audit log
 * tab on contact/deal detail pages. */
export async function getEntityAuditTrail(
  entityType: string,
  entityId: string,
  limit = 50
): Promise<CanopyAuditRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id::text, occurred_at, actor_user_id, actor_email,
             entity_type, entity_id, action, before, after,
             ip, user_agent, metadata
      FROM canopy_audit_log
      WHERE entity_type = ${entityType}
        AND entity_id = ${entityId}
      ORDER BY occurred_at DESC
      LIMIT ${limit}
    `) as CanopyAuditRow[];
    return rows;
  } catch {
    return [];
  }
}

/* Read recent audit rows across all entities. Powers the global view
 * on /admin/audit (extended in Phase 0). */
export async function getRecentChanges(limit = 100): Promise<CanopyAuditRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id::text, occurred_at, actor_user_id, actor_email,
             entity_type, entity_id, action, before, after,
             ip, user_agent, metadata
      FROM canopy_audit_log
      ORDER BY occurred_at DESC
      LIMIT ${limit}
    `) as CanopyAuditRow[];
    return rows;
  } catch {
    return [];
  }
}
