import { getDb } from "../db";
import {
  markScanComplete,
  updateScanResolvedUrl,
  updateScanResults,
  updateScanScreenshots,
  updateScanStatus,
} from "../db/queries";
import { captureScreenshot } from "../services/browserless";
import { runPerformanceAudit } from "../services/pagespeed";
import { normalizeUrl, validateUrl } from "../services/url";
import { inngest } from "./client";

class ScanValidationError extends Error {}

type ScreenshotOutcome = {
  desktop: string | null;
  mobile: string | null;
  errors: string[];
};

export const scanRequested = inngest.createFunction(
  {
    id: "pathlight-scan-requested",
    triggers: [{ event: "pathlight/scan.requested" }],
    timeouts: { finish: "120s" },
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

      const audit = await step.run("run-audit", async () => {
        try {
          const { scores, raw } = await runPerformanceAudit(resolvedUrl);
          const durationMs = Date.now() - startedAt;
          await updateScanResults(scanId, scores, raw, durationMs, resolvedUrl);
          return { ok: true as const, error: null };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Performance audit failed.";
          return { ok: false as const, error: message };
        }
      });

      await step.run("finalize", async () => {
        const haveScreenshots =
          screenshots.desktop !== null || screenshots.mobile !== null;
        const errors: string[] = [];
        if (!audit.ok && audit.error) errors.push(`audit: ${audit.error}`);
        if (screenshots.errors.length > 0) errors.push(...screenshots.errors);

        if (!audit.ok && !haveScreenshots) {
          await updateScanStatus(
            scanId,
            "failed",
            errors.join("; ") || "Scan produced no data."
          );
          return;
        }

        if (!audit.ok || !haveScreenshots) {
          await markScanComplete(scanId, "partial", errors.join("; "));
          return;
        }

        await markScanComplete(
          scanId,
          "complete",
          errors.length > 0 ? errors.join("; ") : undefined
        );
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
