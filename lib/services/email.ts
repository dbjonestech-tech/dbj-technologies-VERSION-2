import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";
import { z } from "zod";
import { getDb } from "../db";
import { getFullScanReport } from "../db/queries";
import {
  buildBreakup8d,
  buildFollowUp48h,
  buildFollowUp5d,
  buildReportEmail,
  type BuiltEmail,
  type EmailMergeData,
} from "../email-templates/pathlight";
import type { RemediationItem } from "@/lib/types/scan";
import { generateUnsubscribeUrl, markUnsubscribed } from "./unsubscribe";
import { track } from "./monitoring";

export type EmailType =
  | "report_delivery"
  | "followup_48h"
  | "followup_5d"
  | "breakup_8d";

export type EmailStatus =
  | "sent"
  | "skipped"
  | "failed"
  | "held"
  | "delivered"
  | "delivery_delayed"
  | "bounced"
  | "complained";

const VALID_EMAIL_TYPES: ReadonlySet<EmailType> = new Set([
  "report_delivery",
  "followup_48h",
  "followup_5d",
  "breakup_8d",
]);

export type EmailSendResult = {
  status: EmailStatus;
  resendId: string | null;
  error: string | null;
};

const REPLY_TO = "joshua@dbjtechnologies.com";
const DEFAULT_FROM = "Pathlight <pathlight@dbjtechnologies.com>";

const EMAIL_TYPE_BY_NUMBER: Record<2 | 3 | 4, EmailType> = {
  2: "followup_48h",
  3: "followup_5d",
  4: "breakup_8d",
};

const UTM_CONTENT_BY_TYPE: Record<EmailType, string> = {
  report_delivery: "email1",
  followup_48h: "email2",
  followup_5d: "email3",
  breakup_8d: "email4",
};

let cachedClient: Resend | null = null;

function getResend(): Resend {
  if (cachedClient) return cachedClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set.");
  }
  cachedClient = new Resend(key);
  return cachedClient;
}

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM;
}

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://dbjtechnologies.com"
  );
}

function appendUtm(rawUrl: string, emailType: EmailType): string {
  if (!rawUrl || rawUrl === "#") return rawUrl;
  const utms = `utm_source=pathlight&utm_medium=email&utm_campaign=nurture&utm_content=${UTM_CONTENT_BY_TYPE[emailType]}`;
  const separator = rawUrl.includes("?") ? "&" : "?";
  return `${rawUrl}${separator}${utms}`;
}

function buildReportUrl(scanId: string, emailType: EmailType): string {
  return appendUtm(`${getSiteUrl()}/pathlight/${scanId}`, emailType);
}

function buildCalendlyUrl(emailType: EmailType): string {
  // TODO: set CALENDLY_URL in Vercel env to wire up the booking link.
  const base = process.env.CALENDLY_URL ?? "#";
  return appendUtm(base, emailType);
}

function pickTopFinding(items: RemediationItem[] | null): RemediationItem | null {
  if (!items || items.length === 0) return null;
  const firstHigh = items.find((i) => i.impact === "high");
  return firstHigh ?? items[0] ?? null;
}

async function buildMergeData(
  scanId: string,
  emailType: EmailType
): Promise<EmailMergeData | null> {
  const report = await getFullScanReport(scanId);
  if (!report) return null;

  return {
    scanId: report.id,
    url: report.resolvedUrl ?? report.url,
    email: report.email,
    businessName: report.businessName,
    pathlightScore: report.pathlightScore,
    revenueLoss: report.revenueImpact?.estimatedMonthlyLoss ?? null,
    topFinding: pickTopFinding(report.remediation?.items ?? null),
    reportUrl: buildReportUrl(report.id, emailType),
    audioSummaryUrl: report.audioSummaryUrl,
    calendlyUrl: buildCalendlyUrl(emailType),
    unsubscribeUrl: generateUnsubscribeUrl(report.email),
  };
}

