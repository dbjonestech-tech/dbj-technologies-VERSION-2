"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { recordChange } from "@/lib/canopy/audit";
import { canonicalizeTag } from "@/lib/canopy/tags";

async function requireAdmin(): Promise<{ email: string }> {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.email) {
    throw new Error("not authorized");
  }
  return { email: session.user.email };
}

interface BulkResult {
  ok: true;
  affected: number;
  metadata?: Record<string, unknown>;
}

type Result = BulkResult | { ok: false; error: string };

export async function bulkAddTagAction(input: {
  contact_ids: number[];
  tag: string;
}): Promise<Result> {
  await requireAdmin();
  const tag = canonicalizeTag(input.tag);
  if (!tag) return { ok: false, error: "tag required" };
  if (input.contact_ids.length === 0) return { ok: false, error: "no contacts" };
  try {
    const sql = getDb();
    const r = (await sql`
      UPDATE contacts
      SET tags = ARRAY(SELECT DISTINCT unnest(tags || ARRAY[${tag}]::text[]))
      WHERE id = ANY(${input.contact_ids}::bigint[])
      RETURNING id
    `) as Array<{ id: number }>;
    revalidatePath("/admin/contacts");
    await recordChange({
      entityType: "contact",
      entityId: input.contact_ids.join(","),
      action: "bulk.tag.add",
      after: { tag, count: r.length },
    });
    return { ok: true, affected: r.length, metadata: { tag } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "update failed" };
  }
}

export async function bulkRemoveTagAction(input: {
  contact_ids: number[];
  tag: string;
}): Promise<Result> {
  await requireAdmin();
  const tag = canonicalizeTag(input.tag);
  if (!tag) return { ok: false, error: "tag required" };
  if (input.contact_ids.length === 0) return { ok: false, error: "no contacts" };
  try {
    const sql = getDb();
    const r = (await sql`
      UPDATE contacts
      SET tags = array_remove(tags, ${tag})
      WHERE id = ANY(${input.contact_ids}::bigint[])
      RETURNING id
    `) as Array<{ id: number }>;
    revalidatePath("/admin/contacts");
    await recordChange({
      entityType: "contact",
      entityId: input.contact_ids.join(","),
      action: "bulk.tag.remove",
      after: { tag, count: r.length },
    });
    return { ok: true, affected: r.length, metadata: { tag } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "update failed" };
  }
}

export async function bulkEnrollInSequenceAction(input: {
  contact_ids: number[];
  sequence_id: number;
}): Promise<Result> {
  await requireAdmin();
  if (input.contact_ids.length === 0) return { ok: false, error: "no contacts" };
  try {
    const sql = getDb();
    const seqRows = (await sql`
      SELECT status FROM sequences WHERE id = ${input.sequence_id}
    `) as Array<{ status: string }>;
    if (seqRows.length === 0) return { ok: false, error: "sequence not found" };
    if (seqRows[0]!.status === "archived") return { ok: false, error: "sequence is archived" };

    const firstStep = (await sql`
      SELECT delay_seconds FROM sequence_steps
      WHERE sequence_id = ${input.sequence_id} ORDER BY step_order ASC LIMIT 1
    `) as Array<{ delay_seconds: number }>;
    const firstDelay = firstStep[0]?.delay_seconds ?? 0;
    const nextRunAt = new Date(Date.now() + firstDelay * 1000).toISOString();

    let enrolled = 0;
    for (const id of input.contact_ids) {
      const r = (await sql`
        INSERT INTO sequence_enrollments
          (sequence_id, contact_id, current_step_order, status, next_run_at)
        VALUES
          (${input.sequence_id}, ${id}, 0, 'active', ${nextRunAt})
        ON CONFLICT (sequence_id, contact_id) DO NOTHING
        RETURNING id
      `) as Array<{ id: number }>;
      if (r.length > 0) enrolled++;
    }
    revalidatePath("/admin/contacts");
    revalidatePath(`/admin/sequences/${input.sequence_id}`);
    await recordChange({
      entityType: "sequence",
      entityId: String(input.sequence_id),
      action: "bulk.sequence.enroll",
      after: { enrolled, total_requested: input.contact_ids.length },
    });
    return { ok: true, affected: enrolled };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "enroll failed" };
  }
}

export async function bulkDeleteContactsAction(input: {
  contact_ids: number[];
}): Promise<Result> {
  await requireAdmin();
  if (input.contact_ids.length === 0) return { ok: false, error: "no contacts" };
  try {
    const sql = getDb();
    const r = (await sql`
      DELETE FROM contacts WHERE id = ANY(${input.contact_ids}::bigint[])
      RETURNING id
    `) as Array<{ id: number }>;
    revalidatePath("/admin/contacts");
    await recordChange({
      entityType: "contact",
      entityId: input.contact_ids.join(","),
      action: "bulk.delete",
      after: { count: r.length },
    });
    return { ok: true, affected: r.length };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "delete failed" };
  }
}

export async function bulkExportContactsAction(input: {
  contact_ids: number[];
}): Promise<{ ok: true; csv: string; filename: string } | { ok: false; error: string }> {
  await requireAdmin();
  if (input.contact_ids.length === 0) return { ok: false, error: "no contacts" };
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, name, email, company, phone, website, status, source,
             follow_up_date::text AS follow_up_date,
             pathlight_scan_id, last_activity_at::text AS last_activity_at,
             created_at::text AS created_at, tags
      FROM contacts WHERE id = ANY(${input.contact_ids}::bigint[])
      ORDER BY created_at ASC
    `) as Array<Record<string, unknown>>;

    const headers = ["id", "name", "email", "company", "phone", "website", "status", "source", "follow_up_date", "pathlight_scan_id", "last_activity_at", "created_at", "tags"];
    const lines: string[] = [headers.join(",")];
    for (const row of rows) {
      lines.push(headers.map((h) => csvEscape(row[h])).join(","));
    }
    const csv = lines.join("\n");
    const filename = `canopy-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    await recordChange({
      entityType: "contact",
      entityId: input.contact_ids.join(","),
      action: "bulk.export",
      after: { count: rows.length, filename },
    });
    return { ok: true, csv, filename };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "export failed" };
  }
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return csvEscape(v.join(";"));
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
