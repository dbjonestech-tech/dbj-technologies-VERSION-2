import { getDb } from "@/lib/db";
import { DEAL_STAGES, OPEN_STAGES, type DealStage } from "@/lib/services/deals";

/* Pipeline-level analytics. All read-only against existing deals +
 * activities + scans + contacts tables; no new writes, no new
 * migration. Phase 7 adds the surface; aggregations stay derivable so
 * a future change to the underlying schema doesn't strand a
 * denormalized snapshot. */

export interface StageFunnelRow {
  stage: DealStage;
  open_count: number;
  closed_count: number;
  open_value_cents: number;
}

export interface WinRateBucket {
  bucket_start: string;
  won: number;
  lost: number;
  win_rate_pct: number;
}

export interface RevenueBucket {
  bucket_start: string;
  won_cents: number;
  won_count: number;
}

export interface SourceAttributionRow {
  source: string;
  contacts: number;
  deals_won: number;
  won_value_cents: number;
}

export interface LossReasonRow {
  reason: string;
  count: number;
  forfeited_value_cents: number;
}

export interface AvgTimeInStageRow {
  stage: DealStage;
  avg_days: number | null;
  sample_size: number;
}

export interface PipelineSummary {
  funnel: StageFunnelRow[];
  win_rate_30d_pct: number | null;
  win_rate_90d_pct: number | null;
  avg_deal_size_cents: number | null;
  avg_sales_cycle_days: number | null;
  open_pipeline_cents: number;
  weighted_pipeline_cents: number;
}

export async function getStageFunnel(): Promise<StageFunnelRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        stage,
        COUNT(*) FILTER (WHERE closed_at IS NULL)::int AS open_count,
        COUNT(*) FILTER (WHERE closed_at IS NOT NULL)::int AS closed_count,
        COALESCE(SUM(value_cents) FILTER (WHERE closed_at IS NULL), 0)::bigint AS open_value_cents
      FROM deals
      GROUP BY stage
    `) as Array<{ stage: DealStage; open_count: number; closed_count: number; open_value_cents: number }>;

    const byStage = new Map(rows.map((r) => [r.stage, r]));
    return DEAL_STAGES.map((stage) => {
      const r = byStage.get(stage);
      return {
        stage,
        open_count: r?.open_count ?? 0,
        closed_count: r?.closed_count ?? 0,
        open_value_cents: Number(r?.open_value_cents ?? 0),
      };
    });
  } catch {
    return DEAL_STAGES.map((stage) => ({
      stage,
      open_count: 0,
      closed_count: 0,
      open_value_cents: 0,
    }));
  }
}

export async function getWinRate(periodDays: number): Promise<number | null> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        COUNT(*) FILTER (WHERE won = TRUE)::int  AS won,
        COUNT(*) FILTER (WHERE won = FALSE)::int AS lost
      FROM deals
      WHERE closed_at IS NOT NULL
        AND closed_at >= NOW() - (${periodDays}::int || ' days')::interval
    `) as Array<{ won: number; lost: number }>;
    const won = rows[0]?.won ?? 0;
    const lost = rows[0]?.lost ?? 0;
    const total = won + lost;
    if (total === 0) return null;
    return Math.round((won / total) * 1000) / 10;
  } catch {
    return null;
  }
}

export async function getAvgDealSize(periodDays: number): Promise<number | null> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT AVG(value_cents)::bigint AS avg_cents
      FROM deals
      WHERE won = TRUE
        AND closed_at >= NOW() - (${periodDays}::int || ' days')::interval
    `) as Array<{ avg_cents: number | null }>;
    const v = rows[0]?.avg_cents;
    return v === null || v === undefined ? null : Number(v);
  } catch {
    return null;
  }
}

export async function getAvgSalesCycleDays(periodDays: number): Promise<number | null> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT AVG(EXTRACT(EPOCH FROM (closed_at - created_at)) / 86400)::float AS avg_days
      FROM deals
      WHERE won = TRUE
        AND closed_at >= NOW() - (${periodDays}::int || ' days')::interval
    `) as Array<{ avg_days: number | null }>;
    const v = rows[0]?.avg_days;
    if (v === null || v === undefined) return null;
    return Math.round(v * 10) / 10;
  } catch {
    return null;
  }
}

/* No stage-history table exists in the current schema, so per-stage
 * residence time isn't directly recoverable. The closest proxy: for
 * deals currently in each open stage, how long has the deal been
 * around (created_at -> now). For closed stages, closed_at -
 * created_at. This is a "time spent in pipeline before reaching this
 * stage" approximation, not a true Markovian residence time, and the
 * UI labels it accordingly. */
