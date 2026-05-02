import { getDb } from "@/lib/db";

/* Per-contact analytics: a 30-day engagement sparkline derived from
 * the activities table (note + call + meeting + email + task), a
 * response-time estimate based on the gap between inbound and
 * outbound activities on the contact, and a next-best-action
 * heuristic for the contact detail callout.
 *
 * "Engagement" here aggregates Canopy-recorded interactions, not raw
 * site analytics page-views. The two surface in different places:
 * page-views drive /admin/visitors; activities drive the operator's
 * relationship view. Mixing them on the contact page would
 * double-count without informing the operator. */

export interface SparklinePoint {
  date: string;
  count: number;
}

export interface NextBestAction {
  action: string;
  reason: string;
  /* informational: which signal fired the heuristic, in case the UI
   * wants to deep-link or color-code the callout */
  signal:
    | "overdue_task"
    | "stale_contact"
    | "stuck_proposal"
    | "score_regression"
    | "no_open_deal"
    | "fresh_lead"
    | "stay_course";
  link?: { label: string; href: string };
}

export interface ContactAnalytics {
  sparkline: SparklinePoint[];
  totals_30d: {
    notes: number;
    calls: number;
    meetings: number;
    emails: number;
    tasks_completed: number;
    scans: number;
  };
  median_response_minutes: number | null;
  next_best_action: NextBestAction;
}

