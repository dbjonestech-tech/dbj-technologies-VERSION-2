import { NextResponse } from "next/server";
import { getFullScanReport } from "@/lib/db/queries";

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

  return NextResponse.json(
    {
      // Backward-compatible fields for the existing poller
      scanId: report.id,
      id: report.id,
      status: report.status,
      url: report.url,
      resolvedUrl: report.resolvedUrl,
      scores: report.scores,
      screenshotDesktop: report.screenshotDesktop,
      screenshotMobile: report.screenshotMobile,
      error: report.error,
      errorMessage: report.error,
      duration: report.duration,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      completedAt: report.completedAt,
      // Full Pathlight report
      businessName: report.businessName ?? null,
      industry: report.industry,
      design: report.design,
      positioning: report.positioning,
      remediation: report.remediation,
      revenueImpact: report.revenueImpact,
      pathlightScore: report.pathlightScore,
      pillarScores: report.pillarScores,
      lighthouseScores: report.lighthouseScores ?? null,
      industryBenchmark: report.industryBenchmark ?? null,
      businessScale: report.businessScale,
      screenshotHealth: report.screenshotHealth,
    },
    { headers: { "Cache-Control": "no-cache" } }
  );
}
