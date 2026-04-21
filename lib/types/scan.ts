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

export type ScreenshotPair = {
  desktop: string | null;
  mobile: string | null;
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
