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
  title: "Monitor",
  robots: { index: false, follow: false, nocache: true },
};

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

function scoreClass(n: number | null): string {
  if (n === null) return "text-zinc-400";
  if (n >= 95) return "text-emerald-600";
  if (n >= 90) return "text-amber-600";
  if (n >= 75) return "text-orange-600";
  return "text-red-600";
}

export default async function AdminMonitor() {
  /* Auth is enforced by middleware.ts + the admin layout (defense in
   * depth, both require a valid admin session). */

  const [funnel24, funnel7, funnel30, levels24, canary, lighthouse, recent] =
    await Promise.all([
      getFunnelCounts("1 day"),
      getFunnelCounts("7 days"),
      getFunnelCounts("30 days"),
      getLevelSummary("1 day"),
      getCanaryStatus(),
      getLatestLighthousePerPage(),
      getRecentEvents(50),
    ]);

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Operations
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Monitor
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Real-time view of Pathlight and the marketing site. Funnel
            counts and Lighthouse trends read from monitoring_events and
            lighthouse_history. The live tail at the bottom streams new
            events as they land.
          </p>
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

        <RecentEventsSection seed={recent} />
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
      return { className: "text-zinc-500", label: "no canary runs yet" };
    if (canary.consecutiveFailures >= 2)
      return { className: "text-red-600", label: "FAILING" };
    if (canary.lastLevel === "error")
      return {
        className: "text-amber-600",
        label: "single fail (within tolerance)",
      };
    return { className: "text-emerald-600", label: "healthy" };
  })();
  return (
    <Section title="Synthetic canary">
      <div className="flex items-baseline justify-between">
        <span className={`font-mono text-base ${indicator.className}`}>
          ● {indicator.label}
        </span>
        <span className="text-xs text-zinc-500">
          {canary.lastEventAt
            ? `last ${formatRelative(canary.lastEventAt)}`
            : "-"}
        </span>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
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
            <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-3 py-2 font-semibold">Stage</th>
              {windows.map((w) => (
                <th
                  key={w.label}
                  className="px-3 py-2 text-right font-semibold"
                >
                  {w.label}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-semibold">7d → 30d</th>
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
    <tr className="border-t border-zinc-100">
      <td className="px-3 py-2 text-zinc-700">{label}</td>
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
            className={`px-3 py-2 text-right font-mono ${flag ? "text-red-600" : "text-zinc-900"}`}
          >
            {formatNumber(v)}
            {denominators ? (
              <span className="ml-2 text-[11px] text-zinc-500">
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
        <Pill className="text-emerald-600" label="info" value={formatNumber(levels.info)} />
        <Pill className="text-amber-600" label="warn" value={formatNumber(levels.warn)} />
        <Pill className="text-red-600" label="error" value={formatNumber(levels.error)} />
      </div>
    </Section>
  );
}

function Pill({
  className,
  label,
  value,
}: {
  className: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={className}>●</span>
      <span className="font-mono text-base font-semibold text-zinc-900">
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-wider text-zinc-500">
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
            <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-3 py-2 font-semibold">Page</th>
              <th className="px-3 py-2 font-semibold">Strategy</th>
              <th className="px-3 py-2 text-right font-semibold">Perf</th>
              <th className="px-3 py-2 text-right font-semibold">A11y</th>
              <th className="px-3 py-2 text-right font-semibold">Best Pr.</th>
              <th className="px-3 py-2 text-right font-semibold">SEO</th>
              <th className="px-3 py-2 text-right font-semibold">When</th>
            </tr>
          </thead>
          <tbody>
            {MONITORED_PAGES.flatMap((page) =>
              STRATEGIES.map((strategy) => {
                const r = lookup.get(`${page.path}::${strategy}`);
                return (
                  <tr
                    key={`${page.path}-${strategy}`}
                    className="border-t border-zinc-100"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-zinc-900">
                      {page.path}
                      <span className="ml-2 text-[11px] text-zinc-500">
                        {page.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-500">
                      {strategy}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-mono ${scoreClass(r?.performance ?? null)}`}
                    >
                      {r?.performance ?? "-"}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-mono ${scoreClass(r?.accessibility ?? null)}`}
                    >
                      {r?.accessibility ?? "-"}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-mono ${scoreClass(r?.best_practices ?? null)}`}
                    >
                      {r?.best_practices ?? "-"}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-mono ${scoreClass(r?.seo ?? null)}`}
                    >
                      {r?.seo ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-zinc-500">
                      {r ? formatRelative(r.created_at) : "no data"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Daily Lighthouse cron at 09:00 UTC. Cells turn yellow under 95,
        orange under 90, red under 75.
      </p>
    </Section>
  );
}

function RecentEventsSection({
  seed,
}: {
  seed: MonitoringEventRow[];
}) {
  return (
    <Section title="Live event tail">
      <p className="mb-3 text-xs text-zinc-500">
        Most recent first. New events stream in via SSE; the connection
        auto-reconnects every 5 minutes.
      </p>
      <MonitorLive seed={seed} />
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
    <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="mb-4 font-display text-base font-semibold text-zinc-900">
        {title}
      </h2>
      {children}
    </section>
  );
}
