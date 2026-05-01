import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import PageHeader from "../PageHeader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Scans",
  robots: { index: false, follow: false, nocache: true },
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "scanning", label: "Scanning" },
  { value: "analyzing", label: "Analyzing" },
  { value: "complete", label: "Complete" },
  { value: "partial", label: "Partial" },
  { value: "failed", label: "Failed" },
] as const;

const SINCE_OPTIONS = [
  { value: "", label: "All time", interval: null as string | null },
  { value: "24h", label: "Last 24 hours", interval: "1 day" },
  { value: "7d", label: "Last 7 days", interval: "7 days" },
  { value: "30d", label: "Last 30 days", interval: "30 days" },
  { value: "90d", label: "Last 90 days", interval: "90 days" },
] as const;

const REVENUE_OPTIONS = [
  { value: "", label: "Any revenue" },
  { value: "0-1k", label: "$0 to $1k/mo", min: 0, max: 1000 },
  { value: "1k-5k", label: "$1k to $5k/mo", min: 1000, max: 5000 },
  { value: "5k-10k", label: "$5k to $10k/mo", min: 5000, max: 10000 },
  { value: "10k+", label: "$10k+/mo", min: 10000, max: null },
  { value: "none", label: "No revenue computed", min: null, max: null },
] as const;

const PAGE_SIZE = 50;

type ScanRow = {
  id: string;
  url: string;
  resolved_url: string | null;
  email: string;
  business_name: string | null;
  status: string;
  error_message: string | null;
  scan_duration_ms: number | null;
  created_at: string;
  completed_at: string | null;
  pathlight_score: number | null;
  monthly_loss: number | null;
};

