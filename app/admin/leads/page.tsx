import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import PageHeader from "../PageHeader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Leads",
  robots: { index: false, follow: false, nocache: true },
};

const PAGE_SIZE = 50;

type LeadRow = {
  id: string;
  email: string;
  business_name: string | null;
  url: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  scan_count: number;
  last_scan_at: string | null;
  created_at: string;
  unsubscribed_at: string | null;
  scan_id: string | null;
};

type ContactRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  budget: string;
  project_type: string;
  message: string;
  resend_id: string | null;
  ip: string | null;
  created_at: string;
};

type Counts = {
  totalLeads: number;
  unsubscribedLeads: number;
  totalContacts: number;
  contacts7d: number;
};

function parseSearch(raw: Record<string, string | string[] | undefined>): {
  tab: "scans" | "contact";
  q: string;
  page: number;
} {
  const get = (k: string) => {
    const v = raw[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const tab = get("tab") === "contact" ? "contact" : "scans";
  const pageRaw = Number.parseInt(get("page") ?? "1", 10);
  return {
    tab,
    q: (get("q") ?? "").slice(0, 200),
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
  };
}

async function loadCounts(): Promise<Counts> {
  const sql = getDb();
  const [leadCount, unsubCount, contactCount, contact7d] = (await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM leads`,
    sql`SELECT COUNT(*)::int AS n FROM leads WHERE unsubscribed_at IS NOT NULL`,
    sql`SELECT COUNT(*)::int AS n FROM contact_submissions`,
    sql`SELECT COUNT(*)::int AS n FROM contact_submissions WHERE created_at > now() - interval '7 days'`,
  ])) as { n: number }[][];
  return {
    totalLeads: Number(leadCount[0]?.n ?? 0),
    unsubscribedLeads: Number(unsubCount[0]?.n ?? 0),
    totalContacts: Number(contactCount[0]?.n ?? 0),
    contacts7d: Number(contact7d[0]?.n ?? 0),
  };
}

async function loadLeads(
  filters: ReturnType<typeof parseSearch>
): Promise<{ rows: LeadRow[]; total: number }> {
  const sql = getDb();
  const q = filters.q.trim().length > 0 ? filters.q.trim() : null;
  const limit = PAGE_SIZE;
  const offset = (filters.page - 1) * PAGE_SIZE;

  const rows = (await sql`
    SELECT
      id::text,
      email,
      business_name,
      url,
      industry,
      city,
      state,
      scan_count,
      last_scan_at,
      created_at,
      unsubscribed_at,
      scan_id::text
    FROM leads
    WHERE
      (${q}::text IS NULL
        OR email ILIKE '%' || ${q} || '%'
        OR COALESCE(url, '') ILIKE '%' || ${q} || '%'
        OR COALESCE(business_name, '') ILIKE '%' || ${q} || '%')
    ORDER BY last_scan_at DESC NULLS LAST, created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as LeadRow[];

  const totalRows = (await sql`
    SELECT COUNT(*)::int AS n FROM leads
    WHERE
      (${q}::text IS NULL
        OR email ILIKE '%' || ${q} || '%'
        OR COALESCE(url, '') ILIKE '%' || ${q} || '%'
        OR COALESCE(business_name, '') ILIKE '%' || ${q} || '%')
  `) as { n: number }[];

  return { rows, total: Number(totalRows[0]?.n ?? 0) };
}

async function loadContacts(
  filters: ReturnType<typeof parseSearch>
): Promise<{ rows: ContactRow[]; total: number }> {
  const sql = getDb();
  const q = filters.q.trim().length > 0 ? filters.q.trim() : null;
  const limit = PAGE_SIZE;
  const offset = (filters.page - 1) * PAGE_SIZE;

  const rows = (await sql`
    SELECT
      id::text,
      name,
      email,
      phone,
      company,
      budget,
      project_type,
      message,
      resend_id,
      ip,
      created_at
    FROM contact_submissions
    WHERE
      (${q}::text IS NULL
        OR email ILIKE '%' || ${q} || '%'
        OR name ILIKE '%' || ${q} || '%'
        OR COALESCE(company, '') ILIKE '%' || ${q} || '%'
        OR project_type ILIKE '%' || ${q} || '%')
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as ContactRow[];

  const totalRows = (await sql`
    SELECT COUNT(*)::int AS n FROM contact_submissions
    WHERE
      (${q}::text IS NULL
        OR email ILIKE '%' || ${q} || '%'
        OR name ILIKE '%' || ${q} || '%'
        OR COALESCE(company, '') ILIKE '%' || ${q} || '%'
        OR project_type ILIKE '%' || ${q} || '%')
  `) as { n: number }[];

  return { rows, total: Number(totalRows[0]?.n ?? 0) };
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildHref(
  filters: ReturnType<typeof parseSearch>,
  overrides: Partial<{ tab: "scans" | "contact"; page: number; q: string }>
): string {
  const params = new URLSearchParams();
  const tab = overrides.tab ?? filters.tab;
  const q = overrides.q ?? filters.q;
  const page = overrides.page ?? 1;
  if (tab !== "scans") params.set("tab", tab);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/leads?${qs}` : "/admin/leads";
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const filters = parseSearch(raw);

  const [counts, leads, contacts] = await Promise.all([
    loadCounts(),
    filters.tab === "scans" ? loadLeads(filters) : Promise.resolve({ rows: [], total: 0 }),
    filters.tab === "contact" ? loadContacts(filters) : Promise.resolve({ rows: [], total: 0 }),
  ]);

  const total = filters.tab === "scans" ? leads.total : contacts.total;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          palette="blue"
          section="Today"
          pageName="Leads"
          description="Pathlight scan signups and contact-form inquiries side by side. Resend remains the canonical delivery path; this view is the durable record."
        />

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total scan leads" value={formatNumber(counts.totalLeads)} />
          <Stat
            label="Unsubscribed"
            value={formatNumber(counts.unsubscribedLeads)}
            tone="muted"
          />
          <Stat
            label="Contact submissions"
            value={formatNumber(counts.totalContacts)}
          />
          <Stat
            label="Contacts (7d)"
            value={formatNumber(counts.contacts7d)}
            tone="accent"
          />
        </section>

        <Tabs filters={filters} counts={counts} />

        <SearchBar filters={filters} />

        <div className="mt-4 mb-3 text-xs text-zinc-500">
          {formatNumber(total)} {filters.tab === "scans" ? "lead" : "submission"}
          {total === 1 ? "" : "s"} matched
          {filters.page > 1 ? ` (page ${filters.page} of ${totalPages})` : ""}
        </div>

        {filters.tab === "scans" ? (
          <LeadsTable rows={leads.rows} />
        ) : (
          <ContactsTable rows={contacts.rows} />
        )}

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
  tone?: "default" | "muted" | "accent";
}) {
  const valueClass =
    tone === "muted"
      ? "text-zinc-500"
      : tone === "accent"
        ? "text-emerald-700"
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

function Tabs({
  filters,
  counts,
}: {
  filters: ReturnType<typeof parseSearch>;
  counts: Counts;
}) {
  return (
    <div className="mb-3 flex gap-1 border-b border-zinc-200">
      <TabLink
        href={buildHref(filters, { tab: "scans", q: "", page: 1 })}
        active={filters.tab === "scans"}
        label={`Pathlight signups (${formatNumber(counts.totalLeads)})`}
      />
      <TabLink
        href={buildHref(filters, { tab: "contact", q: "", page: 1 })}
        active={filters.tab === "contact"}
        label={`Contact form (${formatNumber(counts.totalContacts)})`}
      />
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={
        "border-b-2 px-4 py-2 text-sm font-medium transition-colors " +
        (active
          ? "border-zinc-900 text-zinc-900"
          : "border-transparent text-zinc-500 hover:text-zinc-900")
      }
    >
      {label}
    </Link>
  );
}

function SearchBar({ filters }: { filters: ReturnType<typeof parseSearch> }) {
  return (
    <form
      method="get"
      action="/admin/leads"
      className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4"
    >
      <input type="hidden" name="tab" value={filters.tab} />
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Search
        </span>
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder={
            filters.tab === "scans"
              ? "Email, URL, business name"
              : "Email, name, company, project type"
          }
          className="w-72 rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Apply
        </button>
        <Link
          href={buildHref(filters, { q: "", page: 1 })}
          className="rounded-md border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Clear
        </Link>
      </div>
    </form>
  );
}

function LeadsTable({ rows }: { rows: LeadRow[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <table className="canopy-table w-full min-w-[800px] text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Site</th>
              <th className="px-4 py-3 font-semibold">Industry / City</th>
              <th className="px-4 py-3 text-right font-semibold">Scans</th>
              <th className="px-4 py-3 font-semibold">Last scan</th>
              <th className="px-4 py-3 font-semibold">First seen</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  No leads match this search.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-900">
                    {row.email}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900">
                      {row.business_name ?? hostname(row.url ?? "")}
                    </div>
                    <div className="font-mono text-[11px] text-zinc-500">
                      {row.url ?? "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600">
                    <div>{row.industry ?? "-"}</div>
                    <div className="text-zinc-500">
                      {[row.city, row.state].filter(Boolean).join(", ") || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-900">
                    {row.scan_count}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600">
                    {formatDate(row.last_scan_at)}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {row.unsubscribed_at ? (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-600/20">
                        unsubscribed
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        active
                      </span>
                    )}
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

function ContactsTable({ rows }: { rows: ContactRow[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <table className="canopy-table w-full min-w-[900px] text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 font-semibold">Submitted</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email / Company</th>
              <th className="px-4 py-3 font-semibold">Project type</th>
              <th className="px-4 py-3 font-semibold">Budget</th>
              <th className="px-4 py-3 font-semibold">Message</th>
              <th className="px-4 py-3 font-semibold">Delivery</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  No contact-form submissions match this search.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-zinc-100 align-top">
                  <td className="px-4 py-3 text-xs text-zinc-600">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {row.name}
                    {row.phone ? (
                      <div className="font-mono text-[11px] text-zinc-500">
                        {row.phone}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <a
                      href={`mailto:${row.email}`}
                      className="text-blue-700 hover:underline"
                    >
                      {row.email}
                    </a>
                    {row.company ? (
                      <div className="text-zinc-500">{row.company}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-700">
                    {row.project_type}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-700">
                    {row.budget}
                  </td>
                  <td className="px-4 py-3 max-w-md">
                    <details>
                      <summary className="cursor-pointer text-xs text-zinc-600 hover:text-zinc-900">
                        {row.message.slice(0, 80)}
                        {row.message.length > 80 ? "..." : ""}
                      </summary>
                      <div className="mt-2 whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-xs text-zinc-800">
                        {row.message}
                      </div>
                    </details>
                  </td>
                  <td className="px-4 py-3">
                    {row.resend_id ? (
                      <span
                        className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                        title={row.resend_id}
                      >
                        sent
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        no resend id
                      </span>
                    )}
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

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url || "-";
  }
}
