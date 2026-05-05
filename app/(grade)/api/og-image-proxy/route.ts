import { NextResponse } from "next/server";
import { getFullScanReport } from "@/lib/db/queries";
import { extractIp, proxyImageLimiter } from "@/lib/rate-limit";

/**
 * GET /api/og-image-proxy?scanId=<uuid>&url=<encoded>
 *
 * Server-side image proxy for the OG preview card on the report page.
 *
 * Rationale: many sites (Wix, Showit, Squarespace) hotlink-protect
 * their OG images. When the report page on dbjtechnologies.com tries
 * to <img src="https://wix.com/.../share.jpg">, the CDN sees a foreign
 * Referer and refuses, leaving the preview card with a broken image.
 * The visitor, looking at our report, mistakenly concludes Pathlight
 * is producing a defective preview when in fact the underlying meta
 * tag is valid and would render fine on Facebook (which has a real
 * scraper user agent and bypass).
 *
 * This endpoint refetches the image from our server with:
 *   - a realistic browser User-Agent
 *   - a Referer header pointing to the originally-scanned site
 *   - bounded timeout, size cap, content-type validation
 * Then streams the bytes back with public Cache-Control so Vercel's
 * edge cache absorbs repeated views.
 *
 * Security posture:
 *   - Bound to a known scan: ?url= must match og_preview.meta.image
 *     or og_preview.meta.twitterImage for the given scanId. Open
 *     proxies can be abused for SSRF, content-laundering, and
 *     bandwidth amplification; binding to a scan keeps the surface
 *     minimal.
 *   - SSRF defenses on top: only http/https, reject loopback /
 *     private / link-local IP literals in the hostname.
 *   - 4MB response cap (well above any plausible OG image; the spec
 *     recommends 1200x630 ~ a few hundred KB).
 *   - 8s timeout.
 *   - Per-IP rate limit (200/24h) as defense-in-depth.
 */

const FETCH_TIMEOUT_MS = 8_000;
const MAX_BYTES = 4 * 1024 * 1024; // 4MB
const REALISTIC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const TRANSPARENT_PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=",
  "base64",
);

function placeholderResponse(reason: string, status = 404): Response {
  return new Response(new Uint8Array(TRANSPARENT_PNG_BYTES), {
    status,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300",
      "X-Pathlight-Proxy": `placeholder:${reason}`,
    },
  });
}

const PRIVATE_IP_HOSTNAME_PATTERNS: ReadonlyArray<RegExp> = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^::1$/,
  /^\[::1\]$/i,
  /^fe80:/i,
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
];

function isPrivateOrLoopbackHost(hostname: string): boolean {
  if (!hostname) return true;
  const lower = hostname.toLowerCase();
  for (const re of PRIVATE_IP_HOSTNAME_PATTERNS) {
    if (re.test(lower)) return true;
  }
  /* Reject obvious bare-host names with no TLD (e.g. internal DNS).
   * Still allow things like raw.githubusercontent.com (has a dot). */
  if (!lower.includes(".")) return true;
  return false;
}

