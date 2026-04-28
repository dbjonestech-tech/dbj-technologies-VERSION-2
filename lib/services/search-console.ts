import { createSign } from "node:crypto";
import { getDb } from "@/lib/db";

/**
 * Google Search Console daily import.
 *
 * Auth: service-account JSON key passed via GOOGLE_SC_CREDENTIALS_JSON
 * (the full key file as a JSON string). The service account must be
 * granted "Restricted" or "Full" access to the GSC property in the GSC
 * permissions UI. Property URL comes from GOOGLE_SC_SITE_URL (e.g.
 * "sc-domain:dbjtechnologies.com" for domain properties or the full
 * https URL for URL-prefix properties).
 *
 * Why not the googleapis SDK: that package is ~10MB with hundreds of
 * dependencies. We only need one endpoint, so we sign a JWT inline
 * using node:crypto and call the REST endpoint directly. Same auth
 * the SDK uses, no transitive surface.
 *
 * Daily cron pulls the trailing 7 days. GSC's data lags 2-3 days; the
 * 7-day lookback with ON CONFLICT updates ensures late-arriving rows
 * land cleanly without the cron having to track watermarks itself.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SC_BASE = "https://searchconsole.googleapis.com";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

function loadServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SC_CREDENTIALS_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccount;
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch (err) {
    console.warn(
      `[search-console] credentials parse failed: ${err instanceof Error ? err.message : err}`
    );
    return null;
  }
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function getAccessToken(account: ServiceAccount): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(
    JSON.stringify({ alg: "RS256", typ: "JWT" })
  );
  const claim = base64UrlEncode(
    JSON.stringify({
      iss: account.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  );
  const toSign = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(toSign);
  signer.end();
  const signature = base64UrlEncode(
    signer.sign(account.private_key.replace(/\\n/g, "\n"))
  );
  const jwt = `${toSign}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.warn(
      `[search-console] token exchange failed: ${res.status} ${await res.text().catch(() => "")}`
    );
    return null;
  }
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

type SearchAnalyticsResponse = {
  rows?: Array<{
    keys: string[];
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
  }>;
};

async function fetchSearchAnalytics(args: {
  accessToken: string;
  siteUrl: string;
  startDate: string;
  endDate: string;
}): Promise<SearchAnalyticsResponse | null> {
  const path = `/webmasters/v3/sites/${encodeURIComponent(args.siteUrl)}/searchAnalytics/query`;
  const res = await fetch(`${SC_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate: args.startDate,
      endDate: args.endDate,
      dimensions: ["date", "page", "query", "country", "device"],
      rowLimit: 25000,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.warn(
      `[search-console] analytics fetch failed: ${res.status} ${await res.text().catch(() => "")}`
    );
    return null;
  }
  return (await res.json()) as SearchAnalyticsResponse;
}

function isoDate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function importSearchConsoleDaily(): Promise<{
  ok: boolean;
  rows: number;
  reason?: string;
}> {
  const account = loadServiceAccount();
  const siteUrl = process.env.GOOGLE_SC_SITE_URL;
  if (!account || !siteUrl) {
    return { ok: false, rows: 0, reason: "credentials_or_site_unset" };
  }

  const token = await getAccessToken(account);
  if (!token) return { ok: false, rows: 0, reason: "token_failed" };

  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 7);

  const data = await fetchSearchAnalytics({
    accessToken: token,
    siteUrl,
    startDate: isoDate(start),
    endDate: isoDate(end),
  });
  if (!data) return { ok: false, rows: 0, reason: "fetch_failed" };

  const sql = getDb();
  let imported = 0;
  for (const row of data.rows ?? []) {
    const [date, page, query, country, device] = row.keys;
    if (!date || !page || !query) continue;
    try {
      await sql`
        INSERT INTO search_console_daily
          (date, page, query, country, device, impressions, clicks, ctr, position, observed_at)
        VALUES (
          ${date}::date,
          ${page},
          ${query},
          ${country ?? "unknown"},
          ${device ?? "unknown"},
          ${row.impressions},
          ${row.clicks},
          ${row.ctr},
          ${row.position},
          now()
        )
        ON CONFLICT (date, page, query, country, device) DO UPDATE SET
          impressions = EXCLUDED.impressions,
          clicks = EXCLUDED.clicks,
          ctr = EXCLUDED.ctr,
          position = EXCLUDED.position,
          observed_at = now()
      `;
      imported += 1;
    } catch (err) {
      console.warn(
        `[search-console] insert failed: ${err instanceof Error ? err.message : err}`
      );
    }
  }

  return { ok: true, rows: imported };
}

/* ─────────────── Read APIs ─────────────── */

