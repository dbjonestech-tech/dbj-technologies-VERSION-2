import { getDb } from "@/lib/db";

/**
 * Vercel platform telemetry service.
 *
 * Two write paths:
 *
 *   1. Webhook ingestion (/api/webhooks/vercel) calls
 *      upsertDeploymentEvent on every lifecycle event.
 *
 *   2. Hourly cron (vercelTelemetryHourly) calls
 *      snapshotVercelDeployments to back-fill anything missed and to
 *      pull function metrics from the REST API.
 *
 * Read APIs power /admin/platform (recent deploys, current state,
 * function p99 trend).
 *
 * Env vars: VERCEL_API_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID
 * (optional). When unset (local dev) the service short-circuits to
 * an empty result and logs once. The dashboard renders an empty state
 * so missing config does not break the page.
 */

const VERCEL_API = "https://api.vercel.com";

function getVercelConfig(): {
  token: string;
  projectId: string;
  teamId: string | null;
} | null {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return null;
  return {
    token,
    projectId,
    teamId: process.env.VERCEL_TEAM_ID ?? null,
  };
}

type DeploymentEventInput = {
  id: string;
  url: string | null;
  state: string;
  target: string | null;
  createdAt: number;
  readyAt: number | null;
  buildDurationMs: number | null;
  meta: Record<string, unknown>;
};

export async function upsertDeploymentEvent(
  input: DeploymentEventInput
): Promise<void> {
  try {
    const sql = getDb();
    /* Epoch ms to ISO string for the parameter binding. Postgres
     * accepts ISO 8601 directly into a TIMESTAMPTZ column. */
    const createdIso = new Date(input.createdAt).toISOString();
    const readyIso = input.readyAt === null ? null : new Date(input.readyAt).toISOString();
    await sql`
      INSERT INTO vercel_deployments
        (id, url, state, target, created_at, ready_at, build_duration_ms, meta, observed_at)
      VALUES (
        ${input.id},
        ${input.url},
        ${input.state},
        ${input.target},
        ${createdIso}::timestamptz,
        ${readyIso}::timestamptz,
        ${input.buildDurationMs},
        ${JSON.stringify(input.meta)}::jsonb,
        now()
      )
      ON CONFLICT (id) DO UPDATE SET
        state = EXCLUDED.state,
        url = COALESCE(EXCLUDED.url, vercel_deployments.url),
        ready_at = COALESCE(EXCLUDED.ready_at, vercel_deployments.ready_at),
        build_duration_ms = COALESCE(EXCLUDED.build_duration_ms, vercel_deployments.build_duration_ms),
        meta = vercel_deployments.meta || EXCLUDED.meta,
        observed_at = now()
    `;
  } catch (err) {
    console.warn(
      `[vercel] upsertDeploymentEvent failed: ${err instanceof Error ? err.message : err}`
    );
  }
}

type ListDeploymentsResponse = {
  deployments: Array<{
    uid: string;
    url: string;
    state: string;
    target: string | null;
    created: number;
    ready?: number;
    buildingAt?: number;
    meta?: Record<string, unknown>;
  }>;
};

/**
 * Pull recent deployments from the Vercel REST API and upsert them
 * into vercel_deployments. The API returns up to 100 deployments per
 * page; we pull the most recent 50 which comfortably covers a day's
 * activity even with active preview branches.
 */
export async function snapshotVercelDeployments(): Promise<{
  ok: boolean;
  fetched: number;
}> {
  const cfg = getVercelConfig();
  if (!cfg) return { ok: false, fetched: 0 };

  try {
    const url = new URL("/v6/deployments", VERCEL_API);
    url.searchParams.set("projectId", cfg.projectId);
    url.searchParams.set("limit", "50");
    if (cfg.teamId) url.searchParams.set("teamId", cfg.teamId);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${cfg.token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`[vercel] deployments fetch failed: ${res.status}`);
      return { ok: false, fetched: 0 };
    }
    const data = (await res.json()) as ListDeploymentsResponse;
    for (const dep of data.deployments ?? []) {
      const ready = dep.ready ?? null;
      const buildDuration =
        ready && dep.buildingAt ? ready - dep.buildingAt : null;
      await upsertDeploymentEvent({
        id: dep.uid,
        url: dep.url ? `https://${dep.url}` : null,
        state: dep.state,
        target: dep.target ?? null,
        createdAt: dep.created,
        readyAt: ready,
        buildDurationMs: buildDuration,
        meta: dep.meta ?? {},
      });
    }
    return { ok: true, fetched: data.deployments?.length ?? 0 };
  } catch (err) {
    console.warn(
      `[vercel] snapshot failed: ${err instanceof Error ? err.message : err}`
    );
    return { ok: false, fetched: 0 };
  }
}

