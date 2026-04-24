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

export type VisionAuditResult = {
  design: DesignScores;
  positioning: PositioningScores;
  businessModel?: "B2B" | "B2C" | "mixed";
  inferredVertical?: string;
  inferredVerticalParent?: string;
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
  searchVisibility: number;
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
  error: string | null;
  duration: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};
