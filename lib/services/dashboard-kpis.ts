import { getDb } from "@/lib/db";
import {
  getLiveVisitors,
  getRecurringVisitorCount,
  getVisitorOverview,
} from "@/lib/services/analytics";
import { getFunnelStages } from "@/lib/services/funnel";
import { getRumOverview } from "@/lib/services/rum";
import { getEmailKpiByType } from "@/lib/services/email-kpi";
import { getProviderSpendUsd } from "@/lib/services/api-usage";
import { getClientStats } from "@/lib/auth/clients";
import { getCurrentDeploymentSummary } from "@/lib/services/vercel-platform";
import { getTopSentryIssues } from "@/lib/services/sentry-summary";
import { getLatestInfraStatuses } from "@/lib/services/infrastructure";
import { getLevelSummary } from "@/lib/services/monitoring";
import { listAdminUsers } from "@/lib/auth/users";

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

export type CardKpi = {
  primary: string;
  secondary?: string;
  tone?: KpiTone;
};

export type DashboardKpiMap = Record<string, CardKpi>;

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function fmtUsd(n: number): string {
  return `$${n.toFixed(2)}`;
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
  const [live, overview] = await Promise.all([
    safe(() => getLiveVisitors(), [], "visitors.live"),
    safe(() => getVisitorOverview("1 day"), null, "visitors.overview"),
  ]);
  const liveCount = live.length;
  const todayViews = overview?.pageViews ?? 0;
  return {
    primary: liveCount > 0 ? `${liveCount} live` : `${fmt(todayViews)} views`,
    secondary:
      liveCount > 0
        ? `${fmt(todayViews)} views in last 24h`
        : "in the last 24 hours",
    tone: liveCount > 0 ? "positive" : "neutral",
  };
}

async function monitorKpi(): Promise<CardKpi> {
  const summary = await safe(
    () => getLevelSummary("1 day"),
    { info: 0, warn: 0, error: 0 },
    "monitor.levels"
  );
  const total = summary.info + summary.warn + summary.error;
  const errors = summary.error;
  return {
    primary: `${fmt(total)} events`,
    secondary: errors > 0 ? `${fmt(errors)} error${errors === 1 ? "" : "s"} in last 24h` : "no errors logged",
    tone: errors > 0 ? "warning" : total > 0 ? "neutral" : "positive",
  };
}

async function scansKpi(): Promise<CardKpi> {
  const rows = await safe(
    async () => {
      const sql = getDb();
      return (await sql`
        SELECT
          COUNT(*) FILTER (WHERE created_at > now() - interval '1 day')::int AS today,
          COUNT(*) FILTER (WHERE status IN ('pending', 'scanning', 'analyzing'))::int AS active
        FROM scans
      `) as { today: number; active: number }[];
    },
    [] as { today: number; active: number }[],
    "scans.counts"
  );
  const r = rows[0] ?? { today: 0, active: 0 };
  return {
    primary: `${fmt(r.today)} today`,
    secondary:
      r.active > 0
        ? `${r.active} running now`
        : "no scans in flight",
    tone: r.active > 0 ? "positive" : "neutral",
  };
}

async function leadsKpi(): Promise<CardKpi> {
  const rows = await safe(
    async () => {
      const sql = getDb();
      const [leads, contacts] = (await Promise.all([
        sql`SELECT COUNT(*)::int AS n FROM leads WHERE created_at > now() - interval '7 days'`,
        sql`SELECT COUNT(*)::int AS n FROM contact_submissions WHERE created_at > now() - interval '7 days'`,
      ])) as { n: number }[][];
      return {
        leads: Number(leads[0]?.n ?? 0),
        contacts: Number(contacts[0]?.n ?? 0),
      };
    },
    { leads: 0, contacts: 0 },
    "leads.counts"
  );
  const total = rows.leads + rows.contacts;
  return {
    primary: `${fmt(total)} this week`,
    secondary: `${rows.leads} scan signups, ${rows.contacts} contact form`,
    tone: total > 0 ? "positive" : "neutral",
  };
}

async function funnelKpi(): Promise<CardKpi> {
  const stages = await safe(() => getFunnelStages(7), [], "funnel.stages");
  const sessions = stages[0]?.count ?? 0;
  const scanStarts = stages[1]?.count ?? 0;
  const rate = sessions > 0 ? (scanStarts / sessions) * 100 : 0;
  return {
    primary: sessions > 0 ? `${rate.toFixed(1)}% scan rate` : "no sessions yet",
    secondary: `${fmt(sessions)} sessions this week`,
    tone: sessions === 0 ? "neutral" : rate >= 5 ? "positive" : rate >= 1 ? "neutral" : "warning",
  };
}

