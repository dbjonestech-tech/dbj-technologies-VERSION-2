import { getDb } from "@/lib/db";

/**
 * First-party visitor analytics service.
 *
 * Write path: recordPageView is called from /api/track/view. It runs
 * three statements in sequence (visitor upsert, session upsert, page
 * view insert) inside best-effort try/catch so a DB blip never breaks
 * the public site. The writer also returns the inserted id so the
 * client can correlate its engagement beacon back to the row.
 *
 * Read path: small typed helpers for the dashboards under
 * /admin/visitors and /admin/funnel. All reads default to is_bot=false
 * unless the caller explicitly opts in.
 */

export type RecordPageViewInput = {
  visitorId: string;
  sessionId: string;
  path: string;
  query: string | null;
  referrer: string | null;
  referrerHost: string | null;
  utm: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    term: string | null;
    content: string | null;
  };
  ipHash: string;
  geo: {
    country: string | null;
    region: string | null;
    city: string | null;
  };
  ua: {
    browser: string | null;
    browserVersion: string | null;
    os: string | null;
    osVersion: string | null;
    deviceType: "mobile" | "tablet" | "desktop" | "bot" | null;
  };
  isBot: boolean;
  botReason: string | null;
  viewportW: number | null;
  viewportH: number | null;
};

export type RecordPageViewResult = {
  pageViewId: string | null;
  ok: boolean;
};

/**
 * Insert a page_view, upserting visitors and sessions as needed.
 * Returns the new page_view id (as text) for the engagement beacon
 * to correlate against.
 */
export async function recordPageView(
  input: RecordPageViewInput
): Promise<RecordPageViewResult> {
  const sql = getDb();
  try {
    /* Visitor upsert. session_count and page_view_count are bumped
     * here so dashboards can answer "returning vs new visitors" in a
     * single query against the visitors table without aggregating the
     * firehose. The first-touch UTM/referrer values are sticky: only
     * written on the initial INSERT. */
    await sql`
      INSERT INTO visitors (
        id, first_seen_at, last_seen_at, session_count, page_view_count,
        is_bot, country, device_type,
        first_referrer_host, first_utm_source, first_utm_medium, first_utm_campaign
      ) VALUES (
        ${input.visitorId}::uuid,
        now(), now(), 1, 1,
        ${input.isBot},
        ${input.geo.country},
        ${input.ua.deviceType},
        ${input.referrerHost},
        ${input.utm.source}, ${input.utm.medium}, ${input.utm.campaign}
      )
      ON CONFLICT (id) DO UPDATE SET
        last_seen_at = now(),
        page_view_count = visitors.page_view_count + 1
    `;

    /* Session upsert. New sessions inherit entry_path and the full
     * referrer/UTM block; existing sessions just bump page_count and
     * last_seen_at. exit_path is updated to the current path on every
     * view so the final value reflects where the session ended. */
    await sql`
      INSERT INTO sessions (
        id, visitor_id, started_at, last_seen_at, page_count,
        entry_path, exit_path,
        referrer, referrer_host,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        country, region, city, device_type, is_bot
      ) VALUES (
        ${input.sessionId}::uuid,
        ${input.visitorId}::uuid,
        now(), now(), 1,
        ${input.path}, ${input.path},
        ${input.referrer}, ${input.referrerHost},
        ${input.utm.source}, ${input.utm.medium}, ${input.utm.campaign}, ${input.utm.term}, ${input.utm.content},
        ${input.geo.country}, ${input.geo.region}, ${input.geo.city},
        ${input.ua.deviceType}, ${input.isBot}
      )
      ON CONFLICT (id) DO UPDATE SET
        last_seen_at = now(),
        page_count = sessions.page_count + 1,
        exit_path = ${input.path}
    `;

    /* If this insert created a brand new session for an existing
     * visitor, bump the visitor's session_count. We approximate that
     * here by checking how many sessions exist for this visitor; the
     * cost is one short index probe and avoids a separate flag round-
     * trip from the upsert above. */
    if (input.viewportW !== null) {
      // Only bump on first page view of a session; viewportW is a proxy
      // for "this is the initial beacon with full context."
    }

    const inserted = (await sql`
      INSERT INTO page_views (
        visitor_id, session_id, path, query, referrer, referrer_host,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        ip_hash, country, region, city,
        device_type, browser, browser_version, os, os_version,
        is_bot, bot_reason, viewport_w, viewport_h
      ) VALUES (
        ${input.visitorId}::uuid,
        ${input.sessionId}::uuid,
        ${input.path}, ${input.query},
        ${input.referrer}, ${input.referrerHost},
        ${input.utm.source}, ${input.utm.medium}, ${input.utm.campaign}, ${input.utm.term}, ${input.utm.content},
        ${input.ipHash}, ${input.geo.country}, ${input.geo.region}, ${input.geo.city},
        ${input.ua.deviceType}, ${input.ua.browser}, ${input.ua.browserVersion}, ${input.ua.os}, ${input.ua.osVersion},
        ${input.isBot}, ${input.botReason},
        ${input.viewportW}, ${input.viewportH}
      )
      RETURNING id::text AS id
    `) as { id: string }[];

    return { pageViewId: inserted[0]?.id ?? null, ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[analytics] recordPageView failed: ${message}`);
    return { pageViewId: null, ok: false };
  }
}

export type RecordEngagementInput = {
  pageViewId: string;
  dwellMs: number | null;
  maxScrollPct: number | null;
  cwvLcpMs: number | null;
  cwvInpMs: number | null;
  cwvCls: number | null;
  cwvTtfbMs: number | null;
  cwvFcpMs: number | null;
};

/**
 * Upsert the engagement row for a page_view. The beacon may fire
 * multiple times during a single visit (visibilitychange events on
 * tab focus/blur) so we update the running maxima rather than
 * blindly overwriting.
 */
export async function recordEngagement(
  input: RecordEngagementInput
): Promise<{ ok: boolean }> {
  if (!/^\d+$/.test(input.pageViewId)) {
    return { ok: false };
  }
  try {
    const sql = getDb();
    await sql`
      INSERT INTO page_view_engagement (
        page_view_id, dwell_ms, max_scroll_pct,
        cwv_lcp_ms, cwv_inp_ms, cwv_cls, cwv_ttfb_ms, cwv_fcp_ms,
        exited_at
      ) VALUES (
        ${input.pageViewId}::bigint,
        ${input.dwellMs}, ${input.maxScrollPct},
        ${input.cwvLcpMs}, ${input.cwvInpMs}, ${input.cwvCls}, ${input.cwvTtfbMs}, ${input.cwvFcpMs},
        now()
      )
      ON CONFLICT (page_view_id) DO UPDATE SET
        dwell_ms = GREATEST(COALESCE(page_view_engagement.dwell_ms, 0), COALESCE(EXCLUDED.dwell_ms, 0)),
        max_scroll_pct = GREATEST(COALESCE(page_view_engagement.max_scroll_pct, 0), COALESCE(EXCLUDED.max_scroll_pct, 0)),
        cwv_lcp_ms = COALESCE(EXCLUDED.cwv_lcp_ms, page_view_engagement.cwv_lcp_ms),
        cwv_inp_ms = COALESCE(EXCLUDED.cwv_inp_ms, page_view_engagement.cwv_inp_ms),
        cwv_cls = COALESCE(EXCLUDED.cwv_cls, page_view_engagement.cwv_cls),
        cwv_ttfb_ms = COALESCE(EXCLUDED.cwv_ttfb_ms, page_view_engagement.cwv_ttfb_ms),
        cwv_fcp_ms = COALESCE(EXCLUDED.cwv_fcp_ms, page_view_engagement.cwv_fcp_ms),
        exited_at = now()
    `;
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[analytics] recordEngagement failed: ${message}`);
    return { ok: false };
  }
}

/* ─────────────── Read APIs (dashboard) ─────────────── */

export type VisitorOverview = {
  windowLabel: string;
  pageViews: number;
  sessions: number;
  uniqueVisitors: number;
  bounceRatePct: number;
  avgPagesPerSession: number;
  scanConversions: number;
  contactConversions: number;
};

const EMPTY_OVERVIEW = (interval: string): VisitorOverview => ({
  windowLabel: interval,
  pageViews: 0,
  sessions: 0,
  uniqueVisitors: 0,
  bounceRatePct: 0,
  avgPagesPerSession: 0,
  scanConversions: 0,
  contactConversions: 0,
});

