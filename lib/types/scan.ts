export type ScanStatus =
  | "pending"
  | "scanning"
  | "analyzing"
  | "complete"
  | "partial"
  | "failed";

/* Structured category of a failed scan. Persisted on
 * scans.failure_kind so the public report page can route the
 * prospect-facing copy off the actual cause rather than a generic
 * "something went wrong" message. Mirrors the
 * `ValidationFailureKind` from lib/services/url.ts (minus the "ok"
 * member, which is not a failure) and adds "pipeline-error" for
 * the residual class of post-validation pipeline failures (a
 * crash inside the screenshot or vision step that escaped the
 * normal partial-scan path).
 *
 * The renderer maps every kind here to a specific headline +
 * body + next-step copy block. New kinds added later default to
 * the "unknown" treatment until copy ships, so adding a new kind
 * is forward-compatible. */
export type ScanFailureKind =
  | "malformed"
  | "protocol"
  | "ssrf-blocked"
  | "dns-fail"
  | "connection-blocked"
  | "timeout"
  | "http-error"
  | "redirect-loop"
  | "redirect-blocked"
  | "pipeline-error"
  | "unknown";

export type PerformanceScores = {
  overall: number;
  lcp: number;
  cls: number;
  inp: number;
  tbt: number;
  si: number;
};

export type LighthouseCategoryScores = {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
};

export type IndustryBenchmark = {
  avgDealValue: number;
  dealValueLow: number;
  dealValueHigh: number;
  avgMonthlyVisitors: number;
  visitorsLow: number;
  visitorsHigh: number;
  source: string;
  confidence: "low" | "medium" | "high";
};

export type ScreenshotPair = {
  desktop: string | null;
  mobile: string | null;
};

/* Stage 2: parallel full-page captures (in addition to the AtF pair).
 * Same data-URI shape; rendered in a collapsible accordion below the AtF
 * hero. Optional everywhere so historical scans without these still load. */
export type FullPageScreenshotPair = {
  desktop: string | null;
  mobile: string | null;
};

/* Stage 2: HTML body captured by the Browserless function alongside the
 * desktop AtF screenshot. Truncated at 256KB at the Browserless boundary. */
export type HtmlSnapshot = {
  html: string;
  capturedAt: string;
  viewport: "desktop" | "mobile";
  truncatedAt: number | null;
};

/* Stage 2: per-<form> descriptor returned by the in-browser DOM walk. The
 * forms-audit step grounds its critique on this shape; the report renders
 * directly from it when the analysis call is skipped or fails. */
export type FormDescriptor = {
  formIndex: number;
  fieldCount: number;
  fieldTypes: Record<string, number>;
  requiredCount: number;
  optionalCount: number;
  hiddenCount: number;
  unlabeledCount: number;
  buttonCopy: string | null;
  action: string | null;
  method: string | null;
  hasLabels: boolean;
  ariaLabel: string | null;
};

/* Stage 2: model-generated, per-form critique. Each item ties back to a
 * descriptor by formIndex so the renderer can pair them visually. */
export type FormsAuditItem = {
  formIndex: number;
  headline: string;
  observation: string;
  nextAction: string;
  impact: "high" | "medium" | "low";
};

export type FormsAuditAnalysis = {
  items: FormsAuditItem[];
};

export type FormsAuditResult = {
  extracted: { forms: FormDescriptor[] };
  analysis: FormsAuditAnalysis | null;
};

/* Stage 1: page critique (CTA inventory + headline alternatives + hero
 * observation). Produced by a new post-finalize side-step that runs after
 * the report email ships. Stage 1 deliberately leaves the existing vision
 * audit schema untouched; this is a separate artifact with its own schema. */

export type PageCtaLocation =
  | "above-the-fold-hero"
  | "above-the-fold-secondary"
  | "navigation"
  | "later-on-page";

export type PageCta = {
  text: string;
  location: PageCtaLocation;
  visibility: number;
  observation: string;
  nextAction: string;
};

export type PageHeadlineAlternative = {
  text: string;
  rationale: string;
};

