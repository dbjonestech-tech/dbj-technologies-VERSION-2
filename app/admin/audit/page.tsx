import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import PageHeader from "../PageHeader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Audit log",
  robots: { index: false, follow: false, nocache: true },
};

const EVENT_OPTIONS = [
  { value: "", label: "All events" },
  { value: "signin.attempt", label: "Sign-in attempt" },
  { value: "signin.success", label: "Sign-in success" },
  { value: "signin.denied", label: "Sign-in denied" },
  { value: "signin.rate_limited", label: "Sign-in rate-limited" },
  { value: "signin.error", label: "Sign-in error" },
  { value: "signout", label: "Sign-out" },
  { value: "protected.access", label: "Protected access" },
  { value: "protected.denied", label: "Protected denied" },
  { value: "admin.action", label: "Admin action (invite, revoke, disable)" },
] as const;

const RESULT_OPTIONS = [
  { value: "", label: "Any result" },
  { value: "success", label: "Success" },
  { value: "denied", label: "Denied" },
  { value: "error", label: "Error" },
] as const;

const SINCE_OPTIONS = [
  { value: "", label: "All time", interval: null as string | null },
  { value: "24h", label: "Last 24 hours", interval: "1 day" },
  { value: "7d", label: "Last 7 days", interval: "7 days" },
  { value: "30d", label: "Last 30 days", interval: "30 days" },
] as const;

const PAGE_SIZE = 100;

