import { getDb } from "./index";
import type {
  DesignScores,
  IndustryBenchmark,
  LighthouseCategoryScores,
  PathlightReport,
  PerformanceScores,
  PillarScores,
  PositioningScores,
  RemediationResult,
  RevenueImpactResult,
  ScanRecord,
  ScanStatus,
  ScreenshotPair,
  VisionAuditResult,
} from "@/lib/types/scan";

type ScanRow = {
  id: string;
  status: string;
  url: string;
  resolved_url: string | null;
  email: string;
  business_name: string | null;
  industry: string | null;
  city: string | null;
  error_message: string | null;
  scan_duration_ms: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type ScanResultsRow = {
  lighthouse_data: unknown;
  screenshots: ScreenshotPair | null;
  ai_analysis: Record<string, unknown> | null;
  pathlight_score: number | null;
  pillar_scores: PillarScores | null;
  remediation_items: { items?: unknown[] } | null;
  revenue_impact: Record<string, unknown> | null;
  industry_benchmark: unknown;
};

export async function updateScanStatus(
  scanId: string,
  status: ScanStatus,
  error?: string
): Promise<void> {
  const sql = getDb();
  if (error) {
    await sql`
      UPDATE scans
      SET status = ${status}, error_message = ${error}, updated_at = now()
      WHERE id = ${scanId}
    `;
  } else {
    await sql`
      UPDATE scans
      SET status = ${status}, updated_at = now()
      WHERE id = ${scanId}
    `;
  }
}

export async function updateScanResolvedUrl(
  scanId: string,
  resolvedUrl: string
): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE scans
    SET resolved_url = ${resolvedUrl}, updated_at = now()
    WHERE id = ${scanId}
  `;
}

export async function updateScanScreenshots(
  scanId: string,
  desktop: string | null,
  mobile: string | null
): Promise<void> {
  const sql = getDb();
  const payload: ScreenshotPair = { desktop, mobile };
  // TODO: migrate screenshot storage to @vercel/blob — base64 in JSONB is a temporary shortcut.
  await sql`
    INSERT INTO scan_results (scan_id, screenshots)
    VALUES (${scanId}, ${JSON.stringify(payload)}::jsonb)
    ON CONFLICT (scan_id) DO UPDATE
    SET screenshots = EXCLUDED.screenshots
  `;
}

export async function updateScanResults(
  scanId: string,
  rawAudit: unknown,
  durationMs: number,
  resolvedUrl: string
): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO scan_results (scan_id, lighthouse_data)
    VALUES (${scanId}, ${JSON.stringify(rawAudit)}::jsonb)
    ON CONFLICT (scan_id) DO UPDATE
    SET lighthouse_data = EXCLUDED.lighthouse_data
  `;
  await sql`
    UPDATE scans
    SET scan_duration_ms = ${durationMs},
        resolved_url = ${resolvedUrl},
        updated_at = now()
    WHERE id = ${scanId}
  `;
}

export async function updateScanAiAnalysis(
  scanId: string,
  analysis: VisionAuditResult
): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO scan_results (scan_id, ai_analysis)
    VALUES (${scanId}, ${JSON.stringify(analysis)}::jsonb)
    ON CONFLICT (scan_id) DO UPDATE
    SET ai_analysis = EXCLUDED.ai_analysis
  `;
}

export async function updateScanRemediation(
  scanId: string,
  items: RemediationResult
): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO scan_results (scan_id, remediation_items)
    VALUES (${scanId}, ${JSON.stringify(items)}::jsonb)
    ON CONFLICT (scan_id) DO UPDATE
    SET remediation_items = EXCLUDED.remediation_items
  `;
}

export async function updateScanRevenueImpact(
  scanId: string,
  impact: RevenueImpactResult
): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO scan_results (scan_id, revenue_impact)
    VALUES (${scanId}, ${JSON.stringify(impact)}::jsonb)
    ON CONFLICT (scan_id) DO UPDATE
    SET revenue_impact = EXCLUDED.revenue_impact
  `;
}

export async function updateScanIndustryBenchmark(
  scanId: string,
  benchmark: IndustryBenchmark
): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO scan_results (scan_id, industry_benchmark)
    VALUES (${scanId}, ${JSON.stringify(benchmark)}::jsonb)
    ON CONFLICT (scan_id) DO UPDATE
    SET industry_benchmark = EXCLUDED.industry_benchmark
  `;
}

export async function updatePathlightScore(
  scanId: string,
  score: number,
  pillarScores: PillarScores
): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO scan_results (scan_id, pathlight_score, pillar_scores)
    VALUES (${scanId}, ${score}, ${JSON.stringify(pillarScores)}::jsonb)
    ON CONFLICT (scan_id) DO UPDATE
    SET pathlight_score = EXCLUDED.pathlight_score,
        pillar_scores = EXCLUDED.pillar_scores
  `;
}

export async function markScanComplete(
  scanId: string,
  status: Extract<ScanStatus, "complete" | "partial">,
  error?: string
): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE scans
    SET status = ${status},
        error_message = ${error ?? null},
        updated_at = now(),
        completed_at = now()
    WHERE id = ${scanId}
  `;
}

