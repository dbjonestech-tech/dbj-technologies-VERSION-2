import type { Metadata } from "next";
import {
  getOpportunities,
  getTopPages,
  getTopQueries,
  type GscOpportunityRow,
  type GscPageRow,
  type GscQueryRow,
} from "@/lib/services/search-console";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: false, nocache: true },
};

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export default async function SearchConsolePage() {
  const [queries, pages, opportunities] = await Promise.all([
    getTopQueries(28, 50),
    getTopPages(28, 50),
    getOpportunities(28, 25),
  ]);

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Acquisition
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Search Console
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Pulled daily by searchConsoleDaily at 06:00 UTC. The
            opportunities table flags pages with high impressions but
            position 5-15: the cheapest CTR wins on the site.
          </p>
        </header>

        <Section title="Top queries (28 days)">
          {queries.length === 0 ? (
            <EmptyState />
          ) : (
            <QueriesTable rows={queries} />
          )}
        </Section>

        <Section title="Top pages (28 days)">
          {pages.length === 0 ? <EmptyState /> : <PagesTable rows={pages} />}
        </Section>

        <Section title="Opportunities (28 days)">
          {opportunities.length === 0 ? (
            <EmptyState />
          ) : (
            <OpportunitiesTable rows={opportunities} />
          )}
        </Section>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <p className="text-sm text-zinc-500">
      No data yet. Set GOOGLE_SC_CREDENTIALS_JSON (service account key) and
      GOOGLE_SC_SITE_URL (e.g. sc-domain:dbjtechnologies.com), then wait
      for the first 06:00 UTC cron run.
    </p>
  );
}

function QueriesTable({ rows }: { rows: GscQueryRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Query</th>
            <th className="px-3 py-2 text-right font-semibold">Impressions</th>
            <th className="px-3 py-2 text-right font-semibold">Clicks</th>
            <th className="px-3 py-2 text-right font-semibold">CTR</th>
            <th className="px-3 py-2 text-right font-semibold">Position</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.query} className="border-t border-zinc-100">
              <td className="px-3 py-2 text-xs text-zinc-900">{r.query}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">
                {formatNumber(r.impressions)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-900">
                {formatNumber(r.clicks)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-500">
                {(r.ctr * 100).toFixed(1)}%
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-500">
                {r.position.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PagesTable({ rows }: { rows: GscPageRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Page</th>
            <th className="px-3 py-2 text-right font-semibold">Impressions</th>
            <th className="px-3 py-2 text-right font-semibold">Clicks</th>
            <th className="px-3 py-2 text-right font-semibold">CTR</th>
            <th className="px-3 py-2 text-right font-semibold">Position</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.page} className="border-t border-zinc-100">
              <td className="px-3 py-2 font-mono text-xs text-zinc-900">{r.page}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">
                {formatNumber(r.impressions)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-900">
                {formatNumber(r.clicks)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-500">
                {(r.ctr * 100).toFixed(1)}%
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-500">
                {r.position.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OpportunitiesTable({ rows }: { rows: GscOpportunityRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Page</th>
            <th className="px-3 py-2 font-semibold">Query</th>
            <th className="px-3 py-2 text-right font-semibold">Impressions</th>
            <th className="px-3 py-2 text-right font-semibold">Clicks</th>
            <th className="px-3 py-2 text-right font-semibold">Position</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.page}::${r.query}::${i}`} className="border-t border-zinc-100">
              <td className="px-3 py-2 font-mono text-xs text-zinc-900">{r.page}</td>
              <td className="px-3 py-2 text-xs text-zinc-700">{r.query}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">
                {formatNumber(r.impressions)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-900">
                {formatNumber(r.clicks)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-500">
                {r.position.toFixed(1)}
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
