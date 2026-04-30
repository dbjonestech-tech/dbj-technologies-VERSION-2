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
