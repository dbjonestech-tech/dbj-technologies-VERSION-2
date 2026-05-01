"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Mail,
  Phone,
  Search,
  X,
} from "lucide-react";
import type { RecentVisitorRow } from "@/lib/services/analytics";

type FilterChip = "all" | "anonymous" | "self-disclosed" | "converted" | "mobile" | "desktop";

/* Expandable per-visitor table for /admin/visitors. Each row collapses
 * one person's full activity into a single line. Click a row to fetch
 * /admin/visitors/api/timeline?vid=<uuid> and render the full
 * chronological page-view list grouped by session. The fetch is lazy
 * so opening the page does not pay for 25 timelines up-front. */

type TimelineEntry = {
  id: string;
  sessionId: string;
  path: string;
  query: string | null;
  referrerHost: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  country: string | null;
  city: string | null;
  deviceType: string | null;
  browser: string | null;
  createdAt: string;
  dwellMs: number | null;
  scrollPct: number | null;
  scanId: string | null;
  contactSubmissionId: string | null;
};

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function formatTimeOfDay(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDwell(ms: number | null): string {
  if (ms === null || ms === undefined) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

function shortVisitorId(vid: string): string {
  return vid.slice(0, 8);
}

function geoLabel(row: { city: string | null; region: string | null; country: string | null }): string {
  return [row.city, row.region, row.country].filter(Boolean).join(", ") || "-";
}

function deviceLabel(row: { browser: string | null; deviceType: string | null }): string {
  return [row.browser, row.deviceType].filter(Boolean).join(" / ") || "-";
}

function sourceLabel(row: RecentVisitorRow): string {
  if (row.utmSource) {
    const parts = [row.utmSource, row.utmMedium].filter(Boolean).join(" / ");
    return row.utmCampaign ? `${parts} (${row.utmCampaign})` : parts;
  }
  return row.referrerHost ?? "(direct)";
}

/**
 * Build a display name for a visitor. Returns the most specific
 * identity we have: contact-form name > scan business > scan email >
 * contact email > short visitor id. Always includes a privacy
 * indicator for the source of the identity.
 */
function identitySummary(row: RecentVisitorRow): {
  primary: string;
  secondary: string | null;
  source: "contact" | "scan" | "anonymous";
} {
  if (row.contactName || row.contactCompany) {
    const primary = row.contactName ?? row.contactCompany ?? "Unknown";
    const secondary =
      row.contactCompany && row.contactName
        ? row.contactCompany
        : row.contactEmail ?? null;
    return { primary, secondary, source: "contact" };
  }
  if (row.scanBusinessName || row.scanEmail) {
    const primary = row.scanBusinessName ?? row.scanEmail ?? "Unknown";
    const secondary = row.scanBusinessName ? row.scanEmail : row.scanUrl;
    return { primary, secondary, source: "scan" };
  }
  return {
    primary: `Anonymous · ${shortVisitorId(row.visitorId)}`,
    secondary: null,
    source: "anonymous",
  };
}

function conversionBadge(row: RecentVisitorRow): React.ReactNode {
  if (row.convertedContact) {
    return (
      <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-700 ring-1 ring-violet-200">
        contact
      </span>
    );
  }
  if (row.convertedScan) {
    return (
      <span className="inline-flex items-center rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-700 ring-1 ring-cyan-200">
        scan
      </span>
    );
  }
  return null;
}

/**
 * RFC 4180 compliant CSV cell escape. Wraps any value containing a
 * comma, double-quote, CR, or LF in double quotes; escapes inner
 * double quotes by doubling. Numbers and booleans are coerced to
 * string. null/undefined render as empty cell.
 */
function csvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const CSV_COLUMNS = [
  "visitor_id",
  "name",
  "email",
  "company",
  "phone",
  "website",
  "sessions",
  "page_views",
  "top_path",
  "entry_path",
  "exit_path",
  "source",
  "utm_campaign",
  "city",
  "region",
  "country",
  "device",
  "browser",
  "os",
  "first_seen",
  "last_seen",
  "converted_scan",
  "converted_contact",
] as const;

function rowsToCsv(rows: RecentVisitorRow[]): string {
  const lines: string[] = [CSV_COLUMNS.join(",")];
  for (const r of rows) {
    const id = identitySummary(r);
    const name = r.contactName ?? (id.source === "scan" ? r.scanBusinessName : null);
    const email = r.contactEmail ?? r.scanEmail;
    const company = r.contactCompany ?? r.scanBusinessName;
    const cells: (string | number | boolean | null | undefined)[] = [
      r.visitorId,
      name,
      email,
      company,
      r.contactPhone,
      r.scanUrl,
      r.sessionCount,
      r.pageViewCount,
      r.topPath,
      r.entryPath,
      r.exitPath,
      r.utmSource ?? r.referrerHost ?? "(direct)",
      r.utmCampaign,
      r.city,
      r.region,
      r.country,
      r.deviceType,
      r.browser,
      r.os,
      r.firstSeenAt,
      r.lastSeenAt,
      r.convertedScan,
      r.convertedContact,
    ];
    lines.push(cells.map(csvCell).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}

function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function timestampSlug(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}-${hh}${mi}`;
}

function rowMatchesQuery(row: RecentVisitorRow, q: string): boolean {
  if (!q) return true;
  const haystack = [
    row.visitorId,
    row.contactName,
    row.contactEmail,
    row.contactCompany,
    row.scanEmail,
    row.scanBusinessName,
    row.scanUrl,
    row.city,
    row.region,
    row.country,
    row.referrerHost,
    row.utmSource,
    row.utmCampaign,
    row.topPath,
    row.entryPath,
  ]
    .filter((v): v is string => Boolean(v))
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function rowMatchesChip(row: RecentVisitorRow, chip: FilterChip): boolean {
  if (chip === "all") return true;
  if (chip === "anonymous") {
    return !row.contactName && !row.contactEmail && !row.scanEmail && !row.scanBusinessName;
  }
  if (chip === "self-disclosed") {
    return Boolean(row.contactName || row.contactEmail || row.scanEmail || row.scanBusinessName);
  }
  if (chip === "converted") return row.convertedScan || row.convertedContact;
  if (chip === "mobile") return row.deviceType === "mobile";
  if (chip === "desktop") return row.deviceType === "desktop";
  return true;
}

export type RecentVisitorsTableProps = {
  rows: RecentVisitorRow[];
  enableSearch?: boolean;
  enableFilters?: boolean;
  enableCsvExport?: boolean;
  /**
   * Slug folded into the CSV filename so an export from /admin/recurring
   * is distinguishable from one off /admin/visitors. Defaults to
   * "visitors".
   */
  exportSlug?: string;
};

export default function RecentVisitorsTable({
  rows,
  enableSearch = false,
  enableFilters = false,
  enableCsvExport = false,
  exportSlug = "visitors",
}: RecentVisitorsTableProps) {
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<FilterChip>("all");

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => rowMatchesQuery(r, q) && rowMatchesChip(r, chip));
  }, [rows, query, chip]);

  const handleExport = () => {
    const csv = rowsToCsv(filteredRows);
    const chipSlug = chip === "all" ? "" : `-${chip}`;
    downloadCsv(csv, `canopy-${exportSlug}-${timestampSlug()}${chipSlug}.csv`);
  };

  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">No visitors yet.</p>;
  }
  return (
    <div>
      {(enableSearch || enableFilters) && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {enableSearch ? (
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email, city, business..."
                className="w-full rounded-md border border-zinc-200 bg-white py-1.5 pl-9 pr-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            {enableFilters
              ? (
                  [
                    { id: "all", label: "All" },
                    { id: "self-disclosed", label: "Self-disclosed" },
                    { id: "anonymous", label: "Anonymous" },
                    { id: "converted", label: "Converted" },
                    { id: "mobile", label: "Mobile" },
                    { id: "desktop", label: "Desktop" },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChip(c.id)}
                    className={
                      chip === c.id
                        ? "rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-semibold text-white transition-colors"
                        : "rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-200"
                    }
                  >
                    {c.label}
                  </button>
                ))
              : null}
            {enableCsvExport ? (
              <button
                type="button"
                onClick={handleExport}
                disabled={filteredRows.length === 0}
                className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Export filtered rows as CSV"
              >
                <Download className="h-3 w-3" aria-hidden="true" />
                Export CSV ({filteredRows.length})
              </button>
            ) : null}
          </div>
        </div>
      )}
      {filteredRows.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {query || chip !== "all"
            ? "No visitors match the current filter."
            : "No visitors yet."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="canopy-table w-full min-w-[920px] text-sm">
            <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
              <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2 font-semibold w-6"></th>
                <th className="px-3 py-2 font-semibold">Visitor</th>
                <th className="px-3 py-2 font-semibold">Source</th>
                <th className="px-3 py-2 font-semibold">Geo</th>
                <th className="px-3 py-2 font-semibold">Device</th>
                <th className="px-3 py-2 text-right font-semibold">Sessions</th>
                <th className="px-3 py-2 text-right font-semibold">Pages</th>
                <th className="px-3 py-2 text-right font-semibold">Last seen</th>
                <th className="px-3 py-2 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, idx) => (
                <VisitorRow key={row.visitorId} row={row} index={idx} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function VisitorRow({ row, index }: { row: RecentVisitorRow; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  const id = identitySummary(row);
  const isEven = index % 2 === 1; /* Stripe every-other visitor row.
   * Using "1 === odd" because design feels better with the FIRST
   * row plain white (not striped), then second row striped, etc. */

  useEffect(() => {
    if (!expanded || fetchedRef.current) return;
    fetchedRef.current = true;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/admin/visitors/api/timeline?vid=${encodeURIComponent(row.visitorId)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { entries: TimelineEntry[] };
        if (!cancelled) setTimeline(data.entries);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "fetch failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [expanded, row.visitorId]);

  return (
    <>
      <tr
        className={`cursor-pointer border-t border-zinc-100 transition-colors hover:bg-sky-50 ${isEven ? "bg-zinc-100/70" : "bg-white"}`}
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-3 py-3 text-zinc-400" aria-hidden="true">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </td>
        <td className="px-3 py-3">
          <div className="flex flex-col">
            <span
              className={
                id.source === "anonymous"
                  ? "font-mono text-xs text-zinc-700"
                  : "font-semibold text-zinc-900"
              }
            >
              {id.primary}
            </span>
            {id.secondary ? (
              <span className="text-[11px] text-zinc-500">{id.secondary}</span>
            ) : (
              <span className="font-mono text-[10px] text-zinc-400">
                {row.visitorId}
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-3 text-xs text-zinc-700">{sourceLabel(row)}</td>
        <td className="px-3 py-3 text-xs text-zinc-700">{geoLabel(row)}</td>
        <td className="px-3 py-3 text-xs text-zinc-700">{deviceLabel(row)}</td>
        <td className="px-3 py-3 text-right font-mono text-xs text-zinc-900">
          {row.sessionCount}
        </td>
        <td className="px-3 py-3 text-right font-mono text-xs text-zinc-900">
          {row.pageViewCount}
        </td>
        <td className="px-3 py-3 text-right font-mono text-xs text-zinc-500">
          {formatRelative(row.lastSeenAt)}
        </td>
        <td className="px-3 py-3 text-right">{conversionBadge(row)}</td>
      </tr>
      {expanded ? (
        <tr className="border-t border-zinc-100 bg-zinc-50/50">
          <td colSpan={9} className="px-3 py-4">
            <ExpandedDetail
              row={row}
              identity={id}
              timeline={timeline}
              loading={loading}
              error={error}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function ExpandedDetail({
  row,
  identity,
  timeline,
  loading,
  error,
}: {
  row: RecentVisitorRow;
  identity: ReturnType<typeof identitySummary>;
  timeline: TimelineEntry[] | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
      <div className="space-y-4">
        <IdentityCard row={row} identity={identity} />
        <FactsCard row={row} />
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h4 className="mb-3 font-display text-sm font-semibold text-zinc-900">
          Page-by-page timeline
        </h4>
        {loading ? (
          <p className="text-xs text-zinc-500">Loading timeline…</p>
        ) : error ? (
          <p className="text-xs text-red-600">Failed to load timeline: {error}</p>
        ) : timeline && timeline.length > 0 ? (
          <Timeline entries={timeline} />
        ) : (
          <p className="text-xs text-zinc-500">No page views recorded.</p>
        )}
      </div>
    </div>
  );
}

function IdentityCard({
  row,
  identity,
}: {
  row: RecentVisitorRow;
  identity: ReturnType<typeof identitySummary>;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h4 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-zinc-900">
        Identity
        {identity.source === "anonymous" ? (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
            anonymous
          </span>
        ) : (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
            self-disclosed
          </span>
        )}
      </h4>
      {identity.source === "anonymous" ? (
        <p className="text-xs leading-relaxed text-zinc-600">
          This visitor has not submitted any form. We only know what
          their browser sent: a random cookie id, approximate geo,
          device, and traffic source. Names and emails appear here only
          when a visitor self-discloses by completing a contact form or
          a Pathlight scan.
        </p>
      ) : (
        <dl className="space-y-2 text-xs">
          {row.contactName ? (
            <Field label="Name" value={row.contactName} />
          ) : null}
          {row.contactEmail || row.scanEmail ? (
            <Field
              label="Email"
              value={row.contactEmail ?? row.scanEmail ?? ""}
              icon={<Mail className="h-3 w-3" />}
              href={`mailto:${row.contactEmail ?? row.scanEmail}`}
            />
          ) : null}
          {row.contactPhone ? (
            <Field
              label="Phone"
              value={row.contactPhone}
              icon={<Phone className="h-3 w-3" />}
              href={`tel:${row.contactPhone}`}
            />
          ) : null}
          {row.contactCompany || row.scanBusinessName ? (
            <Field
              label="Company"
              value={row.contactCompany ?? row.scanBusinessName ?? ""}
            />
          ) : null}
          {row.scanUrl ? (
            <Field
              label="Website"
              value={row.scanUrl}
              icon={<ExternalLink className="h-3 w-3" />}
              href={row.scanUrl.startsWith("http") ? row.scanUrl : `https://${row.scanUrl}`}
              external
            />
          ) : null}
          {row.contactSubmissionId ? (
            <p className="pt-2 text-[10px] text-zinc-500">
              <Link
                href="/admin/leads?tab=contact"
                className="hover:underline"
              >
                View contact submission →
              </Link>
            </p>
          ) : null}
          {row.scanId ? (
            <p className="text-[10px] text-zinc-500">
              <Link
                href={`/admin/scans?id=${row.scanId}`}
                className="hover:underline"
              >
                View Pathlight scan →
              </Link>
            </p>
          ) : null}
        </dl>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  icon,
  href,
  external,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  href?: string;
  external?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="w-16 shrink-0 text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </dt>
      <dd className="flex items-baseline gap-1.5 text-zinc-900">
        {icon ? <span className="self-center text-zinc-500">{icon}</span> : null}
        {href ? (
          <a
            href={href}
            className="hover:underline"
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
          >
            {value}
          </a>
        ) : (
          <span>{value}</span>
        )}
      </dd>
    </div>
  );
}

