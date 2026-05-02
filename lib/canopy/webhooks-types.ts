/* Client-safe webhook types + constants. The server-side
 * lib/canopy/webhooks.ts imports `crypto` and the DB; this file
 * holds only the pure data the UI needs. */

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
