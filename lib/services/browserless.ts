export type Viewport = { width: number; height: number };

const DEFAULT_BROWSERLESS_BASE = "https://production-sfo.browserless.io";
const SCREENSHOT_TIMEOUT_MS = 30_000;

type BrowserlessScreenshotBody = {
  url: string;
  viewport: Viewport;
  gotoOptions: { waitUntil: "networkidle2"; timeout: number };
  options: { type: "jpeg"; quality: number; fullPage: boolean };
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

  const body: BrowserlessScreenshotBody = {
    url,
    viewport,
    gotoOptions: { waitUntil: "networkidle2", timeout: 20_000 },
    options: { type: "jpeg", quality: 80, fullPage: false },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SCREENSHOT_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${base}/screenshot?token=${encodeURIComponent(token)}`,
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

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0) {
      throw new Error("Browserless returned an empty screenshot.");
    }
    return buf;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error("Browserless screenshot timed out after 30s.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
