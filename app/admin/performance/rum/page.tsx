import type { Metadata } from "next";
import {
  getRumByPage,
  getRumOverview,
  type PercentileBand,
  type RumByPage,
} from "@/lib/services/rum";
import PageHeader from "../../PageHeader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "RUM",
  robots: { index: false, follow: false, nocache: true },
};

/* Core Web Vitals "good" thresholds per https://web.dev/vitals/.
 * "needs improvement" sits between good and poor. */
const THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  inp: { good: 200, poor: 500 },
  cls: { good: 0.1, poor: 0.25 },
  ttfb: { good: 800, poor: 1800 },
  fcp: { good: 1800, poor: 3000 },
};

function bandClass(metric: keyof typeof THRESHOLDS, value: number | null): string {
  if (value === null || value === undefined) return "text-zinc-400";
  const t = THRESHOLDS[metric];
  if (value <= t.good) return "text-emerald-600";
  if (value <= t.poor) return "text-amber-600";
  return "text-red-600";
}

function fmt(metric: keyof typeof THRESHOLDS, value: number | null): string {
  if (value === null || value === undefined) return "-";
  if (metric === "cls") return value.toFixed(3);
  return `${value}ms`;
}

export default async function RumPage({
  searchParams,
}: {
  searchParams: Promise<{ device?: string }>;
}) {
  const { device } = await searchParams;
  const filter = device === "mobile" || device === "desktop" || device === "tablet" ? device : null;

  const [overview7, overview30, byPage] = await Promise.all([
    getRumOverview(7),
    getRumOverview(30),
    getRumByPage(30, filter, 25),
  ]);

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          palette="fuchsia"
          section="Acquisition"
          pageName="Real-user CWV"
          description="Field measurements from actual visitors, captured by the engagement beacon. Distinct from synthetic Lighthouse, this is what real users on real networks experience."
        />

        <div className="mb-6 flex flex-wrap gap-2">
          <DeviceTab label="All devices" href="/admin/performance/rum" active={filter === null} />
          <DeviceTab label="Mobile" href="/admin/performance/rum?device=mobile" active={filter === "mobile"} />
          <DeviceTab label="Desktop" href="/admin/performance/rum?device=desktop" active={filter === "desktop"} />
          <DeviceTab label="Tablet" href="/admin/performance/rum?device=tablet" active={filter === "tablet"} />
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <OverviewCard label="Last 7 days" overview={overview7} />
          <OverviewCard label="Last 30 days" overview={overview30} />
        </div>

        <Section title="Per-page percentiles (30 days)">
          <RumTable rows={byPage} />
        </Section>
      </div>
    </div>
  );
}

function DeviceTab({ label, href, active }: { label: string; href: string; active: boolean }) {
  const className = active
    ? "rounded-full bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white"
    : "rounded-full border border-zinc-200 px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-300";
  return (
    <a href={href} className={className}>
      {label}
    </a>
  );
}

function OverviewCard({
  label,
  overview,
}: {
  label: string;
  overview: { views: number; lcp: PercentileBand; inp: PercentileBand; cls: PercentileBand };
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        {new Intl.NumberFormat("en-US").format(overview.views)} views measured
      </p>
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <Metric label="LCP p75" value={fmt("lcp", overview.lcp.p75)} cls={bandClass("lcp", overview.lcp.p75)} />
        <Metric label="INP p75" value={fmt("inp", overview.inp.p75)} cls={bandClass("inp", overview.inp.p75)} />
        <Metric label="CLS p75" value={fmt("cls", overview.cls.p75)} cls={bandClass("cls", overview.cls.p75)} />
      </div>
    </div>
  );
}

function Metric({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-400">{label}</p>
      <p className={`font-mono text-base font-semibold ${cls}`}>{value}</p>
    </div>
  );
}

function RumTable({ rows }: { rows: RumByPage[] }) {
  if (rows.length === 0)
    return <p className="text-sm text-zinc-500">No engagement data yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="canopy-table w-full min-w-[900px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Path</th>
            <th className="px-3 py-2 text-right font-semibold">Views</th>
            <th className="px-3 py-2 text-right font-semibold">LCP p75</th>
            <th className="px-3 py-2 text-right font-semibold">LCP p95</th>
            <th className="px-3 py-2 text-right font-semibold">INP p75</th>
            <th className="px-3 py-2 text-right font-semibold">INP p95</th>
            <th className="px-3 py-2 text-right font-semibold">CLS p75</th>
            <th className="px-3 py-2 text-right font-semibold">TTFB p75</th>
            <th className="px-3 py-2 text-right font-semibold">FCP p75</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.path} className="border-t border-zinc-100">
              <td className="px-3 py-2 font-mono text-xs text-zinc-900">{r.path}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">{r.views}</td>
              <td className={`px-3 py-2 text-right font-mono ${bandClass("lcp", r.lcp.p75)}`}>{fmt("lcp", r.lcp.p75)}</td>
              <td className={`px-3 py-2 text-right font-mono ${bandClass("lcp", r.lcp.p95)}`}>{fmt("lcp", r.lcp.p95)}</td>
              <td className={`px-3 py-2 text-right font-mono ${bandClass("inp", r.inp.p75)}`}>{fmt("inp", r.inp.p75)}</td>
              <td className={`px-3 py-2 text-right font-mono ${bandClass("inp", r.inp.p95)}`}>{fmt("inp", r.inp.p95)}</td>
              <td className={`px-3 py-2 text-right font-mono ${bandClass("cls", r.cls.p75)}`}>{fmt("cls", r.cls.p75)}</td>
              <td className={`px-3 py-2 text-right font-mono ${bandClass("ttfb", r.ttfb.p75)}`}>{fmt("ttfb", r.ttfb.p75)}</td>
              <td className={`px-3 py-2 text-right font-mono ${bandClass("fcp", r.fcp.p75)}`}>{fmt("fcp", r.fcp.p75)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-zinc-500">
        Green = within Core Web Vitals &ldquo;good&rdquo; threshold,
        amber = needs improvement, red = poor. Thresholds match
        web.dev/vitals.
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