function FactsCard({ row }: { row: RecentVisitorRow }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h4 className="mb-3 font-display text-sm font-semibold text-zinc-900">
        At a glance
      </h4>
      <dl className="space-y-2 text-xs">
        <Fact label="First seen" value={`${formatTimeOfDay(row.firstSeenAt)} (${formatRelative(row.firstSeenAt)})`} />
        <Fact label="Last seen" value={`${formatTimeOfDay(row.lastSeenAt)} (${formatRelative(row.lastSeenAt)})`} />
        <Fact label="Top page" value={row.topPath ?? "-"} mono />
        <Fact label="Entry path" value={row.entryPath ?? "-"} mono />
        <Fact label="Exit path" value={row.exitPath ?? "-"} mono />
        {row.utmCampaign ? (
          <Fact
            label="Campaign"
            value={[row.utmSource, row.utmMedium, row.utmCampaign].filter(Boolean).join(" / ")}
          />
        ) : null}
        <Fact label="Operating system" value={row.os ?? "-"} />
      </dl>
    </div>
  );
}

function Fact({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="w-24 shrink-0 text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </dt>
      <dd className={mono ? "font-mono text-[11px] text-zinc-900" : "text-zinc-900"}>
        {value}
      </dd>
    </div>
  );
}

function Timeline({ entries }: { entries: TimelineEntry[] }) {
  /* Group consecutive entries by session_id so each session reads
   * as one "visit" with its page views. */
  const groups: { sessionId: string; rows: TimelineEntry[] }[] = [];
  for (const e of entries) {
    const last = groups[groups.length - 1];
    if (last && last.sessionId === e.sessionId) {
      last.rows.push(e);
    } else {
      groups.push({ sessionId: e.sessionId, rows: [e] });
    }
  }
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.sessionId} className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Session · {formatTimeOfDay(g.rows[0]!.createdAt)}
              <span className="ml-2 text-zinc-400">
                ({g.rows.length} page{g.rows.length === 1 ? "" : "s"})
              </span>
            </p>
            <Link
              href={`/admin/visitors/sessions/${g.sessionId}`}
              className="text-[10px] text-cyan-700 hover:underline"
            >
              full session →
            </Link>
          </div>
          <ol className="space-y-1 border-l-2 border-zinc-200 pl-3">
            {g.rows.map((r) => (
              <TimelineRow key={r.id} entry={r} />
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function TimelineRow({ entry }: { entry: TimelineEntry }) {
  const time = new Date(entry.createdAt).toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
  return (
    <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[11px]">
      <span className="text-zinc-400">{time}</span>
      <span className="text-zinc-900">
        {entry.path}
        {entry.query ? <span className="text-zinc-500">{entry.query}</span> : null}
      </span>
      <span className="text-zinc-500">
        dwell {formatDwell(entry.dwellMs)}
      </span>
      <span className="text-zinc-500">
        scroll {entry.scrollPct === null ? "-" : `${entry.scrollPct}%`}
      </span>
      {entry.scanId ? (
        <span className="rounded-full bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-700">
          scan
        </span>
      ) : null}
      {entry.contactSubmissionId ? (
        <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-700">
          contact
        </span>
      ) : null}
    </li>
  );
}
