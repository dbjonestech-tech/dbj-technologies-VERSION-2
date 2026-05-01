import type { Metadata } from "next";
import Link from "next/link";
import { getRecurringVisitors } from "@/lib/services/analytics";
import PageHeader from "../PageHeader";
import RecentVisitorsTable from "../visitors/RecentVisitorsTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Recurring users",
  robots: { index: false, follow: false, nocache: true },
};

const PAGE_SIZE = 50;

type RecurringPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parseInt32(raw: string | string[] | undefined): number | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function parseBeforeIso(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  const t = Date.parse(value);
  return Number.isFinite(t) ? new Date(t).toISOString() : undefined;
}

export default async function RecurringUsersPage({ searchParams }: RecurringPageProps) {
  const params = await searchParams;
  const beforeSc = parseInt32(params["before_sc"]);
  const beforeIso = parseBeforeIso(params["before_ts"]);
  const rows = await getRecurringVisitors(PAGE_SIZE, beforeSc, beforeIso);
  const isPaged = beforeSc !== undefined && beforeIso !== undefined;
  const hasMore = rows.length === PAGE_SIZE;
  const last = rows.length > 0 ? rows[rows.length - 1]! : null;

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          palette="pink"
          section="Acquisition"
          pageName="Recurring users"
          description="Every visitor who came back across more than one session, sorted by visit count. The most-engaged repeat visitors at the top. Click any row to expand the full per-visitor page-by-page timeline."
        />

        <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="font-display text-base font-semibold text-zinc-900">
              {isPaged ? "Recurring users (continued)" : `${rows.length} recurring user${rows.length === 1 ? "" : "s"}`}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Sorted by sessions DESC, then last-seen DESC. Use the
              search box and filter chips to narrow further. Identity
              shown only when self-disclosed via a form submission.
            </p>
          </div>
          <RecentVisitorsTable
            rows={rows}
            enableSearch
            enableFilters
            enableCsvExport
            exportSlug="recurring-users"
          />
          <RecurringPaginator
            isPaged={isPaged}
            hasMore={hasMore}
            sessionCount={last?.sessionCount ?? null}
            lastSeenAt={last?.lastSeenAt ?? null}
          />
        </section>
      </div>
    </div>
  );
}

function RecurringPaginator({
  isPaged,
  hasMore,
  sessionCount,
  lastSeenAt,
}: {
  isPaged: boolean;
  hasMore: boolean;
  sessionCount: number | null;
  lastSeenAt: string | null;
}) {
  if (!isPaged && !hasMore) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
      {isPaged ? (
        <Link
          href="/admin/recurring"
          className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          ← Back to top of feed
        </Link>
      ) : (
        <span />
      )}
      {hasMore && sessionCount !== null && lastSeenAt ? (
        <Link
          href={`/admin/recurring?before_sc=${sessionCount}&before_ts=${encodeURIComponent(lastSeenAt)}`}
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
