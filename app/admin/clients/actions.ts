"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { isAdminEmail } from "@/lib/auth/allowlist";
import { writeAdminAudit } from "@/lib/auth/audit";
import {
  archiveClient,
  getClient,
  reactivateClient,
  updateClient,
} from "@/lib/auth/clients";
import {
  createInvitation,
  hasValidInvitationFor,
  isAdminUser,
} from "@/lib/auth/users";
import { sendInvitationEmail } from "@/lib/auth/notify";
import {
  createFile,
  createProject,
  deleteFile,
  deleteProject,
  getFile,
  getProject,
  PROJECT_PHASES,
  PROJECT_STATUSES,
  updateProject,
  type ProjectPhase,
  type ProjectStatus,
} from "@/lib/portal/projects";
import { uploadClientFile } from "@/lib/portal/blob";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireAdminEmail(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase().trim();
  if (!session?.user?.isAdmin || !email) {
    redirect("/signin?callbackUrl=/admin/clients");
  }
  return email;
}

function flashRedirect(target: string, params: Record<string, string>): never {
  const search = new URLSearchParams(params);
  redirect(`${target}?${search.toString()}`);
}

export async function inviteClientAction(formData: FormData): Promise<void> {
  const inviter = await requireAdminEmail();
  const rawEmail = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();

  if (!rawEmail || !EMAIL_RE.test(rawEmail) || rawEmail.length > 320) {
    flashRedirect("/admin/clients", { error: "Enter a valid email address." });
  }
  if (rawEmail === inviter) {
    flashRedirect("/admin/clients", {
      error: "You cannot invite yourself as a client.",
    });
  }
  if (isAdminEmail(rawEmail)) {
    flashRedirect("/admin/clients", {
      error: "That email is already a bootstrap admin.",
    });
  }
  if (await isAdminUser(rawEmail)) {
    flashRedirect("/admin/clients", {
      error: "That email is already an admin.",
    });
  }
  const existing = await getClient(rawEmail);
  if (existing && existing.status === "active") {
    flashRedirect("/admin/clients", {
      error: "That email is already an active client.",
    });
  }
  if (await hasValidInvitationFor(rawEmail)) {
    flashRedirect("/admin/clients", {
      error: "An open invitation already exists for that email.",
    });
  }

  /* Pre-create the client row so the inviting admin can fill in name +
   * company immediately. The acceptance flow will upsert into this same
   * row when the client signs in. The row is status='active' from the
   * jump; sign-in is gated separately by the invitation table. */
  await ensureClientRow({
    email: rawEmail,
    name: name || null,
    company: company || null,
    invitedBy: inviter,
  });

  const invitation = await createInvitation({
    email: rawEmail,
    invitedBy: inviter,
    role: "client",
  });

  try {
    await sendInvitationEmail({
      toEmail: rawEmail,
      invitedBy: inviter,
      token: invitation.token,
      expiresAt: new Date(invitation.expires_at),
      role: "client",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await writeAdminAudit({
      email: inviter,
      event: "admin.action",
      result: "error",
      metadata: {
        action: "invite_client",
        invitee: rawEmail,
        delivery: "failed",
        error: msg.slice(0, 300),
      },
    });
    revalidatePath("/admin/clients");
    flashRedirect("/admin/clients", {
      sent: rawEmail,
      delivery: "failed",
    });
  }

  await writeAdminAudit({
    email: inviter,
    event: "admin.action",
    result: "success",
    metadata: { action: "invite_client", invitee: rawEmail, delivery: "sent" },
  });
  revalidatePath("/admin/clients");
  flashRedirect("/admin/clients", { sent: rawEmail, delivery: "sent" });
}

async function ensureClientRow(args: {
  email: string;
  name: string | null;
  company: string | null;
  invitedBy: string;
}): Promise<void> {
  const existing = await getClient(args.email);
  if (existing) {
    /* Reactivate + refresh fields if previously archived. */
    await updateClient({
      email: args.email,
      name: args.name ?? existing.name,
      company: args.company ?? existing.company,
      notes: existing.notes,
    });
    if (existing.status === "archived") {
      await reactivateClient(args.email);
    }
    return;
  }
  const sql = getDb();
  await sql`
    INSERT INTO clients (email, name, company, invited_by, invited_at, accepted_at, status)
    VALUES (${args.email}, ${args.name}, ${args.company}, ${args.invitedBy}, now(), now(), 'active')
  `;
}

export async function updateClientAction(formData: FormData): Promise<void> {
  const actor = await requireAdminEmail();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const company = String(formData.get("company") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!email) flashRedirect("/admin/clients", { error: "Missing email." });

  await updateClient({ email, name, company, notes });
  await writeAdminAudit({
    email: actor,
    event: "admin.action",
    result: "success",
    metadata: { action: "update_client", target: email },
  });
  revalidatePath(`/admin/clients/${encodeURIComponent(email)}`);
  flashRedirect(`/admin/clients/${encodeURIComponent(email)}`, {
    saved: "1",
  });
}

export async function archiveClientAction(formData: FormData): Promise<void> {
  const actor = await requireAdminEmail();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) flashRedirect("/admin/clients", { error: "Missing email." });
  if (email === actor)
    flashRedirect("/admin/clients", { error: "You cannot archive yourself." });
  await archiveClient(email);
  await writeAdminAudit({
    email: actor,
    event: "admin.action",
    result: "success",
    metadata: { action: "archive_client", target: email },
  });
  revalidatePath("/admin/clients");
  flashRedirect("/admin/clients", { archived: email });
}

export async function reactivateClientAction(formData: FormData): Promise<void> {
  const actor = await requireAdminEmail();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) flashRedirect("/admin/clients", { error: "Missing email." });
  await reactivateClient(email);
  await writeAdminAudit({
    email: actor,
    event: "admin.action",
    result: "success",
    metadata: { action: "reactivate_client", target: email },
  });
  revalidatePath("/admin/clients");
  flashRedirect("/admin/clients", { reactivated: email });
}

