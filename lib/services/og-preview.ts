import type {
  OgPreviewMeta,
  OgPreviewProblem,
  OgPreviewResult,
} from "@/lib/types/scan";

/**
 * Stage 3a social-share preview extractor.
 *
 * Pure HTML parser. No AI call, no external network, no schema validation
 * cost. Reads the captured html_snapshot.html (truncated at 256KB by the
 * Browserless step) and pulls out:
 *
 *   - Open Graph metadata: og:title, og:description, og:image, og:url,
 *     og:site_name, og:image:alt
 *   - Twitter card metadata: twitter:card, twitter:title,
 *     twitter:description, twitter:image
 *   - The <title> and meta description as fallbacks
 *   - The <link rel="canonical"> URL
 *
 * Then runs a list of structural checks and returns severity-tagged
 * problems the owner can fix today (every detected problem maps to a
 * single edit to the page <head>).
 *
 * Failure-mode posture mirrors Stage 1 / Stage 2: any unexpected input
 * returns a result with empty meta and zero problems rather than throwing.
 * The pipeline gate in lib/inngest/functions.ts (`o1` step) skips this
 * step entirely when html_snapshot is null, so this function only sees
 * real captured HTML.
 */

const META_TAG_RE = /<meta\b[^>]*?>/gi;
const TITLE_RE = /<title\b[^>]*>([\s\S]*?)<\/title>/i;
const CANONICAL_LINK_RE =
  /<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i;
const HREF_RE = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i;
const ATTR_RE = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function parseMetaTag(tag: string): {
  key: string | null;
  content: string | null;
} {
  let property: string | null = null;
  let name: string | null = null;
  let content: string | null = null;
  ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ATTR_RE.exec(tag))) {
    const attr = m[1].toLowerCase();
    const val = m[2] ?? m[3] ?? "";
    if (attr === "property") property = val.toLowerCase();
    else if (attr === "name") name = val.toLowerCase();
    else if (attr === "content") content = val;
  }
  return { key: property ?? name, content };
}

