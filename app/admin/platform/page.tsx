import type { Metadata } from "next";
import {
  getCurrentDeploymentSummary,
  getRecentDeployments,
  type DeploymentRow,
  type CurrentDeploymentSummary,
} from "@/lib/services/vercel-platform";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Platform",
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

function formatBuildDuration(ms: number | null): string {
  if (!ms) return "-";
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

function stateBadge(state: string) {
  const variants: Record<string, string> = {
    READY: "bg-emerald-50 text-emerald-700 border-emerald-200",
    BUILDING: "bg-blue-50 text-blue-700 border-blue-200",
    INITIALIZING: "bg-blue-50 text-blue-700 border-blue-200",
    QUEUED: "bg-blue-50 text-blue-700 border-blue-200",
    ERROR: "bg-red-50 text-red-700 border-red-200",
    CANCELED: "bg-zinc-100 text-zinc-700 border-zinc-200",
  };
  const className = `inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${variants[state] ?? "bg-zinc-100 text-zinc-700 border-zinc-200"}`;
  return <span className={className}>{state}</span>;
}

export default async function PlatformPage() {
  const [summary, deployments] = await Promise.all([
    getCurrentDeploymentSummary(),
    getRecentDeployments(25),
  ]);

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Health
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Vercel platform
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Deployment lifecycle pulled from Vercel webhooks +
            vercelTelemetryHourly. Failures within the last 24 hours
            are surfaced first; production state is the single most
            important field at the top.
          </p>
        </header>

        <SummaryGrid summary={summary} />

        <Section title="Recent deployments">
          <DeploymentsTable rows={deployments} />
        </Section>
      </div>
    </div>
  );
}

function SummaryGrid({ summary }: { summary: CurrentDeploymentSummary }) {
  return (
    <section className="mb-6 grid gap-3 sm:grid-cols-3">
      <Card label="Production state">
        <div className="flex items-center gap-3">
          {summary.productionState ? stateBadge(summary.productionState) : <span className="text-zinc-400">no data</span>}
          <span className="text-xs text-zinc-500">
            {summary.productionAge ? formatRelative(summary.productionAge) : "-"}
          </span>
        </div>
      </Card>
      <Card label="Failed last 24h">
        <span
          className={`font-mono text-2xl font-semibold ${summary.failedLast24h > 0 ? "text-red-600" : "text-emerald-600"}`}
        >
          {summary.failedLast24h}
        </span>
      </Card>
      <Card label="Building now">
        <span className="font-mono text-2xl font-semibold text-zinc-900">
          {summary.buildingNow}
        </span>
      </Card>
    </section>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <div className="mt-3 text-sm">{children}</div>
    </div>
  );
}

function DeploymentsTable({ rows }: { rows: DeploymentRow[] }) {
  if (rows.length === 0)
    return (
      <p className="text-sm text-zinc-500">
        No deployments observed yet. Set VERCEL_API_TOKEN, VERCEL_PROJECT_ID,
        and the webhook secret to populate.
      </p>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">State</th>
            <th className="px-3 py-2 font-semibold">Target</th>
            <th className="px-3 py-2 font-semibold">Branch</th>
            <th className="px-3 py-2 font-semibold">Commit</th>
            <th className="px-3 py-2 text-right font-semibold">Build</th>
            <th className="px-3 py-2 text-right font-semibold">When</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-zinc-100">
              <td className="px-3 py-2">{stateBadge(r.state)}</td>
              <td className="px-3 py-2 text-xs text-zinc-700">{r.target ?? "-"}</td>
              <td className="px-3 py-2 font-mono text-xs text-zinc-700">{r.branch ?? "-"}</td>
              <td className="px-3 py-2 text-xs text-zinc-700">
                {r.commitSha ? (
                  <span title={r.commitMessage ?? ""}>
                    <span className="font-mono">{r.commitSha.slice(0, 7)}</span>
                    {r.commitMessage ? (
                      <span className="ml-2 text-zinc-500">
                        {r.commitMessage.slice(0, 60)}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  "-"
                )}
              </td>
              <td className="px-3 py-2 text-right font-mono text-xs text-zinc-500">
                {formatBuildDuration(r.buildDurationMs)}
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
