import { createHash, randomUUID } from "node:crypto";

/**
 * Visitor + session identity helpers for first-party analytics.
 *
 * Two cookies, both first-party, both httpOnly + sameSite=lax:
 *
 *   dbj_vid (visitor id)   -- UUIDv4, 13-month rolling lifetime. Stable
 *                            identifier across sessions. Cleared by
 *                            user clears cookies.
 *
 *   dbj_sid (session id)   -- UUIDv4, sliding 30-min idle window. New
 *                            session is issued whenever the cookie is
 *                            absent or has aged past idle.
 *
 * IP hashing:
 *   ip_hash = sha256(ip || daily_salt)
 *   daily_salt = sha256(ANALYTICS_IP_SALT_BASE || YYYY-MM-DD-UTC)
 *
 *   The base salt comes from env. If unset (local dev) we fall back to
 *   a fixed placeholder and log once so the build does not break, but
 *   production deploys MUST set ANALYTICS_IP_SALT_BASE for the
 *   privacy guarantee to hold. Daily rotation means the same visitor's
 *   hash cycles day-to-day so anyone with raw DB access cannot
 *   correlate visitors across days by IP.
 *
 * Cookies are marked httpOnly because the client beacon never needs
 * to read them -- the browser ships them automatically with the
 * sendBeacon POST. Server reads, enriches, writes back if needed.
 */

export const VISITOR_COOKIE = "dbj_vid";
export const SESSION_COOKIE = "dbj_sid";

const VISITOR_TTL_SECONDS = 60 * 60 * 24 * 395; // ~13 months
const SESSION_IDLE_SECONDS = 60 * 30; // 30 minutes
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

let saltWarningLogged = false;
function getBaseSalt(): string {
  const fromEnv = process.env.ANALYTICS_IP_SALT_BASE;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  if (!saltWarningLogged) {
    console.warn(
      "[analytics] ANALYTICS_IP_SALT_BASE not set or too short; using insecure fallback. Set a 32+ char secret in production."
    );
    saltWarningLogged = true;
  }
  return "dbj-local-dev-fallback-salt-do-not-ship";
}

function todaySaltKey(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

let cachedDailySalt: { key: string; salt: string } | null = null;
function dailySalt(): string {
  const key = todaySaltKey();
  if (cachedDailySalt && cachedDailySalt.key === key) {
    return cachedDailySalt.salt;
  }
  const salt = createHash("sha256")
    .update(getBaseSalt())
    .update(":")
    .update(key)
    .digest("hex");
  cachedDailySalt = { key, salt };
  return salt;
}

export function hashIp(ip: string | null): string {
  const value = ip && ip.length > 0 ? ip : "unknown";
  return createHash("sha256").update(value).update(":").update(dailySalt()).digest("hex");
}

export type ResolvedIdentity = {
  visitorId: string;
  sessionId: string;
  visitorIsNew: boolean;
  sessionIsNew: boolean;
};

export type CookieDirective = {
  name: string;
  value: string;
  maxAge: number;
};

/**
 * Resolve the (visitor, session) identity for an incoming request.
 * Generates fresh UUIDs when cookies are missing or invalid. Returns
 * the identity plus a list of cookie directives the caller should set
 * on the response (only populated when something changed).
 */
export function resolveIdentity(args: {
  cookieVid: string | null | undefined;
  cookieSid: string | null | undefined;
}): { identity: ResolvedIdentity; cookies: CookieDirective[] } {
  const cookies: CookieDirective[] = [];
  const haveVid = isValidUuid(args.cookieVid);
  const haveSid = isValidUuid(args.cookieSid);

  const visitorId = haveVid ? (args.cookieVid as string) : randomUUID();
  const sessionId = haveSid ? (args.cookieSid as string) : randomUUID();

  if (!haveVid) {
    cookies.push({
      name: VISITOR_COOKIE,
      value: visitorId,
      maxAge: VISITOR_TTL_SECONDS,
    });
  }
  if (!haveSid) {
    cookies.push({
      name: SESSION_COOKIE,
      value: sessionId,
      maxAge: SESSION_IDLE_SECONDS,
    });
  } else {
    /* Slide the session cookie forward on every view so a long but
     * continuously-active session does not expire mid-flow. */
    cookies.push({
      name: SESSION_COOKIE,
      value: sessionId,
      maxAge: SESSION_IDLE_SECONDS,
    });
  }

  return {
    identity: {
      visitorId,
      sessionId,
      visitorIsNew: !haveVid,
      sessionIsNew: !haveSid,
    },
    cookies,
  };
}

/**
 * Read the session id from the dbj_sid cookie on an incoming request.
 * Returns null if the cookie is missing or malformed. Used by the
 * scan and contact endpoints to attribute conversions back to the
 * originating session without requiring a client-side round-trip.
 */
export function readSessionIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k === SESSION_COOKIE && isValidUuid(v)) return v;
  }
  return null;
}

export function serializeCookie(d: CookieDirective): string {
  /* httpOnly so the client beacon cannot read it back; sameSite=lax
   * because we only set the cookie on first-party POST and need it
   * sent on subsequent first-party navigations; secure in production
   * (Vercel always serves HTTPS); path=/ so all routes see it. */
  const secureFlag = process.env.NODE_ENV === "production" ? "Secure;" : "";
  return `${d.name}=${d.value}; Max-Age=${d.maxAge}; Path=/; SameSite=Lax; HttpOnly; ${secureFlag}`.trim();
}
