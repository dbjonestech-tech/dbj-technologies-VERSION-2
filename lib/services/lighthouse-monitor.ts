import { getDb } from "../db";
import { extractLighthouseCategoryScores } from "../db/queries";
import { recordPagespeedUsage } from "./api-usage";

/**
 * Lighthouse scheduled audit pipeline used by the daily Inngest cron
 * `lighthouseMonitorDaily`. Distinct from lib/services/pagespeed.ts
 * because this needs the *full* category set (performance,
 * accessibility, best_practices, seo) rather than just the runtime
 * Performance metrics that the Pathlight scan pipeline consumes.
 *
 * Each call writes one row to lighthouse_history. The dashboard at
 * /internal/monitor reads from there for the latest scores grid + 30d
 * sparklines, and the cron itself compares against the rolling 7-day
 * median to decide when to Sentry-alert on regression.
 */

const PSI_ENDPOINT =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const AUDIT_TIMEOUT_MS = 60_000;
const RETRY_DELAYS_MS = [10_000, 20_000];
const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);

export type LighthouseStrategy = "mobile" | "desktop";

export type MonitoredPage = {
  path: string;
  label: string;
};

/**
 * Pages monitored by the daily Lighthouse cron. Keep this list short
 * and only include surfaces whose perf characteristics actually matter
 * to the business: marketing top-of-funnel + Pathlight landing. Adding
 * dynamic routes (e.g. /pathlight/[scanId]) would require fixture
 * data and add cost without clear signal.
 */
export const MONITORED_PAGES: MonitoredPage[] = [
  { path: "/", label: "Homepage" },
  { path: "/about", label: "About" },
  { path: "/work", label: "Work" },
  { path: "/services", label: "Services" },
  { path: "/pricing", label: "Pricing" },
  { path: "/pathlight", label: "Pathlight Landing" },
  { path: "/contact", label: "Contact" },
];

export const STRATEGIES: LighthouseStrategy[] = ["mobile", "desktop"];

type AuditResult = {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
  durationMs: number;
};

function buildSiteUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://dbjtechnologies.com";
  const trimmed = base.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmed}${cleanPath}`;
}

async function runPsiForCategories(
  url: string,
  strategy: LighthouseStrategy
): Promise<AuditResult> {
  const qs = new URLSearchParams({ url, strategy });
  qs.append("category", "performance");
  qs.append("category", "accessibility");
  qs.append("category", "best-practices");
  qs.append("category", "seo");
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (apiKey) qs.set("key", apiKey);

  const endpoint = `${PSI_ENDPOINT}?${qs.toString()}`;
  const maxAttempts = 1 + RETRY_DELAYS_MS.length;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AUDIT_TIMEOUT_MS);
    try {
      const res = await fetch(endpoint, {
        method: "GET",
        signal: controller.signal,
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        const isTransient = TRANSIENT_STATUSES.has(res.status);
        if (isTransient && attempt < maxAttempts) {
          await recordPagespeedUsage({
            scanId: null,
            operation: `monitor-lighthouse-${strategy}`,
            durationMs: Date.now() - start,
            status: "retry",
            attempt,
          });
          const delay = RETRY_DELAYS_MS[attempt - 1]!;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        await recordPagespeedUsage({
          scanId: null,
          operation: `monitor-lighthouse-${strategy}`,
          durationMs: Date.now() - start,
          status: "fail",
          attempt,
        });
        throw new Error(
          `PSI ${strategy} failed (${res.status}): ${detail.slice(0, 200)}`
        );
      }

      const data = (await res.json()) as { lighthouseResult?: unknown };
      const cats = extractLighthouseCategoryScores(data.lighthouseResult);
      await recordPagespeedUsage({
        scanId: null,
        operation: `monitor-lighthouse-${strategy}`,
        durationMs: Date.now() - start,
        status: "ok",
        attempt,
      });

      return {
        performance: cats?.performance ?? null,
        accessibility: cats?.accessibility ?? null,
        bestPractices: cats?.bestPractices ?? null,
        seo: cats?.seo ?? null,
        durationMs: Date.now() - start,
      };
    } catch (err) {
      lastErr = err;
      const isTimeout = (err as Error)?.name === "AbortError";
      const isNetwork = err instanceof TypeError;
      if ((isTimeout || isNetwork) && attempt < maxAttempts) {
        await recordPagespeedUsage({
          scanId: null,
          operation: `monitor-lighthouse-${strategy}`,
          durationMs: Date.now() - start,
          status: "retry",
          attempt,
        });
        const delay = RETRY_DELAYS_MS[attempt - 1]!;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      await recordPagespeedUsage({
        scanId: null,
        operation: `monitor-lighthouse-${strategy}`,
        durationMs: Date.now() - start,
        status: "fail",
        attempt,
      });
      if (isTimeout) {
        throw new Error(`PSI ${strategy} timed out after 60s.`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastErr ?? new Error("PSI failed after retries.");
}

/**
 * Run one (page, strategy) audit and persist to lighthouse_history.
 * Returns the persisted row's category scores so the cron can compute
 * regression deltas without a follow-up SELECT.
 */
export async function auditAndRecord(
  page: MonitoredPage,
  strategy: LighthouseStrategy
): Promise<{
  ok: boolean;
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
  errorMessage: string | null;
}> {
  const sql = getDb();
  const url = buildSiteUrl(page.path);
  try {
    const result = await runPsiForCategories(url, strategy);
    await sql`
      INSERT INTO lighthouse_history
        (page, strategy, performance, accessibility, best_practices, seo,
         duration_ms, status, error_message)
      VALUES
        (${page.path}, ${strategy}, ${result.performance},
         ${result.accessibility}, ${result.bestPractices}, ${result.seo},
         ${result.durationMs}, 'ok', NULL)
    `;
    return {
      ok: true,
      performance: result.performance,
      accessibility: result.accessibility,
      bestPractices: result.bestPractices,
      seo: result.seo,
      errorMessage: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await sql`
      INSERT INTO lighthouse_history
        (page, strategy, performance, accessibility, best_practices, seo,
         duration_ms, status, error_message)
      VALUES
        (${page.path}, ${strategy}, NULL, NULL, NULL, NULL,
         NULL, 'fail', ${message.slice(0, 500)})
    `;
    return {
      ok: false,
      performance: null,
      accessibility: null,
      bestPractices: null,
      seo: null,
      errorMessage: message,
    };
  }
}

/**
 * Rolling 7-day medians for all four categories of one (page,
 * strategy). One query rather than four because postgres collapses
 * the scan and the math is cheap. Used by the regression check:
 * today's audit vs these medians.
 */
export async function getRollingMedians(
  page: string,
  strategy: LighthouseStrategy,
  days = 7
): Promise<{
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
}> {
  const sql = getDb();
  const interval = `${days} days`;
  const rows = (await sql`
    SELECT
      (percentile_cont(0.5) WITHIN GROUP (ORDER BY performance))::float8 AS p,
      (percentile_cont(0.5) WITHIN GROUP (ORDER BY accessibility))::float8 AS a,
      (percentile_cont(0.5) WITHIN GROUP (ORDER BY best_practices))::float8 AS bp,
      (percentile_cont(0.5) WITHIN GROUP (ORDER BY seo))::float8 AS s
    FROM lighthouse_history
    WHERE page = ${page}
      AND strategy = ${strategy}
      AND status = 'ok'
      AND created_at > now() - (${interval})::interval
  `) as { p: number | null; a: number | null; bp: number | null; s: number | null }[];
  const row = rows[0];
  const safe = (v: number | null | undefined): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  return {
    performance: safe(row?.p),
    accessibility: safe(row?.a),
    bestPractices: safe(row?.bp),
    seo: safe(row?.s),
  };
}
