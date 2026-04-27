import * as Sentry from "@sentry/nextjs";
import { getDb } from "../db";
import {
  getExistingAudioSummary,
  getFullScanReport,
  getScanPipelineContext,
  markScanComplete,
  updatePathlightScore,
  updateScanAiAnalysis,
  updateScanAudioSummary,
  updateScanIndustryBenchmark,
  updateScanRemediation,
  updateScanResolvedUrl,
  updateScanResults,
  updateScanRevenueImpact,
  updateScanScreenshots,
  updateScanStatus,
} from "../db/queries";
import { generateVoiceSummary } from "../services/voice";
import type { IndustryBenchmark, PerformanceScores } from "@/lib/types/scan";
import { captureScreenshot } from "../services/browserless";
import {
  extractPageTextContent,
  researchIndustryBenchmark,
  runRemediationPlan,
  runRevenueImpact,
  runVisionAudit,
} from "../services/claude-analysis";
import { runPerformanceAudit } from "../services/pagespeed";
import { calculatePathlightScore } from "../services/scoring";
import { normalizeUrl, validateUrl } from "../services/url";
import {
  buildBenchmarkFromVertical,
  lookupVertical,
} from "../services/vertical-lookup";
import {
  getCachedBenchmark,
  setCachedBenchmark,
} from "../services/benchmark-cache";
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
      const { resolvedUrl } = await step.run("s1", async () => {
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
        "s2",
        async (): Promise<ScreenshotOutcome> => {
          const outcome: ScreenshotOutcome = {
            desktop: null,
            mobile: null,
            errors: [],
          };

          const results = await Promise.allSettled([
            captureScreenshot(resolvedUrl, { width: 1440, height: 900 }, scanId),
            captureScreenshot(resolvedUrl, { width: 375, height: 812 }, scanId),
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

      await step.run("s3", async () => {
        await updateScanStatus(scanId, "analyzing");
      });

      const audit: AuditOutcome = await step.run("s4", async () => {
        try {
          const { scores, raw } = await runPerformanceAudit(resolvedUrl, scanId);
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
        "a1",
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
              ctx.lighthouseData,
              scanId
            );
            await updateScanAiAnalysis(scanId, result);
            return { ok: true };
          } catch (err) {
            return { ok: false, error: describeError(err) };
          }
        }
      );

      const remediationStep: StepOutcome = await step.run(
        "a2",
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
              businessName,
              scanId
            );
            await updateScanRemediation(scanId, result);
            return { ok: true };
          } catch (err) {
            return { ok: false, error: describeError(err) };
          }
        }
      );

      const benchmarkStep: {
        ok: boolean;
        benchmark: IndustryBenchmark | null;
        outOfScope?: boolean;
        error?: string;
      } = await step.run("a3", async () => {
        try {
          const ctx = await getScanPipelineContext(scanId);
          if (!ctx)
            return {
              ok: false,
              error: "no context",
              benchmark: null as IndustryBenchmark | null,
            };

          const scale = ctx.visionAudit?.businessScale;
          if (scale === "national" || scale === "global") {
            console.log(
              `[research-benchmark] businessScale=${scale}, out of Pathlight scope, skipping benchmark research`
            );
            return {
              ok: true,
              outOfScope: true,
              benchmark: null as IndustryBenchmark | null,
            };
          }

          const curatedMatch = lookupVertical(
            ctx.visionAudit?.inferredVertical,
            ctx.visionAudit?.businessModel
          );
          if (
            curatedMatch &&
            (curatedMatch.confidence === "high" ||
              curatedMatch.confidence === "medium")
          ) {
            console.log(
              `[research-benchmark] Curated match: "${curatedMatch.name}" (${curatedMatch.confidence}) — skipping web research`
            );
            const curatedBenchmark = buildBenchmarkFromVertical(curatedMatch);
            try {
              await updateScanIndustryBenchmark(scanId, curatedBenchmark);
            } catch (dbErr) {
              console.error(
                "[research-benchmark] DB write failed (benchmark still available in closure):",
                describeError(dbErr)
              );
            }
            return { ok: true, benchmark: curatedBenchmark };
          }
          console.log(
            `[research-benchmark] ${curatedMatch ? `Single-source match: "${curatedMatch.name}", using web research` : "No curated match, using web research"}`
          );

          const cached = await getCachedBenchmark(
            ctx.visionAudit?.inferredVertical,
            ctx.visionAudit?.businessModel,
            ctx.visionAudit?.inferredVerticalParent
          );
          if (cached) {
            console.log(
              `[research-benchmark] Cache hit for vertical="${ctx.visionAudit?.inferredVertical}" model=${ctx.visionAudit?.businessModel}`
            );
            try {
              await updateScanIndustryBenchmark(scanId, cached);
            } catch (dbErr) {
              console.error(
                "[research-benchmark] DB write failed (cached benchmark still available in closure):",
                describeError(dbErr)
              );
            }
            return { ok: true, benchmark: cached };
          }

          const businessName = await lookupBusinessName(scanId);
          const siteUrl = ctx.resolvedUrl ?? ctx.url;
          const benchmark = await researchIndustryBenchmark(
            ctx.industry,
            ctx.city,
            siteUrl,
            businessName,
            ctx.visionAudit?.businessModel ?? "B2C",
            ctx.visionAudit?.inferredVertical ?? "general",
            ctx.visionAudit?.inferredVerticalParent ?? "Other",
            scanId
          );
          if (benchmark) {
            try {
              await updateScanIndustryBenchmark(scanId, benchmark);
            } catch (dbErr) {
              console.error(
                "[research-benchmark] DB write failed (benchmark still available in closure):",
                describeError(dbErr)
              );
            }
            await setCachedBenchmark(
              ctx.visionAudit?.inferredVertical,
              ctx.visionAudit?.businessModel,
              ctx.visionAudit?.inferredVerticalParent,
              benchmark
            );
          }
          return { ok: true, benchmark };
        } catch (err) {
          return {
            ok: false,
            error: describeError(err),
            benchmark: null as IndustryBenchmark | null,
          };
        }
      });

      const revenueStep: StepOutcome = await step.run(
        "a4",
        async () => {
          if (!visionStep.ok) {
            return { ok: false, error: "skipped: vision audit did not succeed" };
          }
          if (benchmarkStep.outOfScope) {
            return { ok: true };
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
              ctx.lighthouseData,
              benchmarkStep.benchmark ?? null,
              scanId
            );
            await updateScanRevenueImpact(scanId, result);
            return { ok: true };
          } catch (err) {
            return { ok: false, error: describeError(err) };
          }
        }
      );

      const scoreStep: StepOutcome = await step.run(
        "s5",
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

            const lhData = ctx.lighthouseData as Record<string, any> | null;
            const rawSeo = lhData?.categories?.seo?.score;
            const rawA11y = lhData?.categories?.accessibility?.score;
            const seo: number | null =
              typeof rawSeo === "number" && isFinite(rawSeo)
                ? Math.round(rawSeo * 100)
                : null;
            const accessibility: number | null =
              typeof rawA11y === "number" && isFinite(rawA11y)
                ? Math.round(rawA11y * 100)
                : null;

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

      await step.run("s6", async () => {
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

      // a5: best-effort audio summary generation. Runs after the
      // report is marked complete and before the report email goes
      // out so the email can link to the audio. Any failure here
      // (Haiku, ElevenLabs, Vercel Blob, missing env var) is
      // swallowed -- the email and report still ship without audio.
      await step.run("a5", async () => {
        try {
          const existing = await getExistingAudioSummary(scanId);
          if (existing.url) {
            return { ok: true, skipped: "already-generated" };
          }
          const report = await getFullScanReport(scanId);
          if (!report) return { ok: false, error: "no report" };
          if (report.status !== "complete" && report.status !== "partial") {
            return { ok: false, error: `status=${report.status}` };
          }
          // Skip out-of-scope (national/global) brands -- the
          // narration leans on the revenue estimate and that estimate
          // is intentionally suppressed for those scans.
          if (
            report.businessScale === "national" ||
            report.businessScale === "global"
          ) {
            return { ok: true, skipped: `scale=${report.businessScale}` };
          }
          // Skip if there's no remediation data to ground the
          // narration -- no point reading a generic script.
          if (
            !report.remediation ||
            report.remediation.items.length === 0
          ) {
            return { ok: true, skipped: "no-remediation" };
          }
          const result = await generateVoiceSummary(report);
          await updateScanAudioSummary(scanId, result.audioUrl, result.script);
          return {
            ok: true,
            audioUrl: result.audioUrl,
            characters: result.characters,
            audioBytes: result.audioBytes,
            durationMs: result.durationMs,
          };
        } catch (err) {
          // Log but never throw; the report email + scan completion
          // path is the priority here.
          console.warn(
            "[a5] audio summary failed (scan still ships):",
            describeError(err)
          );
          return { ok: false, error: describeError(err) };
        }
      });

      await step.run("e1", async () => {
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

      await step.sleep("w1", "48h");

      await step.run("e2", async () => {
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
          const suppression = await shouldSuppressFollowup(scanId);
          if (suppression.suppress) {
            await logEmailEvent({
              scanId,
              emailType: "followup_48h",
              status: "skipped",
              errorMessage: `suppressed:${suppression.reason}`,
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

      await step.sleep("w2", "72h");

      await step.run("e3", async () => {
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
          const suppression = await shouldSuppressFollowup(scanId);
          if (suppression.suppress) {
            await logEmailEvent({
              scanId,
              emailType: "followup_5d",
              status: "skipped",
              errorMessage: `suppressed:${suppression.reason}`,
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

      await step.sleep("w3", "72h");

      await step.run("e4", async () => {
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
          const suppression = await shouldSuppressFollowup(scanId);
          if (suppression.suppress) {
            await logEmailEvent({
              scanId,
              emailType: "breakup_8d",
              status: "skipped",
              errorMessage: `suppressed:${suppression.reason}`,
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

const FOLLOWUP_SUPPRESS_EMAIL_DOMAINS = new Set([
  "dbjtechnologies.com",
]);

const FOLLOWUP_HIGH_SCORE_THRESHOLD = 90;

async function shouldSuppressFollowup(scanId: string): Promise<{
  suppress: boolean;
  reason?: string;
}> {
  const sql = getDb();
  const rows = (await sql`
    SELECT s.email, sr.pathlight_score, sr.ai_analysis
    FROM scans s
    LEFT JOIN scan_results sr ON sr.scan_id = s.id
    WHERE s.id = ${scanId}
    LIMIT 1
  `) as {
    email: string | null;
    pathlight_score: number | null;
    ai_analysis: unknown;
  }[];
  const row = rows[0];
  if (!row) return { suppress: false };

  if (row.email) {
    const domain = row.email.toLowerCase().split("@")[1] ?? "";
    if (FOLLOWUP_SUPPRESS_EMAIL_DOMAINS.has(domain)) {
      return { suppress: true, reason: `internal-domain:${domain}` };
    }
  }

  if (
    typeof row.pathlight_score === "number" &&
    row.pathlight_score >= FOLLOWUP_HIGH_SCORE_THRESHOLD
  ) {
    return {
      suppress: true,
      reason: `high-score:${row.pathlight_score}`,
    };
  }

  if (row.ai_analysis && typeof row.ai_analysis === "object") {
    const scale = (row.ai_analysis as Record<string, unknown>).businessScale;
    if (scale === "national" || scale === "global") {
      return { suppress: true, reason: `out-of-scope:${scale}` };
    }
  }

  return { suppress: false };
}

/**
 * Daily cost-alert cron. Fires once a day in America/Chicago (the
 * studio's home timezone) and warns if the prior 24-hour API spend
 * crossed the threshold.
 *
 * Threshold defaults to $10/day. Override via COST_DAILY_ALERT_USD
 * in Vercel. Warning at threshold, error at 2x threshold.
 *
 * Pairs with the api_usage_events table seeded by migration 007 and
 * the recordAnthropicUsage / recordBrowserlessUsage / recordPagespeedUsage
 * helpers.
 */
export const costAlertDaily = inngest.createFunction(
  {
    id: "pathlight-cost-alert-daily",
    triggers: [{ cron: "TZ=America/Chicago 0 9 * * *" }],
    retries: 0,
  },
  async ({ step }) => {
    await step.run("check-daily-spend", async () => {
      const sql = getDb();
      const rows = (await sql`
        SELECT
          provider,
          COUNT(*)::int AS calls,
          SUM(cost_usd) AS total_usd
        FROM api_usage_events
        WHERE occurred_at > now() - interval '1 day'
        GROUP BY provider
      `) as { provider: string; calls: number; total_usd: string | number }[];

      const breakdown = rows.map((r) => ({
        provider: r.provider,
        calls: Number(r.calls),
        totalUsd: Number(r.total_usd),
      }));
      const totalUsd = breakdown.reduce((sum, r) => sum + r.totalUsd, 0);
      const totalCalls = breakdown.reduce((sum, r) => sum + r.calls, 0);

      const thresholdRaw = process.env.COST_DAILY_ALERT_USD;
      const threshold = (() => {
        const parsed = thresholdRaw ? Number(thresholdRaw) : NaN;
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
      })();

      console.log(
        `[cost-alert] 24h spend $${totalUsd.toFixed(2)} across ${totalCalls} calls (threshold $${threshold.toFixed(2)})`,
        breakdown
      );

      if (totalUsd < threshold) {
        return {
          totalUsd,
          totalCalls,
          breakdown,
          alerted: false,
        };
      }

      const level = totalUsd >= threshold * 2 ? "error" : "warning";
      const message = `Pathlight 24h API spend $${totalUsd.toFixed(2)} exceeded threshold $${threshold.toFixed(2)}`;
      Sentry.captureMessage(message, {
        level,
        tags: { source: "cost-monitor" },
        extra: { totalUsd, totalCalls, breakdown, threshold },
      });
      return { totalUsd, totalCalls, breakdown, alerted: true, level };
    });
  }
);
