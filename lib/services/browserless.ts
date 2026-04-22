export type Viewport = { width: number; height: number };

const DEFAULT_BROWSERLESS_BASE = "https://production-sfo.browserless.io";
const SCREENSHOT_TIMEOUT_MS = 45_000;

// Runs inside Browserless v2 /function (Puppeteer in a managed Chromium).
// Emulating prefers-reduced-motion BEFORE navigation lets sites that respect
// that media query (including dbjtechnologies.com's HeroCinema) skip
// interaction-gated entrance animations so the captured frame shows real
// content instead of a permanent blueprint overlay.
const SCREENSHOT_FUNCTION = `
export default async function ({ page, context }) {
  const { url, width, height } = context;
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" }
  ]);
  await page.setViewport({ width, height });
  await page.goto(url, { waitUntil: "networkidle0", timeout: 25000 });
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const buffer = await page.screenshot({
    type: "jpeg",
    quality: 80,
    fullPage: false,
  });
  return { screenshot: buffer.toString("base64") };
}
`;

type BrowserlessFunctionBody = {
  code: string;
  context: { url: string; width: number; height: number };
};

export async function captureScreenshot(
  url: string,
  viewport: Viewport
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
    return buf;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error("Browserless screenshot timed out after 45s.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
