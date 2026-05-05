import type { FormDescriptor } from "@/lib/types/scan";
import { recordBrowserlessUsage } from "./api-usage";

export type Viewport = { width: number; height: number };

export type { FormDescriptor };

const DEFAULT_BROWSERLESS_BASE = "https://production-sfo.browserless.io";
/* Browserless v2 endpoint prefix selecting the Chrome (proprietary codec)
 * binary instead of the open-source Chromium build. Without this prefix
 * captures route to Chromium, which ships without H.264 / AAC and fails to
 * play MP4 hero videos that work fine in real Chrome. Confirmed by
 * Browserless support: "Switch to Chrome when accessing streaming platforms
 * or targeting sites that explicitly require proprietary codecs." The path
 * prefix is universal across regions. */
const BROWSERLESS_BINARY_PATH = "/chrome";
const SCREENSHOT_TIMEOUT_MS = 55_000;
const SCREENSHOT_RETRY_DELAY_MS = 3_000;
const PDF_TIMEOUT_MS = 60_000;
/* HTML payload cap, mirrors lib/inngest/functions.ts canopyChangeMonitoringDaily
 * which caps captured response bodies at 256KB before hashing. Same cap here so
 * the JSONB column has predictable upper-bound size and the downstream tone /
 * forms / NAP analyses cannot be poisoned by adversarially huge HTML. */
const HTML_TRUNCATE_BYTES = 262_144;
/* Cap on extracted forms per page. Most prospect sites have 1-2; capping at 5
 * avoids pathological pages with 100 hidden marketing forms blowing up the
 * payload or stalling the downstream analysis prompt. */
const MAX_FORMS_EXTRACTED = 5;

/* FormDescriptor is the canonical shape returned by the in-browser DOM
 * walk. Defined in lib/types/scan.ts so both the capture path here and
 * the analysis path in lib/services/forms-audit.ts share one type, and
 * re-exported above so callers can keep importing it from this module. */
export type AtfCaptureResult = {
  screenshot: Buffer;
  html: string | null;
  htmlTruncatedAt: number | null;
  forms: FormDescriptor[];
  strategy: ScreenshotStrategy;
};

