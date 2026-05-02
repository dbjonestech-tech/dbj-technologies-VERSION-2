import { getDb } from "@/lib/db";
import { canFireScan } from "@/lib/canopy/pathlight-gate";
import { triggerRescanForContact } from "@/lib/canopy/pathlight-client";
import { canonicalizeTag } from "@/lib/canopy/tags";

/* The action library is the single point of execution for both
 * workflow rules and sequence steps. Each function takes the action
 * payload and a target {contact_id, deal_id} resolved by the caller
 * (the rule evaluator or the sequence advancer), runs the side
 * effect, and returns a structured outcome.
 *
 * Side effects intentionally bypass the Server Action audit-log
 * decorators (those wrap user-initiated mutations). Each action here
 * writes its own canopy_audit_log row tagged with action="automation.*"
 * and a metadata.source that names the originating rule or sequence.
 *
 * sendEmail is a stub until Phase 4 (Gmail OAuth / message store)
 * ships. It returns ok=false with reason="phase_4_required" so the
 * sequence cron can still advance past email steps without crashing,
 * and the dashboard can surface the gap. */

export interface ActionTarget {
  contact_id: number | null;
  deal_id: number | null;
}

export interface ActionResult {
  ok: boolean;
  kind: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

interface ActionContext {
  source: { kind: "rule"; rule_id: number; name: string } | { kind: "sequence"; sequence_id: number; step_id: number; name: string };
}

async function logAutomation(
  ctx: ActionContext,
  target: ActionTarget,
  action: string,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    const sql = getDb();
    await sql`
      INSERT INTO canopy_audit_log
        (entity_type, entity_id, action, after, metadata)
      VALUES
        (${"contact"}, ${String(target.contact_id ?? "")}, ${action},
         ${metadata as object}::jsonb,
         ${{ ...ctx.source, target } as object}::jsonb)
    `;
  } catch {
    /* never block the action on a logging failure */
  }
}

export async function actionCreateTask(
  payload: Record<string, unknown>,
  target: ActionTarget,
  ctx: ActionContext
): Promise<ActionResult> {
  if (!target.contact_id && !target.deal_id) {
    return { ok: false, kind: "create_task", reason: "no target" };
  }
  const title = String(payload.title ?? "").trim();
  if (!title) {
    return { ok: false, kind: "create_task", reason: "title required" };
  }
  const dueInDays = Number(payload.due_in_days ?? 0);
  const priority =
    payload.priority === "low" || payload.priority === "medium" || payload.priority === "high" || payload.priority === "urgent"
      ? (payload.priority as string)
      : null;

  try {
    const sql = getDb();
    const dueAt = Number.isFinite(dueInDays) && dueInDays > 0
      ? new Date(Date.now() + dueInDays * 86400 * 1000).toISOString()
      : null;
    const inserted = (await sql`
      INSERT INTO activities
        (type, contact_id, deal_id, owner_email, payload, due_at, priority)
      VALUES
        ('task',
         ${target.contact_id},
         ${target.deal_id},
         ${"automation@canopy"},
         ${{ title } as object}::jsonb,
         ${dueAt},
         ${priority})
      RETURNING id
    `) as Array<{ id: number }>;
    await logAutomation(ctx, target, "automation.create_task", {
      activity_id: inserted[0]?.id,
      title,
      due_at: dueAt,
      priority,
    });
    return { ok: true, kind: "create_task", metadata: { activity_id: inserted[0]?.id, title, due_at: dueAt } };
  } catch (err) {
    return {
      ok: false,
      kind: "create_task",
      reason: err instanceof Error ? err.message : "insert failed",
    };
  }
}

export async function actionSendEmail(
  _payload: Record<string, unknown>,
  target: ActionTarget,
  ctx: ActionContext
): Promise<ActionResult> {
  /* Phase 4 will replace this with Gmail send + open/click tracking.
   * For now, we record the intent on the timeline so operators can
   * see what *would* have been sent and skip cleanly. */
  await logAutomation(ctx, target, "automation.send_email.deferred", {
    note: "Phase 4 email integration required; step skipped",
  });
  return {
    ok: false,
    kind: "send_email",
    reason: "phase_4_required",
    metadata: { skipped: true },
  };
}

