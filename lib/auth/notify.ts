import { Resend } from "resend";
import { buildNewDeviceEmail } from "@/lib/email-templates/admin-new-device";

/* Best-effort new-device email. Failures only log — the sign-in must
 * never be blocked by a notification side effect. */
export async function sendNewDeviceEmail(args: {
  toEmail: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dbjtechnologies.com";
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
      siteUrl,
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
