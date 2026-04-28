import type { Metadata } from "next";
import {
  getDeviceBreakdown,
  getGeoBreakdown,
  getLiveVisitors,
  getRecentPageViews,
  getTopPages,
  getTopSources,
  getVisitorOverview,
  type GeoRow,
  type DeviceRow,
  type LiveVisitorRow,
  type RecentPageViewRow,
  type TopPageRow,
  type TopSourceRow,
  type VisitorOverview,
} from "@/lib/services/analytics";
import VisitorsLive from "./VisitorsLive";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Visitors",
  robots: { index: false, follow: false, nocache: true },
};

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function formatDwell(ms: number | null): string {
  if (ms === null || ms === undefined) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

export default async function VisitorsPage() {
  const [overview24, overview7d, overview30d, topPages, topSources, geo, devices, live, recent] =
    await Promise.all([
      getVisitorOverview("1 day"),
      getVisitorOverview("7 days"),
      getVisitorOverview("30 days"),
      getTopPages("7 days", 25),
      getTopSources("7 days", 25),
      getGeoBreakdown("7 days", 25),
      getDeviceBreakdown("7 days"),
      getLiveVisitors(),
      getRecentPageViews(50, false),
    ]);

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Acquisition
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Visitors
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            First-party analytics. Page views, sessions, top sources, geo,
            and live presence -- all queryable in SQL and joined to the
            Pathlight scan and contact submission tables.
          </p>
        </header>

        <OverviewSection rows={[overview24, overview7d, overview30d]} />

        <Section title={`Live (last 5 minutes) -- ${live.length} visitor${live.length === 1 ? "" : "s"}`}>
          <VisitorsLive seed={live} />
        </Section>

        <Section title="Top pages (7 days)">
          <TopPagesTable rows={topPages} />
        </Section>

        <Section title="Top sources (7 days)">
          <TopSourcesTable rows={topSources} />
        </Section>

        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Geography (7 days)">
            <GeoTable rows={geo} />
          </Section>
          <Section title="Devices (7 days)">
            <DevicesTable rows={devices} />
          </Section>
        </div>

        <Section title="Recent page views">
          <RecentTable rows={recent} />
        </Section>
      </div>
    </div>
  );
}

function OverviewSection({ rows }: { rows: VisitorOverview[] }) {
  const labels = ["24h", "7d", "30d"];
  return (
    <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {rows.map((row, i) => (
        <div
          key={labels[i]}
          className="rounded-xl border border-zinc-200 bg-white p-5"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            {labels[i]}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <Stat label="Page views" value={formatNumber(row.pageViews)} />
            <Stat label="Sessions" value={formatNumber(row.sessions)} />
            <Stat label="Visitors" value={formatNumber(row.uniqueVisitors)} />
            <Stat label="Bounce" value={`${row.bounceRatePct}%`} />
            <Stat label="Pages/session" value={row.avgPagesPerSession.toFixed(2)} />
            <Stat
              label="Conversions"
              value={`${formatNumber(row.scanConversions + row.contactConversions)}`}
            />
          </div>
        </div>
      ))}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-400">
        {label}
      </p>
      <p className="font-mono text-base font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function TopPagesTable({ rows }: { rows: TopPageRow[] }) {
  if (rows.length === 0)
    return <p className="text-sm text-zinc-500">No data yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Path</th>
            <th className="px-3 py-2 text-right font-semibold">Views</th>
            <th className="px-3 py-2 text-right font-semibold">Sessions</th>
            <th className="px-3 py-2 text-right font-semibold">Visitors</th>
            <th className="px-3 py-2 text-right font-semibold">Avg dwell</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.path} className="border-t border-zinc-100">
              <td className="px-3 py-2 font-mono text-xs text-zinc-900">{r.path}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-900">
                {formatNumber(r.views)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">
                {formatNumber(r.sessions)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">
                {formatNumber(r.uniqueVisitors)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-500">
                {formatDwell(r.avgDwellMs)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopSourcesTable({ rows }: { rows: TopSourceRow[] }) {
  if (rows.length === 0)
    return <p className="text-sm text-zinc-500">No data yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Source</th>
            <th className="px-3 py-2 text-right font-semibold">Sessions</th>
            <th className="px-3 py-2 text-right font-semibold">Scan conversions</th>
            <th className="px-3 py-2 text-right font-semibold">Contact conversions</th>
            <th className="px-3 py-2 text-right font-semibold">Conv rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const total = r.scanConversions + r.contactConversions;
            const rate = r.sessions > 0 ? (total / r.sessions) * 100 : 0;
            return (
              <tr key={r.source} className="border-t border-zinc-100">
                <td className="px-3 py-2 font-mono text-xs text-zinc-900">
                  {r.source}
                </td>
                <td className="px-3 py-2 text-right font-mono text-zinc-900">
                  {formatNumber(r.sessions)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-zinc-700">
                  {formatNumber(r.scanConversions)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-zinc-700">
                  {formatNumber(r.contactConversions)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-zinc-500">
                  {rate.toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GeoTable({ rows }: { rows: GeoRow[] }) {
  if (rows.length === 0)
    return <p className="text-sm text-zinc-500">No data yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Country</th>
            <th className="px-3 py-2 font-semibold">Region</th>
            <th className="px-3 py-2 font-semibold">City</th>
            <th className="px-3 py-2 text-right font-semibold">Sessions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.country}-${r.region}-${r.city}-${i}`} className="border-t border-zinc-100">
              <td className="px-3 py-2 font-mono text-xs">{r.country ?? "-"}</td>
              <td className="px-3 py-2 text-xs text-zinc-700">{r.region ?? "-"}</td>
              <td className="px-3 py-2 text-xs text-zinc-700">{r.city ?? "-"}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-900">
                {formatNumber(r.sessions)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DevicesTable({ rows }: { rows: DeviceRow[] }) {
  if (rows.length === 0)
    return <p className="text-sm text-zinc-500">No data yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Device</th>
            <th className="px-3 py-2 text-right font-semibold">Sessions</th>
            <th className="px-3 py-2 text-right font-semibold">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.deviceType} className="border-t border-zinc-100">
              <td className="px-3 py-2 font-mono text-xs text-zinc-900">
                {r.deviceType}
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-900">
                {formatNumber(r.sessions)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-500">
                {r.pct.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentTable({ rows }: { rows: RecentPageViewRow[] }) {
  if (rows.length === 0)
    return <p className="text-sm text-zinc-500">No data yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Path</th>
            <th className="px-3 py-2 font-semibold">Source</th>
            <th className="px-3 py-2 font-semibold">Geo</th>
            <th className="px-3 py-2 font-semibold">Device</th>
            <th className="px-3 py-2 text-right font-semibold">When</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-zinc-100">
              <td className="px-3 py-2 font-mono text-xs text-zinc-900">
                {r.path}
              </td>
              <td className="px-3 py-2 text-xs text-zinc-700">
                {r.referrerHost ?? "(direct)"}
              </td>
              <td className="px-3 py-2 text-xs text-zinc-700">
                {[r.city, r.country].filter(Boolean).join(", ") || "-"}
              </td>
              <td className="px-3 py-2 text-xs text-zinc-700">
                {[r.browser, r.deviceType].filter(Boolean).join(" / ") || "-"}
              </td>
              <td className="px-3 py-2 text-right font-mono text-xs text-zinc-500">
                {formatRelative(r.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