export type PageHeadline = {
  current: string;
  alternatives: PageHeadlineAlternative[];
};

export type PageCritiqueResult = {
  heroObservation: string;
  headline: PageHeadline;
  ctas: PageCta[];
};

/* Stage 3a: social-share preview. Pure HTML parse of <meta property=og:*>
 * and <meta name=twitter:*> tags from the captured html_snapshot. No AI
 * call. Surfaced under a "When someone shares your site" section so the
 * prospect sees what their link looks like in a Facebook / LinkedIn /
 * Slack feed. */
export type OgPreviewProblemSeverity = "high" | "medium" | "low";

export type OgPreviewProblem = {
  severity: OgPreviewProblemSeverity;
  title: string;
  detail: string;
};

export type OgPreviewMeta = {
  title: string | null;
  description: string | null;
  image: string | null;
  imageAlt: string | null;
  url: string | null;
  siteName: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
};

export type OgPreviewResult = {
  meta: OgPreviewMeta;
  pageTitle: string | null;
  pageDescription: string | null;
  problems: OgPreviewProblem[];
};

/* Capture-confidence layer.
 *
 * Pathlight's automated capture cannot reproduce 100% of what real
 * visitors see in a real browser: video CDNs may refuse to serve our
 * headless agent, autoplay policy may suppress hero videos, hotlink-
 * protected images may not load when our renderer fetches them, mobile
 * capture may fail for transient reasons while desktop succeeds. When
 * any of those happen, the underlying site is fine; our snapshot of it
 * just isn't.
 *
 * A CaptureCaveat names a specific signal we detected that says
 * "this part of the analysis may be limited by capture, not by your
 * site." The report renders these in a top-of-report "Notes on this
 * analysis" section so the prospect reads the rest of the report with
 * appropriate context, and the model's prompts for downstream prose
 * use them to suppress confidently-wrong observations.
 *
 * `kind` is a stable enum the renderer maps to icon + tone. `detail`
 * is the user-facing string surfaced in the notice. `severity`:
 *   informational: neutral note ("a video plays here for visitors")
 *   uncertainty:   actively cautions against weighting an observation
 *                  too heavily ("scores below may be conservative")
 */
export type CaptureCaveatKind =
  | "hero-video-may-render-for-visitors"
  | "og-image-blocked-from-render"
  | "mobile-capture-degraded";

export type CaptureCaveatSeverity = "informational" | "uncertainty";

export type CaptureCaveat = {
  kind: CaptureCaveatKind;
  detail: string;
  severity: CaptureCaveatSeverity;
};

export type DesignMetric = {
  score: number;
  observation: string;
};

export type DesignScores = {
  hero_impact: DesignMetric;
  typography: DesignMetric;
  spacing: DesignMetric;
  color_discipline: DesignMetric;
  photography_quality: DesignMetric;
  cta_clarity: DesignMetric;
  mobile_experience: DesignMetric;
  trust_signals: DesignMetric;
  brand_coherence: DesignMetric;
};

export type PositioningMetric = {
  score: number;
  observation: string;
};

export type PositioningScores = {
  value_proposition: PositioningMetric;
  service_clarity: PositioningMetric;
  social_proof: PositioningMetric;
  contact_accessibility: PositioningMetric;
  competitive_differentiation: PositioningMetric;
};

export type BusinessScale =
  | "single-location"
  | "regional"
  | "national"
  | "global";

export type ScreenshotHealth =
  | "clean"
  | "cookie-banner-overlay"
  | "loading-or-skeleton"
  | "auth-wall"
  | "minimal-content";

export type VisionAuditResult = {
  design: DesignScores;
  positioning: PositioningScores;
  businessModel?: "B2B" | "B2C" | "mixed";
  inferredVertical?: string;
  inferredVerticalParent?: string;
  businessScale?: BusinessScale;
  screenshotHealth?: ScreenshotHealth;
};

export type RemediationImpact = "high" | "medium" | "low";
export type RemediationDifficulty = "easy" | "moderate" | "hard";

