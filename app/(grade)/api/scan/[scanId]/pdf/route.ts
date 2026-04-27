import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getFullScanReport } from "@/lib/db/queries";
import { generatePdf } from "@/lib/services/browserless";
import { pdfLimiter, extractIp } from "@/lib/rate-limit";

/* runtime/dynamic exports omitted: the default Node.js runtime is
   required so node:buffer + the Browserless POST work, and the
   handler does not need cacheComponents semantics. */

const PDF_FALLBACK_FILENAME = "Pathlight-Report.pdf";

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://dbjtechnologies.com"
  );
}

function buildFilename(report: { url: string; createdAt: string }): string {
  let hostnameSlug = "";
  try {
    const u = new URL(report.url);
    hostnameSlug = u.hostname
      .replace(/^www\./i, "")
      .replace(/[^a-z0-9-]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()
      .slice(0, 60);
  } catch {
    /* fall back to fallback filename */
  }
  if (!hostnameSlug) return PDF_FALLBACK_FILENAME;

  let datePart = "";
  try {
    datePart = new Date(report.createdAt).toISOString().slice(0, 10);
  } catch {
    /* keep empty */
  }
  return datePart
    ? `Pathlight-Report-${hostnameSlug}-${datePart}.pdf`
    : `Pathlight-Report-${hostnameSlug}.pdf`;
}

/**
 * GET /api/scan/[scanId]/pdf
 *
 * Renders the public report page with print stylesheet emulation via
 * Browserless and streams the PDF back as a download. On-demand only:
 * we do not pre-generate or cache PDFs because most scans never get a
 * download request, and the scan data does not change after the scan
 * completes so the regenerated copy is always identical.
 *
 * Auth posture matches the report page itself — UUID scanId is the
 * only gate. Adding auth to the PDF endpoint without also adding it
 * to /pathlight/[scanId] would be inconsistent (a viewer could just
 * Cmd+P the report). Tracked in backlog as the "no auth on report
 * URL" gap.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const ipCheck = await pdfLimiter(extractIp(request));
  if (!ipCheck.success) {
    return NextResponse.json(
      { error: "Too many PDF requests. Try again tomorrow." },
      { status: 429, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { scanId } = await params;
  const report = await getFullScanReport(scanId);

  if (!report) {
    return NextResponse.json(
      { error: "Scan not found." },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (report.status !== "complete" && report.status !== "partial") {
    return NextResponse.json(
      {
        error:
          "Report is not ready yet. Wait for the scan to finish before downloading the PDF.",
      },
      { status: 409, headers: { "Cache-Control": "no-store" } }
    );
  }

  const reportUrl = `${getSiteUrl()}/pathlight/${scanId}`;
  const filename = buildFilename(report);

  let pdf: Buffer;
  try {
    pdf = await generatePdf(reportUrl, scanId);
  } catch (err) {
    Sentry.captureException(err, {
      tags: { source: "pdf-report" },
      extra: { scanId },
    });
    console.error("[pdf-report] generation failed", err);
    return NextResponse.json(
      {
        error: "Could not generate the PDF. Please try again in a moment.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": pdf.byteLength.toString(),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
