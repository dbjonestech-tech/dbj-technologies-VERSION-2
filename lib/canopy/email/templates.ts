import { getDb } from "@/lib/db";
import { detectMergeFields } from "@/lib/email/render";

export interface EmailTemplateRow {
  id: number;
  owner_email: string;
  name: string;
  subject: string;
  body_markdown: string;
  merge_fields: string[];
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function listTemplatesForOwner(
  ownerEmail: string
): Promise<EmailTemplateRow[]> {
  const sql = getDb();
  return (await sql`
    SELECT * FROM email_templates
    WHERE owner_email = ${ownerEmail} AND archived_at IS NULL
    ORDER BY name ASC
  `) as EmailTemplateRow[];
}

export async function getTemplate(
  id: number,
  ownerEmail: string
): Promise<EmailTemplateRow | null> {
  const sql = getDb();
  const rows = (await sql`
    SELECT * FROM email_templates
    WHERE id = ${id} AND owner_email = ${ownerEmail}
    LIMIT 1
  `) as EmailTemplateRow[];
  return rows[0] ?? null;
}

export async function createTemplate(input: {
  ownerEmail: string;
  name: string;
  subject: string;
  bodyMarkdown: string;
}): Promise<EmailTemplateRow> {
  const sql = getDb();
  const fields = mergeFieldUnion(input.subject, input.bodyMarkdown);
  const rows = (await sql`
    INSERT INTO email_templates (owner_email, name, subject, body_markdown, merge_fields)
    VALUES (${input.ownerEmail}, ${input.name}, ${input.subject}, ${input.bodyMarkdown}, ${fields})
    RETURNING *
  `) as EmailTemplateRow[];
  return rows[0]!;
}

export async function updateTemplate(input: {
  id: number;
  ownerEmail: string;
  name: string;
  subject: string;
  bodyMarkdown: string;
}): Promise<EmailTemplateRow | null> {
  const sql = getDb();
  const fields = mergeFieldUnion(input.subject, input.bodyMarkdown);
  const rows = (await sql`
    UPDATE email_templates
    SET name = ${input.name},
        subject = ${input.subject},
        body_markdown = ${input.bodyMarkdown},
        merge_fields = ${fields},
        updated_at = NOW()
    WHERE id = ${input.id} AND owner_email = ${input.ownerEmail}
    RETURNING *
  `) as EmailTemplateRow[];
  return rows[0] ?? null;
}

export async function archiveTemplate(
  id: number,
  ownerEmail: string
): Promise<boolean> {
  const sql = getDb();
  const rows = (await sql`
    UPDATE email_templates
    SET archived_at = NOW(), updated_at = NOW()
    WHERE id = ${id} AND owner_email = ${ownerEmail} AND archived_at IS NULL
    RETURNING id
  `) as Array<{ id: number }>;
  return rows.length > 0;
}

/* Inverse of archiveTemplate. Used by the Undo toast on the
 * templates editor: re-publishes a freshly-archived template within
 * the toast lifetime, reversing the operator's misclick without a
 * fresh "create template" round-trip. */
export async function restoreTemplate(
  id: number,
  ownerEmail: string
): Promise<boolean> {
  const sql = getDb();
  const rows = (await sql`
    UPDATE email_templates
    SET archived_at = NULL, updated_at = NOW()
    WHERE id = ${id} AND owner_email = ${ownerEmail} AND archived_at IS NOT NULL
    RETURNING id
  `) as Array<{ id: number }>;
  return rows.length > 0;
}

function mergeFieldUnion(subject: string, body: string): string[] {
  const set = new Set<string>([
    ...detectMergeFields(subject),
    ...detectMergeFields(body),
  ]);
  return Array.from(set).sort();
}
