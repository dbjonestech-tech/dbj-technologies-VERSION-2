import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Internal cost dashboard",
  robots: { index: false, follow: false, nocache: true },
};

type ProviderTotalRow = {
  provider: string;
  calls: number;
  ok_calls: number;
  retry_calls: number;
  fail_calls: number;
  total_usd: number;
  avg_duration_ms: number | null;
};

type OperationRow = {
  provider: string;
  operation: string;
  calls: number;
  total_usd: number;
};

type TopScanRow = {
  scan_id: string | null;
  calls: number;
  total_usd: number;
};

type WindowSummary = {
  label: string;
  totalUsd: number;
  totalCalls: number;
  distinctScans: number;
  avgUsdPerScan: number;
  byProvider: ProviderTotalRow[];
  byOperation: OperationRow[];
  topScans: TopScanRow[];
};

const WINDOWS: { label: string; interval: string }[] = [
  { label: "Last 24 hours", interval: "1 day" },
  { label: "Last 7 days", interval: "7 days" },
  { label: "Last 30 days", interval: "30 days" },
];

async function loadWindow(label: string, interval: string): Promise<WindowSummary> {
  const sql = getDb();

  const totalsRows = (await sql`
    SELECT
      COUNT(*)::int AS calls,
      COUNT(DISTINCT scan_id)::int AS distinct_scans,
      COALESCE(SUM(cost_usd), 0)::float8 AS total_usd
    FROM api_usage_events
    WHERE occurred_at > now() - (${interval})::interval
  `) as { calls: number; distinct_scans: number; total_usd: number }[];

  const byProvider = (await sql`
    SELECT
      provider,
      COUNT(*)::int AS calls,
      COUNT(*) FILTER (WHERE status = 'ok')::int AS ok_calls,
      COUNT(*) FILTER (WHERE status = 'retry')::int AS retry_calls,
      COUNT(*) FILTER (WHERE status = 'fail')::int AS fail_calls,
      COALESCE(SUM(cost_usd), 0)::float8 AS total_usd,
      AVG(duration_ms)::float8 AS avg_duration_ms
    FROM api_usage_events
    WHERE occurred_at > now() - (${interval})::interval
    GROUP BY provider
    ORDER BY total_usd DESC, calls DESC
  `) as ProviderTotalRow[];

  const byOperation = (await sql`
    SELECT
      provider,
      operation,
      COUNT(*)::int AS calls,
      COALESCE(SUM(cost_usd), 0)::float8 AS total_usd
    FROM api_usage_events
    WHERE occurred_at > now() - (${interval})::interval
    GROUP BY provider, operation
    ORDER BY total_usd DESC, calls DESC
    LIMIT 20
  `) as OperationRow[];

  const topScans = (await sql`
    SELECT
      scan_id,
      COUNT(*)::int AS calls,
      COALESCE(SUM(cost_usd), 0)::float8 AS total_usd
    FROM api_usage_events
    WHERE occurred_at > now() - (${interval})::interval AND scan_id IS NOT NULL
    GROUP BY scan_id
    ORDER BY total_usd DESC
    LIMIT 10
  `) as TopScanRow[];

  const totals = totalsRows[0] ?? {
    calls: 0,
    distinct_scans: 0,
    total_usd: 0,
  };
  const totalUsd = Number(totals.total_usd ?? 0);
  const distinctScans = Number(totals.distinct_scans ?? 0);

  return {
    label,
    totalUsd,
    totalCalls: Number(totals.calls ?? 0),
    distinctScans,
    avgUsdPerScan: distinctScans > 0 ? totalUsd / distinctScans : 0,
    byProvider,
    byOperation,
    topScans,
  };
}