async function searchKpi(): Promise<CardKpi> {
  const rows = await safe(
    async () => {
      const sql = getDb();
      return (await sql`
        SELECT
          COALESCE(SUM(impressions), 0)::int AS impressions,
          COALESCE(SUM(clicks), 0)::int AS clicks
        FROM search_console_daily
        WHERE date > current_date - interval '28 days'
      `) as { impressions: number; clicks: number }[];
    },
    [] as { impressions: number; clicks: number }[],
    "search.totals"
  );
  const r = rows[0] ?? { impressions: 0, clicks: 0 };
  if (r.impressions === 0) {
    return {
      primary: "no data yet",
      secondary: "Search Console import pending",
      tone: "neutral",
    };
  }
  return {
    primary: `${fmt(r.clicks)} clicks`,
    secondary: `${fmt(r.impressions)} impressions, last 28 days`,
    tone: r.clicks > 0 ? "positive" : "neutral",
  };
}

async function rumKpi(): Promise<CardKpi> {
  const rum = await safe(() => getRumOverview(7), null, "rum.overview");
  if (!rum || rum.views === 0 || rum.lcp.p75 === null) {
    return {
      primary: "no data yet",
      secondary: "needs real visitors with engagement beacons",
      tone: "neutral",
    };
  }
  const lcp = rum.lcp.p75;
  const tone: KpiTone = lcp <= 2500 ? "positive" : lcp <= 4000 ? "warning" : "danger";
  return {
    primary: `${(lcp / 1000).toFixed(2)}s LCP p75`,
    secondary: `${fmt(rum.views)} views measured this week`,
    tone,
  };
}

async function emailKpi(): Promise<CardKpi> {
  const rows = await safe(() => getEmailKpiByType(7), [], "email.kpi");
  let sent = 0;
  let delivered = 0;
  let bounced = 0;
  for (const r of rows) {
    sent += r.sent;
    delivered += r.delivered;
    bounced += r.bounced;
  }
  if (sent === 0) {
    return {
      primary: "no sends this week",
      secondary: "delivery, bounce, complaint rate by type",
      tone: "neutral",
    };
  }
  const deliveryRate = (delivered / sent) * 100;
  const bounceRate = (bounced / sent) * 100;
  const tone: KpiTone =
    bounceRate >= 5 ? "danger" : bounceRate >= 2 ? "warning" : "positive";
  return {
    primary: `${deliveryRate.toFixed(1)}% delivered`,
    secondary: `${fmt(sent)} sent, ${bounceRate.toFixed(1)}% bounced`,
    tone,
  };
}

async function costsKpi(): Promise<CardKpi> {
  const [anthropic, browserless, pagespeed, eleven] = await Promise.all([
    safe(() => getProviderSpendUsd("anthropic", 24), 0, "costs.anthropic"),
    safe(() => getProviderSpendUsd("browserless", 24), 0, "costs.browserless"),
    safe(() => getProviderSpendUsd("pagespeed", 24), 0, "costs.pagespeed"),
    safe(() => getProviderSpendUsd("elevenlabs", 24), 0, "costs.elevenlabs"),
  ]);
  const total = anthropic + browserless + pagespeed + eleven;
  return {
    primary: `${fmtUsd(total)} today`,
    secondary: `Anthropic ${fmtUsd(anthropic)}, Browserless ${fmtUsd(browserless)}`,
    tone: total > 50 ? "warning" : "neutral",
  };
}

async function databaseKpi(): Promise<CardKpi> {
  const rows = await safe(
    async () => {
      const sql = getDb();
      const [scans, pv] = (await Promise.all([
        sql`SELECT COUNT(*)::int AS n FROM scans`,
        sql`SELECT COUNT(*)::int AS n FROM page_views`,
      ])) as { n: number }[][];
      return {
        scans: Number(scans[0]?.n ?? 0),
        pageViews: Number(pv[0]?.n ?? 0),
      };
    },
    { scans: 0, pageViews: 0 },
    "database.counts"
  );
  return {
    primary: `${fmt(rows.scans)} scans`,
    secondary: `${fmt(rows.pageViews)} page views recorded`,
    tone: "neutral",
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
  };
}

