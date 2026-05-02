import { getDb } from "@/lib/db";

export type SegmentEntity = "contact" | "deal";

export interface SavedSegment {
  id: number;
  owner_user_id: string | null;
  owner_email: string | null;
  entity_type: SegmentEntity;
  name: string;
  filter_config: SegmentFilterConfig;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

/* Filter shape v1: simple flat predicates the contacts/deals list
 * pages can read directly. Phase 5 (sequences/automation) extends
 * this with a richer compiler. */
export interface SegmentFilterConfig {
  search?: string;
  status?: string;
  source?: string;
  tags_any?: string[];
  tags_all?: string[];
  custom_fields?: Record<string, string>;
}

export async function getSavedSegments(
  entityType: SegmentEntity,
  ownerEmail: string | null
): Promise<SavedSegment[]> {
  try {
    const sql = getDb();
    const rows = ownerEmail
      ? ((await sql`
          SELECT id, owner_user_id, owner_email, entity_type, name,
                 filter_config, is_shared, created_at, updated_at
          FROM saved_segments
          WHERE entity_type = ${entityType}
            AND (owner_email = ${ownerEmail} OR is_shared = TRUE)
          ORDER BY name
        `) as SavedSegment[])
      : ((await sql`
          SELECT id, owner_user_id, owner_email, entity_type, name,
                 filter_config, is_shared, created_at, updated_at
          FROM saved_segments
          WHERE entity_type = ${entityType} AND is_shared = TRUE
          ORDER BY name
        `) as SavedSegment[]);
    return rows;
  } catch {
    return [];
  }
}

/* URL-encode a filter config for the contacts/deals list page. The
 * page reads each known key from URL params; saving a segment captures
 * that same encoding. */
export function filterConfigToSearchParams(filter: SegmentFilterConfig): URLSearchParams {
  const p = new URLSearchParams();
  if (filter.search) p.set("search", filter.search);
  if (filter.status) p.set("status", filter.status);
  if (filter.source) p.set("source", filter.source);
  if (filter.tags_any && filter.tags_any.length > 0) p.set("tags_any", filter.tags_any.join(","));
  if (filter.tags_all && filter.tags_all.length > 0) p.set("tags_all", filter.tags_all.join(","));
  if (filter.custom_fields) {
    for (const [k, v] of Object.entries(filter.custom_fields)) {
      p.set(`cf_${k}`, v);
    }
  }
  return p;
}

export function searchParamsToFilterConfig(
  params: URLSearchParams | Record<string, string | undefined>
): SegmentFilterConfig {
  const get = (k: string): string | null => {
    if (params instanceof URLSearchParams) return params.get(k);
    return params[k] ?? null;
  };
  const all = (k: string): string[] => {
    const v = get(k);
    if (!v) return [];
    return v.split(",").map((s) => s.trim()).filter(Boolean);
  };
  const cf: Record<string, string> = {};
  if (params instanceof URLSearchParams) {
    for (const [k, v] of params.entries()) {
      if (k.startsWith("cf_") && v) cf[k.slice(3)] = v;
    }
  } else {
    for (const [k, v] of Object.entries(params)) {
      if (k.startsWith("cf_") && typeof v === "string" && v) cf[k.slice(3)] = v;
    }
  }
  const filter: SegmentFilterConfig = {};
  const search = get("search");
  if (search) filter.search = search;
  const status = get("status");
  if (status) filter.status = status;
  const source = get("source");
  if (source) filter.source = source;
  const tagsAny = all("tags_any");
  if (tagsAny.length > 0) filter.tags_any = tagsAny;
  const tagsAll = all("tags_all");
  if (tagsAll.length > 0) filter.tags_all = tagsAll;
  if (Object.keys(cf).length > 0) filter.custom_fields = cf;
  return filter;
}