// Runs inside Browserless v2 /function (Puppeteer in a managed Chromium).
// Emulating prefers-reduced-motion BEFORE navigation lets sites that respect
// that media query (including dbjtechnologies.com's HeroCinema) skip
// interaction-gated entrance animations so the captured frame shows real
// content instead of a permanent blueprint overlay.
//
// We also block heavy third-party origins (analytics, chat widgets, video
// embeds) at request time. These are the dominant cause of pages never
// hitting networkidle: chat widgets keep persistent connections open, GTM
// fires waves of pixel requests, video players stream metadata. They add
// nothing to the screenshot but block the page from settling.
//
// Strategy is layered:
//   "primary":  networkidle2 with 35s timeout (most sites)
//   "fallback": domcontentloaded with 25s timeout + longer settle (heavy
//                or slow sites that never reach networkidle2 in time)
// captureScreenshot tries primary first, then falls back on failure.
//
// After navigation we try to dismiss any GDPR/CCPA cookie banner by
// matching common accept-button text and aria-labels. If no banner is
// found the click silently no-ops. We then wait for document.fonts.ready
// so type renders before capture, and finally apply a settle window for
// any tail animations.
//
// Stage 2 (May 3 2026): the same function now also returns the page HTML
// (truncated at 256KB) and a DOM-walk descriptor of every <form> on the
// page. Both are best-effort; either failing returns empty rather than
// throwing, so the screenshot path is unchanged in failure modes.
const SCREENSHOT_FUNCTION = `
const BLOCKED_HOSTS = [
  'googletagmanager.com',
  'google-analytics.com',
  'googleadservices.com',
  'doubleclick.net',
  'facebook.net',
  'connect.facebook.net',
  'intercom.io',
  'intercomcdn.com',
  'widget.intercom.io',
  'drift.com',
  'driftcdn.com',
  'js.driftt.com',
  'hotjar.com',
  'static.hotjar.com',
  'fullstory.com',
  'segment.com',
  'segment.io',
  'mixpanel.com',
  'amplitude.com',
  'cdn.amplitude.com',
  'tawk.to',
  'embed.tawk.to',
  'crisp.chat',
  'client.crisp.chat',
  'zdassets.com',
  'static.zdassets.com',
  'zopim.com',
  'static.zopim.com',
  'linkedin.com/li/track',
  'snap.licdn.com',
  'bing.com/api',
  'clarity.ms',
];

export default async function ({ page, context }) {
  const { url, width, height, strategy, htmlTruncateBytes, maxForms } = context;
  const isFallback = strategy === 'fallback';
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" }
  ]);
  if (width <= 768) {
    await page.emulate({
      viewport: { width, height, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
  } else {
    await page.setViewport({ width, height });
    // Set a realistic desktop Chrome User-Agent. The default Browserless
    // Chrome UA contains "HeadlessChrome", which video CDNs (Wix's
    // video.wixstatic.com, Showit's xstatic.com, and similar) sniff for and
    // refuse to serve. Even on the codec-enabled /chrome endpoint, the
    // <video> element fires its error event because the byte stream never
    // arrives. Masking the UA to a current macOS Chrome string makes the
    // CDN treat the request like a real visitor; the video file then loads
    // and our muted .play() call (later in this function) renders a real
    // first frame instead of the player's broken-state fallback.
    try {
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
      );
    } catch (_e) { /* setUserAgent is best-effort; fall through to default */ }
  }

  try {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      try {
        const reqUrl = req.url();
        // We deliberately do NOT abort 'media' resource types. Many sites
        // ship a hero background video; aborting the video request makes
        // the <video> element fire its error handler, which often renders
        // a visible "Format(s) not supported or source(s) not found"
        // overlay plus the raw file path on the page. We then screenshot
        // that overlay and the vision audit reports a defect that does
        // not exist on the live site. The settle window will not wait for
        // the entire video to download; the browser starts playing and we
        // capture whatever frame is current.
        for (const host of BLOCKED_HOSTS) {
          if (reqUrl.indexOf(host) !== -1) {
            return req.abort();
          }
        }
        req.continue();
      } catch (_e) {
        try { req.continue(); } catch (_e2) { /* request already handled */ }
      }
    });
  } catch (_err) { /* request interception is best-effort */ }

  // Heavy sites (corporate homepages with chat widgets, persistent
  // analytics polling, video embeds) can fail to reach networkidle2 or
  // even domcontentloaded inside Browserless's nav window. Real users
  // see content render long before that. So: if navigation throws a
  // timeout, log it and continue. We screenshot whatever the browser
  // already painted. This was the dominant cause of "partial" scans on
  // mbusa.com / wingertrealestate.com.
  const waitUntil = isFallback ? 'load' : 'networkidle2';
  const navTimeout = isFallback ? 40000 : 35000;
  const settleMs = isFallback ? 6000 : 2500;

  try {
    await page.goto(url, { waitUntil, timeout: navTimeout });
  } catch (err) {
    const msg = (err && err.message) || String(err);
    if (/timeout/i.test(msg)) {
      console.warn('[browserless-fn] navigation timed out, screenshotting current frame: ' + msg.slice(0, 200));
    } else {
      throw err;
    }
  }

  try {
    await page.evaluate(() => {
      const ACCEPT_RE = /^(accept|agree|allow|got it|ok|i understand|i accept|continue|consent)( all| cookies| & close)?$/i;
      const ARIA_RE = /(accept|agree|allow|consent|close.*cookie)/i;
      const candidates = Array.from(
        document.querySelectorAll('button, a[role="button"], [role="button"], input[type="button"], input[type="submit"]')
      );
      for (const el of candidates) {
        const text = (el.textContent || el.value || '').trim();
        const aria = el.getAttribute('aria-label') || '';
        if (ACCEPT_RE.test(text) || ARIA_RE.test(aria)) {
          try { el.click(); return true; } catch (_e) { /* keep trying */ }
        }
      }
      return false;
    });
    await new Promise((resolve) => setTimeout(resolve, 600));
  } catch (_err) { /* banner dismissal is best-effort */ }

  // Best-effort hero-video unstuck. Many sites place an autoplaying
  // background video in the hero. Headless Chromium often refuses to
  // autoplay (autoplay policy, missing proprietary codecs) or the CDN
  // serving the video blocks headless user agents. The <video> element
  // then fires its 'error' event and the site renders a fallback that
  // commonly includes the literal browser error string plus the raw
  // video URL as debug text. We try two layered remediations:
  //   (1) Set every <video> to muted and call .play() explicitly; this
  //       fixes the case where autoplay policy was the only block.
  //   (2) Hide any text whose content matches typical media-error
  //       fallback patterns, so the screenshot does not capture
  //       diagnostic strings that no real visitor would ever see.
  try {
    await page.evaluate(() => {
      // 1) Best-effort video unstuck. Some sites use preload="none", which
      //    means the browser does not start downloading the video until
      //    .play() is called. We muted-play every <video> after calling
      //    .load() so the autoplay policy is satisfied and the first frame
      //    has a chance to render.
      const videos = Array.from(document.querySelectorAll('video'));
      for (const v of videos) {
        try {
          v.muted = true;
          v.removeAttribute('controls');
          if (typeof v.load === 'function') { try { v.load(); } catch (_e) {} }
          const p = v.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch (_e) { /* keep trying others */ }
      }

      // 2) Persistent CSS injection. MediaElement.js (used by every Wix site
      //    plus many others) renders an error fallback inside .mejs-cannotplay
      //    that includes a "Download File: <url>" link when the underlying
      //    video file cannot play. Headless capture commonly trips this even
      //    on sites that work fine in a real browser, because:
      //    - Wix's video CDN (video.wixstatic.com) sniffs for headless agents
      //    - Browserless Chromium ships without proprietary H.264 codec
      //    - Autoplay policy can block silent autoplay
      //    Hiding .mejs-cannotplay via CSS injection (rather than runtime
      //    DOM mutation) is durable: if MediaElement.js re-renders the error
      //    UI later, the rule still applies. We also hide the broader set of
      //    cannotplay-style classes some custom players use.
      try {
        const style = document.createElement('style');
        style.setAttribute('data-pathlight-capture', 'video-error-suppress');
        style.textContent =
          '.mejs-cannotplay, .mejs-overlay-error, .mejs-overlay.mejs-layer, ' +
          '[class*="cannotplay" i], [class*="video-error" i] { ' +
          'display: none !important; visibility: hidden !important; opacity: 0 !important; }';
        (document.head || document.documentElement).appendChild(style);
      } catch (_e) { /* best-effort */ }

      // 3) Defensive runtime DOM hide. Catches sites that surface an error
      //    text or raw media URL through structures we did not anticipate
      //    in (2). Anchored regexes are deliberately removed so the URL can
      //    appear inside a longer text node ("Download File: https://...").
      //    Backslashes are doubled because this function body is the inside
      //    of a JS template literal: the literal interprets \\b as backspace
      //    and drops \\/ to '/', which would otherwise break the regex
      //    literal and produce a 400 at Browserless runtime.
      const ERROR_RE = /(format[(]s[)] not supported|source[(]s[)] not found|your browser does not support|media error|cannot ?play)/i;
      const MEDIA_URL_RE = /[\\w.-]+\\.[a-z]{2,}\\/[\\w./-]+\\.(mp4|webm|mov|m4v|ogv)\\b/i;
      const DOWNLOAD_RE = /download file/i;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const text = (node.nodeValue || '').trim();
        if (!text) continue;
        if (ERROR_RE.test(text) || MEDIA_URL_RE.test(text) || DOWNLOAD_RE.test(text)) {
          const el = node.parentElement;
          if (el) {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            // Walk up one level too: many error fallbacks wrap the text in
            // a <span> inside a <a> inside a container; hiding only the
            // <span> leaves the <a>'s residual layout space.
            const grandparent = el.parentElement;
            if (grandparent && grandparent !== document.body) {
              grandparent.style.display = 'none';
              grandparent.style.visibility = 'hidden';
            }
          }
        }
      }
    });
    // Brief settle for explicit play() to render a first frame
    await new Promise((resolve) => setTimeout(resolve, 800));
  } catch (_err) { /* video unstuck + error cleanup is best-effort */ }

  try {
    await page.evaluate(() =>
      document.fonts && document.fonts.ready ? document.fonts.ready : null
    );
  } catch (_err) { /* fonts.ready unavailable on some pages */ }

  await new Promise((resolve) => setTimeout(resolve, settleMs));
  const buffer = await page.screenshot({
    type: "jpeg",
    quality: 80,
    fullPage: false,
  });

  /* Stage 2: HTML capture + form extraction. Best-effort; any failure
   * here returns empty values rather than throwing, so a flaky page that
   * still screenshotted does not lose the screenshot over a body-text
   * extraction issue. The truncation cap is enforced inside the function
   * so the JSON response itself stays small. */
  let html = null;
  let htmlTruncatedAt = null;
  try {
    const raw = await page.content();
    if (typeof raw === 'string' && raw.length > 0) {
      const cap = typeof htmlTruncateBytes === 'number' ? htmlTruncateBytes : 262144;
      if (raw.length > cap) {
        html = raw.slice(0, cap);
        htmlTruncatedAt = cap;
      } else {
        html = raw;
      }
    }
  } catch (_err) { /* page.content() failed; leave html null */ }

  let forms = [];
  try {
    const cap = typeof maxForms === 'number' ? maxForms : 5;
    forms = await page.evaluate((capInner) => {
      function descriptorFor(form, formIndex) {
        const allInputs = Array.from(form.querySelectorAll('input, textarea, select'));
        const fieldCount = allInputs.length;
        const fieldTypes = {};
        let requiredCount = 0;
        let hiddenCount = 0;
        let unlabeledCount = 0;
        const labelForIds = new Set();
        Array.from(form.querySelectorAll('label[for]')).forEach((l) => {
          const id = l.getAttribute('for');
          if (id) labelForIds.add(id);
        });
        for (const f of allInputs) {
          const tag = f.tagName ? f.tagName.toLowerCase() : '';
          const rawType = (f.getAttribute && f.getAttribute('type')) || tag;
          const type = String(rawType).toLowerCase();
          fieldTypes[type] = (fieldTypes[type] || 0) + 1;
          if (type === 'hidden') { hiddenCount += 1; continue; }
          if ((f.hasAttribute && f.hasAttribute('required')) || (f.getAttribute && f.getAttribute('aria-required') === 'true')) {
            requiredCount += 1;
          }
          const id = f.getAttribute && f.getAttribute('id');
          const hasLabel = (id && labelForIds.has(id)) ||
                           (f.hasAttribute && (f.hasAttribute('aria-label') || f.hasAttribute('aria-labelledby'))) ||
                           (f.closest && f.closest('label') !== null);
          if (!hasLabel) unlabeledCount += 1;
        }
        let submitBtn = form.querySelector('button[type=submit], input[type=submit]');
        if (!submitBtn) submitBtn = form.querySelector('button:not([type]), button[type=button]');
        let buttonCopy = null;
        if (submitBtn) {
          const text = (submitBtn.textContent || submitBtn.value || '').replace(/\\s+/g, ' ').trim();
          if (text) buttonCopy = text.slice(0, 200);
        }
        const optionalCount = Math.max(0, fieldCount - hiddenCount - requiredCount);
        return {
          formIndex,
          fieldCount,
          fieldTypes,
          requiredCount,
          optionalCount,
          hiddenCount,
          unlabeledCount,
          buttonCopy,
          action: (form.getAttribute && form.getAttribute('action')) || null,
          method: ((form.getAttribute && form.getAttribute('method')) || 'get').toLowerCase(),
          hasLabels: labelForIds.size > 0,
          ariaLabel: (form.getAttribute && form.getAttribute('aria-label')) || null,
        };
      }
      const all = Array.from(document.querySelectorAll('form'));
      const out = [];
      for (let i = 0; i < all.length && out.length < capInner; i++) {
        try { out.push(descriptorFor(all[i], i)); } catch (_e) { /* one bad form should not poison the rest */ }
      }
      return out;
    }, cap);
  } catch (_err) { /* extraction failed; leave forms empty */ }

  const b = typeof Buffer !== "undefined"
    ? Buffer.from(buffer).toString("base64")
    : btoa(Array.from(new Uint8Array(buffer), (b) => String.fromCharCode(b)).join(""));
  return { screenshot: b, html, htmlTruncatedAt, forms };
}
`;