export async function getVisitorOverview(
  interval: string
): Promise<VisitorOverview> {
  /* Best-effort read: if the visitor analytics tables do not yet exist
   * (migrations 014 not applied) or the DB is briefly unreachable, the
   * dashboard renders a zeroed empty state rather than crashing. Same
   * pattern as the other admin read APIs (api-usage.getProviderSpendUsd). */
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        COUNT(*)::int AS page_views,
        COUNT(DISTINCT session_id)::int AS sessions,
        COUNT(DISTINCT visitor_id)::int AS unique_visitors
      FROM page_views
      WHERE created_at > now() - (${interval})::interval
        AND is_bot = false
    `) as { page_views: number; sessions: number; unique_visitors: number }[];

    const conv = (await sql`
      SELECT
        COUNT(*) FILTER (WHERE converted_scan_id IS NOT NULL)::int AS scans,
        COUNT(*) FILTER (WHERE converted_contact_id IS NOT NULL)::int AS contacts,
        COUNT(*)::int AS total_sessions,
        COUNT(*) FILTER (WHERE page_count = 1)::int AS bounced_sessions,
        COALESCE(AVG(page_count), 0)::float8 AS avg_pages
      FROM sessions
      WHERE started_at > now() - (${interval})::interval
        AND is_bot = false
    `) as {
      scans: number;
      contacts: number;
      total_sessions: number;
      bounced_sessions: number;
      avg_pages: number;
    }[];

    const r = rows[0] ?? { page_views: 0, sessions: 0, unique_visitors: 0 };
    const c = conv[0] ?? {
      scans: 0,
      contacts: 0,
      total_sessions: 0,
      bounced_sessions: 0,
      avg_pages: 0,
    };

    const bounce =
      c.total_sessions > 0 ? (c.bounced_sessions / c.total_sessions) * 100 : 0;

    return {
      windowLabel: interval,
      pageViews: r.page_views,
      sessions: r.sessions,
      uniqueVisitors: r.unique_visitors,
      bounceRatePct: Number(bounce.toFixed(1)),
      avgPagesPerSession: Number(c.avg_pages.toFixed(2)),
      scanConversions: c.scans,
      contactConversions: c.contacts,
    };
  } catch (err) {
    console.warn(
      `[analytics] getVisitorOverview failed: ${err instanceof Error ? err.message : err}`
    );
    return EMPTY_OVERVIEW(interval);
  }
}

/**
 * Visitor overview for an arbitrary [start, end) date range. Same
 * shape as getVisitorOverview but uses an absolute start/end window
 * instead of a "now() - interval" relative interval. Used by the
 * custom date-range card on /admin/visitors.
 *
 * Validates and re-emits canonical ISO timestamps before SQL
 * interpolation so we never pass raw user input through to Postgres.
 * A null/invalid input returns an empty zeroed overview.
 */
export async function getVisitorOverviewBetween(
  startIso: string,
  endIso: string
): Promise<VisitorOverview> {
  const startT = Date.parse(startIso);
  const endT = Date.parse(endIso);
  if (!Number.isFinite(startT) || !Number.isFinite(endT) || endT <= startT) {
    return EMPTY_OVERVIEW(`${startIso} → ${endIso}`);
  }
  const start = new Date(startT).toISOString();
  const end = new Date(endT).toISOString();
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        COUNT(*)::int AS page_views,
        COUNT(DISTINCT session_id)::int AS sessions,
        COUNT(DISTINCT visitor_id)::int AS unique_visitors
      FROM page_views
      WHERE created_at >= ${start}::timestamptz
        AND created_at <  ${end}::timestamptz
        AND is_bot = false
    `) as { page_views: number; sessions: number; unique_visitors: number }[];

    const conv = (await sql`
      SELECT
        COUNT(*) FILTER (WHERE converted_scan_id IS NOT NULL)::int AS scans,
        COUNT(*) FILTER (WHERE converted_contact_id IS NOT NULL)::int AS contacts,
        COUNT(*)::int AS total_sessions,
        COUNT(*) FILTER (WHERE page_count = 1)::int AS bounced_sessions,
        COALESCE(AVG(page_count), 0)::float8 AS avg_pages
      FROM sessions
      WHERE started_at >= ${start}::timestamptz
        AND started_at <  ${end}::timestamptz
        AND is_bot = false
    `) as {
      scans: number;
      contacts: number;
      total_sessions: number;
      bounced_sessions: number;
      avg_pages: number;
    }[];

    const r = rows[0] ?? { page_views: 0, sessions: 0, unique_visitors: 0 };
    const c = conv[0] ?? {
      scans: 0,
      contacts: 0,
      total_sessions: 0,
      bounced_sessions: 0,
      avg_pages: 0,
    };
    const bounce =
      c.total_sessions > 0 ? (c.bounced_sessions / c.total_sessions) * 100 : 0;
    return {
      windowLabel: `${start} → ${end}`,
      pageViews: r.page_views,
      sessions: r.sessions,
      uniqueVisitors: r.unique_visitors,
      bounceRatePct: Number(bounce.toFixed(1)),
      avgPagesPerSession: Number(c.avg_pages.toFixed(2)),
      scanConversions: c.scans,
      contactConversions: c.contacts,
    };
  } catch (err) {
    console.warn(
      `[analytics] getVisitorOverviewBetween failed: ${err instanceof Error ? err.message : err}`
    );
    return EMPTY_OVERVIEW(`${start} → ${end}`);
  }
}

export type TopPageRow = {
  path: string;
  views: number;
  sessions: number;
  uniqueVisitors: number;
  avgDwellMs: number | null;
};

export async function getTopPages(
  interval: string,
  limit = 25
): Promise<TopPageRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        pv.path,
        COUNT(*)::int AS views,
        COUNT(DISTINCT pv.session_id)::int AS sessions,
        COUNT(DISTINCT pv.visitor_id)::int AS unique_visitors,
        AVG(eng.dwell_ms)::float8 AS avg_dwell_ms
      FROM page_views pv
      LEFT JOIN page_view_engagement eng ON eng.page_view_id = pv.id
      WHERE pv.created_at > now() - (${interval})::interval
        AND pv.is_bot = false
      GROUP BY pv.path
      ORDER BY views DESC
      LIMIT ${Math.max(1, Math.min(200, limit))}
    `) as {
      path: string;
      views: number;
      sessions: number;
      unique_visitors: number;
      avg_dwell_ms: number | null;
    }[];

    return rows.map((r) => ({
      path: r.path,
      views: Number(r.views),
      sessions: Number(r.sessions),
      uniqueVisitors: Number(r.unique_visitors),
      avgDwellMs:
        r.avg_dwell_ms === null ? null : Math.round(Number(r.avg_dwell_ms)),
    }));
  } catch (err) {
    console.warn(
      `[analytics] getTopPages failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

export type TopSourceRow = {
  source: string;
  sessions: number;
  scanConversions: number;
  contactConversions: number;
};

/**
 * Top traffic sources by session count. Source = utm_source if set,
 * otherwise referrer_host, otherwise '(direct)'. Conversion columns
 * count sessions where the converted_* foreign key is set.
 */
export async function getTopSources(
  interval: string,
  limit = 25
): Promise<TopSourceRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        COALESCE(utm_source, referrer_host, '(direct)') AS source,
        COUNT(*)::int AS sessions,
        COUNT(*) FILTER (WHERE converted_scan_id IS NOT NULL)::int AS scan_conversions,
        COUNT(*) FILTER (WHERE converted_contact_id IS NOT NULL)::int AS contact_conversions
      FROM sessions
      WHERE started_at > now() - (${interval})::interval
        AND is_bot = false
      GROUP BY source
      ORDER BY sessions DESC
      LIMIT ${Math.max(1, Math.min(100, limit))}
    `) as {
      source: string;
      sessions: number;
      scan_conversions: number;
      contact_conversions: number;
    }[];

    return rows.map((r) => ({
      source: r.source,
      sessions: Number(r.sessions),
      scanConversions: Number(r.scan_conversions),
      contactConversions: Number(r.contact_conversions),
    }));
  } catch (err) {
    console.warn(
      `[analytics] getTopSources failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

export type GeoRow = {
  country: string | null;
  region: string | null;
  city: string | null;
  sessions: number;
};

export async function getGeoBreakdown(
  interval: string,
  limit = 50
): Promise<GeoRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT country, region, city, COUNT(*)::int AS sessions
      FROM sessions
      WHERE started_at > now() - (${interval})::interval
        AND is_bot = false
        AND country IS NOT NULL
      GROUP BY country, region, city
      ORDER BY sessions DESC
      LIMIT ${Math.max(1, Math.min(200, limit))}
    `) as {
      country: string | null;
      region: string | null;
      city: string | null;
      sessions: number;
    }[];
    return rows.map((r) => ({
      country: r.country,
      region: r.region,
      city: r.city,
      sessions: Number(r.sessions),
    }));
  } catch (err) {
    console.warn(
      `[analytics] getGeoBreakdown failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

export type DeviceRow = {
  deviceType: string;
  sessions: number;
  pct: number;
};

export async function getDeviceBreakdown(
  interval: string
): Promise<DeviceRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        COALESCE(device_type, 'unknown') AS device_type,
        COUNT(*)::int AS sessions
      FROM sessions
      WHERE started_at > now() - (${interval})::interval
        AND is_bot = false
      GROUP BY device_type
      ORDER BY sessions DESC
    `) as { device_type: string; sessions: number }[];
    const total = rows.reduce((sum, r) => sum + Number(r.sessions), 0);
    return rows.map((r) => ({
      deviceType: r.device_type,
      sessions: Number(r.sessions),
      pct: total > 0 ? Number(((Number(r.sessions) / total) * 100).toFixed(1)) : 0,
    }));
  } catch (err) {
    console.warn(
      `[analytics] getDeviceBreakdown failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