export async function createProjectAction(formData: FormData): Promise<void> {
  const actor = await requireAdminEmail();
  const clientEmail = String(formData.get("client_email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const phaseRaw = String(formData.get("phase") ?? "discovery");
  const phase = (PROJECT_PHASES as readonly string[]).includes(phaseRaw)
    ? (phaseRaw as ProjectPhase)
    : "discovery";

  if (!clientEmail || !name) {
    flashRedirect(`/admin/clients/${encodeURIComponent(clientEmail || "")}`, {
      error: "Project name is required.",
    });
  }

  const project = await createProject({ clientEmail, name, phase });
  await writeAdminAudit({
    email: actor,
    event: "admin.action",
    result: "success",
    metadata: {
      action: "create_project",
      project_id: project.id,
      client: clientEmail,
    },
  });
  revalidatePath(`/admin/clients/${encodeURIComponent(clientEmail)}`);
  flashRedirect(`/admin/clients/${encodeURIComponent(clientEmail)}`, {
    created_project: project.id,
  });
}

export async function updateProjectAction(formData: FormData): Promise<void> {
  const actor = await requireAdminEmail();
  const id = String(formData.get("id") ?? "").trim();
  const clientEmail = String(formData.get("client_email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const phaseRaw = String(formData.get("phase") ?? "");
  const statusRaw = String(formData.get("status") ?? "");
  const currentMilestone = (String(formData.get("current_milestone") ?? "").trim() || null);
  const nextDeliverable = (String(formData.get("next_deliverable") ?? "").trim() || null);
  const projectedEta = (String(formData.get("projected_eta") ?? "").trim() || null);

  if (!id || !name) {
    flashRedirect(`/admin/clients/${encodeURIComponent(clientEmail)}`, {
      error: "Project id and name are required.",
    });
  }
  const phase = (PROJECT_PHASES as readonly string[]).includes(phaseRaw)
    ? (phaseRaw as ProjectPhase)
    : "discovery";
  const status = (PROJECT_STATUSES as readonly string[]).includes(statusRaw)
    ? (statusRaw as ProjectStatus)
    : "active";

  await updateProject({
    id,
    name,
    phase,
    status,
    currentMilestone,
    nextDeliverable,
    projectedEta,
  });
  await writeAdminAudit({
    email: actor,
    event: "admin.action",
    result: "success",
    metadata: {
      action: "update_project",
      project_id: id,
      phase,
      status,
    },
  });
  revalidatePath(`/admin/clients/${encodeURIComponent(clientEmail)}`);
  flashRedirect(`/admin/clients/${encodeURIComponent(clientEmail)}`, {
    saved_project: id,
  });
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const actor = await requireAdminEmail();
  const id = String(formData.get("id") ?? "").trim();
  const clientEmail = String(formData.get("client_email") ?? "").trim().toLowerCase();
  if (!id) flashRedirect("/admin/clients", { error: "Missing project id." });
  await deleteProject(id);
  await writeAdminAudit({
    email: actor,
    event: "admin.action",
    result: "success",
    metadata: { action: "delete_project", project_id: id },
  });
  revalidatePath(`/admin/clients/${encodeURIComponent(clientEmail)}`);
  flashRedirect(`/admin/clients/${encodeURIComponent(clientEmail)}`, {
    deleted_project: id,
  });
}

export async function uploadFileAction(formData: FormData): Promise<void> {
  const actor = await requireAdminEmail();
  const projectId = String(formData.get("project_id") ?? "").trim();
  const clientEmail = String(formData.get("client_email") ?? "").trim().toLowerCase();
  const label = String(formData.get("label") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const file = formData.get("file");

  if (!projectId || !label || !(file instanceof File) || file.size === 0) {
    flashRedirect(`/admin/clients/${encodeURIComponent(clientEmail)}`, {
      error: "Pick a file and provide a label.",
    });
  }
  if (!(file instanceof File)) {
    flashRedirect(`/admin/clients/${encodeURIComponent(clientEmail)}`, {
      error: "Invalid upload payload.",
    });
  }

  const project = await getProject(projectId);
  if (!project) {
    flashRedirect(`/admin/clients/${encodeURIComponent(clientEmail)}`, {
      error: "Project not found.",
    });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadClientFile({
      projectId,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      data: buffer,
    });
    await createFile({
      projectId,
      label,
      description,
      blobUrl: uploaded.url,
      blobPathname: uploaded.pathname,
      contentType: file.type || null,
      sizeBytes: file.size,
      uploadedBy: actor,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin/clients] uploadFileAction failed:", msg);
    await writeAdminAudit({
      email: actor,
      event: "admin.action",
      result: "error",
      metadata: {
        action: "upload_file",
        project_id: projectId,
        error: msg.slice(0, 300),
      },
    });
    flashRedirect(`/admin/clients/${encodeURIComponent(clientEmail)}`, {
      error: "Upload failed: " + msg.slice(0, 200),
    });
  }

  await writeAdminAudit({
    email: actor,
    event: "admin.action",
    result: "success",
    metadata: {
      action: "upload_file",
      project_id: projectId,
      label,
    },
  });
  revalidatePath(`/admin/clients/${encodeURIComponent(clientEmail)}`);
  flashRedirect(`/admin/clients/${encodeURIComponent(clientEmail)}`, {
    uploaded: label,
  });
}

export async function deleteFileAction(formData: FormData): Promise<void> {
  const actor = await requireAdminEmail();
  const id = String(formData.get("id") ?? "").trim();
  const clientEmail = String(formData.get("client_email") ?? "").trim().toLowerCase();
  if (!id) flashRedirect("/admin/clients", { error: "Missing file id." });

  /* Don't try to delete from Blob: rows reference the public URL we
   * uploaded with, which is not a strong revocation. The DB row removal
   * is the access boundary (download proxy gates on row existence). */
  const file = await getFile(id);
  await deleteFile(id);
  await writeAdminAudit({
    email: actor,
    event: "admin.action",
    result: "success",
    metadata: {
      action: "delete_file",
      file_id: id,
      label: file?.label ?? null,
    },
  });
  revalidatePath(`/admin/clients/${encodeURIComponent(clientEmail)}`);
  flashRedirect(`/admin/clients/${encodeURIComponent(clientEmail)}`, {
    deleted_file: id,
  });
}
