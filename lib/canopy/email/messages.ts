import { getDb } from "@/lib/db";

export type EmailDirection = "in" | "out";

export interface EmailMessageRow {
  id: number;
  contact_id: number;
  deal_id: number | null;
  user_email: string | null;
  direction: EmailDirection;
  gmail_message_id: string | null;
  thread_id: string | null;
  subject: string | null;
  from_address: string;
  to_addresses: string[];
  cc_addresses: string[];
  body_html: string | null;
  body_text: string | null;
  sent_at: string | null;
  received_at: string | null;
  opened_at: string[];
  clicked_links: Array<{ url: string; ts: string }>;
  template_id: number | null;
  created_at: string;
}

export interface InsertEmailMessageInput {
  contactId: number;
  dealId: number | null;
  userEmail: string | null;
  direction: EmailDirection;
  gmailMessageId: string | null;
  threadId: string | null;
  subject: string | null;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses: string[];
  bodyHtml: string | null;
  bodyText: string | null;
  sentAt: Date | null;
  receivedAt: Date | null;
  templateId: number | null;
}

export async function insertEmailMessage(
  input: InsertEmailMessageInput
): Promise<EmailMessageRow | null> {
  const sql = getDb();
  const rows = (await sql`
    INSERT INTO email_messages (
      contact_id, deal_id, user_email, direction,
      gmail_message_id, thread_id, subject,
      from_address, to_addresses, cc_addresses,
      body_html, body_text, sent_at, received_at, template_id
    )
    VALUES (
      ${input.contactId}, ${input.dealId}, ${input.userEmail}, ${input.direction},
      ${input.gmailMessageId}, ${input.threadId}, ${input.subject},
      ${input.fromAddress}, ${input.toAddresses}, ${input.ccAddresses},
      ${input.bodyHtml}, ${input.bodyText},
      ${input.sentAt ? input.sentAt.toISOString() : null},
      ${input.receivedAt ? input.receivedAt.toISOString() : null},
      ${input.templateId}
    )
    ON CONFLICT (gmail_message_id) DO NOTHING
    RETURNING *
  `) as EmailMessageRow[];
  return rows[0] ?? null;
}

export async function findContactIdByEmail(
  email: string
): Promise<number | null> {
  const sql = getDb();
  const rows = (await sql`
    SELECT id FROM contacts WHERE email = ${email.toLowerCase()} LIMIT 1
  `) as Array<{ id: number }>;
  return rows[0]?.id ?? null;
}

export async function findMostRecentOpenDealForContact(
  contactId: number
): Promise<number | null> {
  const sql = getDb();
  const rows = (await sql`
    SELECT id FROM deals
    WHERE contact_id = ${contactId} AND closed_at IS NULL
    ORDER BY updated_at DESC
    LIMIT 1
  `) as Array<{ id: number }>;
  return rows[0]?.id ?? null;
}

export async function recordEmailOpen(
  messageId: number,
  at: Date = new Date()
): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE email_messages
    SET opened_at = array_append(opened_at, ${at.toISOString()}::timestamptz)
    WHERE id = ${messageId}
  `;
}

export async function recordEmailClick(
  messageId: number,
  url: string,
  at: Date = new Date()
): Promise<void> {
  const sql = getDb();
  const entry = JSON.stringify({ url, ts: at.toISOString() });
  await sql`
    UPDATE email_messages
    SET clicked_links = clicked_links || ${entry}::jsonb
    WHERE id = ${messageId}
  `;
}

export async function getEmailMessageForTracking(
  messageId: number
): Promise<{ id: number; contact_id: number; user_email: string | null } | null> {
  const sql = getDb();
  const rows = (await sql`
    SELECT id, contact_id, user_email
    FROM email_messages
    WHERE id = ${messageId}
    LIMIT 1
  `) as Array<{ id: number; contact_id: number; user_email: string | null }>;
  return rows[0] ?? null;
}

export async function getThreadEmailMessages(
  contactId: number,
  limit = 50
): Promise<EmailMessageRow[]> {
  const sql = getDb();
  return (await sql`
    SELECT * FROM email_messages
    WHERE contact_id = ${contactId}
    ORDER BY COALESCE(received_at, sent_at, created_at) DESC
    LIMIT ${limit}
  `) as EmailMessageRow[];
}

export async function listConnectedAdminEmails(): Promise<string[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT DISTINCT user_email FROM oauth_tokens WHERE provider = 'google'
  `) as Array<{ user_email: string }>;
  return rows.map((r) => r.user_email);
}
