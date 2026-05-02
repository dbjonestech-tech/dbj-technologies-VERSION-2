import { getDb } from "@/lib/db";

export interface EntityExtras {
  tags: string[];
  custom_fields: Record<string, unknown>;
}

const FALLBACK: EntityExtras = { tags: [], custom_fields: {} };

/* Single-row read for tags + custom_fields. The contacts and deals
 * services do not include these columns by default to keep their
 * existing types stable; detail pages call this helper alongside. */
export async function getEntityExtras(
  entityType: "contact" | "deal",
  entityId: number
): Promise<EntityExtras> {
  try {
    const sql = getDb();
    if (entityType === "contact") {
      const rows = (await sql`SELECT tags, custom_fields FROM contacts WHERE id = ${entityId} LIMIT 1`) as EntityExtras[];
      return rows[0] ?? FALLBACK;
    }
    const rows = (await sql`SELECT tags, custom_fields FROM deals WHERE id = ${entityId} LIMIT 1`) as EntityExtras[];
    return rows[0] ?? FALLBACK;
  } catch {
    return FALLBACK;
  }
}
