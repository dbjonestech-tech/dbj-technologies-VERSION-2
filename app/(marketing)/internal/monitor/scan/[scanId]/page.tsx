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
  title: "Internal monitor - scan",
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
  searchParams,
}: {
  params: Promise<{ scanId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const expectedPin = process.env.INTERNAL_ADMIN_PIN;
  if (!expectedPin) notFound();
  const sp = await searchParams;
  const supplied = typeof sp.pin === "string" ? sp.pin : null;
  if (!supplied || supplied !== expectedPin) notFound();

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
    <div
      className="min-h-screen w-full px-6 py-12"
      style={{ backgroundColor: "#06060a", color: "#e7ebf2" }}
    >
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href={`/internal/monitor?pin=${encodeURIComponent(supplied)}`}
          className="text-xs"
          style={{ color: "#60a5fa" }}
        >
          ← back to monitor
        </Link>
        <header className="mt-4 mb-8">
          <p
            className="text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: "#9aa3b2" }}
          >
            Scan
          </p>
          <h1
            className="mt-2 break-all font-mono text-lg sm:text-xl"
            style={{ color: "#e7ebf2" }}
          >
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
              <Field
                label="Error"
                value={scan.error_message}
                mono
                full
              />
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
      <dt
        className="text-[10px] uppercase tracking-wider"
        style={{ color: "#6b7280" }}
      >
        {label}
      </dt>
      <dd
        className={mono ? "mt-1 break-all font-mono text-xs" : "mt-1 text-sm"}
        style={{ color: "#e7ebf2" }}
      >
        {value}
      </dd>
    </div>
  );
}

function EventTable({ rows }: { rows: MonitoringEventRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: "#9aa3b2" }}>
        No monitoring events recorded for this scan.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr
            className="text-left text-xs uppercase tracking-wider"
            style={{ color: "#6b7280" }}
          >
            <th className="px-3 py-2">Time</th>
            <th className="px-3 py-2">Lvl</th>
            <th className="px-3 py-2">Event</th>
            <th className="px-3 py-2">Payload</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const levelColor =
              r.level === "error"
                ? "#fca5a5"
                : r.level === "warn"
                  ? "#fcd34d"
                  : "#86efac";
            return (
              <tr
                key={r.id}
                className="border-t"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                <td
                  className="px-3 py-2 font-mono text-xs"
                  style={{ color: "#9aa3b2" }}
                >
                  {formatTime(r.created_at)}
                </td>
                <td className="px-3 py-2" style={{ color: levelColor }}>
                  {r.level}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{r.event}</td>
                <td
                  className="px-3 py-2 font-mono text-[11px]"
                  style={{ color: "#9aa3b2" }}
                >
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
      <p className="text-sm" style={{ color: "#9aa3b2" }}>
        No outbound API calls recorded for this scan.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr
            className="text-left text-xs uppercase tracking-wider"
            style={{ color: "#6b7280" }}
          >
            <th className="px-3 py-2">Time</th>
            <th className="px-3 py-2">Provider</th>
            <th className="px-3 py-2">Operation</th>
            <th className="px-3 py-2 text-right">Status</th>
            <th className="px-3 py-2 text-right">Attempt</th>
            <th className="px-3 py-2 text-right">Duration</th>
            <th className="px-3 py-2 text-right">Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const usd = Number(r.cost_usd);
            const statusColor =
              r.status === "ok"
                ? "#86efac"
                : r.status === "retry"
                  ? "#fcd34d"
                  : "#fca5a5";
            return (
              <tr
                key={r.id}
                className="border-t"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                <td
                  className="px-3 py-2 font-mono text-xs"
                  style={{ color: "#9aa3b2" }}
                >
                  {formatTime(r.occurred_at)}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{r.provider}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.operation}</td>
                <td
                  className="px-3 py-2 text-right text-xs"
                  style={{ color: statusColor }}
                >
                  {r.status}
                </td>
                <td className="px-3 py-2 text-right text-xs">{r.attempt}</td>
                <td
                  className="px-3 py-2 text-right text-xs"
                  style={{ color: "#9aa3b2" }}
                >
                  {r.duration_ms !== null ? `${r.duration_ms}ms` : "-"}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">
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
    <section
      className="mb-8 rounded-2xl border p-6"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "rgba(10,12,18,0.7)",
      }}
    >
      <h2
        className="mb-4 font-display text-xl font-semibold"
        style={{ color: "#e7ebf2" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
