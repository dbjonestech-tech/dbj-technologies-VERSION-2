import { getDb } from "./index";
import type {
  PerformanceScores,
  ScanRecord,
  ScanStatus,
  ScreenshotPair,
} from "@/lib/types/scan";

type ScanRow = {
  id: string;
  status: string;
  url: string;
  resolved_url: string | null;
  email: string;
  business_name: string | null;
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
  pillar_scores: PerformanceScores | null;
  remediation_items: unknown;
  revenue_impact: unknown;
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
  scores: PerformanceScores,
  rawAudit: unknown,
  durationMs: number,
  resolvedUrl: string
): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO scan_results (scan_id, lighthouse_data, pathlight_score, pillar_scores)
    VALUES (
      ${scanId},
      ${JSON.stringify(rawAudit)}::jsonb,
      ${scores.overall},
      ${JSON.stringify(scores)}::jsonb
    )
    ON CONFLICT (scan_id) DO UPDATE
    SET lighthouse_data = EXCLUDED.lighthouse_data,
        pathlight_score = EXCLUDED.pathlight_score,
        pillar_scores = EXCLUDED.pillar_scores
  `;
  await sql`
    UPDATE scans
    SET scan_duration_ms = ${durationMs},
        resolved_url = ${resolvedUrl},
        updated_at = now()
    WHERE id = ${scanId}
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

function coerceScores(v: unknown): PerformanceScores | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const pick = (k: string) => (typeof o[k] === "number" ? (o[k] as number) : 0);
  return {
    overall: pick("overall"),
    lcp: pick("lcp"),
    cls: pick("cls"),
    inp: pick("inp"),
    tbt: pick("tbt"),
    si: pick("si"),
  };
}

export async function getScanById(scanId: string): Promise<ScanRecord | null> {
  const sql = getDb();
  const scanRows = (await sql`
    SELECT id, status, url, resolved_url, email, business_name, city,
           error_message, scan_duration_ms, created_at, updated_at, completed_at
    FROM scans
    WHERE id = ${scanId}
    LIMIT 1
  `) as ScanRow[];

  if (scanRows.length === 0) return null;
  const scan = scanRows[0]!;

  const resultRows = (await sql`
    SELECT lighthouse_data, screenshots, ai_analysis, pathlight_score,
           pillar_scores, remediation_items, revenue_impact
    FROM scan_results
    WHERE scan_id = ${scanId}
    ORDER BY created_at DESC
    LIMIT 1
  `) as ScanResultsRow[];

  const result = resultRows[0] ?? null;
  const scores = coerceScores(result?.pillar_scores);
  const screenshots = result?.screenshots ?? null;
  const ai = result?.ai_analysis ?? null;

  return {
    id: scan.id,
    status: scan.status as ScanStatus,
    url: scan.url,
    resolvedUrl: scan.resolved_url,
    email: scan.email,
    businessName: scan.business_name,
    city: scan.city,
    scores,
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
