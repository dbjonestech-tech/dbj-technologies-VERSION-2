"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { recordChange } from "@/lib/canopy/audit";
import { canonicalizeTag } from "@/lib/canopy/tags";

export type TagActionResult =
  | { ok: true; tags: string[] }
  | { ok: false; error: string };

async function requireAdmin(): Promise<{ email: string }> {
  const session = await auth();
  if (!session?.user?.isAdmin || !session.user.email) {
    throw new Error("Unauthorized");
  }
  return { email: session.user.email };
}

const REVALIDATE_PATHS = [
  "/admin",
  "/admin/contacts",
  "/admin/deals",
  "/admin/relationships/pipeline",
] as const;
function revalidateAll(): void {
  for (const p of REVALIDATE_PATHS) revalidatePath(p);
}

export async function addTagAction(input: {
  entityType: "contact" | "deal";
  entityId: number;
  tag: string;
}): Promise<TagActionResult> {
  try {
    await requireAdmin();
    const tag = canonicalizeTag(input.tag);
    if (!tag) return { ok: false, error: "Tag cannot be empty" };
    const sql = getDb();
    const rows =
      input.entityType === "contact"
        ? ((await sql`
            UPDATE contacts
            SET tags = (
              SELECT ARRAY(SELECT DISTINCT unnest(tags || ARRAY[${tag}]::TEXT[]))
            ),
            updated_at = NOW()
            WHERE id = ${input.entityId}
            RETURNING tags
          `) as Array<{ tags: string[] }>)
        : ((await sql`
            UPDATE deals
            SET tags = (
              SELECT ARRAY(SELECT DISTINCT unnest(tags || ARRAY[${tag}]::TEXT[]))
            ),
            updated_at = NOW()
            WHERE id = ${input.entityId}
            RETURNING tags
          `) as Array<{ tags: string[] }>);
    const next = rows[0]?.tags ?? [];
    await recordChange({
      entityType: input.entityType,
      entityId: String(input.entityId),
      action: "tag.add",
      after: { tag },
    });
    revalidateAll();
    return { ok: true, tags: next };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function removeTagAction(input: {
  entityType: "contact" | "deal";
  entityId: number;
  tag: string;
}): Promise<TagActionResult> {
  try {
    await requireAdmin();
    const tag = canonicalizeTag(input.tag);
    if (!tag) return { ok: false, error: "Tag cannot be empty" };
    const sql = getDb();
    const rows =
      input.entityType === "contact"
        ? ((await sql`
            UPDATE contacts
            SET tags = array_remove(tags, ${tag}),
                updated_at = NOW()
            WHERE id = ${input.entityId}
            RETURNING tags
          `) as Array<{ tags: string[] }>)
        : ((await sql`
            UPDATE deals
            SET tags = array_remove(tags, ${tag}),
                updated_at = NOW()
            WHERE id = ${input.entityId}
            RETURNING tags
          `) as Array<{ tags: string[] }>);
    const next = rows[0]?.tags ?? [];
    await recordChange({
      entityType: input.entityType,
      entityId: String(input.entityId),
      action: "tag.remove",
      before: { tag },
    });
    revalidateAll();
    return { ok: true, tags: next };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
