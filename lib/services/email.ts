import { Resend } from "resend";
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
import { generateUnsubscribeUrl } from "./unsubscribe";

export type EmailType =
  | "report_delivery"
  | "followup_48h"
  | "followup_5d"
  | "breakup_8d";

export type EmailStatus = "sent" | "skipped" | "failed";

export type EmailSendResult = {
  status: EmailStatus;
  resendId: string | null;
  error: string | null;
};

const REPLY_TO = "dbjonestech@gmail.com";
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

  const built =
    emailNumber === 2
      ? buildFollowUp48h(merge)
      : emailNumber === 3
        ? buildFollowUp5d(merge)
        : buildBreakup8d(merge);
  return dispatch(scanId, emailType, built, merge.email);
}
