import { getDb } from "@/lib/db";

/**
 * Funnel cohort read APIs over the materialized views in
 * migrations/015_funnel_cohorts.sql.
 *
 * funnelRefreshHourly (Inngest cron in lib/inngest/functions.ts) keeps
 * these views fresh. All read functions tolerate stale data -- a missed
 * refresh just means the dashboard lags by the cron interval.
 *
 * If the views have not been refreshed since the migration was applied
 * (fresh deploy), they return zero rows and the dashboard renders an
 * empty state. The first cron run hydrates them.
 */

export async function refreshFunnelViews(): Promise<{ ok: boolean }> {
  try {
    const sql = getDb();
    /* CONCURRENTLY would let dashboards keep reading during refresh,
     * but it requires a UNIQUE index on the view. The current view
     * shape (multi-column GROUP BY) makes that fiddly; the cron runs
     * hourly off-peak and the views are small enough that a brief
     * exclusive lock is acceptable. Revisit if dashboard read traffic
     * grows. */
    await sql`REFRESH MATERIALIZED VIEW funnel_daily_v`;
    await sql`REFRESH MATERIALIZED VIEW funnel_cohort_weekly_v`;
    return { ok: true };
  } catch (err) {
    console.warn(
      `[funnel] refresh failed: ${err instanceof Error ? err.message : err}`
    );
    return { ok: false };
  }
}

export type FunnelStage = {
  label: string;
  count: number;
  pctOfPrevious: number | null;
  pctOfTop: number | null;
};

const EMPTY_STAGES: FunnelStage[] = [
  { label: "Sessions", count: 0, pctOfPrevious: null, pctOfTop: null },
  { label: "Pathlight scans started", count: 0, pctOfPrevious: null, pctOfTop: null },
  { label: "Scans completed", count: 0, pctOfPrevious: null, pctOfTop: null },
  { label: "Contact submissions", count: 0, pctOfPrevious: null, pctOfTop: null },
];

/**
 * Single-window funnel stages for the Sankey-style display:
 * sessions -> scan_starts -> scans_completed -> contact_submissions.
 */
export async function getFunnelStages(
  intervalDays: number
): Promise<FunnelStage[]> {
  try {
    const sql = getDb();
    const days = Math.max(1, Math.min(365, intervalDays));
    const interval = `${days} days`;
    const rows = (await sql`
      SELECT
        COUNT(*)::int AS sessions,
        COUNT(*) FILTER (WHERE converted_scan_id IS NOT NULL)::int AS scan_starts,
        COUNT(*) FILTER (
          WHERE converted_scan_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM scans
              WHERE scans.id = sessions.converted_scan_id
                AND scans.status IN ('complete', 'partial')
            )
        )::int AS scans_completed,
        COUNT(*) FILTER (WHERE converted_contact_id IS NOT NULL)::int AS contact_submissions
      FROM sessions
      WHERE started_at > now() - (${interval})::interval
        AND is_bot = false
    `) as {
      sessions: number;
      scan_starts: number;
      scans_completed: number;
      contact_submissions: number;
    }[];

    const r = rows[0] ?? {
      sessions: 0,
      scan_starts: 0,
      scans_completed: 0,
      contact_submissions: 0,
    };

    const counts = [
      { label: "Sessions", count: Number(r.sessions) },
      { label: "Pathlight scans started", count: Number(r.scan_starts) },
      { label: "Scans completed", count: Number(r.scans_completed) },
      { label: "Contact submissions", count: Number(r.contact_submissions) },
    ];

    const top = counts[0]?.count ?? 0;
    return counts.map((c, i) => {
      const previous = i === 0 ? null : counts[i - 1]!.count;
      return {
        label: c.label,
        count: c.count,
        pctOfPrevious:
          previous && previous > 0 ? Number(((c.count / previous) * 100).toFixed(1)) : null,
        pctOfTop: top > 0 ? Number(((c.count / top) * 100).toFixed(1)) : null,
      };
    });
  } catch (err) {
    console.warn(
      `[funnel] getFunnelStages failed: ${err instanceof Error ? err.message : err}`
    );
    return EMPTY_STAGES;
  }
}

export type FunnelBySourceRow = {
  source: string;
  sessions: number;
  scanStarts: number;
  scansCompleted: number;
  contactSubmissions: number;
  scanRate: number;
  contactRate: number;
};

export async function getFunnelBySource(
  intervalDays: number,
  limit = 25
): Promise<FunnelBySourceRow[]> {
  try {
    const sql = getDb();
    const days = Math.max(1, Math.min(365, intervalDays));
    const rows = (await sql`
      SELECT
        source,
        SUM(sessions)::int AS sessions,
        SUM(scan_starts)::int AS scan_starts,
        SUM(scans_completed)::int AS scans_completed,
        SUM(contact_submissions)::int AS contact_submissions
      FROM funnel_daily_v
      WHERE day > now() - (${`${days} days`})::interval
      GROUP BY source
      ORDER BY sessions DESC
      LIMIT ${Math.max(1, Math.min(200, limit))}
    `) as {
      source: string;
      sessions: number;
      scan_starts: number;
      scans_completed: number;
      contact_submissions: number;
    }[];
    return rows.map((r) => {
      const sessions = Number(r.sessions);
      const scanStarts = Number(r.scan_starts);
      const contactSubmissions = Number(r.contact_submissions);
      return {
        source: r.source,
        sessions,
        scanStarts,
        scansCompleted: Number(r.scans_completed),
        contactSubmissions,
        scanRate: sessions > 0 ? Number(((scanStarts / sessions) * 100).toFixed(2)) : 0,
        contactRate:
          sessions > 0 ? Number(((contactSubmissions / sessions) * 100).toFixed(2)) : 0,
      };
    });
  } catch (err) {
    console.warn(
      `[funnel] getFunnelBySource failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

export type CohortCell = {
  cohortWeek: string;
  weekOffset: number;
  activeSessions: number;
  scanConversions: number;
  contactConversions: number;
};

export async function getCohortGrid(
  weeks = 8
): Promise<CohortCell[]> {
  try {
    const sql = getDb();
    const cap = Math.max(1, Math.min(12, weeks));
    const rows = (await sql`
      SELECT
        cohort_week::text AS cohort_week,
        week_offset,
        active_sessions,
        scan_conversions,
        contact_conversions
      FROM funnel_cohort_weekly_v
      WHERE cohort_week > now() - (${`${cap} weeks`})::interval
      ORDER BY cohort_week ASC, week_offset ASC
    `) as {
      cohort_week: string;
      week_offset: number;
      active_sessions: number;
      scan_conversions: number;
      contact_conversions: number;
    }[];
    return rows.map((r) => ({
      cohortWeek: r.cohort_week,
      weekOffset: Number(r.week_offset),
      activeSessions: Number(r.active_sessions),
      scanConversions: Number(r.scan_conversions),
      contactConversions: Number(r.contact_conversions),
    }));
  } catch (err) {
    console.warn(
      `[funnel] getCohortGrid failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}
