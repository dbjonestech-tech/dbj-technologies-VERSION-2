import { getDb } from "@/lib/db";
import {
  getLiveVisitors,
  getRecurringVisitorCount,
  getVisitorOverview,
} from "@/lib/services/analytics";
import { getFunnelStages } from "@/lib/services/funnel";
import { getRumOverview } from "@/lib/services/rum";
import { getEmailKpiByType, getEmailKpiTrend } from "@/lib/services/email-kpi";
import { getProviderSpendUsd } from "@/lib/services/api-usage";
import { getClientStats } from "@/lib/auth/clients";
import {
  getCurrentDeploymentSummary,
  getRecentDeployments,
} from "@/lib/services/vercel-platform";
import { getTopSentryIssues } from "@/lib/services/sentry-summary";
import { getLatestInfraStatuses } from "@/lib/services/infrastructure";
import { getLevelSummary } from "@/lib/services/monitoring";
import { listAdminUsers } from "@/lib/auth/users";
import { getAllowlistSize } from "@/lib/auth/allowlist";
import {
  getContactsDashboardSummary,
  getDailyNewContacts,
  getRecentRelationshipEvents,
} from "@/lib/services/contacts";

/**
 * Per-card KPI payload rendered on hover on the admin dashboard. Each
 * card surfaces a single numeric or status-y headline plus a short
 * descriptor. Tone drives the accent color of the value.
 *
 * Every fetch in this module is wrapped in its own try/catch so one
 * failing service (Sentry token expired, infra check table empty,
 * Vercel API blip) cannot blank the whole dashboard.
 */
export type KpiTone = "neutral" | "positive" | "warning" | "danger";

/** A single label/value pair shown on hover beneath the primary KPI.
 *  Compact format: short label ("Sessions") + short value ("1,204").
 *  Tone is optional; when present, the value is colored accordingly. */
export type KpiDetail = {
  label: string;
  value: string;
  tone?: KpiTone;
};

/** A single point in a card's small time-series sparkline. */
export type SparkPoint = {
  /** Short label (e.g. "Apr 28") used for tooltip / aria. */
  label: string;
  /** Numeric value at this bucket. */
  value: number;
};

/** Compact line item shown in a card's preview "recent activity" feed. */
export type RecentEvent = {
  /** Left-side title (event name, scan url, deploy sha, etc.). */
  title: string;
  /** Right-side meta (relative time, status, count). */
  meta: string;
  /** Optional tone applied to the meta value. */
  tone?: KpiTone;
};

export type CardKpi = {
  primary: string;
  secondary?: string;
  tone?: KpiTone;
  /** Additional context shown when the operator hovers the card.
   *  Kept short (2-4 items) so the panel does not dominate. */
  details?: KpiDetail[];
  /** 14-day sparkline of the primary metric. Optional because some
   *  cards have no natural time-series source (Errors, Infrastructure,
   *  Users, Clients, Recurring). */
  spark?: {
    points: SparkPoint[];
    /** Pretty unit label, e.g. "views/day". Shown beneath the chart. */
    unit?: string;
  };
  /** Up to 5 recent activity items shown in the preview popover. */
  recent?: RecentEvent[];
};

export type DashboardKpiMap = Record<string, CardKpi>;

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function fmtUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function fmtPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

function fmtMs(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  if (n < 1000) return `${Math.round(n)}ms`;
  return `${(n / 1000).toFixed(2)}s`;
}

function fmtRelDays(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function shortDayLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* Pad a sparse list of {day, n} rows into a contiguous SparkPoint[] of
 * the requested length, ending today (UTC day-aligned). Missing days
 * get value=0. Day keys are normalized to YYYY-MM-DD so timestamptz
 * input from Postgres compares cleanly. */
function fillSparkPoints(
  rows: Array<{ day: string | Date; n: number | string | null }>,
  days: number
): SparkPoint[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = new Date(r.day).toISOString().slice(0, 10);
    map.set(key, Number(r.n ?? 0));
  }
  const out: SparkPoint[] = [];
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ label: shortDayLabel(key), value: map.get(key) ?? 0 });
  }
  return out;
}

/* Truncate long display strings (URLs, paths, commit messages) used in
 * the Recent feed so the preview row stays single-line. */
function shortenText(s: string, max = 40): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn(
      `[dashboard-kpis] ${label} failed: ${err instanceof Error ? err.message : err}`
    );
    return fallback;
  }
}

async function visitorsKpi(): Promise<CardKpi> {
  const sql = getDb();
  const [live, today, week, sparkRows, recentRows] = await Promise.all([
    safe(() => getLiveVisitors(), [], "visitors.live"),
    safe(() => getVisitorOverview("1 day"), null, "visitors.overview.1d"),
    safe(() => getVisitorOverview("7 days"), null, "visitors.overview.7d"),
    safe(
      async () =>
        (await sql`
          SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS n
          FROM page_views
          WHERE created_at > now() - interval '14 days'
            AND is_bot = false
          GROUP BY 1 ORDER BY 1
        `) as { day: string; n: number }[],
      [] as { day: string; n: number }[],
      "visitors.spark"
    ),
    safe(
      async () =>
        (await sql`
          SELECT path, created_at
          FROM page_views
          WHERE created_at > now() - interval '24 hours'
            AND is_bot = false
          ORDER BY created_at DESC
          LIMIT 5
        `) as { path: string; created_at: string }[],
      [] as { path: string; created_at: string }[],
      "visitors.recent"
    ),
  ]);
  const liveCount = live.length;
  const todayViews = today?.pageViews ?? 0;
  const details: KpiDetail[] = [];
  if (today) {
    details.push({ label: "Sessions (24h)", value: fmt(today.sessions) });
    details.push({ label: "Visitors (24h)", value: fmt(today.uniqueVisitors) });
    details.push({
      label: "Bounce rate",
      value: fmtPct(today.bounceRatePct, 1),
      tone: today.bounceRatePct >= 70 ? "warning" : "neutral",
    });
  }
  if (week) {
    details.push({ label: "Views (7d)", value: fmt(week.pageViews) });
  }
  return {
    primary: liveCount > 0 ? `${liveCount} live` : `${fmt(todayViews)} views`,
    secondary:
      liveCount > 0
        ? `${fmt(todayViews)} views in last 24h`
        : "in the last 24 hours",
    tone: liveCount > 0 ? "positive" : "neutral",
    details,
    spark: { points: fillSparkPoints(sparkRows, 14), unit: "views/day" },
    recent: recentRows.map((r) => ({
      title: shortenText(r.path),
      meta: fmtRelDays(r.created_at),
    })),
  };
}