function extractTitle(html: string): string | null {
  const m = TITLE_RE.exec(html);
  if (!m) return null;
  const trimmed = decodeHtmlEntities(m[1]).replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractCanonical(html: string): string | null {
  const linkMatch = CANONICAL_LINK_RE.exec(html);
  if (!linkMatch) return null;
  const hrefMatch = HREF_RE.exec(linkMatch[0]);
  if (!hrefMatch) return null;
  return hrefMatch[1] ?? hrefMatch[2] ?? null;
}

function resolveUrl(value: string, base: string): string {
  try {
    return new URL(value, base).toString();
  } catch {
    return value;
  }
}

export function extractOgPreview(
  html: string,
  scannedUrl: string,
): OgPreviewResult {
  const meta: OgPreviewMeta = {
    title: null,
    description: null,
    image: null,
    imageAlt: null,
    url: null,
    siteName: null,
    twitterCard: null,
    twitterTitle: null,
    twitterDescription: null,
    twitterImage: null,
  };
  let pageDescription: string | null = null;

  const tagMatches = html.match(META_TAG_RE);
  if (tagMatches) {
    for (const tag of tagMatches) {
      const { key, content } = parseMetaTag(tag);
      if (!key || !content) continue;
      const value = decodeHtmlEntities(content).trim();
      if (value.length === 0) continue;
      switch (key) {
        case "og:title":
          meta.title = value;
          break;
        case "og:description":
          meta.description = value;
          break;
        case "og:image":
        case "og:image:url":
        case "og:image:secure_url":
          if (!meta.image) meta.image = resolveUrl(value, scannedUrl);
          break;
        case "og:image:alt":
          meta.imageAlt = value;
          break;
        case "og:url":
          meta.url = resolveUrl(value, scannedUrl);
          break;
        case "og:site_name":
          meta.siteName = value;
          break;
        case "twitter:card":
          meta.twitterCard = value.toLowerCase();
          break;
        case "twitter:title":
          meta.twitterTitle = value;
          break;
        case "twitter:description":
          meta.twitterDescription = value;
          break;
        case "twitter:image":
        case "twitter:image:src":
          if (!meta.twitterImage) {
            meta.twitterImage = resolveUrl(value, scannedUrl);
          }
          break;
        case "description":
          if (!pageDescription) pageDescription = value;
          break;
      }
    }
  }

  const pageTitle = extractTitle(html);
  const canonicalUrl = extractCanonical(html);
  if (!meta.url && canonicalUrl) {
    meta.url = resolveUrl(canonicalUrl, scannedUrl);
  }

  const problems: OgPreviewProblem[] = [];

  if (!meta.image) {
    problems.push({
      severity: "medium",
      title: "No social share image",
      detail:
        "Without an og:image tag, posts of your link on LinkedIn and Facebook render as a small text-only card (LinkedIn shows just the title and URL, Facebook varies). Slack shows a richer fallback with the title and description. Adding a 1200x630 share image makes the card visually richer and more clickable in any feed. Add a <meta property=\"og:image\" content=\"https://yoursite.com/share-image.jpg\"> tag in the page <head>.",
    });
  }

  if (!meta.title && !pageTitle) {
    problems.push({
      severity: "high",
      title: "No share title",
      detail:
        "Neither og:title nor a <title> tag is present, so social platforms have nothing to show as the headline of your share card. Add a <meta property=\"og:title\" content=\"...\"> with a 50-60 character headline written for the share context.",
    });
  } else if (!meta.title) {
    problems.push({
      severity: "medium",
      title: "No og:title",
      detail:
        "Social platforms fall back to the page <title> when og:title is missing. The fallback often reads as a search result rather than a share headline. Add a dedicated og:title tuned for social context.",
    });
  }

  if (!meta.description && !pageDescription) {
    problems.push({
      severity: "high",
      title: "No share description",
      detail:
        "Neither og:description nor a meta description is set. Social cards render with no snippet under the title, which lowers click-through. Add a <meta property=\"og:description\" content=\"...\"> with a 1-2 sentence summary written for the share context.",
    });
  } else if (!meta.description) {
    problems.push({
      severity: "medium",
      title: "No og:description",
      detail:
        "Only the meta description is set. Social platforms use og:description as the snippet under the title; without it they fall back to the meta description, which is usually written for search engines, not social feeds.",
    });
  }

  if (!meta.twitterCard) {
    problems.push({
      severity: "medium",
      title: "No twitter:card tag",
      detail:
        'Twitter and X default to a small "summary" card without a large image when twitter:card is missing. Set <meta name="twitter:card" content="summary_large_image"> so shared links render with the prominent image preview.',
    });
  } else if (
    meta.twitterCard !== "summary_large_image" &&
    meta.twitterCard !== "player" &&
    meta.twitterCard !== "app"
  ) {
    problems.push({
      severity: "low",
      title: "Twitter card is the small summary variant",
      detail:
        'Your twitter:card is set to "' +
        meta.twitterCard +
        '". The "summary_large_image" variant renders a much more prominent preview when shared on Twitter or X and almost always converts better.',
    });
  }

  if (!meta.url && !canonicalUrl) {
    problems.push({
      severity: "low",
      title: "No og:url or canonical link",
      detail:
        "Without an explicit og:url and no <link rel=\"canonical\">, share previews can fragment when visitors share URLs with tracking parameters (utm_source, fbclid, etc). Set og:url to the canonical homepage URL so all shares aggregate into one preview.",
    });
  }

  if (!meta.imageAlt && meta.image) {
    problems.push({
      severity: "low",
      title: "No og:image:alt",
      detail:
        "Your share image has no alt text. Adding <meta property=\"og:image:alt\" content=\"...\"> with a short description improves accessibility on platforms that read share cards aloud.",
    });
  }

  return { meta, pageTitle, pageDescription, problems };
}
