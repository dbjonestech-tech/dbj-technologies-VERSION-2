import { Redis } from "@upstash/redis";

/**
 * Sentry summary service.
 *
 * Pulls top issues from Sentry's REST API and caches the result in
 * Upstash Redis for 5 minutes so dashboard renders are cheap. The
 * dashboard only needs the highest-signal data: top 25 issues with
 * count, last seen, level, and a deep link back to Sentry for
 * stack/breadcrumbs.
 *
 * Required env:
 *   SENTRY_AUTH_TOKEN     personal token with project:read scope
 *   SENTRY_ORG_SLUG       e.g. "dbj-technologies"
 *   SENTRY_PROJECT_SLUG   e.g. "dbj-technologies"
 */

const SENTRY_API = "https://sentry.io/api/0";
const CACHE_KEY = "admin:sentry:top-issues";
const CACHE_TTL_S = 300;

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

export type SentryIssue = {
  id: string;
  shortId: string;
  title: string;
  culprit: string | null;
  level: string;
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
};

type RawSentryIssue = {
  id: string;
  shortId?: string;
  title: string;
  culprit?: string | null;
  level: string;
  count: string | number;
  userCount: string | number;
  firstSeen: string;
  lastSeen: string;
  permalink?: string;
};

async function fetchTopIssuesFromSentry(): Promise<SentryIssue[] | null> {
  const token = process.env.SENTRY_AUTH_TOKEN;
  const org = process.env.SENTRY_ORG_SLUG;
  const project = process.env.SENTRY_PROJECT_SLUG;
  if (!token || !org || !project) return null;

  try {
    const url = new URL(`/projects/${org}/${project}/issues/`, `${SENTRY_API}/`);
    url.searchParams.set("query", "is:unresolved");
    url.searchParams.set("statsPeriod", "24h");
    url.searchParams.set("sort", "freq");
    url.searchParams.set("limit", "25");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`[sentry] issues fetch failed: ${res.status}`);
      return null;
    }
    const data = (await res.json()) as RawSentryIssue[];
    return data.map((r) => ({
      id: r.id,
      shortId: r.shortId ?? r.id,
      title: r.title,
      culprit: r.culprit ?? null,
      level: r.level,
      count: Number(r.count),
      userCount: Number(r.userCount),
      firstSeen: r.firstSeen,
      lastSeen: r.lastSeen,
      permalink: r.permalink ?? `https://sentry.io/organizations/${org}/issues/${r.id}/`,
    }));
  } catch (err) {
    console.warn(
      `[sentry] fetch threw: ${err instanceof Error ? err.message : err}`
    );
    return null;
  }
}

export async function getTopSentryIssues(): Promise<SentryIssue[]> {
  const cache = getRedis();
  if (cache) {
    try {
      const cached = await cache.get<SentryIssue[]>(CACHE_KEY);
      if (cached && Array.isArray(cached)) return cached;
    } catch {
      /* fall through to live fetch */
    }
  }
  const fresh = await fetchTopIssuesFromSentry();
  if (!fresh) return [];
  if (cache) {
    try {
      await cache.set(CACHE_KEY, fresh, { ex: CACHE_TTL_S });
    } catch {
      /* cache failure is fine, the read just hit the API */
    }
  }
  return fresh;
}