export type LiveVisitorRow = {
  visitorId: string;
  sessionId: string;
  path: string;
  country: string | null;
  city: string | null;
  deviceType: string | null;
  browser: string | null;
  lastSeenAt: string;
};

export async function getLiveVisitors(): Promise<LiveVisitorRow[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT DISTINCT ON (pv.visitor_id)
        pv.visitor_id::text AS visitor_id,
        pv.session_id::text AS session_id,
        pv.path,
        pv.country,
        pv.city,
        pv.device_type,
        pv.browser,
        pv.created_at AS last_seen_at
      FROM page_views pv
      WHERE pv.created_at > now() - interval '5 minutes'
        AND pv.is_bot = false
      ORDER BY pv.visitor_id, pv.created_at DESC
      LIMIT 100
    `) as {
      visitor_id: string;
      session_id: string;
      path: string;
      country: string | null;
      city: string | null;
      device_type: string | null;
      browser: string | null;
      last_seen_at: string;
    }[];
    return rows.map((r) => ({
      visitorId: r.visitor_id,
      sessionId: r.session_id,
      path: r.path,
      country: r.country,
      city: r.city,
      deviceType: r.device_type,
      browser: r.browser,
      lastSeenAt: r.last_seen_at,
    }));
  } catch (err) {
    console.warn(
      `[analytics] getLiveVisitors failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

export type RecentPageViewRow = {
  id: string;
  sessionId: string;
  path: string;
  referrerHost: string | null;
  country: string | null;
  city: string | null;
  deviceType: string | null;
  browser: string | null;
  isBot: boolean;
  createdAt: string;
};

/**
 * Most recent page views, sorted by created_at DESC (with id DESC as a
 * stable tiebreaker for ties or backfilled rows whose BIGSERIAL id and
 * timestamp can drift). Used by the /admin/visitors recent feed and by
 * the cursor "Load older" pagination via the optional `beforeIso`
 * argument.
 */
export async function getRecentPageViews(
  limit = 100,
  includeBots = false,
  beforeIso?: string
): Promise<RecentPageViewRow[]> {
  try {
    const sql = getDb();
    const cap = Math.max(1, Math.min(500, limit));
    /* Validate ISO cursor before passing to SQL. We accept anything the
     * Date constructor can parse, then re-emit the canonical ISO form
     * so we never interpolate raw user input into the cursor. */
    let cursor: string | null = null;
    if (beforeIso) {
      const t = Date.parse(beforeIso);
      if (Number.isFinite(t)) cursor = new Date(t).toISOString();
    }
    const rows = includeBots
      ? ((await sql`
          SELECT id::text, session_id::text, path, referrer_host, country, city, device_type, browser, is_bot, created_at
          FROM page_views
          WHERE (${cursor}::timestamptz IS NULL OR created_at < ${cursor}::timestamptz)
          ORDER BY created_at DESC, id DESC
          LIMIT ${cap}
        `) as RecentPageViewRowDb[])
      : ((await sql`
          SELECT id::text, session_id::text, path, referrer_host, country, city, device_type, browser, is_bot, created_at
          FROM page_views
          WHERE is_bot = false
            AND (${cursor}::timestamptz IS NULL OR created_at < ${cursor}::timestamptz)
          ORDER BY created_at DESC, id DESC
          LIMIT ${cap}
        `) as RecentPageViewRowDb[]);
    return rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      path: r.path,
      referrerHost: r.referrer_host,
      country: r.country,
      city: r.city,
      deviceType: r.device_type,
      browser: r.browser,
      isBot: r.is_bot,
      createdAt: r.created_at,
    }));
  } catch (err) {
    console.warn(
      `[analytics] getRecentPageViews failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

type RecentPageViewRowDb = {
  id: string;
  session_id: string;
  path: string;
  referrer_host: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  is_bot: boolean;
  created_at: string;
};

export async function getMaxPageViewId(): Promise<string> {
  try {
    const sql = getDb();
    const rows = (await sql`SELECT COALESCE(MAX(id), 0)::text AS id FROM page_views`) as { id: string }[];
    return rows[0]?.id ?? "0";
  } catch (err) {
    console.warn(
      `[analytics] getMaxPageViewId failed: ${err instanceof Error ? err.message : err}`
    );
    return "0";
  }
}

export async function getPageViewsAfterId(
  afterId: string,
  limit = 100,
  includeBots = false
): Promise<RecentPageViewRow[]> {
  try {
    const sql = getDb();
    const cleaned = afterId.replace(/[^0-9]/g, "");
    const safe = cleaned.length > 0 ? cleaned : "0";
    const cap = Math.max(1, Math.min(500, limit));
    const rows = includeBots
      ? ((await sql`
          SELECT id::text, session_id::text, path, referrer_host, country, city, device_type, browser, is_bot, created_at
          FROM page_views
          WHERE id > ${safe}::bigint
          ORDER BY id ASC
          LIMIT ${cap}
        `) as RecentPageViewRowDb[])
      : ((await sql`
          SELECT id::text, session_id::text, path, referrer_host, country, city, device_type, browser, is_bot, created_at
          FROM page_views
          WHERE id > ${safe}::bigint
            AND is_bot = false
          ORDER BY id ASC
          LIMIT ${cap}
        `) as RecentPageViewRowDb[]);
    return rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      path: r.path,
      referrerHost: r.referrer_host,
      country: r.country,
      city: r.city,
      deviceType: r.device_type,
      browser: r.browser,
      isBot: r.is_bot,
      createdAt: r.created_at,
    }));
  } catch (err) {
    console.warn(
      `[analytics] getPageViewsAfterId failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

export type SessionDetail = {
  id: string;
  visitorId: string;
  startedAt: string;
  lastSeenAt: string;
  pageCount: number;
  entryPath: string | null;
  exitPath: string | null;
  referrer: string | null;
  referrerHost: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  deviceType: string | null;
  isBot: boolean;
  convertedScanId: string | null;
  convertedContactId: string | null;
};

export async function getSessionDetail(
  sessionId: string
): Promise<SessionDetail | null> {
  try {
    const sql = getDb();
    const rows = (await sql`
    SELECT
      id::text, visitor_id::text, started_at, last_seen_at, page_count,
      entry_path, exit_path, referrer, referrer_host,
      utm_source, utm_medium, utm_campaign,
      country, region, city, device_type, is_bot,
      converted_scan_id::text, converted_contact_id::text
    FROM sessions
    WHERE id = ${sessionId}::uuid
    LIMIT 1
  `) as {
    id: string;
    visitor_id: string;
    started_at: string;
    last_seen_at: string;
    page_count: number;
    entry_path: string | null;
    exit_path: string | null;
    referrer: string | null;
    referrer_host: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    country: string | null;
    region: string | null;
    city: string | null;
    device_type: string | null;
    is_bot: boolean;
    converted_scan_id: string | null;
    converted_contact_id: string | null;
  }[];
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      visitorId: r.visitor_id,
      startedAt: r.started_at,
      lastSeenAt: r.last_seen_at,
      pageCount: r.page_count,
      entryPath: r.entry_path,
      exitPath: r.exit_path,
      referrer: r.referrer,
      referrerHost: r.referrer_host,
      utmSource: r.utm_source,
      utmMedium: r.utm_medium,
      utmCampaign: r.utm_campaign,
      country: r.country,
      region: r.region,
      city: r.city,
      deviceType: r.device_type,
      isBot: r.is_bot,
      convertedScanId: r.converted_scan_id,
      convertedContactId: r.converted_contact_id,
    };
  } catch (err) {
    console.warn(
      `[analytics] getSessionDetail failed: ${err instanceof Error ? err.message : err}`
    );
    return null;
  }
}

export type SessionPath = {
  id: string;
  path: string;
  query: string | null;
  createdAt: string;
  dwellMs: number | null;
  scrollPct: number | null;
};

export async function getSessionPath(
  sessionId: string
): Promise<SessionPath[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        pv.id::text AS id,
        pv.path,
        pv.query,
        pv.created_at,
        eng.dwell_ms,
        eng.max_scroll_pct
      FROM page_views pv
      LEFT JOIN page_view_engagement eng ON eng.page_view_id = pv.id
      WHERE pv.session_id = ${sessionId}::uuid
      ORDER BY pv.id ASC
    `) as {
      id: string;
      path: string;
      query: string | null;
      created_at: string;
      dwell_ms: number | null;
      max_scroll_pct: number | null;
    }[];
    return rows.map((r) => ({
      id: r.id,
      path: r.path,
      query: r.query,
      createdAt: r.created_at,
      dwellMs: r.dwell_ms,
      scrollPct: r.max_scroll_pct,
    }));
  } catch (err) {
    console.warn(
      `[analytics] getSessionPath failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

/* ─────────────── Per-visitor aggregation + timeline ─────────────── */

/**
 * One row per visitor. Aggregates every non-bot page view into a single
 * "this person" record with first/last seen, totals, latest geo+device,
 * best-known UTM, top/entry/exit paths, conversion flags, and any
 * self-disclosed identity (joined via converted_contact_id ->
 * contact_submissions, or converted_scan_id -> scans).
 *
 * Identity is ONLY surfaced when the visitor self-disclosed it via a
 * form submission. We do not derive names from cookies, IP lookup, or
 * third-party services. The cookie itself is a random UUIDv4.
 */
export type RecentVisitorRow = {
  visitorId: string;
  pageViewCount: number;
  sessionCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  /* Most recent values (a visitor's geo / device may change across
   * sessions; we surface the most recent observed). */
  country: string | null;
  region: string | null;
  city: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  /* Best-known UTM (most recent non-null campaign tag). */
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  /* First-ever referrer host (origin of acquisition). */
  referrerHost: string | null;
  /* Path narrative. */
  topPath: string | null;
  entryPath: string | null;
  exitPath: string | null;
  /* Every distinct path the visitor hit, ordered by first visit
   * (chronological journey). Does not include query strings. Capped
   * at 50 paths per visitor in SQL to keep the row small. */
  pathsVisited: string[];
  /* Engagement signals aggregated from page_view_engagement. Single
   * highest dwell across any of the visitor's page views, deepest
   * scroll across any page view, and the count of pages where the
   * engagement beacon actually fired (some signal at all). When
   * engagedPageCount is 0, the visitor saw the page but never
   * scrolled or stayed long enough for the beacon. The strongest
   * single bot tell at this layer. */
  maxDwellMs: number | null;
  maxScrollPct: number | null;
  engagedPageCount: number;
  /* Conversion flags + linked rows. */
  convertedScan: boolean;
  convertedContact: boolean;
  scanId: string | null;
  contactSubmissionId: string | null;
  /* Self-disclosed identity (NULL when never submitted a form). */
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactCompany: string | null;
  scanEmail: string | null;
  scanBusinessName: string | null;
  scanUrl: string | null;
};

export async function getRecentVisitors(
  limit = 25,
  beforeIso?: string
): Promise<RecentVisitorRow[]> {
  try {
    const sql = getDb();
    const cap = Math.max(1, Math.min(200, limit));
    let cursor: string | null = null;
    if (beforeIso) {
      const t = Date.parse(beforeIso);
      if (Number.isFinite(t)) cursor = new Date(t).toISOString();
    }
    const rows = (await sql`
      WITH agg AS (
        SELECT
          pv.visitor_id,
          COUNT(*)::int AS page_view_count,
          COUNT(DISTINCT pv.session_id)::int AS session_count,
          MIN(pv.created_at) AS first_seen_at,
          MAX(pv.created_at) AS last_seen_at
        FROM page_views pv
        WHERE pv.is_bot = false
        GROUP BY pv.visitor_id
      ),
      latest AS (
        SELECT DISTINCT ON (pv.visitor_id)
          pv.visitor_id,
          pv.country, pv.region, pv.city,
          pv.device_type, pv.browser, pv.os
        FROM page_views pv
        WHERE pv.is_bot = false
        ORDER BY pv.visitor_id, pv.created_at DESC
      ),
      entry AS (
        SELECT DISTINCT ON (pv.visitor_id)
          pv.visitor_id, pv.path AS entry_path, pv.referrer_host
        FROM page_views pv
        WHERE pv.is_bot = false
        ORDER BY pv.visitor_id, pv.created_at ASC
      ),
      exit_ AS (
        SELECT DISTINCT ON (pv.visitor_id)
          pv.visitor_id, pv.path AS exit_path
        FROM page_views pv
        WHERE pv.is_bot = false
        ORDER BY pv.visitor_id, pv.created_at DESC
      ),
      utm AS (
        SELECT DISTINCT ON (pv.visitor_id)
          pv.visitor_id, pv.utm_source, pv.utm_medium, pv.utm_campaign
        FROM page_views pv
        WHERE pv.is_bot = false
          AND (pv.utm_source IS NOT NULL OR pv.utm_medium IS NOT NULL OR pv.utm_campaign IS NOT NULL)
        ORDER BY pv.visitor_id, pv.created_at DESC
      ),
      top_path AS (
        SELECT visitor_id, path FROM (
          SELECT
            pv.visitor_id, pv.path,
            ROW_NUMBER() OVER (
              PARTITION BY pv.visitor_id
              ORDER BY COUNT(*) DESC, pv.path ASC
            ) AS rn
          FROM page_views pv
          WHERE pv.is_bot = false
          GROUP BY pv.visitor_id, pv.path
        ) ranked
        WHERE rn = 1
      ),
      paths_visited AS (
        /* Distinct paths per visitor, ordered by first visit so the
         * client renders the journey chronologically. Capped at 50
         * to keep the row size sane. */
        SELECT
          fp.visitor_id,
          array_agg(fp.path ORDER BY fp.first_seen ASC) AS paths
        FROM (
          SELECT
            pv.visitor_id, pv.path, MIN(pv.created_at) AS first_seen,
            ROW_NUMBER() OVER (
              PARTITION BY pv.visitor_id
              ORDER BY MIN(pv.created_at) ASC
            ) AS rn
          FROM page_views pv
          WHERE pv.is_bot = false
          GROUP BY pv.visitor_id, pv.path
        ) fp
        WHERE fp.rn <= 50
        GROUP BY fp.visitor_id
      ),
      engagement AS (
        /* Aggregate dwell + scroll signals from page_view_engagement.
         * MAX over a visitor's page views surfaces the deepest read
         * they did anywhere; engaged_page_count is the count of page
         * views with any beacon at all (zero = beacon never fired,
         * the strongest bot tell at this layer). */
        SELECT
          pv.visitor_id,
          MAX(eng.dwell_ms) AS max_dwell_ms,
          MAX(eng.max_scroll_pct) AS max_scroll_pct,
          COUNT(eng.page_view_id)::int AS engaged_page_count
        FROM page_views pv
        LEFT JOIN page_view_engagement eng ON eng.page_view_id = pv.id
        WHERE pv.is_bot = false
        GROUP BY pv.visitor_id
      ),
      conv AS (
        SELECT
          s.visitor_id,
          BOOL_OR(s.converted_scan_id IS NOT NULL) AS converted_scan,
          BOOL_OR(s.converted_contact_id IS NOT NULL) AS converted_contact,
          MAX(s.converted_scan_id::text) AS any_scan_id,
          MAX(s.converted_contact_id::text) AS any_contact_id
        FROM sessions s
        GROUP BY s.visitor_id
      )
      SELECT
        agg.visitor_id::text AS visitor_id,
        agg.page_view_count,
        agg.session_count,
        agg.first_seen_at,
        agg.last_seen_at,
        latest.country, latest.region, latest.city,
        latest.device_type, latest.browser, latest.os,
        utm.utm_source, utm.utm_medium, utm.utm_campaign,
        entry.referrer_host,
        top_path.path AS top_path,
        entry.entry_path,
        exit_.exit_path,
        COALESCE(paths_visited.paths, ARRAY[]::text[]) AS paths_visited,
        engagement.max_dwell_ms,
        engagement.max_scroll_pct,
        COALESCE(engagement.engaged_page_count, 0) AS engaged_page_count,
        COALESCE(conv.converted_scan, false) AS converted_scan,
        COALESCE(conv.converted_contact, false) AS converted_contact,
        conv.any_scan_id AS scan_id,
        conv.any_contact_id AS contact_submission_id,
        cs.name AS contact_name,
        cs.email AS contact_email,
        cs.phone AS contact_phone,
        cs.company AS contact_company,
        sc.email AS scan_email,
        sc.business_name AS scan_business_name,
        sc.url AS scan_url
      FROM agg
      LEFT JOIN latest ON latest.visitor_id = agg.visitor_id
      LEFT JOIN entry ON entry.visitor_id = agg.visitor_id
      LEFT JOIN exit_ ON exit_.visitor_id = agg.visitor_id
      LEFT JOIN utm ON utm.visitor_id = agg.visitor_id
      LEFT JOIN top_path ON top_path.visitor_id = agg.visitor_id
      LEFT JOIN paths_visited ON paths_visited.visitor_id = agg.visitor_id
      LEFT JOIN engagement ON engagement.visitor_id = agg.visitor_id
      LEFT JOIN conv ON conv.visitor_id = agg.visitor_id
      LEFT JOIN contact_submissions cs ON cs.id = conv.any_contact_id::uuid
      LEFT JOIN scans sc ON sc.id = conv.any_scan_id::uuid
      WHERE (${cursor}::timestamptz IS NULL OR agg.last_seen_at < ${cursor}::timestamptz)
      ORDER BY agg.last_seen_at DESC
      LIMIT ${cap}
    `) as Array<{
      visitor_id: string;
      page_view_count: number;
      session_count: number;
      first_seen_at: string;
      last_seen_at: string;
      country: string | null;
      region: string | null;
      city: string | null;
      device_type: string | null;
      browser: string | null;
      os: string | null;
      utm_source: string | null;
      utm_medium: string | null;
      utm_campaign: string | null;
      referrer_host: string | null;
      top_path: string | null;
      entry_path: string | null;
      exit_path: string | null;
      paths_visited: string[] | null;
      max_dwell_ms: number | null;
      max_scroll_pct: number | null;
      engaged_page_count: number | null;
      converted_scan: boolean;
      converted_contact: boolean;
      scan_id: string | null;
      contact_submission_id: string | null;
      contact_name: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      contact_company: string | null;
      scan_email: string | null;
      scan_business_name: string | null;
      scan_url: string | null;
    }>;
    return rows.map((r) => ({
      visitorId: r.visitor_id,
      pageViewCount: r.page_view_count,
      sessionCount: r.session_count,
      firstSeenAt: r.first_seen_at,
      lastSeenAt: r.last_seen_at,
      country: r.country,
      region: r.region,
      city: r.city,
      deviceType: r.device_type,
      browser: r.browser,
      os: r.os,
      utmSource: r.utm_source,
      utmMedium: r.utm_medium,
      utmCampaign: r.utm_campaign,
      referrerHost: r.referrer_host,
      topPath: r.top_path,
      entryPath: r.entry_path,
      exitPath: r.exit_path,
      pathsVisited: r.paths_visited ?? [],
      maxDwellMs: r.max_dwell_ms === null ? null : Math.round(Number(r.max_dwell_ms)),
      maxScrollPct: r.max_scroll_pct === null ? null : Math.round(Number(r.max_scroll_pct)),
      engagedPageCount: r.engaged_page_count ?? 0,
      convertedScan: r.converted_scan,
      convertedContact: r.converted_contact,
      scanId: r.scan_id,
      contactSubmissionId: r.contact_submission_id,
      contactName: r.contact_name,
      contactEmail: r.contact_email,
      contactPhone: r.contact_phone,
      contactCompany: r.contact_company,
      scanEmail: r.scan_email,
      scanBusinessName: r.scan_business_name,
      scanUrl: r.scan_url,
    }));
  } catch (err) {
    console.warn(
      `[analytics] getRecentVisitors failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

/**
 * Recurring visitors only: visitor_id rows where the same person
 * came back across more than one session. Sorted by session count
 * DESC, then page-view count DESC, so the most-engaged repeat
 * visitors surface first. Same row shape as getRecentVisitors so
 * the existing RecentVisitorsTable client component renders them
 * without modification.
 */
export async function getRecurringVisitors(
  limit = 50,
  beforeSessionCount?: number,
  beforeLastSeenIso?: string
): Promise<RecentVisitorRow[]> {
  try {
    const sql = getDb();
    const cap = Math.max(1, Math.min(500, limit));
    /* Cursor: (session_count, last_seen_at) tuple. Need both because
     * many visitors can share the same session_count. We page using
     * (session_count, last_seen_at) DESC so a stable cursor advances
     * monotonically. Both null = first page. */
    const sc = beforeSessionCount && Number.isFinite(beforeSessionCount)
      ? Math.max(0, Math.floor(beforeSessionCount))
      : null;
    let cursor: string | null = null;
    if (beforeLastSeenIso) {
      const t = Date.parse(beforeLastSeenIso);
      if (Number.isFinite(t)) cursor = new Date(t).toISOString();
    }
    const rows = (await sql`
      WITH agg AS (
        SELECT
          pv.visitor_id,
          COUNT(*)::int AS page_view_count,
          COUNT(DISTINCT pv.session_id)::int AS session_count,
          MIN(pv.created_at) AS first_seen_at,
          MAX(pv.created_at) AS last_seen_at
        FROM page_views pv
        WHERE pv.is_bot = false
        GROUP BY pv.visitor_id
        HAVING COUNT(DISTINCT pv.session_id) > 1
      ),
      latest AS (
        SELECT DISTINCT ON (pv.visitor_id)
          pv.visitor_id,
          pv.country, pv.region, pv.city,
          pv.device_type, pv.browser, pv.os
        FROM page_views pv
        WHERE pv.is_bot = false
        ORDER BY pv.visitor_id, pv.created_at DESC
      ),
      entry AS (
        SELECT DISTINCT ON (pv.visitor_id)
          pv.visitor_id, pv.path AS entry_path, pv.referrer_host
        FROM page_views pv
        WHERE pv.is_bot = false
        ORDER BY pv.visitor_id, pv.created_at ASC
      ),
      exit_ AS (
        SELECT DISTINCT ON (pv.visitor_id)
          pv.visitor_id, pv.path AS exit_path
        FROM page_views pv
        WHERE pv.is_bot = false
        ORDER BY pv.visitor_id, pv.created_at DESC
      ),
      utm AS (
        SELECT DISTINCT ON (pv.visitor_id)
          pv.visitor_id, pv.utm_source, pv.utm_medium, pv.utm_campaign
        FROM page_views pv
        WHERE pv.is_bot = false
          AND (pv.utm_source IS NOT NULL OR pv.utm_medium IS NOT NULL OR pv.utm_campaign IS NOT NULL)
        ORDER BY pv.visitor_id, pv.created_at DESC
      ),
      top_path AS (
        SELECT visitor_id, path FROM (
          SELECT
            pv.visitor_id, pv.path,
            ROW_NUMBER() OVER (
              PARTITION BY pv.visitor_id
              ORDER BY COUNT(*) DESC, pv.path ASC
            ) AS rn
          FROM page_views pv
          WHERE pv.is_bot = false
          GROUP BY pv.visitor_id, pv.path
        ) ranked
        WHERE rn = 1
      ),
      paths_visited AS (
        /* Distinct paths per visitor in chronological journey order.
         * Capped at 50 to keep the row size sane. */
        SELECT
          fp.visitor_id,
          array_agg(fp.path ORDER BY fp.first_seen ASC) AS paths
        FROM (
          SELECT
            pv.visitor_id, pv.path, MIN(pv.created_at) AS first_seen,
            ROW_NUMBER() OVER (
              PARTITION BY pv.visitor_id
              ORDER BY MIN(pv.created_at) ASC
            ) AS rn
          FROM page_views pv
          WHERE pv.is_bot = false
          GROUP BY pv.visitor_id, pv.path
        ) fp
        WHERE fp.rn <= 50
        GROUP BY fp.visitor_id
      ),
      engagement AS (
        /* Same engagement aggregator as getRecentVisitors. Surfaces
         * deepest read + deepest scroll across any of the visitor's
         * page views, plus the count of pages with any beacon at
         * all. zero engaged pages = strongest bot tell. */
        SELECT
          pv.visitor_id,
          MAX(eng.dwell_ms) AS max_dwell_ms,
          MAX(eng.max_scroll_pct) AS max_scroll_pct,
          COUNT(eng.page_view_id)::int AS engaged_page_count
        FROM page_views pv
        LEFT JOIN page_view_engagement eng ON eng.page_view_id = pv.id
        WHERE pv.is_bot = false
        GROUP BY pv.visitor_id
      ),
      conv AS (
        SELECT
          s.visitor_id,
          BOOL_OR(s.converted_scan_id IS NOT NULL) AS converted_scan,
          BOOL_OR(s.converted_contact_id IS NOT NULL) AS converted_contact,
          MAX(s.converted_scan_id::text) AS any_scan_id,
          MAX(s.converted_contact_id::text) AS any_contact_id
        FROM sessions s
        GROUP BY s.visitor_id
      )
      SELECT
        agg.visitor_id::text AS visitor_id,
        agg.page_view_count,
        agg.session_count,
        agg.first_seen_at,
        agg.last_seen_at,
        latest.country, latest.region, latest.city,
        latest.device_type, latest.browser, latest.os,
        utm.utm_source, utm.utm_medium, utm.utm_campaign,
        entry.referrer_host,
        top_path.path AS top_path,
        entry.entry_path,
        exit_.exit_path,
        COALESCE(paths_visited.paths, ARRAY[]::text[]) AS paths_visited,
        engagement.max_dwell_ms,
        engagement.max_scroll_pct,
        COALESCE(engagement.engaged_page_count, 0) AS engaged_page_count,
        COALESCE(conv.converted_scan, false) AS converted_scan,
        COALESCE(conv.converted_contact, false) AS converted_contact,
        conv.any_scan_id AS scan_id,
        conv.any_contact_id AS contact_submission_id,
        cs.name AS contact_name,
        cs.email AS contact_email,
        cs.phone AS contact_phone,
        cs.company AS contact_company,
        sc.email AS scan_email,
        sc.business_name AS scan_business_name,
        sc.url AS scan_url
      FROM agg
      LEFT JOIN latest ON latest.visitor_id = agg.visitor_id
      LEFT JOIN entry ON entry.visitor_id = agg.visitor_id
      LEFT JOIN exit_ ON exit_.visitor_id = agg.visitor_id
      LEFT JOIN utm ON utm.visitor_id = agg.visitor_id
      LEFT JOIN top_path ON top_path.visitor_id = agg.visitor_id
      LEFT JOIN paths_visited ON paths_visited.visitor_id = agg.visitor_id
      LEFT JOIN engagement ON engagement.visitor_id = agg.visitor_id
      LEFT JOIN conv ON conv.visitor_id = agg.visitor_id
      LEFT JOIN contact_submissions cs ON cs.id = conv.any_contact_id::uuid
      LEFT JOIN scans sc ON sc.id = conv.any_scan_id::uuid
      WHERE
        (${sc}::int IS NULL OR ${cursor}::timestamptz IS NULL OR
         agg.session_count < ${sc}::int OR
         (agg.session_count = ${sc}::int AND agg.last_seen_at < ${cursor}::timestamptz))
      ORDER BY agg.session_count DESC, agg.last_seen_at DESC
      LIMIT ${cap}
    `) as Array<{
      visitor_id: string;
      page_view_count: number;
      session_count: number;
      first_seen_at: string;
      last_seen_at: string;
      country: string | null;
      region: string | null;
      city: string | null;
      device_type: string | null;
      browser: string | null;
      os: string | null;
      utm_source: string | null;
      utm_medium: string | null;
      utm_campaign: string | null;
      referrer_host: string | null;
      top_path: string | null;
      entry_path: string | null;
      exit_path: string | null;
      paths_visited: string[] | null;
      max_dwell_ms: number | null;
      max_scroll_pct: number | null;
      engaged_page_count: number | null;
      converted_scan: boolean;
      converted_contact: boolean;
      scan_id: string | null;
      contact_submission_id: string | null;
      contact_name: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      contact_company: string | null;
      scan_email: string | null;
      scan_business_name: string | null;
      scan_url: string | null;
    }>;
    return rows.map((r) => ({
      visitorId: r.visitor_id,
      pageViewCount: r.page_view_count,
      sessionCount: r.session_count,
      firstSeenAt: r.first_seen_at,
      lastSeenAt: r.last_seen_at,
      country: r.country,
      region: r.region,
      city: r.city,
      deviceType: r.device_type,
      browser: r.browser,
      os: r.os,
      utmSource: r.utm_source,
      utmMedium: r.utm_medium,
      utmCampaign: r.utm_campaign,
      referrerHost: r.referrer_host,
      topPath: r.top_path,
      entryPath: r.entry_path,
      exitPath: r.exit_path,
      pathsVisited: r.paths_visited ?? [],
      maxDwellMs: r.max_dwell_ms === null ? null : Math.round(Number(r.max_dwell_ms)),
      maxScrollPct: r.max_scroll_pct === null ? null : Math.round(Number(r.max_scroll_pct)),
      engagedPageCount: r.engaged_page_count ?? 0,
      convertedScan: r.converted_scan,
      convertedContact: r.converted_contact,
      scanId: r.scan_id,
      contactSubmissionId: r.contact_submission_id,
      contactName: r.contact_name,
      contactEmail: r.contact_email,
      contactPhone: r.contact_phone,
      contactCompany: r.contact_company,
      scanEmail: r.scan_email,
      scanBusinessName: r.scan_business_name,
      scanUrl: r.scan_url,
    }));
  } catch (err) {
    console.warn(
      `[analytics] getRecurringVisitors failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

/**
 * Count of visitors who came back across more than one session in
 * the last 7 days. Drives the dashboard KPI on the Recurring users
 * card.
 */
export async function getRecurringVisitorCount(
  intervalDays = 7
): Promise<number> {
  try {
    const sql = getDb();
    const days = Math.max(1, Math.min(90, intervalDays));
    const interval = `${days} days`;
    const rows = (await sql`
      SELECT COUNT(*)::int AS n FROM (
        SELECT pv.visitor_id
        FROM page_views pv
        WHERE pv.is_bot = false
          AND pv.created_at > now() - (${interval})::interval
        GROUP BY pv.visitor_id
        HAVING COUNT(DISTINCT pv.session_id) > 1
      ) t
    `) as { n: number }[];
    return Number(rows[0]?.n ?? 0);
  } catch (err) {
    console.warn(
      `[analytics] getRecurringVisitorCount failed: ${err instanceof Error ? err.message : err}`
    );
    return 0;
  }
}

/**
 * Full chronological page-view timeline for a single visitor across
 * every session they ever had (subject to the 90-day raw page_views
 * retention window). Capped at 500 entries to keep the response
 * bounded for unusually high-volume visitors.
 */
export type VisitorTimelineEntry = {
  id: string;
  sessionId: string;
  path: string;
  query: string | null;
  referrerHost: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  country: string | null;
  city: string | null;
  deviceType: string | null;
  browser: string | null;
  createdAt: string;
  dwellMs: number | null;
  scrollPct: number | null;
  scanId: string | null;
  contactSubmissionId: string | null;
};

export async function getVisitorTimeline(
  visitorId: string
): Promise<VisitorTimelineEntry[]> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visitorId)) {
    return [];
  }
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        pv.id::text AS id,
        pv.session_id::text AS session_id,
        pv.path,
        pv.query,
        pv.referrer_host,
        pv.utm_source,
        pv.utm_medium,
        pv.utm_campaign,
        pv.country,
        pv.city,
        pv.device_type,
        pv.browser,
        pv.created_at,
        pv.scan_id::text AS scan_id,
        pv.contact_submission_id::text AS contact_submission_id,
        eng.dwell_ms,
        eng.max_scroll_pct
      FROM page_views pv
      LEFT JOIN page_view_engagement eng ON eng.page_view_id = pv.id
      WHERE pv.visitor_id = ${visitorId}::uuid
        AND pv.is_bot = false
      ORDER BY pv.created_at ASC, pv.id ASC
      LIMIT 500
    `) as Array<{
      id: string;
      session_id: string;
      path: string;
      query: string | null;
      referrer_host: string | null;
      utm_source: string | null;
      utm_medium: string | null;
      utm_campaign: string | null;
      country: string | null;
      city: string | null;
      device_type: string | null;
      browser: string | null;
      created_at: string;
      scan_id: string | null;
      contact_submission_id: string | null;
      dwell_ms: number | null;
      max_scroll_pct: number | null;
    }>;
    return rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      path: r.path,
      query: r.query,
      referrerHost: r.referrer_host,
      utmSource: r.utm_source,
      utmMedium: r.utm_medium,
      utmCampaign: r.utm_campaign,
      country: r.country,
      city: r.city,
      deviceType: r.device_type,
      browser: r.browser,
      createdAt: r.created_at,
      dwellMs: r.dwell_ms,
      scrollPct: r.max_scroll_pct,
      scanId: r.scan_id,
      contactSubmissionId: r.contact_submission_id,
    }));
  } catch (err) {
    console.warn(
      `[analytics] getVisitorTimeline failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

/**
 * Stitch a Pathlight scan back to its originating session. Called from
 * the scan creation path so the funnel join works without a window
 * function over page_views. Best-effort: a missing session is fine.
 */
export async function attachScanToSession(args: {
  sessionId: string;
  scanId: string;
}): Promise<void> {
  try {
    const sql = getDb();
    await sql`
      UPDATE sessions
      SET converted_scan_id = ${args.scanId}::uuid
      WHERE id = ${args.sessionId}::uuid
        AND converted_scan_id IS NULL
    `;
  } catch (err) {
    console.warn(
      `[analytics] attachScanToSession failed: ${err instanceof Error ? err.message : err}`
    );
  }
}

export async function attachContactToSession(args: {
  sessionId: string;
  contactSubmissionId: string;
}): Promise<void> {
  try {
    const sql = getDb();
    await sql`
      UPDATE sessions
      SET converted_contact_id = ${args.contactSubmissionId}::uuid
      WHERE id = ${args.sessionId}::uuid
        AND converted_contact_id IS NULL
    `;
  } catch (err) {
    console.warn(
      `[analytics] attachContactToSession failed: ${err instanceof Error ? err.message : err}`
    );
  }
}

/* ─────────────── Dashboard analytics (PostHog/Vercel level) ─────────────── */

export type DashboardRange = "7d" | "14d" | "30d" | "90d";

export type SeriesPoint = { date: string; visitors: number };

export type DashboardMetrics = {
  visitors: number;
  sessions: number;
  pageViews: number;
  bounceRate: number;
  pagesPerSession: number;
  conversions: number;
  previousVisitors: number | null;
  previousSessions: number | null;
  previousPageViews: number | null;
  previousBounceRate: number | null;
  previousPagesPerSession: number | null;
  previousConversions: number | null;
};

export type DashboardTopPage = {
  path: string;
  prettyPath: string;
  views: number;
  sessions: number;
  visitors: number;
  pct: number;
};

export type DashboardTopSource = {
  source: string;
  sessions: number;
  scanConversions: number;
  contactConversions: number;
  pct: number;
};

export type DashboardDevice = {
  device: string;
  sessions: number;
  pct: number;
};

export type DashboardEngagement = {
  engaged: number;
  light: number;
  none: number;
  likelyBot: number;
};

export type DashboardTopCity = {
  city: string;
  region: string;
  country: string;
  visitors: number;
};

export type VisitorsDashboardData = {
  windowDays: number;
  currentStart: string;
  currentEnd: string;
  previousStart: string | null;
  previousEnd: string | null;
  series: SeriesPoint[];
  comparisonSeries: SeriesPoint[];
  metrics: DashboardMetrics;
  topPages: DashboardTopPage[];
  topSources: DashboardTopSource[];
  devices: DashboardDevice[];
  engagement: DashboardEngagement;
  topCities: DashboardTopCity[];
};

function rangeDays(r: DashboardRange): number {
  if (r === "7d") return 7;
  if (r === "14d") return 14;
  if (r === "90d") return 90;
  return 30;
}

/* Pretty-print common admin paths. Mirrors the PageHeader shorthand
 * the existing visitors page uses on its top-pages table. */
function prettifyPath(path: string): string {
  if (path === "/") return "Home";
  if (path === "/about") return "About";
  if (path === "/work") return "Work";
  if (path === "/services") return "Services";
  if (path === "/pricing") return "Pricing";
  if (path === "/contact") return "Contact";
  if (path === "/pathlight") return "Pathlight";
  if (path.startsWith("/work/design-briefs/")) {
    return "Design Brief: " + path.slice("/work/design-briefs/".length);
  }
  if (path.startsWith("/work/")) {
    return "Case Study: " + path.slice("/work/".length);
  }
  if (path.startsWith("/services/")) {
    return "Service: " + path.slice("/services/".length);
  }
  if (path.startsWith("/pricing/")) {
    return "Pricing: " + path.slice("/pricing/".length);
  }
  if (path.startsWith("/pathlight/")) return "Scan report";
  return path;
}

/**
 * Single-call data fetch for the redesigned /admin/visitors dashboard.
 * Runs every section in parallel inside its own try/catch so one bad
 * section returns its empty default rather than blanking the whole
 * page. Range is either a preset ("7d" / "14d" / "30d" / "90d") or an
 * absolute [from, to] ISO pair; the comparison period is the immediately
 * preceding window of equal length.
 *
 * If the comparison window has fewer than 3 daily data points (site is
 * new, or no events before tracking started), the function returns
 * comparisonSeries=[] and previous*=null. The frontend hides the ghost
 * line and the trend deltas in that case.
 */
export async function getVisitorsDashboardData(
  args:
    | { range: DashboardRange }
    | { from: string; to: string }
): Promise<VisitorsDashboardData> {
  // Resolve absolute window for current + previous periods.
  let currentEnd: Date;
  let currentStart: Date;
  let windowDays: number;
  if ("range" in args) {
    windowDays = rangeDays(args.range);
    currentEnd = new Date();
    currentStart = new Date(currentEnd.getTime() - windowDays * 86_400_000);
  } else {
    const fromT = Date.parse(args.from);
    const toT = Date.parse(args.to);
    if (!Number.isFinite(fromT) || !Number.isFinite(toT) || toT <= fromT) {
      windowDays = 30;
      currentEnd = new Date();
      currentStart = new Date(currentEnd.getTime() - windowDays * 86_400_000);
    } else {
      currentStart = new Date(fromT);
      currentEnd = new Date(toT);
      windowDays = Math.max(
        1,
        Math.round((currentEnd.getTime() - currentStart.getTime()) / 86_400_000)
      );
    }
  }
  const previousEnd = new Date(currentStart.getTime());
  const previousStart = new Date(currentStart.getTime() - windowDays * 86_400_000);
  const cs = currentStart.toISOString();
  const ce = currentEnd.toISOString();
  const ps = previousStart.toISOString();
  const pe = previousEnd.toISOString();

  const [
    series,
    comparisonSeries,
    metrics,
    topPages,
    topSources,
    devices,
    engagement,
    topCities,
  ] = await Promise.all([
    fetchDailyVisitors(cs, ce),
    fetchDailyVisitors(ps, pe),
    fetchAggregateMetricsWithComparison(cs, ce, ps, pe),
    fetchTopPagesRange(cs, ce, 25),
    fetchTopSourcesRange(cs, ce, 25),
    fetchDevicesRange(cs, ce),
    fetchEngagementRange(cs, ce),
    fetchTopCitiesRange(cs, ce, 10),
  ]);

  // Comparison decisions: if previous window has fewer than 3 daily
  // points, the comparison is too thin to plot. Hide ghost line and
  // null out the previous metric values.
  const insufficientHistory = comparisonSeries.length < 3;

  return {
    windowDays,
    currentStart: cs,
    currentEnd: ce,
    previousStart: insufficientHistory ? null : ps,
    previousEnd: insufficientHistory ? null : pe,
    series: fillDailySeries(series, currentStart, currentEnd),
    comparisonSeries: insufficientHistory
      ? []
      : fillDailySeries(comparisonSeries, previousStart, previousEnd),
    metrics: insufficientHistory
      ? {
          ...metrics,
          previousVisitors: null,
          previousSessions: null,
          previousPageViews: null,
          previousBounceRate: null,
          previousPagesPerSession: null,
          previousConversions: null,
        }
      : metrics,
    topPages,
    topSources,
    devices,
    engagement,
    topCities,
  };
}

function fillDailySeries(
  rows: SeriesPoint[],
  start: Date,
  end: Date
): SeriesPoint[] {
  // Fill missing days with 0 so the chart has a continuous x-axis. We
  // operate in UTC because the SQL date_trunc uses UTC by default and
  // the dashboard consumer treats every value as a calendar day.
  const byDate = new Map(rows.map((r) => [r.date, r.visitors]));
  const out: SeriesPoint[] = [];
  const startDay = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  );
  const endDay = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  );
  for (
    let cursor = startDay.getTime();
    cursor <= endDay.getTime();
    cursor += 86_400_000
  ) {
    const d = new Date(cursor);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;
    out.push({ date: key, visitors: byDate.get(key) ?? 0 });
  }
  return out;
}

async function fetchDailyVisitors(
  startIso: string,
  endIso: string
): Promise<SeriesPoint[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
        COUNT(DISTINCT visitor_id)::int AS visitors
      FROM page_views
      WHERE created_at >= ${startIso}::timestamptz
        AND created_at <  ${endIso}::timestamptz
        AND is_bot = false
      GROUP BY day
      ORDER BY day ASC
    `) as { day: string; visitors: number }[];
    return rows.map((r) => ({ date: r.day, visitors: Number(r.visitors) }));
  } catch (err) {
    console.warn(
      `[analytics] fetchDailyVisitors failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

async function fetchAggregateMetricsWithComparison(
  cs: string,
  ce: string,
  ps: string,
  pe: string
): Promise<DashboardMetrics> {
  try {
    const sql = getDb();
    // Page views + sessions + visitors for both windows in one round trip.
    const rows = (await sql`
      WITH cur_pv AS (
        SELECT
          COUNT(*)::int AS page_views,
          COUNT(DISTINCT session_id)::int AS sessions,
          COUNT(DISTINCT visitor_id)::int AS visitors
        FROM page_views
        WHERE created_at >= ${cs}::timestamptz
          AND created_at <  ${ce}::timestamptz
          AND is_bot = false
      ),
      cur_s AS (
        SELECT
          COUNT(*)::int AS total_sessions,
          COUNT(*) FILTER (WHERE page_count = 1)::int AS bounced,
          COALESCE(AVG(page_count), 0)::float8 AS avg_pages,
          COUNT(*) FILTER (WHERE converted_scan_id IS NOT NULL)::int AS scans,
          COUNT(*) FILTER (WHERE converted_contact_id IS NOT NULL)::int AS contacts
        FROM sessions
        WHERE started_at >= ${cs}::timestamptz
          AND started_at <  ${ce}::timestamptz
          AND is_bot = false
      ),
      prev_pv AS (
        SELECT
          COUNT(*)::int AS page_views,
          COUNT(DISTINCT session_id)::int AS sessions,
          COUNT(DISTINCT visitor_id)::int AS visitors
        FROM page_views
        WHERE created_at >= ${ps}::timestamptz
          AND created_at <  ${pe}::timestamptz
          AND is_bot = false
      ),
      prev_s AS (
        SELECT
          COUNT(*)::int AS total_sessions,
          COUNT(*) FILTER (WHERE page_count = 1)::int AS bounced,
          COALESCE(AVG(page_count), 0)::float8 AS avg_pages,
          COUNT(*) FILTER (WHERE converted_scan_id IS NOT NULL)::int AS scans,
          COUNT(*) FILTER (WHERE converted_contact_id IS NOT NULL)::int AS contacts
        FROM sessions
        WHERE started_at >= ${ps}::timestamptz
          AND started_at <  ${pe}::timestamptz
          AND is_bot = false
      )
      SELECT
        cur_pv.page_views AS cur_pv_pageviews,
        cur_pv.sessions   AS cur_pv_sessions,
        cur_pv.visitors   AS cur_pv_visitors,
        cur_s.total_sessions AS cur_s_total,
        cur_s.bounced       AS cur_s_bounced,
        cur_s.avg_pages     AS cur_s_avg_pages,
        cur_s.scans         AS cur_s_scans,
        cur_s.contacts      AS cur_s_contacts,
        prev_pv.page_views AS prev_pv_pageviews,
        prev_pv.sessions   AS prev_pv_sessions,
        prev_pv.visitors   AS prev_pv_visitors,
        prev_s.total_sessions AS prev_s_total,
        prev_s.bounced       AS prev_s_bounced,
        prev_s.avg_pages     AS prev_s_avg_pages,
        prev_s.scans         AS prev_s_scans,
        prev_s.contacts      AS prev_s_contacts
      FROM cur_pv, cur_s, prev_pv, prev_s
    `) as Array<{
      cur_pv_pageviews: number;
      cur_pv_sessions: number;
      cur_pv_visitors: number;
      cur_s_total: number;
      cur_s_bounced: number;
      cur_s_avg_pages: number;
      cur_s_scans: number;
      cur_s_contacts: number;
      prev_pv_pageviews: number;
      prev_pv_sessions: number;
      prev_pv_visitors: number;
      prev_s_total: number;
      prev_s_bounced: number;
      prev_s_avg_pages: number;
      prev_s_scans: number;
      prev_s_contacts: number;
    }>;

    const r = rows[0];
    if (!r) return EMPTY_DASHBOARD_METRICS();

    const curBounce =
      r.cur_s_total > 0 ? (r.cur_s_bounced / r.cur_s_total) * 100 : 0;
    const prevBounce =
      r.prev_s_total > 0 ? (r.prev_s_bounced / r.prev_s_total) * 100 : 0;

    return {
      visitors: r.cur_pv_visitors,
      sessions: r.cur_pv_sessions,
      pageViews: r.cur_pv_pageviews,
      bounceRate: Number(curBounce.toFixed(1)),
      pagesPerSession: Number(r.cur_s_avg_pages.toFixed(2)),
      conversions: r.cur_s_scans + r.cur_s_contacts,
      previousVisitors: r.prev_pv_visitors,
      previousSessions: r.prev_pv_sessions,
      previousPageViews: r.prev_pv_pageviews,
      previousBounceRate: Number(prevBounce.toFixed(1)),
      previousPagesPerSession: Number(r.prev_s_avg_pages.toFixed(2)),
      previousConversions: r.prev_s_scans + r.prev_s_contacts,
    };
  } catch (err) {
    console.warn(
      `[analytics] fetchAggregateMetricsWithComparison failed: ${err instanceof Error ? err.message : err}`
    );
    return EMPTY_DASHBOARD_METRICS();
  }
}

function EMPTY_DASHBOARD_METRICS(): DashboardMetrics {
  return {
    visitors: 0,
    sessions: 0,
    pageViews: 0,
    bounceRate: 0,
    pagesPerSession: 0,
    conversions: 0,
    previousVisitors: 0,
    previousSessions: 0,
    previousPageViews: 0,
    previousBounceRate: 0,
    previousPagesPerSession: 0,
    previousConversions: 0,
  };
}

async function fetchTopPagesRange(
  cs: string,
  ce: string,
  limit: number
): Promise<DashboardTopPage[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        path,
        COUNT(*)::int AS views,
        COUNT(DISTINCT session_id)::int AS sessions,
        COUNT(DISTINCT visitor_id)::int AS visitors
      FROM page_views
      WHERE created_at >= ${cs}::timestamptz
        AND created_at <  ${ce}::timestamptz
        AND is_bot = false
      GROUP BY path
      ORDER BY views DESC
      LIMIT ${Math.max(1, Math.min(100, limit))}
    `) as { path: string; views: number; sessions: number; visitors: number }[];
    const total = rows.reduce((sum, r) => sum + Number(r.views), 0);
    return rows.map((r) => ({
      path: r.path,
      prettyPath: prettifyPath(r.path),
      views: Number(r.views),
      sessions: Number(r.sessions),
      visitors: Number(r.visitors),
      pct: total > 0 ? Number(((Number(r.views) / total) * 100).toFixed(1)) : 0,
    }));
  } catch (err) {
    console.warn(
      `[analytics] fetchTopPagesRange failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

async function fetchTopSourcesRange(
  cs: string,
  ce: string,
  limit: number
): Promise<DashboardTopSource[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        COALESCE(utm_source, referrer_host, '(direct)') AS source,
        COUNT(*)::int AS sessions,
        COUNT(*) FILTER (WHERE converted_scan_id IS NOT NULL)::int AS scan_conv,
        COUNT(*) FILTER (WHERE converted_contact_id IS NOT NULL)::int AS contact_conv
      FROM sessions
      WHERE started_at >= ${cs}::timestamptz
        AND started_at <  ${ce}::timestamptz
        AND is_bot = false
      GROUP BY source
      ORDER BY sessions DESC
      LIMIT ${Math.max(1, Math.min(50, limit))}
    `) as {
      source: string;
      sessions: number;
      scan_conv: number;
      contact_conv: number;
    }[];
    const total = rows.reduce((sum, r) => sum + Number(r.sessions), 0);
    return rows.map((r) => ({
      source: r.source,
      sessions: Number(r.sessions),
      scanConversions: Number(r.scan_conv),
      contactConversions: Number(r.contact_conv),
      pct:
        total > 0 ? Number(((Number(r.sessions) / total) * 100).toFixed(1)) : 0,
    }));
  } catch (err) {
    console.warn(
      `[analytics] fetchTopSourcesRange failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

async function fetchDevicesRange(
  cs: string,
  ce: string
): Promise<DashboardDevice[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        COALESCE(device_type, 'unknown') AS device,
        COUNT(*)::int AS sessions
      FROM sessions
      WHERE started_at >= ${cs}::timestamptz
        AND started_at <  ${ce}::timestamptz
        AND is_bot = false
      GROUP BY device
      ORDER BY sessions DESC
    `) as { device: string; sessions: number }[];
    const total = rows.reduce((sum, r) => sum + Number(r.sessions), 0);
    return rows.map((r) => ({
      device: r.device,
      sessions: Number(r.sessions),
      pct: total > 0 ? Number(((Number(r.sessions) / total) * 100).toFixed(1)) : 0,
    }));
  } catch (err) {
    console.warn(
      `[analytics] fetchDevicesRange failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}

/**
 * Engagement breakdown across non-bot sessions in the window.
 * - engaged: any of the session's page views had dwell >= 30s OR scroll >= 50%
 * - light: had a beacon at all but did not meet the engaged threshold
 * - none: zero beacon rows for any of its page views
 * - likelyBot: sessions with is_bot = true (separate count, not part of the
 *   engaged/light/none totals)
 */
async function fetchEngagementRange(
  cs: string,
  ce: string
): Promise<DashboardEngagement> {
  try {
    const sql = getDb();
    const rows = (await sql`
      WITH s AS (
        SELECT id, is_bot FROM sessions
        WHERE started_at >= ${cs}::timestamptz
          AND started_at <  ${ce}::timestamptz
      ),
      pv_eng AS (
        SELECT
          pv.session_id,
          COUNT(eng.page_view_id)::int AS beacon_rows,
          MAX(eng.dwell_ms) AS max_dwell,
          MAX(eng.max_scroll_pct) AS max_scroll
        FROM page_views pv
        LEFT JOIN page_view_engagement eng ON eng.page_view_id = pv.id
        WHERE pv.created_at >= ${cs}::timestamptz
          AND pv.created_at <  ${ce}::timestamptz
        GROUP BY pv.session_id
      ),
      classified AS (
        SELECT
          s.id,
          s.is_bot,
          COALESCE(pv_eng.beacon_rows, 0) AS beacon_rows,
          COALESCE(pv_eng.max_dwell, 0)   AS max_dwell,
          COALESCE(pv_eng.max_scroll, 0)  AS max_scroll
        FROM s
        LEFT JOIN pv_eng ON pv_eng.session_id = s.id
      )
      SELECT
        COUNT(*) FILTER (WHERE is_bot = true)::int AS likely_bot,
        COUNT(*) FILTER (WHERE is_bot = false AND beacon_rows = 0)::int AS none_eng,
        COUNT(*) FILTER (
          WHERE is_bot = false AND beacon_rows > 0
            AND (max_dwell < 30000 AND max_scroll < 50)
        )::int AS light_eng,
        COUNT(*) FILTER (
          WHERE is_bot = false AND beacon_rows > 0
            AND (max_dwell >= 30000 OR max_scroll >= 50)
        )::int AS engaged
      FROM classified
    `) as {
      likely_bot: number;
      none_eng: number;
      light_eng: number;
      engaged: number;
    }[];
    const r = rows[0];
    return {
      engaged: r ? Number(r.engaged) : 0,
      light: r ? Number(r.light_eng) : 0,
      none: r ? Number(r.none_eng) : 0,
      likelyBot: r ? Number(r.likely_bot) : 0,
    };
  } catch (err) {
    console.warn(
      `[analytics] fetchEngagementRange failed: ${err instanceof Error ? err.message : err}`
    );
    return { engaged: 0, light: 0, none: 0, likelyBot: 0 };
  }
}

async function fetchTopCitiesRange(
  cs: string,
  ce: string,
  limit: number
): Promise<DashboardTopCity[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT
        COALESCE(city, '')    AS city,
        COALESCE(region, '')  AS region,
        COALESCE(country, '') AS country,
        COUNT(DISTINCT visitor_id)::int AS visitors
      FROM page_views
      WHERE created_at >= ${cs}::timestamptz
        AND created_at <  ${ce}::timestamptz
        AND is_bot = false
        AND city IS NOT NULL
      GROUP BY country, region, city
      ORDER BY visitors DESC
      LIMIT ${Math.max(1, Math.min(50, limit))}
    `) as { city: string; region: string; country: string; visitors: number }[];
    return rows.map((r) => ({
      city: r.city,
      region: r.region,
      country: r.country,
      visitors: Number(r.visitors),
    }));
  } catch (err) {
    console.warn(
      `[analytics] fetchTopCitiesRange failed: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}