function parseAndValidateUrl(value: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }
  if (isPrivateOrLoopbackHost(parsed.hostname)) {
    return null;
  }
  return parsed;
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const scanId = (searchParams.get("scanId") ?? "").trim();
  const requestedUrl = (searchParams.get("url") ?? "").trim();

  if (!scanId || !requestedUrl) {
    return placeholderResponse("missing-params", 400);
  }

  /* UUID shape check before any DB or external work. */
  const uuidShape =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidShape.test(scanId)) {
    return placeholderResponse("bad-scan-id", 400);
  }

  const target = parseAndValidateUrl(requestedUrl);
  if (!target) {
    return placeholderResponse("bad-url", 400);
  }

  const ipCheck = await proxyImageLimiter(extractIp(request));
  if (!ipCheck.success) {
    return placeholderResponse("rate-limited", 429);
  }

  /* Bind ?url= to the scan's og_preview. Either og:image or
   * twitter:image qualifies; both are populated by the o1 step from
   * the scanned page's own <head>. Anything else returns the
   * placeholder so the proxy cannot be turned into a general fetcher. */
  const report = await getFullScanReport(scanId);
  if (!report) {
    return placeholderResponse("scan-not-found");
  }
  const ogImage = report.ogPreview?.meta.image ?? null;
  const twitterImage = report.ogPreview?.meta.twitterImage ?? null;
  const allowed = new Set<string>();
  if (ogImage) allowed.add(ogImage);
  if (twitterImage) allowed.add(twitterImage);
  if (!allowed.has(target.toString())) {
    return placeholderResponse("url-not-bound-to-scan");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const scannedSiteRef = report.resolvedUrl ?? report.url;
  /* Capture the validated URL into a local const so the type is
   * narrowed inside the fetchOnce closure (TS does not propagate the
   * earlier null-guard into the closure body). */
  const targetUrl = target.toString();

  /* Some CDNs (Webflow's website-files.com is the case that drove this)
   * happily serve images to a same-site Referer but reject anything else,
   * while OTHER CDNs apply the inverse rule and reject when Referer is
   * present. We try Referer-set first because hotlink-protected images
   * are the more common case among small-business sites Pathlight
   * scans, then fall back to no-Referer if the first attempt returns a
   * 4xx. The status-code gate keeps us from retrying server-error
   * responses, which would only burn time. */
  async function fetchOnce(includeReferer: boolean): Promise<Response> {
    const headers: Record<string, string> = {
      "user-agent": REALISTIC_UA,
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
    };
    if (includeReferer) headers.referer = scannedSiteRef;
    return fetch(targetUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers,
    });
  }

  let upstream: Response;
  let attemptDescription = "with-referer";
  try {
    upstream = await fetchOnce(true);
    if (!upstream.ok && upstream.status >= 400 && upstream.status < 500) {
      attemptDescription = "fallback-no-referer";
      try {
        upstream = await fetchOnce(false);
      } catch (retryErr) {
        void retryErr;
        /* Keep the original 4xx response if the fallback throws. */
      }
    }
  } catch (err) {
    void err;
    clearTimeout(timer);
    return placeholderResponse("upstream-failed", 502);
  }
  clearTimeout(timer);

  if (!upstream.ok) {
    return placeholderResponse(
      `upstream-status-${upstream.status}-${attemptDescription}`,
      502,
    );
  }
  const ct = (upstream.headers.get("content-type") ?? "").toLowerCase();
  /* Reject only when the upstream is clearly serving NON-image bytes
   * (HTML error page, JSON, etc.). Empty content-type and odd values
   * like application/octet-stream are passed through; the browser
   * sniffs the bytes from the `<img>` tag, and rejecting them here
   * would cause false-positive proxy failures on CDNs that omit the
   * header entirely. */
  if (
    ct.startsWith("text/html") ||
    ct.startsWith("text/plain") ||
    ct.startsWith("application/json") ||
    ct.startsWith("application/xml")
  ) {
    return placeholderResponse(`non-image-content-type-${ct}`, 502);
  }
  const declaredLen = parseInt(
    upstream.headers.get("content-length") ?? "",
    10,
  );
  if (Number.isFinite(declaredLen) && declaredLen > MAX_BYTES) {
    return placeholderResponse("too-large", 413);
  }

  /* Read the body with a hard size cap. Bail if the upstream lied
   * about content-length (or omitted it) and tries to flood us. */
  const reader = upstream.body?.getReader();
  if (!reader) {
    return placeholderResponse("no-body", 502);
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      return placeholderResponse("too-large", 413);
    }
    chunks.push(value);
  }
  const body = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  const finalContentType = ct || "image/jpeg";

  return new Response(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": finalContentType,
      "Content-Length": body.byteLength.toString(),
      /* Aggressive edge cache: the underlying scan's og_preview row
       * is immutable for the life of the scan. Different scans get
       * different ?scanId= so cache keying naturally segments them. */
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      "X-Pathlight-Proxy": `ok:${attemptDescription}`,
    },
  });
}
