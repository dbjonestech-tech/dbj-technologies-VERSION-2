"use server";

import { revalidatePath } from "next/cache";
import { getValidAccessToken } from "@/lib/integrations/google-oauth";
import { sendMessage } from "@/lib/integrations/gmail-api";
import { requireRole } from "@/lib/canopy/rbac";
import { recordChange } from "@/lib/canopy/audit";
import {
  buildRenderContextForContact,
  renderTemplate,
} from "@/lib/email/render";
import {
  archiveTemplate,
  restoreTemplate,
  createTemplate,
  updateTemplate,
} from "@/lib/canopy/email/templates";
import {
  findMostRecentOpenDealForContact,
  insertEmailMessage,
} from "@/lib/canopy/email/messages";
import { computeEmailTrackingToken } from "@/lib/canopy/email/tracking-token";
import { getDb } from "@/lib/db";

export interface SendEmailActionInput {
  contactId: number;
  dealId?: number | null;
  templateId?: number | null;
  subject: string;
  bodyMarkdown: string;
}

export interface SendEmailActionResult {
  ok: boolean;
  error?: string;
  messageId?: number;
}

export async function sendEmailAction(
  input: SendEmailActionInput
): Promise<SendEmailActionResult> {
  const session = await requireRole("admin");

  const tokenInfo = await getValidAccessToken(session.email);
  if (!tokenInfo) {
    return {
      ok: false,
      error:
        "Gmail not connected for this account. Connect via /admin/canopy first.",
    };
  }

  const dealId =
    input.dealId === undefined
      ? await findMostRecentOpenDealForContact(input.contactId)
      : input.dealId;

  const renderCtx = await buildRenderContextForContact({
    contactId: input.contactId,
    dealId,
    userEmail: session.email,
    userName: null,
  });
  if (!renderCtx) {
    return { ok: false, error: "contact not found" };
  }

  const subject = renderTemplate(input.subject, renderCtx);
  const bodyTextRaw = renderTemplate(input.bodyMarkdown, renderCtx);

  /* Append a tracking pixel + rewrite outbound links AFTER we know the
   * row id, so we insert first with the rendered body, then update
   * with the tracked HTML. The pixel and click endpoints expect a
   * stable row id from email_messages, which only exists post-insert. */
  const insertedRow = await insertEmailMessage({
    contactId: input.contactId,
    dealId: dealId,
    userEmail: session.email,
    direction: "out",
    gmailMessageId: null,
    threadId: null,
    subject,
    fromAddress: tokenInfo.connectedEmail,
    toAddresses: [renderCtx.contact.email],
    ccAddresses: [],
    bodyHtml: null,
    bodyText: bodyTextRaw,
    sentAt: new Date(),
    receivedAt: null,
    templateId: input.templateId ?? null,
  });

  if (!insertedRow) {
    return { ok: false, error: "failed to record outbound row" };
  }

  const trackedHtml = await wrapWithTracking(bodyTextRaw, insertedRow.id);

  let gmailIds: { messageId: string; threadId: string } | null = null;
  try {
    const sendResult = await sendMessage({
      accessToken: tokenInfo.accessToken,
      fromAddress: tokenInfo.connectedEmail,
      to: [renderCtx.contact.email],
      subject,
      bodyText: bodyTextRaw,
      bodyHtml: trackedHtml,
    });
    gmailIds = {
      messageId: sendResult.messageId,
      threadId: sendResult.threadId,
    };
  } catch (err) {
    /* If Gmail rejected the send, mark the row with a failure flag in
     * clicked_links (re-using the JSONB to avoid a schema change for
     * one error case). The operator can retry from the UI. */
    const sql = getDb();
    const errorEntry = JSON.stringify({
      url: "__send_failed__",
      ts: new Date().toISOString(),
      error: err instanceof Error ? err.message.slice(0, 200) : "unknown",
    });
    await sql`
      UPDATE email_messages
      SET clicked_links = clicked_links || ${errorEntry}::jsonb
      WHERE id = ${insertedRow.id}
    `;
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Gmail send failed: ${err.message.slice(0, 200)}`
          : "Gmail send failed",
      messageId: insertedRow.id,
    };
  }

  /* Backfill the gmail message id and tracked html into the row now
   * that we have the upstream send confirmation. */
  const sql = getDb();
  await sql`
    UPDATE email_messages
    SET gmail_message_id = ${gmailIds.messageId},
        thread_id        = ${gmailIds.threadId},
        body_html        = ${trackedHtml}
    WHERE id = ${insertedRow.id}
  `;

  await recordChange({
    entityType: "email_messages",
    entityId: String(insertedRow.id),
    action: "email.sent",
    after: {
      contactId: input.contactId,
      dealId: dealId,
      subject,
      gmailMessageId: gmailIds.messageId,
    },
  });

  revalidatePath(`/admin/contacts/${input.contactId}`);
  if (dealId) revalidatePath(`/admin/deals/${dealId}`);

  return { ok: true, messageId: insertedRow.id };
}

async function wrapWithTracking(
  bodyText: string,
  messageId: number
): Promise<string> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "http://localhost:3000";
  /* HMAC token appended as ?t=<hex>. Without it, the pixel and click
   * endpoints would record any hit against the sequential message id,
   * letting anyone enumerate /api/email/pixel/{1..N} to inflate opens.
   * The endpoints validate the token server-side before any DB write
   * (recipient experience is unaffected on validation failure: pixel
   * still returns the gif, click still redirects). When AUTH_SECRET
   * is missing the token is null and the URLs render without ?t=, in
   * which case the endpoints simply skip the record. */
  const token = computeEmailTrackingToken(messageId);
  const tokenQS = token ? `t=${token}` : "";
  const pixelUrl = `${baseUrl}/api/email/pixel/${messageId}${tokenQS ? `?${tokenQS}` : ""}`;
  const clickBase = `${baseUrl}/api/email/click/${messageId}`;

  const escaped = escapeHtml(bodyText);
  const withParagraphs = escaped
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("\n");

  const linkified = withParagraphs.replace(
    /\bhttps?:\/\/[^\s<>"]+/g,
    (match) => {
      const params = new URLSearchParams({ to: match });
      if (token) params.set("t", token);
      const tracked = `${clickBase}?${params.toString()}`;
      return `<a href="${tracked}">${match}</a>`;
    }
  );

  return `${linkified}\n<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px" />`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface CreateTemplateActionInput {
  name: string;
  subject: string;
  bodyMarkdown: string;
}

export async function createTemplateAction(
  input: CreateTemplateActionInput
): Promise<{ ok: boolean; error?: string; id?: number }> {
  const session = await requireRole("admin");
  if (!input.name.trim() || !input.subject.trim() || !input.bodyMarkdown.trim()) {
    return { ok: false, error: "name, subject, and body are all required" };
  }
  const row = await createTemplate({
    ownerEmail: session.email,
    name: input.name.trim(),
    subject: input.subject.trim(),
    bodyMarkdown: input.bodyMarkdown,
  });
  await recordChange({
    entityType: "email_templates",
    entityId: String(row.id),
    action: "template.created",
    after: { name: row.name },
  });
  revalidatePath("/admin/canopy/templates");
  return { ok: true, id: row.id };
}

export interface UpdateTemplateActionInput {
  id: number;
  name: string;
  subject: string;
  bodyMarkdown: string;
}

export async function updateTemplateAction(
  input: UpdateTemplateActionInput
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireRole("admin");
  const row = await updateTemplate({
    id: input.id,
    ownerEmail: session.email,
    name: input.name.trim(),
    subject: input.subject.trim(),
    bodyMarkdown: input.bodyMarkdown,
  });
  if (!row) return { ok: false, error: "template not found or not owned" };
  await recordChange({
    entityType: "email_templates",
    entityId: String(row.id),
    action: "template.updated",
    after: { name: row.name },
  });
  revalidatePath("/admin/canopy/templates");
  return { ok: true };
}

export async function archiveTemplateAction(
  id: number
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireRole("admin");
  const ok = await archiveTemplate(id, session.email);
  if (!ok) return { ok: false, error: "template not found or already archived" };
  await recordChange({
    entityType: "email_templates",
    entityId: String(id),
    action: "template.archived",
  });
  revalidatePath("/admin/canopy/templates");
  return { ok: true };
}

/* Reverse archive within the Undo window. Idempotent against an
 * already-published template (returns ok:false with a clear message
 * so the toast can decide whether to surface the failure). */
export async function restoreTemplateAction(
  id: number
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireRole("admin");
  const ok = await restoreTemplate(id, session.email);
  if (!ok) return { ok: false, error: "template not found or not archived" };
  await recordChange({
    entityType: "email_templates",
    entityId: String(id),
    action: "template.restored",
  });
  revalidatePath("/admin/canopy/templates");
  return { ok: true };
}