/**
 * Full-page capture function. Deliberately separate from the AtF function
 * above so the AtF path stays focused and the do-not-break.md screenshot
 * pipeline keeps its known failure modes. This function:
 *  - skips the cookie-banner dismissal (the banner often re-shows mid-scroll)
 *  - skips the HTML/forms extraction (the AtF call already captured both)
 *  - sets fullPage: true (the only meaningful difference)
 *
 * Same blocked-hosts list and same nav-timeout-tolerance pattern as AtF so
 * heavy corporate homepages still produce a screenshot.
 */
const SCREENSHOT_FULLPAGE_FUNCTION = `
const BLOCKED_HOSTS = [
  'googletagmanager.com','google-analytics.com','googleadservices.com',
  'doubleclick.net','facebook.net','connect.facebook.net',
  'intercom.io','intercomcdn.com','widget.intercom.io',
  'drift.com','driftcdn.com','js.driftt.com',
  'hotjar.com','static.hotjar.com','fullstory.com',
  'segment.com','segment.io','mixpanel.com','amplitude.com','cdn.amplitude.com',
  'tawk.to','embed.tawk.to','crisp.chat','client.crisp.chat',
  'zdassets.com','static.zdassets.com','zopim.com','static.zopim.com',
  'linkedin.com/li/track','snap.licdn.com','bing.com/api','clarity.ms',
];

export default async function ({ page, context }) {
  const { url, width, height, strategy } = context;
  const isFallback = strategy === 'fallback';
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" }
  ]);
  if (width <= 768) {
    await page.emulate({
      viewport: { width, height, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
  } else {
    await page.setViewport({ width, height });
    // Realistic desktop Chrome UA. See AtF capture function for full
    // rationale: video CDNs sniff for "HeadlessChrome" and refuse to serve.
    try {
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
      );
    } catch (_e) { /* best-effort */ }
  }

  try {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      try {
        const reqUrl = req.url();
        // 'media' requests are NOT aborted: see the AtF capture function
        // above for the rationale (background hero videos render a visible
        // error overlay if their request is killed, poisoning the screenshot).
        for (const host of BLOCKED_HOSTS) {
          if (reqUrl.indexOf(host) !== -1) return req.abort();
        }
        req.continue();
      } catch (_e) {
        try { req.continue(); } catch (_e2) { /* already handled */ }
      }
    });
  } catch (_err) { /* best-effort */ }

  const waitUntil = isFallback ? 'load' : 'networkidle2';
  const navTimeout = isFallback ? 40000 : 35000;
  const settleMs = isFallback ? 6000 : 3000;

  try {
    await page.goto(url, { waitUntil, timeout: navTimeout });
  } catch (err) {
    const msg = (err && err.message) || String(err);
    if (!/timeout/i.test(msg)) throw err;
  }

  // Hero-video unstuck + media-error fallback cleanup. Mirrors the AtF
  // capture function above; see that function's comment for full rationale.
  try {
    await page.evaluate(() => {
      const videos = Array.from(document.querySelectorAll('video'));
      for (const v of videos) {
        try {
          v.muted = true;
          v.removeAttribute('controls');
          if (typeof v.load === 'function') { try { v.load(); } catch (_e) {} }
          const p = v.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch (_e) { /* keep trying others */ }
      }
      // CSS injection: hide MediaElement.js / Wix / generic video-error
      // fallback containers durably across re-renders. See AtF capture
      // for full rationale + backslash-doubling note.
      try {
        const style = document.createElement('style');
        style.setAttribute('data-pathlight-capture', 'video-error-suppress');
        style.textContent =
          '.mejs-cannotplay, .mejs-overlay-error, .mejs-overlay.mejs-layer, ' +
          '[class*="cannotplay" i], [class*="video-error" i] { ' +
          'display: none !important; visibility: hidden !important; opacity: 0 !important; }';
        (document.head || document.documentElement).appendChild(style);
      } catch (_e) { /* best-effort */ }
      const ERROR_RE = /(format[(]s[)] not supported|source[(]s[)] not found|your browser does not support|media error|cannot ?play)/i;
      const MEDIA_URL_RE = /[\\w.-]+\\.[a-z]{2,}\\/[\\w./-]+\\.(mp4|webm|mov|m4v|ogv)\\b/i;
      const DOWNLOAD_RE = /download file/i;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const text = (node.nodeValue || '').trim();
        if (!text) continue;
        if (ERROR_RE.test(text) || MEDIA_URL_RE.test(text) || DOWNLOAD_RE.test(text)) {
          const el = node.parentElement;
          if (el) {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            const grandparent = el.parentElement;
            if (grandparent && grandparent !== document.body) {
              grandparent.style.display = 'none';
              grandparent.style.visibility = 'hidden';
            }
          }
        }
      }
    });
    await new Promise((resolve) => setTimeout(resolve, 800));
  } catch (_err) { /* best-effort */ }

  try {
    await page.evaluate(() =>
      document.fonts && document.fonts.ready ? document.fonts.ready : null
    );
  } catch (_err) { /* fonts.ready unavailable on some pages */ }

  await new Promise((resolve) => setTimeout(resolve, settleMs));

  const buffer = await page.screenshot({
    type: "jpeg",
    quality: 75,
    fullPage: true,
  });
  const b = typeof Buffer !== "undefined"
    ? Buffer.from(buffer).toString("base64")
    : btoa(Array.from(new Uint8Array(buffer), (b) => String.fromCharCode(b)).join(""));
  return { screenshot: b };
}
`;

