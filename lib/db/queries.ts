import { getDb } from "./index";
import type {
  DesignScores,
  FormDescriptor,
  FormsAuditAnalysis,
  FormsAuditResult,
  FullPageScreenshotPair,
  HtmlSnapshot,
  IndustryBenchmark,
  LighthouseCategoryScores,
  PageCritiqueResult,
  PageCta,
  PageHeadlineAlternative,
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
  audio_summary_url: string | null;
  audio_summary_script: string | null;
  /* Stage 2 columns. All nullable; pre-Stage-2 scans coerce to null. */
  html_snapshot: unknown;
  screenshots_fullpage: FullPageScreenshotPair | null;
  forms_audit: unknown;
  /* Stage 1 column (added in migration 035). Nullable; pre-Stage-1 scans
   * coerce to null and HeroCritiqueSection returns null gracefully. */
  page_critique: unknown;
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

export async function updateScanAudioSummary(
  scanId: string,
  audioUrl: string,
  script: string
): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO scan_results (scan_id, audio_summary_url, audio_summary_script)
    VALUES (${scanId}, ${audioUrl}, ${script})
    ON CONFLICT (scan_id) DO UPDATE
    SET audio_summary_url = EXCLUDED.audio_summary_url,
        audio_summary_script = EXCLUDED.audio_summary_script
  `;
}

export async function updateScanHtmlSnapshot(
  scanId: string,
  snapshot: HtmlSnapshot
): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO scan_results (scan_id, html_snapshot)
    VALUES (${scanId}, ${JSON.stringify(snapshot)}::jsonb)
    ON CONFLICT (scan_id) DO UPDATE
    SET html_snapshot = EXCLUDED.html_snapshot
  `;
}

export async function updateScanFullPageScreenshots(
  scanId: string,
  desktop: string | null,
  mobile: string | null
): Promise<void> {
  const sql = getDb();
  const payload: FullPageScreenshotPair = { desktop, mobile };
  await sql`
    INSERT INTO scan_results (scan_id, screenshots_fullpage)
    VALUES (${scanId}, ${JSON.stringify(payload)}::jsonb)
    ON CONFLICT (scan_id) DO UPDATE
    SET screenshots_fullpage = EXCLUDED.screenshots_fullpage
  `;
}

/* Two-phase write for forms_audit. The capture step writes the
 * `extracted` half (DOM walk) immediately so the report renderer has
 * something to show while the post-finalize forms-audit step is still
 * generating its narrative. The audit step then writes the `analysis`
 * half via updateScanFormsAudit, preserving extracted on conflict. */
export async function updateScanFormsExtracted(
  scanId: string,
  forms: FormDescriptor[]
): Promise<void> {
  const sql = getDb();
  const payload = { extracted: { forms }, analysis: null };
  await sql`
    INSERT INTO scan_results (scan_id, forms_audit)
    VALUES (${scanId}, ${JSON.stringify(payload)}::jsonb)
    ON CONFLICT (scan_id) DO UPDATE
    SET forms_audit = jsonb_set(
      COALESCE(scan_results.forms_audit, '{}'::jsonb),
      '{extracted}',
      ${JSON.stringify({ forms })}::jsonb,
      true
    )
  `;
}

export async function updateScanPageCritique(
  scanId: string,
  critique: PageCritiqueResult,
): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO scan_results (scan_id, page_critique)
    VALUES (${scanId}, ${JSON.stringify(critique)}::jsonb)
    ON CONFLICT (scan_id) DO UPDATE
    SET page_critique = EXCLUDED.page_critique
  `;
}

export async function updateScanFormsAudit(
  scanId: string,
  analysis: FormsAuditAnalysis
): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE scan_results
    SET forms_audit = jsonb_set(
      COALESCE(forms_audit, '{}'::jsonb),
      '{analysis}',
      ${JSON.stringify(analysis)}::jsonb,
      true
    )
    WHERE scan_id = ${scanId}
  `;
}

export async function getExistingAudioSummary(
  scanId: string
): Promise<{ url: string | null; script: string | null }> {
  const sql = getDb();
  const rows = (await sql`
    SELECT audio_summary_url, audio_summary_script
    FROM scan_results
    WHERE scan_id = ${scanId}
    LIMIT 1
  `) as { audio_summary_url: string | null; audio_summary_script: string | null }[];
  const row = rows[0];
  return {
    url: row?.audio_summary_url ?? null,
    script: row?.audio_summary_script ?? null,
  };
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

function coerceHtmlSnapshot(v: unknown): HtmlSnapshot | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.html !== "string" || o.html.length === 0) return null;
  const viewport = o.viewport === "mobile" ? "mobile" : "desktop";
  return {
    html: o.html,
    capturedAt:
      typeof o.capturedAt === "string" ? o.capturedAt : new Date(0).toISOString(),
    viewport,
    truncatedAt:
      typeof o.truncatedAt === "number" ? o.truncatedAt : null,
  };
}

