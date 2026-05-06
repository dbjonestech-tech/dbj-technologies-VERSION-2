import type { PerformanceScores } from "@/lib/types/scan";
import { recordPagespeedUsage } from "./api-usage";

export type AuditResult = {
  scores: PerformanceScores;
  raw: unknown;
};

const PSI_ENDPOINT =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const AUDIT_TIMEOUT_MS = 60_000;
const RETRY_DELAYS_MS = [10_000, 20_000];
const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);

/* Number of parallel PSI runs per scan. Lighthouse on a single
 * sample is famously noisy: bshaccounting.com's CLS came back as
 * 1.0 on May 6 from one PSI run, while three independent runs from
 * pagespeed.web.dev returned 0.0 / 0.022 / similar values. The
 * single-sample reading produced a "fix your catastrophic CLS"
 * headline finding that was factually wrong, with credibility
 * fallout that almost reached a real prospect.
 *
 * Three samples plus a median is the industry-standard mitigation:
 * outlier runs (whether from a flaky third-party script firing on
 * one capture, a CDN cache miss on the first hit, or a transient
 * network blip) get discarded in favor of the central tendency.
 * Three is the minimum that defines a median; five would be more
 * stable but doubles wall time and PSI quota burn.
 *
 * The runs go in parallel rather than sequentially so wall-clock
 * cost is roughly one PSI call's latency (~25-30s) instead of
 * three. Quota cost is unavoidable: 3x per scan. PSI's free tier
 * with an API key allows 25,000 queries/day, so the practical
 * ceiling is ~8,300 scans/day before quota matters. */
const PARALLEL_PSI_RUNS = 3;

type LighthouseAudit = {
  score?: number | null;
  numericValue?: number | null;
};

type LighthouseResult = {
  categories?: { performance?: { score?: number | null } };
  audits?: Record<string, LighthouseAudit>;
};

type PsiResponse = {
  lighthouseResult?: LighthouseResult;
  error?: { message?: string };
};

function readAuditNumeric(
  audits: Record<string, LighthouseAudit> | undefined,
  key: string
): number {
  const v = audits?.[key]?.numericValue;
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : 0;
}

