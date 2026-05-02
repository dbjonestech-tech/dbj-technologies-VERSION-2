"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { recordChange } from "@/lib/canopy/audit";
import type { SavedSegment, SegmentEntity, SegmentFilterConfig } from "@/lib/canopy/segments";

export type SegmentActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireAdmin(): Promise<{ email: string }> {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.email) {
    throw new Error("Unauthorized");
  }
  return { email: session.user.email };
}

export async function saveSegmentAction(input: {
  entityType: SegmentEntity;
  name: string;
  filterConfig: SegmentFilterConfig;
  isShared?: boolean;
  id?: number;
}): Promise<SegmentActionResult<SavedSegment>> {
  try {
    const admin = await requireAdmin();
    const name = input.name?.trim();
    if (!name) return { ok: false, error: "Name is required" };
    if (!["contact", "deal"].includes(input.entityType)) {
      return { ok: false, error: "Invalid entity type" };
    }

    const sql = getDb();
    let id: number;
    if (input.id) {
      await sql`
        UPDATE saved_segments
        SET name = ${name},
            filter_config = ${JSON.stringify(input.filterConfig)}::jsonb,
            is_shared = ${input.isShared ?? false},
            updated_at = NOW()
        WHERE id = ${input.id}
      `;
      id = input.id;
    } else {
      const rows = (await sql`
        INSERT INTO saved_segments (owner_email, entity_type, name, filter_config, is_shared)
        VALUES (
          ${admin.email},
          ${input.entityType},
          ${name},
          ${JSON.stringify(input.filterConfig)}::jsonb,
          ${input.isShared ?? false}
        )
        RETURNING id
      `) as Array<{ id: number }>;
      id = rows[0]?.id ?? 0;
      if (!id) return { ok: false, error: "Insert failed" };
    }

    const loaded = (await sql`
      SELECT id, owner_user_id, owner_email, entity_type, name, filter_config, is_shared, created_at, updated_at
      FROM saved_segments WHERE id = ${id} LIMIT 1
    `) as SavedSegment[];
    const seg = loaded[0];
    if (!seg) return { ok: false, error: "Could not reload segment" };

    await recordChange({
      entityType: "saved_segment",
      entityId: String(id),
      action: input.id ? "segment.update" : "segment.create",
      after: { name, entity_type: input.entityType, filter_config: input.filterConfig },
    });
    revalidatePath("/admin/contacts");
    revalidatePath("/admin/deals");
    return { ok: true, data: seg };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteSegmentAction(id: number): Promise<SegmentActionResult> {
  try {
    await requireAdmin();
    const sql = getDb();
    await sql`DELETE FROM saved_segments WHERE id = ${id}`;
    await recordChange({
      entityType: "saved_segment",
      entityId: String(id),
      action: "segment.delete",
    });
    revalidatePath("/admin/contacts");
    revalidatePath("/admin/deals");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
