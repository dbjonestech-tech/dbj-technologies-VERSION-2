import { NextResponse } from "next/server";
import { getScanById } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params;
  const record = await getScanById(scanId);

  if (!record) {
    return NextResponse.json(
      { error: "Scan not found" },
      { status: 404, headers: { "Cache-Control": "no-cache" } }
    );
  }

  return NextResponse.json(
    {
      scanId: record.id,
      id: record.id,
      status: record.status,
      url: record.url,
      resolvedUrl: record.resolvedUrl,
      scores: record.scores,
      screenshotDesktop: record.screenshotDesktop,
      screenshotMobile: record.screenshotMobile,
      error: record.error,
      errorMessage: record.error,
      duration: record.duration,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      completedAt: record.completedAt,
    },
    { headers: { "Cache-Control": "no-cache" } }
  );
}