export async function getApproxTimeInStage(): Promise<AvgTimeInStageRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        stage,
        AVG(EXTRACT(EPOCH FROM (COALESCE(closed_at, NOW()) - created_at)) / 86400)::float AS avg_days,
        COUNT(*)::int AS sample_size
      FROM deals
      GROUP BY stage
    `) as Array<{ stage: DealStage; avg_days: number | null; sample_size: number }>;
    const byStage = new Map(rows.map((r) => [r.stage, r]));
    return DEAL_STAGES.map((stage) => {
      const r = byStage.get(stage);
      return {
        stage,
        avg_days: r?.avg_days === null || r?.avg_days === undefined ? null : Math.round(r.avg_days * 10) / 10,
        sample_size: r?.sample_size ?? 0,
      };
    });
  } catch {
    return DEAL_STAGES.map((stage) => ({ stage, avg_days: null, sample_size: 0 }));
  }
}

export async function getRevenueByMonth(monthsBack: number): Promise<RevenueBucket[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', NOW()) - (${monthsBack}::int - 1) * INTERVAL '1 month',
          date_trunc('month', NOW()),
          INTERVAL '1 month'
        ) AS bucket_start
      )
      SELECT
        m.bucket_start::text AS bucket_start,
        COALESCE(SUM(d.value_cents) FILTER (WHERE d.won = TRUE), 0)::bigint AS won_cents,
        COUNT(d.id) FILTER (WHERE d.won = TRUE)::int AS won_count
      FROM months m
      LEFT JOIN deals d
        ON date_trunc('month', d.closed_at) = m.bucket_start
      GROUP BY m.bucket_start
      ORDER BY m.bucket_start ASC
    `) as Array<{ bucket_start: string; won_cents: number; won_count: number }>;
    return rows.map((r) => ({
      bucket_start: r.bucket_start,
      won_cents: Number(r.won_cents),
      won_count: r.won_count,
    }));
  } catch {
    return [];
  }
}

export async function getSourceAttribution(periodDays: number): Promise<SourceAttributionRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        c.source,
        COUNT(DISTINCT c.id)::int AS contacts,
        COUNT(DISTINCT d.id) FILTER (WHERE d.won = TRUE)::int AS deals_won,
        COALESCE(SUM(d.value_cents) FILTER (WHERE d.won = TRUE), 0)::bigint AS won_value_cents
      FROM contacts c
      LEFT JOIN deals d ON d.contact_id = c.id
        AND d.closed_at >= NOW() - (${periodDays}::int || ' days')::interval
      WHERE c.created_at >= NOW() - (${periodDays}::int || ' days')::interval
      GROUP BY c.source
      ORDER BY contacts DESC
    `) as Array<{ source: string; contacts: number; deals_won: number; won_value_cents: number }>;
    return rows.map((r) => ({
      source: r.source ?? "unknown",
      contacts: r.contacts,
      deals_won: r.deals_won,
      won_value_cents: Number(r.won_value_cents),
    }));
  } catch {
    return [];
  }
}

export async function getLossReasons(periodDays: number): Promise<LossReasonRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        COALESCE(NULLIF(TRIM(loss_reason), ''), 'unspecified') AS reason,
        COUNT(*)::int AS count,
        COALESCE(SUM(value_cents), 0)::bigint AS forfeited_value_cents
      FROM deals
      WHERE won = FALSE
        AND closed_at >= NOW() - (${periodDays}::int || ' days')::interval
      GROUP BY reason
      ORDER BY count DESC, forfeited_value_cents DESC
    `) as Array<{ reason: string; count: number; forfeited_value_cents: number }>;
    return rows.map((r) => ({
      reason: r.reason,
      count: r.count,
      forfeited_value_cents: Number(r.forfeited_value_cents),
    }));
  } catch {
    return [];
  }
}

export async function getPipelineSummary(): Promise<PipelineSummary> {
  const [funnel, win30, win90, avgSize, cycle] = await Promise.all([
    getStageFunnel(),
    getWinRate(30),
    getWinRate(90),
    getAvgDealSize(90),
    getAvgSalesCycleDays(180),
  ]);

  const open_pipeline_cents = funnel
    .filter((r) => OPEN_STAGES.includes(r.stage))
    .reduce((sum, r) => sum + r.open_value_cents, 0);

  return {
    funnel,
    win_rate_30d_pct: win30,
    win_rate_90d_pct: win90,
    avg_deal_size_cents: avgSize,
    avg_sales_cycle_days: cycle,
    open_pipeline_cents,
    weighted_pipeline_cents: 0,
  };
}
