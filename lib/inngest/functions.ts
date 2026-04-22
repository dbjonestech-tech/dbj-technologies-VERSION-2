import { getDb } from "../db";
import {
  getScanPipelineContext,
  markScanComplete,
  updatePathlightScore,
  updateScanAiAnalysis,
  updateScanRemediation,
  updateScanResolvedUrl,
  updateScanResults,
  updateScanRevenueImpact,
  updateScanScreenshots,
  updateScanStatus,
} from "../db/queries";
import type { PerformanceScores } from "@/lib/types/scan";
import { captureScreenshot } from "../services/browserless";
import {
  extractPageTextContent,
  runRemediationPlan,
  runRevenueImpact,
  runVisionAudit,
} from "../services/claude-analysis";
import { runPerformanceAudit } from "../services/pagespeed";
import { calculatePathlightScore } from "../services/scoring";
import { normalizeUrl, validateUrl } from "../services/url";
import {
  logEmailEvent,
  sendFollowUp,
  sendPathlightReport,
} from "../services/email";
import { isUnsubscribed } from "../services/unsubscribe";
import { inngest } from "./client";

class ScanValidationError extends Error {}

type ScreenshotOutcome = {
  desktop: string | null;
  mobile: string | null;
  errors: string[];
};

type StepOutcome = { ok: boolean; error?: string };
type AuditOutcome = {
  ok: boolean;
  error: string | null;
  scores: PerformanceScores | null;
};

