import type {
  CaptureCaveat,
  DesignScores,
  OgPreviewResult,
  ScreenshotPair,
} from "@/lib/types/scan";
import { detectHeroVideo } from "./claude-analysis";

/**
 * Capture-confidence detection.
 *
 * Pure functions plus a single network call (the og:image fetch probe).
 * Composed by the cv1 inngest step after o1 completes.
 *
 * Failure-mode posture: every detector swallows its own errors and
 * returns null on uncertainty. The composer never throws. Empty array
 * is the success case; the report's top-of-report notice is hidden
 * when no caveats fire.
 *
 * Tone of the user-facing strings: confident, concrete, professional.
 * Pathlight is not apologizing. It is naming a real boundary between
 * what it can and cannot verify, so the prospect reads the rest of the
 * report with appropriate calibration. Never mentions models, scanner
 * internals, or vendor names.
 */

const OG_IMAGE_FETCH_TIMEOUT_MS = 4_000;
const OG_IMAGE_FETCH_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

/* Heuristic: photography_quality below this score on a page that has
 * an autoplay <video> element is the strongest signal we have that
 * the headless capture missed the video. Real visitors see imagery;
 * the model only sees the dark hero card on its background, which
 * legitimately scores low on photography_quality even when the design
 * itself is sound. */
const HERO_DARK_PHOTO_SCORE_THRESHOLD = 5;

export interface CaptureCaveatInput {
  htmlSnapshot: string | null;
  designScores: DesignScores | null;
  ogPreview: OgPreviewResult | null;
  screenshots: ScreenshotPair | null;
}

/**
 * Probe whether the og:image URL is reachable using the same fetch
 * behavior the runtime proxy at /api/og-image-proxy will use. The
 * probe and the proxy MUST agree: anything the probe sees succeed
 * has to render in the OG card, anything the probe sees fail has to
 * fail in the card too. If they disagree the user reads a caveat
 * that contradicts what they see on the page.
 *
 * Implementation: GET with Range bytes=0-1023 instead of HEAD. Many
 * CDNs (Webflow's website-files.com, some Cloudflare configs)
 * reject HEAD with a 4xx even when they happily serve a normal GET.
 * Range keeps the payload tiny so this never reads more than ~1KB.
 *
 * Three-state return:
 *   true:  verifiably reachable (proxy will succeed)
 *   false: definitively gone (404/410, or text/html error page).
 *          This is the only path that fires the caveat.
 *   null:  inconclusive (5xx, network error, timeout, 4xx other
 *          than 404/410). Do NOT fire the caveat: we don't want
 *          transient or ambiguous probe results to defame the
 *          prospect's site.
 */
export async function probeOgImageReachable(
  imageUrl: string,
  scannedSiteUrl: string,
): Promise<boolean | null> {
  if (!isLikelyHttpUrl(imageUrl)) return null;
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    OG_IMAGE_FETCH_TIMEOUT_MS,
  );
  try {
    const res = await fetchOgImagePeek(imageUrl, scannedSiteUrl, controller);
    return classifyProbeResponse(res);
  } catch (err) {
    /* AbortError + network errors are inconclusive. */
    void err;
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOgImagePeek(
  imageUrl: string,
  scannedSiteUrl: string,
  controller: AbortController,
): Promise<Response> {
  return fetch(imageUrl, {
    method: "GET",
    redirect: "follow",
    signal: controller.signal,
    headers: {
      "user-agent": OG_IMAGE_FETCH_USER_AGENT,
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
      referer: scannedSiteUrl,
      range: "bytes=0-1023",
    },
  });
}

function classifyProbeResponse(res: Response): boolean | null {
  const ct = (res.headers.get("content-type") ?? "").toLowerCase();

  /* 200 / 206 (partial) / 304: image is reachable. Empty CT and
   * image/* both pass; text/html on a 200 is the rare "CDN returned
   * an error page with a 200 status" case and counts as definitively
   * not-an-image. */
  if (res.status === 200 || res.status === 206 || res.status === 304) {
    if (ct.startsWith("text/html")) return false;
    return true;
  }

  /* 416 (range not satisfiable) is rare but means the resource is
   * served and our Range header was the issue, not the URL. Treat
   * as inconclusive so we do not fire the caveat. */
  if (res.status === 416) return null;

  /* Definitively gone. Fire the caveat. */
  if (res.status === 404 || res.status === 410) return false;

  /* Everything else (401, 403, 405, 429, 5xx, other 4xx) is
   * inconclusive. The proxy may still succeed for other reasons
   * (different IP, retry without Referer), and we never want to
   * fire a caveat against an ambiguous signal. */
  return null;
}

function isLikelyHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Compose the caveat list for a scan. Order is intentional: the
 * notice renders these in the order they appear, so the most
 * load-bearing ("hero video") goes first.
 */
export async function computeCaptureCaveats(
  input: CaptureCaveatInput,
  scannedSiteUrl: string,
): Promise<CaptureCaveat[]> {
  const out: CaptureCaveat[] = [];

  /* 1. Hero video that real visitors see, but our capture missed. We
   * only fire this when the screenshot evidence (low
   * photography_quality) is consistent with a missed-video frame, NOT
   * just because <video autoplay> appeared in the HTML. Many sites
   * embed a video that genuinely never plays, and we don't want to
   * defend a real defect. */
  const heroHasVideo = detectHeroVideo(input.htmlSnapshot);
  const photoScore = input.designScores?.photography_quality?.score;
  if (
    heroHasVideo &&
    typeof photoScore === "number" &&
    photoScore <= HERO_DARK_PHOTO_SCORE_THRESHOLD
  ) {
    out.push({
      kind: "hero-video-may-render-for-visitors",
      severity: "informational",
      detail:
        "Your homepage uses an autoplay background video in the hero. The screenshot above captured a frame where the video had not yet started playing for our automated scanner, so the hero looks darker than it does for real visitors. Read any score or observation about hero imagery, photography, or empty space with that in mind.",
    });
  }

  /* 2. Mobile screenshot missing while desktop succeeded. Often a
   * transient browserless rate limit or CDN block on one viewport.
   * Real visitors on mobile see the page; we just didn't on this
   * scan. */
  if (input.screenshots) {
    const desktopOk = !!input.screenshots.desktop;
    const mobileMissing = !input.screenshots.mobile;
    if (desktopOk && mobileMissing) {
      out.push({
        kind: "mobile-capture-degraded",
        severity: "uncertainty",
        detail:
          "Our automated mobile capture did not complete on this run. Mobile-specific observations below fall back to the desktop screenshot plus performance signals; they should be read as conservative rather than definitive.",
      });
    }
  }

  /* 3. og:image set but blocked when fetched without a real-user
   * cookie / session. Inconclusive probe results do NOT fire this
   * caveat. */
  const ogImage = input.ogPreview?.meta.image;
  if (ogImage) {
    const reachable = await probeOgImageReachable(ogImage, scannedSiteUrl);
    if (reachable === false) {
      out.push({
        kind: "og-image-blocked-from-render",
        severity: "informational",
        detail:
          "Your social-share image is set in the page metadata but did not load when fetched outside your site's session. Some hosts hotlink-protect images, which can cause Facebook, LinkedIn, or Slack to render share cards without the preview image. Confirm the image URL is publicly reachable from a fresh browser tab in incognito mode.",
      });
    }
  }

  return out;
}