function readAuditScore(
  audits: Record<string, LighthouseAudit> | undefined,
  key: string
): number {
  const v = audits?.[key]?.score;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/* Runs ONE PSI call against the URL with the existing
 * retry-on-transient-error logic. Used to be the public export;
 * now used internally by runPerformanceAudit which dispatches
 * three of these in parallel and medianizes the results. */
async function runSinglePsiAudit(
  url: string,
  scanId: string | null,
): Promise<AuditResult> {
  const qs = new URLSearchParams({
    url,
    strategy: "desktop",
  });
  qs.append("category", "performance");
  qs.append("category", "accessibility");
  qs.append("category", "seo");
  qs.append("category", "best-practices");
  const key = process.env.PAGESPEED_API_KEY;
  if (key) qs.set("key", key);

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
            scanId,
            operation: "lighthouse",
            durationMs: Date.now() - start,
            status: "retry",
            attempt,
          });
          const delay = RETRY_DELAYS_MS[attempt - 1]!;
          console.warn(
            `[run-audit] PSI returned ${res.status}, retrying (attempt ${attempt}/${maxAttempts}) after ${delay / 1000}s...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        await recordPagespeedUsage({
          scanId,
          operation: "lighthouse",
          durationMs: Date.now() - start,
          status: "fail",
          attempt,
        });
        throw new Error(
          `PageSpeed Insights failed (${res.status}): ${detail.slice(0, 200)}`
        );
      }

      const data = (await res.json()) as PsiResponse;
      if (data.error) {
        await recordPagespeedUsage({
          scanId,
          operation: "lighthouse",
          durationMs: Date.now() - start,
          status: "fail",
          attempt,
        });
        throw new Error(
          `PageSpeed Insights error: ${data.error.message ?? "unknown"}`
        );
      }

      const lh = data.lighthouseResult;
      const audits = lh?.audits;
      const overallRaw = lh?.categories?.performance?.score ?? 0;

      const scores: PerformanceScores = {
        overall: Math.round((overallRaw ?? 0) * 100),
        lcp: readAuditNumeric(audits, "largest-contentful-paint"),
        cls: readAuditScore(audits, "cumulative-layout-shift"),
        inp: readAuditNumeric(audits, "interaction-to-next-paint"),
        tbt: readAuditNumeric(audits, "total-blocking-time"),
        si: readAuditNumeric(audits, "speed-index"),
      };

      await recordPagespeedUsage({
        scanId,
        operation: "lighthouse",
        durationMs: Date.now() - start,
        status: "ok",
        attempt,
      });
      return { scores, raw: lh ?? null };
    } catch (err) {
      lastErr = err;
      const isTimeout = (err as Error)?.name === "AbortError";
      const isNetwork = err instanceof TypeError;
      if ((isTimeout || isNetwork) && attempt < maxAttempts) {
        await recordPagespeedUsage({
          scanId,
          operation: "lighthouse",
          durationMs: Date.now() - start,
          status: "retry",
          attempt,
        });
        const delay = RETRY_DELAYS_MS[attempt - 1]!;
        const reason = isTimeout ? "timeout after 60s" : "network error";
        console.warn(
          `[run-audit] PSI ${reason}, retrying (attempt ${attempt}/${maxAttempts}) after ${delay / 1000}s...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      // Final-attempt failure: only record fail if we haven't already
      // logged this attempt's outcome above. The two non-OK branches
      // above already log; this catch fires for the final iteration's
      // network/timeout errors that DIDN'T short-circuit into retry.
      await recordPagespeedUsage({
        scanId,
        operation: "lighthouse",
        durationMs: Date.now() - start,
        status: "fail",
        attempt,
      });
      if (isTimeout) {
        throw new Error("PageSpeed Insights timed out after 60s.");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastErr ?? new Error("PageSpeed Insights failed after retries.");
}

/* Median of an array of finite numbers. Preserves precision for CLS
 * (decimal) while returning the same arithmetic median for
 * already-rounded millisecond fields. Empty array returns 0 to
 * mirror the readAudit* helpers' "missing audit" default. */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = values
    .filter((n) => Number.isFinite(n))
    .slice()
    .sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

/* Returns the run whose `overall` score is closest to the median
 * overall. Used as the canonical `raw` value so downstream consumers
 * (page text extraction, accessibility / SEO categories,
 * renderLighthouseDetails) see a real Lighthouse result rather than
 * a synthesized one. The metric numbers in the raw are then
 * overwritten with the medianized values via medianizeRaw below so
 * extractPerformanceScoresFromLighthouse and extractLighthouse-
 * CategoryScores both read the median values when they re-derive
 * scores at report-render time. Without that overwrite, the
 * representative run could legitimately carry the outlier
 * metric (e.g. its CLS happens to be 1.0 even though its overall
 * is closest to median), and the Lighthouse breakdown panel on the
 * report page would render the outlier instead of the median. */
function pickRepresentativeRun(
  runs: AuditResult[],
  medianOverall: number,
): AuditResult {
  return runs
    .slice()
    .sort(
      (a, b) =>
        Math.abs(a.scores.overall - medianOverall) -
        Math.abs(b.scores.overall - medianOverall),
    )[0]!;
}

/* Lighthouse JSON that we know how to mutate. Permissive types so
 * the deep clone retains every PSI field while the writer only
 * touches the metric numbers we own. */
type MutableLighthouseLike = {
  categories?: {
    performance?: { score?: number | null } & Record<string, unknown>;
  } & Record<string, unknown>;
  audits?: Record<
    string,
    ({ score?: number | null; numericValue?: number | null } & Record<
      string,
      unknown
    >)
  >;
} & Record<string, unknown>;

/* Overwrite the metric fields in a Lighthouse raw payload with the
 * medianized values. Mutates a deep clone so callers' references
 * are not aliased.
 *
 * Touches exactly the four fields downstream consumers read:
 *   categories.performance.score        -> medianScores.overall / 100
 *   audits.largest-contentful-paint     -> medianScores.lcp (numericValue)
 *   audits.cumulative-layout-shift      -> medianScores.cls (score)
 *   audits.interaction-to-next-paint    -> medianScores.inp (numericValue)
 *   audits.total-blocking-time          -> medianScores.tbt (numericValue)
 *   audits.speed-index                  -> medianScores.si  (numericValue)
 *
 * Leaves accessibility / best-practices / seo category scores
 * alone (they are static page analyses, not subject to single-
 * sample noise). Leaves displayValue strings alone too: the
 * renderers that consume them prefer numericValue, and rewriting
 * a "1.2 s" string to a synthesized "4.5 s" risks formatting
 * drift across PSI versions.
 *
 * Defensive: if the raw is missing a field, the writer skips it
 * silently rather than throwing. */
function medianizeRaw(
  raw: unknown,
  medianScores: PerformanceScores,
): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const cloned = JSON.parse(JSON.stringify(raw)) as MutableLighthouseLike;

  if (cloned.categories?.performance) {
    cloned.categories.performance.score = medianScores.overall / 100;
  }

  const audits = cloned.audits;
  if (audits) {
    if (audits["largest-contentful-paint"]) {
      audits["largest-contentful-paint"].numericValue = medianScores.lcp;
    }
    if (audits["cumulative-layout-shift"]) {
      audits["cumulative-layout-shift"].score = medianScores.cls;
    }
    if (audits["interaction-to-next-paint"]) {
      audits["interaction-to-next-paint"].numericValue = medianScores.inp;
    }
    if (audits["total-blocking-time"]) {
      audits["total-blocking-time"].numericValue = medianScores.tbt;
    }
    if (audits["speed-index"]) {
      audits["speed-index"].numericValue = medianScores.si;
    }
  }

  return cloned;
}

