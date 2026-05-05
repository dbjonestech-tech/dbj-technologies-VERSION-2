import { NextResponse } from "next/server";
import { getFullScanReport } from "@/lib/db/queries";
import type { ScreenshotHealth } from "@/lib/types/scan";

const SCREENSHOT_NOTICES: Record<Exclude<ScreenshotHealth, "clean">, string> = {
  "cookie-banner-overlay":
    "The screenshot shows a cookie or privacy consent dialog covering most of the page. Design and positioning scores are based on what was visible behind the overlay and should be read with extra caution.",
  "loading-or-skeleton":
    "The screenshot captured the page in a pre-render or loading state. Scores are based on the available content and should be treated as low-confidence. Re-run the scan in a few minutes for a cleaner capture.",
  "auth-wall":
    "The URL points to a login, signup, or paywall page rather than a public homepage. Pathlight scored what was visible, but the meaningful audit lives behind the auth gate. Paste the public homepage URL for a calibrated report.",
  "minimal-content":
    "The page rendered fully but contained very little content (likely a placeholder, under-construction, or coming-soon page). Scores reflect the sparse capture rather than a finished site.",
};

const FRIENDLY_ERROR_FALLBACK =
  "Something went wrong with the scan. Please try again, and if the problem persists, contact us.";

function sanitizeScanError(raw: string | null): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (
    lower.includes("401") ||
    lower.includes("invalid api key") ||
    lower.includes("api key")
  ) {
    return "Our scanning service is temporarily unavailable. Please try again in a few minutes.";
  }
  if (
    lower.includes("429") ||
    lower.includes("quota") ||
    lower.includes("rate limit")
  ) {
    return "We're experiencing high demand. Please try again in a few minutes.";
  }
  if (lower.includes("timeout") || lower.includes("etimedout")) {
    return "The scan took too long to complete. The target website may be slow to respond. Please try again.";
  }
  if (
    lower.includes("enotfound") ||
    lower.includes("dns") ||
    lower.includes("getaddrinfo")
  ) {
    return "We couldn't reach that website. Please check the URL and try again.";
  }
  if (lower.includes("ssl") || lower.includes("certificate")) {
    return "We couldn't establish a secure connection to that website. The site may have SSL issues.";
  }
  return FRIENDLY_ERROR_FALLBACK;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params;
  const report = await getFullScanReport(scanId);

  if (!report) {
    return NextResponse.json(
      { error: "Scan not found" },
      { status: 404, headers: { "Cache-Control": "no-cache" } }
    );
  }

  const isOutOfScope =
    report.businessScale === "national" || report.businessScale === "global";

  const screenshotNotice =
    report.screenshotHealth && report.screenshotHealth !== "clean"
      ? (SCREENSHOT_NOTICES[
          report.screenshotHealth as Exclude<ScreenshotHealth, "clean">
        ] ?? null)
      : null;

  const friendlyError = sanitizeScanError(report.error);

  return NextResponse.json(
    {
      scanId: report.id,
      id: report.id,
      status: report.status,
      url: report.url,
      resolvedUrl: report.resolvedUrl,
      scores: report.scores,
      screenshotDesktop: report.screenshotDesktop,
      screenshotMobile: report.screenshotMobile,
      error: friendlyError,
      errorMessage: friendlyError,
      duration: report.duration,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      completedAt: report.completedAt,
      businessName: report.businessName ?? null,
      industry: report.industry,
      design: report.design,
      positioning: report.positioning,
      remediation: report.remediation,
      revenueImpact: report.revenueImpact,
      pathlightScore: report.pathlightScore,
      pillarScores: report.pillarScores,
      lighthouseScores: report.lighthouseScores ?? null,
      audioSummaryUrl: report.audioSummaryUrl,
      /* Stage 2 fields. screenshotsFullPage is rendered in a collapsed
       * accordion below the AtF hero pair. formsAudit ships both the
       * structural descriptors (so the report can render even before
       * the analysis call returns) and the analysis itself. The HTML
       * snapshot is intentionally NOT surfaced; it is internal source
       * data for downstream text-side analyses. */
      screenshotsFullPage: report.screenshotsFullPage,
      formsAudit: report.formsAudit,
      /* Stage 1 field. Same posture as Stage 2's screenshotsFullPage and
       * formsAudit: the rendered output is public-OK (CTA list, headline
       * alternatives, hero observation) and shows up late on a fresh scan
       * because the underlying call runs post-email. */
      pageCritique: report.pageCritique,
      /* Stage 3a field. Pure HTML parse output: parsed OG / Twitter card
       * metadata plus a list of structural problems. Late-arriving on a
       * fresh scan because the o1 step runs after c1; the polling loop
       * in ScanStatus picks it up without requiring a refresh. */
      ogPreview: report.ogPreview,
      /* Capture-confidence field. Empty array means cv1 ran and found
       * no caveats applicable to this scan. Null means cv1 has not yet
       * run (pre-feature scans, or fresh scans where the polling loop
       * is still waiting on it). The renderer suppresses the top-of-
       * report Notes section when this is empty or null. */
      captureCaveats: report.captureCaveats,
      isOutOfScope,
      outOfScopeLabel: isOutOfScope
        ? report.businessScale === "global"
          ? "global brand"
          : "national brand"
        : null,
      screenshotNotice,
    },
    { headers: { "Cache-Control": "no-cache" } }
  );
}
