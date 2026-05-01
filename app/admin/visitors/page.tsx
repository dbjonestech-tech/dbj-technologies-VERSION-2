import type { Metadata } from "next";
import Link from "next/link";
import {
  getDeviceBreakdown,
  getGeoBreakdown,
  getLiveVisitors,
  getRecentPageViews,
  getRecentVisitors,
  getTopPages,
  getTopSources,
  getVisitorOverview,
  getVisitorOverviewBetween,
  type GeoRow,
  type DeviceRow,
  type RecentPageViewRow,
  type RecentVisitorRow,
  type TopPageRow,
  type TopSourceRow,
  type VisitorOverview,
} from "@/lib/services/analytics";
import RecentVisitorsTable from "./RecentVisitorsTable";
import VisitorsLive from "./VisitorsLive";
import { PALETTES } from "@/lib/admin/page-themes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Visitors",
  robots: { index: false, follow: false, nocache: true },
};

const RECENT_PAGE_SIZE = 50;
const RECENT_VISITORS_PAGE_SIZE = 25;

function parseBeforeCursor(
  raw: Record<string, string | string[] | undefined>
): string | undefined {
  const v = raw["before"];
  const value = Array.isArray(v) ? v[0] : v;
  if (!value) return undefined;
  const t = Date.parse(value);
  return Number.isFinite(t) ? new Date(t).toISOString() : undefined;
}

/**
 * Parse a YYYY-MM-DD date param from search params. Returns the UTC
 * midnight for "from" and 23:59:59.999 UTC for "to" so a same-day
 * range still matches at least one day's data.
 */
function parseDateParam(
  raw: string | string[] | undefined,
  variant: "from" | "to"
): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const t = Date.parse(value + "T00:00:00.000Z");
  if (!Number.isFinite(t)) return null;
  if (variant === "to") {
    return new Date(t + 24 * 60 * 60 * 1000 - 1).toISOString();
  }
  return new Date(t).toISOString();
}

/**
 * YYYY-MM-DD formatter for <input type="date" value={...}>.
 * Pulls the date in UTC since the inputs we receive are UTC ISO.
 */
function isoToDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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

type VisitorsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VisitorsPage({ searchParams }: VisitorsPageProps) {
  const params = await searchParams;
  const before = parseBeforeCursor(params);
  const beforeVisitors = parseBeforeCursor({ before: params["before_v"] });
  /* Custom date-range parameters drive the optional 4th overview
   * card. Both must be present and valid for the card to render. */
  const fromIso = parseDateParam(params["from"], "from");
  const toIso = parseDateParam(params["to"], "to");
  const customRangeActive = Boolean(fromIso && toIso);

  const [
    overview24,
    overview7d,
    overview30d,
    overviewCustom,
    topPages,
    topSources,
    geo,
    devices,
    live,
    recent,
    recentVisitors,
  ] = await Promise.all([
    getVisitorOverview("1 day"),
    getVisitorOverview("7 days"),
    getVisitorOverview("30 days"),
    customRangeActive && fromIso && toIso
      ? getVisitorOverviewBetween(fromIso, toIso)
      : Promise.resolve<VisitorOverview | null>(null),
    getTopPages("7 days", 25),
    getTopSources("7 days", 25),
    getGeoBreakdown("7 days", 25),
    getDeviceBreakdown("7 days"),
    getLiveVisitors(),
    getRecentPageViews(RECENT_PAGE_SIZE, false, before),
    getRecentVisitors(RECENT_VISITORS_PAGE_SIZE, beforeVisitors),
  ]);
  /* When the user has paged into the past, the live header still
   * reflects the present, but the "Recent page views" table reflects
   * the cursor window. Pagination state is driven entirely by the
   * URL so refresh + back/forward behave correctly. */
  const hasMore = recent.length === RECENT_PAGE_SIZE;
  const olderCursor = recent.length > 0 ? recent[recent.length - 1]!.createdAt : null;
  const hasMoreVisitors = recentVisitors.length === RECENT_VISITORS_PAGE_SIZE;
  const olderVisitorsCursor =
    recentVisitors.length > 0 ? recentVisitors[recentVisitors.length - 1]!.lastSeenAt : null;

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="relative mb-8">
          <span
            aria-hidden="true"
            className={`mb-4 block h-1.5 w-24 rounded-full ${PALETTES.sky.pageStripe}`}
          />
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-700 ring-1 ring-inset ring-sky-200">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" aria-hidden="true" />
            Acquisition · Visitors
          </span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Visitors
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            First-party analytics. Every visitor as a person, with their
            full path, source, geo, device, and conversion state.
            Identity surfaces only when they self-disclosed it via a form.
          </p>
        </header>

        <OverviewSection
          rows={[overview24, overview7d, overview30d]}
          custom={overviewCustom}
          fromInputValue={isoToDateInputValue(fromIso)}
          toInputValue={isoToDateInputValue(toIso)}
        />

        <DefinitionsPanel />

        <Section title={`Live (last 5 minutes) -- ${live.length} visitor${live.length === 1 ? "" : "s"}`}>
          <VisitorsLive seed={live} />
        </Section>

        <Section
          title={
            beforeVisitors
              ? `Recent visitors (older than ${new Date(beforeVisitors).toLocaleString("en-US")})`
              : "Recent visitors"
          }
          subtitle="One row per person. Click any row to expand the full page-by-page timeline grouped by session."
        >
          <RecentVisitorsTable
            rows={recentVisitors}
            enableSearch
            enableFilters
            enableCsvExport
            exportSlug="visitors"
          />
          <VisitorsPaginator
            isPaged={Boolean(beforeVisitors)}
            hasMore={hasMoreVisitors}
            olderCursor={olderVisitorsCursor}
          />
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

        <Section
          title={
            before
              ? `Recent page views (older than ${new Date(before).toLocaleString("en-US")})`
              : "Recent page views"
          }
        >
          <RecentTable rows={recent} />
          <RecentPaginator
            isPaged={Boolean(before)}
            hasMore={hasMore}
            olderCursor={olderCursor}
          />
        </Section>
      </div>
    </div>
  );
}