/**
 * Runs PSI three times in parallel and returns medianized scores
 * with a representative raw payload. This is the public entrypoint
 * the inngest pipeline (s3 step) calls.
 *
 * Behavior:
 *   - All three runs go in parallel via Promise.allSettled.
 *   - Successful runs are collected; failed runs are dropped.
 *   - 3 successes: medianize each metric, pick the run closest to
 *     the median overall as the canonical raw.
 *   - 2 successes: medianize (mean of two values is the median).
 *   - 1 success: return that run unmodified. Logs a warning so
 *     /admin/monitor sees that the scan went out on a single
 *     sample rather than three.
 *   - 0 successes: throw the first encountered error so the
 *     inngest catch can mark the scan partial as before.
 */
export async function runPerformanceAudit(
  url: string,
  scanId: string | null = null,
): Promise<AuditResult> {
  const settled = await Promise.allSettled(
    Array.from({ length: PARALLEL_PSI_RUNS }, () =>
      runSinglePsiAudit(url, scanId),
    ),
  );

  const successes: AuditResult[] = [];
  const failures: unknown[] = [];
  for (const s of settled) {
    if (s.status === "fulfilled") successes.push(s.value);
    else failures.push(s.reason);
  }

  if (successes.length === 0) {
    throw failures[0] instanceof Error
      ? failures[0]
      : new Error("All PageSpeed Insights runs failed.");
  }

  if (successes.length === 1) {
    console.warn(
      `[run-audit] only 1 of ${PARALLEL_PSI_RUNS} PSI runs succeeded; metrics carry single-sample noise.`,
    );
    return successes[0]!;
  }

  const medianScores: PerformanceScores = {
    overall: Math.round(median(successes.map((r) => r.scores.overall))),
    lcp: Math.round(median(successes.map((r) => r.scores.lcp))),
    cls: median(successes.map((r) => r.scores.cls)),
    inp: Math.round(median(successes.map((r) => r.scores.inp))),
    tbt: Math.round(median(successes.map((r) => r.scores.tbt))),
    si: Math.round(median(successes.map((r) => r.scores.si))),
  };

  const representative = pickRepresentativeRun(successes, medianScores.overall);
  /* Overwrite the metric fields in the representative raw so
   * downstream consumers that re-derive scores from raw (the
   * extractPerformanceScoresFromLighthouse / extractLighthouse-
   * CategoryScores helpers in lib/db/queries.ts called on every
   * report-page read) see the medianized numbers, not the
   * representative run's individual metric values. */
  const medianizedRaw = medianizeRaw(representative.raw, medianScores);

  return { scores: medianScores, raw: medianizedRaw };
}
