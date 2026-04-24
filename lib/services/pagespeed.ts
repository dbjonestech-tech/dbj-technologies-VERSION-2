import type { PerformanceScores } from "@/lib/types/scan";

export type AuditResult = {
  scores: PerformanceScores;
  raw: unknown;
};

const PSI_ENDPOINT =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const AUDIT_TIMEOUT_MS = 60_000;
const RETRY_DELAYS_MS = [10_000, 20_000];
const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);

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

export async function runPerformanceAudit(url: string): Promise<AuditResult> {
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
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AUDIT_TIMEOUT_MS);

    try {
      const res = await fetch(endpoint, {
        method: "GET",
        signal: controller.signal,
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        if (TRANSIENT_STATUSES.has(res.status) && attempt < maxAttempts) {
          const delay = RETRY_DELAYS_MS[attempt - 1]!;
          console.warn(
            `[run-audit] PSI returned ${res.status}, retrying (attempt ${attempt}/${maxAttempts}) after ${delay / 1000}s...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(
          `PageSpeed Insights failed (${res.status}): ${detail.slice(0, 200)}`
        );
      }

      const data = (await res.json()) as PsiResponse;
      if (data.error) {
        throw new Error(
          `PageSpeed Insights error: ${data.error.message ?? "unknown"}`
        );
      }

      const lh = data.lighthouseResult;
      const audits = lh?.audits;
      const overallRaw = lh?.categories?.performance?.score ?? 0;

      const scores = {
        overall: Math.round((overallRaw ?? 0) * 100),
        lcp: readAuditNumeric(audits, "largest-contentful-paint"),
        cls: readAuditScore(audits, "cumulative-layout-shift"),
        inp: readAuditNumeric(audits, "interaction-to-next-paint"),
        tbt: readAuditNumeric(audits, "total-blocking-time"),
        si: readAuditNumeric(audits, "speed-index"),
      };

      return { scores, raw: lh ?? null };
    } catch (err) {
      lastErr = err;
      const isTimeout = (err as Error)?.name === "AbortError";
      const isNetwork = err instanceof TypeError;
      if ((isTimeout || isNetwork) && attempt < maxAttempts) {
        const delay = RETRY_DELAYS_MS[attempt - 1]!;
        const reason = isTimeout ? "timeout after 60s" : "network error";
        console.warn(
          `[run-audit] PSI ${reason}, retrying (attempt ${attempt}/${maxAttempts}) after ${delay / 1000}s...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
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
