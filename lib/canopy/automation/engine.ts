import { getDb } from "@/lib/db";
import { executeAction, type ActionResult } from "./actions";
import { evaluateConditions, type WorkflowAction } from "./workflow-rules";

interface AdvanceResult {
  enrollment_id: number;
  step_order: number;
  outcome: "executed" | "skipped" | "completed" | "exited";
  action_result?: ActionResult;
  next_run_at?: string | null;
}

/* Drains all active enrollments whose next_run_at <= NOW(). For each
 * enrollment, executes the current step's action, schedules the next
 * step (or marks completed when out of steps), and returns a summary
 * for the cron's run-log. */
export async function advanceDueEnrollments(limit = 100): Promise<AdvanceResult[]> {
  const sql = getDb();
  const due = (await sql`
    SELECT id, sequence_id, contact_id, current_step_order
    FROM sequence_enrollments
    WHERE status = 'active'
      AND next_run_at IS NOT NULL
      AND next_run_at <= NOW()
    ORDER BY next_run_at ASC
    LIMIT ${limit}
  `) as Array<{
    id: number;
    sequence_id: number;
    contact_id: number;
    current_step_order: number;
  }>;

  const results: AdvanceResult[] = [];

  for (const enrollment of due) {
    const stepRows = (await sql`
      SELECT id, kind, payload, delay_seconds, step_order
      FROM sequence_steps
      WHERE sequence_id = ${enrollment.sequence_id}
        AND step_order = ${enrollment.current_step_order}
    `) as Array<{
      id: number;
      kind: string;
      payload: Record<string, unknown>;
      delay_seconds: number;
      step_order: number;
    }>;

    const seqRow = (await sql`
      SELECT name FROM sequences WHERE id = ${enrollment.sequence_id}
    `) as Array<{ name: string }>;
    const sequenceName = seqRow[0]?.name ?? `sequence ${enrollment.sequence_id}`;

    if (stepRows.length === 0) {
      await sql`
        UPDATE sequence_enrollments
        SET status = 'completed', next_run_at = NULL, last_step_at = NOW()
        WHERE id = ${enrollment.id}
      `;
      results.push({ enrollment_id: enrollment.id, step_order: enrollment.current_step_order, outcome: "completed" });
      continue;
    }

    const step = stepRows[0]!;
    let actionResult: ActionResult | undefined;
    if (step.kind === "wait") {
      actionResult = { ok: true, kind: "wait" };
    } else {
      const actionKindMap: Record<string, string> = {
        email: "send_email",
        task: "create_task",
        tag: "add_tag",
        stage_change: "change_stage",
      };
      const kind = actionKindMap[step.kind];
      if (!kind) {
        actionResult = { ok: false, kind: step.kind, reason: `unknown step kind '${step.kind}'` };
      } else {
        actionResult = await executeAction(
          kind,
          step.payload,
          { contact_id: enrollment.contact_id, deal_id: null },
          { source: { kind: "sequence", sequence_id: enrollment.sequence_id, step_id: step.id, name: sequenceName } }
        );
      }
    }

    /* Schedule the next step (if any). */
    const nextRows = (await sql`
      SELECT step_order, delay_seconds FROM sequence_steps
      WHERE sequence_id = ${enrollment.sequence_id}
        AND step_order > ${enrollment.current_step_order}
      ORDER BY step_order ASC
      LIMIT 1
    `) as Array<{ step_order: number; delay_seconds: number }>;

    if (nextRows.length === 0) {
      await sql`
        UPDATE sequence_enrollments
        SET status = 'completed', next_run_at = NULL, last_step_at = NOW(),
            current_step_order = ${enrollment.current_step_order}
        WHERE id = ${enrollment.id}
      `;
      results.push({
        enrollment_id: enrollment.id,
        step_order: enrollment.current_step_order,
        outcome: "completed",
        action_result: actionResult,
      });
    } else {
      const next = nextRows[0]!;
      const nextRunAt = new Date(Date.now() + next.delay_seconds * 1000).toISOString();
      await sql`
        UPDATE sequence_enrollments
        SET current_step_order = ${next.step_order},
            next_run_at        = ${nextRunAt},
            last_step_at       = NOW()
        WHERE id = ${enrollment.id}
      `;
      results.push({
        enrollment_id: enrollment.id,
        step_order: enrollment.current_step_order,
        outcome: "executed",
        action_result: actionResult,
        next_run_at: nextRunAt,
      });
    }
  }

  return results;
}