function parseSearch(raw: Record<string, string | string[] | undefined>): {
  status: string;
  since: string;
  revenue: string;
  q: string;
  page: number;
} {
  const get = (k: string) => {
    const v = raw[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const pageRaw = Number.parseInt(get("page") ?? "1", 10);
  return {
    status: STATUS_OPTIONS.some((o) => o.value === get("status"))
      ? (get("status") as string)
      : "",
    since: SINCE_OPTIONS.some((o) => o.value === get("since"))
      ? (get("since") as string)
      : "",
    revenue: REVENUE_OPTIONS.some((o) => o.value === get("revenue"))
      ? (get("revenue") as string)
      : "",
    q: (get("q") ?? "").slice(0, 200),
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
  };
}

async function loadScans(filters: ReturnType<typeof parseSearch>): Promise<{
  rows: ScanRow[];
  total: number;
}> {
  const sql = getDb();
  const status = filters.status || null;
  const interval =
    SINCE_OPTIONS.find((o) => o.value === filters.since)?.interval ?? null;
  const q = filters.q.trim().length > 0 ? filters.q.trim() : null;
  const revenueOption = REVENUE_OPTIONS.find((o) => o.value === filters.revenue);
  const min =
    revenueOption && "min" in revenueOption ? revenueOption.min ?? null : null;
  const max =
    revenueOption && "max" in revenueOption ? revenueOption.max ?? null : null;
  const noneRevenue = filters.revenue === "none";
  const limit = PAGE_SIZE;
  const offset = (filters.page - 1) * PAGE_SIZE;

  const rows = (await sql`
    SELECT
      s.id::text,
      s.url,
      s.resolved_url,
      s.email,
      s.business_name,
      s.status,
      s.error_message,
      s.scan_duration_ms,
      s.created_at,
      s.completed_at,
      sr.pathlight_score,
      CASE
        WHEN sr.revenue_impact ? 'estimatedMonthlyLoss'
          THEN (sr.revenue_impact->>'estimatedMonthlyLoss')::numeric
        ELSE NULL
      END AS monthly_loss
    FROM scans s
    LEFT JOIN scan_results sr ON sr.scan_id = s.id
    WHERE
      (${status}::text IS NULL OR s.status = ${status})
      AND (${interval}::text IS NULL OR s.created_at > now() - (${interval})::interval)
      AND (
        ${q}::text IS NULL
        OR s.url ILIKE '%' || ${q} || '%'
        OR s.email ILIKE '%' || ${q} || '%'
        OR COALESCE(s.business_name, '') ILIKE '%' || ${q} || '%'
      )
      AND (
        ${noneRevenue}
          AND (sr.revenue_impact IS NULL OR NOT (sr.revenue_impact ? 'estimatedMonthlyLoss'))
        OR NOT ${noneRevenue}
      )
      AND (
        ${min}::numeric IS NULL
        OR (sr.revenue_impact ? 'estimatedMonthlyLoss'
            AND (sr.revenue_impact->>'estimatedMonthlyLoss')::numeric >= ${min})
      )
      AND (
        ${max}::numeric IS NULL
        OR (sr.revenue_impact ? 'estimatedMonthlyLoss'
            AND (sr.revenue_impact->>'estimatedMonthlyLoss')::numeric < ${max})
      )
    ORDER BY s.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as ScanRow[];

  const totalRows = (await sql`
    SELECT COUNT(*)::int AS n
    FROM scans s
    LEFT JOIN scan_results sr ON sr.scan_id = s.id
    WHERE
      (${status}::text IS NULL OR s.status = ${status})
      AND (${interval}::text IS NULL OR s.created_at > now() - (${interval})::interval)
      AND (
        ${q}::text IS NULL
        OR s.url ILIKE '%' || ${q} || '%'
        OR s.email ILIKE '%' || ${q} || '%'
        OR COALESCE(s.business_name, '') ILIKE '%' || ${q} || '%'
      )
      AND (
        ${noneRevenue}
          AND (sr.revenue_impact IS NULL OR NOT (sr.revenue_impact ? 'estimatedMonthlyLoss'))
        OR NOT ${noneRevenue}
      )
      AND (
        ${min}::numeric IS NULL
        OR (sr.revenue_impact ? 'estimatedMonthlyLoss'
            AND (sr.revenue_impact->>'estimatedMonthlyLoss')::numeric >= ${min})
      )
      AND (
        ${max}::numeric IS NULL
        OR (sr.revenue_impact ? 'estimatedMonthlyLoss'
            AND (sr.revenue_impact->>'estimatedMonthlyLoss')::numeric < ${max})
      )
  `) as { n: number }[];

  return {
    rows,
    total: Number(totalRows[0]?.n ?? 0),
  };
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatUsd(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return "-";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function statusBadge(status: string): { className: string; label: string } {
  const map: Record<string, { className: string; label: string }> = {
    complete: { className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", label: "complete" },
    partial: { className: "bg-amber-50 text-amber-700 ring-amber-600/20", label: "partial" },
    failed: { className: "bg-red-50 text-red-700 ring-red-600/20", label: "failed" },
    pending: { className: "bg-zinc-100 text-zinc-700 ring-zinc-600/20", label: "pending" },
    scanning: { className: "bg-blue-50 text-blue-700 ring-blue-600/20", label: "scanning" },
    analyzing: { className: "bg-violet-50 text-violet-700 ring-violet-600/20", label: "analyzing" },
  };
  return (
    map[status] ?? {
      className: "bg-zinc-100 text-zinc-700 ring-zinc-600/20",
      label: status,
    }
  );
}

function scoreClass(n: number | null): string {
  if (n === null) return "text-zinc-400";
  if (n >= 90) return "text-emerald-600";
  if (n >= 75) return "text-amber-600";
  return "text-red-600";
}

function buildHref(filters: ReturnType<typeof parseSearch>, page: number): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.since) params.set("since", filters.since);
  if (filters.revenue) params.set("revenue", filters.revenue);
  if (filters.q) params.set("q", filters.q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/scans?${qs}` : "/admin/scans";
}

export default async function AdminScansPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const filters = parseSearch(raw);
  const { rows, total } = await loadScans(filters);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          palette="teal"
          section="Today"
          pageName="Scans"
          description="Every Pathlight scan with status, score, and computed monthly revenue impact. Click a row to drill into its event timeline."
        />

        <FilterBar filters={filters} />

        <div className="mt-4 mb-3 text-xs text-zinc-500">
          {formatNumber(total)} scan{total === 1 ? "" : "s"} matched
          {filters.page > 1 ? ` (page ${filters.page} of ${totalPages})` : ""}
        </div>

        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="canopy-table w-full min-w-[900px] text-sm">
              <thead className="bg-zinc-50">
                <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Site</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Score</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Monthly loss
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Duration
                  </th>
                  <th className="px-4 py-3 font-semibold">Drill in</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-sm text-zinc-500"
                    >
                      No scans match these filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const badge = statusBadge(row.status);
                    return (
                      <tr key={row.id} className="border-t border-zinc-100">
                        <td className="px-4 py-3 text-xs text-zinc-600">
                          {formatDate(row.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-900">
                            {row.business_name ?? hostname(row.url)}
                          </div>
                          <div className="font-mono text-[11px] text-zinc-500">
                            {row.url}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                          {row.email}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          {row.error_message ? (
                            <div
                              className="mt-1 max-w-xs truncate text-[11px] text-red-600"
                              title={row.error_message}
                            >
                              {row.error_message}
                            </div>
                          ) : null}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono ${scoreClass(row.pathlight_score)}`}
                        >
                          {row.pathlight_score ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-900">
                          {formatUsd(
                            row.monthly_loss !== null
                              ? Number(row.monthly_loss)
                              : null
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-zinc-500">
                          {formatDuration(row.scan_duration_ms)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 text-xs">
                            <Link
                              href={`/pathlight/${row.id}`}
                              className="text-blue-700 hover:underline"
                              target="_blank"
                            >
                              Report
                            </Link>
                            <Link
                              href={`/admin/monitor/scan/${row.id}`}
                              className="text-zinc-600 hover:underline"
                            >
                              Events
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <Pagination filters={filters} totalPages={totalPages} />
      </div>
    </div>
  );
}

function FilterBar({ filters }: { filters: ReturnType<typeof parseSearch> }) {
  return (
    <form
      method="get"
      action="/admin/scans"
      className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4"
    >
      <Field label="Search">
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="URL, email, business name"
          className="w-56 rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </Field>
      <Field label="Status">
        <select
          name="status"
          defaultValue={filters.status}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Time">
        <select
          name="since"
          defaultValue={filters.since}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
        >
          {SINCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Revenue">
        <select
          name="revenue"
          defaultValue={filters.revenue}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
        >
          {REVENUE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Apply
        </button>
        <Link
          href="/admin/scans"
          className="rounded-md border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Clear
        </Link>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function Pagination({
  filters,
  totalPages,
}: {
  filters: ReturnType<typeof parseSearch>;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const prev = Math.max(1, filters.page - 1);
  const next = Math.min(totalPages, filters.page + 1);
  return (
    <nav className="mt-4 flex items-center justify-between text-sm">
      <Link
        href={buildHref(filters, prev)}
        className={
          filters.page <= 1
            ? "pointer-events-none text-zinc-300"
            : "text-zinc-700 hover:underline"
        }
      >
        ← Prev
      </Link>
      <span className="text-xs text-zinc-500">
        Page {filters.page} of {totalPages}
      </span>
      <Link
        href={buildHref(filters, next)}
        className={
          filters.page >= totalPages
            ? "pointer-events-none text-zinc-300"
            : "text-zinc-700 hover:underline"
        }
      >
        Next →
      </Link>
    </nav>
  );
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
