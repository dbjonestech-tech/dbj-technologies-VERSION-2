import type { Metadata } from "next";
import {
  getFunctionHealth,
  getRecentInngestRuns,
  type FunctionHealth,
  type RecentInngestRun,
} from "@/lib/services/inngest-health";
import PageHeader from "../PageHeader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Pipeline",
  robots: { index: false, follow: false, nocache: true },
};

function formatRelative(iso: string | null): string {
  if (!iso) return "-";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function formatDuration(ms: number | null): string {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

export default async function PipelinePage() {
  const [health, recent] = await Promise.all([
    getFunctionHealth(7),
    getRecentInngestRuns(50),
  ]);

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          palette="emerald"
          section="Health"
          pageName="Inngest pipeline"
          description="Run history per function, sourced from the Inngest webhook and the inngestHealthHourly catch-up cron. Failure rate and p95 trending: the early warning for Pathlight pipeline regressions."
        />

        <Section title="Function health (7 days)">
          <FunctionTable rows={health} />
        </Section>

        <Section title="Recent runs">
          <RecentRunsTable rows={recent} />
        </Section>
      </div>
    </div>
  );
}

function FunctionTable({ rows }: { rows: FunctionHealth[] }) {
  if (rows.length === 0)
    return (
      <p className="text-sm text-zinc-500">
        No run history yet. Configure the Inngest webhook at
        /api/webhooks/inngest with INNGEST_WEBHOOK_SECRET to populate.
      </p>
    );
  return (
    <div className="overflow-x-auto">
      <table className="canopy-table w-full min-w-[800px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Function</th>
            <th className="px-3 py-2 text-right font-semibold">Invocations</th>
            <th className="px-3 py-2 text-right font-semibold">Failed</th>
            <th className="px-3 py-2 text-right font-semibold">Failure rate</th>
            <th className="px-3 py-2 text-right font-semibold">p50</th>
            <th className="px-3 py-2 text-right font-semibold">p95</th>
            <th className="px-3 py-2 text-right font-semibold">p99</th>
            <th className="px-3 py-2 text-right font-semibold">In flight</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.functionId} className="border-t border-zinc-100">
              <td className="px-3 py-2 font-mono text-xs text-zinc-900">{r.functionId}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">{r.invocations}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">{r.failed}</td>
              <td
                className={`px-3 py-2 text-right font-mono ${r.failureRatePct >= 5 ? "text-red-600" : r.failureRatePct >= 1 ? "text-amber-600" : "text-emerald-600"}`}
              >
                {r.failureRatePct.toFixed(2)}%
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-500">
                {formatDuration(r.p50Ms)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-500">
                {formatDuration(r.p95Ms)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-500">
                {formatDuration(r.p99Ms)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-500">{r.inflight}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentRunsTable({ rows }: { rows: RecentInngestRun[] }) {
  if (rows.length === 0)
    return <p className="text-sm text-zinc-500">No recent runs.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="canopy-table w-full min-w-[700px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Function</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="px-3 py-2 text-right font-semibold">Duration</th>
            <th className="px-3 py-2 text-right font-semibold">When</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.runId} className="border-t border-zinc-100">
              <td className="px-3 py-2 font-mono text-xs text-zinc-900">{r.functionId}</td>
              <td className="px-3 py-2">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-3 py-2 text-right font-mono text-xs text-zinc-500">
                {formatDuration(r.durationMs)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-xs text-zinc-500">
                {formatRelative(r.startedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    running: "bg-blue-50 text-blue-700 border-blue-200",
    queued: "bg-zinc-100 text-zinc-700 border-zinc-200",
    failed: "bg-red-50 text-red-700 border-red-200",
    cancelled: "bg-zinc-100 text-zinc-500 border-zinc-200",
  };
  const className = `inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${variants[status] ?? "bg-zinc-100 text-zinc-700 border-zinc-200"}`;
  return <span className={className}>{status}</span>;
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