export async function actionEnrollInSequence(
  payload: Record<string, unknown>,
  target: ActionTarget,
  ctx: ActionContext
): Promise<ActionResult> {
  if (!target.contact_id) {
    return { ok: false, kind: "enroll_in_sequence", reason: "contact_id required" };
  }
  const sequenceId = Number(payload.sequence_id);
  if (!Number.isInteger(sequenceId) || sequenceId <= 0) {
    return { ok: false, kind: "enroll_in_sequence", reason: "invalid sequence_id" };
  }
  try {
    const sql = getDb();
    const stepRows = (await sql`
      SELECT delay_seconds FROM sequence_steps
      WHERE sequence_id = ${sequenceId} ORDER BY step_order ASC LIMIT 1
    `) as Array<{ delay_seconds: number }>;
    const firstDelay = stepRows[0]?.delay_seconds ?? 0;
    const nextRunAt = new Date(Date.now() + firstDelay * 1000).toISOString();

    await sql`
      INSERT INTO sequence_enrollments
        (sequence_id, contact_id, current_step_order, status, next_run_at)
      VALUES
        (${sequenceId}, ${target.contact_id}, 0, 'active', ${nextRunAt})
      ON CONFLICT (sequence_id, contact_id) DO NOTHING
    `;
    await logAutomation(ctx, target, "automation.enroll_in_sequence", {
      sequence_id: sequenceId,
      next_run_at: nextRunAt,
    });
    return { ok: true, kind: "enroll_in_sequence", metadata: { sequence_id: sequenceId, next_run_at: nextRunAt } };
  } catch (err) {
    return {
      ok: false,
      kind: "enroll_in_sequence",
      reason: err instanceof Error ? err.message : "insert failed",
    };
  }
}

export async function actionChangeStage(
  payload: Record<string, unknown>,
  target: ActionTarget,
  ctx: ActionContext
): Promise<ActionResult> {
  const stage = String(payload.stage ?? "");
  const allowed = ["new", "contacted", "qualified", "proposal", "won", "lost"];
  if (!allowed.includes(stage)) {
    return { ok: false, kind: "change_stage", reason: `invalid stage '${stage}'` };
  }
  if (!target.contact_id && !target.deal_id) {
    return { ok: false, kind: "change_stage", reason: "no target" };
  }
  try {
    const sql = getDb();
    let updated = 0;
    if (target.deal_id) {
      const r = (await sql`
        UPDATE deals
        SET stage = ${stage}, updated_at = NOW(),
            closed_at = CASE WHEN ${stage} IN ('won','lost') THEN NOW() ELSE closed_at END,
            won = CASE WHEN ${stage} = 'won' THEN TRUE
                       WHEN ${stage} = 'lost' THEN FALSE
                       ELSE won END
        WHERE id = ${target.deal_id}
        RETURNING id
      `) as Array<{ id: number }>;
      updated = r.length;
    } else if (target.contact_id) {
      const r = (await sql`
        UPDATE deals
        SET stage = ${stage}, updated_at = NOW()
        WHERE contact_id = ${target.contact_id} AND closed_at IS NULL
        RETURNING id
      `) as Array<{ id: number }>;
      updated = r.length;
    }
    await logAutomation(ctx, target, "automation.change_stage", { stage, updated });
    return { ok: true, kind: "change_stage", metadata: { stage, deals_updated: updated } };
  } catch (err) {
    return {
      ok: false,
      kind: "change_stage",
      reason: err instanceof Error ? err.message : "update failed",
    };
  }
}

