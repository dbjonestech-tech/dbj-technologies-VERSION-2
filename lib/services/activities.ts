import { getDb } from "@/lib/db";

export type ActivityType = "note" | "call" | "meeting" | "task" | "email";

export const ACTIVITY_TYPES: readonly ActivityType[] = [
  "note",
  "call",
  "meeting",
  "task",
  "email",
];

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export const TASK_PRIORITIES: readonly TaskPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

export interface ActivityRow {
  id: number;
  type: ActivityType;
  contact_id: number | null;
  deal_id: number | null;
  owner_user_id: string | null;
  owner_email: string | null;
  payload: Record<string, unknown>;
  occurred_at: string;
  due_at: string | null;
  completed_at: string | null;
  priority: TaskPriority | null;
  created_at: string;
  updated_at: string;
}

/* Type-specific payload shapes the ActivityComposer writes. */
export interface NotePayload { body: string }
export interface CallPayload { direction: "in" | "out"; duration_seconds?: number; outcome?: string; body?: string }
export interface MeetingPayload { scheduled_at?: string; attendees?: string; location?: string; body?: string }
export interface TaskPayload { title: string; body?: string }
export interface EmailPayload { subject: string; body: string; from?: string; to?: string[] }

export async function getActivitiesForContact(contactId: number, limit = 100): Promise<ActivityRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, type, contact_id, deal_id, owner_user_id, owner_email,
             payload, occurred_at, due_at, completed_at, priority,
             created_at, updated_at
      FROM activities
      WHERE contact_id = ${contactId}
      ORDER BY occurred_at DESC
      LIMIT ${limit}
    `) as ActivityRow[];
    return rows;
  } catch {
    return [];
  }
}

export async function getActivitiesForDeal(dealId: number, limit = 100): Promise<ActivityRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, type, contact_id, deal_id, owner_user_id, owner_email,
             payload, occurred_at, due_at, completed_at, priority,
             created_at, updated_at
      FROM activities
      WHERE deal_id = ${dealId}
      ORDER BY occurred_at DESC
      LIMIT ${limit}
    `) as ActivityRow[];
    return rows;
  } catch {
    return [];
  }
}

export interface ActivityCounts {
  total: number;
  by_type: Partial<Record<ActivityType, number>>;
  open_tasks: number;
  overdue_tasks: number;
}

export async function getActivityCountsForContact(contactId: number): Promise<ActivityCounts> {
  const fallback: ActivityCounts = { total: 0, by_type: {}, open_tasks: 0, overdue_tasks: 0 };
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE type = 'note')::int    AS notes,
        COUNT(*) FILTER (WHERE type = 'call')::int    AS calls,
        COUNT(*) FILTER (WHERE type = 'meeting')::int AS meetings,
        COUNT(*) FILTER (WHERE type = 'task')::int    AS tasks,
        COUNT(*) FILTER (WHERE type = 'email')::int   AS emails,
        COUNT(*) FILTER (WHERE type = 'task' AND completed_at IS NULL)::int AS open_tasks,
        COUNT(*) FILTER (WHERE type = 'task' AND completed_at IS NULL AND due_at IS NOT NULL AND due_at < NOW())::int AS overdue_tasks
      FROM activities
      WHERE contact_id = ${contactId}
    `) as Array<{
      total: number;
      notes: number;
      calls: number;
      meetings: number;
      tasks: number;
      emails: number;
      open_tasks: number;
      overdue_tasks: number;
    }>;
    const r = rows[0];
    if (!r) return fallback;
    return {
      total: r.total,
      by_type: {
        note: r.notes,
        call: r.calls,
        meeting: r.meetings,
        task: r.tasks,
        email: r.emails,
      },
      open_tasks: r.open_tasks,
      overdue_tasks: r.overdue_tasks,
    };
  } catch {
    return fallback;
  }
}

/* Activity title for timeline rendering. Pulled from payload-specific
 * fields so the timeline doesn't have to know each shape. */
export function activityTitle(row: ActivityRow): string {
  const p = row.payload ?? {};
  switch (row.type) {
    case "note":
      return typeof p.body === "string" && p.body.length > 0
        ? truncate(p.body, 80)
        : "Note";
    case "call": {
      const direction = typeof p.direction === "string" ? p.direction : "";
      const outcome = typeof p.outcome === "string" ? p.outcome : "";
      return `${direction === "in" ? "Inbound call" : direction === "out" ? "Outbound call" : "Call"}${outcome ? ` - ${outcome}` : ""}`;
    }
    case "meeting": {
      const at = typeof p.scheduled_at === "string" ? p.scheduled_at : null;
      return at ? `Meeting (${new Date(at).toLocaleString()})` : "Meeting";
    }
    case "task":
      return typeof p.title === "string" && p.title.length > 0 ? p.title : "Task";
    case "email":
      return typeof p.subject === "string" && p.subject.length > 0
        ? `Email: ${truncate(p.subject, 60)}`
        : "Email";
  }
}

export function activityDetail(row: ActivityRow): string | null {
  const p = row.payload ?? {};
  if (row.type === "note") return null;
  const body = typeof p.body === "string" ? p.body : null;
  if (!body) return null;
  return truncate(body, 240);
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}