type LighthouseAuditShape = {
  score?: number | null;
  numericValue?: number | null;
};

type LighthouseResultShape = {
  categories?: { performance?: { score?: number | null } };
  audits?: Record<string, LighthouseAuditShape>;
};

export function extractPerformanceScoresFromLighthouse(
  raw: unknown
): PerformanceScores | null {
  if (!raw || typeof raw !== "object") return null;
  const lh = raw as LighthouseResultShape;
  const audits = lh.audits ?? {};
  const overallRaw = lh.categories?.performance?.score;
  if (typeof overallRaw !== "number") return null;
  const num = (k: string) => {
    const v = audits[k]?.numericValue;
    return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : 0;
  };
  const score = (k: string) => {
    const v = audits[k]?.score;
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  };
  return {
    overall: Math.round(overallRaw * 100),
    lcp: num("largest-contentful-paint"),
    cls: score("cumulative-layout-shift"),
    inp: num("interaction-to-next-paint"),
    tbt: num("total-blocking-time"),
    si: num("speed-index"),
  };
}

export function extractLighthouseCategoryScores(
  raw: unknown
): LighthouseCategoryScores | null {
  if (!raw || typeof raw !== "object") return null;
  const lh = raw as Record<string, any>;
  const cats = lh.categories;
  if (!cats || typeof cats !== "object") return null;

  const perf = cats.performance?.score;
  const a11y = cats.accessibility?.score;
  const bp = cats["best-practices"]?.score;
  const seo = cats.seo?.score;

  if (typeof perf !== "number") return null;

  return {
    performance: Math.round((perf ?? 0) * 100),
    accessibility: Math.round((a11y ?? 0) * 100),
    bestPractices: Math.round((bp ?? 0) * 100),
    seo: Math.round((seo ?? 0) * 100),
  };
}

function coercePillarScores(v: unknown): PillarScores | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (
    typeof o.design !== "number" ||
    typeof o.performance !== "number" ||
    typeof o.positioning !== "number"
  ) {
    return null;
  }
  let searchVisibility: number | null;
  if (o.searchVisibility === null) {
    searchVisibility = null;
  } else if (typeof o.searchVisibility === "number") {
    searchVisibility = o.searchVisibility;
  } else if (typeof o.findability === "number") {
    searchVisibility = o.findability;
  } else {
    searchVisibility = null;
  }
  return {
    design: o.design,
    performance: o.performance,
    positioning: o.positioning,
    searchVisibility,
  };
}

function coerceVisionAudit(v: unknown): VisionAuditResult | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (
    !o.design ||
    !o.positioning ||
    typeof o.design !== "object" ||
    typeof o.positioning !== "object"
  ) {
    return null;
  }
  const scale = o.businessScale;
  const health = o.screenshotHealth;
  return {
    design: o.design as DesignScores,
    positioning: o.positioning as PositioningScores,
    businessModel: (o.businessModel as "B2B" | "B2C" | "mixed") ?? undefined,
    inferredVertical: (o.inferredVertical as string) ?? undefined,
    inferredVerticalParent: (o.inferredVerticalParent as string) ?? undefined,
    businessScale:
      scale === "single-location" ||
      scale === "regional" ||
      scale === "national" ||
      scale === "global"
        ? scale
        : undefined,
    screenshotHealth:
      health === "clean" ||
      health === "cookie-banner-overlay" ||
      health === "loading-or-skeleton" ||
      health === "auth-wall" ||
      health === "minimal-content"
        ? health
        : undefined,
  };
}

function coerceRemediation(v: unknown): RemediationResult | null {
  if (!v || typeof v !== "object") return null;
  const o = v as { items?: unknown };
  if (!Array.isArray(o.items)) return null;
  return { items: o.items as RemediationResult["items"] };
}

function coerceIndustryBenchmark(v: unknown): IndustryBenchmark | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (
    typeof o.avgDealValue !== "number" ||
    typeof o.avgMonthlyVisitors !== "number"
  ) {
    return null;
  }
  return {
    avgDealValue: o.avgDealValue,
    dealValueLow:
      typeof o.dealValueLow === "number" ? o.dealValueLow : o.avgDealValue,
    dealValueHigh:
      typeof o.dealValueHigh === "number" ? o.dealValueHigh : o.avgDealValue,
    avgMonthlyVisitors: o.avgMonthlyVisitors,
    visitorsLow:
      typeof o.visitorsLow === "number" ? o.visitorsLow : o.avgMonthlyVisitors,
    visitorsHigh:
      typeof o.visitorsHigh === "number"
        ? o.visitorsHigh
        : o.avgMonthlyVisitors,
    source: typeof o.source === "string" ? o.source : "web research",
    confidence:
      o.confidence === "low" ||
      o.confidence === "medium" ||
      o.confidence === "high"
        ? o.confidence
        : "low",
  };
}

function coerceRevenueImpact(v: unknown): RevenueImpactResult | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (
    typeof o.estimatedMonthlyLoss !== "number" ||
    typeof o.methodology !== "string" ||
    typeof o.confidence !== "string" ||
    !o.assumptions ||
    typeof o.assumptions !== "object"
  ) {
    return null;
  }
  return o as unknown as RevenueImpactResult;
}

