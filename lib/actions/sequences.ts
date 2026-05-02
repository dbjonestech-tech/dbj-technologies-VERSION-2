"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { recordChange } from "@/lib/canopy/audit";
import type { SequenceStatus, SequenceStepKind } from "@/lib/canopy/automation/sequences";

async function requireAdmin(): Promise<{ email: string }> {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.email) {
    throw new Error("not authorized");
  }
  return { email: session.user.email };
}

export async function createSequenceAction(input: {
  name: string;
  description?: string | null;
}): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const { email } = await requireAdmin();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Name required" };
  try {
    const sql = getDb();
    const rows = (await sql`
      INSERT INTO sequences (name, description, status, created_by_email)
      VALUES (${name}, ${input.description ?? null}, 'draft', ${email})
      RETURNING id
    `) as Array<{ id: number }>;
    revalidatePath("/admin/sequences");
    await recordChange({
      entityType: "sequence",
      entityId: String(rows[0]!.id),
      action: "sequence.create",
      after: { name },
    });
    return { ok: true, id: rows[0]!.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "insert failed" };
  }
}

export async function updateSequenceAction(input: {
  id: number;
  name?: string;
  description?: string | null;
  status?: SequenceStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    const sql = getDb();
    await sql`
      UPDATE sequences
      SET name        = COALESCE(${input.name ?? null}, name),
          description = COALESCE(${input.description ?? null}, description),
          status      = COALESCE(${input.status ?? null}, status),
          updated_at  = NOW()
      WHERE id = ${input.id}
    `;
    revalidatePath("/admin/sequences");
    revalidatePath(`/admin/sequences/${input.id}`);
    await recordChange({
      entityType: "sequence",
      entityId: String(input.id),
      action: "sequence.update",
      after: input as unknown as Record<string, unknown>,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "update failed" };
  }
}

export async function deleteSequenceAction(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    const sql = getDb();
    await sql`DELETE FROM sequences WHERE id = ${id}`;
    revalidatePath("/admin/sequences");
    await recordChange({
      entityType: "sequence",
      entityId: String(id),
      action: "sequence.delete",
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "delete failed" };
  }
}

export async function addSequenceStepAction(input: {
  sequence_id: number;
  kind: SequenceStepKind;
  payload: Record<string, unknown>;
  delay_seconds: number;
}): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  await requireAdmin();
  if (!Number.isFinite(input.delay_seconds) || input.delay_seconds < 0) {
    return { ok: false, error: "delay_seconds must be >= 0" };
  }
  try {
    const sql = getDb();
    const orderRows = (await sql`
      SELECT COALESCE(MAX(step_order), -1) + 1 AS next_order
      FROM sequence_steps WHERE sequence_id = ${input.sequence_id}
    `) as Array<{ next_order: number }>;
    const nextOrder = orderRows[0]?.next_order ?? 0;
    const rows = (await sql`
      INSERT INTO sequence_steps (sequence_id, step_order, kind, payload, delay_seconds)
      VALUES (${input.sequence_id}, ${nextOrder}, ${input.kind}, ${input.payload as object}::jsonb, ${input.delay_seconds})
      RETURNING id
    `) as Array<{ id: number }>;
    revalidatePath(`/admin/sequences/${input.sequence_id}`);
    await recordChange({
      entityType: "sequence_step",
      entityId: String(rows[0]!.id),
      action: "sequence_step.create",
      after: { kind: input.kind, delay_seconds: input.delay_seconds, step_order: nextOrder },
    });
    return { ok: true, id: rows[0]!.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "insert failed" };
  }
}

export async function deleteSequenceStepAction(input: {
  step_id: number;
  sequence_id: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    const sql = getDb();
    await sql`DELETE FROM sequence_steps WHERE id = ${input.step_id}`;
    revalidatePath(`/admin/sequences/${input.sequence_id}`);
    await recordChange({
      entityType: "sequence_step",
      entityId: String(input.step_id),
      action: "sequence_step.delete",
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "delete failed" };
  }
}

export async function enrollContactsAction(input: {
  sequence_id: number;
  contact_ids: number[];
}): Promise<{ ok: true; enrolled: number; skipped: number } | { ok: false; error: string }> {
  await requireAdmin();
  if (input.contact_ids.length === 0) return { ok: false, error: "no contacts" };
  try {
    const sql = getDb();
    const seqRows = (await sql`
      SELECT status FROM sequences WHERE id = ${input.sequence_id}
    `) as Array<{ status: string }>;
    if (seqRows.length === 0) return { ok: false, error: "sequence not found" };
    if (seqRows[0]!.status === "archived") return { ok: false, error: "sequence is archived" };

    const firstStep = (await sql`
      SELECT delay_seconds FROM sequence_steps
      WHERE sequence_id = ${input.sequence_id} ORDER BY step_order ASC LIMIT 1
    `) as Array<{ delay_seconds: number }>;
    const firstDelay = firstStep[0]?.delay_seconds ?? 0;
    const nextRunAt = new Date(Date.now() + firstDelay * 1000).toISOString();

    let enrolled = 0;
    let skipped = 0;
    for (const contactId of input.contact_ids) {
      const r = (await sql`
        INSERT INTO sequence_enrollments
          (sequence_id, contact_id, current_step_order, status, next_run_at)
        VALUES
          (${input.sequence_id}, ${contactId}, 0, 'active', ${nextRunAt})
        ON CONFLICT (sequence_id, contact_id) DO NOTHING
        RETURNING id
      `) as Array<{ id: number }>;
      if (r.length > 0) enrolled++;
      else skipped++;
    }
    revalidatePath(`/admin/sequences/${input.sequence_id}`);
    await recordChange({
      entityType: "sequence",
      entityId: String(input.sequence_id),
      action: "sequence.bulk_enroll",
      after: { enrolled, skipped, contact_count: input.contact_ids.length },
    });
    return { ok: true, enrolled, skipped };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "enroll failed" };
  }
}

export async function pauseEnrollmentAction(enrollmentId: number): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    const sql = getDb();
    await sql`
      UPDATE sequence_enrollments
      SET status = 'paused', next_run_at = NULL
      WHERE id = ${enrollmentId} AND status = 'active'
    `;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "pause failed" };
  }
}

export async function exitEnrollmentAction(input: {
  enrollment_id: number;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    const sql = getDb();
    await sql`
      UPDATE sequence_enrollments
      SET status = 'exited', next_run_at = NULL, exit_reason = ${input.reason}
      WHERE id = ${input.enrollment_id}
    `;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "exit failed" };
  }
}
