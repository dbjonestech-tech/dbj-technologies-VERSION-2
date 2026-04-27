import { getDb } from "@/lib/db";

export type AdminAuditEvent =
  | "signin.attempt"
  | "signin.success"
  | "signin.denied"
  | "signin.rate_limited"
  | "signin.error"
  | "signout"
  | "protected.access"
  | "protected.denied";

export type AdminAuditResult = "success" | "denied" | "error";

export type AdminAuditInput = {
  email?: string | null;
  event: AdminAuditEvent;
  result?: AdminAuditResult;
  ip?: string | null;
  userAgent?: string | null;
  deviceHash?: string | null;
  metadata?: Record<string, unknown>;
};

/* Append-only audit log writer. Best-effort: a DB outage must not
 * block a sign-in or page render. Errors swallow to console.error so
 * Sentry's instrumentation captures them but the user flow continues. */
export async function writeAdminAudit(input: AdminAuditInput): Promise<void> {
  try {
    const sql = getDb();
    const email = input.email ? input.email.toLowerCase().trim() : null;
    await sql`
      INSERT INTO admin_audit_log
        (email, event, result, ip, user_agent, device_hash, metadata)
      VALUES (
        ${email},
        ${input.event},
        ${input.result ?? "success"},
        ${input.ip ?? null},
        ${input.userAgent ?? null},
        ${input.deviceHash ?? null},
        ${JSON.stringify(input.metadata ?? {})}::jsonb
      )
    `;
  } catch (err) {
    console.error("[admin-audit] write failed:", err);
  }
}

/* Return true if we have NOT logged a successful sign-in for this
 * (email, deviceHash) pair within the lookback window. Used to gate
 * the "new device" email notification. Failures (DB outage etc.) fall
 * open as `false` — better to skip a notification than to spam the
 * admin on every login during a partial outage. */
export async function isNewDevice(args: {
  email: string;
  deviceHash: string;
  lookbackDays?: number;
}): Promise<boolean> {
  try {
    const sql = getDb();
    const email = args.email.toLowerCase().trim();
    const days = args.lookbackDays ?? 30;
    const rows = (await sql`
      SELECT 1
      FROM admin_audit_log
      WHERE event = 'signin.success'
        AND email = ${email}
        AND device_hash = ${args.deviceHash}
        AND created_at > now() - (${days}::text || ' days')::interval
      LIMIT 1
    `) as Array<{ "?column?": number }>;
    return rows.length === 0;
  } catch (err) {
    console.error("[admin-audit] isNewDevice check failed:", err);
    return false;
  }
}

export type AdminAuditRow = {
  id: string;
  email: string | null;
  event: string;
  result: string;
  ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function getRecentAuditEvents(limit = 100): Promise<AdminAuditRow[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT id::text, email, event, result, ip, user_agent, metadata, created_at
    FROM admin_audit_log
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as AdminAuditRow[];
  return rows;
}
