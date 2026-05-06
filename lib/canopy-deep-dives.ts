/* ─── CANOPY DEEP DIVES (Layer 3) ──────────────────────
 *
 * Layer 3 of the Canopy work-page funnel. Each entry here renders as a
 * dedicated page at /work/canopy/{slug} and activates the
 * "Read the full architecture of {heading} ->" link inside the matching
 * ProjectSection's Layer 2 toggle on /work/canopy.
 *
 * To activate a Phase 3 deep-dive page:
 *   1. Add an entry to CANOPY_DEEP_DIVES below with the body drafted
 *      against an architectural anchor (Phase 3 scope: ~1,500 to 3,000
 *      words per page, draft-in-chat per page).
 *   2. Set ProjectSection.deepDivePageSlug on the matching section in
 *      lib/work-data.ts to the same slug. The Layer 2 panel then renders
 *      a "Read the full architecture of {heading} ->" link pointing here.
 *
 * Slug naming: kebab-case, no leading slash. Should match the
 * ProjectSection heading semantically (e.g. "analytics", "pipeline",
 * "automation", "operations", "pathlight", "architecture"). The slug
 * drives the URL, the canonical, and the sitemap entry, so once
 * published it is effectively permanent for SEO.
 *
 * The registry is intentionally empty until each deep-dive body is
 * drafted. The dynamic route at app/(marketing)/work/canopy/[slug]/
 * page.tsx returns notFound() for any unrecognized slug, so an empty
 * registry produces zero live URLs at this path.
 */

export interface CanopyDeepDive {
  /** URL slug under /work/canopy/. Kebab-case, no leading slash. */
  slug: string;
  /** Page heading. Mirrors the matching ProjectSection heading on
   * /work/canopy so the buyer's "Read the full architecture of X" click
   * lands on a page titled X. */
  heading: string;
  /** Two-or-three sentence summary used as the page's hero subheading
   * and as the meta description. Should orient the reader to what they
   * will read at depth. */
  summary: string;
  /** Long-form architectural narrative. Roughly 1,500 to 3,000 words.
   * Uses blank-line paragraph breaks; the layout renders the string with
   * whitespace-pre-line so source blank lines become real paragraph
   * spacing. */
  body: string;
}

export const CANOPY_DEEP_DIVES: CanopyDeepDive[] = [];

export function getCanopyDeepDive(slug: string): CanopyDeepDive | undefined {
  return CANOPY_DEEP_DIVES.find((p) => p.slug === slug);
}

export function getCanopyDeepDiveSlugs(): string[] {
  return CANOPY_DEEP_DIVES.map((p) => p.slug);
}
