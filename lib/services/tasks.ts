import { getDb } from "@/lib/db";
import type { ActivityRow, TaskPriority } from "./activities";

export interface TaskRow extends ActivityRow {
  contact_email: string | null;
  contact_name: string | null;
  deal_name: string | null;
}

export type TaskFilter = {
  ownerEmail?: string | null;
  scope?: "mine" | "all";
  status?: "open" | "overdue" | "completed" | "all_open";
  priority?: TaskPriority | "all";
  limit?: number;
};

export async function getTasks(filter: TaskFilter = {}): Promise<TaskRow[]> {
  const limit = filter.limit ?? 200;
  try {
    const sql = getDb();
    /* Build the WHERE clause via a series of conditions that always
     * include type='task'. Each branch is small enough that inline
     * SQL is clearer than a query builder. */
    const isMine = filter.scope === "mine" && filter.ownerEmail;
    const status = filter.status ?? "all_open";
    const priority = filter.priority && filter.priority !== "all" ? filter.priority : null;

    if (isMine && status === "open" && priority) {
      return (await sql`
        SELECT a.*, c.email AS contact_email, c.name AS contact_name, d.name AS deal_name
        FROM activities a
        LEFT JOIN contacts c ON c.id = a.contact_id
        LEFT JOIN deals d ON d.id = a.deal_id
        WHERE a.type = 'task' AND a.completed_at IS NULL
          AND a.owner_email = ${filter.ownerEmail}
          AND a.priority = ${priority}
        ORDER BY (a.due_at IS NULL) ASC, a.due_at ASC, a.created_at DESC
        LIMIT ${limit}
      `) as TaskRow[];
    }
    if (isMine && status === "overdue") {
      return (await sql`
        SELECT a.*, c.email AS contact_email, c.name AS contact_name, d.name AS deal_name
        FROM activities a
        LEFT JOIN contacts c ON c.id = a.contact_id
        LEFT JOIN deals d ON d.id = a.deal_id
        WHERE a.type = 'task' AND a.completed_at IS NULL
          AND a.due_at IS NOT NULL AND a.due_at < NOW()
          AND a.owner_email = ${filter.ownerEmail}
        ORDER BY a.due_at ASC
        LIMIT ${limit}
      `) as TaskRow[];
    }
    if (isMine && status === "completed") {
      return (await sql`
        SELECT a.*, c.email AS contact_email, c.name AS contact_name, d.name AS deal_name
        FROM activities a
        LEFT JOIN contacts c ON c.id = a.contact_id
        LEFT JOIN deals d ON d.id = a.deal_id
        WHERE a.type = 'task' AND a.completed_at IS NOT NULL
          AND a.owner_email = ${filter.ownerEmail}
        ORDER BY a.completed_at DESC
        LIMIT ${limit}
      `) as TaskRow[];
    }
    if (isMine) {
      /* mine + all_open */
      return (await sql`
        SELECT a.*, c.email AS contact_email, c.name AS contact_name, d.name AS deal_name
        FROM activities a
        LEFT JOIN contacts c ON c.id = a.contact_id
        LEFT JOIN deals d ON d.id = a.deal_id
        WHERE a.type = 'task' AND a.completed_at IS NULL
          AND a.owner_email = ${filter.ownerEmail}
        ORDER BY (a.due_at IS NULL) ASC, a.due_at ASC, a.created_at DESC
        LIMIT ${limit}
      `) as TaskRow[];
    }
    if (status === "overdue") {
      return (await sql`
        SELECT a.*, c.email AS contact_email, c.name AS contact_name, d.name AS deal_name
        FROM activities a
        LEFT JOIN contacts c ON c.id = a.contact_id
        LEFT JOIN deals d ON d.id = a.deal_id
        WHERE a.type = 'task' AND a.completed_at IS NULL
          AND a.due_at IS NOT NULL AND a.due_at < NOW()
        ORDER BY a.due_at ASC
        LIMIT ${limit}
      `) as TaskRow[];
    }
    if (status === "completed") {
      return (await sql`
        SELECT a.*, c.email AS contact_email, c.name AS contact_name, d.name AS deal_name
        FROM activities a
        LEFT JOIN contacts c ON c.id = a.contact_id
        LEFT JOIN deals d ON d.id = a.deal_id
        WHERE a.type = 'task' AND a.completed_at IS NOT NULL
        ORDER BY a.completed_at DESC
        LIMIT ${limit}
      `) as TaskRow[];
    }
    if (priority) {
      return (await sql`
        SELECT a.*, c.email AS contact_email, c.name AS contact_name, d.name AS deal_name
        FROM activities a
        LEFT JOIN contacts c ON c.id = a.contact_id
        LEFT JOIN deals d ON d.id = a.deal_id
        WHERE a.type = 'task' AND a.completed_at IS NULL
          AND a.priority = ${priority}
        ORDER BY (a.due_at IS NULL) ASC, a.due_at ASC, a.created_at DESC
        LIMIT ${limit}
      `) as TaskRow[];
    }
    /* default: all open tasks across all owners */
    return (await sql`
      SELECT a.*, c.email AS contact_email, c.name AS contact_name, d.name AS deal_name
      FROM activities a
      LEFT JOIN contacts c ON c.id = a.contact_id
      LEFT JOIN deals d ON d.id = a.deal_id
      WHERE a.type = 'task' AND a.completed_at IS NULL
      ORDER BY (a.due_at IS NULL) ASC, a.due_at ASC, a.created_at DESC
      LIMIT ${limit}
    `) as TaskRow[];
  } catch {
    return [];
  }
}

