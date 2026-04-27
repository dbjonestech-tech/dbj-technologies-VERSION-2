import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getCanaryStatus,
  getFunnelCounts,
  getLatestLighthousePerPage,
  getLevelSummary,
  getRecentEvents,
  type FunnelCounts,
  type LighthouseRow,
  type MonitoringEventRow,
} from "@/lib/services/monitoring";
import { MONITORED_PAGES, STRATEGIES } from "@/lib/services/lighthouse-monitor";
import MonitorLive from "./MonitorLive";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Internal monitor",
  robots: { index: false, follow: false, nocache: true },
};

const WINDOWS: { label: string; interval: string }[] = [
  { label: "Last 24 hours", interval: "1 day" },
  { label: "Last 7 days", interval: "7 days" },
  { label: "Last 30 days", interval: "30 days" },
];

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatPct(num: number, denom: number): string {
  if (denom === 0) return "-";
  return `${((num / denom) * 100).toFixed(1)}%`;
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function scoreColor(n: number | null): string {
  if (n === null) return "#6b7280";
  if (n >= 95) return "#86efac";
  if (n >= 90) return "#fcd34d";
  if (n >= 75) return "#fb923c";
  return "#fca5a5";
}

export default async function InternalMonitor({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const expectedPin = process.env.INTERNAL_ADMIN_PIN;
  if (!expectedPin) notFound();
  const params = await searchParams;
  const supplied = typeof params.pin === "string" ? params.pin : null;
  if (!supplied || supplied !== expectedPin) notFound();

  const [
    funnel24,
    funnel7,
    funnel30,
    levels24,
    canary,
    lighthouse,
    recent,
  ] = await Promise.all([
    getFunnelCounts("1 day"),
    getFunnelCounts("7 days"),
    getFunnelCounts("30 days"),
    getLevelSummary("1 day"),
    getCanaryStatus(),
    getLatestLighthousePerPage(),
    getRecentEvents(50),
  ]);

  return (
    <div
      className="min-h-screen w-full px-6 py-12"
      style={{ backgroundColor: "#06060a", color: "#e7ebf2" }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-10">
          <p
            className="text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: "#9aa3b2" }}
          >
            Internal
          </p>
          <h1
            className="mt-2 font-display text-3xl font-bold sm:text-4xl"
            style={{ color: "#e7ebf2" }}
          >
            Monitor
          </h1>
          <p
            className="mt-3 max-w-2xl text-sm leading-relaxed"
            style={{ color: "#9aa3b2" }}
          >
            Real-time view of Pathlight + the marketing site. Funnel
            counts and Lighthouse trends are read from monitoring_events
            and lighthouse_history. The live tail at the bottom streams
            new events as they land.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <Link
              href={`/internal/cost?pin=${encodeURIComponent(supplied)}`}
              className="rounded-full border px-3 py-1 transition-colors hover:border-white/30"
              style={{ borderColor: "rgba(255,255,255,0.1)", color: "#9aa3b2" }}
            >
              Cost dashboard →
            </Link>
          </div>
        </header>

        <CanarySection canary={canary} />

        <FunnelSection
          windows={[
            { label: "24h", counts: funnel24 },
            { label: "7d", counts: funnel7 },
            { label: "30d", counts: funnel30 },
          ]}
        />

        <LevelsSection levels={levels24} />

        <LighthouseSection rows={lighthouse} />

        <RecentEventsSection seed={recent} pin={supplied} />
      </div>
    </div>
  );
}

function CanarySection({
  canary,
}: {
  canary: Awaited<ReturnType<typeof getCanaryStatus>>;
}) {
  const indicator = (() => {
    if (!canary.lastEventAt)
      return { color: "#6b7280", label: "no canary runs yet" };
    if (canary.consecutiveFailures >= 2)
      return { color: "#fca5a5", label: "FAILING" };
    if (canary.lastLevel === "error")
      return { color: "#fcd34d", label: "single fail (within tolerance)" };
    return { color: "#86efac", label: "healthy" };
  })();
  return (
    <Section title="Synthetic canary">
      <div className="flex items-baseline justify-between">
        <span
          className="font-mono text-base"
          style={{ color: indicator.color }}
        >
          ● {indicator.label}
        </span>
        <span className="text-xs" style={{ color: "#9aa3b2" }}>
          {canary.lastEventAt
            ? `last ${formatRelative(canary.lastEventAt)}`
            : "-"}
        </span>
      </div>
      <p className="mt-2 text-xs" style={{ color: "#6b7280" }}>
        Runs every 4 hours. Verifies PSI + Browserless against a stable
        URL. Two consecutive fails on the same check escalate to Sentry.
      </p>
    </Section>
  );
}

function FunnelSection({
  windows,
}: {
  windows: { label: string; counts: FunnelCounts }[];
}) {
  return (
    <Section title="Funnel">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr
              className="text-left text-xs uppercase tracking-wider"
              style={{ color: "#6b7280" }}
            >
              <th className="px-3 py-2">Stage</th>
              {windows.map((w) => (
                <th key={w.label} className="px-3 py-2 text-right">
                  {w.label}
                </th>
              ))}
              <th className="px-3 py-2 text-right">7d → 30d</th>
            </tr>
          </thead>
          <tbody>
            <FunnelRow
              label="Scans requested"
              values={windows.map((w) => w.counts.scansRequested)}
            />
            <FunnelRow
              label="Scans complete"
              values={windows.map((w) => w.counts.scansCompleted)}
              denominators={windows.map((w) => w.counts.scansRequested)}
            />
            <FunnelRow
              label="Scans partial"
              values={windows.map((w) => w.counts.scansPartial)}
              denominators={windows.map((w) => w.counts.scansRequested)}
              warnIfRatioAbove={0.2}
            />
            <FunnelRow
              label="Scans failed"
              values={windows.map((w) => w.counts.scansFailed)}
              denominators={windows.map((w) => w.counts.scansRequested)}
              warnIfRatioAbove={0.1}
            />
            <FunnelRow
              label="Audio generated"
              values={windows.map((w) => w.counts.audioGenerated)}
              denominators={windows.map((w) => w.counts.scansCompleted)}
            />
            <FunnelRow
              label="Audio failed"
              values={windows.map((w) => w.counts.audioFailed)}
              denominators={windows.map((w) => w.counts.scansCompleted)}
              warnIfRatioAbove={0.25}
            />
            <FunnelRow
              label="Report email sent"
              values={windows.map((w) => w.counts.emailsSent)}
              denominators={windows.map((w) => w.counts.scansCompleted)}
            />
            <FunnelRow
              label="Email delivered"
              values={windows.map((w) => w.counts.emailsDelivered)}
              denominators={windows.map((w) => w.counts.emailsSent)}
            />
            <FunnelRow
              label="Email bounced"
              values={windows.map((w) => w.counts.emailsBounced)}
              denominators={windows.map((w) => w.counts.emailsSent)}
              warnIfRatioAbove={0.02}
            />
            <FunnelRow
              label="Email complained"
              values={windows.map((w) => w.counts.emailsComplained)}
              denominators={windows.map((w) => w.counts.emailsSent)}
              warnIfRatioAbove={0.001}
            />
            <FunnelRow
              label="Chat messages"
              values={windows.map((w) => w.counts.chatMessages)}
            />
            <FunnelRow
              label="Contact form submitted"
              values={windows.map((w) => w.counts.contactsSubmitted)}
            />
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function FunnelRow({
  label,
  values,
  denominators,
  warnIfRatioAbove,
}: {
  label: string;
  values: number[];
  denominators?: number[];
  warnIfRatioAbove?: number;
}) {
  return (
    <tr className="border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      <td className="px-3 py-2">{label}</td>
      {values.map((v, i) => {
        const denom = denominators?.[i] ?? 0;
        const ratio = denom > 0 ? v / denom : null;
        const flag =
          warnIfRatioAbove !== undefined &&
          ratio !== null &&
          ratio > warnIfRatioAbove;
        return (
          <td
            key={i}
            className="px-3 py-2 text-right font-mono"
            style={{ color: flag ? "#fca5a5" : undefined }}
          >
            {formatNumber(v)}
            {denominators ? (
              <span className="ml-2 text-[11px]" style={{ color: "#6b7280" }}>
                {formatPct(v, denom)}
              </span>
            ) : null}
          </td>
        );
      })}
      <td className="px-3 py-2"></td>
    </tr>
  );
}

function LevelsSection({
  levels,
}: {
  levels: { info: number; warn: number; error: number };
}) {
  return (
    <Section title="Severity (last 24h)">
      <div className="flex flex-wrap gap-6 text-sm">
        <Pill color="#86efac" label="info" value={formatNumber(levels.info)} />
        <Pill color="#fcd34d" label="warn" value={formatNumber(levels.warn)} />
        <Pill color="#fca5a5" label="error" value={formatNumber(levels.error)} />
      </div>
    </Section>
  );
}

function Pill({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span style={{ color }}>●</span>
      <span className="font-mono text-base font-semibold">{value}</span>
      <span className="text-[11px] uppercase tracking-wider" style={{ color: "#6b7280" }}>
        {label}
      </span>
    </div>
  );
}

function LighthouseSection({ rows }: { rows: LighthouseRow[] }) {
  // Index rows by page+strategy so the table renders the full grid
  // even on first deploy when not all pages have a row yet.
  const lookup = new Map<string, LighthouseRow>();
  for (const r of rows) lookup.set(`${r.page}::${r.strategy}`, r);

  return (
    <Section title="Lighthouse latest">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr
              className="text-left text-xs uppercase tracking-wider"
              style={{ color: "#6b7280" }}
            >
              <th className="px-3 py-2">Page</th>
              <th className="px-3 py-2">Strategy</th>
              <th className="px-3 py-2 text-right">Perf</th>
              <th className="px-3 py-2 text-right">A11y</th>
              <th className="px-3 py-2 text-right">Best Pr.</th>
              <th className="px-3 py-2 text-right">SEO</th>
              <th className="px-3 py-2 text-right">When</th>
            </tr>
          </thead>
          <tbody>
            {MONITORED_PAGES.flatMap((page) =>
              STRATEGIES.map((strategy) => {
                const r = lookup.get(`${page.path}::${strategy}`);
                return (
                  <tr
                    key={`${page.path}-${strategy}`}
                    className="border-t"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}
                  >
                    <td className="px-3 py-2 font-mono text-xs">
                      {page.path}
                      <span
                        className="ml-2 text-[11px]"
                        style={{ color: "#6b7280" }}
                      >
                        {page.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: "#9aa3b2" }}>
                      {strategy}
                    </td>
                    <td
                      className="px-3 py-2 text-right font-mono"
                      style={{ color: scoreColor(r?.performance ?? null) }}
                    >
                      {r?.performance ?? "-"}
                    </td>
                    <td
                      className="px-3 py-2 text-right font-mono"
                      style={{ color: scoreColor(r?.accessibility ?? null) }}
                    >
                      {r?.accessibility ?? "-"}
                    </td>
                    <td
                      className="px-3 py-2 text-right font-mono"
                      style={{ color: scoreColor(r?.best_practices ?? null) }}
                    >
                      {r?.best_practices ?? "-"}
                    </td>
                    <td
                      className="px-3 py-2 text-right font-mono"
                      style={{ color: scoreColor(r?.seo ?? null) }}
                    >
                      {r?.seo ?? "-"}
                    </td>
                    <td
                      className="px-3 py-2 text-right text-xs"
                      style={{ color: "#6b7280" }}
                    >
                      {r ? formatRelative(r.created_at) : "no data"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs" style={{ color: "#6b7280" }}>
        Daily Lighthouse cron at 09:00 UTC. Cells turn yellow under 95,
        orange under 90, red under 75.
      </p>
    </Section>
  );
}

function RecentEventsSection({
  seed,
  pin,
}: {
  seed: MonitoringEventRow[];
  pin: string;
}) {
  return (
    <Section title="Live event tail">
      <p className="mb-3 text-xs" style={{ color: "#6b7280" }}>
        Most recent first. New events stream in via SSE; the connection
        auto-reconnects every 5 minutes.
      </p>
      <MonitorLive seed={seed} pin={pin} />
    </Section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="mb-8 rounded-2xl border p-6"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "rgba(10,12,18,0.7)",
      }}
    >
      <h2
        className="mb-4 font-display text-xl font-semibold"
        style={{ color: "#e7ebf2" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
