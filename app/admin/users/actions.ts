"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/auth/allowlist";
import { writeAdminAudit } from "@/lib/auth/audit";
import {
  createInvitation,
  disableAdminUser,
  getAdminUser,
  hasValidInvitationFor,
  reactivateAdminUser,
  revokeInvitation,
} from "@/lib/auth/users";
import { sendAdminInvitationEmail } from "@/lib/auth/notify";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireAdminEmail(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase().trim();
  if (!session?.user?.isAdmin || !email) {
    redirect("/signin?callbackUrl=/admin/users");
  }
  return email;
}

function flashRedirect(params: Record<string, string>): never {
  const search = new URLSearchParams(params);
  redirect(`/admin/users?${search.toString()}`);
}

export async function inviteAdminAction(formData: FormData): Promise<void> {
  const inviter = await requireAdminEmail();
  const rawEmail = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!rawEmail || !EMAIL_RE.test(rawEmail) || rawEmail.length > 320) {
    flashRedirect({ error: "Enter a valid email address." });
  }
  if (rawEmail === inviter) {
    flashRedirect({ error: "You are already signed in as an admin." });
  }
  if (isAdminEmail(rawEmail)) {
    flashRedirect({
      error: "That email is already in the env allowlist.",
    });
  }
  const existing = await getAdminUser(rawEmail);
  if (existing && existing.status === "active") {
    flashRedirect({ error: "That email is already an active admin." });
  }
  if (await hasValidInvitationFor(rawEmail)) {
    flashRedirect({
      error: "An open invitation already exists for that email.",
    });
  }

  const invitation = await createInvitation({
    email: rawEmail,
    invitedBy: inviter,
  });

  try {
    await sendAdminInvitationEmail({
      toEmail: rawEmail,
      invitedBy: inviter,
      token: invitation.token,
      expiresAt: new Date(invitation.expires_at),
    });
  } catch (err) {
    /* The invitation row landed; the email did not. Surface this so
     * the inviter can copy the accept link manually as a fallback. */
    const msg = err instanceof Error ? err.message : String(err);
    await writeAdminAudit({
      email: inviter,
      event: "admin.action",
      result: "error",
      metadata: {
        action: "invite",
        invitee: rawEmail,
        delivery: "failed",
        error: msg.slice(0, 300),
      },
    });
    revalidatePath("/admin/users");
    flashRedirect({
      sent: rawEmail,
      delivery: "failed",
    });
  }

  await writeAdminAudit({
    email: inviter,
    event: "admin.action",
    result: "success",
    metadata: { action: "invite", invitee: rawEmail, delivery: "sent" },
  });
  revalidatePath("/admin/users");
  flashRedirect({ sent: rawEmail, delivery: "sent" });
}

export async function revokeInvitationAction(formData: FormData): Promise<void> {
  const actor = await requireAdminEmail();
  const token = String(formData.get("token") ?? "").trim();
  if (!token) {
    flashRedirect({ error: "Missing invitation token." });
  }
  await revokeInvitation(token);
  await writeAdminAudit({
    email: actor,
    event: "admin.action",
    result: "success",
    metadata: { action: "revoke_invitation", token: token.slice(0, 8) + "..." },
  });
  revalidatePath("/admin/users");
  flashRedirect({ revoked: "1" });
}

export async function disableAdminUserAction(formData: FormData): Promise<void> {
  const actor = await requireAdminEmail();
  const target = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!target) flashRedirect({ error: "Missing email." });
  if (target === actor) flashRedirect({ error: "You cannot disable yourself." });
  await disableAdminUser(target);
  await writeAdminAudit({
    email: actor,
    event: "admin.action",
    result: "success",
    metadata: { action: "disable_admin", target },
  });
  revalidatePath("/admin/users");
  flashRedirect({ disabled: target });
}

export async function reactivateAdminUserAction(
  formData: FormData
): Promise<void> {
  const actor = await requireAdminEmail();
  const target = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!target) flashRedirect({ error: "Missing email." });
  await reactivateAdminUser(target);
  await writeAdminAudit({
    email: actor,
    event: "admin.action",
    result: "success",
    metadata: { action: "reactivate_admin", target },
  });
  revalidatePath("/admin/users");
  flashRedirect({ reactivated: target });
}