export async function getEngagementSparkline(contactId: number, days = 30): Promise<SparklinePoint[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      WITH days AS (
        SELECT generate_series(
          (CURRENT_DATE - (${days}::int - 1) * INTERVAL '1 day')::date,
          CURRENT_DATE::date,
          INTERVAL '1 day'
        ) AS d
      )
      SELECT
        days.d::text AS date,
        COALESCE(COUNT(a.id), 0)::int AS count
      FROM days
      LEFT JOIN activities a
        ON a.contact_id = ${contactId}
        AND a.occurred_at::date = days.d::date
      GROUP BY days.d
      ORDER BY days.d ASC
    `) as Array<{ date: string; count: number }>;
    return rows;
  } catch {
    return [];
  }
}

export async function getActivityTotals30d(contactId: number): Promise<ContactAnalytics["totals_30d"]> {
  const fallback = { notes: 0, calls: 0, meetings: 0, emails: 0, tasks_completed: 0, scans: 0 };
  try {
    const sql = getDb();
    const actRows = (await sql`
      SELECT
        COUNT(*) FILTER (WHERE type = 'note')::int    AS notes,
        COUNT(*) FILTER (WHERE type = 'call')::int    AS calls,
        COUNT(*) FILTER (WHERE type = 'meeting')::int AS meetings,
        COUNT(*) FILTER (WHERE type = 'email')::int   AS emails,
        COUNT(*) FILTER (WHERE type = 'task' AND completed_at IS NOT NULL)::int AS tasks_completed
      FROM activities
      WHERE contact_id = ${contactId}
        AND occurred_at >= NOW() - INTERVAL '30 days'
    `) as Array<Pick<ContactAnalytics["totals_30d"], "notes" | "calls" | "meetings" | "emails" | "tasks_completed">>;
    const scanRows = (await sql`
      SELECT COUNT(*)::int AS scans
      FROM scans
      WHERE email = (SELECT email FROM contacts WHERE id = ${contactId})
        AND created_at >= NOW() - INTERVAL '30 days'
    `) as Array<{ scans: number }>;
    return {
      notes: actRows[0]?.notes ?? 0,
      calls: actRows[0]?.calls ?? 0,
      meetings: actRows[0]?.meetings ?? 0,
      emails: actRows[0]?.emails ?? 0,
      tasks_completed: actRows[0]?.tasks_completed ?? 0,
      scans: scanRows[0]?.scans ?? 0,
    };
  } catch {
    return fallback;
  }
}

/* Response time = median minutes between an inbound signal (a scan
 * being submitted, a contact form being filled, an inbound email
 * activity) and the next outbound operator-initiated activity on the
 * same contact (note + call + meeting + outbound email + task
 * completion). When activities don't carry an explicit direction,
 * we treat type='email' with payload.direction='inbound' as inbound
 * and everything else as outbound. */
export async function getMedianResponseMinutes(contactId: number): Promise<number | null> {
  try {
    const sql = getDb();
    const rows = (await sql`
      WITH inbound AS (
        SELECT occurred_at FROM activities
        WHERE contact_id = ${contactId}
          AND (
            (type = 'email' AND COALESCE(payload->>'direction', 'outbound') = 'inbound')
          )
      ),
      outbound AS (
        SELECT occurred_at FROM activities
        WHERE contact_id = ${contactId}
          AND NOT (type = 'email' AND COALESCE(payload->>'direction', 'outbound') = 'inbound')
      ),
      pairs AS (
        SELECT
          i.occurred_at AS in_at,
          (SELECT MIN(o.occurred_at) FROM outbound o WHERE o.occurred_at > i.occurred_at) AS out_at
        FROM inbound i
      )
      SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM (out_at - in_at)) / 60
      )::float AS median_minutes
      FROM pairs
      WHERE out_at IS NOT NULL
    `) as Array<{ median_minutes: number | null }>;
    const v = rows[0]?.median_minutes;
    if (v === null || v === undefined) return null;
    return Math.round(v);
  } catch {
    return null;
  }
}

export async function getNextBestAction(contactId: number): Promise<NextBestAction> {
  const sql = getDb();

  /* 1. Overdue task wins above everything. */
  try {
    const overdue = (await sql`
      SELECT id FROM activities
      WHERE contact_id = ${contactId}
        AND type = 'task'
        AND completed_at IS NULL
        AND due_at IS NOT NULL
        AND due_at < NOW()
      ORDER BY due_at ASC
      LIMIT 1
    `) as Array<{ id: number }>;
    if (overdue.length > 0) {
      return {
        action: "Complete overdue task",
        reason: "A task on this contact is past its due date.",
        signal: "overdue_task",
        link: { label: "Open tasks", href: `/admin/tasks?scope=contact&contactId=${contactId}` },
      };
    }
  } catch {
    /* fall through */
  }

  /* 2. Stuck proposal: open deal in 'proposal' for >= 7 days. */
  try {
    const stuck = (await sql`
      SELECT id FROM deals
      WHERE contact_id = ${contactId}
        AND closed_at IS NULL
        AND stage = 'proposal'
        AND updated_at < NOW() - INTERVAL '7 days'
      ORDER BY updated_at ASC
      LIMIT 1
    `) as Array<{ id: number }>;
    if (stuck.length > 0) {
      return {
        action: "Advance the proposal",
        reason: "An open deal has sat in proposal for over a week.",
        signal: "stuck_proposal",
        link: { label: "Open deal", href: `/admin/deals/${stuck[0].id}` },
      };
    }
  } catch {
    /* fall through */
  }

  /* 3. Pathlight score regression vs. previous scan. */
  try {
    const regression = (await sql`
      SELECT score, previous_score
      FROM pathlight_scans_log
      WHERE contact_id = ${contactId}
        AND score IS NOT NULL
        AND previous_score IS NOT NULL
        AND score < previous_score
      ORDER BY scanned_at DESC
      LIMIT 1
    `) as Array<{ score: number; previous_score: number }>;
    if (regression.length > 0) {
      const r = regression[0];
      return {
        action: "Address Pathlight regression",
        reason: `Latest scan dropped from ${r.previous_score} to ${r.score}.`,
        signal: "score_regression",
      };
    }
  } catch {
    /* fall through */
  }

  /* 4. Stale contact: no activity in 14+ days, has open deal. */
  try {
    const stale = (await sql`
      SELECT
        COALESCE(MAX(a.occurred_at), c.created_at) AS last_touch,
        EXISTS (SELECT 1 FROM deals d WHERE d.contact_id = c.id AND d.closed_at IS NULL) AS has_open_deal
      FROM contacts c
      LEFT JOIN activities a ON a.contact_id = c.id
      WHERE c.id = ${contactId}
      GROUP BY c.id, c.created_at
    `) as Array<{ last_touch: string | null; has_open_deal: boolean }>;
    const r = stale[0];
    if (r?.last_touch) {
      const ageMs = Date.now() - new Date(r.last_touch).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      if (ageDays >= 14 && r.has_open_deal) {
        return {
          action: "Reach out to a stale lead",
          reason: `No recorded activity in ${Math.floor(ageDays)} days, but an open deal exists.`,
          signal: "stale_contact",
        };
      }
      if (ageDays >= 30 && !r.has_open_deal) {
        return {
          action: "Decide: revive or archive",
          reason: `No activity in ${Math.floor(ageDays)} days and no open deal.`,
          signal: "no_open_deal",
        };
      }
    }
  } catch {
    /* fall through */
  }

  /* 5. Fresh lead: created in last 24h, no contact yet. */
  try {
    const fresh = (await sql`
      SELECT
        c.created_at,
        EXISTS (SELECT 1 FROM activities a WHERE a.contact_id = c.id AND a.type IN ('call', 'email', 'meeting')) AS contacted
      FROM contacts c
      WHERE c.id = ${contactId}
    `) as Array<{ created_at: string; contacted: boolean }>;
    const r = fresh[0];
    if (r && !r.contacted) {
      const ageMs = Date.now() - new Date(r.created_at).getTime();
      if (ageMs < 24 * 60 * 60 * 1000) {
        return {
          action: "First-touch this fresh lead",
          reason: "New contact created in the last 24 hours with no outreach yet.",
          signal: "fresh_lead",
        };
      }
    }
  } catch {
    /* fall through */
  }

  return {
    action: "Stay the course",
    reason: "No urgent signals; the contact is on track.",
    signal: "stay_course",
  };
}

export async function getContactAnalytics(contactId: number): Promise<ContactAnalytics> {
  const [sparkline, totals_30d, median_response_minutes, next_best_action] = await Promise.all([
    getEngagementSparkline(contactId, 30),
    getActivityTotals30d(contactId),
    getMedianResponseMinutes(contactId),
    getNextBestAction(contactId),
  ]);
  return { sparkline, totals_30d, median_response_minutes, next_best_action };
}