export type GscQueryRow = {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
};

export async function getTopQueries(
  daysBack: number,
  limit = 50
): Promise<GscQueryRow[]> {
  const sql = getDb();
  const days = Math.max(1, Math.min(90, daysBack));
  const rows = (await sql`
    SELECT query,
           SUM(impressions)::int AS impressions,
           SUM(clicks)::int AS clicks,
           CASE WHEN SUM(impressions) > 0 THEN SUM(clicks)::float8 / SUM(impressions) ELSE 0 END AS ctr,
           AVG(position)::float8 AS position
    FROM search_console_daily
    WHERE date > current_date - (${`${days} days`})::interval
    GROUP BY query
    ORDER BY clicks DESC
    LIMIT ${Math.max(1, Math.min(200, limit))}
  `) as Array<{ query: string; impressions: number; clicks: number; ctr: number; position: number }>;
  return rows.map((r) => ({
    query: r.query,
    impressions: Number(r.impressions),
    clicks: Number(r.clicks),
    ctr: Number(Number(r.ctr).toFixed(4)),
    position: Number(Number(r.position).toFixed(2)),
  }));
}

export type GscPageRow = {
  page: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
};

export async function getTopPages(
  daysBack: number,
  limit = 50
): Promise<GscPageRow[]> {
  const sql = getDb();
  const days = Math.max(1, Math.min(90, daysBack));
  const rows = (await sql`
    SELECT page,
           SUM(impressions)::int AS impressions,
           SUM(clicks)::int AS clicks,
           CASE WHEN SUM(impressions) > 0 THEN SUM(clicks)::float8 / SUM(impressions) ELSE 0 END AS ctr,
           AVG(position)::float8 AS position
    FROM search_console_daily
    WHERE date > current_date - (${`${days} days`})::interval
    GROUP BY page
    ORDER BY clicks DESC
    LIMIT ${Math.max(1, Math.min(200, limit))}
  `) as Array<{ page: string; impressions: number; clicks: number; ctr: number; position: number }>;
  return rows.map((r) => ({
    page: r.page,
    impressions: Number(r.impressions),
    clicks: Number(r.clicks),
    ctr: Number(Number(r.ctr).toFixed(4)),
    position: Number(Number(r.position).toFixed(2)),
  }));
}

export type GscOpportunityRow = {
  page: string;
  query: string;
  impressions: number;
  clicks: number;
  position: number;
};

/**
 * Pages with high impressions but low CTR + position 5-15. These are
 * the title/meta-description rewrite candidates.
 */
export async function getOpportunities(
  daysBack: number,
  limit = 25
): Promise<GscOpportunityRow[]> {
  const sql = getDb();
  const days = Math.max(1, Math.min(90, daysBack));
  const rows = (await sql`
    SELECT page, query,
           SUM(impressions)::int AS impressions,
           SUM(clicks)::int AS clicks,
           AVG(position)::float8 AS position
    FROM search_console_daily
    WHERE date > current_date - (${`${days} days`})::interval
    GROUP BY page, query
    HAVING SUM(impressions) >= 50
       AND AVG(position) BETWEEN 5 AND 15
    ORDER BY SUM(impressions) DESC, AVG(position) ASC
    LIMIT ${Math.max(1, Math.min(100, limit))}
  `) as Array<{ page: string; query: string; impressions: number; clicks: number; position: number }>;
  return rows.map((r) => ({
    page: r.page,
    query: r.query,
    impressions: Number(r.impressions),
    clicks: Number(r.clicks),
    position: Number(Number(r.position).toFixed(2)),
  }));
}
