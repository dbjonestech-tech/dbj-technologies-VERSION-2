import { recordBrowserlessUsage } from "./api-usage";

export type Viewport = { width: number; height: number };

const DEFAULT_BROWSERLESS_BASE = "https://production-sfo.browserless.io";
const SCREENSHOT_TIMEOUT_MS = 55_000;
const SCREENSHOT_RETRY_DELAY_MS = 3_000;
const PDF_TIMEOUT_MS = 60_000;

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
  }

  try {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      try {
        const reqUrl = req.url();
        const type = req.resourceType();
        if (type === 'media') {
          return req.abort();
        }
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
  };
};

function isPermanentBrowserlessError(message: string): boolean {
  // 401/403 = auth/permission, no point retrying.
  if (/\((40[13])\)/.test(message)) return true;
  // 404 from /function endpoint typically means a misconfigured base URL.
  if (/\(404\)/.test(message)) return true;
  return false;
}

async function captureScreenshotAttempt(
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
    code: SCREENSHOT_FUNCTION,
    context: {
      url,
      width: viewport.width,
      height: viewport.height,
      strategy,
    },
  };

  const operation =
    viewport.width <= 768 ? "screenshot-mobile" : "screenshot-desktop";
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SCREENSHOT_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${base}/function?token=${encodeURIComponent(token)}`,
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

    const json = (await res.json()) as { screenshot: string };
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
): Promise<Buffer> {
  try {
    return await captureScreenshotAttempt(url, viewport, "primary", scanId);
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
    return await captureScreenshotAttempt(url, viewport, "fallback", scanId);
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
      `${base}/pdf?token=${encodeURIComponent(token)}`,
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
