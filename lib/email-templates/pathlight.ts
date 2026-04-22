import type { RemediationItem } from "@/lib/types/scan";

export type EmailMergeData = {
  scanId: string;
  url: string;
  email: string;
  businessName: string | null;
  pathlightScore: number | null;
  revenueLoss: number | null;
  topFinding: RemediationItem | null;
  reportUrl: string;
  calendlyUrl: string;
  unsubscribeUrl: string;
};

export type BuiltEmail = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const TEXT_COLOR = "#1a1a2e";
const MUTED_COLOR = "#525b7a";
const ACCENT_COLOR = "#3b82f6";
const WRAPPER_BG = "#f4f4f5";
const CARD_BG = "#ffffff";
const BORDER_COLOR = "#e4e4e7";

function formatMoney(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "a meaningful amount";
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function greeting(businessName: string | null): string {
  return businessName ? `Hi ${businessName},` : "Hi there,";
}

function displayName(businessName: string | null): string {
  return businessName ?? "your website";
}

function button(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
      <tr>
        <td align="center" bgcolor="${ACCENT_COLOR}" style="border-radius: 6px;">
          <a href="${href}" style="display: inline-block; padding: 12px 24px; font-family: ${FONT_STACK}; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">${label}</a>
        </td>
      </tr>
    </table>
  `;
}

function footer(unsubscribeUrl: string): string {
  return `
    <tr>
      <td style="padding: 24px 32px 32px; border-top: 1px solid ${BORDER_COLOR}; font-family: ${FONT_STACK}; font-size: 12px; line-height: 18px; color: ${MUTED_COLOR}; text-align: center;">
        DBJ Technologies &middot; Dallas, TX<br/>
        <a href="${unsubscribeUrl}" style="color: ${MUTED_COLOR}; text-decoration: underline;">Unsubscribe</a> from Pathlight emails
      </td>
    </tr>
  `;
}

function shell(preheader: string, body: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pathlight</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${WRAPPER_BG}; font-family: ${FONT_STACK}; color: ${TEXT_COLOR};">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${WRAPPER_BG};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: ${CARD_BG}; border: 1px solid ${BORDER_COLOR}; border-radius: 8px;">
          <tr>
            <td style="padding: 32px 32px 8px; font-family: ${FONT_STACK}; font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: ${ACCENT_COLOR};">Pathlight</td>
          </tr>
          ${body}
          ${footer(unsubscribeUrl)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildReportEmail(data: EmailMergeData): BuiltEmail {
  const subject = `Your Pathlight report for ${data.url} is ready`;
  const preheader = "See exactly what your website is costing you each month.";
  const scoreDisplay = data.pathlightScore !== null ? `${data.pathlightScore}` : "—";
  const revenueDisplay = formatMoney(data.revenueLoss);

  const body = `
    <tr>
      <td style="padding: 8px 32px 0; font-family: ${FONT_STACK}; font-size: 16px; line-height: 24px; color: ${TEXT_COLOR};">
        <p style="margin: 16px 0;">${greeting(data.businessName)}</p>
        <p style="margin: 16px 0;">Your Pathlight scan of <a href="${data.url}" style="color: ${ACCENT_COLOR};">${data.url}</a> is complete.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
          <tr>
            <td width="50%" valign="top" style="padding: 16px; background-color: ${WRAPPER_BG}; border-radius: 6px;">
              <div style="font-family: ${FONT_STACK}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: ${MUTED_COLOR};">Pathlight Score</div>
              <div style="font-family: ${FONT_STACK}; font-size: 40px; font-weight: 700; color: ${TEXT_COLOR}; margin-top: 4px;">${scoreDisplay}<span style="font-size: 20px; color: ${MUTED_COLOR}; font-weight: 500;">/100</span></div>
            </td>
            <td width="8"></td>
            <td width="50%" valign="top" style="padding: 16px; background-color: ${WRAPPER_BG}; border-radius: 6px;">
              <div style="font-family: ${FONT_STACK}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: ${MUTED_COLOR};">Est. Monthly Revenue Loss</div>
              <div style="font-family: ${FONT_STACK}; font-size: 28px; font-weight: 700; color: ${ACCENT_COLOR}; margin-top: 4px;">${revenueDisplay}</div>
            </td>
          </tr>
        </table>
        <p style="margin: 16px 0;">Your report includes Lighthouse performance scores, AI-powered design analysis, conversion psychology evaluation, and prioritized fixes ranked by revenue impact.</p>
        ${button("View Your Full Report", data.reportUrl)}
        <p style="margin: 16px 0;">Questions about your report? Just reply to this email &mdash; I read every one.</p>
        <p style="margin: 24px 0 8px;">Joshua Jones<br/>
        <span style="color: ${MUTED_COLOR};">Principal Architect, DBJ Technologies</span><br/>
        <em style="color: ${MUTED_COLOR};">Architect The Impossible</em></p>
      </td>
    </tr>
  `;

  const text = [
    greeting(data.businessName),
    "",
    `Your Pathlight scan of ${data.url} is complete.`,
    "",
    `Pathlight Score: ${scoreDisplay}/100`,
    `Est. Monthly Revenue Loss: ${revenueDisplay}`,
    "",
    "Your report includes Lighthouse performance scores, AI-powered design analysis, conversion psychology evaluation, and prioritized fixes ranked by revenue impact.",
    "",
    `View your full report: ${data.reportUrl}`,
    "",
    "Questions about your report? Just reply to this email — I read every one.",
    "",
    "Joshua Jones",
    "Principal Architect, DBJ Technologies",
    "Architect The Impossible",
    "",
    "—",
    "DBJ Technologies · Dallas, TX",
    `Unsubscribe: ${data.unsubscribeUrl}`,
  ].join("\n");

  return { subject, preheader, html: shell(preheader, body, data.unsubscribeUrl), text };
}

function buildFollowUp48h(data: EmailMergeData): BuiltEmail {
  const subject = `The #1 thing holding ${displayName(data.businessName)} back`;
  const preheader = "Your top opportunity from the Pathlight scan.";
  const topTitle = data.topFinding?.title ?? "one of the issues Pathlight flagged";
  const topProblem =
    data.topFinding?.problem ??
    "A gap in your site experience that visitors are silently reacting to.";
  const topFix =
    data.topFinding?.improvement ??
    "A focused rebuild of the affected section, measured against your real traffic.";
  const revenueDisplay = formatMoney(data.revenueLoss);

  const body = `
    <tr>
      <td style="padding: 8px 32px 0; font-family: ${FONT_STACK}; font-size: 16px; line-height: 24px; color: ${TEXT_COLOR};">
        <p style="margin: 16px 0;">${greeting(data.businessName)}</p>
        <p style="margin: 16px 0;">Two days ago you ran ${data.url} through Pathlight. I've been thinking about your results.</p>
        <p style="margin: 16px 0;"><strong>One issue stands out above the rest:</strong></p>
        <div style="margin: 16px 0; padding: 20px; background-color: ${WRAPPER_BG}; border-left: 4px solid ${ACCENT_COLOR}; border-radius: 4px;">
          <div style="font-weight: 700; font-size: 17px; color: ${TEXT_COLOR}; margin-bottom: 8px;">${topTitle}</div>
          <div style="color: ${MUTED_COLOR}; font-size: 15px; line-height: 22px;">${topProblem}</div>
        </div>
        <p style="margin: 16px 0;">A meaningful share of your estimated <strong style="color: ${ACCENT_COLOR};">${revenueDisplay}/mo</strong> in lost revenue traces back to this single issue. Fixing it looks like: ${topFix}</p>
        <p style="margin: 16px 0;">If you'd like to talk through what a focused rebuild would cost and how fast we could ship it, grab 15 minutes.</p>
        ${button("Book a 15-Minute Discovery Call", data.calendlyUrl)}
        <p style="margin: 16px 0; color: ${MUTED_COLOR}; font-size: 14px;">No obligation &mdash; just a focused conversation.</p>
        <p style="margin: 24px 0 8px;">Joshua</p>
      </td>
    </tr>
  `;

  const text = [
    greeting(data.businessName),
    "",
    `Two days ago you ran ${data.url} through Pathlight. I've been thinking about your results.`,
    "",
    "One issue stands out above the rest:",
    "",
    topTitle,
    topProblem,
    "",
    `A meaningful share of your estimated ${revenueDisplay}/mo in lost revenue traces back to this single issue.`,
    `Fixing it looks like: ${topFix}`,
    "",
    `Book a 15-minute discovery call: ${data.calendlyUrl}`,
    "",
    "No obligation — just a focused conversation.",
    "",
    "Joshua",
    "",
    "—",
    "DBJ Technologies · Dallas, TX",
    `Unsubscribe: ${data.unsubscribeUrl}`,
  ].join("\n");

  return { subject, preheader, html: shell(preheader, body, data.unsubscribeUrl), text };
}

function buildFollowUp5d(data: EmailMergeData): BuiltEmail {
  const subject = "From zero to perfect Lighthouse 100 in 6 hours";
  const preheader = "A real example that matches what Pathlight found on your site.";

  const body = `
    <tr>
      <td style="padding: 8px 32px 0; font-family: ${FONT_STACK}; font-size: 16px; line-height: 24px; color: ${TEXT_COLOR};">
        <p style="margin: 16px 0;">${greeting(data.businessName)}</p>
        <p style="margin: 16px 0;">Quick story that matches what Pathlight showed on ${data.url}.</p>
        <p style="margin: 16px 0;">A Richardson auto repair shop &mdash; Star Auto Service &mdash; ran their site through Pathlight. Same gaps we found on yours. We rebuilt the entire site from scratch in one 6-hour session.</p>
        <p style="margin: 16px 0;"><strong>Result:</strong> perfect Lighthouse 100s on desktop and mobile, stronger trust signals, and a clear path to more customers.</p>
        <p style="margin: 16px 0;">That's the exact gap Pathlight is showing you right now. The fix isn't years of work &mdash; it's one focused rebuild.</p>
        ${button("See What a DBJ Rebuild Looks Like", data.calendlyUrl)}
        <p style="margin: 24px 0 8px;">Joshua</p>
      </td>
    </tr>
  `;

  const text = [
    greeting(data.businessName),
    "",
    `Quick story that matches what Pathlight showed on ${data.url}.`,
    "",
    "A Richardson auto repair shop — Star Auto Service — ran their site through Pathlight. Same gaps we found on yours. We rebuilt the entire site from scratch in one 6-hour session.",
    "",
    "Result: perfect Lighthouse 100s on desktop and mobile, stronger trust signals, and a clear path to more customers.",
    "",
    "That's the exact gap Pathlight is showing you right now. The fix isn't years of work — it's one focused rebuild.",
    "",
    `See what a DBJ rebuild looks like: ${data.calendlyUrl}`,
    "",
    "Joshua",
    "",
    "—",
    "DBJ Technologies · Dallas, TX",
    `Unsubscribe: ${data.unsubscribeUrl}`,
  ].join("\n");

  return { subject, preheader, html: shell(preheader, body, data.unsubscribeUrl), text };
}

function buildBreakup8d(data: EmailMergeData): BuiltEmail {
  const subject = "Last note on your Pathlight report";
  const preheader = "Still thinking about those revenue gaps?";
  const revenueDisplay = formatMoney(data.revenueLoss);

  const body = `
    <tr>
      <td style="padding: 8px 32px 0; font-family: ${FONT_STACK}; font-size: 16px; line-height: 24px; color: ${TEXT_COLOR};">
        <p style="margin: 16px 0;">${greeting(data.businessName)}</p>
        <p style="margin: 16px 0;">Just closing the loop on your Pathlight scan of ${data.url}.</p>
        <p style="margin: 16px 0;">Pathlight estimated roughly <strong style="color: ${ACCENT_COLOR};">${revenueDisplay}/mo</strong> in revenue leaking out of your site. If that number sits heavier the longer it stays on the page, 15 minutes on the calendar is the fastest way to stop it.</p>
        ${button("Book Your Discovery Call", data.calendlyUrl)}
        <p style="margin: 16px 0;">Either way, thanks for trying Pathlight. The tool is always free for future scans &mdash; rerun it anytime a site ships major changes.</p>
        <p style="margin: 24px 0 8px;">Wishing you the best,<br/>Joshua</p>
      </td>
    </tr>
  `;

  const text = [
    greeting(data.businessName),
    "",
    `Just closing the loop on your Pathlight scan of ${data.url}.`,
    "",
    `Pathlight estimated roughly ${revenueDisplay}/mo in revenue leaking out of your site. If that number sits heavier the longer it stays on the page, 15 minutes on the calendar is the fastest way to stop it.`,
    "",
    `Book your discovery call: ${data.calendlyUrl}`,
    "",
    "Either way, thanks for trying Pathlight. The tool is always free for future scans — rerun it anytime a site ships major changes.",
    "",
    "Wishing you the best,",
    "Joshua",
    "",
    "—",
    "DBJ Technologies · Dallas, TX",
    `Unsubscribe: ${data.unsubscribeUrl}`,
  ].join("\n");

  return { subject, preheader, html: shell(preheader, body, data.unsubscribeUrl), text };
}

export { buildReportEmail, buildFollowUp48h, buildFollowUp5d, buildBreakup8d };