function RecentPaginator({
  isPaged,
  hasMore,
  olderCursor,
}: {
  isPaged: boolean;
  hasMore: boolean;
  olderCursor: string | null;
}) {
  if (!isPaged && !hasMore) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
      {isPaged ? (
        <Link
          href="/admin/visitors"
          className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          ← Back to latest
        </Link>
      ) : (
        <span />
      )}
      {hasMore && olderCursor ? (
        <Link
          href={`/admin/visitors?before=${encodeURIComponent(olderCursor)}`}
          className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Load older →
        </Link>
      ) : (
        <span className="text-xs text-zinc-400">End of feed</span>
      )}
    </div>
  );
}

function OverviewSection({
  rows,
  custom,
  fromInputValue,
  toInputValue,
}: {
  rows: VisitorOverview[];
  custom: VisitorOverview | null;
  fromInputValue: string;
  toInputValue: string;
}) {
  const labels = ["24h", "7d", "30d"];
  return (
    <section className="mb-6 space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {rows.map((row, i) => (
          <OverviewCard key={labels[i]} label={labels[i]!} row={row} />
        ))}
        <CustomRangeCard
          custom={custom}
          fromInputValue={fromInputValue}
          toInputValue={toInputValue}
        />
      </div>
    </section>
  );
}

function OverviewCard({ label, row }: { label: string; row: VisitorOverview }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
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
  );
}

/**
 * Native HTML form with two date inputs. Submits via GET so the URL
 * carries the range and the page can be bookmarked / shared / deep-
 * linked. Server-side parsing in parseDateParam normalizes the
 * range to a UTC day window.
 */