function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: n < 1 ? 4 : 2,
    maximumFractionDigits: n < 1 ? 4 : 2,
  }).format(n);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatMs(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "-";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}s`;
  return `${Math.round(n)}ms`;
}

export default async function InternalCostDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const expectedPin = process.env.INTERNAL_ADMIN_PIN;
  if (!expectedPin) {
    notFound();
  }

  const params = await searchParams;
  const supplied = typeof params.pin === "string" ? params.pin : null;
  if (!supplied || supplied !== expectedPin) {
    notFound();
  }

  const windows = await Promise.all(
    WINDOWS.map((w) => loadWindow(w.label, w.interval))
  );

  return (
    <div
      className="min-h-screen w-full px-6 py-12"
      style={{ backgroundColor: "#06060a", color: "#e7ebf2" }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-10">
          <p
            className="text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: "#9aa3b2" }}
          >
            Internal
          </p>
          <h1
            className="mt-2 font-display text-3xl font-bold sm:text-4xl"
            style={{ color: "#e7ebf2" }}
          >
            Cost Dashboard
          </h1>
          <p
            className="mt-3 max-w-2xl text-sm leading-relaxed"
            style={{ color: "#9aa3b2" }}
          >
            Outbound API spend across Anthropic, Browserless, PageSpeed
            Insights, and Resend. Anthropic dollars are computed from
            input/output/cache token counts at log time. Browserless and
            PageSpeed Insights row counts are tracked but their per-call
            dollar cost is not, so totalUsd is Anthropic-only.
          </p>
        </header>

        <div className="grid gap-8">
          {windows.map((w) => (
            <WindowSection key={w.label} window={w} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WindowSection({ window: w }: { window: WindowSummary }) {
  return (
    <section
      className="rounded-2xl border p-6"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "rgba(10,12,18,0.7)",
      }}
    >
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <h2
          className="font-display text-xl font-semibold"
          style={{ color: "#e7ebf2" }}
        >
          {w.label}
        </h2>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <Stat label="Total spend" value={formatUsd(w.totalUsd)} />
          <Stat label="API calls" value={formatNumber(w.totalCalls)} />
          <Stat label="Scans" value={formatNumber(w.distinctScans)} />
          <Stat label="Avg / scan" value={formatUsd(w.avgUsdPerScan)} />
        </div>
      </header>

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
        By provider
      </h3>
      <div className="overflow-x-auto">
        <table className="mb-6 w-full min-w-[600px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "#6b7280" }}>
              <th className="px-3 py-2">Provider</th>
              <th className="px-3 py-2 text-right">Calls</th>
              <th className="px-3 py-2 text-right">OK / Retry / Fail</th>
              <th className="px-3 py-2 text-right">Avg duration</th>
              <th className="px-3 py-2 text-right">Total spend</th>
            </tr>
          </thead>
          <tbody>
            {w.byProvider.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-3 text-center" style={{ color: "#9aa3b2" }}>
                  No calls in this window.
                </td>
              </tr>
            ) : (
              w.byProvider.map((row) => (
                <tr
                  key={row.provider}
                  className="border-t"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                >
                  <td className="px-3 py-2 font-mono">{row.provider}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(Number(row.calls))}</td>
                  <td className="px-3 py-2 text-right text-xs" style={{ color: "#9aa3b2" }}>
                    <span style={{ color: "#86efac" }}>{Number(row.ok_calls)}</span>
                    {" / "}
                    <span style={{ color: "#fcd34d" }}>{Number(row.retry_calls)}</span>
                    {" / "}
                    <span style={{ color: "#fca5a5" }}>{Number(row.fail_calls)}</span>
                  </td>
                  <td className="px-3 py-2 text-right" style={{ color: "#9aa3b2" }}>
                    {formatMs(Number(row.avg_duration_ms))}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatUsd(Number(row.total_usd))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
        By operation (top 20)
      </h3>
      <div className="overflow-x-auto">
        <table className="mb-6 w-full min-w-[500px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "#6b7280" }}>
              <th className="px-3 py-2">Provider</th>
              <th className="px-3 py-2">Operation</th>
              <th className="px-3 py-2 text-right">Calls</th>
              <th className="px-3 py-2 text-right">Total spend</th>
            </tr>
          </thead>
          <tbody>
            {w.byOperation.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-3 text-center" style={{ color: "#9aa3b2" }}>
                  No operations recorded in this window.
                </td>
              </tr>
            ) : (
              w.byOperation.map((row) => (
                <tr
                  key={`${row.provider}:${row.operation}`}
                  className="border-t"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                >
                  <td className="px-3 py-2 font-mono text-xs" style={{ color: "#9aa3b2" }}>
                    {row.provider}
                  </td>
                  <td className="px-3 py-2 font-mono">{row.operation}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(Number(row.calls))}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatUsd(Number(row.total_usd))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
        Top scans by spend (top 10)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider" style={{ color: "#6b7280" }}>
              <th className="px-3 py-2">Scan ID</th>
              <th className="px-3 py-2 text-right">Calls</th>
              <th className="px-3 py-2 text-right">Total spend</th>
            </tr>
          </thead>
          <tbody>
            {w.topScans.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-3 text-center" style={{ color: "#9aa3b2" }}>
                  No scan-attributed spend in this window.
                </td>
              </tr>
            ) : (
              w.topScans.map((row) => (
                <tr
                  key={row.scan_id ?? "null"}
                  className="border-t"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                >
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.scan_id ?? "(unattributed)"}
                  </td>
                  <td className="px-3 py-2 text-right">{formatNumber(Number(row.calls))}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatUsd(Number(row.total_usd))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-end">
      <span
        className="text-[10px] uppercase tracking-wider"
        style={{ color: "#6b7280" }}
      >
        {label}
      </span>
      <span
        className="font-mono text-base font-semibold"
        style={{ color: "#e7ebf2" }}
      >
        {value}
      </span>
    </div>
  );
}
