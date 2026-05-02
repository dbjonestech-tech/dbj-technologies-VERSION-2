/* Utilities for normalizing tag input. Tags are stored lowercased,
 * trimmed, dash-joined for multi-word forms. Operators type "Hot Lead"
 * and we store "hot-lead" so case mismatches and whitespace drift do
 * not fragment the tag set. */
export function canonicalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function canonicalizeTags(raws: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of raws) {
    const c = canonicalizeTag(raw);
    if (!c) continue;
    if (seen.has(c)) continue;
    seen.add(c);
    out.push(c);
  }
  return out;
}
