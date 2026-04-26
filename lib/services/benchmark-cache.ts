import { Redis } from "@upstash/redis";
import type { IndustryBenchmark } from "@/lib/types/scan";

const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;

let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!redisClient) {
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

function buildKey(
  vertical: string | undefined,
  businessModel: "B2B" | "B2C" | "mixed" | undefined,
  parent: string | undefined
): string | null {
  const v = (vertical ?? "").trim().toLowerCase();
  if (!v || v === "general") return null;
  const m = (businessModel ?? "B2C").toLowerCase();
  const p = (parent ?? "other").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const safe = v.replace(/[^a-z0-9]+/g, "-").slice(0, 80);
  return `pathlight:bench:${m}:${p}:${safe}`;
}

export async function getCachedBenchmark(
  vertical: string | undefined,
  businessModel: "B2B" | "B2C" | "mixed" | undefined,
  parent: string | undefined
): Promise<IndustryBenchmark | null> {
  const redis = getRedis();
  if (!redis) return null;
  const key = buildKey(vertical, businessModel, parent);
  if (!key) return null;
  try {
    const cached = await redis.get<IndustryBenchmark>(key);
    return cached ?? null;
  } catch (err) {
    console.warn("[benchmark-cache] read failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function setCachedBenchmark(
  vertical: string | undefined,
  businessModel: "B2B" | "B2C" | "mixed" | undefined,
  parent: string | undefined,
  benchmark: IndustryBenchmark
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const key = buildKey(vertical, businessModel, parent);
  if (!key) return;
  try {
    await redis.set(key, benchmark, { ex: CACHE_TTL_SECONDS });
  } catch (err) {
    console.warn("[benchmark-cache] write failed:", err instanceof Error ? err.message : err);
  }
}