interface WorkflowEvalResult {
  rule_id: number;
  audit_log_id: number;
  fired: boolean;
  reason: string;
  action_results: ActionResult[];
}

/* Polling rule evaluator. For each enabled rule, scans canopy_audit_log
 * for entries with id > last_audit_log_id matching trigger_event,
 * evaluates conditions, and if matching, executes each action against
 * the entity targeted by the audit row. Records every evaluation in
 * workflow_evaluations so a cron retry never double-fires. */
export async function evaluateWorkflowRules(maxPerRule = 200): Promise<WorkflowEvalResult[]> {
  const sql = getDb();
  const rules = (await sql`
    SELECT id, name, trigger_event, conditions, actions, last_audit_log_id
    FROM workflow_rules
    WHERE enabled = TRUE
  `) as Array<{
    id: number;
    name: string;
    trigger_event: string;
    conditions: Record<string, unknown>;
    actions: WorkflowAction[];
    last_audit_log_id: number;
  }>;

  const results: WorkflowEvalResult[] = [];

  for (const rule of rules) {
    const auditRows = (await sql`
      SELECT id, action, entity_type, entity_id, before, after
      FROM canopy_audit_log
      WHERE id > ${rule.last_audit_log_id}
        AND action = ${rule.trigger_event}
      ORDER BY id ASC
      LIMIT ${maxPerRule}
    `) as Array<{
      id: number;
      action: string;
      entity_type: string;
      entity_id: string;
      before: Record<string, unknown> | null;
      after: Record<string, unknown> | null;
    }>;

    if (auditRows.length === 0) continue;
    let highestId = rule.last_audit_log_id;

    for (const row of auditRows) {
      highestId = Math.max(highestId, row.id);
      const evalResult = evaluateConditions(rule.conditions, row.after, row.before);
      if (!evalResult.match) {
        await sql`
          INSERT INTO workflow_evaluations (rule_id, audit_log_id, fired, reason)
          VALUES (${rule.id}, ${row.id}, FALSE, ${evalResult.reason})
          ON CONFLICT (rule_id, audit_log_id) DO NOTHING
        `;
        results.push({ rule_id: rule.id, audit_log_id: row.id, fired: false, reason: evalResult.reason, action_results: [] });
        continue;
      }

      const target = await resolveTarget(row.entity_type, row.entity_id);
      const actionResults: ActionResult[] = [];
      for (const a of rule.actions) {
        const r = await executeAction(
          a.kind,
          a.payload,
          target,
          { source: { kind: "rule", rule_id: rule.id, name: rule.name } }
        );
        actionResults.push(r);
      }

      await sql`
        INSERT INTO workflow_evaluations (rule_id, audit_log_id, fired, reason)
        VALUES (${rule.id}, ${row.id}, TRUE, ${"matched"})
        ON CONFLICT (rule_id, audit_log_id) DO NOTHING
      `;
      await sql`
        UPDATE workflow_rules
        SET fire_count = fire_count + 1, last_evaluated_at = NOW()
        WHERE id = ${rule.id}
      `;
      results.push({
        rule_id: rule.id,
        audit_log_id: row.id,
        fired: true,
        reason: "matched",
        action_results: actionResults,
      });
    }

    await sql`
      UPDATE workflow_rules
      SET last_audit_log_id = ${highestId}, last_evaluated_at = NOW()
      WHERE id = ${rule.id}
    `;
  }

  return results;
}

async function resolveTarget(entityType: string, entityId: string): Promise<{ contact_id: number | null; deal_id: number | null }> {
  const sql = getDb();
  const id = Number(entityId);
  if (entityType === "deal" && Number.isInteger(id)) {
    const rows = (await sql`SELECT contact_id FROM deals WHERE id = ${id}`) as Array<{ contact_id: number }>;
    return { contact_id: rows[0]?.contact_id ?? null, deal_id: id };
  }
  if (entityType === "contact" && Number.isInteger(id)) {
    return { contact_id: id, deal_id: null };
  }
  if (entityType === "activity" && Number.isInteger(id)) {
    const rows = (await sql`SELECT contact_id, deal_id FROM activities WHERE id = ${id}`) as Array<{ contact_id: number | null; deal_id: number | null }>;
    return { contact_id: rows[0]?.contact_id ?? null, deal_id: rows[0]?.deal_id ?? null };
  }
  return { contact_id: null, deal_id: null };
}