async function monitorKpi(): Promise<CardKpi> {
  const sql = getDb();
  const [summary, sparkRows, recentRows] = await Promise.all([
    safe(
      () => getLevelSummary("1 day"),
      { info: 0, warn: 0, error: 0 },
      "monitor.levels"
    ),
    safe(
      async () =>
        (await sql`
          SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS n
          FROM monitoring_events
          WHERE created_at > now() - interval '14 days'
          GROUP BY 1 ORDER BY 1
        `) as { day: string; n: number }[],
      [] as { day: string; n: number }[],
      "monitor.spark"
    ),
    safe(
      async () =>
        (await sql`
          SELECT event, level, created_at
          FROM monitoring_events
          ORDER BY created_at DESC
          LIMIT 5
        `) as { event: string; level: string; created_at: string }[],
      [] as { event: string; level: string; created_at: string }[],
      "monitor.recent"
    ),
  ]);
  const total = summary.info + summary.warn + summary.error;
  const errors = summary.error;
  return {
    primary: `${fmt(total)} events`,
    secondary: errors > 0 ? `${fmt(errors)} error${errors === 1 ? "" : "s"} in last 24h` : "no errors logged",
    tone: errors > 0 ? "warning" : total > 0 ? "neutral" : "positive",
    details: [
      { label: "Info", value: fmt(summary.info) },
      {
        label: "Warn",
        value: fmt(summary.warn),
        tone: summary.warn > 0 ? "warning" : "neutral",
      },
      {
        label: "Error",
        value: fmt(summary.error),
        tone: summary.error > 0 ? "danger" : "positive",
      },
    ],
    spark: { points: fillSparkPoints(sparkRows, 14), unit: "events/day" },
    recent: recentRows.map((r) => ({
      title: shortenText(r.event, 32),
      meta: fmtRelDays(r.created_at),
      tone:
        r.level === "error"
          ? "danger"
          : r.level === "warn"
            ? "warning"
            : "neutral",
    })),
  };
}