function coerceFullPageScreenshots(
  v: unknown,
): FullPageScreenshotPair | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const desktop = typeof o.desktop === "string" ? o.desktop : null;
  const mobile = typeof o.mobile === "string" ? o.mobile : null;
  if (!desktop && !mobile) return null;
  return { desktop, mobile };
}

function coerceFormDescriptor(v: unknown): FormDescriptor | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.formIndex !== "number" || typeof o.fieldCount !== "number") {
    return null;
  }
  return {
    formIndex: o.formIndex,
    fieldCount: o.fieldCount,
    fieldTypes:
      o.fieldTypes && typeof o.fieldTypes === "object"
        ? (o.fieldTypes as Record<string, number>)
        : {},
    requiredCount: typeof o.requiredCount === "number" ? o.requiredCount : 0,
    optionalCount: typeof o.optionalCount === "number" ? o.optionalCount : 0,
    hiddenCount: typeof o.hiddenCount === "number" ? o.hiddenCount : 0,
    unlabeledCount:
      typeof o.unlabeledCount === "number" ? o.unlabeledCount : 0,
    buttonCopy: typeof o.buttonCopy === "string" ? o.buttonCopy : null,
    action: typeof o.action === "string" ? o.action : null,
    method: typeof o.method === "string" ? o.method : null,
    hasLabels: o.hasLabels === true,
    ariaLabel: typeof o.ariaLabel === "string" ? o.ariaLabel : null,
  };
}

function coercePageCta(v: unknown): PageCta | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.text !== "string" || o.text.length === 0) return null;
  const location =
    o.location === "above-the-fold-hero" ||
    o.location === "above-the-fold-secondary" ||
    o.location === "navigation" ||
    o.location === "later-on-page"
      ? o.location
      : "above-the-fold-hero";
  const visibility =
    typeof o.visibility === "number" && Number.isFinite(o.visibility)
      ? Math.max(1, Math.min(10, Math.round(o.visibility)))
      : 5;
  return {
    text: o.text,
    location,
    visibility,
    observation: typeof o.observation === "string" ? o.observation : "",
    nextAction: typeof o.nextAction === "string" ? o.nextAction : "",
  };
}

function coerceHeadlineAlternative(v: unknown): PageHeadlineAlternative | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.text !== "string" || o.text.length === 0) return null;
  return {
    text: o.text,
    rationale: typeof o.rationale === "string" ? o.rationale : "",
  };
}

function coercePageCritique(v: unknown): PageCritiqueResult | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const heroObservation =
    typeof o.heroObservation === "string" ? o.heroObservation : "";
  const headlineRaw = o.headline as
    | { current?: unknown; alternatives?: unknown[] }
    | undefined;
  const current =
    typeof headlineRaw?.current === "string" ? headlineRaw.current : "";
  const alternativesRaw = Array.isArray(headlineRaw?.alternatives)
    ? headlineRaw.alternatives
    : [];
  const alternatives: PageHeadlineAlternative[] = [];
  for (const a of alternativesRaw) {
    const coerced = coerceHeadlineAlternative(a);
    if (coerced) alternatives.push(coerced);
  }
  const ctasRaw = Array.isArray(o.ctas) ? o.ctas : [];
  const ctas: PageCta[] = [];
  for (const c of ctasRaw) {
    const coerced = coercePageCta(c);
    if (coerced) ctas.push(coerced);
  }
  if (
    heroObservation.length === 0 &&
    alternatives.length === 0 &&
    ctas.length === 0
  ) {
    return null;
  }
  return {
    heroObservation,
    headline: { current, alternatives },
    ctas,
  };
}

