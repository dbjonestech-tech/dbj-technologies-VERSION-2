const PSI_ENDPOINT =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const TIMEOUT_MS = 60_000;

export type FindabilityScores = {
  seo: number;
  accessibility: number;
};

type LighthouseCategoriesShape = {
  seo?: { score?: number | null };
  accessibility?: { score?: number | null };
};

type PsiResponse = {
  lighthouseResult?: { categories?: LighthouseCategoriesShape };
  error?: { message?: string };
};

function normalizeScore(raw: number | null | undefined): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(100, Math.round(raw * 100)));
}

export async function fetchFindabilityScores(
  url: string
): Promise<FindabilityScores> {
  const qs = new URLSearchParams({ url, strategy: "desktop" });
  qs.append("category", "seo");
  qs.append("category", "accessibility");

  const key = process.env.PAGESPEED_API_KEY;
  if (key) qs.set("key", key);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${PSI_ENDPOINT}?${qs.toString()}`, {
      method: "GET",
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `PageSpeed Insights (seo/a11y) failed (${res.status}): ${detail.slice(0, 200)}`
      );
    }

    const data = (await res.json()) as PsiResponse;
    if (data.error) {
      throw new Error(
        `PageSpeed Insights error: ${data.error.message ?? "unknown"}`
      );
    }

    const categories = data.lighthouseResult?.categories ?? {};
    return {
      seo: normalizeScore(categories.seo?.score ?? null),
      accessibility: normalizeScore(categories.accessibility?.score ?? null),
    };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error("PageSpeed Insights (seo/a11y) timed out after 60s.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
