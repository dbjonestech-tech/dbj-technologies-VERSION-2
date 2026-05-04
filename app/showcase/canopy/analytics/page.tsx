import {
  DEMO_VISITOR_KPIS,
  DEMO_VISITORS_RECENT,
  DEMO_TOP_PAGES,
  DEMO_TOP_SOURCES,
  DEMO_RUM,
  DEMO_SEARCH_QUERIES,
  formatRelativeTime,
} from "@/lib/demo/fixtures";

/* Showcase analytics & performance. First-party visitor data,
 * Web Vitals, top pages, top sources, search queries. Static
 * rendering of the same panels the live /admin/visitors,
 * /admin/performance/rum, and /admin/search pages produce. */

export default function ShowcaseAnalyticsPage() {
  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
            Acquisition
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Analytics & Performance
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            First-party visitor data, recurring-user behavior, Core
            Web Vitals, and search insight, all captured directly into
            the buyer's database. Performance lives next to conversion
            lives next to pipeline. Same auth gate, same numbers, no
            export reconciliation.
          </p>
        </header>

        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <KpiTile
            label="Humans, 7d"
            value={DEMO_VISITOR_KPIS.humans7d.toLocaleString()}
            delta={`+${DEMO_VISITOR_KPIS.humans7dDeltaPct}% vs prev 7d`}
            tone="up"
          />
          <KpiTile
            label="Sessions, 7d"
            value={DEMO_VISITOR_KPIS.sessions7d.toLocaleString()}
            delta="real users only"
            tone="neutral"
          />
          <KpiTile
            label="Pages / session"
            value={DEMO_VISITOR_KPIS.pagesPerSession.toFixed(1)}
            delta="avg this period"
            tone="neutral"
          />
          <KpiTile
            label="Bounce rate"
            value={`${DEMO_VISITOR_KPIS.bounceRatePct}%`}
            delta="excludes one-pixel hits"
            tone="neutral"
          />
          <KpiTile
            label="Avg duration"
            value={`${Math.floor(DEMO_VISITOR_KPIS.avgDurationSec / 60)}m ${DEMO_VISITOR_KPIS.avgDurationSec % 60}s`}
            delta="reading time"
            tone="neutral"
          />
          <KpiTile
            label="Returning"
            value={`${DEMO_VISITOR_KPIS.recurringRate}%`}
            delta="of weekly visitors"
            tone="neutral"
          />
        </section>

        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
              Real-User Web Vitals
            </h2>
            <span className="text-[11px] text-zinc-500">last 14 days</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <RumTile
              label="LCP"
              value={`${DEMO_RUM.lcpSec.toFixed(1)}s`}
              tone={DEMO_RUM.lcpSec <= DEMO_RUM.lcpThreshold.good ? "good" : DEMO_RUM.lcpSec <= DEMO_RUM.lcpThreshold.poor ? "warn" : "bad"}
              note={`target ≤ ${DEMO_RUM.lcpThreshold.good}s`}
            />
            <RumTile
              label="INP"
              value={`${DEMO_RUM.inpMs}ms`}
              tone={DEMO_RUM.inpMs <= DEMO_RUM.inpThreshold.good ? "good" : DEMO_RUM.inpMs <= DEMO_RUM.inpThreshold.poor ? "warn" : "bad"}
              note={`target ≤ ${DEMO_RUM.inpThreshold.good}ms`}
            />
            <RumTile
              label="CLS"
              value={DEMO_RUM.cls.toFixed(2)}
              tone={DEMO_RUM.cls <= DEMO_RUM.clsThreshold.good ? "good" : DEMO_RUM.cls <= DEMO_RUM.clsThreshold.poor ? "warn" : "bad"}
              note={`target ≤ ${DEMO_RUM.clsThreshold.good}`}
            />
            <RumTile
              label="TTFB"
              value={`${DEMO_RUM.ttfbSec.toFixed(2)}s`}
              tone="good"
              note="server response"
            />
            <RumTile
              label="FCP"
              value={`${DEMO_RUM.fcpSec.toFixed(1)}s`}
              tone="good"
              note="first content"
            />
          </div>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
              Top Pages
            </h2>
            <table className="canopy-table w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider">
                  <th className="px-2 py-2 font-semibold">Path</th>
                  <th className="px-2 py-2 text-right font-semibold">Views</th>
                  <th className="px-2 py-2 text-right font-semibold">Bounce</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_TOP_PAGES.map((p) => (
                  <tr key={p.path} className="border-t border-zinc-100">
                    <td className="px-2 py-2 font-mono text-[12px] text-zinc-800">{p.path}</td>
                    <td className="px-2 py-2 text-right font-mono text-[12px]">{p.views.toLocaleString()}</td>
                    <td className="px-2 py-2 text-right font-mono text-[11px] text-zinc-500">{p.bounceRatePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500" />
              Top Sources
            </h2>
            <table className="canopy-table w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider">
                  <th className="px-2 py-2 font-semibold">Source</th>
                  <th className="px-2 py-2 text-right font-semibold">Visits</th>
                  <th className="px-2 py-2 text-right font-semibold">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_TOP_SOURCES.map((s) => (
                  <tr key={s.label} className="border-t border-zinc-100">
                    <td className="px-2 py-2 font-mono text-[12px] text-zinc-800">{s.label}</td>
                    <td className="px-2 py-2 text-right font-mono text-[12px]">{s.visits.toLocaleString()}</td>
                    <td className="px-2 py-2 text-right font-mono text-[12px] text-emerald-700">{s.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Search Queries
          </h2>
          <table className="canopy-table w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider">
                <th className="px-2 py-2 font-semibold">Query</th>
                <th className="px-2 py-2 text-right font-semibold">Impressions</th>
                <th className="px-2 py-2 text-right font-semibold">Clicks</th>
                <th className="px-2 py-2 text-right font-semibold">CTR</th>
                <th className="px-2 py-2 text-right font-semibold">Avg position</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_SEARCH_QUERIES.map((q) => (
                <tr key={q.query} className="border-t border-zinc-100">
                  <td className="px-2 py-2 text-[12px] text-zinc-800">{q.query}</td>
                  <td className="px-2 py-2 text-right font-mono text-[12px]">{q.impressions.toLocaleString()}</td>
                  <td className="px-2 py-2 text-right font-mono text-[12px]">{q.clicks}</td>
                  <td className="px-2 py-2 text-right font-mono text-[11px] text-emerald-700">{q.ctrPct.toFixed(1)}%</td>
                  <td className="px-2 py-2 text-right font-mono text-[11px] text-zinc-500">{q.avgPosition.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-500" />
            Recent Visitors
          </h2>
          <table className="canopy-table w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider">
                <th className="px-2 py-2 font-semibold">When</th>
                <th className="px-2 py-2 font-semibold">Location</th>
                <th className="px-2 py-2 font-semibold">Source</th>
                <th className="px-2 py-2 text-right font-semibold">Pages</th>
                <th className="px-2 py-2 text-right font-semibold">Duration</th>
                <th className="px-2 py-2 text-right font-semibold">Device</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_VISITORS_RECENT.map((v) => (
                <tr key={v.id} className="border-t border-zinc-100">
                  <td className="px-2 py-2 font-mono text-[11px] text-zinc-500">{formatRelativeTime(v.startedAt)}</td>
                  <td className="px-2 py-2 text-[12px]">{v.city ?? "Unknown"}</td>
                  <td className="px-2 py-2 font-mono text-[11px] text-zinc-700">{v.source}</td>
                  <td className="px-2 py-2 text-right font-mono text-[12px]">{v.pageviews}</td>
                  <td className="px-2 py-2 text-right font-mono text-[11px] text-zinc-500">{Math.floor(v.durationSec / 60)}m {v.durationSec % 60}s</td>
                  <td className="px-2 py-2 text-right text-[11px] capitalize text-zinc-600">{v.device}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "up" | "down" | "neutral";
}) {
  const deltaColor =
    tone === "up" ? "text-emerald-700" : tone === "down" ? "text-rose-700" : "text-zinc-500";
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1.5 font-mono text-2xl font-semibold text-zinc-900">{value}</p>
      <p className={`mt-1 text-[11px] ${deltaColor}`}>{delta}</p>
    </div>
  );
}

function RumTile({
  label,
  value,
  tone,
  note,
}: {
  label: string;
  value: string;
  tone: "good" | "warn" | "bad";
  note: string;
}) {
  const valueColor = tone === "good" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : "text-rose-700";
  const ringColor = tone === "good" ? "ring-emerald-200" : tone === "warn" ? "ring-amber-200" : "ring-rose-200";
  return (
    <div className={`rounded-lg bg-white p-3 ring-1 ring-inset ${ringColor}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-1 font-mono text-xl font-semibold ${valueColor}`}>{value}</p>
      <p className="mt-0.5 text-[10px] text-zinc-500">{note}</p>
    </div>
  );
}