async function auditKpi(): Promise<CardKpi> {
  const rows = await safe(
    async () => {
      const sql = getDb();
      return (await sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE result = 'denied')::int AS denied
        FROM admin_audit_log
        WHERE created_at > now() - interval '1 day'
      `) as { total: number; denied: number }[];
    },
    [] as { total: number; denied: number }[],
    "audit.counts"
  );
  const r = rows[0] ?? { total: 0, denied: 0 };
  return {
    primary: `${fmt(r.total)} events`,
    secondary:
      r.denied > 0
        ? `${r.denied} denied in last 24h`
        : "no denials in last 24h",
    tone: r.denied > 0 ? "warning" : "positive",
  };
}

async function pipelineKpi(): Promise<CardKpi> {
  const rows = await safe(
    async () => {
      const sql = getDb();
      return (await sql`
        SELECT
          COUNT(*)::int AS runs,
          COUNT(*) FILTER (WHERE status = 'failed')::int AS failed
        FROM inngest_runs
        WHERE COALESCE(started_at, observed_at) > now() - interval '24 hours'
      `) as { runs: number; failed: number }[];
    },
    [] as { runs: number; failed: number }[],
    "pipeline.runs"
  );
  const r = rows[0] ?? { runs: 0, failed: 0 };
  if (r.runs === 0) {
    return {
      primary: "idle",
      secondary: "no Inngest runs in last 24h",
      tone: "neutral",
    };
  }
  const successRate = ((r.runs - r.failed) / r.runs) * 100;
  const tone: KpiTone = r.failed === 0 ? "positive" : successRate >= 95 ? "warning" : "danger";
  return {
    primary: `${successRate.toFixed(1)}% success`,
    secondary: `${fmt(r.runs)} runs, ${r.failed} failed (24h)`,
    tone,
  };
}

async function platformKpi(): Promise<CardKpi> {
  const summary = await safe(
    () => getCurrentDeploymentSummary(),
    {
      productionState: null,
      productionUrl: null,
      productionAge: null,
      failedLast24h: 0,
      buildingNow: 0,
    },
    "platform.deploy"
  );
  const state = summary.productionState ?? "UNKNOWN";
  const tone: KpiTone =
    state === "READY"
      ? "positive"
      : state === "ERROR"
        ? "danger"
        : state === "BUILDING" || state === "QUEUED" || state === "INITIALIZING"
          ? "warning"
          : "neutral";
  return {
    primary: state === "UNKNOWN" ? "no data" : state.toLowerCase(),
    secondary:
      summary.buildingNow > 0
        ? `${summary.buildingNow} building, ${summary.failedLast24h} failed (24h)`
        : `${summary.failedLast24h} failed deploy${summary.failedLast24h === 1 ? "" : "s"} (24h)`,
    tone,
  };
}

async function errorsKpi(): Promise<CardKpi> {
  const issues = await safe(() => getTopSentryIssues(), [], "errors.sentry");
  if (issues.length === 0) {
    return {
      primary: "0 unresolved",
      secondary: "Sentry trailing 24h is clean",
      tone: "positive",
    };
  }
  let totalEvents = 0;
  for (const i of issues) totalEvents += i.count;
  return {
    primary: `${issues.length} unresolved`,
    secondary: `${fmt(totalEvents)} total event${totalEvents === 1 ? "" : "s"} in last 24h`,
    tone: issues.length >= 5 ? "danger" : "warning",
  };
}

async function infrastructureKpi(): Promise<CardKpi> {
  const rows = await safe(() => getLatestInfraStatuses(), [], "infra.status");
  if (rows.length === 0) {
    return {
      primary: "no data yet",
      secondary: "infrastructure check has not run",
      tone: "neutral",
    };
  }
  let fail = 0;
  let warn = 0;
  let pass = 0;
  for (const r of rows) {
    if (r.status === "fail") fail += 1;
    else if (r.status === "warn") warn += 1;
    else pass += 1;
  }
  const tone: KpiTone = fail > 0 ? "danger" : warn > 0 ? "warning" : "positive";
  return {
    primary: fail === 0 && warn === 0 ? `${pass} checks passing` : `${fail} failing, ${warn} warning`,
    secondary: `${rows.length} domain check${rows.length === 1 ? "" : "s"} total`,
    tone,
  };
}

async function recurringKpi(): Promise<CardKpi> {
  const count = await safe(
    () => getRecurringVisitorCount(7),
    0,
    "recurring.count"
  );
  return {
    primary: count > 0 ? `${fmt(count)} recurring` : "no repeat visits yet",
    secondary: "visitors with more than one session, last 7 days",
    tone: count > 0 ? "positive" : "neutral",
  };
}

async function usersKpi(): Promise<CardKpi> {
  const users = await safe(() => listAdminUsers(), [], "users.list");
  const active = users.filter((u) => u.status === "active").length;
  const disabled = users.filter((u) => u.status === "disabled").length;
  return {
    primary: `${active} invited admin${active === 1 ? "" : "s"}`,
    secondary:
      disabled > 0
        ? `${disabled} disabled, plus bootstrap allowlist`
        : "plus bootstrap allowlist",
    tone: "neutral",
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
