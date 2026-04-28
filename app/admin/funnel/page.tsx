import type { Metadata } from "next";
import {
  getCohortGrid,
  getFunnelBySource,
  getFunnelStages,
  type CohortCell,
  type FunnelBySourceRow,
  type FunnelStage,
} from "@/lib/services/funnel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Funnel",
  robots: { index: false, follow: false, nocache: true },
};

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export default async function FunnelPage() {
  const [stages7, stages30, bySource, cohort] = await Promise.all([
    getFunnelStages(7),
    getFunnelStages(30),
    getFunnelBySource(30, 25),
    getCohortGrid(8),
  ]);

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Acquisition
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Funnel
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Sessions to scans to contacts. Powered by joins between the
            sessions, scans, and contact_submissions tables. Refreshed
            hourly by funnelRefreshHourly.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Last 7 days">
            <FunnelStages stages={stages7} />
          </Section>
          <Section title="Last 30 days">
            <FunnelStages stages={stages30} />
          </Section>
        </div>

        <Section title="Funnel by source (30 days)">
          <SourcesTable rows={bySource} />
        </Section>

        <Section title="Cohort retention (8 weeks)">
          <CohortGrid rows={cohort} />
        </Section>
      </div>
    </div>
  );
}

function FunnelStages({ stages }: { stages: FunnelStage[] }) {
  const top = stages[0]?.count ?? 0;
  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const widthPct =
          top > 0 ? Math.max(2, Math.min(100, (stage.count / top) * 100)) : 2;
        return (
          <div key={stage.label} className="flex items-center gap-3">
            <span className="w-44 shrink-0 text-xs text-zinc-700">
              {stage.label}
            </span>
            <div className="relative flex-1">
              <div
                className="h-7 rounded-md"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: "rgba(8, 145, 178, 0.18)",
                }}
              >
                <div
                  className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-900"
                  style={{ minWidth: "fit-content" }}
                >
                  {formatNumber(stage.count)}
                </div>
              </div>
            </div>
            <span className="w-20 text-right font-mono text-xs text-zinc-500">
              {i === 0 ? "--" : stage.pctOfPrevious === null ? "--" : `${stage.pctOfPrevious}%`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SourcesTable({ rows }: { rows: FunnelBySourceRow[] }) {
  if (rows.length === 0)
    return <p className="text-sm text-zinc-500">No data yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Source</th>
            <th className="px-3 py-2 text-right font-semibold">Sessions</th>
            <th className="px-3 py-2 text-right font-semibold">Scan starts</th>
            <th className="px-3 py-2 text-right font-semibold">Scans completed</th>
            <th className="px-3 py-2 text-right font-semibold">Contacts</th>
            <th className="px-3 py-2 text-right font-semibold">Scan rate</th>
            <th className="px-3 py-2 text-right font-semibold">Contact rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.source} className="border-t border-zinc-100">
              <td className="px-3 py-2 font-mono text-xs text-zinc-900">{r.source}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-900">{formatNumber(r.sessions)}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">{formatNumber(r.scanStarts)}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">{formatNumber(r.scansCompleted)}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">{formatNumber(r.contactSubmissions)}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-500">{r.scanRate.toFixed(2)}%</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-500">{r.contactRate.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CohortGrid({ rows }: { rows: CohortCell[] }) {
  if (rows.length === 0)
    return <p className="text-sm text-zinc-500">No data yet.</p>;

  const cohorts = Array.from(new Set(rows.map((r) => r.cohortWeek))).sort();
  const maxOffset = Math.max(...rows.map((r) => r.weekOffset), 0);
  const lookup = new Map<string, CohortCell>();
  for (const r of rows) lookup.set(`${r.cohortWeek}::${r.weekOffset}`, r);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Cohort</th>
            {Array.from({ length: maxOffset + 1 }, (_, i) => (
              <th key={i} className="px-3 py-2 text-center font-semibold">
                W+{i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((week) => {
            const baseCell = lookup.get(`${week}::0`);
            const base = baseCell?.activeSessions ?? 0;
            return (
              <tr key={week} className="border-t border-zinc-100">
                <td className="px-3 py-2 font-mono text-xs text-zinc-700">
                  {week.slice(0, 10)}
                </td>
                {Array.from({ length: maxOffset + 1 }, (_, i) => {
                  const cell = lookup.get(`${week}::${i}`);
                  if (!cell) {
                    return (
                      <td
                        key={i}
                        className="px-3 py-2 text-center font-mono text-xs text-zinc-300"
                      >
                        --
                      </td>
                    );
                  }
                  const pct = base > 0 ? (cell.activeSessions / base) * 100 : 0;
                  const tone =
                    pct >= 30
                      ? "bg-emerald-50 text-emerald-800"
                      : pct >= 15
                      ? "bg-amber-50 text-amber-800"
                      : "bg-zinc-50 text-zinc-700";
                  return (
                    <td
                      key={i}
                      className={`px-3 py-2 text-center font-mono text-xs ${tone}`}
                      title={`${cell.activeSessions} sessions · ${cell.scanConversions} scans · ${cell.contactConversions} contacts`}
                    >
                      {pct.toFixed(0)}%
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-zinc-500">
        Each cell is the percentage of the cohort&apos;s starting visitors
        who returned in week N+offset. Hover any cell for raw counts.
      </p>
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
