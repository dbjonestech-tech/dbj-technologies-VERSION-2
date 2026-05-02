"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { recordChange } from "@/lib/canopy/audit";
import {
  TASK_PRIORITIES,
  type ActivityRow,
  type ActivityType,
  type TaskPriority,
} from "@/lib/services/activities";

export type ActivityActionResult<T = ActivityRow> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireAdmin(): Promise<{ email: string }> {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.email) {
    throw new Error("Unauthorized");
  }
  return { email: session.user.email };
}

const REVALIDATE_PATHS = [
  "/admin",
  "/admin/tasks",
  "/admin/contacts",
  "/admin/deals",
  "/admin/relationships/pipeline",
] as const;

function revalidateAll(): void {
  for (const p of REVALIDATE_PATHS) revalidatePath(p);
}

interface AttachInput {
  contactId?: number | null;
  dealId?: number | null;
}

function ensureAttachment(input: AttachInput): { ok: true } | { ok: false; error: string } {
  if (!input.contactId && !input.dealId) {
    return { ok: false, error: "Activity must be attached to a contact or a deal" };
  }
  return { ok: true };
}

async function loadActivity(id: number): Promise<ActivityRow | null> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, type, contact_id, deal_id, owner_user_id, owner_email,
             payload, occurred_at, due_at, completed_at, priority,
             created_at, updated_at
      FROM activities
      WHERE id = ${id}
      LIMIT 1
    `) as ActivityRow[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function insertActivity(args: {
  type: ActivityType;
  contactId: number | null;
  dealId: number | null;
  ownerEmail: string;
  payload: Record<string, unknown>;
  occurredAt?: Date | null;
  dueAt?: Date | null;
  priority?: TaskPriority | null;
}): Promise<ActivityRow | null> {
  const sql = getDb();
  const inserted = (await sql`
    INSERT INTO activities (
      type, contact_id, deal_id, owner_email, payload,
      occurred_at, due_at, priority
    )
    VALUES (
      ${args.type},
      ${args.contactId},
      ${args.dealId},
      ${args.ownerEmail},
      ${JSON.stringify(args.payload)}::jsonb,
      ${args.occurredAt ?? new Date()},
      ${args.dueAt ?? null},
      ${args.priority ?? null}
    )
    RETURNING id
  `) as Array<{ id: number }>;
  const id = inserted[0]?.id;
  if (!id) return null;
  return loadActivity(id);
}

/* ------------ Note ------------ */
export async function logNoteAction(input: {
  contactId?: number | null;
  dealId?: number | null;
  body: string;
}): Promise<ActivityActionResult> {
  try {
    const admin = await requireAdmin();
    const attached = ensureAttachment(input);
    if (!attached.ok) return attached;
    const body = input.body?.trim();
    if (!body) return { ok: false, error: "Note cannot be empty" };

    const row = await insertActivity({
      type: "note",
      contactId: input.contactId ?? null,
      dealId: input.dealId ?? null,
      ownerEmail: admin.email,
      payload: { body },
    });
    if (!row) return { ok: false, error: "Insert failed" };
    await recordChange({
      entityType: "activity",
      entityId: String(row.id),
      action: "activity.note.create",
      after: { body, contact_id: row.contact_id, deal_id: row.deal_id },
    });
    revalidateAll();
    return { ok: true, data: row };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/* ------------ Call ------------ */
export async function logCallAction(input: {
  contactId?: number | null;
  dealId?: number | null;
  direction: "in" | "out";
  durationSeconds?: number;
  outcome?: string;
  body?: string;
  occurredAt?: string;
}): Promise<ActivityActionResult> {
  try {
    const admin = await requireAdmin();
    const attached = ensureAttachment(input);
    if (!attached.ok) return attached;
    if (input.direction !== "in" && input.direction !== "out") {
      return { ok: false, error: "Direction must be 'in' or 'out'" };
    }
    const payload = {
      direction: input.direction,
      duration_seconds: typeof input.durationSeconds === "number" ? input.durationSeconds : null,
      outcome: input.outcome?.trim() || null,
      body: input.body?.trim() || null,
    };
    const row = await insertActivity({
      type: "call",
      contactId: input.contactId ?? null,
      dealId: input.dealId ?? null,
      ownerEmail: admin.email,
      payload,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : null,
    });
    if (!row) return { ok: false, error: "Insert failed" };
    await recordChange({
      entityType: "activity",
      entityId: String(row.id),
      action: "activity.call.create",
      after: { ...payload, contact_id: row.contact_id, deal_id: row.deal_id },
    });
    revalidateAll();
    return { ok: true, data: row };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/* ------------ Meeting ------------ */
export async function logMeetingAction(input: {
  contactId?: number | null;
  dealId?: number | null;
  scheduledAt: string;
  attendees?: string;
  location?: string;
  body?: string;
}): Promise<ActivityActionResult> {
  try {
    const admin = await requireAdmin();
    const attached = ensureAttachment(input);
    if (!attached.ok) return attached;
    if (!input.scheduledAt) return { ok: false, error: "Scheduled time is required" };
    const scheduled = new Date(input.scheduledAt);
    if (Number.isNaN(scheduled.getTime())) return { ok: false, error: "Invalid scheduled time" };
    const payload = {
      scheduled_at: scheduled.toISOString(),
      attendees: input.attendees?.trim() || null,
      location: input.location?.trim() || null,
      body: input.body?.trim() || null,
    };
    const row = await insertActivity({
      type: "meeting",
      contactId: input.contactId ?? null,
      dealId: input.dealId ?? null,
      ownerEmail: admin.email,
      payload,
      occurredAt: scheduled,
    });
    if (!row) return { ok: false, error: "Insert failed" };
    await recordChange({
      entityType: "activity",
      entityId: String(row.id),
      action: "activity.meeting.create",
      after: { ...payload, contact_id: row.contact_id, deal_id: row.deal_id },
    });
    revalidateAll();
    return { ok: true, data: row };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/* ------------ Task ------------ */
export async function createTaskAction(input: {
  contactId?: number | null;
  dealId?: number | null;
  title: string;
  body?: string;
  dueAt?: string | null;
  priority: TaskPriority;
}): Promise<ActivityActionResult> {
  try {
    const admin = await requireAdmin();
    const attached = ensureAttachment(input);
    if (!attached.ok) return attached;
    const title = input.title?.trim();
    if (!title) return { ok: false, error: "Title is required" };
    if (!TASK_PRIORITIES.includes(input.priority)) {
      return { ok: false, error: "Invalid priority" };
    }
    const due = input.dueAt ? new Date(input.dueAt) : null;
    if (due && Number.isNaN(due.getTime())) return { ok: false, error: "Invalid due date" };

    const payload = { title, body: input.body?.trim() || null };
    const row = await insertActivity({
      type: "task",
      contactId: input.contactId ?? null,
      dealId: input.dealId ?? null,
      ownerEmail: admin.email,
      payload,
      dueAt: due,
      priority: input.priority,
    });
    if (!row) return { ok: false, error: "Insert failed" };
    await recordChange({
      entityType: "activity",
      entityId: String(row.id),
      action: "activity.task.create",
      after: { title, priority: input.priority, due_at: due?.toISOString() ?? null, contact_id: row.contact_id, deal_id: row.deal_id },
    });
    revalidateAll();
    return { ok: true, data: row };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function completeTaskAction(id: number): Promise<ActivityActionResult> {
  try {
    await requireAdmin();
    const before = await loadActivity(id);
    if (!before) return { ok: false, error: "Task not found" };
    if (before.type !== "task") return { ok: false, error: "Activity is not a task" };
    if (before.completed_at) return { ok: false, error: "Task already completed" };

    const sql = getDb();
    await sql`UPDATE activities SET completed_at = NOW(), updated_at = NOW() WHERE id = ${id}`;
    const after = await loadActivity(id);
    if (!after) return { ok: false, error: "Could not reload task after complete" };

    await recordChange({
      entityType: "activity",
      entityId: String(id),
      action: "activity.task.complete",
      before: { completed_at: before.completed_at },
      after: { completed_at: after.completed_at },
    });
    revalidateAll();
    return { ok: true, data: after };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function reopenTaskAction(id: number): Promise<ActivityActionResult> {
  try {
    await requireAdmin();
    const before = await loadActivity(id);
    if (!before) return { ok: false, error: "Task not found" };
    if (before.type !== "task") return { ok: false, error: "Activity is not a task" };
    if (!before.completed_at) return { ok: false, error: "Task is not completed" };

    const sql = getDb();
    await sql`UPDATE activities SET completed_at = NULL, updated_at = NOW() WHERE id = ${id}`;
    const after = await loadActivity(id);
    if (!after) return { ok: false, error: "Could not reload task after reopen" };

    await recordChange({
      entityType: "activity",
      entityId: String(id),
      action: "activity.task.reopen",
      before: { completed_at: before.completed_at },
      after: { completed_at: null },
    });
    revalidateAll();
    return { ok: true, data: after };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateTaskAction(input: {
  id: number;
  title?: string;
  dueAt?: string | null;
  priority?: TaskPriority;
}): Promise<ActivityActionResult> {
  try {
    await requireAdmin();
    const before = await loadActivity(input.id);
    if (!before) return { ok: false, error: "Task not found" };
    if (before.type !== "task") return { ok: false, error: "Activity is not a task" };

    const sql = getDb();
    if (typeof input.title === "string") {
      const t = input.title.trim();
      if (!t) return { ok: false, error: "Title cannot be empty" };
      const newPayload = { ...(before.payload ?? {}), title: t };
      await sql`UPDATE activities SET payload = ${JSON.stringify(newPayload)}::jsonb, updated_at = NOW() WHERE id = ${input.id}`;
    }
    if ("dueAt" in input) {
      const due = input.dueAt ? new Date(input.dueAt) : null;
      if (due && Number.isNaN(due.getTime())) return { ok: false, error: "Invalid due date" };
      await sql`UPDATE activities SET due_at = ${due}, updated_at = NOW() WHERE id = ${input.id}`;
    }
    if (input.priority) {
      if (!TASK_PRIORITIES.includes(input.priority)) return { ok: false, error: "Invalid priority" };
      await sql`UPDATE activities SET priority = ${input.priority}, updated_at = NOW() WHERE id = ${input.id}`;
    }

    const after = await loadActivity(input.id);
    if (!after) return { ok: false, error: "Could not reload task" };
    await recordChange({
      entityType: "activity",
      entityId: String(input.id),
      action: "activity.task.update",
      before: { title: pick(before.payload, "title"), due_at: before.due_at, priority: before.priority },
      after: { title: pick(after.payload, "title"), due_at: after.due_at, priority: after.priority },
    });
    revalidateAll();
    return { ok: true, data: after };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/* ------------ Delete (any type) ------------ */
export async function deleteActivityAction(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const before = await loadActivity(id);
    if (!before) return { ok: false, error: "Activity not found" };
    const sql = getDb();
    await sql`DELETE FROM activities WHERE id = ${id}`;
    await recordChange({
      entityType: "activity",
      entityId: String(id),
      action: `activity.${before.type}.delete`,
      before: { type: before.type, payload: before.payload },
    });
    revalidateAll();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

function pick(obj: Record<string, unknown> | null | undefined, key: string): unknown {
  return obj ? obj[key] : undefined;
}