async function scansKpi(): Promise<CardKpi> {
  const sql = getDb();
  const [rows, sparkRows, recentRows] = await Promise.all([
    safe(
      async () =>
        (await sql`
          SELECT
            COUNT(*) FILTER (WHERE created_at > now() - interval '1 day')::int AS today,
            COUNT(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS week,
            COUNT(*) FILTER (WHERE status IN ('pending', 'scanning', 'analyzing'))::int AS active,
            COUNT(*) FILTER (WHERE status = 'failed' AND created_at > now() - interval '7 days')::int AS failed_week,
            COUNT(*) FILTER (WHERE status = 'complete' AND created_at > now() - interval '7 days')::int AS complete_week
          FROM scans
        `) as {
          today: number;
          week: number;
          active: number;
          failed_week: number;
          complete_week: number;
        }[],
      [] as {
        today: number;
        week: number;
        active: number;
        failed_week: number;
        complete_week: number;
      }[],
      "scans.counts"
    ),
    safe(
      async () =>
        (await sql`
          SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS n
          FROM scans
          WHERE created_at > now() - interval '14 days'
          GROUP BY 1 ORDER BY 1
        `) as { day: string; n: number }[],
      [] as { day: string; n: number }[],
      "scans.spark"
    ),
    safe(
      async () =>
        (await sql`
          SELECT url, status, created_at
          FROM scans
          ORDER BY created_at DESC
          LIMIT 5
        `) as { url: string; status: string; created_at: string }[],
      [] as { url: string; status: string; created_at: string }[],
      "scans.recent"
    ),
  ]);
  const r = rows[0] ?? {
    today: 0,
    week: 0,
    active: 0,
    failed_week: 0,
    complete_week: 0,
  };
  const successRate =
    r.week > 0 ? (r.complete_week / r.week) * 100 : 0;
  return {
    primary: `${fmt(r.today)} today`,
    secondary:
      r.active > 0
        ? `${r.active} running now`
        : "no scans in flight",
    tone: r.active > 0 ? "positive" : "neutral",
    details: [
      { label: "Last 7 days", value: fmt(r.week) },
      {
        label: "Success rate (7d)",
        value: r.week > 0 ? fmtPct(successRate, 1) : "-",
        tone:
          r.week === 0
            ? "neutral"
            : successRate >= 95
              ? "positive"
              : successRate >= 80
                ? "warning"
                : "danger",
      },
      {
        label: "Failed (7d)",
        value: fmt(r.failed_week),
        tone: r.failed_week > 0 ? "warning" : "neutral",
      },
    ],
    spark: { points: fillSparkPoints(sparkRows, 14), unit: "scans/day" },
    recent: recentRows.map((row) => ({
      title: shortenText(row.url.replace(/^https?:\/\//, ""), 36),
      meta: `${row.status} · ${fmtRelDays(row.created_at)}`,
      tone:
        row.status === "complete"
          ? "positive"
          : row.status === "failed"
            ? "danger"
            : "neutral",
    })),
  };
}

async function leadsKpi(): Promise<CardKpi> {
  const sql = getDb();
  const [rows, sparkRows, recentRows] = await Promise.all([
    safe(
      async () => {
        const [leads, contacts, leads24, contacts24] = (await Promise.all([
          sql`SELECT COUNT(*)::int AS n FROM leads WHERE created_at > now() - interval '7 days'`,
          sql`SELECT COUNT(*)::int AS n FROM contact_submissions WHERE created_at > now() - interval '7 days'`,
          sql`SELECT COUNT(*)::int AS n FROM leads WHERE created_at > now() - interval '1 day'`,
          sql`SELECT COUNT(*)::int AS n FROM contact_submissions WHERE created_at > now() - interval '1 day'`,
        ])) as { n: number }[][];
        return {
          leads: Number(leads[0]?.n ?? 0),
          contacts: Number(contacts[0]?.n ?? 0),
          leads24: Number(leads24[0]?.n ?? 0),
          contacts24: Number(contacts24[0]?.n ?? 0),
        };
      },
      { leads: 0, contacts: 0, leads24: 0, contacts24: 0 },
      "leads.counts"
    ),
    safe(
      async () =>
        (await sql`
          SELECT day, SUM(n)::int AS n FROM (
            SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS n
            FROM leads
            WHERE created_at > now() - interval '14 days'
            GROUP BY 1
            UNION ALL
            SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS n
            FROM contact_submissions
            WHERE created_at > now() - interval '14 days'
            GROUP BY 1
          ) t GROUP BY day ORDER BY day
        `) as { day: string; n: number }[],
      [] as { day: string; n: number }[],
      "leads.spark"
    ),
    safe(
      async () =>
        (await sql`
          SELECT title, source, created_at FROM (
            SELECT email AS title, 'scan signup' AS source, created_at
            FROM leads
            ORDER BY created_at DESC
            LIMIT 5
          ) UNION ALL (
            SELECT email AS title, 'contact form' AS source, created_at
            FROM contact_submissions
            ORDER BY created_at DESC
            LIMIT 5
          )
          ORDER BY created_at DESC
          LIMIT 5
        `) as { title: string; source: string; created_at: string }[],
      [] as { title: string; source: string; created_at: string }[],
      "leads.recent"
    ),
  ]);
  const total = rows.leads + rows.contacts;
  const total24 = rows.leads24 + rows.contacts24;
  return {
    primary: `${fmt(total)} this week`,
    secondary: `${rows.leads} scan signups, ${rows.contacts} contact form`,
    tone: total > 0 ? "positive" : "neutral",
    details: [
      {
        label: "Last 24h",
        value: `${fmt(total24)} new`,
        tone: total24 > 0 ? "positive" : "neutral",
      },
      { label: "Scan signups (7d)", value: fmt(rows.leads) },
      { label: "Contact form (7d)", value: fmt(rows.contacts) },
    ],
    spark: { points: fillSparkPoints(sparkRows, 14), unit: "leads/day" },
    recent: recentRows.map((row) => ({
      title: shortenText(row.title, 32),
      meta: `${row.source} · ${fmtRelDays(row.created_at)}`,
    })),
  };
}

async function funnelKpi(): Promise<CardKpi> {
  const sql = getDb();
  const [stages, sparkRows] = await Promise.all([
    safe(() => getFunnelStages(7), [], "funnel.stages"),
    safe(
      async () =>
        (await sql`
          SELECT date_trunc('day', started_at)::date AS day, COUNT(*)::int AS n
          FROM sessions
          WHERE started_at > now() - interval '14 days'
          GROUP BY 1 ORDER BY 1
        `) as { day: string; n: number }[],
      [] as { day: string; n: number }[],
      "funnel.spark"
    ),
  ]);
  const sessions = stages[0]?.count ?? 0;
  const scanStarts = stages[1]?.count ?? 0;
  const scanComplete = stages[2]?.count ?? 0;
  const contact = stages[3]?.count ?? 0;
  const scanRate = sessions > 0 ? (scanStarts / sessions) * 100 : 0;
  const completeRate = scanStarts > 0 ? (scanComplete / scanStarts) * 100 : 0;
  const contactRate = sessions > 0 ? (contact / sessions) * 100 : 0;
  return {
    primary: sessions > 0 ? `${scanRate.toFixed(1)}% scan rate` : "no sessions yet",
    secondary: `${fmt(sessions)} sessions this week`,
    tone: sessions === 0 ? "neutral" : scanRate >= 5 ? "positive" : scanRate >= 1 ? "neutral" : "warning",
    details: [
      {
        label: "Scan completion rate",
        value: scanStarts > 0 ? fmtPct(completeRate, 1) : "-",
        tone:
          scanStarts === 0
            ? "neutral"
            : completeRate >= 90
              ? "positive"
              : completeRate >= 70
                ? "warning"
                : "danger",
      },
      { label: "Scans started", value: fmt(scanStarts) },
      { label: "Scans completed", value: fmt(scanComplete) },
      {
        label: "Contact rate",
        value: sessions > 0 ? fmtPct(contactRate, 2) : "-",
      },
    ],
    spark: { points: fillSparkPoints(sparkRows, 14), unit: "sessions/day" },
  };
}

async function searchKpi(): Promise<CardKpi> {
  const sql = getDb();
  const [rows, sparkRows] = await Promise.all([
    safe(
      async () =>
        (await sql`
          SELECT
            COALESCE(SUM(impressions), 0)::int AS impressions,
            COALESCE(SUM(clicks), 0)::int AS clicks,
            COALESCE(AVG(NULLIF(position, 0)), 0)::float8 AS avg_position
          FROM search_console_daily
          WHERE date > current_date - interval '28 days'
        `) as { impressions: number; clicks: number; avg_position: number }[],
      [] as { impressions: number; clicks: number; avg_position: number }[],
      "search.totals"
    ),
    safe(
      async () =>
        (await sql`
          SELECT date::date AS day, SUM(clicks)::int AS n
          FROM search_console_daily
          WHERE date > current_date - interval '14 days'
          GROUP BY 1 ORDER BY 1
        `) as { day: string; n: number }[],
      [] as { day: string; n: number }[],
      "search.spark"
    ),
  ]);
  const r = rows[0] ?? { impressions: 0, clicks: 0, avg_position: 0 };
  if (r.impressions === 0) {
    return {
      primary: "no data yet",
      secondary: "Search Console import pending",
      tone: "neutral",
      details: [],
    };
  }
  const ctr = r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0;
  return {
    primary: `${fmt(r.clicks)} clicks`,
    secondary: `${fmt(r.impressions)} impressions, last 28 days`,
    tone: r.clicks > 0 ? "positive" : "neutral",
    details: [
      { label: "CTR", value: fmtPct(ctr, 2) },
      {
        label: "Avg position",
        value: r.avg_position > 0 ? r.avg_position.toFixed(1) : "-",
        tone:
          r.avg_position === 0
            ? "neutral"
            : r.avg_position <= 10
              ? "positive"
              : r.avg_position <= 20
                ? "warning"
                : "danger",
      },
      { label: "Impressions (28d)", value: fmt(r.impressions) },
    ],
    spark: { points: fillSparkPoints(sparkRows, 14), unit: "clicks/day" },
  };
}

async function rumKpi(): Promise<CardKpi> {
  const sql = getDb();
  const [rum, sparkRows] = await Promise.all([
    safe(() => getRumOverview(7), null, "rum.overview"),
    safe(
      async () =>
        (await sql`
          SELECT date_trunc('day', pv.created_at)::date AS day,
                 PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY eng.cwv_lcp_ms)::int AS n
          FROM page_views pv
          JOIN page_view_engagement eng ON eng.page_view_id = pv.id
          WHERE pv.created_at > now() - interval '14 days'
            AND pv.is_bot = false
            AND eng.cwv_lcp_ms IS NOT NULL
          GROUP BY 1 ORDER BY 1
        `) as { day: string; n: number }[],
      [] as { day: string; n: number }[],
      "rum.spark"
    ),
  ]);
  if (!rum || rum.views === 0 || rum.lcp.p75 === null) {
    return {
      primary: "no data yet",
      secondary: "needs real visitors with engagement beacons",
      tone: "neutral",
      details: [],
    };
  }
  const lcp = rum.lcp.p75;
  const tone: KpiTone = lcp <= 2500 ? "positive" : lcp <= 4000 ? "warning" : "danger";
  const inp = rum.inp.p75;
  const cls = rum.cls.p75;
  return {
    primary: `${(lcp / 1000).toFixed(2)}s LCP p75`,
    secondary: `${fmt(rum.views)} views measured this week`,
    tone,
    details: [
      {
        label: "INP p75",
        value: fmtMs(inp),
        tone:
          inp === null
            ? "neutral"
            : inp <= 200
              ? "positive"
              : inp <= 500
                ? "warning"
                : "danger",
      },
      {
        label: "CLS p75",
        value: cls === null ? "-" : cls.toFixed(3),
        tone:
          cls === null
            ? "neutral"
            : cls <= 0.1
              ? "positive"
              : cls <= 0.25
                ? "warning"
                : "danger",
      },
      { label: "LCP p50", value: fmtMs(rum.lcp.p50) },
    ],
    spark: { points: fillSparkPoints(sparkRows, 14), unit: "ms LCP p75" },
  };
}

async function emailKpi(): Promise<CardKpi> {
  const sql = getDb();
  const [rows, trendRows, recentRows] = await Promise.all([
    safe(() => getEmailKpiByType(7), [], "email.kpi"),
    safe(() => getEmailKpiTrend(14), [], "email.trend"),
    safe(
      async () =>
        (await sql`
          SELECT email_type, status, sent_at
          FROM email_events
          ORDER BY sent_at DESC
          LIMIT 5
        `) as { email_type: string | null; status: string; sent_at: string }[],
      [] as { email_type: string | null; status: string; sent_at: string }[],
      "email.recent"
    ),
  ]);
  const sparkRows = trendRows.map((r) => ({ day: r.day, n: r.delivered }));
  let sent = 0;
  let delivered = 0;
  let bounced = 0;
  let complained = 0;
  let failed = 0;
  for (const r of rows) {
    sent += r.sent;
    delivered += r.delivered;
    bounced += r.bounced;
    complained += r.complained;
    failed += r.failed;
  }
  if (sent === 0) {
    return {
      primary: "no sends this week",
      secondary: "delivery, bounce, complaint rate by type",
      tone: "neutral",
      details: [],
      spark: { points: fillSparkPoints(sparkRows, 14), unit: "delivered/day" },
    };
  }
  const deliveryRate = (delivered / sent) * 100;
  const bounceRate = (bounced / sent) * 100;
  const complaintRate = (complained / sent) * 100;
  const tone: KpiTone =
    bounceRate >= 5 ? "danger" : bounceRate >= 2 ? "warning" : "positive";
  return {
    primary: `${deliveryRate.toFixed(1)}% delivered`,
    secondary: `${fmt(sent)} sent, ${bounceRate.toFixed(1)}% bounced`,
    tone,
    details: [
      {
        label: "Complaint rate",
        value: fmtPct(complaintRate, 2),
        tone: complaintRate >= 0.1 ? "danger" : "positive",
      },
      { label: "Bounced (7d)", value: fmt(bounced) },
      {
        label: "Failed (7d)",
        value: fmt(failed),
        tone: failed > 0 ? "warning" : "neutral",
      },
      { label: "Sent (7d)", value: fmt(sent) },
    ],
    spark: { points: fillSparkPoints(sparkRows, 14), unit: "delivered/day" },
    recent: recentRows.map((row) => ({
      title: row.email_type ?? "email",
      meta: `${row.status} · ${fmtRelDays(row.sent_at)}`,
      tone:
        row.status === "delivered"
          ? "positive"
          : row.status === "bounced" || row.status === "complained"
            ? "danger"
            : row.status === "delivery_delayed" || row.status === "failed"
              ? "warning"
              : "neutral",
    })),
  };
}

async function costsKpi(): Promise<CardKpi> {
  /* 24h totals plus 7d totals so the operator sees both today and the
   * weekly trend. Six small queries run in parallel; each is cached
   * in api_usage_events so the cost is negligible. */
  const sql = getDb();
  const [a24, b24, p24, e24, a7, b7, p7, e7, sparkRows] = await Promise.all([
    safe(() => getProviderSpendUsd("anthropic", 24), 0, "costs.anthropic.24h"),
    safe(() => getProviderSpendUsd("browserless", 24), 0, "costs.browserless.24h"),
    safe(() => getProviderSpendUsd("pagespeed", 24), 0, "costs.pagespeed.24h"),
    safe(() => getProviderSpendUsd("elevenlabs", 24), 0, "costs.elevenlabs.24h"),
    safe(() => getProviderSpendUsd("anthropic", 24 * 7), 0, "costs.anthropic.7d"),
    safe(() => getProviderSpendUsd("browserless", 24 * 7), 0, "costs.browserless.7d"),
    safe(() => getProviderSpendUsd("pagespeed", 24 * 7), 0, "costs.pagespeed.7d"),
    safe(() => getProviderSpendUsd("elevenlabs", 24 * 7), 0, "costs.elevenlabs.7d"),
    safe(
      async () =>
        (await sql`
          SELECT date_trunc('day', occurred_at)::date AS day,
                 COALESCE(SUM(cost_usd), 0)::float8 AS n
          FROM api_usage_events
          WHERE occurred_at > now() - interval '14 days'
          GROUP BY 1 ORDER BY 1
        `) as { day: string; n: number }[],
      [] as { day: string; n: number }[],
      "costs.spark"
    ),
  ]);
  const total24 = a24 + b24 + p24 + e24;
  const total7 = a7 + b7 + p7 + e7;
  return {
    primary: `${fmtUsd(total24)} today`,
    secondary: `Anthropic ${fmtUsd(a24)}, Browserless ${fmtUsd(b24)}`,
    tone: total24 > 50 ? "warning" : "neutral",
    details: [
      {
        label: "Last 7 days",
        value: fmtUsd(total7),
        tone: total7 > 250 ? "warning" : "neutral",
      },
      { label: "Anthropic (7d)", value: fmtUsd(a7) },
      { label: "Browserless (7d)", value: fmtUsd(b7) },
      {
        label: "ElevenLabs (7d)",
        value: fmtUsd(e7),
        tone: e7 > 0 ? "neutral" : "neutral",
      },
    ],
    spark: { points: fillSparkPoints(sparkRows, 14), unit: "USD/day" },
  };
}

async function databaseKpi(): Promise<CardKpi> {
  const sql = getDb();
  const [data, sparkRows] = await Promise.all([
    safe(
      async () => {
        const [scans, pv, sessions, leads, contacts] = (await Promise.all([
          sql`SELECT COUNT(*)::int AS n FROM scans`,
          sql`SELECT COUNT(*)::int AS n FROM page_views`,
          sql`SELECT COUNT(*)::int AS n FROM sessions`,
          sql`SELECT COUNT(*)::int AS n FROM leads`,
          sql`SELECT COUNT(*)::int AS n FROM contact_submissions`,
        ])) as { n: number }[][];
        return {
          scans: Number(scans[0]?.n ?? 0),
          pageViews: Number(pv[0]?.n ?? 0),
          sessions: Number(sessions[0]?.n ?? 0),
          leads: Number(leads[0]?.n ?? 0),
          contacts: Number(contacts[0]?.n ?? 0),
        };
      },
      { scans: 0, pageViews: 0, sessions: 0, leads: 0, contacts: 0 },
      "database.counts"
    ),
    safe(
      async () =>
        (await sql`
          SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS n
          FROM page_views
          WHERE created_at > now() - interval '14 days'
          GROUP BY 1 ORDER BY 1
        `) as { day: string; n: number }[],
      [] as { day: string; n: number }[],
      "database.spark"
    ),
  ]);
  return {
    primary: `${fmt(data.scans)} scans`,
    secondary: `${fmt(data.pageViews)} page views recorded`,
    tone: "neutral",
    details: [
      { label: "Sessions", value: fmt(data.sessions) },
      { label: "Page views", value: fmt(data.pageViews) },
      { label: "Leads", value: fmt(data.leads) },
      { label: "Contact submissions", value: fmt(data.contacts) },
    ],
    spark: { points: fillSparkPoints(sparkRows, 14), unit: "rows/day" },
  };
}

async function clientsKpi(): Promise<CardKpi> {
  const stats = await safe(
    () => getClientStats(),
    {
      totalClients: 0,
      activeClients: 0,
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
    },
    "clients.stats"
  );
  return {
    primary:
      stats.activeClients > 0
        ? `${stats.activeClients} active`
        : `${stats.totalClients} total`,
    secondary: `${stats.activeProjects} active project${stats.activeProjects === 1 ? "" : "s"}`,
    tone: stats.activeClients > 0 ? "positive" : "neutral",
    details: [
      { label: "Total clients", value: fmt(stats.totalClients) },
      { label: "Active projects", value: fmt(stats.activeProjects) },
      {
        label: "Completed projects",
        value: fmt(stats.completedProjects),
        tone: stats.completedProjects > 0 ? "positive" : "neutral",
      },
    ],
  };
}

async function auditKpi(): Promise<CardKpi> {
  const sql = getDb();
  const [rows, sparkRows, recentRows] = await Promise.all([
    safe(
      async () =>
        (await sql`
          SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE result = 'denied')::int AS denied,
            COUNT(DISTINCT email)::int AS actors,
            COUNT(*) FILTER (WHERE created_at > now() - interval '1 hour')::int AS last_hour
          FROM admin_audit_log
          WHERE created_at > now() - interval '1 day'
        `) as {
          total: number;
          denied: number;
          actors: number;
          last_hour: number;
        }[],
      [] as {
        total: number;
        denied: number;
        actors: number;
        last_hour: number;
      }[],
      "audit.counts"
    ),
    safe(
      async () =>
        (await sql`
          SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS n
          FROM admin_audit_log
          WHERE created_at > now() - interval '14 days'
          GROUP BY 1 ORDER BY 1
        `) as { day: string; n: number }[],
      [] as { day: string; n: number }[],
      "audit.spark"
    ),
    safe(
      async () =>
        (await sql`
          SELECT email, event, result, created_at
          FROM admin_audit_log
          ORDER BY created_at DESC
          LIMIT 5
        `) as {
          email: string | null;
          event: string;
          result: string;
          created_at: string;
        }[],
      [] as {
        email: string | null;
        event: string;
        result: string;
        created_at: string;
      }[],
      "audit.recent"
    ),
  ]);
  const r = rows[0] ?? { total: 0, denied: 0, actors: 0, last_hour: 0 };
  return {
    primary: `${fmt(r.total)} events`,
    secondary:
      r.denied > 0
        ? `${r.denied} denied in last 24h`
        : "no denials in last 24h",
    tone: r.denied > 0 ? "warning" : "positive",
    details: [
      {
        label: "Last hour",
        value: fmt(r.last_hour),
        tone: r.last_hour > 0 ? "neutral" : "neutral",
      },
      { label: "Distinct actors (24h)", value: fmt(r.actors) },
      {
        label: "Denied (24h)",
        value: fmt(r.denied),
        tone: r.denied > 0 ? "warning" : "positive",
      },
    ],
    spark: { points: fillSparkPoints(sparkRows, 14), unit: "events/day" },
    recent: recentRows.map((row) => ({
      title: shortenText(row.email ?? "unknown", 28),
      meta: `${row.event} · ${fmtRelDays(row.created_at)}`,
      tone: row.result === "denied" ? "warning" : "neutral",
    })),
  };
}

async function pipelineKpi(): Promise<CardKpi> {
  const sql = getDb();
  const [rows, sparkRows, recentRows] = await Promise.all([
    safe(
      async () =>
        (await sql`
          SELECT
            COUNT(*)::int AS runs,
            COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
            COUNT(*) FILTER (WHERE status IN ('running', 'started'))::int AS running,
            AVG(EXTRACT(EPOCH FROM (ended_at - started_at)) * 1000)
              FILTER (WHERE status = 'completed' AND ended_at IS NOT NULL AND started_at IS NOT NULL)
              ::float8 AS avg_duration_ms
          FROM inngest_runs
          WHERE COALESCE(started_at, observed_at) > now() - interval '24 hours'
        `) as {
          runs: number;
          failed: number;
          running: number;
          avg_duration_ms: number | null;
        }[],
      [] as {
        runs: number;
        failed: number;
        running: number;
        avg_duration_ms: number | null;
      }[],
      "pipeline.runs"
    ),
    safe(
      async () =>
        (await sql`
          SELECT date_trunc('day', COALESCE(started_at, observed_at))::date AS day,
                 COUNT(*)::int AS n
          FROM inngest_runs
          WHERE COALESCE(started_at, observed_at) > now() - interval '14 days'
          GROUP BY 1 ORDER BY 1
        `) as { day: string; n: number }[],
      [] as { day: string; n: number }[],
      "pipeline.spark"
    ),
    safe(
      async () =>
        (await sql`
          SELECT function_id, status, COALESCE(started_at, observed_at) AS at
          FROM inngest_runs
          ORDER BY COALESCE(started_at, observed_at) DESC
          LIMIT 5
        `) as { function_id: string; status: string; at: string }[],
      [] as { function_id: string; status: string; at: string }[],
      "pipeline.recent"
    ),
  ]);
  const r = rows[0] ?? { runs: 0, failed: 0, running: 0, avg_duration_ms: null };
  if (r.runs === 0) {
    return {
      primary: "idle",
      secondary: "no Inngest runs in last 24h",
      tone: "neutral",
      details: [],
      spark: { points: fillSparkPoints(sparkRows, 14), unit: "runs/day" },
      recent: recentRows.map((row) => ({
        title: shortenText(row.function_id, 32),
        meta: `${row.status} · ${fmtRelDays(row.at)}`,
        tone: row.status === "failed" ? "danger" : "neutral",
      })),
    };
  }
  const successRate = ((r.runs - r.failed) / r.runs) * 100;
  const tone: KpiTone = r.failed === 0 ? "positive" : successRate >= 95 ? "warning" : "danger";
  return {
    primary: `${successRate.toFixed(1)}% success`,
    secondary: `${fmt(r.runs)} runs, ${r.failed} failed (24h)`,
    tone,
    details: [
      {
        label: "Running now",
        value: fmt(r.running),
        tone: r.running > 0 ? "positive" : "neutral",
      },
      { label: "Avg duration", value: fmtMs(r.avg_duration_ms) },
      {
        label: "Failed (24h)",
        value: fmt(r.failed),
        tone: r.failed > 0 ? "danger" : "positive",
      },
    ],
    spark: { points: fillSparkPoints(sparkRows, 14), unit: "runs/day" },
    recent: recentRows.map((row) => ({
      title: shortenText(row.function_id, 32),
      meta: `${row.status} · ${fmtRelDays(row.at)}`,
      tone:
        row.status === "failed"
          ? "danger"
          : row.status === "completed"
            ? "positive"
            : "neutral",
    })),
  };
}

async function platformKpi(): Promise<CardKpi> {
  const sql = getDb();
  const [summary, sparkRows, recentDeploys] = await Promise.all([
    safe(
      () => getCurrentDeploymentSummary(),
      {
        productionState: null as string | null,
        productionUrl: null as string | null,
        productionAge: null as string | null,
        failedLast24h: 0,
        buildingNow: 0,
      },
      "platform.deploy"
    ),
    safe(
      async () =>
        (await sql`
          SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS n
          FROM vercel_deployments
          WHERE created_at > now() - interval '14 days'
          GROUP BY 1 ORDER BY 1
        `) as { day: string; n: number }[],
      [] as { day: string; n: number }[],
      "platform.spark"
    ),
    safe(() => getRecentDeployments(5), [], "platform.recent"),
  ]);
  const state = summary.productionState ?? "UNKNOWN";
  const tone: KpiTone =
    state === "READY"
      ? "positive"
      : state === "ERROR"
        ? "danger"
        : state === "BUILDING" || state === "QUEUED" || state === "INITIALIZING"
          ? "warning"
          : "neutral";
  const details: KpiDetail[] = [];
  if (summary.productionUrl) {
    /* Strip protocol for compactness; the full URL on hover is overkill. */
    const host = summary.productionUrl
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    details.push({ label: "Production", value: host });
  }
  if (summary.productionAge) {
    details.push({ label: "Last deploy", value: fmtRelDays(summary.productionAge) });
  }
  details.push({
    label: "Building now",
    value: fmt(summary.buildingNow),
    tone: summary.buildingNow > 0 ? "warning" : "neutral",
  });
  details.push({
    label: "Failed (24h)",
    value: fmt(summary.failedLast24h),
    tone: summary.failedLast24h > 0 ? "warning" : "positive",
  });
  return {
    primary: state === "UNKNOWN" ? "no data" : state.toLowerCase(),
    secondary:
      summary.buildingNow > 0
        ? `${summary.buildingNow} building, ${summary.failedLast24h} failed (24h)`
        : `${summary.failedLast24h} failed deploy${summary.failedLast24h === 1 ? "" : "s"} (24h)`,
    tone,
    details,
    spark: { points: fillSparkPoints(sparkRows, 14), unit: "deploys/day" },
    recent: recentDeploys.map((d) => {
      const label = d.commitMessage
        ? shortenText(d.commitMessage, 36)
        : d.branch
          ? `${d.branch}${d.commitSha ? ` · ${d.commitSha.slice(0, 7)}` : ""}`
          : "deploy";
      return {
        title: label,
        meta: `${d.state.toLowerCase()} · ${fmtRelDays(d.createdAt)}`,
        tone:
          d.state === "READY"
            ? "positive"
            : d.state === "ERROR"
              ? "danger"
              : d.state === "BUILDING" || d.state === "QUEUED"
                ? "warning"
                : "neutral",
      };
    }),
  };
}

async function errorsKpi(): Promise<CardKpi> {
  const issues = await safe(() => getTopSentryIssues(), [], "errors.sentry");
  if (issues.length === 0) {
    return {
      primary: "0 unresolved",
      secondary: "Sentry trailing 24h is clean",
      tone: "positive",
      details: [],
    };
  }
  let totalEvents = 0;
  let fatal = 0;
  let errorLevel = 0;
  for (const i of issues) {
    totalEvents += i.count;
    if (i.level === "fatal") fatal += 1;
    else if (i.level === "error") errorLevel += 1;
  }
  /* Top issue title trimmed to keep the panel compact. */
  const top = issues[0];
  const topTitle = top
    ? top.title.length > 48
      ? `${top.title.slice(0, 45)}...`
      : top.title
    : null;
  const details: KpiDetail[] = [];
  if (topTitle && top) {
    details.push({
      label: "Top issue",
      value: `${topTitle} (${fmt(top.count)})`,
      tone:
        top.level === "fatal"
          ? "danger"
          : top.level === "error"
            ? "warning"
            : "neutral",
    });
  }
  details.push({
    label: "Fatal level",
    value: fmt(fatal),
    tone: fatal > 0 ? "danger" : "positive",
  });
  details.push({
    label: "Error level",
    value: fmt(errorLevel),
    tone: errorLevel > 0 ? "warning" : "positive",
  });
  details.push({ label: "Total events (24h)", value: fmt(totalEvents) });
  return {
    primary: `${issues.length} unresolved`,
    secondary: `${fmt(totalEvents)} total event${totalEvents === 1 ? "" : "s"} in last 24h`,
    tone: issues.length >= 5 ? "danger" : "warning",
    details,
    recent: issues.slice(0, 5).map((i) => ({
      title: shortenText(i.title, 40),
      meta: `${fmt(i.count)} event${i.count === 1 ? "" : "s"} · ${i.level}`,
      tone:
        i.level === "fatal"
          ? "danger"
          : i.level === "error"
            ? "warning"
            : "neutral",
    })),
  };
}

async function infrastructureKpi(): Promise<CardKpi> {
  const rows = await safe(() => getLatestInfraStatuses(), [], "infra.status");
  if (rows.length === 0) {
    return {
      primary: "no data yet",
      secondary: "infrastructure check has not run",
      tone: "neutral",
      details: [],
    };
  }
  let fail = 0;
  let warn = 0;
  let pass = 0;
  /* Find the closest-to-expiry TLS cert across all domains. Surfaces
   * the renewal headroom number every operator actually wants. */
  let closestTls: { target: string; days: number } | null = null;
  const now = Date.now();
  for (const r of rows) {
    if (r.status === "fail") fail += 1;
    else if (r.status === "warn") warn += 1;
    else pass += 1;
    if (r.resource === "tls" && r.expiresAt) {
      const days = Math.floor(
        (new Date(r.expiresAt).getTime() - now) / 86_400_000
      );
      if (closestTls === null || days < closestTls.days) {
        closestTls = { target: r.target, days };
      }
    }
  }
  const tone: KpiTone = fail > 0 ? "danger" : warn > 0 ? "warning" : "positive";
  const details: KpiDetail[] = [];
  if (closestTls) {
    details.push({
      label: "Closest TLS expiry",
      value: `${closestTls.target} (${closestTls.days}d)`,
      tone:
        closestTls.days <= 7
          ? "danger"
          : closestTls.days <= 14
            ? "warning"
            : "positive",
    });
  }
  details.push({ label: "Passing", value: fmt(pass), tone: "positive" });
  details.push({
    label: "Warning",
    value: fmt(warn),
    tone: warn > 0 ? "warning" : "neutral",
  });
  details.push({
    label: "Failing",
    value: fmt(fail),
    tone: fail > 0 ? "danger" : "positive",
  });
  /* Surface the most-recently-checked rows as the recent feed,
   * weighted to fails/warns first so the panel reads as an action list. */
  const sorted = [...rows].sort((a, b) => {
    const order = (s: string) => (s === "fail" ? 0 : s === "warn" ? 1 : 2);
    const diff = order(a.status) - order(b.status);
    if (diff !== 0) return diff;
    return new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime();
  });
  return {
    primary: fail === 0 && warn === 0 ? `${pass} checks passing` : `${fail} failing, ${warn} warning`,
    secondary: `${rows.length} domain check${rows.length === 1 ? "" : "s"} total`,
    tone,
    details,
    recent: sorted.slice(0, 5).map((r) => ({
      title: shortenText(`${r.target} · ${r.resource}`, 36),
      meta: `${r.status} · ${fmtRelDays(r.checkedAt)}`,
      tone:
        r.status === "fail"
          ? "danger"
          : r.status === "warn"
            ? "warning"
            : "positive",
    })),
  };
}

async function recurringKpi(): Promise<CardKpi> {
  const [count7, count30] = await Promise.all([
    safe(() => getRecurringVisitorCount(7), 0, "recurring.count.7d"),
    safe(() => getRecurringVisitorCount(30), 0, "recurring.count.30d"),
  ]);
  return {
    primary: count7 > 0 ? `${fmt(count7)} recurring` : "no repeat visits yet",
    secondary: "visitors with more than one session, last 7 days",
    tone: count7 > 0 ? "positive" : "neutral",
    details: [
      {
        label: "Last 30 days",
        value: fmt(count30),
        tone: count30 > 0 ? "positive" : "neutral",
      },
      {
        label: "Growth (30d vs 7d)",
        value: count7 > 0 ? `+${fmt(Math.max(0, count30 - count7))}` : "-",
      },
    ],
  };
}

async function usersKpi(): Promise<CardKpi> {
  const users = await safe(() => listAdminUsers(), [], "users.list");
  const active = users.filter((u) => u.status === "active").length;
  const disabled = users.filter((u) => u.status === "disabled").length;
  const total = users.length;
  /* getAllowlistSize is synchronous (env-var parse). No try wrapping needed. */
  const allowlistSize = getAllowlistSize();
  return {
    primary: `${active} invited admin${active === 1 ? "" : "s"}`,
    secondary:
      disabled > 0
        ? `${disabled} disabled, plus bootstrap allowlist`
        : "plus bootstrap allowlist",
    tone: "neutral",
    details: [
      { label: "Active", value: fmt(active), tone: active > 0 ? "positive" : "neutral" },
      {
        label: "Disabled",
        value: fmt(disabled),
        tone: disabled > 0 ? "warning" : "neutral",
      },
      { label: "DB total", value: fmt(total) },
      { label: "Bootstrap allowlist", value: fmt(allowlistSize) },
    ],
  };
}

async function relationshipsKpi(): Promise<CardKpi> {
  const [summary, daily, recent] = await Promise.all([
    safe(
      () => getContactsDashboardSummary(),
      { total: 0, newThisWeek: 0, overdue: 0, byStatus: { new: 0, contacted: 0, qualified: 0, proposal: 0, won: 0, lost: 0 } },
      "relationships.summary"
    ),
    safe(() => getDailyNewContacts(14), [], "relationships.daily"),
    safe(() => getRecentRelationshipEvents(3), [], "relationships.recent"),
  ]);

  let primary: string;
  let tone: KpiTone;
  if (summary.overdue > 0) {
    primary = `${fmt(summary.overdue)} overdue`;
    tone = "danger";
  } else if (summary.newThisWeek > 0) {
    primary = `${fmt(summary.newThisWeek)} new this week`;
    tone = "neutral";
  } else if (summary.total > 0) {
    primary = "All caught up";
    tone = "positive";
  } else {
    primary = "No contacts yet";
    tone = "neutral";
  }

  const sparkPoints: SparkPoint[] = daily.map((d) => ({
    label: shortDayLabel(d.date),
    value: d.count,
  }));

  return {
    primary,
    secondary: `${fmt(summary.total)} total contact${summary.total === 1 ? "" : "s"}`,
    tone,
    details: [
      {
        label: "New (status)",
        value: fmt(summary.byStatus.new),
        tone: summary.byStatus.new > 0 ? "neutral" : undefined,
      },
      {
        label: "Contacted",
        value: fmt(summary.byStatus.contacted),
      },
      {
        label: "Qualified",
        value: fmt(summary.byStatus.qualified),
      },
      {
        label: "Proposal",
        value: fmt(summary.byStatus.proposal),
        tone: summary.byStatus.proposal > 0 ? "positive" : undefined,
      },
      {
        label: "Won",
        value: fmt(summary.byStatus.won),
        tone: summary.byStatus.won > 0 ? "positive" : undefined,
      },
      {
        label: "Overdue",
        value: fmt(summary.overdue),
        tone: summary.overdue > 0 ? "danger" : "positive",
      },
    ],
    spark: sparkPoints.length > 0
      ? { points: sparkPoints, unit: "new/day" }
      : undefined,
    recent:
      recent.length > 0
        ? recent.map((r) => ({
            title: r.title,
            meta: fmtRelDays(r.timestamp),
          }))
        : undefined,
  };
}

/**
 * Fetch every dashboard KPI in parallel. Returns a map keyed by the
 * card's href so the dashboard page can look up KPIs by Card.href
 * without an extra index lookup.
 */
export async function getDashboardKpis(): Promise<DashboardKpiMap> {
  const [
    visitors,
    monitor,
    scans,
    leads,
    funnel,
    search,
    rum,
    email,
    recurring,
    relationships,
    costs,
    database,
    clients,
    audit,
    pipeline,
    platform,
    errors,
    infrastructure,
    users,
  ] = await Promise.all([
    visitorsKpi(),
    monitorKpi(),
    scansKpi(),
    leadsKpi(),
    funnelKpi(),
    searchKpi(),
    rumKpi(),
    emailKpi(),
    recurringKpi(),
    relationshipsKpi(),
    costsKpi(),
    databaseKpi(),
    clientsKpi(),
    auditKpi(),
    pipelineKpi(),
    platformKpi(),
    errorsKpi(),
    infrastructureKpi(),
    usersKpi(),
  ]);

  return {
    "/admin/visitors": visitors,
    "/admin/monitor": monitor,
    "/admin/scans": scans,
    "/admin/leads": leads,
    "/admin/funnel": funnel,
    "/admin/search": search,
    "/admin/performance/rum": rum,
    "/admin/email": email,
    "/admin/recurring": recurring,
    "/admin/contacts": relationships,
    "/admin/costs": costs,
    "/admin/database": database,
    "/admin/clients": clients,
    "/admin/audit": audit,
    "/admin/pipeline": pipeline,
    "/admin/platform": platform,
    "/admin/errors": errors,
    "/admin/infrastructure": infrastructure,
    "/admin/users": users,
  };
}