type ScreenshotStrategy = "primary" | "fallback";

type BrowserlessFunctionBody = {
  code: string;
  context: {
    url: string;
    width: number;
    height: number;
    strategy: ScreenshotStrategy;
    htmlTruncateBytes?: number;
    maxForms?: number;
  };
};

function isPermanentBrowserlessError(message: string): boolean {
  // 401/403 = auth/permission, no point retrying.
  if (/\((40[13])\)/.test(message)) return true;
  // 404 from /function endpoint typically means a misconfigured base URL.
  if (/\(404\)/.test(message)) return true;
  return false;
}

function isRateLimitError(message: string): boolean {
  // 429 from Browserless = "Too Many Requests". Their plan-tier rate limit
  // is bursty and clears in a few seconds. Worth backing off and retrying.
  return /\(429\)/.test(message);
}

/* Exponential backoff schedule for 429 retries on the SAME strategy. Total
 * worst-case extra wait is 1+2+4 = 7s, well inside the per-attempt 55s
 * SCREENSHOT_TIMEOUT_MS envelope. The wingertrealestate.com 2026-05-03
 * incident proved the rate limit clears within ~4s; the first 1s/2s tier
 * is what would have saved that scan. */
const RATE_LIMIT_BACKOFF_MS: ReadonlyArray<number> = [1000, 2000, 4000];

