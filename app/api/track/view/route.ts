import { NextResponse } from "next/server";
import { z } from "zod";
import { recordPageView } from "@/lib/services/analytics";
import { classifyBot, summarizeUa } from "@/lib/services/bot-filter";
import { extractGeo } from "@/lib/services/geo";
import { extractIp } from "@/lib/rate-limit";
import {
  hashIp,
  resolveIdentity,
  serializeCookie,
  SESSION_COOKIE,
  VISITOR_COOKIE,
} from "@/lib/services/visitor-id";

/* First-party page-view ingestion endpoint.
 *
 * Called by components/analytics/PageViewBeacon.tsx as a navigator
 * .sendBeacon POST on every route change. The body carries client-only
 * context (referrer, viewport, full URL) while the server attaches the
 * IP-derived data (geo, hashed IP) and the cookie-resolved identity.
 *
 * This endpoint never blocks the user. recordPageView swallows its own
 * errors; even a 500 would only mean a missing analytics row, which
 * is preferable to interfering with the page render.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  path: z.string().min(1).max(2048),
  query: z.string().max(2048).nullable().optional(),
  referrer: z.string().max(2048).nullable().optional(),
  viewportW: z.number().int().min(0).max(20000).nullable().optional(),
  viewportH: z.number().int().min(0).max(20000).nullable().optional(),
});

const TRACKED_PATH_BLOCKLIST: RegExp[] = [
  /^\/admin(\/|$)/i,
  /^\/portal(\/|$)/i,
  /^\/signin(\/|$)/i,
  /^\/api(\/|$)/i,
  /^\/pathlight\/[^/]+/i,
];

function shouldTrack(path: string): boolean {
  for (const pattern of TRACKED_PATH_BLOCKLIST) {
    if (pattern.test(path)) return false;
  }
  return true;
}

function parseUtm(query: string | null | undefined): {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
} {
  const out = {
    source: null as string | null,
    medium: null as string | null,
    campaign: null as string | null,
    term: null as string | null,
    content: null as string | null,
  };
  if (!query) return out;
  try {
    const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
    out.source = params.get("utm_source");
    out.medium = params.get("utm_medium");
    out.campaign = params.get("utm_campaign");
    out.term = params.get("utm_term");
    out.content = params.get("utm_content");
  } catch {
    /* malformed query is fine; we just lose UTM enrichment */
  }
  return out;
}

function referrerHostOf(referrer: string | null | undefined, ownHost: string | null): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (ownHost && url.host === ownHost) return null;
    return url.host || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  let payload: z.infer<typeof bodySchema>;
  try {
    const json = await request.json();
    payload = bodySchema.parse(json);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  if (!shouldTrack(payload.path)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieMap = new Map<string, string>();
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) cookieMap.set(k, v);
  }
  const { identity, cookies } = resolveIdentity({
    cookieVid: cookieMap.get(VISITOR_COOKIE) ?? null,
    cookieSid: cookieMap.get(SESSION_COOKIE) ?? null,
  });

  const ua = request.headers.get("user-agent");
  const acceptLanguage = request.headers.get("accept-language");
  const bot = classifyBot({ userAgent: ua, acceptLanguage });
  const uaSummary = summarizeUa(ua, bot.isBot);
  const geo = extractGeo(request.headers);
  const ip = extractIp(request);
  const ipHash = hashIp(ip);

  const ownHost = (() => {
    try {
      return new URL(request.url).host;
    } catch {
      return null;
    }
  })();
  const referrer = payload.referrer ?? null;
  const referrerHost = referrerHostOf(referrer, ownHost);
  const utm = parseUtm(payload.query ?? null);

  const result = await recordPageView({
    visitorId: identity.visitorId,
    sessionId: identity.sessionId,
    path: payload.path,
    query: payload.query ?? null,
    referrer,
    referrerHost,
    utm,
    ipHash,
    geo,
    ua: uaSummary,
    isBot: bot.isBot,
    botReason: bot.reason,
    viewportW: payload.viewportW ?? null,
    viewportH: payload.viewportH ?? null,
  });

  const response = NextResponse.json({
    ok: result.ok,
    pageViewId: result.pageViewId,
  });
  for (const c of cookies) {
    response.headers.append("Set-Cookie", serializeCookie(c));
  }
  return response;
}
