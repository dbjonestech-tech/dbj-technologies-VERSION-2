"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { recordChange } from "@/lib/canopy/audit";
import {
  TRIGGER_EVENTS,
  ACTION_KINDS,
  type TriggerEvent,
  type WorkflowAction,
} from "@/lib/canopy/automation/workflow-rules";

async function requireAdmin(): Promise<{ email: string }> {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.email) {
    throw new Error("not authorized");
  }
  return { email: session.user.email };
}

function validateActions(actions: WorkflowAction[]): { ok: boolean; error?: string } {
  if (!Array.isArray(actions)) return { ok: false, error: "actions must be an array" };
  for (const a of actions) {
    if (!ACTION_KINDS.includes(a.kind)) {
      return { ok: false, error: `unknown action kind '${a.kind}'` };
    }
    if (typeof a.payload !== "object" || a.payload === null) {
      return { ok: false, error: "each action needs a payload object" };
    }
  }
  return { ok: true };
}

export async function createWorkflowRuleAction(input: {
  name: string;
  description?: string | null;
  trigger_event: TriggerEvent;
  conditions: Record<string, unknown>;
  actions: WorkflowAction[];
  enabled: boolean;
}): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const { email } = await requireAdmin();
  if (!input.name.trim()) return { ok: false, error: "name required" };
  if (!TRIGGER_EVENTS.includes(input.trigger_event)) return { ok: false, error: "unknown trigger event" };
  const v = validateActions(input.actions);
  if (!v.ok) return { ok: false, error: v.error ?? "invalid actions" };
  try {
    const sql = getDb();
    /* Set last_audit_log_id to current MAX so the rule starts firing
     * from "now forward", not retroactively against historical events. */
    const maxRow = (await sql`SELECT COALESCE(MAX(id), 0)::bigint AS max_id FROM canopy_audit_log`) as Array<{ max_id: number }>;
    const startFrom = Number(maxRow[0]?.max_id ?? 0);

    const rows = (await sql`
      INSERT INTO workflow_rules
        (name, description, trigger_event, conditions, actions, enabled,
         last_audit_log_id, created_by_email)
      VALUES
        (${input.name.trim()},
         ${input.description ?? null},
         ${input.trigger_event},
         ${input.conditions as object}::jsonb,
         ${input.actions as object}::jsonb,
         ${input.enabled},
         ${startFrom},
         ${email})
      RETURNING id
    `) as Array<{ id: number }>;
    revalidatePath("/admin/automations");
    await recordChange({
      entityType: "workflow_rule",
      entityId: String(rows[0]!.id),
      action: "workflow_rule.create",
      after: { name: input.name, trigger_event: input.trigger_event, enabled: input.enabled },
    });
    return { ok: true, id: rows[0]!.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "insert failed" };
  }
}

export async function updateWorkflowRuleAction(input: {
  id: number;
  name?: string;
  description?: string | null;
  conditions?: Record<string, unknown>;
  actions?: WorkflowAction[];
  enabled?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  if (input.actions) {
    const v = validateActions(input.actions);
    if (!v.ok) return { ok: false, error: v.error ?? "invalid actions" };
  }
  try {
    const sql = getDb();
    await sql`
      UPDATE workflow_rules
      SET name        = COALESCE(${input.name ?? null}, name),
          description = COALESCE(${input.description ?? null}, description),
          conditions  = COALESCE(${input.conditions ? (input.conditions as object) : null}::jsonb, conditions),
          actions     = COALESCE(${input.actions ? (input.actions as object) : null}::jsonb, actions),
          enabled     = COALESCE(${input.enabled ?? null}, enabled),
          updated_at  = NOW()
      WHERE id = ${input.id}
    `;
    revalidatePath("/admin/automations");
    revalidatePath(`/admin/automations/${input.id}`);
    await recordChange({
      entityType: "workflow_rule",
      entityId: String(input.id),
      action: "workflow_rule.update",
      after: input as unknown as Record<string, unknown>,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "update failed" };
  }
}

export async function toggleWorkflowRuleAction(input: {
  id: number;
  enabled: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return updateWorkflowRuleAction({ id: input.id, enabled: input.enabled });
}

export async function deleteWorkflowRuleAction(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    const sql = getDb();
    await sql`DELETE FROM workflow_rules WHERE id = ${id}`;
    revalidatePath("/admin/automations");
    await recordChange({
      entityType: "workflow_rule",
      entityId: String(id),
      action: "workflow_rule.delete",
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "delete failed" };
  }
}