async function loadScanWithResults(scanId: string): Promise<{
  scan: ScanRow;
  result: ScanResultsRow | null;
} | null> {
  const sql = getDb();
  const scanRows = (await sql`
    SELECT id, status, url, resolved_url, email, business_name, industry, city,
           error_message, scan_duration_ms, created_at, updated_at, completed_at
    FROM scans
    WHERE id = ${scanId}
    LIMIT 1
  `) as ScanRow[];

  if (scanRows.length === 0) return null;

  const resultRows = (await sql`
    SELECT lighthouse_data, screenshots, ai_analysis, pathlight_score,
           pillar_scores, remediation_items, revenue_impact, industry_benchmark
    FROM scan_results
    WHERE scan_id = ${scanId}
    ORDER BY created_at DESC
    LIMIT 1
  `) as ScanResultsRow[];

  return { scan: scanRows[0]!, result: resultRows[0] ?? null };
}

export async function getScanById(scanId: string): Promise<ScanRecord | null> {
  const loaded = await loadScanWithResults(scanId);
  if (!loaded) return null;
  const { scan, result } = loaded;

  const perf = extractPerformanceScoresFromLighthouse(result?.lighthouse_data);
  const screenshots = result?.screenshots ?? null;
  const ai = coerceVisionAudit(result?.ai_analysis);

  return {
    id: scan.id,
    status: scan.status as ScanStatus,
    url: scan.url,
    resolvedUrl: scan.resolved_url,
    email: scan.email,
    businessName: scan.business_name,
    city: scan.city,
    scores: perf,
    screenshotDesktop: screenshots?.desktop ?? null,
    screenshotMobile: screenshots?.mobile ?? null,
    rawAudit: result?.lighthouse_data ?? null,
    designAnalysis: ai?.design ?? null,
    positioningAnalysis: ai?.positioning ?? null,
    remediationPlan: result?.remediation_items ?? null,
    revenueImpact: result?.revenue_impact ?? null,
    error: scan.error_message,
    duration: scan.scan_duration_ms,
    createdAt: scan.created_at,
    updatedAt: scan.updated_at,
    completedAt: scan.completed_at,
  };
}

export async function getScanPipelineContext(scanId: string): Promise<{
  id: string;
  url: string;
  resolvedUrl: string | null;
  industry: string | null;
  city: string | null;
  lighthouseData: unknown;
  screenshots: ScreenshotPair | null;
  visionAudit: VisionAuditResult | null;
  remediation: RemediationResult | null;
} | null> {
  const loaded = await loadScanWithResults(scanId);
  if (!loaded) return null;
  const { scan, result } = loaded;
  return {
    id: scan.id,
    url: scan.url,
    resolvedUrl: scan.resolved_url,
    industry: scan.industry,
    city: scan.city,
    lighthouseData: result?.lighthouse_data ?? null,
    screenshots: result?.screenshots ?? null,
    visionAudit: coerceVisionAudit(result?.ai_analysis),
    remediation: coerceRemediation(result?.remediation_items),
  };
}

export async function getFullScanReport(
  scanId: string
): Promise<PathlightReport | null> {
  const loaded = await loadScanWithResults(scanId);
  if (!loaded) return null;
  const { scan, result } = loaded;

  const perf = extractPerformanceScoresFromLighthouse(result?.lighthouse_data);
  const lighthouseScores = extractLighthouseCategoryScores(result?.lighthouse_data);
  const pillar = coercePillarScores(result?.pillar_scores);
  const vision = coerceVisionAudit(result?.ai_analysis);
  const remediation = coerceRemediation(result?.remediation_items);
  const revenue = coerceRevenueImpact(result?.revenue_impact);
  const industryBenchmark = coerceIndustryBenchmark(result?.industry_benchmark);
  const screenshots = result?.screenshots ?? null;
  const pathlightScore =
    typeof result?.pathlight_score === "number" && pillar !== null
      ? result.pathlight_score
      : null;

  return {
    id: scan.id,
    status: scan.status as ScanStatus,
    url: scan.url,
    resolvedUrl: scan.resolved_url,
    email: scan.email,
    businessName: scan.business_name,
    city: scan.city,
    industry: scan.industry,
    scores: perf,
    screenshotDesktop: screenshots?.desktop ?? null,
    screenshotMobile: screenshots?.mobile ?? null,
    design: vision?.design ?? null,
    positioning: vision?.positioning ?? null,
    remediation,
    revenueImpact: revenue,
    pathlightScore,
    pillarScores: pillar,
    lighthouseScores,
    industryBenchmark,
    businessModel: vision?.businessModel,
    inferredVertical: vision?.inferredVertical,
    inferredVerticalParent: vision?.inferredVerticalParent,
    businessScale: vision?.businessScale,
    screenshotHealth: vision?.screenshotHealth,
    error: scan.error_message,
    duration: scan.scan_duration_ms,
    createdAt: scan.created_at,
    updatedAt: scan.updated_at,
    completedAt: scan.completed_at,
  };
}
