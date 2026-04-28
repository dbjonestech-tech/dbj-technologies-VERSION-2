import { getDb } from "@/lib/db";

/**
 * Real-user CWV (RUM) read APIs over page_view_engagement.
 *
 * The engagement beacon collects LCP, INP, CLS, FCP, TTFB on every
 * non-bot page view; these helpers aggregate those values into the
 * percentile bands the dashboard renders.
 *
 * Percentile thresholds are computed via PERCENTILE_CONT, which
 * returns a continuous interpolation. For LCP/INP/TTFB/FCP we round
 * to integer milliseconds; for CLS we keep four decimals because the
 * metric runs 0.00..0.50 in practice and a single decimal hides
 * regressions.
 */

export type RumByPage = {
  path: string;
  views: number;
  lcp: PercentileBand;
  inp: PercentileBand;
  cls: PercentileBand;
  ttfb: PercentileBand;
  fcp: PercentileBand;
};

export type PercentileBand = {
  p50: number | null;
  p75: number | null;
  p95: number | null;
};

export async function getRumByPage(
  intervalDays: number,
  deviceType?: "mobile" | "tablet" | "desktop" | null,
  limit = 25
): Promise<RumByPage[]> {
  try {
    const sql = getDb();
    const days = Math.max(1, Math.min(90, intervalDays));
    const interval = `${days} days`;
    const cap = Math.max(1, Math.min(200, limit));

  /* Branching the query on device filter rather than building one
   * mega-CASE in the WHERE clause: keeps the planner using the
   * (path, created_at) index for both the unfiltered and filtered
   * paths. */
  const rows = (deviceType
    ? ((await sql`
        SELECT
          pv.path,
          COUNT(*)::int AS views,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY eng.cwv_lcp_ms)::int AS lcp_p50,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY eng.cwv_lcp_ms)::int AS lcp_p75,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY eng.cwv_lcp_ms)::int AS lcp_p95,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY eng.cwv_inp_ms)::int AS inp_p50,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY eng.cwv_inp_ms)::int AS inp_p75,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY eng.cwv_inp_ms)::int AS inp_p95,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY eng.cwv_cls)::float8 AS cls_p50,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY eng.cwv_cls)::float8 AS cls_p75,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY eng.cwv_cls)::float8 AS cls_p95,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY eng.cwv_ttfb_ms)::int AS ttfb_p50,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY eng.cwv_ttfb_ms)::int AS ttfb_p75,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY eng.cwv_ttfb_ms)::int AS ttfb_p95,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY eng.cwv_fcp_ms)::int AS fcp_p50,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY eng.cwv_fcp_ms)::int AS fcp_p75,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY eng.cwv_fcp_ms)::int AS fcp_p95
        FROM page_views pv
        JOIN page_view_engagement eng ON eng.page_view_id = pv.id
        WHERE pv.created_at > now() - (${interval})::interval
          AND pv.is_bot = false
          AND pv.device_type = ${deviceType}
        GROUP BY pv.path
        ORDER BY views DESC
        LIMIT ${cap}
      `) as RumRowDb[])
    : ((await sql`
        SELECT
          pv.path,
          COUNT(*)::int AS views,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY eng.cwv_lcp_ms)::int AS lcp_p50,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY eng.cwv_lcp_ms)::int AS lcp_p75,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY eng.cwv_lcp_ms)::int AS lcp_p95,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY eng.cwv_inp_ms)::int AS inp_p50,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY eng.cwv_inp_ms)::int AS inp_p75,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY eng.cwv_inp_ms)::int AS inp_p95,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY eng.cwv_cls)::float8 AS cls_p50,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY eng.cwv_cls)::float8 AS cls_p75,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY eng.cwv_cls)::float8 AS cls_p95,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY eng.cwv_ttfb_ms)::int AS ttfb_p50,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY eng.cwv_ttfb_ms)::int AS ttfb_p75,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY eng.cwv_ttfb_ms)::int AS ttfb_p95,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY eng.cwv_fcp_ms)::int AS fcp_p50,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY eng.cwv_fcp_ms)::int AS fcp_p75,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY eng.cwv_fcp_ms)::int AS fcp_p95
        FROM page_views pv
        JOIN page_view_engagement eng ON eng.page_view_id = pv.id
        WHERE pv.created_at > now() - (${interval})::interval
          AND pv.is_bot = false
        GROUP BY pv.path
        ORDER BY views DESC
        LIMIT ${cap}
      `) as RumRowDb[])
    );

    return rows.map((r) => ({
      path: r.path,
      views: Number(r.views),
      lcp: { p50: r.lcp_p50, p75: r.lcp_p75, p95: r.lcp_p95 },
      inp: { p50: r.inp_p50, p75: r.inp_p75, p95: r.inp_p95 },
      cls: {
        p50: r.cls_p50 === null ? null : Number(Number(r.cls_p50).toFixed(4)),
        p75: r.cls_p75 === null ? null : Number(Number(r.cls_p75).toFixed(4)),
        p95: r.cls_p95 === null ? null : Number(Number(r.cls_p95).toFixed(4)),
      },
      ttfb: { p50: r.ttfb_p50, p75: r.ttfb_p75, p95: r.ttfb_p95 },
      fcp: { p50: r.fcp_p50, p75: r.fcp_p75, p95: r.fcp_p95 },
    }));
  } catch (err) {
    console.warn(
      `[rum] getRumByPage failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

type RumRowDb = {
  path: string;
  views: number;
  lcp_p50: number | null;
  lcp_p75: number | null;
  lcp_p95: number | null;
  inp_p50: number | null;
  inp_p75: number | null;
  inp_p95: number | null;
  cls_p50: number | null;
  cls_p75: number | null;
  cls_p95: number | null;
  ttfb_p50: number | null;
  ttfb_p75: number | null;
  ttfb_p95: number | null;
  fcp_p50: number | null;
  fcp_p75: number | null;
  fcp_p95: number | null;
};

export type RumOverview = {
  views: number;
  lcp: PercentileBand;
  inp: PercentileBand;
  cls: PercentileBand;
};

const EMPTY_RUM_OVERVIEW: RumOverview = {
  views: 0,
  lcp: { p50: null, p75: null, p95: null },
  inp: { p50: null, p75: null, p95: null },
  cls: { p50: null, p75: null, p95: null },
};

export async function getRumOverview(intervalDays: number): Promise<RumOverview> {
  try {
    const sql = getDb();
    const days = Math.max(1, Math.min(90, intervalDays));
    const interval = `${days} days`;
    const rows = (await sql`
      SELECT
        COUNT(*)::int AS views,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY eng.cwv_lcp_ms)::int AS lcp_p50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY eng.cwv_lcp_ms)::int AS lcp_p75,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY eng.cwv_lcp_ms)::int AS lcp_p95,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY eng.cwv_inp_ms)::int AS inp_p50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY eng.cwv_inp_ms)::int AS inp_p75,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY eng.cwv_inp_ms)::int AS inp_p95,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY eng.cwv_cls)::float8 AS cls_p50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY eng.cwv_cls)::float8 AS cls_p75,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY eng.cwv_cls)::float8 AS cls_p95
      FROM page_views pv
      JOIN page_view_engagement eng ON eng.page_view_id = pv.id
      WHERE pv.created_at > now() - (${interval})::interval
        AND pv.is_bot = false
    `) as Array<{
      views: number;
      lcp_p50: number | null;
      lcp_p75: number | null;
      lcp_p95: number | null;
      inp_p50: number | null;
      inp_p75: number | null;
      inp_p95: number | null;
      cls_p50: number | null;
      cls_p75: number | null;
      cls_p95: number | null;
    }>;
    const r = rows[0];
    if (!r) return EMPTY_RUM_OVERVIEW;
    return {
      views: Number(r.views),
      lcp: { p50: r.lcp_p50, p75: r.lcp_p75, p95: r.lcp_p95 },
      inp: { p50: r.inp_p50, p75: r.inp_p75, p95: r.inp_p95 },
      cls: {
        p50: r.cls_p50 === null ? null : Number(Number(r.cls_p50).toFixed(4)),
        p75: r.cls_p75 === null ? null : Number(Number(r.cls_p75).toFixed(4)),
        p95: r.cls_p95 === null ? null : Number(Number(r.cls_p95).toFixed(4)),
      },
    };
  } catch (err) {
    console.warn(
      `[rum] getRumOverview failed: ${err instanceof Error ? err.message : err}`
    );
    return EMPTY_RUM_OVERVIEW;
  }
}
