import { Resend } from "resend";
import { buildNewDeviceEmail } from "@/lib/email-templates/admin-new-device";
import { buildAdminInvitationEmail } from "@/lib/email-templates/admin-invitation";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://dbjtechnologies.com";
}

/* Best-effort new-device email. Failures only log so the sign-in is
 * never blocked by a notification side effect. */
export async function sendNewDeviceEmail(args: {
  toEmail: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromAddress) {
    console.warn("[admin-notify] RESEND_API_KEY or RESEND_FROM_EMAIL missing; skipping new-device email");
    return;
  }
  try {
    const resend = new Resend(apiKey);
    const { subject, html, text } = buildNewDeviceEmail({
      email: args.toEmail,
      ip: args.ip,
      userAgent: args.userAgent,
      signedInAt: new Date(),
      siteUrl: siteUrl(),
    });
    await resend.emails.send({
      from: fromAddress,
      to: args.toEmail,
      subject,
      html,
      text,
      tags: [
        { name: "category", value: "admin_security" },
        { name: "email_type", value: "new_device" },
      ],
    });
  } catch (err) {
    console.error("[admin-notify] new-device email failed:", err);
  }
}

/* Send the admin invitation email. Throws on failure (unlike new-device
 * notify) because the inviting admin needs to know if delivery did not
 * succeed so they can copy the accept link manually as a fallback. */
export async function sendAdminInvitationEmail(args: {
  toEmail: string;
  invitedBy: string;
  token: string;
  expiresAt: Date;
}): Promise<{ id: string | null }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromAddress) {
    throw new Error(
      "RESEND_API_KEY or RESEND_FROM_EMAIL not set; cannot send invitation email"
    );
  }
  const acceptUrl = `${siteUrl()}/invite/${encodeURIComponent(args.token)}`;
  const resend = new Resend(apiKey);
  const { subject, html, text } = buildAdminInvitationEmail({
    invitedEmail: args.toEmail,
    invitedBy: args.invitedBy,
    acceptUrl,
    expiresAt: args.expiresAt,
    siteUrl: siteUrl(),
  });
  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: args.toEmail,
    subject,
    html,
    text,
    tags: [
      { name: "category", value: "admin_security" },
      { name: "email_type", value: "admin_invitation" },
    ],
  });
  if (error) {
    throw new Error(`Resend error: ${String(error)}`);
  }
  return { id: data?.id ?? null };
}
