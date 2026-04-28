import { getDb } from "@/lib/db";

/**
 * Anthropic budget snapshot service.
 *
 * The Anthropic Admin API surface for org-level cost + rate-limit
 * headroom is rolling out gradually; not every workspace can pull
 * monthly spend telemetry yet. This service degrades gracefully:
 *
 *   1. If ANTHROPIC_ADMIN_KEY is set and the Admin API responds, we
 *      use the upstream values verbatim.
 *
 *   2. Otherwise we synthesize a snapshot from our own
 *      api_usage_events table -- exactly the spend we know about,
 *      since every Anthropic call routes through recordAnthropicUsage.
 *      Monthly limit comes from ANTHROPIC_MONTHLY_BUDGET_USD env var.
 *
 * Either way the dashboard renders a useful "month-to-date spend
 * vs configured cap" view. Missing configuration shows a banner
 * prompting the operator to set the budget value.
 */

const ANTHROPIC_API = "https://api.anthropic.com";

type AdminCostResponse = {
  data?: Array<{
    period?: { start?: string; end?: string };
    cost_usd?: number;
  }>;
};

async function fetchAdminCost(): Promise<{ spendUsd: number | null; raw: unknown }> {
  const key = process.env.ANTHROPIC_ADMIN_KEY;
  if (!key) return { spendUsd: null, raw: null };
  try {
    /* The current public path is /v1/organizations/usage_report
     * (subject to change). We tolerate any non-200 by returning null
     * so the local fallback path takes over. */
    const url = new URL("/v1/organizations/usage_report", ANTHROPIC_API);
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    url.searchParams.set("starting_at", start.toISOString());
    url.searchParams.set("ending_at", new Date().toISOString());

    const res = await fetch(url.toString(), {
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      cache: "no-store",
    });
    if (!res.ok) return { spendUsd: null, raw: null };
    const data = (await res.json()) as AdminCostResponse;
    const total = (data.data ?? []).reduce(
      (sum, row) => sum + Number(row.cost_usd ?? 0),
      0
    );
    return { spendUsd: total, raw: data };
  } catch (err) {
    console.warn(
      `[anthropic-budget] Admin API fetch failed: ${err instanceof Error ? err.message : err}`
    );
    return { spendUsd: null, raw: null };
  }
}

async function fetchLocalSpend(): Promise<number> {
  const sql = getDb();
  const rows = (await sql`
    SELECT COALESCE(SUM(cost_usd), 0)::float8 AS spend
    FROM api_usage_events
    WHERE provider = 'anthropic'
      AND occurred_at >= date_trunc('month', now())
  `) as { spend: number }[];
  return Number(rows[0]?.spend ?? 0);
}

export type SnapshotResult = {
  ok: boolean;
  spendUsd: number;
  limitUsd: number | null;
  source: "admin_api" | "local_events";
};

export async function snapshotAnthropicBudget(): Promise<SnapshotResult> {
  const limitRaw = process.env.ANTHROPIC_MONTHLY_BUDGET_USD;
  const limit = limitRaw ? Number(limitRaw) : null;
  const limitUsd = Number.isFinite(limit) && limit && limit > 0 ? limit : null;

  const admin = await fetchAdminCost();
  const spendUsd = admin.spendUsd ?? (await fetchLocalSpend());
  const source = admin.spendUsd !== null ? "admin_api" : "local_events";

  try {
    const sql = getDb();
    await sql`
      INSERT INTO anthropic_budget_snapshots
        (snapshot_at, monthly_spend_usd, monthly_limit_usd, details)
      VALUES (
        date_trunc('hour', now()),
        ${spendUsd},
        ${limitUsd},
        ${JSON.stringify({ source, raw: admin.raw })}::jsonb
      )
      ON CONFLICT (snapshot_at) DO UPDATE SET
        monthly_spend_usd = EXCLUDED.monthly_spend_usd,
        monthly_limit_usd = EXCLUDED.monthly_limit_usd,
        details = EXCLUDED.details
    `;
  } catch (err) {
    console.warn(
      `[anthropic-budget] snapshot insert failed: ${err instanceof Error ? err.message : err}`
    );
  }

  return { ok: true, spendUsd, limitUsd, source };
}

/* ─────────────── Read APIs ─────────────── */

export type CurrentBudgetState = {
  spendUsd: number;
  limitUsd: number | null;
  pctUsed: number | null;
  headroomPct: number | null;
  source: string | null;
  asOf: string | null;
};

const EMPTY_BUDGET: CurrentBudgetState = {
  spendUsd: 0,
  limitUsd: null,
  pctUsed: null,
  headroomPct: null,
  source: null,
  asOf: null,
};

export async function getCurrentBudgetState(): Promise<CurrentBudgetState> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT snapshot_at, monthly_spend_usd, monthly_limit_usd, details
      FROM anthropic_budget_snapshots
      ORDER BY snapshot_at DESC
      LIMIT 1
    `) as Array<{
      snapshot_at: string;
      monthly_spend_usd: number | string | null;
      monthly_limit_usd: number | string | null;
      details: { source?: string };
    }>;
    const r = rows[0];
    if (!r) return EMPTY_BUDGET;
    const spend = Number(r.monthly_spend_usd ?? 0);
    const limit = r.monthly_limit_usd === null ? null : Number(r.monthly_limit_usd);
    const pctUsed = limit && limit > 0 ? (spend / limit) * 100 : null;
    return {
      spendUsd: spend,
      limitUsd: limit,
      pctUsed: pctUsed === null ? null : Number(pctUsed.toFixed(1)),
      headroomPct: pctUsed === null ? null : Number((100 - pctUsed).toFixed(1)),
      source: r.details?.source ?? null,
      asOf: r.snapshot_at,
    };
  } catch (err) {
    console.warn(
      `[anthropic-budget] getCurrentBudgetState failed: ${err instanceof Error ? err.message : err}`
    );
    return EMPTY_BUDGET;
  }
}

export type BudgetTrendPoint = {
  hour: string;
  spendUsd: number;
};

export async function getBudgetTrend(daysBack = 30): Promise<BudgetTrendPoint[]> {
  try {
    const sql = getDb();
    const days = Math.max(1, Math.min(90, daysBack));
    const interval = `${days} days`;
    const rows = (await sql`
      SELECT snapshot_at, monthly_spend_usd
      FROM anthropic_budget_snapshots
      WHERE snapshot_at > now() - (${interval})::interval
      ORDER BY snapshot_at ASC
    `) as Array<{ snapshot_at: string; monthly_spend_usd: number | string | null }>;
    return rows.map((r) => ({
      hour: r.snapshot_at,
      spendUsd: Number(r.monthly_spend_usd ?? 0),
    }));
  } catch (err) {
    console.warn(
      `[anthropic-budget] getBudgetTrend failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}
