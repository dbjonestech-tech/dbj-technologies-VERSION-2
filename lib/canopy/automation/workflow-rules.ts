import { getDb } from "@/lib/db";

export type TriggerEvent =
  | "contact.created"
  | "deal.create"
  | "deal.stage_change"
  | "deal.close.won"
  | "deal.close.lost"
  | "activity.task.complete"
  | "tag.add"
  | "pathlight.rescan.trigger";

export const TRIGGER_EVENTS: readonly TriggerEvent[] = [
  "contact.created",
  "deal.create",
  "deal.stage_change",
  "deal.close.won",
  "deal.close.lost",
  "activity.task.complete",
  "tag.add",
  "pathlight.rescan.trigger",
];

export type ActionKind =
  | "create_task"
  | "send_email"
  | "enroll_in_sequence"
  | "change_stage"
  | "add_tag"
  | "remove_tag"
  | "trigger_pathlight_scan";

export const ACTION_KINDS: readonly ActionKind[] = [
  "create_task",
  "send_email",
  "enroll_in_sequence",
  "change_stage",
  "add_tag",
  "remove_tag",
  "trigger_pathlight_scan",
];

export interface WorkflowAction {
  kind: ActionKind;
  payload: Record<string, unknown>;
}

export interface WorkflowRuleRow {
  id: number;
  name: string;
  description: string | null;
  trigger_event: TriggerEvent;
  conditions: Record<string, unknown>;
  actions: WorkflowAction[];
  enabled: boolean;
  last_evaluated_at: string | null;
  last_audit_log_id: number;
  fire_count: number;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
}

export async function listWorkflowRules(): Promise<WorkflowRuleRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, name, description, trigger_event, conditions, actions,
             enabled, last_evaluated_at, last_audit_log_id, fire_count,
             created_by_email, created_at, updated_at
      FROM workflow_rules
      ORDER BY enabled DESC, updated_at DESC
    `) as WorkflowRuleRow[];
    return rows;
  } catch {
    return [];
  }
}

export async function getWorkflowRule(id: number): Promise<WorkflowRuleRow | null> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, name, description, trigger_event, conditions, actions,
             enabled, last_evaluated_at, last_audit_log_id, fire_count,
             created_by_email, created_at, updated_at
      FROM workflow_rules
      WHERE id = ${id}
    `) as WorkflowRuleRow[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export interface RuleEvaluationRow {
  id: number;
  rule_id: number;
  audit_log_id: number;
  fired: boolean;
  reason: string | null;
  evaluated_at: string;
}

export async function getRuleEvaluations(ruleId: number, limit = 30): Promise<RuleEvaluationRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, rule_id, audit_log_id, fired, reason, evaluated_at
      FROM workflow_evaluations
      WHERE rule_id = ${ruleId}
      ORDER BY evaluated_at DESC
      LIMIT ${limit}
    `) as RuleEvaluationRow[];
    return rows;
  } catch {
    return [];
  }
}

/* The condition shape the UI emits is intentionally simple:
 *   { match: { field: value, ... } }
 * where field is read from the audit log row's "after" payload (or
 * "before" via "before.field"). The evaluator below interprets this.
 *
 * Empty conditions = always-match. */
export function evaluateConditions(
  conditions: Record<string, unknown>,
  auditAfter: Record<string, unknown> | null,
  auditBefore: Record<string, unknown> | null
): { match: boolean; reason: string } {
  const match = (conditions as { match?: Record<string, unknown> })?.match;
  if (!match || typeof match !== "object") {
    return { match: true, reason: "no conditions; always match" };
  }
  for (const [key, expected] of Object.entries(match)) {
    let actual: unknown;
    if (key.startsWith("before.")) {
      actual = (auditBefore as Record<string, unknown> | null)?.[key.slice(7)];
    } else if (key.startsWith("after.")) {
      actual = (auditAfter as Record<string, unknown> | null)?.[key.slice(6)];
    } else {
      actual = (auditAfter as Record<string, unknown> | null)?.[key];
    }
    if (Array.isArray(expected)) {
      if (!expected.includes(actual as never)) {
        return { match: false, reason: `${key} = ${String(actual)} not in [${expected.join(",")}]` };
      }
    } else if (actual !== expected) {
      return { match: false, reason: `${key} = ${String(actual)} expected ${String(expected)}` };
    }
  }
  return { match: true, reason: "all conditions matched" };
}