export type RemediationItem = {
  title: string;
  problem: string;
  improvement: string;
  impact: RemediationImpact;
  difficulty: RemediationDifficulty;
};

export type RemediationResult = {
  items: RemediationItem[];
};

export type RevenueAssumptions = {
  estimatedMonthlyVisitors: number;
  industryAvgConversionRate: number;
  avgDealValue: number;
  conversionImprovementEstimate: number;
};

export type RevenueImpactResult = {
  estimatedMonthlyLoss: number;
  methodology: string;
  confidence: "low" | "medium" | "high";
  assumptions: RevenueAssumptions;
};

export type PillarScores = {
  design: number;
  performance: number;
  positioning: number;
  searchVisibility: number | null;
};

export type PageTextContent = {
  title: string | null;
  metaDescription: string | null;
  headings: string[];
  linkTexts: string[];
  structuredData: unknown;
};

export type ScanRecord = {
  id: string;
  status: ScanStatus;
  url: string;
  resolvedUrl: string | null;
  email: string;
  businessName: string | null;
  city: string | null;
  scores: PerformanceScores | null;
  screenshotDesktop: string | null;
  screenshotMobile: string | null;
  rawAudit: unknown;
  designAnalysis: unknown;
  positioningAnalysis: unknown;
  remediationPlan: unknown;
  revenueImpact: unknown;
  error: string | null;
  duration: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type PathlightReport = {
  id: string;
  status: ScanStatus;
  url: string;
  resolvedUrl: string | null;
  email: string;
  businessName: string | null;
  city: string | null;
  industry: string | null;
  scores: PerformanceScores | null;
  screenshotDesktop: string | null;
  screenshotMobile: string | null;
  design: DesignScores | null;
  positioning: PositioningScores | null;
  remediation: RemediationResult | null;
  revenueImpact: RevenueImpactResult | null;
  pathlightScore: number | null;
  pillarScores: PillarScores | null;
  lighthouseScores: LighthouseCategoryScores | null;
  industryBenchmark: IndustryBenchmark | null;
  audioSummaryUrl: string | null;
  audioSummaryScript: string | null;
  /* Stage 2 fields. Optional everywhere; pre-Stage-2 scans (and any new
   * scan whose Browserless capture fails partway) load with these as null
   * and the report renders without the corresponding sections. */
  htmlSnapshot: HtmlSnapshot | null;
  screenshotsFullPage: FullPageScreenshotPair | null;
  formsAudit: FormsAuditResult | null;
  /* Stage 1 field. Optional: pre-Stage-1 scans load with this as null and
   * the HeroCritiqueSection returns null gracefully. Late-arriving on a
   * fresh scan because the underlying call runs post-email. */
  pageCritique: PageCritiqueResult | null;
  /* Stage 3a field. Optional: pre-Stage-3 scans and any scan where the
   * html_snapshot did not land load with this as null and the
   * OgPreviewSection returns null gracefully. Lands shortly after status
   * flips to complete; the polling loop in ScanStatus picks it up. */
  ogPreview: OgPreviewResult | null;
  /* Capture-confidence layer (cv1 step). Empty array means cv1 ran and
   * found no caveats applicable to this scan. Null means cv1 has not
   * run yet (pre-feature scans, or fresh scans where the polling loop
   * is still waiting for it). The renderer suppresses the notice when
   * the array is empty or null; non-empty surfaces the top-of-report
   * "Notes on this analysis" section. */
  captureCaveats: CaptureCaveat[] | null;
  /* Structured failure category set when status is "failed". Null
   * for pre-feature scans (which have no failure_kind column value)
   * and for non-failed scans. The failure UI uses this to route
   * prospect-facing copy off the actual cause. */
  failureKind: ScanFailureKind | null;
  businessModel?: "B2B" | "B2C" | "mixed";
  inferredVertical?: string;
  inferredVerticalParent?: string;
  businessScale?: BusinessScale;
  screenshotHealth?: ScreenshotHealth;
  error: string | null;
  duration: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};
