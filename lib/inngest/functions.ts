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
  updateScanFormsAudit,
  updateScanFormsExtracted,
  updateScanFullPageScreenshots,
  updateScanHtmlSnapshot,
  updateScanIndustryBenchmark,
  updateScanRemediation,
  updateScanResolvedUrl,
  updateScanResults,
  updateScanRevenueImpact,
  updateScanScreenshots,
  updateScanStatus,
} from "../db/queries";
import { generateVoiceSummary } from "../services/voice";
import { getProviderSpendUsd } from "../services/api-usage";
import { track } from "../services/monitoring";
import { refreshFunnelViews } from "../services/funnel";
import { runInfrastructureChecks } from "../services/infrastructure";
import { snapshotInngestRuns } from "../services/inngest-health";
import { snapshotVercelDeployments } from "../services/vercel-platform";
import { snapshotAnthropicBudget } from "../services/anthropic-budget";
import { importSearchConsoleDaily } from "../services/search-console";
import { refreshEmailKpi } from "../services/email-kpi";
import { upsertContactFromScan } from "../services/contacts";
import {
  MONITORED_PAGES,
  STRATEGIES,
  auditAndRecord,
  getRollingMedians,
} from "../services/lighthouse-monitor";
import type { IndustryBenchmark, PerformanceScores } from "@/lib/types/scan";
import {
  captureFullPageScreenshot,
  captureScreenshot,
} from "../services/browserless";
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
  /* Stage 2: full-page captures, optional. Same data-URI shape as the AtF
   * pair. Failure here is silent (these render in a collapsed accordion
   * and absence is benign). */
  desktopFullPage: string | null;
  mobileFullPage: string | null;
  /* Stage 2: HTML body + form descriptors captured alongside the desktop
   * AtF screenshot. Source for the post-finalize forms-audit step and the
   * future tone-of-voice / NAP / OG-preview features. */
  html: string | null;
  htmlTruncatedAt: number | null;
  forms: import("@/lib/types/scan").FormDescriptor[];
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

    /* Wrapped in step.run so it fires once per scan. Inngest replays the
     * function handler after each step completes; anything outside step.run
     * re-executes on every replay, which is what produced 7 duplicate
     * "scan.started" rows in monitoring_events for a single scan. */
    await step.run("track-start", () =>
      track("scan.started", {}, { scanId })
    );

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
            desktopFullPage: null,
            mobileFullPage: null,
            html: null,
            htmlTruncatedAt: null,
            forms: [],
            errors: [],
          };

          /* Four parallel Browserless calls. The two AtF calls also bring
           * back HTML + form descriptors (only the desktop result is used
           * for the body capture; mobile HTML is identical post-hydration
           * and we already have the desktop one). The two full-page calls
           * are screenshot-only. Promise.allSettled so one slow / failing
           * call cannot poison the others. */
          const results = await Promise.allSettled([
            captureScreenshot(resolvedUrl, { width: 1440, height: 900 }, scanId),
            captureScreenshot(resolvedUrl, { width: 375, height: 812 }, scanId),
            captureFullPageScreenshot(
              resolvedUrl,
              { width: 1440, height: 900 },
              scanId,
            ),
            captureFullPageScreenshot(
              resolvedUrl,
              { width: 375, height: 812 },
              scanId,
            ),
          ]);

          if (results[0].status === "fulfilled") {
            const r = results[0].value;
            outcome.desktop = `data:image/jpeg;base64,${r.screenshot.toString("base64")}`;
            outcome.html = r.html;
            outcome.htmlTruncatedAt = r.htmlTruncatedAt;
            outcome.forms = r.forms;
          } else {
            outcome.errors.push(
              `desktop: ${(results[0].reason as Error)?.message ?? "unknown"}`
            );
          }

          if (results[1].status === "fulfilled") {
            const r = results[1].value;
            outcome.mobile = `data:image/jpeg;base64,${r.screenshot.toString("base64")}`;
            /* If desktop AtF failed but mobile succeeded, fall back to the
             * mobile HTML / forms so downstream text-side analysis still
             * has something to chew on. */
            if (!outcome.html && r.html) {
              outcome.html = r.html;
              outcome.htmlTruncatedAt = r.htmlTruncatedAt;
            }
            if (outcome.forms.length === 0 && r.forms.length > 0) {
              outcome.forms = r.forms;
            }
          } else {
            outcome.errors.push(
              `mobile: ${(results[1].reason as Error)?.message ?? "unknown"}`
            );
          }

          if (results[2].status === "fulfilled") {
            outcome.desktopFullPage = `data:image/jpeg;base64,${results[2].value.toString("base64")}`;
          } /* full-page failure is silent: collapsed accordion absence */

          if (results[3].status === "fulfilled") {
            outcome.mobileFullPage = `data:image/jpeg;base64,${results[3].value.toString("base64")}`;
          } /* full-page failure is silent */

          if (outcome.desktop || outcome.mobile) {
            await updateScanScreenshots(scanId, outcome.desktop, outcome.mobile);
          }

          if (outcome.desktopFullPage || outcome.mobileFullPage) {
            await updateScanFullPageScreenshots(
              scanId,
              outcome.desktopFullPage,
              outcome.mobileFullPage,
            );
          }

          if (outcome.html) {
            await updateScanHtmlSnapshot(scanId, {
              html: outcome.html,
              capturedAt: new Date().toISOString(),
              viewport: outcome.desktop ? "desktop" : "mobile",
              truncatedAt: outcome.htmlTruncatedAt,
            });
          }

          if (outcome.forms.length > 0) {
            await updateScanFormsExtracted(scanId, outcome.forms);
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
        /* Guard parity with a2/a4/s5: if vision did not succeed, every
         * downstream consumer of the benchmark (revenue, score, the
         * report UI) is already short-circuited. Running web-search-
         * augmented benchmark research without vision context produces
         * a generic, orphaned benchmark for the wrong vertical that no
         * surface can use, while still billing ~$0.20 in Sonnet tokens.
         * This is the single largest source of waste on partial scans. */
        if (!visionStep.ok) {
          return {
            ok: false,
            error: "skipped: vision audit did not succeed",
            benchmark: null as IndustryBenchmark | null,
          };
        }
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
              `[research-benchmark] Curated match: "${curatedMatch.name}" (${curatedMatch.confidence}), skipping web research`
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
        /* CRM auto-creation. Best-effort: any failure here MUST NOT
         * block the scan pipeline. The upsert preserves the contact's
         * existing source/status if they already converted via another
         * channel (form submission, client invite). See
         * lib/services/contacts.ts upsertContactFromScan. */
        try {
          const sql = getDb();
          const rows = (await sql`
            SELECT email, business_name FROM scans WHERE id = ${scanId} LIMIT 1
          `) as { email: string; business_name: string | null }[];
          const r = rows[0];
          if (r?.email) {
            await upsertContactFromScan({
              email: r.email,
              scanId,
              businessName: r.business_name,
            });
          }
        } catch (err) {
          console.warn(
            `[scan.contact-upsert] failed: ${err instanceof Error ? err.message : err}`
          );
        }

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
          await track(
            "scan.failed",
            { errors, durationMs: Date.now() - startedAt },
            { scanId, level: "error" }
          );
          return;
        }

        const aiFullySucceeded =
          visionStep.ok && remediationStep.ok && revenueStep.ok && scoreStep.ok;
        const delivered =
          audit.ok && haveScreenshots && aiFullySucceeded;

        if (!delivered) {
          await markScanComplete(scanId, "partial", errors.join("; "));
          await track(
            "scan.partial",
            { errors, durationMs: Date.now() - startedAt },
            { scanId, level: "warn" }
          );
          return;
        }

        await markScanComplete(
          scanId,
          "complete",
          errors.length > 0 ? errors.join("; ") : undefined
        );
        await track(
          "scan.complete",
          { durationMs: Date.now() - startedAt, softErrors: errors.length },
          { scanId }
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
          // Hard daily spend cap circuit breaker. Sums the trailing
          // 24h of ElevenLabs cost_usd; if it crosses
          // ELEVENLABS_DAILY_CAP_USD (default $10), short-circuit
          // and fire a Sentry error. This is the missing kill switch
          // beyond the per-email and per-IP rate limits at the scan
          // submission gate, and it is the only line of defense if
          // the API key itself is ever leaked.
          const dailyCapRaw = process.env.ELEVENLABS_DAILY_CAP_USD;
          const dailyCap = (() => {
            const parsed = dailyCapRaw ? Number(dailyCapRaw) : NaN;
            return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
          })();
          const spent24h = await getProviderSpendUsd("elevenlabs", 24);
          if (spent24h >= dailyCap) {
            const message = `Pathlight ElevenLabs 24h cap reached: $${spent24h.toFixed(2)} >= $${dailyCap.toFixed(2)}. Skipping audio for scan ${scanId}.`;
            console.warn(`[a5] ${message}`);
            Sentry.captureMessage(message, {
              level: "error",
              tags: { source: "elevenlabs-circuit-breaker" },
              extra: { scanId, spent24h, dailyCap },
            });
            return {
              ok: false,
              skipped: "daily-cap-reached",
              spent24h,
              dailyCap,
            };
          }
          const result = await generateVoiceSummary(report);
          await updateScanAudioSummary(scanId, result.audioUrl, result.script);
          await track(
            "audio.generated",
            {
              characters: result.characters,
              audioBytes: result.audioBytes,
              durationMs: result.durationMs,
            },
            { scanId }
          );
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
          const message = describeError(err);
          console.warn(
            "[a5] audio summary failed (scan still ships):",
            message
          );
          await track(
            "audio.failed",
            { error: message.slice(0, 500) },
            { scanId, level: "warn" }
          );
          return { ok: false, error: message };
        }
      });

      /* f1: best-effort forms-audit. Runs after the report is finalized
       * and after the audio side-step, before the report email goes out.
       * Mirrors the a5 audio pattern: gated, swallowed-on-failure, never
       * marks the scan partial. The renderer falls back to the captured
       * descriptors when this is absent. Gated on forms.length > 0 so a
       * page with no <form> elements never burns a Claude call. */
      await step.run("f1", async () => {
        try {
          if (screenshots.forms.length === 0) {
            return { ok: true, skipped: "no-forms" };
          }
          const { getFormsAuditInput } = await import("../db/queries");
          const input = await getFormsAuditInput(scanId);
          if (!input || input.forms.length === 0) {
            return { ok: true, skipped: "no-forms-on-read" };
          }
          const { runFormsAudit } = await import("../services/forms-audit");
          const analysis = await runFormsAudit({
            scanId,
            forms: input.forms,
            html: input.html,
            url: input.resolvedUrl ?? input.url,
            businessName: input.businessName,
            industry: input.industry,
            city: input.city,
          });
          await updateScanFormsAudit(scanId, analysis);
          await track(
            "forms-audit.generated",
            { items: analysis.items.length, formsExtracted: input.forms.length },
            { scanId },
          );
          return { ok: true, items: analysis.items.length };
        } catch (err) {
          const message = describeError(err);
          console.warn(
            "[f1] forms-audit failed (scan still ships):",
            message,
          );
          await track(
            "forms-audit.failed",
            { error: message.slice(0, 500) },
            { scanId, level: "warn" },
          );
          return { ok: false, error: message };
        }
      });

      await step.run("e1", async () => {
        try {
          await sendPathlightReport(scanId);
          await track("email.report.sent", {}, { scanId });
        } catch (err) {
          const message = describeError(err);
          await logEmailEvent({
            scanId,
            emailType: "report_delivery",
            status: "failed",
            errorMessage: message,
          }).catch(() => {});
          await track(
            "email.report.failed",
            { error: message.slice(0, 500) },
            { scanId, level: "error" }
          );
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
      await track(
        "scan.failed",
        {
          error: message.slice(0, 500),
          stage: "pipeline-throw",
          durationMs: Date.now() - startedAt,
        },
        { scanId, level: "error" }
      ).catch(() => {});
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
 * Hourly cost-alert cron. Fires every hour at minute 0 (UTC) and
 * checks the trailing 24-hour API spend against the threshold.
 *
 * Why hourly, not daily: the original once-a-day schedule left a
 * blind window where an attacker could burn meaningful spend
 * overnight before any notification fired. Running hourly with the
 * same 24-hour rolling window means anomalies are surfaced within
 * an hour without the noise of a per-hour budget.
 *
 * Threshold defaults to $10/day. Override via COST_DAILY_ALERT_USD
 * in Vercel. Warning at threshold, error at 2x threshold.
 *
 * Pairs with the api_usage_events table seeded by migration 007,
 * the recordAnthropicUsage / recordBrowserlessUsage /
 * recordPagespeedUsage / recordElevenLabsUsage helpers, and the
 * hard ElevenLabs circuit breaker in step a5.
 */
export const costAlertDaily = inngest.createFunction(
  {
    id: "pathlight-cost-alert-daily",
    triggers: [{ cron: "0 * * * *" }],
    retries: 0,
  },
  async ({ step }) => {
    await step.run("check-rolling-spend", async () => {
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

/**
 * Daily Lighthouse audit cron. Runs at 09:00 UTC (~04:00 America/Chicago).
 * Audits each (page, strategy) in MONITORED_PAGES x STRATEGIES, persists
 * to lighthouse_history, and Sentry-warns on regressions vs the rolling
 * 7-day median.
 *
 * Thresholds:
 *   * >5pt drop from 7d median        -> warn
 *   * >15pt drop                       -> error
 *   * Below MONITORING_LIGHTHOUSE_FLOOR -> error (default floor 90)
 *   * Audit fail itself                -> warn (single fail), error after 2
 *
 * Each (page, strategy) is run sequentially with a small delay to stay
 * polite to PSI even though the free tier easily covers 14 calls/day.
 */
export const lighthouseMonitorDaily = inngest.createFunction(
  {
    id: "monitoring-lighthouse-daily",
    triggers: [{ cron: "0 9 * * *" }],
    retries: 0,
  },
  async ({ step }) => {
    const floorRaw = process.env.MONITORING_LIGHTHOUSE_FLOOR;
    const floor = (() => {
      const parsed = floorRaw ? Number(floorRaw) : NaN;
      return Number.isFinite(parsed) && parsed > 0 && parsed <= 100
        ? parsed
        : 90;
    })();

    type CategoryDelta = {
      category: "performance" | "accessibility" | "bestPractices" | "seo";
      today: number;
      median: number | null;
      drop: number | null;
    };

    for (const page of MONITORED_PAGES) {
      for (const strategy of STRATEGIES) {
        const stepId = `lighthouse-${page.path.replace(/\W+/g, "_") || "root"}-${strategy}`;
        await step.run(stepId, async () => {
          const result = await auditAndRecord(page, strategy);

          if (!result.ok) {
            await track(
              "lighthouse.audit.failed",
              {
                page: page.path,
                strategy,
                error: (result.errorMessage ?? "").slice(0, 500),
              },
              { level: "warn" }
            );
            Sentry.captureMessage(
              `Lighthouse audit failed: ${page.path} (${strategy})`,
              {
                level: "warning",
                tags: { source: "lighthouse-monitor" },
                extra: { page: page.path, strategy, error: result.errorMessage },
              }
            );
            return { ok: false };
          }

          const medians = await getRollingMedians(page.path, strategy, 7);
          const deltas: CategoryDelta[] = [
            {
              category: "performance",
              today: result.performance ?? 0,
              median: medians.performance,
              drop:
                medians.performance !== null && result.performance !== null
                  ? medians.performance - result.performance
                  : null,
            },
            {
              category: "accessibility",
              today: result.accessibility ?? 0,
              median: medians.accessibility,
              drop:
                medians.accessibility !== null &&
                result.accessibility !== null
                  ? medians.accessibility - result.accessibility
                  : null,
            },
            {
              category: "bestPractices",
              today: result.bestPractices ?? 0,
              median: medians.bestPractices,
              drop:
                medians.bestPractices !== null &&
                result.bestPractices !== null
                  ? medians.bestPractices - result.bestPractices
                  : null,
            },
            {
              category: "seo",
              today: result.seo ?? 0,
              median: medians.seo,
              drop:
                medians.seo !== null && result.seo !== null
                  ? medians.seo - result.seo
                  : null,
            },
          ];

          let alertLevel: "info" | "warn" | "error" = "info";
          const breaches: CategoryDelta[] = [];
          for (const d of deltas) {
            // Hard floor takes precedence: if any category falls below
            // floor, escalate immediately.
            if (d.today > 0 && d.today < floor) {
              alertLevel = "error";
              breaches.push(d);
              continue;
            }
            if (d.drop !== null) {
              if (d.drop >= 15) {
                alertLevel = "error";
                breaches.push(d);
              } else if (d.drop >= 5 && alertLevel !== "error") {
                alertLevel = "warn";
                breaches.push(d);
              }
            }
          }

          if (alertLevel !== "info") {
            await track(
              "lighthouse.regression",
              {
                page: page.path,
                strategy,
                today: {
                  performance: result.performance,
                  accessibility: result.accessibility,
                  bestPractices: result.bestPractices,
                  seo: result.seo,
                },
                medians,
                breaches,
                floor,
              },
              { level: alertLevel }
            );
            Sentry.captureMessage(
              `Lighthouse regression: ${page.path} (${strategy})`,
              {
                level: alertLevel === "error" ? "error" : "warning",
                tags: { source: "lighthouse-monitor" },
                extra: {
                  page: page.path,
                  strategy,
                  today: {
                    performance: result.performance,
                    accessibility: result.accessibility,
                    bestPractices: result.bestPractices,
                    seo: result.seo,
                  },
                  medians,
                  breaches,
                  floor,
                },
              }
            );
          }

          return { ok: true, alertLevel, breaches };
        });
        // 5s pacing between PSI calls so a transient quota blip on one
        // page does not cascade across the rest of the run.
        await step.sleep(`pace-${stepId}`, "5s");
      }
    }
  }
);

/**
 * Synthetic canary cron. Runs every 4 hours. Verifies the always-on
 * external integrations (PSI + Browserless) work end-to-end against a
 * stable target URL without burning Anthropic / Claude tokens. Hits
 * thestarautoservice.com because it is owned by us, stable, and shape-
 * compatible with the Pathlight pipeline (real local business).
 *
 * Three checks: PSI desktop, PSI mobile, Browserless desktop screenshot.
 * Each step records its outcome to monitoring_events. Two consecutive
 * fails on the same check escalate to a Sentry error.
 */
const CANARY_TARGET_URL =
  process.env.MONITORING_CANARY_URL || "https://thestarautoservice.com/";

export const pathlightSyntheticCheck = inngest.createFunction(
  {
    id: "monitoring-synthetic-canary",
    triggers: [{ cron: "0 */4 * * *" }],
    retries: 0,
  },
  async ({ step }) => {
    type CheckOutcome = { check: string; ok: boolean; error: string | null };
    const outcomes: CheckOutcome[] = [];

    outcomes.push(
      await step.run("canary-psi-desktop", async () => {
        try {
          const start = Date.now();
          const { runPerformanceAudit } = await import("../services/pagespeed");
          const result = await runPerformanceAudit(CANARY_TARGET_URL, null);
          await track("canary.ok", {
            check: "psi-desktop",
            durationMs: Date.now() - start,
            performance: result.scores.overall,
          });
          return {
            check: "psi-desktop",
            ok: true,
            error: null,
          } satisfies CheckOutcome;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          await track(
            "canary.fail",
            { check: "psi-desktop", error: message.slice(0, 500) },
            { level: "error" }
          );
          return {
            check: "psi-desktop",
            ok: false,
            error: message,
          } satisfies CheckOutcome;
        }
      })
    );

    outcomes.push(
      await step.run("canary-screenshot-desktop", async () => {
        try {
          const start = Date.now();
          const { captureScreenshot } = await import(
            "../services/browserless"
          );
          await captureScreenshot(
            CANARY_TARGET_URL,
            { width: 1280, height: 800 },
            null
          );
          await track("canary.ok", {
            check: "screenshot-desktop",
            durationMs: Date.now() - start,
          });
          return {
            check: "screenshot-desktop",
            ok: true,
            error: null,
          } satisfies CheckOutcome;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          await track(
            "canary.fail",
            { check: "screenshot-desktop", error: message.slice(0, 500) },
            { level: "error" }
          );
          return {
            check: "screenshot-desktop",
            ok: false,
            error: message,
          } satisfies CheckOutcome;
        }
      })
    );

    // Two consecutive failures on the same check escalate to Sentry.
    // Single-shot blips happen often enough on PSI that paging on the
    // first miss would create alert fatigue.
    await step.run("canary-escalate", async () => {
      const failures = outcomes.filter((o) => !o.ok);
      if (failures.length === 0) return { escalated: false };

      const sql = getDb();
      for (const f of failures) {
        const recent = (await sql`
          SELECT level
          FROM monitoring_events
          WHERE event = 'canary.fail'
            AND payload->>'check' = ${f.check}
            AND created_at > now() - interval '12 hours'
          ORDER BY id DESC
          LIMIT 2
        `) as { level: string }[];
        if (recent.length >= 2) {
          Sentry.captureMessage(
            `Pathlight canary failing: ${f.check}`,
            {
              level: "error",
              tags: { source: "synthetic-canary" },
              extra: { check: f.check, error: f.error, target: CANARY_TARGET_URL },
            }
          );
        }
      }
      return { escalated: true, failures: failures.length };
    });

    return { outcomes };
  }
);

/**
 * Monitoring retention cron. Runs daily at 11:00 UTC. Drops events
 * older than 30 days so the high-write monitoring_events table stays
 * lean. Also drops lighthouse_history older than 365 days as a soft
 * cap (we only show 30 days on the dashboard but a year of history
 * is useful for long-term trend questions).
 */
export const monitoringPurgeDaily = inngest.createFunction(
  {
    id: "monitoring-purge-daily",
    triggers: [{ cron: "0 11 * * *" }],
    retries: 0,
  },
  async ({ step }) => {
    await step.run("purge-events", async () => {
      const sql = getDb();
      const rows = (await sql`
        DELETE FROM monitoring_events
        WHERE created_at < now() - interval '30 days'
        RETURNING id
      `) as { id: string }[];
      return { dropped: rows.length };
    });
    await step.run("purge-lighthouse", async () => {
      const sql = getDb();
      const rows = (await sql`
        DELETE FROM lighthouse_history
        WHERE created_at < now() - interval '365 days'
        RETURNING id
      `) as { id: string }[];
      return { dropped: rows.length };
    });
    /* Visitor analytics retention. page_views/page_view_engagement are
     * kept 90 days raw; sessions and visitors retain 13 months from
     * last_seen. The funnel materialized views aggregate up to 180d
     * of session data so cohort queries continue to work after the
     * raw page_views drop. */
    await step.run("purge-page-views", async () => {
      const sql = getDb();
      const rows = (await sql`
        DELETE FROM page_views
        WHERE created_at < now() - interval '90 days'
        RETURNING id
      `) as { id: string }[];
      return { dropped: rows.length };
    });
    await step.run("purge-sessions", async () => {
      const sql = getDb();
      const rows = (await sql`
        DELETE FROM sessions
        WHERE COALESCE(last_seen_at, started_at) < now() - interval '395 days'
        RETURNING id
      `) as { id: string }[];
      return { dropped: rows.length };
    });
    await step.run("purge-visitors", async () => {
      const sql = getDb();
      const rows = (await sql`
        DELETE FROM visitors
        WHERE last_seen_at < now() - interval '395 days'
        RETURNING id
      `) as { id: string }[];
      return { dropped: rows.length };
    });
  }
);

/**
 * Hourly funnel materialized view refresh. Cheap, covers the lag
 * between dashboard reads and live session data without holding a
 * long lock on the source tables.
 */
export const funnelRefreshHourly = inngest.createFunction(
  {
    id: "funnel-refresh-hourly",
    triggers: [{ cron: "5 * * * *" }],
    retries: 1,
  },
  async ({ step }) => {
    return await step.run("refresh-views", async () => {
      const result = await refreshFunnelViews();
      return result;
    });
  }
);

/**
 * Hourly Vercel deployment + function-metric snapshot. Pulls from the
 * Vercel REST API. Webhook ingestion is the primary path for
 * deployment state changes; this cron is the catch-up for anything
 * missed and the source of function metric history.
 */
export const vercelTelemetryHourly = inngest.createFunction(
  {
    id: "vercel-telemetry-hourly",
    triggers: [{ cron: "10 * * * *" }],
    retries: 1,
  },
  async ({ step }) => {
    return await step.run("snapshot-vercel", async () => {
      return await snapshotVercelDeployments();
    });
  }
);

/**
 * Inngest run-history snapshot. Inngest's webhook is the realtime
 * path; this hourly cron back-fills any missed events and keeps
 * the inngest_runs table aligned with reality even if the webhook
 * endpoint was briefly down.
 */
export const inngestHealthHourly = inngest.createFunction(
  {
    id: "inngest-health-hourly",
    triggers: [{ cron: "15 * * * *" }],
    retries: 1,
  },
  async ({ step }) => {
    return await step.run("snapshot-runs", async () => {
      return await snapshotInngestRuns();
    });
  }
);

/**
 * Daily infrastructure check at 08:00 UTC. WHOIS, TLS, and DNS
 * authentication checks for every domain DBJ manages. Sentry-warns at
 * <=14 days from any expiry so renewal happens before silent outage.
 */
export const infrastructureCheckDaily = inngest.createFunction(
  {
    id: "infrastructure-check-daily",
    triggers: [{ cron: "0 8 * * *" }],
    retries: 0,
  },
  async ({ step }) => {
    return await step.run("run-checks", async () => {
      return await runInfrastructureChecks();
    });
  }
);

/**
 * Anthropic budget snapshot. Hourly Admin API pull; used by the cost
 * dashboard banner to render headroom and by Sentry alerts when
 * monthly spend or rate-limit headroom drops below threshold.
 */
export const anthropicBudgetHourly = inngest.createFunction(
  {
    id: "anthropic-budget-hourly",
    triggers: [{ cron: "20 * * * *" }],
    retries: 1,
  },
  async ({ step }) => {
    return await step.run("snapshot-budget", async () => {
      return await snapshotAnthropicBudget();
    });
  }
);

/**
 * Daily Search Console import at 06:00 UTC. Pulls the trailing 7 days
 * of impressions/clicks per page+query+country+device using the
 * googleapis SDK. ON CONFLICT updates handle late-arriving GSC data
 * (which routinely lags 2-3 days).
 */
export const searchConsoleDaily = inngest.createFunction(
  {
    id: "search-console-daily",
    triggers: [{ cron: "0 6 * * *" }],
    retries: 1,
  },
  async ({ step }) => {
    return await step.run("import-gsc", async () => {
      return await importSearchConsoleDaily();
    });
  }
);

/**
 * Hourly email KPI rollup refresh. Cheap aggregate over
 * email_webhook_events; backs the deliverability dashboard.
 */
export const emailKpiRefreshHourly = inngest.createFunction(
  {
    id: "email-kpi-refresh-hourly",
    triggers: [{ cron: "25 * * * *" }],
    retries: 1,
  },
  async ({ step }) => {
    return await step.run("refresh-kpi", async () => {
      return await refreshEmailKpi();
    });
  }
);

/**
 * Canopy sequence advancer. Drains active enrollments whose
 * next_run_at <= NOW() every 5 minutes. Each enrollment runs at most
 * one step per fire so a cron retry never double-fires the same step.
 */
export const canopySequenceAdvance = inngest.createFunction(
  {
    id: "canopy-sequence-advance",
    triggers: [{ cron: "*/5 * * * *" }],
    retries: 1,
  },
  async ({ step }) => {
    return await step.run("advance", async () => {
      const { advanceDueEnrollments } = await import("@/lib/canopy/automation/engine");
      const results = await advanceDueEnrollments(100);
      return { processed: results.length, executed: results.filter((r) => r.outcome === "executed").length, completed: results.filter((r) => r.outcome === "completed").length };
    });
  }
);

/**
 * Canopy workflow rule evaluator. Polls canopy_audit_log every 2
 * minutes for entries newer than each enabled rule's
 * last_audit_log_id checkpoint and fires matching rules. The
 * workflow_evaluations ledger guarantees idempotence on retry.
 */
export const canopyWorkflowEvaluate = inngest.createFunction(
  {
    id: "canopy-workflow-evaluate",
    triggers: [{ cron: "*/2 * * * *" }],
    retries: 1,
  },
  async ({ step }) => {
    return await step.run("evaluate", async () => {
      const { evaluateWorkflowRules } = await import("@/lib/canopy/automation/engine");
      const results = await evaluateWorkflowRules(200);
      return { evaluations: results.length, fired: results.filter((r) => r.fired).length };
    });
  }
);

/**
 * Canopy webhook dispatcher. Fires every minute, polls
 * canopy_audit_log for entries matching each enabled webhook's
 * subscribed events past its last_audit_log_id checkpoint, and
 * delivers HMAC-signed POSTs. webhook_deliveries UNIQUE constraint
 * on (webhook_id, audit_log_id) prevents double-delivery on retry.
 */
export const canopyWebhookDispatch = inngest.createFunction(
  {
    id: "canopy-webhook-dispatch",
    triggers: [{ cron: "* * * * *" }],
    retries: 1,
  },
  async ({ step }) => {
    return await step.run("dispatch", async () => {
      const { dispatchWebhooks } = await import("@/lib/canopy/webhooks");
      const results = await dispatchWebhooks(50);
      return {
        processed: results.length,
        delivered: results.reduce((s, r) => s + r.delivered, 0),
        failed: results.reduce((s, r) => s + r.failed, 0),
      };
    });
  }
);

/**
 * Canopy weekly digest. Fires hourly and only sends when the
 * operator's chosen day-of-week + local-hour matches the current
 * timezone-converted clock. Read-only over existing data; never
 * triggers a Pathlight scan.
 */
export const canopyDigestHourly = inngest.createFunction(
  {
    id: "canopy-digest-hourly",
    triggers: [{ cron: "30 * * * *" }],
    retries: 1,
  },
  async ({ step }) => {
    const decision = await step.run("decide", async () => {
      const { getCanopySettings } = await import("@/lib/canopy/settings");
      const { shouldFireDigest } = await import("@/lib/analytics/digest");
      const settings = await getCanopySettings();
      const fire = shouldFireDigest({
        now: new Date(),
        digestEnabled: settings.digest_enabled,
        digestDayOfWeek: settings.digest_day_of_week,
        digestHourLocal: settings.digest_hour_local,
        timezone: settings.timezone,
      });
      return { fire, settings };
    });

    if (!decision.fire) {
      return { sent: false, reason: "schedule mismatch or disabled" };
    }

    return await step.run("send-digest", async () => {
      const { sendCanopyDigest } = await import("@/lib/analytics/digest");
      const sql = getDb();
      const recipientRows = (await sql`
        SELECT email FROM admin_users WHERE status = 'active'
      `.catch(() => [])) as Array<{ email: string }>;
      const fallback = process.env.CONTACT_EMAIL ? [process.env.CONTACT_EMAIL] : [];
      const recipients = recipientRows.length > 0
        ? recipientRows.map((r) => r.email)
        : fallback;
      if (recipients.length === 0) {
        return { sent: false, reason: "no recipients" };
      }
      const result = await sendCanopyDigest({ recipients });
      return {
        sent: result.ok,
        reason: result.reason,
        recipients: result.recipients,
        subject: result.subject,
      };
    });
  }
);

/* Phase 4: Gmail ingest cron. Runs every 5 minutes. For each connected
 * admin user, pulls newly-arrived messages since the last History API
 * checkpoint and writes matched ones to email_messages. Initial run
 * for a freshly-connected user backfills the trailing 7 days (capped
 * at 200 messages) and seeds the checkpoint from Gmail's profile.
 * Unmatched messages (no contact for either side) are silently dropped;
 * Canopy is a CRM activity surface, not a general inbox tool. */
export const canopyGmailIngest = inngest.createFunction(
  {
    id: "canopy-gmail-ingest",
    triggers: [{ cron: "*/5 * * * *" }],
    retries: 1,
  },
  async ({ step }) => {
    return await step.run("ingest-all", async () => {
      const { ingestAllConnectedAccounts } = await import(
        "@/lib/canopy/email/ingest"
      );
      const results = await ingestAllConnectedAccounts();
      const totalInserted = results.reduce((s, r) => s + r.inserted, 0);
      const totalScanned = results.reduce((s, r) => s + r.scanned, 0);
      const errored = results.filter((r) => r.errors.length > 0).length;
      return {
        accounts: results.length,
        scanned: totalScanned,
        inserted: totalInserted,
        errored,
      };
    });
  }
);

/* Phase 9: change-monitoring cron. Runs daily at 09:30 UTC (offset 30
 * minutes from lighthouseMonitorDaily so the two crons don't fight for
 * the same outbound bandwidth window). For every contact with an open
 * deal and a website on file, GET the site, capture etag /
 * last-modified / sha256(content), and compare against the most-recent
 * signal. Write a website_change_signals row only when something
 * actually changed (or first-time observation, or a fresh error).
 *
 * NEVER auto-fires a Pathlight scan. The dashboard renders new signals
 * with a "Re-scan now" button per row; that button routes through the
 * existing manual-rescan action and the three-layer Pathlight gate. */
export const canopyChangeMonitoringDaily = inngest.createFunction(
  {
    id: "canopy-change-monitoring-daily",
    triggers: [{ cron: "30 9 * * *" }],
    retries: 1,
  },
  async ({ step }) => {
    const enabled = await step.run("check-toggle", async () => {
      const { getCanopySettings } = await import("@/lib/canopy/settings");
      const s = await getCanopySettings();
      return s.change_monitoring_enabled === true;
    });

    if (!enabled) {
      return { skipped: true, reason: "change_monitoring_enabled is false" };
    }

    const targets = await step.run("collect-targets", async () => {
      const { getMonitorTargets } = await import("@/lib/canopy/change-monitoring");
      return await getMonitorTargets();
    });

    if (targets.length === 0) {
      return { checked: 0, signals_written: 0 };
    }

    return await step.run("probe-and-record", async () => {
      const { createHash } = await import("node:crypto");
      const { getLastSignal, recordSignal } = await import(
        "@/lib/canopy/change-monitoring"
      );

      let signalsWritten = 0;
      let errors = 0;

      for (const target of targets) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 8_000);
          let res: Response | null = null;
          try {
            res = await fetch(target.url, {
              method: "GET",
              redirect: "follow",
              signal: controller.signal,
              headers: { "user-agent": "Canopy-ChangeMonitor/1.0 (+dbjtechnologies.com)" },
            });
          } finally {
            clearTimeout(timer);
          }

          if (!res || !res.ok) {
            const last = await getLastSignal(target.contact_id, target.url);
            const wasErrorAlready = last?.change_kind === "error";
            if (!wasErrorAlready) {
              await recordSignal({
                contactId: target.contact_id,
                url: target.url,
                etag: null,
                lastModified: null,
                contentHash: null,
                prev: last,
                changeKind: "error",
                statusCode: res?.status ?? null,
                errorMessage: res ? `HTTP ${res.status}` : "fetch failed",
              });
              signalsWritten++;
            }
            errors++;
            continue;
          }

          const etag = res.headers.get("etag");
          const lastModified = res.headers.get("last-modified");
          const text = (await res.text()).slice(0, 262_144);
          const contentHash = createHash("sha256").update(text).digest("hex");

          const last = await getLastSignal(target.contact_id, target.url);
          if (!last) {
            await recordSignal({
              contactId: target.contact_id,
              url: target.url,
              etag,
              lastModified,
              contentHash,
              prev: null,
              changeKind: "first_seen",
              statusCode: res.status,
              errorMessage: null,
            });
            signalsWritten++;
            continue;
          }

          let changeKind: "etag" | "last_modified" | "content_hash" | null = null;
          if (etag && last.etag && etag !== last.etag) changeKind = "etag";
          else if (
            lastModified &&
            last.last_modified &&
            lastModified !== last.last_modified
          )
            changeKind = "last_modified";
          else if (last.content_hash && contentHash !== last.content_hash)
            changeKind = "content_hash";

          if (changeKind) {
            await recordSignal({
              contactId: target.contact_id,
              url: target.url,
              etag,
              lastModified,
              contentHash,
              prev: last,
              changeKind,
              statusCode: res.status,
              errorMessage: null,
            });
            signalsWritten++;
          }
        } catch {
          errors++;
        }
      }

      return { checked: targets.length, signals_written: signalsWritten, errors };
    });
  }
);