type AuditRow = {
  id: string;
  email: string | null;
  event: string;
  result: string;
  ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type Counts = {
  total24h: number;
  denied24h: number;
  errors24h: number;
  uniqueEmails24h: number;
};

function parseSearch(raw: Record<string, string | string[] | undefined>): {
  event: string;
  result: string;
  since: string;
  email: string;
  page: number;
} {
  const get = (k: string) => {
    const v = raw[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const pageRaw = Number.parseInt(get("page") ?? "1", 10);
  return {
    event: EVENT_OPTIONS.some((o) => o.value === get("event"))
      ? (get("event") as string)
      : "",
    result: RESULT_OPTIONS.some((o) => o.value === get("result"))
      ? (get("result") as string)
      : "",
    since: SINCE_OPTIONS.some((o) => o.value === get("since"))
      ? (get("since") as string)
      : "",
    email: (get("email") ?? "").slice(0, 320),
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
  };
}

async function loadCounts(): Promise<Counts> {
  const sql = getDb();
  const rows = (await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE result = 'denied')::int AS denied,
      COUNT(*) FILTER (WHERE result = 'error')::int AS errors,
      COUNT(DISTINCT email)::int AS unique_emails
    FROM admin_audit_log
    WHERE created_at > now() - interval '1 day'
  `) as { total: number; denied: number; errors: number; unique_emails: number }[];
  const r = rows[0] ?? { total: 0, denied: 0, errors: 0, unique_emails: 0 };
  return {
    total24h: Number(r.total ?? 0),
    denied24h: Number(r.denied ?? 0),
    errors24h: Number(r.errors ?? 0),
    uniqueEmails24h: Number(r.unique_emails ?? 0),
  };
}

async function loadRows(
  filters: ReturnType<typeof parseSearch>
): Promise<{ rows: AuditRow[]; total: number }> {
  const sql = getDb();
  const event = filters.event || null;
  const result = filters.result || null;
  const interval =
    SINCE_OPTIONS.find((o) => o.value === filters.since)?.interval ?? null;
  const email = filters.email.trim().length > 0 ? filters.email.trim().toLowerCase() : null;
  const limit = PAGE_SIZE;
  const offset = (filters.page - 1) * PAGE_SIZE;

  const rows = (await sql`
    SELECT
      id::text,
      email,
      event,
      result,
      ip,
      user_agent,
      metadata,
      created_at
    FROM admin_audit_log
    WHERE
      (${event}::text IS NULL OR event = ${event})
      AND (${result}::text IS NULL OR result = ${result})
      AND (${interval}::text IS NULL OR created_at > now() - (${interval})::interval)
      AND (${email}::text IS NULL OR email ILIKE '%' || ${email} || '%')
    ORDER BY id DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as AuditRow[];

  const totalRows = (await sql`
    SELECT COUNT(*)::int AS n
    FROM admin_audit_log
    WHERE
      (${event}::text IS NULL OR event = ${event})
      AND (${result}::text IS NULL OR result = ${result})
      AND (${interval}::text IS NULL OR created_at > now() - (${interval})::interval)
      AND (${email}::text IS NULL OR email ILIKE '%' || ${email} || '%')
  `) as { n: number }[];

  return { rows, total: Number(totalRows[0]?.n ?? 0) };
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function resultBadge(result: string): string {
  if (result === "success")
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  if (result === "denied") return "bg-amber-50 text-amber-700 ring-amber-600/20";
  if (result === "error") return "bg-red-50 text-red-700 ring-red-600/20";
  return "bg-zinc-100 text-zinc-700 ring-zinc-600/20";
}

function shortUserAgent(ua: string | null): string {
  if (!ua) return "-";
  if (/Chrome/.test(ua) && !/Edg|OPR/.test(ua)) return "Chrome";
  if (/Firefox/.test(ua)) return "Firefox";
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) return "Safari";
  if (/Edg/.test(ua)) return "Edge";
  return ua.slice(0, 30);
}

function buildHref(
  filters: ReturnType<typeof parseSearch>,
  overrides: Partial<{ page: number }>
): string {
  const params = new URLSearchParams();
  if (filters.event) params.set("event", filters.event);
  if (filters.result) params.set("result", filters.result);
  if (filters.since) params.set("since", filters.since);
  if (filters.email) params.set("email", filters.email);
  const page = overrides.page ?? filters.page;
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/audit?${qs}` : "/admin/audit";
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const filters = parseSearch(raw);
  const [counts, { rows, total }] = await Promise.all([
    loadCounts(),
    loadRows(filters),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          palette="stone"
          section="Operations"
          pageName="Audit log"
          description="Append-only record of admin authentication and protected-route access. Used to spot allowlist denials, rate-limit hits, and new-device sign-ins."
        />

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Events (24h)" value={formatNumber(counts.total24h)} />
          <Stat
            label="Denied (24h)"
            value={formatNumber(counts.denied24h)}
            tone={counts.denied24h > 0 ? "warn" : "default"}
          />
          <Stat
            label="Errors (24h)"
            value={formatNumber(counts.errors24h)}
            tone={counts.errors24h > 0 ? "error" : "default"}
          />
          <Stat
            label="Unique emails (24h)"
            value={formatNumber(counts.uniqueEmails24h)}
          />
        </section>

        <FilterBar filters={filters} />

        <div className="mt-4 mb-3 text-xs text-zinc-500">
          {formatNumber(total)} event{total === 1 ? "" : "s"} matched
          {filters.page > 1 ? ` (page ${filters.page} of ${totalPages})` : ""}
        </div>

        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="canopy-table w-full min-w-[900px] text-sm">
              <thead className="bg-zinc-50">
                <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-semibold">When</th>
                  <th className="px-4 py-3 font-semibold">Event</th>
                  <th className="px-4 py-3 font-semibold">Result</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">IP</th>
                  <th className="px-4 py-3 font-semibold">UA</th>
                  <th className="px-4 py-3 font-semibold">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-zinc-500"
                    >
                      No audit events match these filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const meta = row.metadata ?? {};
                    const hasMeta = Object.keys(meta).length > 0;
                    return (
                      <tr key={row.id} className="border-t border-zinc-100 align-top">
                        <td className="px-4 py-3 text-xs text-zinc-600">
                          {formatDate(row.created_at)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-900">
                          {row.event}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${resultBadge(row.result)}`}
                          >
                            {row.result}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                          {row.email ?? "-"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                          {row.ip ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500">
                          {shortUserAgent(row.user_agent)}
                        </td>
                        <td className="px-4 py-3 max-w-sm">
                          {hasMeta ? (
                            <details>
                              <summary className="cursor-pointer text-xs text-zinc-600 hover:text-zinc-900">
                                {Object.keys(meta).length} field
                                {Object.keys(meta).length === 1 ? "" : "s"}
                              </summary>
                              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-md bg-zinc-50 p-2 text-[11px] text-zinc-800">
                                {JSON.stringify(meta, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-xs text-zinc-400">-</span>
                          )}
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

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warn" | "error";
}) {
  const valueClass =
    tone === "warn"
      ? "text-amber-700"
      : tone === "error"
        ? "text-red-700"
        : "text-zinc-900";
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 font-mono text-2xl font-semibold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function FilterBar({ filters }: { filters: ReturnType<typeof parseSearch> }) {
  return (
    <form
      method="get"
      action="/admin/audit"
      className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4"
    >
      <Field label="Event">
        <select
          name="event"
          defaultValue={filters.event}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
        >
          {EVENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Result">
        <select
          name="result"
          defaultValue={filters.result}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
        >
          {RESULT_OPTIONS.map((o) => (
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
      <Field label="Email">
        <input
          type="search"
          name="email"
          defaultValue={filters.email}
          placeholder="exact or partial"
          className="w-56 rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </Field>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Apply
        </button>
        <Link
          href="/admin/audit"
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
        href={buildHref(filters, { page: prev })}
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
        href={buildHref(filters, { page: next })}
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
