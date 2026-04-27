import type { BuiltEmail } from "./pathlight";

export type NewDeviceEmailData = {
  email: string;
  ip: string | null;
  userAgent: string | null;
  signedInAt: Date;
  siteUrl: string;
};

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const TEXT_COLOR = "#1a1a2e";
const MUTED_COLOR = "#525b7a";
const WRAPPER_BG = "#f4f4f5";
const CARD_BG = "#ffffff";
const BORDER_COLOR = "#e4e4e7";

function formatTime(d: Date): string {
  return d.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function summarizeUserAgent(ua: string | null): string {
  if (!ua) return "Unknown browser";
  const lower = ua.toLowerCase();
  let browser = "Unknown browser";
  if (lower.includes("edg/")) browser = "Edge";
  else if (lower.includes("chrome/") && !lower.includes("chromium")) browser = "Chrome";
  else if (lower.includes("firefox/")) browser = "Firefox";
  else if (lower.includes("safari/") && !lower.includes("chrome")) browser = "Safari";
  let os = "Unknown OS";
  if (lower.includes("mac os x")) os = "Mac";
  else if (lower.includes("windows nt")) os = "Windows";
  else if (lower.includes("iphone") || lower.includes("ipad")) os = "iOS";
  else if (lower.includes("android")) os = "Android";
  else if (lower.includes("linux")) os = "Linux";
  return `${browser} on ${os}`;
}

export function buildNewDeviceEmail(data: NewDeviceEmailData): BuiltEmail {
  const subject = "New sign-in to your DBJ admin account";
  const preheader = `Sign-in detected from ${summarizeUserAgent(data.userAgent)}.`;
  const when = formatTime(data.signedInAt);
  const device = summarizeUserAgent(data.userAgent);
  const ip = data.ip ?? "unknown";

  const html = `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${subject}</title></head>
<body style="margin:0;padding:0;background:${WRAPPER_BG};font-family:${FONT_STACK};color:${TEXT_COLOR};">
  <span style="display:none;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${WRAPPER_BG};">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${WRAPPER_BG};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="background:${CARD_BG};border:1px solid ${BORDER_COLOR};border-radius:8px;">
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px 0;font-size:20px;font-weight:600;color:${TEXT_COLOR};">New sign-in to your admin account</h1>
          <p style="margin:0 0 20px 0;font-size:15px;line-height:1.55;color:${TEXT_COLOR};">
            Someone just signed in to <strong>${data.siteUrl}</strong> with your Google account on a device this account hasn't been seen on before.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border:1px solid ${BORDER_COLOR};border-radius:6px;margin-bottom:20px;">
            <tr><td style="padding:16px;">
              <p style="margin:0 0 6px 0;font-size:13px;color:${MUTED_COLOR};">When</p>
              <p style="margin:0 0 14px 0;font-size:14px;color:${TEXT_COLOR};">${when}</p>
              <p style="margin:0 0 6px 0;font-size:13px;color:${MUTED_COLOR};">Device</p>
              <p style="margin:0 0 14px 0;font-size:14px;color:${TEXT_COLOR};">${device}</p>
              <p style="margin:0 0 6px 0;font-size:13px;color:${MUTED_COLOR};">IP address</p>
              <p style="margin:0;font-size:14px;font-family:monospace;color:${TEXT_COLOR};">${ip}</p>
            </td></tr>
          </table>
          <p style="margin:0 0 8px 0;font-size:14px;color:${TEXT_COLOR};"><strong>Was this you?</strong> No action needed.</p>
          <p style="margin:0;font-size:14px;color:${TEXT_COLOR};"><strong>Wasn't you?</strong> Sign in to ${data.siteUrl}/admin/sessions and revoke all sessions, then change your Google account password.</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0 0;font-size:12px;color:${MUTED_COLOR};">DBJ Technologies admin notification.</p>
    </td></tr>
  </table>
</body></html>`;

  const text = `New sign-in to your DBJ admin account.

When: ${when}
Device: ${device}
IP: ${ip}

Was this you? No action needed.
Wasn't you? Sign in to ${data.siteUrl}/admin/sessions and revoke all sessions, then change your Google account password.

DBJ Technologies admin notification.`;

  return { subject, preheader, html, text };
}
