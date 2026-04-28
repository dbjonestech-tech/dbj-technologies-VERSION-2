import { getDb } from "@/lib/db";
import { getCurrentDeploymentSummary } from "@/lib/services/vercel-platform";
import { getCurrentBudgetState } from "@/lib/services/anthropic-budget";
import { getLatestInfraStatuses } from "@/lib/services/infrastructure";

/**
 * Compute the dashboard status bar color: green / yellow / red.
 *
 * The bar is a worst-of summary across:
 *   - Vercel production deployment state (ERROR -> red)
 *   - Recent Inngest pipeline failure rate (>5% over 1h -> red,
 *     >1% -> yellow)
 *   - Anthropic budget headroom (<10% -> red, <20% -> yellow)
 *   - Infrastructure checks (any TLS <=7 days, any fail status -> red,
 *     any warn -> yellow)
 *   - Recent Sentry error events (>=10 in last hour -> yellow)
 *   - p75 mobile RUM LCP (>=4s -> yellow)
 *
 * Each contributing signal is collected separately so the status bar
 * can show the operator *which* signal triggered the color, not just
 * the color itself.
 */

export type StatusLevel = "green" | "yellow" | "red";

export type StatusReason = {
  area: string;
  level: StatusLevel;
  message: string;
};

export type DashboardStatus = {
  level: StatusLevel;
  reasons: StatusReason[];
};

function escalate(current: StatusLevel, candidate: StatusLevel): StatusLevel {
  const order: Record<StatusLevel, number> = { green: 0, yellow: 1, red: 2 };
  return order[candidate] > order[current] ? candidate : current;
}

export async function getDashboardStatus(): Promise<DashboardStatus> {
  const reasons: StatusReason[] = [];
  let level: StatusLevel = "green";

  /* Vercel production state */
  try {
    const deploy = await getCurrentDeploymentSummary();
    if (deploy.productionState === "ERROR") {
      reasons.push({
        area: "Vercel",
        level: "red",
        message: "Production deploy is ERROR",
      });
      level = escalate(level, "red");
    } else if (deploy.failedLast24h > 0) {
      reasons.push({
        area: "Vercel",
        level: "yellow",
        message: `${deploy.failedLast24h} failed deploy${deploy.failedLast24h === 1 ? "" : "s"} in last 24h`,
      });
      level = escalate(level, "yellow");
    }
  } catch {
    /* skip */
  }

  /* Inngest pipeline failure rate */
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        COUNT(*)::int AS runs,
        COUNT(*) FILTER (WHERE status = 'failed')::int AS failed
      FROM inngest_runs
      WHERE COALESCE(started_at, observed_at) > now() - interval '1 hour'
    `) as { runs: number; failed: number }[];
    const r = rows[0];
    if (r && r.runs > 5) {
      const rate = (r.failed / r.runs) * 100;
      if (rate >= 5) {
        reasons.push({
          area: "Inngest",
          level: "red",
          message: `${rate.toFixed(1)}% of runs failed in the last hour`,
        });
        level = escalate(level, "red");
      } else if (rate >= 1) {
        reasons.push({
          area: "Inngest",
          level: "yellow",
          message: `${rate.toFixed(1)}% of runs failed in the last hour`,
        });
        level = escalate(level, "yellow");
      }
    }
  } catch {
    /* skip */
  }

  /* Anthropic budget headroom */
  try {
    const budget = await getCurrentBudgetState();
    if (budget.pctUsed !== null) {
      if (budget.pctUsed >= 90) {
        reasons.push({
          area: "Anthropic",
          level: "red",
          message: `${budget.pctUsed}% of monthly budget used`,
        });
        level = escalate(level, "red");
      } else if (budget.pctUsed >= 80) {
        reasons.push({
          area: "Anthropic",
          level: "yellow",
          message: `${budget.pctUsed}% of monthly budget used`,
        });
        level = escalate(level, "yellow");
      }
    }
  } catch {
    /* skip */
  }

  /* Infrastructure checks */
  try {
    const infra = await getLatestInfraStatuses();
    let infraFail = 0;
    let infraWarn = 0;
    for (const row of infra) {
      if (row.status === "fail") infraFail += 1;
      if (row.status === "warn") infraWarn += 1;
    }
    if (infraFail > 0) {
      reasons.push({
        area: "Infra",
        level: "red",
        message: `${infraFail} infrastructure check${infraFail === 1 ? "" : "s"} failing`,
      });
      level = escalate(level, "red");
    } else if (infraWarn > 0) {
      reasons.push({
        area: "Infra",
        level: "yellow",
        message: `${infraWarn} infrastructure check${infraWarn === 1 ? "" : "s"} need attention`,
      });
      level = escalate(level, "yellow");
    }
  } catch {
    /* skip */
  }

  /* Sentry recent error volume from monitoring_events */
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT COUNT(*)::int AS errors
      FROM monitoring_events
      WHERE level = 'error' AND created_at > now() - interval '1 hour'
    `) as { errors: number }[];
    const errors = Number(rows[0]?.errors ?? 0);
    if (errors >= 25) {
      reasons.push({
        area: "Errors",
        level: "red",
        message: `${errors} error events in the last hour`,
      });
      level = escalate(level, "red");
    } else if (errors >= 10) {
      reasons.push({
        area: "Errors",
        level: "yellow",
        message: `${errors} error events in the last hour`,
      });
      level = escalate(level, "yellow");
    }
  } catch {
    /* skip */
  }

  /* RUM mobile LCP p75 over 7 days */
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY eng.cwv_lcp_ms)::int AS lcp_p75
      FROM page_views pv
      JOIN page_view_engagement eng ON eng.page_view_id = pv.id
      WHERE pv.created_at > now() - interval '7 days'
        AND pv.is_bot = false
        AND pv.device_type = 'mobile'
    `) as { lcp_p75: number | null }[];
    const lcp = rows[0]?.lcp_p75;
    if (lcp !== null && lcp !== undefined) {
      if (lcp >= 4000) {
        reasons.push({
          area: "RUM",
          level: "yellow",
          message: `Mobile LCP p75 is ${lcp}ms`,
        });
        level = escalate(level, "yellow");
      }
    }
  } catch {
    /* skip */
  }

  if (reasons.length === 0) {
    reasons.push({
      area: "All systems",
      level: "green",
      message: "No issues detected",
    });
  }

  return { level, reasons };
}
