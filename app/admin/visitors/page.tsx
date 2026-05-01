import type { Metadata } from "next";
import Link from "next/link";
import {
  getLiveVisitors,
  getRecentPageViews,
  getRecentVisitors,
  type RecentPageViewRow,
} from "@/lib/services/analytics";
import PageHeader from "../PageHeader";
import RecentVisitorsTable from "./RecentVisitorsTable";
import VisitorsLive from "./VisitorsLive";
import VisitorsDashboard from "./VisitorsDashboard";

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

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

type VisitorsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VisitorsPage({ searchParams }: VisitorsPageProps) {
  const params = await searchParams;
  const before = parseBeforeCursor(params);
  const beforeVisitors = parseBeforeCursor({ before: params["before_v"] });

  /* Server-side data: live presence + recent page views table + recent
   * visitors table. The hero chart, metric tiles, and breakdown panels
   * are all client-side via VisitorsDashboard fetching the dedicated
   * API route, so the date range picker can update them without
   * touching this page's URL params. The ?before= cursor and ?before_v=
   * cursor still drive the two paginated tables below as before. */
  const [live, recent, recentVisitors] = await Promise.all([
    getLiveVisitors(),
    getRecentPageViews(RECENT_PAGE_SIZE, false, before),
    getRecentVisitors(RECENT_VISITORS_PAGE_SIZE, beforeVisitors),
  ]);
  const hasMore = recent.length === RECENT_PAGE_SIZE;
  const olderCursor = recent.length > 0 ? recent[recent.length - 1]!.createdAt : null;
  const hasMoreVisitors = recentVisitors.length === RECENT_VISITORS_PAGE_SIZE;
  const olderVisitorsCursor =
    recentVisitors.length > 0 ? recentVisitors[recentVisitors.length - 1]!.lastSeenAt : null;

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          palette="sky"
          section="Acquisition"
          pageName="Visitors"
          description="First-party analytics. Every visitor as a person, with their full path, source, geo, device, and conversion state. Identity surfaces only when they self-disclosed it via a form."
        />

        <VisitorsDashboard />

        <Section
          title={`Live · ${live.length} active visitor${live.length === 1 ? "" : "s"}`}
        >
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

        <DefinitionsPanel />
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

function RecentTable({ rows }: { rows: RecentPageViewRow[] }) {
  if (rows.length === 0)
    return <p className="text-sm text-zinc-500">No data yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="canopy-table w-full min-w-[760px] text-sm">
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
 * what's surfaced about each visitor. Now lives at the bottom of the
 * page since the chart-driven hero answers most of the "what is this"
 * question on its own.
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
