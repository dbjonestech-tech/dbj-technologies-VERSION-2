export type ScanStatus =
  | "pending"
  | "scanning"
  | "analyzing"
  | "complete"
  | "partial"
  | "failed";

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