async function callWithRateLimitRetry<T>(
  attempt: () => Promise<T>,
  context: string
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= RATE_LIMIT_BACKOFF_MS.length; i++) {
    try {
      return await attempt();
    } catch (err) {
      lastErr = err;
      const message = err instanceof Error ? err.message : String(err);
      if (!isRateLimitError(message) || i === RATE_LIMIT_BACKOFF_MS.length) {
        throw err;
      }
      const delay = RATE_LIMIT_BACKOFF_MS[i];
      console.warn(
        `[browserless] 429 on ${context} (attempt ${i + 1}/${RATE_LIMIT_BACKOFF_MS.length + 1}); backing off ${delay}ms before retry`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error(`Browserless rate-limit retries exhausted on ${context}`);
}

async function captureScreenshotAttempt(
  url: string,
  viewport: Viewport,
  strategy: ScreenshotStrategy,
  scanId: string | null
): Promise<AtfCaptureResult> {
  const token = process.env.BROWSERLESS_API_KEY;
  if (!token) {
    throw new Error("BROWSERLESS_API_KEY is not configured.");
  }
  const base = process.env.BROWSERLESS_BASE_URL ?? DEFAULT_BROWSERLESS_BASE;

  const body: BrowserlessFunctionBody = {
    code: SCREENSHOT_FUNCTION,
    context: {
      url,
      width: viewport.width,
      height: viewport.height,
      strategy,
      htmlTruncateBytes: HTML_TRUNCATE_BYTES,
      maxForms: MAX_FORMS_EXTRACTED,
    },
  };

  const operation =
    viewport.width <= 768 ? "screenshot-mobile" : "screenshot-desktop";
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SCREENSHOT_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${base}${BROWSERLESS_BINARY_PATH}/function?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `Browserless screenshot failed (${res.status}): ${detail.slice(0, 200)}`
      );
    }

    const json = (await res.json()) as {
      screenshot: string;
      html?: string | null;
      htmlTruncatedAt?: number | null;
      forms?: FormDescriptor[];
    };
    const buf = Buffer.from(json.screenshot, "base64");
    if (buf.byteLength === 0) {
      throw new Error("Browserless returned an empty screenshot.");
    }
    await recordBrowserlessUsage({
      scanId,
      operation,
      durationMs: Date.now() - start,
      status: "ok",
    });
    return {
      screenshot: buf,
      html: typeof json.html === "string" ? json.html : null,
      htmlTruncatedAt:
        typeof json.htmlTruncatedAt === "number" ? json.htmlTruncatedAt : null,
      forms: Array.isArray(json.forms) ? json.forms : [],
      strategy,
    };
  } catch (err) {
    await recordBrowserlessUsage({
      scanId,
      operation,
      durationMs: Date.now() - start,
      status: strategy === "primary" ? "retry" : "fail",
    });
    if ((err as Error).name === "AbortError") {
      throw new Error(
        `Browserless screenshot timed out after ${SCREENSHOT_TIMEOUT_MS / 1000}s (strategy=${strategy}).`
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function captureScreenshot(
  url: string,
  viewport: Viewport,
  scanId: string | null = null
): Promise<AtfCaptureResult> {
  const ctx = `screenshot ${viewport.width}x${viewport.height}`;
  try {
    return await callWithRateLimitRetry(
      () => captureScreenshotAttempt(url, viewport, "primary", scanId),
      `${ctx} (primary)`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isPermanentBrowserlessError(message)) {
      throw err;
    }
    console.warn(
      `[browserless] primary screenshot failed for ${url} (${viewport.width}x${viewport.height}): ${message.slice(0, 200)}; retrying with fallback strategy`
    );
    await new Promise((resolve) =>
      setTimeout(resolve, SCREENSHOT_RETRY_DELAY_MS)
    );
    return await callWithRateLimitRetry(
      () => captureScreenshotAttempt(url, viewport, "fallback", scanId),
      `${ctx} (fallback)`
    );
  }
}

/**
 * Stage 2: full-page capture path. Lives parallel to the AtF capture above.
 * Returns the JPEG buffer only (HTML/forms come from the AtF call). Same
 * primary/fallback retry posture as the AtF function so a heavy site that
 * needs the longer settle window still produces a usable full-page image.
 */
async function captureFullPageAttempt(
  url: string,
  viewport: Viewport,
  strategy: ScreenshotStrategy,
  scanId: string | null
): Promise<Buffer> {
  const token = process.env.BROWSERLESS_API_KEY;
  if (!token) {
    throw new Error("BROWSERLESS_API_KEY is not configured.");
  }
  const base = process.env.BROWSERLESS_BASE_URL ?? DEFAULT_BROWSERLESS_BASE;

  const body: BrowserlessFunctionBody = {
    code: SCREENSHOT_FULLPAGE_FUNCTION,
    context: {
      url,
      width: viewport.width,
      height: viewport.height,
      strategy,
    },
  };

  const operation =
    viewport.width <= 768
      ? "screenshot-fullpage-mobile"
      : "screenshot-fullpage-desktop";
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SCREENSHOT_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${base}${BROWSERLESS_BINARY_PATH}/function?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `Browserless full-page failed (${res.status}): ${detail.slice(0, 200)}`
      );
    }

    const json = (await res.json()) as { screenshot: string };
    const buf = Buffer.from(json.screenshot, "base64");
    if (buf.byteLength === 0) {
      throw new Error("Browserless returned an empty full-page screenshot.");
    }
    await recordBrowserlessUsage({
      scanId,
      operation,
      durationMs: Date.now() - start,
      status: "ok",
    });
    return buf;
  } catch (err) {
    await recordBrowserlessUsage({
      scanId,
      operation,
      durationMs: Date.now() - start,
      status: strategy === "primary" ? "retry" : "fail",
    });
    if ((err as Error).name === "AbortError") {
      throw new Error(
        `Browserless full-page timed out after ${SCREENSHOT_TIMEOUT_MS / 1000}s (strategy=${strategy}).`
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function captureFullPageScreenshot(
  url: string,
  viewport: Viewport,
  scanId: string | null = null
): Promise<Buffer> {
  const ctx = `full-page ${viewport.width}x${viewport.height}`;
  try {
    return await callWithRateLimitRetry(
      () => captureFullPageAttempt(url, viewport, "primary", scanId),
      `${ctx} (primary)`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isPermanentBrowserlessError(message)) {
      throw err;
    }
    console.warn(
      `[browserless] primary full-page failed for ${url} (${viewport.width}x${viewport.height}): ${message.slice(0, 200)}; retrying with fallback strategy`
    );
    await new Promise((resolve) =>
      setTimeout(resolve, SCREENSHOT_RETRY_DELAY_MS)
    );
    return await callWithRateLimitRetry(
      () => captureFullPageAttempt(url, viewport, "fallback", scanId),
      `${ctx} (fallback)`
    );
  }
}

/**
 * Browserless v2 /pdf endpoint wrapper. Renders the given URL with the
 * print media type emulated (which activates @media print rules in
 * globals.css). The report's print stylesheet hides the chat panel,
 * expands collapsed accordions via .print-expand, and forces white
 * backgrounds + dark text. Streams the PDF bytes back as a Buffer.
 *
 * waitForTimeout is a 2.5s settle window after networkidle0 so any
 * tail-end animation or font swap completes before capture, matching
 * the screenshot pipeline's pattern. printBackground: true allows the
 * SVG score ring and inline-colored badges to render their fill colors.
 * The print stylesheet zeros out card backgrounds independently, so
 * this only affects the elements that actually want their colors.
 */
type BrowserlessPdfBody = {
  url: string;
  options: {
    format: "Letter";
    printBackground: boolean;
    margin: {
      top: string;
      right: string;
      bottom: string;
      left: string;
    };
  };
  gotoOptions: {
    waitUntil: "networkidle0";
    timeout: number;
  };
  emulateMediaType: "print";
  waitForTimeout: number;
};

export async function generatePdf(
  url: string,
  scanId: string | null = null
): Promise<Buffer> {
  const token = process.env.BROWSERLESS_API_KEY;
  if (!token) {
    throw new Error("BROWSERLESS_API_KEY is not configured.");
  }
  const base = process.env.BROWSERLESS_BASE_URL ?? DEFAULT_BROWSERLESS_BASE;

  const body: BrowserlessPdfBody = {
    url,
    options: {
      format: "Letter",
      printBackground: true,
      margin: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
      },
    },
    gotoOptions: {
      waitUntil: "networkidle0",
      timeout: 25_000,
    },
    emulateMediaType: "print",
    waitForTimeout: 2_500,
  };

  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PDF_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${base}${BROWSERLESS_BINARY_PATH}/pdf?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `Browserless PDF failed (${res.status}): ${detail.slice(0, 200)}`
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    if (buf.byteLength === 0) {
      throw new Error("Browserless returned an empty PDF.");
    }

    await recordBrowserlessUsage({
      scanId,
      operation: "pdf-report",
      durationMs: Date.now() - start,
      status: "ok",
    });
    return buf;
  } catch (err) {
    await recordBrowserlessUsage({
      scanId,
      operation: "pdf-report",
      durationMs: Date.now() - start,
      status: "fail",
    });
    if ((err as Error).name === "AbortError") {
      throw new Error("Browserless PDF generation timed out after 60s.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