export async function actionAddTag(
  payload: Record<string, unknown>,
  target: ActionTarget,
  ctx: ActionContext
): Promise<ActionResult> {
  const tag = canonicalizeTag(String(payload.tag ?? ""));
  if (!tag) return { ok: false, kind: "add_tag", reason: "tag required" };
  try {
    const sql = getDb();
    if (target.contact_id) {
      await sql`
        UPDATE contacts
        SET tags = ARRAY(SELECT DISTINCT unnest(tags || ARRAY[${tag}]::text[]))
        WHERE id = ${target.contact_id}
      `;
    }
    if (target.deal_id) {
      await sql`
        UPDATE deals
        SET tags = ARRAY(SELECT DISTINCT unnest(tags || ARRAY[${tag}]::text[]))
        WHERE id = ${target.deal_id}
      `;
    }
    await logAutomation(ctx, target, "automation.add_tag", { tag });
    return { ok: true, kind: "add_tag", metadata: { tag } };
  } catch (err) {
    return { ok: false, kind: "add_tag", reason: err instanceof Error ? err.message : "update failed" };
  }
}

export async function actionRemoveTag(
  payload: Record<string, unknown>,
  target: ActionTarget,
  ctx: ActionContext
): Promise<ActionResult> {
  const tag = canonicalizeTag(String(payload.tag ?? ""));
  if (!tag) return { ok: false, kind: "remove_tag", reason: "tag required" };
  try {
    const sql = getDb();
    if (target.contact_id) {
      await sql`
        UPDATE contacts SET tags = array_remove(tags, ${tag})
        WHERE id = ${target.contact_id}
      `;
    }
    if (target.deal_id) {
      await sql`
        UPDATE deals SET tags = array_remove(tags, ${tag})
        WHERE id = ${target.deal_id}
      `;
    }
    await logAutomation(ctx, target, "automation.remove_tag", { tag });
    return { ok: true, kind: "remove_tag", metadata: { tag } };
  } catch (err) {
    return { ok: false, kind: "remove_tag", reason: err instanceof Error ? err.message : "update failed" };
  }
}

export async function actionTriggerPathlightScan(
  payload: Record<string, unknown>,
  target: ActionTarget,
  ctx: ActionContext
): Promise<ActionResult> {
  if (!target.contact_id) {
    return { ok: false, kind: "trigger_pathlight_scan", reason: "contact_id required" };
  }
  const gate = await canFireScan("rescan");
  if (!gate.allowed) {
    await logAutomation(ctx, target, "automation.trigger_pathlight_scan.gated", {
      reason: gate.reason,
    });
    return { ok: false, kind: "trigger_pathlight_scan", reason: gate.reason ?? "gated" };
  }
  const url = typeof payload.override_url === "string" ? payload.override_url : undefined;
  const result = await triggerRescanForContact({
    contactId: target.contact_id,
    triggeredByEmail: "automation@canopy",
    reason: typeof payload.reason === "string" ? payload.reason : `Triggered by ${ctx.source.kind} '${ctx.source.name}'`,
    url,
  });
  if (result.ok) {
    await logAutomation(ctx, target, "automation.trigger_pathlight_scan", {
      scan_id: result.data.scan_id,
    });
    return {
      ok: true,
      kind: "trigger_pathlight_scan",
      metadata: { scan_id: result.data.scan_id },
    };
  }
  await logAutomation(ctx, target, "automation.trigger_pathlight_scan.failed", {
    reason: result.reason ?? result.error,
  });
  return { ok: false, kind: "trigger_pathlight_scan", reason: result.reason ?? result.error };
}

export async function executeAction(
  kind: string,
  payload: Record<string, unknown>,
  target: ActionTarget,
  ctx: ActionContext
): Promise<ActionResult> {
  switch (kind) {
    case "create_task": return actionCreateTask(payload, target, ctx);
    case "send_email": return actionSendEmail(payload, target, ctx);
    case "enroll_in_sequence": return actionEnrollInSequence(payload, target, ctx);
    case "change_stage": return actionChangeStage(payload, target, ctx);
    case "add_tag": return actionAddTag(payload, target, ctx);
    case "remove_tag": return actionRemoveTag(payload, target, ctx);
    case "trigger_pathlight_scan": return actionTriggerPathlightScan(payload, target, ctx);
    default:
      return { ok: false, kind, reason: `unknown action kind '${kind}'` };
  }
}