function coerceFormsAudit(v: unknown): FormsAuditResult | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const extractedRaw = o.extracted as { forms?: unknown[] } | undefined;
  const formsRaw = Array.isArray(extractedRaw?.forms) ? extractedRaw!.forms! : [];
  const forms: FormDescriptor[] = [];
  for (const f of formsRaw) {
    const d = coerceFormDescriptor(f);
    if (d) forms.push(d);
  }

  let analysis: FormsAuditAnalysis | null = null;
  const analysisRaw = o.analysis as { items?: unknown[] } | null | undefined;
  if (analysisRaw && typeof analysisRaw === "object" && Array.isArray(analysisRaw.items)) {
    const items = analysisRaw.items
      .map((it) => {
        if (!it || typeof it !== "object") return null;
        const item = it as Record<string, unknown>;
        if (
          typeof item.formIndex !== "number" ||
          typeof item.headline !== "string" ||
          typeof item.observation !== "string" ||
          typeof item.nextAction !== "string"
        ) {
          return null;
        }
        const impact: "high" | "medium" | "low" =
          item.impact === "high" || item.impact === "low"
            ? item.impact
            : "medium";
        return {
          formIndex: item.formIndex,
          headline: item.headline,
          observation: item.observation,
          nextAction: item.nextAction,
          impact,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    if (items.length > 0) analysis = { items };
  }

  if (forms.length === 0 && !analysis) return null;
  return { extracted: { forms }, analysis };
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
           pillar_scores, remediation_items, revenue_impact, industry_benchmark,
           audio_summary_url, audio_summary_script,
           html_snapshot, screenshots_fullpage, forms_audit, page_critique
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

/* Stage 1 read helper for the post-finalize page-critique step. Pulls only
 * the columns it needs (desktop AtF data URI + design/positioning sub-scores
 * for "do not redundantly call out the same issues" prompt context + business
 * context) to keep the row payload small. */
export async function getPageCritiqueInput(scanId: string): Promise<{
  desktopScreenshot: string | null;
  url: string;
  resolvedUrl: string | null;
  businessName: string | null;
  industry: string | null;
  city: string | null;
  designScores: DesignScores | null;
  positioningScores: PositioningScores | null;
  performanceScores: PerformanceScores | null;
} | null> {
  const sql = getDb();
  const rows = (await sql`
    SELECT s.url, s.resolved_url, s.business_name, s.industry, s.city,
           sr.screenshots, sr.ai_analysis, sr.lighthouse_data
    FROM scans s
    LEFT JOIN scan_results sr ON sr.scan_id = s.id
    WHERE s.id = ${scanId}
    LIMIT 1
  `) as Array<{
    url: string;
    resolved_url: string | null;
    business_name: string | null;
    industry: string | null;
    city: string | null;
    screenshots: ScreenshotPair | null;
    ai_analysis: Record<string, unknown> | null;
    lighthouse_data: unknown;
  }>;
  const row = rows[0];
  if (!row) return null;
  const vision = coerceVisionAudit(row.ai_analysis);
  return {
    desktopScreenshot: row.screenshots?.desktop ?? null,
    url: row.url,
    resolvedUrl: row.resolved_url,
    businessName: row.business_name,
    industry: row.industry,
    city: row.city,
    designScores: vision?.design ?? null,
    positioningScores: vision?.positioning ?? null,
    performanceScores: extractPerformanceScoresFromLighthouse(row.lighthouse_data),
  };
}

/* Stage 2 read helper for the post-finalize forms-audit step. Pulls only
 * the columns it needs (extracted forms + html snapshot for narrative
 * grounding + business context) to keep the row payload small. */
export async function getFormsAuditInput(scanId: string): Promise<{
  forms: FormDescriptor[];
  html: string | null;
  url: string;
  resolvedUrl: string | null;
  businessName: string | null;
  industry: string | null;
  city: string | null;
} | null> {
  const sql = getDb();
  const rows = (await sql`
    SELECT s.url, s.resolved_url, s.business_name, s.industry, s.city,
           sr.forms_audit, sr.html_snapshot
    FROM scans s
    LEFT JOIN scan_results sr ON sr.scan_id = s.id
    WHERE s.id = ${scanId}
    LIMIT 1
  `) as Array<{
    url: string;
    resolved_url: string | null;
    business_name: string | null;
    industry: string | null;
    city: string | null;
    forms_audit: unknown;
    html_snapshot: unknown;
  }>;
  const row = rows[0];
  if (!row) return null;
  const audit = coerceFormsAudit(row.forms_audit);
  const snapshot = coerceHtmlSnapshot(row.html_snapshot);
  return {
    forms: audit?.extracted.forms ?? [],
    html: snapshot?.html ?? null,
    url: row.url,
    resolvedUrl: row.resolved_url,
    businessName: row.business_name,
    industry: row.industry,
    city: row.city,
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
    audioSummaryUrl: result?.audio_summary_url ?? null,
    audioSummaryScript: result?.audio_summary_script ?? null,
    htmlSnapshot: coerceHtmlSnapshot(result?.html_snapshot),
    screenshotsFullPage: coerceFullPageScreenshots(result?.screenshots_fullpage),
    formsAudit: coerceFormsAudit(result?.forms_audit),
    pageCritique: coercePageCritique(result?.page_critique),
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
