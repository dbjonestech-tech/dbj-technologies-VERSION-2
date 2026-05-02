import { getDb } from "@/lib/db";

export type SequenceStatus = "draft" | "active" | "paused" | "archived";
export type SequenceStepKind = "email" | "task" | "wait" | "tag" | "stage_change";
export type EnrollmentStatus = "active" | "paused" | "completed" | "exited";

export interface SequenceRow {
  id: number;
  name: string;
  description: string | null;
  status: SequenceStatus;
  enrollment_filter: Record<string, unknown>;
  exit_conditions: Record<string, unknown>;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
  step_count: number;
  active_enrollments: number;
}

export interface SequenceStepRow {
  id: number;
  sequence_id: number;
  step_order: number;
  kind: SequenceStepKind;
  payload: Record<string, unknown>;
  delay_seconds: number;
  created_at: string;
}

export interface EnrollmentRow {
  id: number;
  sequence_id: number;
  contact_id: number;
  current_step_order: number;
  status: EnrollmentStatus;
  exit_reason: string | null;
  next_run_at: string | null;
  enrolled_at: string;
  last_step_at: string | null;
}

export async function listSequences(): Promise<SequenceRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        s.id, s.name, s.description, s.status, s.enrollment_filter,
        s.exit_conditions, s.created_by_email, s.created_at, s.updated_at,
        COALESCE((SELECT COUNT(*) FROM sequence_steps WHERE sequence_id = s.id), 0)::int AS step_count,
        COALESCE((SELECT COUNT(*) FROM sequence_enrollments
                  WHERE sequence_id = s.id AND status = 'active'), 0)::int AS active_enrollments
      FROM sequences s
      ORDER BY s.updated_at DESC
    `) as SequenceRow[];
    return rows;
  } catch {
    return [];
  }
}

export async function getSequence(id: number): Promise<SequenceRow | null> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        s.id, s.name, s.description, s.status, s.enrollment_filter,
        s.exit_conditions, s.created_by_email, s.created_at, s.updated_at,
        COALESCE((SELECT COUNT(*) FROM sequence_steps WHERE sequence_id = s.id), 0)::int AS step_count,
        COALESCE((SELECT COUNT(*) FROM sequence_enrollments
                  WHERE sequence_id = s.id AND status = 'active'), 0)::int AS active_enrollments
      FROM sequences s
      WHERE s.id = ${id}
    `) as SequenceRow[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getStepsForSequence(sequenceId: number): Promise<SequenceStepRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, sequence_id, step_order, kind, payload, delay_seconds, created_at
      FROM sequence_steps
      WHERE sequence_id = ${sequenceId}
      ORDER BY step_order ASC
    `) as SequenceStepRow[];
    return rows;
  } catch {
    return [];
  }
}

export async function getEnrollmentsForSequence(sequenceId: number, limit = 100): Promise<EnrollmentRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, sequence_id, contact_id, current_step_order, status,
             exit_reason, next_run_at, enrolled_at, last_step_at
      FROM sequence_enrollments
      WHERE sequence_id = ${sequenceId}
      ORDER BY enrolled_at DESC
      LIMIT ${limit}
    `) as EnrollmentRow[];
    return rows;
  } catch {
    return [];
  }
}

export async function getEnrollmentsForContact(contactId: number): Promise<EnrollmentRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, sequence_id, contact_id, current_step_order, status,
             exit_reason, next_run_at, enrolled_at, last_step_at
      FROM sequence_enrollments
      WHERE contact_id = ${contactId}
      ORDER BY enrolled_at DESC
    `) as EnrollmentRow[];
    return rows;
  } catch {
    return [];
  }
}

export function describeStep(step: SequenceStepRow): string {
  switch (step.kind) {
    case "email": {
      const subject = (step.payload as { subject?: string })?.subject;
      return subject ? `Email: ${subject}` : "Email (subject not set)";
    }
    case "task": {
      const title = (step.payload as { title?: string })?.title;
      return title ? `Task: ${title}` : "Task (title not set)";
    }
    case "tag": {
      const tag = (step.payload as { tag?: string })?.tag;
      return tag ? `Add tag "${tag}"` : "Tag step (tag not set)";
    }
    case "stage_change": {
      const stage = (step.payload as { stage?: string })?.stage;
      return stage ? `Move open deals to "${stage}"` : "Stage change (target not set)";
    }
    case "wait":
      return "Wait";
  }
}

export function formatDelay(seconds: number): string {
  if (seconds <= 0) return "immediately";
  const days = Math.floor(seconds / 86400);
  if (days > 0) {
    const hours = Math.floor((seconds % 86400) / 3600);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  const hours = Math.floor(seconds / 3600);
  if (hours > 0) {
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  const mins = Math.floor(seconds / 60);
  return `${mins}m`;
}