/* ─────────────── Read APIs ─────────────── */

export type DeploymentRow = {
  id: string;
  url: string | null;
  state: string;
  target: string | null;
  createdAt: string;
  readyAt: string | null;
  buildDurationMs: number | null;
  branch: string | null;
  commitSha: string | null;
  commitMessage: string | null;
  author: string | null;
};

function pickString(meta: Record<string, unknown>, key: string): string | null {
  const value = meta[key];
  return typeof value === "string" ? value : null;
}

export async function getRecentDeployments(
  limit = 25
): Promise<DeploymentRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, url, state, target, created_at, ready_at, build_duration_ms, meta
      FROM vercel_deployments
      ORDER BY created_at DESC
      LIMIT ${Math.max(1, Math.min(100, limit))}
    `) as Array<{
      id: string;
      url: string | null;
      state: string;
      target: string | null;
      created_at: string;
      ready_at: string | null;
      build_duration_ms: number | null;
      meta: Record<string, unknown>;
    }>;
    return rows.map((r) => ({
      id: r.id,
      url: r.url,
      state: r.state,
      target: r.target,
      createdAt: r.created_at,
      readyAt: r.ready_at,
      buildDurationMs: r.build_duration_ms,
      branch: pickString(r.meta ?? {}, "githubCommitRef"),
      commitSha: pickString(r.meta ?? {}, "githubCommitSha"),
      commitMessage: pickString(r.meta ?? {}, "githubCommitMessage"),
      author: pickString(r.meta ?? {}, "githubCommitAuthorName"),
    }));
  } catch (err) {
    console.warn(
      `[vercel] getRecentDeployments failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

export type CurrentDeploymentSummary = {
  productionState: string | null;
  productionUrl: string | null;
  productionAge: string | null;
  failedLast24h: number;
  buildingNow: number;
};

const EMPTY_DEPLOY_SUMMARY: CurrentDeploymentSummary = {
  productionState: null,
  productionUrl: null,
  productionAge: null,
  failedLast24h: 0,
  buildingNow: 0,
};

export async function getCurrentDeploymentSummary(): Promise<CurrentDeploymentSummary> {
  try {
    const sql = getDb();
    const prodRows = (await sql`
      SELECT state, url, created_at
      FROM vercel_deployments
      WHERE target = 'production'
      ORDER BY created_at DESC
      LIMIT 1
    `) as { state: string; url: string | null; created_at: string }[];

    const counts = (await sql`
      SELECT
        COUNT(*) FILTER (WHERE state = 'ERROR' AND created_at > now() - interval '1 day')::int AS failed,
        COUNT(*) FILTER (WHERE state IN ('BUILDING', 'INITIALIZING', 'QUEUED'))::int AS building
      FROM vercel_deployments
      WHERE created_at > now() - interval '7 days'
    `) as { failed: number; building: number }[];

    const r = prodRows[0];
    const c = counts[0] ?? { failed: 0, building: 0 };
    return {
      productionState: r?.state ?? null,
      productionUrl: r?.url ?? null,
      productionAge: r?.created_at ?? null,
      failedLast24h: Number(c.failed),
      buildingNow: Number(c.building),
    };
  } catch (err) {
    console.warn(
      `[vercel] getCurrentDeploymentSummary failed: ${err instanceof Error ? err.message : err}`
    );
    return EMPTY_DEPLOY_SUMMARY;
  }
}