export interface TodayTasksSummary {
  due_today: number;
  overdue: number;
  due_this_week: number;
  next_due: TaskRow | null;
}

/* Powers the dashboard "Today's Tasks" card. Single round-trip,
 * scoped to the current operator's tasks. */
export async function getTodayTasksSummary(ownerEmail: string | null): Promise<TodayTasksSummary> {
  const fallback: TodayTasksSummary = { due_today: 0, overdue: 0, due_this_week: 0, next_due: null };
  try {
    const sql = getDb();
    const ownerFilter = ownerEmail ? sql`AND a.owner_email = ${ownerEmail}` : sql``;
    const counts = (await sql`
      SELECT
        COUNT(*) FILTER (
          WHERE due_at IS NOT NULL
            AND due_at >= date_trunc('day', NOW())
            AND due_at <  date_trunc('day', NOW()) + INTERVAL '1 day'
        )::int AS due_today,
        COUNT(*) FILTER (
          WHERE due_at IS NOT NULL AND due_at < NOW()
        )::int AS overdue,
        COUNT(*) FILTER (
          WHERE due_at IS NOT NULL
            AND due_at >= NOW()
            AND due_at <  date_trunc('day', NOW()) + INTERVAL '7 days'
        )::int AS due_this_week
      FROM activities a
      WHERE a.type = 'task' AND a.completed_at IS NULL
        ${ownerFilter}
    `) as Array<{ due_today: number; overdue: number; due_this_week: number }>;

    const next = (await sql`
      SELECT a.*, c.email AS contact_email, c.name AS contact_name, d.name AS deal_name
      FROM activities a
      LEFT JOIN contacts c ON c.id = a.contact_id
      LEFT JOIN deals   d ON d.id = a.deal_id
      WHERE a.type = 'task' AND a.completed_at IS NULL AND a.due_at IS NOT NULL
        ${ownerFilter}
      ORDER BY a.due_at ASC
      LIMIT 1
    `) as TaskRow[];

    const c = counts[0];
    return {
      due_today: c?.due_today ?? 0,
      overdue: c?.overdue ?? 0,
      due_this_week: c?.due_this_week ?? 0,
      next_due: next[0] ?? null,
    };
  } catch {
    return fallback;
  }
}