export async function logEmailEvent(params: {
  scanId: string;
  emailType: EmailType;
  status: EmailStatus;
  resendId?: string | null;
  errorMessage?: string | null;
}): Promise<void> {
  const sql = getDb();
  try {
    await sql`
      INSERT INTO email_events (scan_id, email_type, status, resend_id, error_message)
      VALUES (
        ${params.scanId},
        ${params.emailType},
        ${params.status},
        ${params.resendId ?? null},
        ${params.errorMessage ?? null}
      )
    `;
  } catch (err) {
    console.error("[email] failed to log email_event", err);
  }
}

async function dispatch(
  scanId: string,
  emailType: EmailType,
  built: BuiltEmail,
  toEmail: string
): Promise<EmailSendResult> {
  try {
    const client = getResend();
    const { data, error } = await client.emails.send({
      from: getFromAddress(),
      to: toEmail,
      replyTo: REPLY_TO,
      subject: built.subject,
      html: built.html,
      text: built.text,
      headers: {
        "List-Unsubscribe": `<${generateUnsubscribeUrlForMail(toEmail)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      // Tags travel back on every Resend webhook event so we can
      // correlate a bounce/complaint to the originating scan even if
      // the resend_id lookup misses (e.g., the original email_events
      // row failed to insert before the webhook fired).
      tags: [
        { name: "scan_id", value: scanId },
        { name: "email_type", value: emailType },
      ],
    });

    if (error) {
      const msg = error.message ?? "Resend returned an error.";
      await logEmailEvent({
        scanId,
        emailType,
        status: "failed",
        errorMessage: msg,
      });
      return { status: "failed", resendId: null, error: msg };
    }

    const resendId = data?.id ?? null;
    await logEmailEvent({
      scanId,
      emailType,
      status: "sent",
      resendId,
    });
    return { status: "sent", resendId, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown email error.";
    await logEmailEvent({
      scanId,
      emailType,
      status: "failed",
      errorMessage: msg,
    });
    return { status: "failed", resendId: null, error: msg };
  }
}

function generateUnsubscribeUrlForMail(email: string): string {
  return generateUnsubscribeUrl(email);
}

export async function sendPathlightReport(
  scanId: string
): Promise<EmailSendResult> {
  const emailType: EmailType = "report_delivery";
  const merge = await buildMergeData(scanId, emailType);
  if (!merge) {
    const msg = `Scan ${scanId} not found when sending report email.`;
    await logEmailEvent({
      scanId,
      emailType,
      status: "failed",
      errorMessage: msg,
    });
    return { status: "failed", resendId: null, error: msg };
  }

  /* Send-time integrity gate. The pipeline marks scans "partial" when AI
   * steps skip (e.g. browserless 429 wiping out vision audit), but the email
   * step used to fire regardless, producing "PATHLIGHT SCORE: n/a/100" and
   * placeholder revenue copy. Refuse to dispatch when either headline number
   * is missing -- the user gets nothing rather than a broken first
   * impression, and Joshua sees a "held" event in admin/monitor to
   * trigger a manual rescan. */
  if (merge.pathlightScore === null || merge.revenueLoss === null) {
    const reason =
      merge.pathlightScore === null && merge.revenueLoss === null
        ? "score and revenue both null"
        : merge.pathlightScore === null
          ? "score null"
          : "revenue null";
    const msg = `Held report email for ${scanId}: ${reason}. Manual rescan required.`;
    await logEmailEvent({
      scanId,
      emailType,
      status: "held",
      errorMessage: msg,
    });
    await track(
      "email.report.held",
      { reason, pathlightScore: merge.pathlightScore, revenueLoss: merge.revenueLoss },
      { scanId, level: "warn" }
    );
    Sentry.captureMessage(`Pathlight report email held: ${reason}`, {
      level: "warning",
      tags: { source: "email-integrity-gate", emailType },
      extra: { scanId, url: merge.url, email: merge.email },
    });
    return { status: "held", resendId: null, error: msg };
  }

  const built = buildReportEmail(merge);
  return dispatch(scanId, emailType, built, merge.email);
}

export async function sendFollowUp(
  scanId: string,
  emailNumber: 2 | 3 | 4
): Promise<EmailSendResult> {
  const emailType = EMAIL_TYPE_BY_NUMBER[emailNumber];
  const merge = await buildMergeData(scanId, emailType);
  if (!merge) {
    const msg = `Scan ${scanId} not found when sending ${emailType}.`;
    await logEmailEvent({
      scanId,
      emailType,
      status: "failed",
      errorMessage: msg,
    });
    return { status: "failed", resendId: null, error: msg };
  }

  const { isUnsubscribed } = await import("./unsubscribe");
  if (await isUnsubscribed(merge.email)) {
    await logEmailEvent({
      scanId,
      emailType,
      status: "skipped",
    });
    return { status: "skipped", resendId: null, error: null };
  }

  /* Send-time integrity gate, mirror of sendPathlightReport above. The 48h
   * and 8d templates embed revenueDisplay verbatim ("your estimated $X/mo
   * in lost revenue"); without a real number the copy decays into the
   * placeholder leak we just removed. The 5d email does not reference
   * revenue, but if the report email itself was held this scan never
   * reached the prospect, so a follow-up arriving now would be out of
   * sequence -- gate all follow-ups uniformly. */
  if (merge.pathlightScore === null || merge.revenueLoss === null) {
    const reason =
      merge.pathlightScore === null && merge.revenueLoss === null
        ? "score and revenue both null"
        : merge.pathlightScore === null
          ? "score null"
          : "revenue null";
    const msg = `Held ${emailType} for ${scanId}: ${reason}.`;
    await logEmailEvent({
      scanId,
      emailType,
      status: "held",
      errorMessage: msg,
    });
    await track(
      `email.${emailType}.held`,
      { reason, pathlightScore: merge.pathlightScore, revenueLoss: merge.revenueLoss },
      { scanId, level: "warn" }
    );
    return { status: "held", resendId: null, error: msg };
  }

  const built =
    emailNumber === 2
      ? buildFollowUp48h(merge)
      : emailNumber === 3
        ? buildFollowUp5d(merge)
        : buildBreakup8d(merge);
  return dispatch(scanId, emailType, built, merge.email);
}

/* ─── Resend webhook ingestion ───────────────────── */

// Resend uses Svix under the hood. The four webhook event types we
// care about map cleanly onto email_events.status terminal values.
// 'sent' is also delivered as a webhook but our send code already
// inserts a 'sent' row at the moment of dispatch, so we ignore the
// webhook variant. opened/clicked/failed are deliberately skipped
// (privacy, noise, and 'failed' is handled at send time).
const WEBHOOK_STATUS_BY_EVENT: Record<string, EmailStatus> = {
  "email.delivered": "delivered",
  "email.delivery_delayed": "delivery_delayed",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

// Permissive at the boundary on purpose. Resend's webhook payload
// shape varies by event type and has shifted over time (test events
// drop fields, system tags arrive with null values, `to` can be null
// on some delivery_delayed variants). We validate just enough to
// route on `type`; downstream reads use type guards.
const resendWebhookEventSchema = z.object({
  type: z.string(),
  data: z
    .object({
      email_id: z.string().nullish(),
      to: z.array(z.string()).nullish(),
      tags: z
        .array(
          z
            .object({
              name: z.string().optional(),
              value: z.unknown().optional(),
            })
            .passthrough()
        )
        .nullish(),
    })
    .passthrough()
    .optional(),
});

export type ResendWebhookOutcome = "ingested" | "ignored" | "uncorrelated";

/**
 * Process a verified Resend webhook event. Idempotent: re-processing
 * the same (resend_id, status) pair is a no-op thanks to the partial
 * unique index added in migration 006.
 *
 * Returns "ignored" when the event type is not one we track,
 * "uncorrelated" when we cannot tie the event back to a scan record,
 * and "ingested" on a successful insert (or no-op if already present).
 */
export async function handleResendWebhookEvent(
  raw: unknown
): Promise<ResendWebhookOutcome> {
  const parsed = resendWebhookEventSchema.safeParse(raw);
  if (!parsed.success) {
    // Include the failing field path so future regressions are
    // diagnosable from the function logs without repro.
    const fields = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    console.warn(
      "[email] webhook payload failed schema validation:",
      fields
    );
    return "ignored";
  }
  const { type, data } = parsed.data;

  const status = WEBHOOK_STATUS_BY_EVENT[type];
  if (!status) return "ignored";

  const resendId = data?.email_id ?? null;
  const recipient = data?.to?.[0]?.toLowerCase() ?? null;

  const tags = data?.tags ?? [];
  const scanIdValue = tags.find((t) => t.name === "scan_id")?.value;
  const tagScanId = typeof scanIdValue === "string" ? scanIdValue : null;
  const emailTypeValue = tags.find((t) => t.name === "email_type")?.value;
  const tagEmailType =
    typeof emailTypeValue === "string" &&
    VALID_EMAIL_TYPES.has(emailTypeValue as EmailType)
      ? (emailTypeValue as EmailType)
      : null;

  let scanId = tagScanId;
  let emailType: EmailType | null = tagEmailType;

  // Fall back to looking up the original email_events row by resend_id
  // when the tags are missing (e.g., a Resend send that pre-dates the
  // tags rollout, or a webhook for an email sent through a different
  // code path).
  if ((!scanId || !emailType) && resendId) {
    const sql = getDb();
    const rows = (await sql`
      SELECT scan_id, email_type
      FROM email_events
      WHERE resend_id = ${resendId} AND status = 'sent'
      ORDER BY sent_at ASC
      LIMIT 1
    `) as { scan_id: string | null; email_type: string }[];
    const row = rows[0];
    if (row) {
      scanId = scanId ?? row.scan_id ?? null;
      if (
        !emailType &&
        VALID_EMAIL_TYPES.has(row.email_type as EmailType)
      ) {
        emailType = row.email_type as EmailType;
      }
    }
  }

  if (!scanId || !emailType) {
    console.warn(
      "[email] webhook event could not be correlated to a scan",
      { type, resendId }
    );
    return "uncorrelated";
  }

  const sql = getDb();
  await sql`
    INSERT INTO email_events (scan_id, email_type, status, resend_id)
    VALUES (${scanId}, ${emailType}, ${status}, ${resendId})
    ON CONFLICT (resend_id, status) DO NOTHING
  `;

  // Mirror the email-event into monitoring_events so the funnel + live
  // tail surface delivery, bounces, and complaints alongside the rest
  // of the pipeline. Level escalates for negative outcomes.
  const trackLevel: "info" | "warn" | "error" =
    status === "complained"
      ? "error"
      : status === "bounced"
        ? "warn"
        : "info";
  await track(
    `email.${status}`,
    { emailType, resendId },
    { scanId, level: trackLevel }
  );

  if ((status === "bounced" || status === "complained") && recipient) {
    try {
      await markUnsubscribed(recipient);
    } catch (err) {
      console.error(
        "[email] failed to auto-unsubscribe after bounce/complaint",
        err
      );
    }
  }

  if (status === "bounced") {
    await checkBounceRateAlert();
  }

  return "ingested";
}

/**
 * Tracks bounce rate over a trailing 7-day window. Resend will start
 * throttling and may suspend a sender domain when hard bounces exceed
 * roughly 5%. We warn at 2% so there is room to react before deliverability
 * actually degrades. Skips alerting for low-volume windows where a single
 * bad address would push the percentage past the threshold.
 */
async function checkBounceRateAlert(): Promise<void> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'bounced')::int AS bounces,
        COUNT(*) FILTER (WHERE status IN ('sent', 'delivered'))::int AS sends
      FROM email_events
      WHERE sent_at > now() - interval '7 days'
    `) as { bounces: number; sends: number }[];
    const bounces = rows[0]?.bounces ?? 0;
    const sends = rows[0]?.sends ?? 0;
    if (sends < 20) return;

    const rate = bounces / sends;
    if (rate < 0.02) return;

    const level = rate >= 0.05 ? "error" : "warning";
    const message = `Pathlight email bounce rate ${(rate * 100).toFixed(1)}% over 7d (${bounces}/${sends})`;
    console.warn(`[email] bounce rate alert: ${message}`);
    Sentry.captureMessage(message, {
      level,
      tags: { source: "email-bounce-monitor" },
      extra: {
        bounces,
        sends,
        rate,
        threshold_warning: 0.02,
        threshold_critical: 0.05,
      },
    });
  } catch (err) {
    console.error("[email] bounce rate alert query failed", err);
  }
}
