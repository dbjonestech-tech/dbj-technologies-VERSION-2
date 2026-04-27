import { recordBrowserlessUsage } from "./api-usage";

export type Viewport = { width: number; height: number };

const DEFAULT_BROWSERLESS_BASE = "https://production-sfo.browserless.io";
const SCREENSHOT_TIMEOUT_MS = 45_000;

// Runs inside Browserless v2 /function (Puppeteer in a managed Chromium).
// Emulating prefers-reduced-motion BEFORE navigation lets sites that respect
// that media query (including dbjtechnologies.com's HeroCinema) skip
// interaction-gated entrance animations so the captured frame shows real
// content instead of a permanent blueprint overlay.
//
// After navigation we try to dismiss any GDPR/CCPA cookie banner by
// matching common accept-button text and aria-labels. If no banner is
// found the click silently no-ops. We then wait for document.fonts.ready
// so type renders before capture, and finally apply the existing 3s
// settle window for any tail animations.
const SCREENSHOT_FUNCTION = `
export default async function ({ page, context }) {
  const { url, width, height } = context;
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
  await page.goto(url, { waitUntil: "networkidle0", timeout: 25000 });

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

  await new Promise((resolve) => setTimeout(resolve, 2500));
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

type BrowserlessFunctionBody = {
  code: string;
  context: { url: string; width: number; height: number };
};

export async function captureScreenshot(
  url: string,
  viewport: Viewport,
  scanId: string | null = null
): Promise<Buffer> {
  const token = process.env.BROWSERLESS_API_KEY;
  if (!token) {
    throw new Error("BROWSERLESS_API_KEY is not configured.");
  }
  const base = process.env.BROWSERLESS_BASE_URL ?? DEFAULT_BROWSERLESS_BASE;

  const body: BrowserlessFunctionBody = {
    code: SCREENSHOT_FUNCTION,
    context: { url, width: viewport.width, height: viewport.height },
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
      status: "fail",
    });
    if ((err as Error).name === "AbortError") {
      throw new Error("Browserless screenshot timed out after 45s.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