function describeError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export const scanRequested = inngest.createFunction(
  {
    id: "pathlight-scan-requested",
    triggers: [{ event: "pathlight/scan.requested" }],
    timeouts: { finish: "420s" },
    retries: 1,
  },
  async ({ event, step }) => {
    const { scanId } = event.data as { scanId: string };
    const startedAt = Date.now();

    try {
      const { resolvedUrl } = await step.run("validate-url", async () => {
        const sql = getDb();
        const rows = (await sql`
          SELECT url FROM scans WHERE id = ${scanId} LIMIT 1
        `) as { url: string }[];
        if (rows.length === 0) {
          throw new ScanValidationError("Scan record not found.");
        }

        let normalized: string;
        try {
          normalized = normalizeUrl(rows[0]!.url);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "URL is invalid.";
          throw new ScanValidationError(msg);
        }

        const result = await validateUrl(normalized);
        if (!result.valid) {
          throw new ScanValidationError(result.error ?? "URL is not reachable.");
        }

        const finalUrl = result.resolvedUrl ?? normalized;
        await updateScanResolvedUrl(scanId, finalUrl);
        await updateScanStatus(scanId, "scanning");
        return { resolvedUrl: finalUrl };
      });

      const screenshots: ScreenshotOutcome = await step.run(
        "capture-screenshots",
        async (): Promise<ScreenshotOutcome> => {
          const outcome: ScreenshotOutcome = {
            desktop: null,
            mobile: null,
            errors: [],
          };

          const results = await Promise.allSettled([
            captureScreenshot(resolvedUrl, { width: 1440, height: 900 }),
            captureScreenshot(resolvedUrl, { width: 375, height: 812 }),
          ]);

          if (results[0].status === "fulfilled") {
            outcome.desktop = `data:image/jpeg;base64,${results[0].value.toString("base64")}`;
          } else {
            outcome.errors.push(
              `desktop: ${(results[0].reason as Error)?.message ?? "unknown"}`
            );
          }

          if (results[1].status === "fulfilled") {
            outcome.mobile = `data:image/jpeg;base64,${results[1].value.toString("base64")}`;
          } else {
            outcome.errors.push(
              `mobile: ${(results[1].reason as Error)?.message ?? "unknown"}`
            );
          }

          if (outcome.desktop || outcome.mobile) {
            await updateScanScreenshots(scanId, outcome.desktop, outcome.mobile);
          }

          return outcome;
        }
      );

      await step.run("mark-analyzing", async () => {
        await updateScanStatus(scanId, "analyzing");
      });

      const audit: AuditOutcome = await step.run("run-audit", async () => {
        try {
          const { scores, raw } = await runPerformanceAudit(resolvedUrl);
          const durationMs = Date.now() - startedAt;
          await updateScanResults(scanId, raw, durationMs, resolvedUrl);
          return { ok: true, error: null, scores };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Performance audit failed.";
          return { ok: false, error: message, scores: null };
        }
      });

      const visionStep: StepOutcome = await step.run(
        "ai-vision-audit",
        async () => {
          if (!audit.ok || !audit.scores) {
            return { ok: false, error: "skipped: performance audit failed" };
          }
          if (!screenshots.desktop || !screenshots.mobile) {
            return {
              ok: false,
              error: "skipped: one or both screenshots are missing",
            };
          }
          try {
            const ctx = await getScanPipelineContext(scanId);
            if (!ctx) return { ok: false, error: "scan record vanished" };
            const pageText = extractPageTextContent(ctx.lighthouseData);
            const businessName = await lookupBusinessName(scanId);
            const siteUrl = ctx.resolvedUrl ?? ctx.url;
            const result = await runVisionAudit(
              screenshots.desktop,
              screenshots.mobile,
              ctx.industry,
              ctx.city,
              audit.scores,
              pageText,
              siteUrl,
              businessName,
              ctx.lighthouseData
            );
            await updateScanAiAnalysis(scanId, result);
            return { ok: true };
          } catch (err) {
            return { ok: false, error: describeError(err) };
          }
        }
      );

      const remediationStep: StepOutcome = await step.run(
        "ai-remediation",
        async () => {
          if (!visionStep.ok) {
            return { ok: false, error: "skipped: vision audit did not succeed" };
          }
          if (!audit.scores) {
            return { ok: false, error: "skipped: performance scores unavailable" };
          }
          try {
            const ctx = await getScanPipelineContext(scanId);
            if (!ctx || !ctx.visionAudit) {
              return { ok: false, error: "missing prerequisites" };
            }
            const businessName = await lookupBusinessName(scanId);
            const siteUrl = ctx.resolvedUrl ?? ctx.url;
            const result = await runRemediationPlan(
              ctx.visionAudit,
              audit.scores,
              ctx.industry,
              ctx.city,
              siteUrl,
              businessName
            );
            await updateScanRemediation(scanId, result);
            return { ok: true };
          } catch (err) {
            return { ok: false, error: describeError(err) };
          }
        }
      );

      const revenueStep: StepOutcome = await step.run(
        "ai-revenue-impact",
        async () => {
          if (!visionStep.ok) {
            return { ok: false, error: "skipped: vision audit did not succeed" };
          }
          if (!remediationStep.ok) {
            return { ok: false, error: "skipped: remediation plan unavailable" };
          }
          if (!audit.scores) {
            return { ok: false, error: "skipped: performance scores unavailable" };
          }
          try {
            const ctx = await getScanPipelineContext(scanId);
            if (!ctx || !ctx.visionAudit || !ctx.remediation) {
              return { ok: false, error: "missing prerequisites" };
            }
            const businessName = await lookupBusinessName(scanId);
            const siteUrl = ctx.resolvedUrl ?? ctx.url;
            const result = await runRevenueImpact(
              ctx.visionAudit,
              ctx.remediation,
              ctx.industry,
              ctx.city,
              siteUrl,
              businessName,
              audit.scores,
              ctx.lighthouseData
            );
            await updateScanRevenueImpact(scanId, result);
            return { ok: true };
          } catch (err) {
            return { ok: false, error: describeError(err) };
          }
        }
      );

      const scoreStep: StepOutcome = await step.run(
        "calculate-score",
        async () => {
          if (!visionStep.ok) {
            return { ok: false, error: "skipped: vision audit did not succeed" };
          }
          if (!audit.scores) {
            return { ok: false, error: "skipped: performance scores unavailable" };
          }
          try {
            const ctx = await getScanPipelineContext(scanId);
            if (!ctx || !ctx.visionAudit) {
              return { ok: false, error: "missing prerequisites" };
            }

            let seo = audit.scores.overall;
            let accessibility = audit.scores.overall;
            const lhData = ctx.lighthouseData as Record<string, any> | null;
            const rawSeo = lhData?.categories?.seo?.score;
            const rawA11y = lhData?.categories?.accessibility?.score;
            seo = typeof rawSeo === "number" && isFinite(rawSeo) ? Math.round(rawSeo * 100) : audit.scores.overall;
            accessibility = typeof rawA11y === "number" && isFinite(rawA11y) ? Math.round(rawA11y * 100) : audit.scores.overall;

            const { pathlightScore, pillarScores } = calculatePathlightScore(
              ctx.visionAudit.design,
              audit.scores.overall,
              ctx.visionAudit.positioning,
              seo,
              accessibility
            );
            await updatePathlightScore(scanId, pathlightScore, pillarScores);
            return { ok: true };
          } catch (err) {
            return { ok: false, error: describeError(err) };
          }
        }
      );

      await step.run("finalize", async () => {
        const haveScreenshots =
          screenshots.desktop !== null || screenshots.mobile !== null;
        const errors: string[] = [];
        if (!audit.ok && audit.error) errors.push(`audit: ${audit.error}`);
        if (screenshots.errors.length > 0) errors.push(...screenshots.errors);
        if (!visionStep.ok) errors.push(`vision: ${visionStep.error ?? "unknown"}`);
        if (!remediationStep.ok)
          errors.push(`remediation: ${remediationStep.error ?? "unknown"}`);
        if (!revenueStep.ok)
          errors.push(`revenue: ${revenueStep.error ?? "unknown"}`);
        if (!scoreStep.ok) errors.push(`score: ${scoreStep.error ?? "unknown"}`);

        const hardFail = !audit.ok && !haveScreenshots;
        if (hardFail) {
          await updateScanStatus(
            scanId,
            "failed",
            errors.join("; ") || "Scan produced no data."
          );
          return;
        }

        const aiFullySucceeded =
          visionStep.ok && remediationStep.ok && revenueStep.ok && scoreStep.ok;
        const delivered =
          audit.ok && haveScreenshots && aiFullySucceeded;

        if (!delivered) {
          await markScanComplete(scanId, "partial", errors.join("; "));
          return;
        }

        await markScanComplete(
          scanId,
          "complete",
          errors.length > 0 ? errors.join("; ") : undefined
        );
      });

      await step.run("send-report-email", async () => {
        try {
          await sendPathlightReport(scanId);
        } catch (err) {
          await logEmailEvent({
            scanId,
            emailType: "report_delivery",
            status: "failed",
            errorMessage: describeError(err),
          }).catch(() => {});
        }
      });

      await step.sleep("wait-for-followup-1", "48h");

      await step.run("send-followup-1", async () => {
        try {
          const email = await lookupScanEmail(scanId);
          if (email && (await isUnsubscribed(email))) {
            await logEmailEvent({
              scanId,
              emailType: "followup_48h",
              status: "skipped",
            });
            return;
          }
          await sendFollowUp(scanId, 2);
        } catch (err) {
          await logEmailEvent({
            scanId,
            emailType: "followup_48h",
            status: "failed",
            errorMessage: describeError(err),
          }).catch(() => {});
        }
      });

      await step.sleep("wait-for-followup-2", "72h");

      await step.run("send-followup-2", async () => {
        try {
          const email = await lookupScanEmail(scanId);
          if (email && (await isUnsubscribed(email))) {
            await logEmailEvent({
              scanId,
              emailType: "followup_5d",
              status: "skipped",
            });
            return;
          }
          await sendFollowUp(scanId, 3);
        } catch (err) {
          await logEmailEvent({
            scanId,
            emailType: "followup_5d",
            status: "failed",
            errorMessage: describeError(err),
          }).catch(() => {});
        }
      });

      await step.sleep("wait-for-breakup", "72h");

      await step.run("send-breakup", async () => {
        try {
          const email = await lookupScanEmail(scanId);
          if (email && (await isUnsubscribed(email))) {
            await logEmailEvent({
              scanId,
              emailType: "breakup_8d",
              status: "skipped",
            });
            return;
          }
          await sendFollowUp(scanId, 4);
        } catch (err) {
          await logEmailEvent({
            scanId,
            emailType: "breakup_8d",
            status: "failed",
            errorMessage: describeError(err),
          }).catch(() => {});
        }
      });

      return { scanId, status: "finalized" };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Scan pipeline failed.";
      await updateScanStatus(scanId, "failed", message).catch(() => {});
      if (err instanceof ScanValidationError) {
        return { scanId, status: "failed", error: message };
      }
      throw err;
    }
  }
);

async function lookupBusinessName(scanId: string): Promise<string | null> {
  const sql = getDb();
  const rows = (await sql`
    SELECT business_name FROM scans WHERE id = ${scanId} LIMIT 1
  `) as { business_name: string | null }[];
  return rows[0]?.business_name ?? null;
}

async function lookupScanEmail(scanId: string): Promise<string | null> {
  const sql = getDb();
  const rows = (await sql`
    SELECT email FROM scans WHERE id = ${scanId} LIMIT 1
  `) as { email: string }[];
  return rows[0]?.email ?? null;
}
