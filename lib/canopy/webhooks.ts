import { createHmac, randomBytes } from "crypto";
import { getDb } from "@/lib/db";

/* Outbound webhooks. A webhook subscribes to one or more named
 * events from canopy_audit_log.action. The dispatcher cron polls
 * the audit log per-webhook against last_audit_log_id and POSTs
 * matching events to the webhook URL with HMAC SHA-256 signature.
 *
 * webhook_deliveries is the ledger: one row per (webhook, audit_log)
 * with UNIQUE so retries never re-send the same event. Status code
 * + response body recorded for /admin/canopy/api debugging.
 *
 * Subscribable events list is pulled from the canopy_audit_log
 * action namespace. We curate a sensible default set here; an
 * operator can subscribe to '*' for everything. */

export const WEBHOOK_EVENTS: readonly string[] = [
  "*",
  "contact.created",
  "deal.create",
  "deal.stage_change",
  "deal.close.won",
  "deal.close.lost",
  "activity.task.complete",
  "activity.note.create",
  "tag.add",
  "pathlight.rescan.trigger",
  "automation.create_task",
  "automation.add_tag",
  "automation.change_stage",
  "automation.trigger_pathlight_scan",
];

export interface WebhookRow {
  id: number;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  last_audit_log_id: number;
  fire_count: number;
  fail_count: number;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookDeliveryRow {
  id: number;
  webhook_id: number;
  audit_log_id: number;
  event_name: string;
  status_code: number | null;
  response_body: string | null;
  error_message: string | null;
  attempt: number;
  delivered_at: string;
}

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}

export function signWebhookPayload(secret: string, body: string, timestamp: number): string {
  const signedPayload = `${timestamp}.${body}`;
  const hmac = createHmac("sha256", secret);
  hmac.update(signedPayload);
  return `t=${timestamp},v1=${hmac.digest("hex")}`;
}

export async function listWebhooks(): Promise<WebhookRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, name, url, events, enabled, last_audit_log_id,
             fire_count, fail_count, created_by_email,
             created_at::text AS created_at,
             updated_at::text AS updated_at
      FROM webhooks
      ORDER BY enabled DESC, created_at DESC
    `) as WebhookRow[];
    return rows;
  } catch {
    return [];
  }
}

export async function getRecentDeliveries(webhookId: number, limit = 30): Promise<WebhookDeliveryRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, webhook_id, audit_log_id, event_name, status_code,
             response_body, error_message, attempt,
             delivered_at::text AS delivered_at
      FROM webhook_deliveries
      WHERE webhook_id = ${webhookId}
      ORDER BY delivered_at DESC
      LIMIT ${limit}
    `) as WebhookDeliveryRow[];
    return rows;
  } catch {
    return [];
  }
}

interface DispatchResult {
  webhook_id: number;
  delivered: number;
  failed: number;
}

export async function dispatchWebhooks(maxPerWebhook = 50): Promise<DispatchResult[]> {
  const sql = getDb();
  const webhooks = (await sql`
    SELECT id, url, events, secret, last_audit_log_id
    FROM webhooks
    WHERE enabled = TRUE
  `) as Array<{
    id: number;
    url: string;
    events: string[];
    secret: string;
    last_audit_log_id: number;
  }>;

  const results: DispatchResult[] = [];

  for (const wh of webhooks) {
    /* Subscribed events filter via SQL ANY when not '*', else all. */
    const subscribesAll = wh.events.includes("*");
    const eventList = subscribesAll ? null : wh.events;

    const auditRows = subscribesAll
      ? ((await sql`
          SELECT id, action, entity_type, entity_id, before, after,
                 occurred_at::text AS occurred_at
          FROM canopy_audit_log
          WHERE id > ${wh.last_audit_log_id}
          ORDER BY id ASC
          LIMIT ${maxPerWebhook}
        `) as Array<{
          id: number;
          action: string;
          entity_type: string;
          entity_id: string;
          before: Record<string, unknown> | null;
          after: Record<string, unknown> | null;
          occurred_at: string;
        }>)
      : ((await sql`
          SELECT id, action, entity_type, entity_id, before, after,
                 occurred_at::text AS occurred_at
          FROM canopy_audit_log
          WHERE id > ${wh.last_audit_log_id}
            AND action = ANY(${eventList}::text[])
          ORDER BY id ASC
          LIMIT ${maxPerWebhook}
        `) as Array<{
          id: number;
          action: string;
          entity_type: string;
          entity_id: string;
          before: Record<string, unknown> | null;
          after: Record<string, unknown> | null;
          occurred_at: string;
        }>);

    if (auditRows.length === 0) continue;

    let delivered = 0;
    let failed = 0;
    let highestId = wh.last_audit_log_id;

    for (const row of auditRows) {
      highestId = Math.max(highestId, row.id);
      const body = JSON.stringify({
        id: row.id,
        event: row.action,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        before: row.before,
        after: row.after,
        occurred_at: row.occurred_at,
      });
      const ts = Math.floor(Date.now() / 1000);
      const signature = signWebhookPayload(wh.secret, body, ts);

      let statusCode: number | null = null;
      let responseBody: string | null = null;
      let errorMessage: string | null = null;

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(wh.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Canopy-Event": row.action,
            "Canopy-Signature": signature,
          },
          body,
          signal: controller.signal,
        });
        clearTimeout(timer);
        statusCode = res.status;
        responseBody = (await res.text()).slice(0, 2048);
        if (statusCode >= 200 && statusCode < 300) {
          delivered++;
        } else {
          failed++;
        }
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : "fetch failed";
        failed++;
      }

      try {
        await sql`
          INSERT INTO webhook_deliveries
            (webhook_id, audit_log_id, event_name, status_code, response_body, error_message)
          VALUES
            (${wh.id}, ${row.id}, ${row.action}, ${statusCode}, ${responseBody}, ${errorMessage})
          ON CONFLICT (webhook_id, audit_log_id) DO NOTHING
        `;
      } catch {
        /* swallow logging failure */
      }
    }

    try {
      await sql`
        UPDATE webhooks
        SET last_audit_log_id = ${highestId},
            fire_count = fire_count + ${delivered},
            fail_count = fail_count + ${failed},
            updated_at = NOW()
        WHERE id = ${wh.id}
      `;
    } catch {
      /* swallow */
    }

    results.push({ webhook_id: wh.id, delivered, failed });
  }

  return results;
}
