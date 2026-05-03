"use server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { getSessionRole, getQueryOwnerFilter } from "@/lib/canopy/rbac";

/* Server action backing the ⌘K command palette's record search.
 *
 * Returns up to 5 contacts + 5 deals matching the query string. The
 * palette debounces the call (250ms) so we stay cheap. Both queries
 * respect the sales-role owner filter so a non-admin sales user
 * cannot jump to records outside their book. Admins see everything.
 *
 * Intentionally narrow column set: id + display label + subtitle +
 * href is everything the palette renders. Anything richer should
 * happen on the destination page. */

export interface CmdkSearchResult {
  id: string;
  kind: "contact" | "deal";
  label: string;
  sublabel: string;
  href: string;
}

const MAX_PER_KIND = 5;
const MIN_QUERY_LEN = 2;

export async function searchCommandPalette(query: string): Promise<{
  results: CmdkSearchResult[];
}> {
  const session = await auth();
  if (!session?.user?.isAdmin) return { results: [] };

  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < MIN_QUERY_LEN) return { results: [] };

  const sql = getDb();
  const sr = await getSessionRole();
  const ownerFilter = getQueryOwnerFilter(sr);
  const pattern = `%${trimmed.replace(/[%_\\]/g, "\\$&")}%`;

  const prefixPattern = `${trimmed}%`;

  try {
    const [contactRows, dealRows] = await Promise.all([
      sql`
        SELECT c.id, c.email, c.name, c.company
        FROM contacts c
        WHERE
          (${ownerFilter}::text IS NULL OR c.owner_email = ${ownerFilter}::text)
          AND (
            c.email   ILIKE ${pattern}::text OR
            c.name    ILIKE ${pattern}::text OR
            c.company ILIKE ${pattern}::text
          )
        ORDER BY
          CASE
            WHEN LOWER(c.name)    LIKE ${prefixPattern}::text THEN 0
            WHEN LOWER(c.email)   LIKE ${prefixPattern}::text THEN 1
            WHEN LOWER(c.company) LIKE ${prefixPattern}::text THEN 2
            ELSE 3
          END,
          COALESCE(c.last_activity_at, c.created_at) DESC
        LIMIT ${MAX_PER_KIND}
      `,
      sql`
        SELECT d.id, d.name, d.stage, d.closed_at, c.name AS contact_name, c.company AS contact_company
        FROM deals d
        LEFT JOIN contacts c ON c.id = d.contact_id
        WHERE
          (${ownerFilter}::text IS NULL OR d.owner_email = ${ownerFilter}::text)
          AND (
            d.name      ILIKE ${pattern}::text OR
            c.name      ILIKE ${pattern}::text OR
            c.company   ILIKE ${pattern}::text
          )
        ORDER BY
          CASE WHEN d.closed_at IS NULL THEN 0 ELSE 1 END,
          CASE
            WHEN LOWER(d.name) LIKE ${prefixPattern}::text THEN 0
            ELSE 1
          END,
          d.updated_at DESC
        LIMIT ${MAX_PER_KIND}
      `,
    ]);
    const contactsTyped = contactRows as Array<{
      id: number;
      email: string;
      name: string | null;
      company: string | null;
    }>;
    const dealsTyped = dealRows as Array<{
      id: number;
      name: string;
      stage: string;
      closed_at: string | null;
      contact_name: string | null;
      contact_company: string | null;
    }>;

    const results: CmdkSearchResult[] = [];
    for (const c of contactsTyped) {
      const label = c.name?.trim() || c.email;
      const subParts = [c.company, c.name ? c.email : null].filter(
        (s): s is string => Boolean(s)
      );
      results.push({
        id: `contact:${c.id}`,
        kind: "contact",
        label,
        sublabel: subParts.length > 0 ? subParts.join(" · ") : "Contact",
        href: `/admin/contacts/${c.id}`,
      });
    }
    for (const d of dealsTyped) {
      const subParts = [
        d.closed_at ? "Closed" : d.stage,
        d.contact_name || d.contact_company,
      ].filter((s): s is string => Boolean(s));
      results.push({
        id: `deal:${d.id}`,
        kind: "deal",
        label: d.name,
        sublabel: subParts.join(" · ") || "Deal",
        href: `/admin/deals/${d.id}`,
      });
    }
    return { results };
  } catch (err) {
    console.warn(
      `[cmdk] searchCommandPalette failed: ${err instanceof Error ? err.message : err}`
    );
    return { results: [] };
  }
}
