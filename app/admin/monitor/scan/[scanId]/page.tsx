import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import {
  getEventsForScan,
  type MonitoringEventRow,
} from "@/lib/services/monitoring";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Monitor - scan",
  robots: { index: false, follow: false, nocache: true },
};

type ApiUsageRow = {
  id: string;
  provider: string;
  operation: string;
  model: string | null;
  duration_ms: number | null;
  status: string;
  attempt: number;
  cost_usd: string;
  occurred_at: string;
};

type ScanRow = {
  id: string;
  url: string;
  status: string;
  email: string;
  business_name: string | null;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
};

async function loadScan(scanId: string): Promise<ScanRow | null> {
  const sql = getDb();
  const rows = (await sql`
    SELECT id::text, url, status, email, business_name,
           created_at, completed_at, error_message
    FROM scans
    WHERE id = ${scanId}::uuid
    LIMIT 1
  `) as ScanRow[];
  return rows[0] ?? null;
}

async function loadApiUsage(scanId: string): Promise<ApiUsageRow[]> {
  const sql = getDb();
  const rows = (await sql`
    SELECT id::text, provider, operation, model, duration_ms, status, attempt,
           cost_usd::text, occurred_at
    FROM api_usage_events
    WHERE scan_id = ${scanId}::uuid
    ORDER BY occurred_at ASC
  `) as ApiUsageRow[];
  return rows;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    month: "short",
    day: "2-digit",
  });
}

export default async function ScanDrilldown({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scanId)) {
    notFound();
  }

  const [scan, events, usage] = await Promise.all([
    loadScan(scanId),
    getEventsForScan(scanId),
    loadApiUsage(scanId),
  ]);

  if (!scan) notFound();

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/admin/monitor"
          className="text-xs text-blue-600 hover:underline"
        >
          ← back to monitor
        </Link>
        <header className="mb-8 mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Scan
          </p>
          <h1 className="mt-2 break-all font-mono text-lg text-zinc-900 sm:text-xl">
            {scan.id}
          </h1>
          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Field label="URL" value={scan.url} mono />
            <Field label="Status" value={scan.status} />
            <Field label="Email" value={scan.email} mono />
            <Field label="Business" value={scan.business_name ?? "-"} />
            <Field label="Created" value={formatTime(scan.created_at)} />
            <Field
              label="Completed"
              value={scan.completed_at ? formatTime(scan.completed_at) : "-"}
            />
            {scan.error_message ? (
              <Field label="Error" value={scan.error_message} mono full />
            ) : null}
          </dl>
        </header>

        <Section title={`Monitoring events (${events.length})`}>
          <EventTable rows={events} />
        </Section>

        <Section title={`API usage (${usage.length})`}>
          <UsageTable rows={usage} />
        </Section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  full,
}: {
  label: string;
  value: string;
  mono?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "mt-1 break-all font-mono text-xs text-zinc-900"
            : "mt-1 text-sm text-zinc-900"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function EventTable({ rows }: { rows: MonitoringEventRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No monitoring events recorded for this scan.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Time</th>
            <th className="px-3 py-2 font-semibold">Lvl</th>
            <th className="px-3 py-2 font-semibold">Event</th>
            <th className="px-3 py-2 font-semibold">Payload</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const levelClass =
              r.level === "error"
                ? "text-red-600"
                : r.level === "warn"
                  ? "text-amber-600"
                  : "text-emerald-600";
            return (
              <tr key={r.id} className="border-t border-zinc-100">
                <td className="px-3 py-2 font-mono text-xs text-zinc-500">
                  {formatTime(r.created_at)}
                </td>
                <td className={`px-3 py-2 ${levelClass}`}>{r.level}</td>
                <td className="px-3 py-2 font-mono text-xs text-zinc-900">
                  {r.event}
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-zinc-500">
                  {Object.keys(r.payload).length === 0
                    ? "-"
                    : JSON.stringify(r.payload)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UsageTable({ rows }: { rows: ApiUsageRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No outbound API calls recorded for this scan.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">Time</th>
            <th className="px-3 py-2 font-semibold">Provider</th>
            <th className="px-3 py-2 font-semibold">Operation</th>
            <th className="px-3 py-2 text-right font-semibold">Status</th>
            <th className="px-3 py-2 text-right font-semibold">Attempt</th>
            <th className="px-3 py-2 text-right font-semibold">Duration</th>
            <th className="px-3 py-2 text-right font-semibold">Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const usd = Number(r.cost_usd);
            const statusClass =
              r.status === "ok"
                ? "text-emerald-600"
                : r.status === "retry"
                  ? "text-amber-600"
                  : "text-red-600";
            return (
              <tr key={r.id} className="border-t border-zinc-100">
                <td className="px-3 py-2 font-mono text-xs text-zinc-500">
                  {formatTime(r.occurred_at)}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-zinc-900">
                  {r.provider}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-zinc-900">
                  {r.operation}
                </td>
                <td
                  className={`px-3 py-2 text-right text-xs ${statusClass}`}
                >
                  {r.status}
                </td>
                <td className="px-3 py-2 text-right text-xs text-zinc-700">
                  {r.attempt}
                </td>
                <td className="px-3 py-2 text-right text-xs text-zinc-500">
                  {r.duration_ms !== null ? `${r.duration_ms}ms` : "-"}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-zinc-900">
                  {Number.isFinite(usd) && usd > 0
                    ? new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: usd < 1 ? 4 : 2,
                        maximumFractionDigits: usd < 1 ? 4 : 2,
                      }).format(usd)
                    : "-"}
                </td>
              </tr>
            );
          })}
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