function CustomRangeCard({
  custom,
  fromInputValue,
  toInputValue,
}: {
  custom: VisitorOverview | null;
  fromInputValue: string;
  toInputValue: string;
}) {
  return (
    <div className="rounded-xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/40 p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-pink-700">
          Custom range
        </p>
        {custom ? (
          <Link
            href="/admin/visitors"
            className="text-[10px] font-medium text-zinc-500 hover:text-zinc-700"
          >
            Clear
          </Link>
        ) : null}
      </div>
      <form
        action="/admin/visitors"
        method="get"
        className="mt-3 flex flex-wrap items-end gap-2"
      >
        <label className="flex flex-col text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          From
          <input
            type="date"
            name="from"
            defaultValue={fromInputValue}
            required
            className="mt-1 rounded-md border border-zinc-200 bg-white px-2 py-1 font-mono text-xs text-zinc-900 focus:border-pink-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          To
          <input
            type="date"
            name="to"
            defaultValue={toInputValue}
            required
            className="mt-1 rounded-md border border-zinc-200 bg-white px-2 py-1 font-mono text-xs text-zinc-900 focus:border-pink-400 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-pink-700"
        >
          Apply
        </button>
      </form>
      {custom ? (
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <Stat label="Page views" value={formatNumber(custom.pageViews)} />
          <Stat label="Sessions" value={formatNumber(custom.sessions)} />
          <Stat label="Visitors" value={formatNumber(custom.uniqueVisitors)} />
          <Stat label="Bounce" value={`${custom.bounceRatePct}%`} />
          <Stat
            label="Pages/session"
            value={custom.avgPagesPerSession.toFixed(2)}
          />
          <Stat
            label="Conversions"
            value={`${formatNumber(custom.scanConversions + custom.contactConversions)}`}
          />
        </div>
      ) : (
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
          Pick any two dates to see visitors, sessions, conversions for
          that exact window. State is in the URL so you can bookmark
          or share the view.
        </p>
      )}
    </div>
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
            <tr key={r.path} className="border-t border-zinc-100 transition-colors even:bg-zinc-100/70 hover:bg-sky-50">
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
              <tr key={r.source} className="border-t border-zinc-100 transition-colors even:bg-zinc-100/70 hover:bg-sky-50">
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
            <tr key={`${r.country}-${r.region}-${r.city}-${i}`} className="border-t border-zinc-100 transition-colors even:bg-zinc-100/70 hover:bg-sky-50">
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
            <tr key={r.deviceType} className="border-t border-zinc-100 transition-colors even:bg-zinc-100/70 hover:bg-sky-50">
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
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Path</th>
            <th className="px-3 py-2 font-semibold">Source</th>
            <th className="px-3 py-2 font-semibold">Geo</th>
            <th className="px-3 py-2 font-semibold">Device</th>
            <th className="px-3 py-2 text-right font-semibold">When</th>
            <th className="px-3 py-2 text-right font-semibold">Session</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-zinc-100 transition-colors even:bg-zinc-100/70 hover:bg-sky-50">
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
              <td className="px-3 py-2 text-right">
                <Link
                  href={`/admin/visitors/sessions/${r.sessionId}`}
                  className="font-mono text-[11px] text-cyan-700 hover:underline"
                >
                  view →
                </Link>
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
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="mb-4">
        <h2 className="font-display text-base font-semibold text-zinc-900">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/**
 * Top-of-page panel that explains exactly what each metric means and
 * what's surfaced about each visitor. The privacy guarantees are
 * already in /privacy; this is the operator-facing precis.
 */
function DefinitionsPanel() {
  return (
    <details className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-sm leading-relaxed text-zinc-700">
      <summary className="cursor-pointer font-display text-sm font-semibold text-zinc-900">
        How these metrics work + what we collect
      </summary>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Definitions
          </h3>
          <ul className="space-y-1.5 text-xs">
            <li>
              <strong className="text-zinc-900">Views:</strong> every page
              navigation. Same person reloading 5 times counts as 5 views.
              Equivalent to GA4 page_view events.
            </li>
            <li>
              <strong className="text-zinc-900">Sessions:</strong> distinct{" "}
              <code className="rounded bg-white px-1 py-0.5 font-mono text-[10px]">dbj_sid</code>{" "}
              cookies. 30-minute sliding idle window. Equivalent to GA4 sessions.
            </li>
            <li>
              <strong className="text-zinc-900">Visitors:</strong> distinct{" "}
              <code className="rounded bg-white px-1 py-0.5 font-mono text-[10px]">dbj_vid</code>{" "}
              cookies. 13-month rolling lifetime. Equivalent to GA4 total users.
            </li>
            <li>
              <strong className="text-zinc-900">Avg dwell:</strong> time on page
              from the engagement beacon (page-load to blur or unload).
              Equivalent to GA4 engagement time.
            </li>
            <li>
              <strong className="text-zinc-900">Bounce:</strong> sessions with
              one page view and no engagement. Computed from{" "}
              <code className="rounded bg-white px-1 py-0.5 font-mono text-[10px]">page_count = 1</code>.
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Privacy + identity
          </h3>
          <ul className="space-y-1.5 text-xs">
            <li>
              <strong className="text-zinc-900">First-party only.</strong> Two
              cookies (visitor + session). No third-party trackers, no
              fingerprinting, no ad networks.
            </li>
            <li>
              <strong className="text-zinc-900">IP is hashed at collection</strong>{" "}
              with a daily-rotating salt and discarded immediately. Only the
              hash and the country/region/city derived from the request are
              persisted.
            </li>
            <li>
              <strong className="text-zinc-900">Identity is self-disclosed.</strong>{" "}
              Names, emails, phones, and companies appear here only when a
              visitor submitted them via the contact form or a Pathlight scan.
              The cookie itself is a random UUID and carries no name.
            </li>
            <li>
              <strong className="text-zinc-900">Retention.</strong> Raw page
              views are kept 90 days; aggregated session data is kept 13
              months. Per the public{" "}
              <Link href="/privacy" className="text-cyan-700 hover:underline">
                privacy policy
              </Link>
              .
            </li>
          </ul>
        </div>
      </div>
    </details>
  );
}

/**
 * Pagination control for the Recent visitors section. Mirrors
 * RecentPaginator but writes to ?before_v= so the two paginators
 * can advance independently in the URL.
 */
function VisitorsPaginator({
  isPaged,
  hasMore,
  olderCursor,
}: {
  isPaged: boolean;
  hasMore: boolean;
  olderCursor: string | null;
}) {
  if (!isPaged && !hasMore) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
      {isPaged ? (
        <Link
          href="/admin/visitors"
          className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          ← Back to latest
        </Link>
      ) : (
        <span />
      )}
      {hasMore && olderCursor ? (
        <Link
          href={`/admin/visitors?before_v=${encodeURIComponent(olderCursor)}`}
          className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Load older →
        </Link>
      ) : (
        <span className="text-xs text-zinc-400">End of feed</span>
      )}
    </div>
  );
}

