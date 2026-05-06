import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimitResult = { success: boolean; remaining: number };

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const emailRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "24 h"),
  prefix: "pathlight:rl:email",
  analytics: false,
});

const ipRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "24 h"),
  prefix: "pathlight:rl:ip",
  analytics: false,
});

/* PDF generation is the only billed-per-render cost vector tied to an
   anonymous endpoint (UUID-only auth on /pathlight/[scanId]). 20/24h
   per IP covers legitimate refresh + multi-device patterns without
   letting a single attacker rack up Browserless cost. */
const pdfRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "24 h"),
  prefix: "pathlight:rl:pdf",
  analytics: false,
});

/* Chat streams Haiku tokens billed per turn. 100/24h per IP is generous
   for a human conversation across multiple shared-NAT users; the cost
   monitoring cron is the wide net for total spend, this is the per-IP
   floor. */
const chatRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "24 h"),
  prefix: "pathlight:rl:chat",
  analytics: false,
});

/* Per-scan chat ceiling. Even when many distinct IPs query the same
   scanId (compromised or shared link), the underlying Haiku spend on
   that one scan is capped. 60/24h is comfortably above what any honest
   conversation against a single report would need. */
const chatScanRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "24 h"),
  prefix: "pathlight:rl:chat-scan",
  analytics: false,
});

/* OG image proxy throttle. /api/og-image-proxy fetches third-party
   images on the report page (Wix-style hotlink-protected images that
   would otherwise fail to render in our preview card). Every proxy
   response sets a 24h public Cache-Control so the same image is only
   refetched after expiry; this limit is the per-IP floor to keep
   abuse traffic from racking up egress, since the request itself
   touches an external host with our server's bandwidth. 200/24h
   absorbs legitimate browse/refresh/multi-device patterns. */
const proxyImageRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, "24 h"),
  prefix: "pathlight:rl:proxy-image",
  analytics: false,
});

/* Sign-in throttle. Auth.js retries are user-driven (click button -> OAuth
   round-trip), so 10/min/IP is generous for legitimate use while throttling
   credential-stuffing or replay attempts. Keyed on IP because OAuth doesn't
   surface an attempted-email until after the Google round-trip. */
const signinRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "auth:rl:signin-ip",
  analytics: false,
});

/* Beacon ingestion limits. The /api/canopy/beacon/[contactId] endpoint
   is unauthenticated by design (CORS *, fires from the buyer's site)
   and the contactId is a sequential BIGSERIAL, so without these limits
   anyone can enumerate ids and flood attribution_beacon_data. The
   per-IP cap (60/min) handles a single attacker with one address; the
   per-contactId cap (600/hour) caps the total writes against any one
   contact even if the attacker rotates through many IPs. Both fail
   open if Upstash is unreachable so a rate-limiter outage never
   silently drops legitimate beacons. */
const beaconIpRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "canopy:rl:beacon-ip",
  analytics: false,
});

const beaconContactRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(600, "1 h"),
  prefix: "canopy:rl:beacon-contact",
  analytics: false,
});

export async function emailLimiter(email: string): Promise<LimitResult> {
  const { success, remaining } = await emailRatelimit.limit(email.toLowerCase());
  return { success, remaining };
}

export async function ipLimiter(ip: string): Promise<LimitResult> {
  const { success, remaining } = await ipRatelimit.limit(ip);
  return { success, remaining };
}

export async function pdfLimiter(ip: string): Promise<LimitResult> {
  const { success, remaining } = await pdfRatelimit.limit(ip);
  return { success, remaining };
}

export async function chatLimiter(ip: string): Promise<LimitResult> {
  const { success, remaining } = await chatRatelimit.limit(ip);
  return { success, remaining };
}

export async function chatScanLimiter(scanId: string): Promise<LimitResult> {
  const { success, remaining } = await chatScanRatelimit.limit(scanId);
  return { success, remaining };
}

export async function proxyImageLimiter(ip: string): Promise<LimitResult> {
  /* Fail-open if Upstash env is missing (local dev). The endpoint
     still validates scanId + URL against og_preview, so the rate
     limiter is defense-in-depth rather than the primary gate. */
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return { success: true, remaining: -1 };
  }
  try {
    const { success, remaining } = await proxyImageRatelimit.limit(ip);
    return { success, remaining };
  } catch (err) {
    console.error("[proxyImageLimiter] upstash error, allowing through:", err);
    return { success: true, remaining: -1 };
  }
}

export async function beaconIpLimiter(ip: string): Promise<LimitResult> {
  /* Fail-open: a rate-limiter outage must not silently drop beacons
     from a real buyer's site. The application-layer master toggle
     (attribution_beacon_enabled, default false) is the primary gate. */
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return { success: true, remaining: -1 };
  }
  try {
    const { success, remaining } = await beaconIpRatelimit.limit(ip);
    return { success, remaining };
  } catch (err) {
    console.error("[beaconIpLimiter] upstash error, allowing through:", err);
    return { success: true, remaining: -1 };
  }
}

export async function beaconContactLimiter(contactId: number): Promise<LimitResult> {
  /* Same fail-open posture as beaconIpLimiter. */
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return { success: true, remaining: -1 };
  }
  try {
    const { success, remaining } = await beaconContactRatelimit.limit(
      String(contactId)
    );
    return { success, remaining };
  } catch (err) {
    console.error("[beaconContactLimiter] upstash error, allowing through:", err);
    return { success: true, remaining: -1 };
  }
}

export async function signinLimiter(ip: string): Promise<LimitResult> {
  /* Fail-open: if Upstash env is missing (local dev) or Redis is
     transiently down, allow the sign-in through. A rate-limiter
     outage must never block legitimate auth. Google's own throttling
     remains the floor, and the audit log captures every attempt. */
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return { success: true, remaining: -1 };
  }
  try {
    const { success, remaining } = await signinRatelimit.limit(ip);
    return { success, remaining };
  } catch (err) {
    console.error("[signinLimiter] upstash error, allowing through:", err);
    return { success: true, remaining: -1 };
  }
}

/* Shared IP extraction. Vercel/Cloudflare set x-forwarded-for; falling
   back to x-real-ip then a sentinel keeps the limiter keyed on something
   stable rather than throwing. Keep "unknown" callers in their own
   bucket so an unknown-IP flood gets rate-limited together. */
export function extractIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
