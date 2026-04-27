import type { BuiltEmail } from "./pathlight";

export type AdminInvitationEmailData = {
  invitedEmail: string;
  invitedBy: string;
  acceptUrl: string;
  expiresAt: Date;
  siteUrl: string;
};

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const TEXT_COLOR = "#1a1a2e";
const MUTED_COLOR = "#525b7a";
const WRAPPER_BG = "#f4f4f5";
const CARD_BG = "#ffffff";
const BORDER_COLOR = "#e4e4e7";
const ACCENT = "#0891b2";

function formatExpiry(d: Date): string {
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

export function buildAdminInvitationEmail(
  data: AdminInvitationEmailData
): BuiltEmail {
  const subject = "You've been invited to the DBJ admin portal";
  const preheader = `Sign in with the Google account at ${data.invitedEmail} to accept.`;
  const expiry = formatExpiry(data.expiresAt);

  const html = `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${subject}</title></head>
<body style="margin:0;padding:0;background:${WRAPPER_BG};font-family:${FONT_STACK};color:${TEXT_COLOR};">
  <span style="display:none;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${WRAPPER_BG};">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${WRAPPER_BG};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="background:${CARD_BG};border:1px solid ${BORDER_COLOR};border-radius:8px;">
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px 0;font-size:20px;font-weight:600;color:${TEXT_COLOR};">You've been invited to the DBJ admin portal</h1>
          <p style="margin:0 0 16px 0;font-size:15px;line-height:1.55;color:${TEXT_COLOR};">
            ${data.invitedBy} has invited you to access the admin portal at <strong>${data.siteUrl}/admin</strong>.
          </p>
          <p style="margin:0 0 24px 0;font-size:15px;line-height:1.55;color:${TEXT_COLOR};">
            Click the button below to accept. You'll sign in with your Google account at <strong>${data.invitedEmail}</strong>.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
            <tr><td style="background:${ACCENT};border-radius:6px;">
              <a href="${data.acceptUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Accept invitation</a>
            </td></tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border:1px solid ${BORDER_COLOR};border-radius:6px;margin-bottom:20px;">
            <tr><td style="padding:16px;">
              <p style="margin:0 0 6px 0;font-size:13px;color:${MUTED_COLOR};">Invitation expires</p>
              <p style="margin:0 0 14px 0;font-size:14px;color:${TEXT_COLOR};">${expiry}</p>
              <p style="margin:0 0 6px 0;font-size:13px;color:${MUTED_COLOR};">Or paste this link into your browser</p>
              <p style="margin:0;font-size:12px;font-family:monospace;color:${TEXT_COLOR};word-break:break-all;">${data.acceptUrl}</p>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:${MUTED_COLOR};">
            If you weren't expecting this invitation, ignore this email. Nothing happens until you accept.
          </p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0 0;font-size:12px;color:${MUTED_COLOR};">DBJ Technologies admin invitation.</p>
    </td></tr>
  </table>
</body></html>`;

  const text = `You've been invited to the DBJ admin portal.

${data.invitedBy} has invited you to access ${data.siteUrl}/admin.

Accept the invitation:
${data.acceptUrl}

You'll sign in with your Google account at ${data.invitedEmail}.

The invitation expires ${expiry}.

If you weren't expecting this, ignore this email. Nothing happens until you accept.`;

  return { subject, preheader, html, text };
}
