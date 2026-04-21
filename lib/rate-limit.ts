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

export async function emailLimiter(email: string): Promise<LimitResult> {
  const { success, remaining } = await emailRatelimit.limit(email.toLowerCase());
  return { success, remaining };
}

export async function ipLimiter(ip: string): Promise<LimitResult> {
  const { success, remaining } = await ipRatelimit.limit(ip);
  return { success, remaining };
}
