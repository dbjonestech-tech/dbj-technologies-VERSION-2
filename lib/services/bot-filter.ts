/**
 * Bot classification for first-party analytics.
 *
 * Layered detection -- the goal is high precision (a flagged row is
 * almost certainly a bot) at the cost of some recall (we will miss
 * some sophisticated headless setups). The `is_bot` column on
 * page_views is the dashboard toggle; the default views exclude
 * bots so a noisy crawler day does not skew traffic numbers.
 *
 * Layer 1 -- User-Agent signature match. A curated list of substrings
 *           seen in known crawler UAs. Hits 80%+ of opportunistic bot
 *           traffic with zero false positives.
 *
 * Layer 2 -- Empty / minimal UA. Many headless and curl-style requests
 *           ship without a UA at all, or with one shorter than any
 *           legitimate browser.
 *
 * Layer 3 -- Missing Accept-Language. Real browsers always send this;
 *           most automated clients do not unless explicitly configured.
 *           Combined with one of the above, this is a strong signal.
 *
 * Layer 4 -- (deferred to caller) Behavioral. If a page_view has no
 *           page_view_engagement row after 60 seconds, the row is
 *           retroactively flagged as likely-bot via the
 *           monitoringPurgeDaily cron. Implemented in module 2's
 *           rollup logic, not here.
 */

const BOT_UA_PATTERNS: RegExp[] = [
  /bot\b/i,
  /crawler/i,
  /spider/i,
  /slurp/i,
  /wget/i,
  /curl\//i,
  /python-requests/i,
  /httpie/i,
  /go-http-client/i,
  /\bphantomjs\b/i,
  /\bheadless\b/i,
  /\bfacebookexternalhit\b/i,
  /\bfacebookcatalog\b/i,
  /\btelegrambot\b/i,
  /\bdiscordbot\b/i,
  /\bslackbot\b/i,
  /\bwhatsapp\b/i,
  /\bgooglebot\b/i,
  /\bbingbot\b/i,
  /\bduckduckbot\b/i,
  /\bbaiduspider\b/i,
  /\byandexbot\b/i,
  /\bapplebot\b/i,
  /\bsemrushbot\b/i,
  /\bahrefsbot\b/i,
  /\bmj12bot\b/i,
  /\bdotbot\b/i,
  /\bgpt-?bot\b/i,
  /\bclaudebot\b/i,
  /\bclaude-web\b/i,
  /\boai-?searchbot\b/i,
  /\bperplexitybot\b/i,
  /\banthropic-?ai\b/i,
  /\bcohere-?ai\b/i,
  /\bccbot\b/i,
  /\bbytespider\b/i,
  /\bamazonbot\b/i,
  /\bia_archiver\b/i,
  /preview/i,
  /\blighthouse\b/i,
  /\bpagespeed\b/i,
  /\bgtmetrix\b/i,
  /\bmonitoring\b/i,
  /\bvercel-screenshot\b/i,
  /\baxios\b/i,
  /\bnode-fetch\b/i,
  /\bokhttp\b/i,
  /\bjava\//i,
];

export type BotClassification = {
  isBot: boolean;
  reason: string | null;
};

export function classifyBot(args: {
  userAgent: string | null;
  acceptLanguage: string | null;
}): BotClassification {
  const ua = args.userAgent?.trim() ?? "";

  if (ua.length === 0) {
    return { isBot: true, reason: "ua-empty" };
  }
  if (ua.length < 20) {
    return { isBot: true, reason: "ua-too-short" };
  }
  for (const pattern of BOT_UA_PATTERNS) {
    if (pattern.test(ua)) {
      return { isBot: true, reason: `ua-match:${pattern.source}` };
    }
  }
  if (!args.acceptLanguage || args.acceptLanguage.trim().length === 0) {
    /* No Accept-Language is a soft signal on its own -- some privacy
     * tools strip it -- but combined with the absence of any browser
     * markers it is suspicious enough to flag. */
    if (!/\b(chrome|firefox|safari|edg|opera|opr)\b/i.test(ua)) {
      return { isBot: true, reason: "no-accept-language-and-no-browser-marker" };
    }
  }
  return { isBot: false, reason: null };
}

/**
 * Coarse browser, OS, device-type extraction from User-Agent.
 * Deliberately small -- we are not trying to outdo ua-parser-js, just
 * answer "what bucket does this belong to" cheaply at write time.
 */
export type UaSummary = {
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  deviceType: "mobile" | "tablet" | "desktop" | "bot" | null;
};

export function summarizeUa(ua: string | null, isBot: boolean): UaSummary {
  if (isBot) return { browser: null, browserVersion: null, os: null, osVersion: null, deviceType: "bot" };
  const value = ua ?? "";
  if (value.length === 0) {
    return { browser: null, browserVersion: null, os: null, osVersion: null, deviceType: null };
  }
  return {
    browser: detectBrowser(value),
    browserVersion: detectBrowserVersion(value),
    os: detectOs(value),
    osVersion: detectOsVersion(value),
    deviceType: detectDeviceType(value),
  };
}

function detectBrowser(ua: string): string | null {
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return "Opera";
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "Safari";
  if (/Chromium\//i.test(ua)) return "Chromium";
  return null;
}

function detectBrowserVersion(ua: string): string | null {
  const patterns = [
    /Edg\/([\d.]+)/i,
    /OPR\/([\d.]+)/i,
    /Chrome\/([\d.]+)/i,
    /Firefox\/([\d.]+)/i,
    /Version\/([\d.]+).*Safari/i,
  ];
  for (const p of patterns) {
    const m = ua.match(p);
    if (m && m[1]) return m[1];
  }
  return null;
}

function detectOs(ua: string): string | null {
  if (/Windows NT/i.test(ua)) return "Windows";
  if (/Mac OS X/i.test(ua) && !/Mobile|iPhone|iPad/i.test(ua)) return "macOS";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Linux/i.test(ua)) return "Linux";
  if (/CrOS/i.test(ua)) return "ChromeOS";
  return null;
}

function detectOsVersion(ua: string): string | null {
  const patterns = [
    /Windows NT ([\d.]+)/i,
    /Mac OS X ([\d_.]+)/i,
    /iPhone OS ([\d_.]+)/i,
    /CPU OS ([\d_.]+)/i,
    /Android ([\d.]+)/i,
  ];
  for (const p of patterns) {
    const m = ua.match(p);
    if (m && m[1]) return m[1].replace(/_/g, ".");
  }
  return null;
}

function detectDeviceType(ua: string): "mobile" | "tablet" | "desktop" {
  if (/iPad|Tablet|PlayBook/i.test(ua)) return "tablet";
  if (/Android(?!.*Mobile)/i.test(ua)) return "tablet";
  if (/Mobi|Mobile|iPhone|iPod|Android|Windows Phone/i.test(ua)) return "mobile";
  return "desktop";
}
