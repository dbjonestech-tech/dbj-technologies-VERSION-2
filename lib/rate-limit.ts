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
