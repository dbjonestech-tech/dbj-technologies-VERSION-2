import type { Metadata } from "next";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Database",
  robots: { index: false, follow: false, nocache: true },
};

/* Hard-coded table catalog. Identifiers are fixed, never user input,
 * so string interpolation into sql.query() is safe here and avoids
 * the awkwardness of building a parameterized query per table. */
const TABLE_CATALOG: {
  table: string;
  timeColumn: string;
  group: "Pathlight" | "Email" | "Telemetry" | "Admin";
  description: string;
}[] = [
  {
    table: "scans",
    timeColumn: "created_at",
    group: "Pathlight",
    description: "Scan submissions: URL, email, status, completion timestamp.",
  },
  {
    table: "scan_results",
    timeColumn: "created_at",
    group: "Pathlight",
    description: "Per-scan analysis JSONB: lighthouse, AI audit, revenue, audio.",
  },
  {
    table: "leads",
    timeColumn: "created_at",
    group: "Pathlight",
    description: "Deduped scan signups by email with scan_count and unsubscribe state.",
  },
  {
    table: "contact_submissions",
    timeColumn: "created_at",
    group: "Pathlight",
    description: "Durable record of contact-form submissions alongside Resend send.",
  },
  {
    table: "email_events",
    timeColumn: "sent_at",
    group: "Email",
    description: "Outbound report and follow-up sends + Resend webhook outcomes.",
  },
  {
    table: "email_unsubscribes",
    timeColumn: "unsubscribed_at",
    group: "Email",
    description: "Standalone opt-out list (auto-populated by hard bounces and complaints).",
  },
  {
    table: "monitoring_events",
    timeColumn: "created_at",
    group: "Telemetry",
    description: "Generic event capture: scan funnel, audio, email webhooks, contact, chat, canary.",
  },
  {
    table: "lighthouse_history",
    timeColumn: "created_at",
    group: "Telemetry",
    description: "Daily Lighthouse audit rows per (page, strategy).",
  },
  {
    table: "api_usage_events",
    timeColumn: "occurred_at",
    group: "Telemetry",
    description: "Per-call API usage with cost in USD across Anthropic, Browserless, PSI, ElevenLabs, Resend.",
  },
  {
    table: "admin_audit_log",
    timeColumn: "created_at",
    group: "Admin",
    description: "Append-only admin authentication and protected-route access log.",
  },
];

type TableRow = {
  table: string;
  timeColumn: string;
  group: "Pathlight" | "Email" | "Telemetry" | "Admin";
  description: string;
  total: number;
  last24h: number;
  last7d: number;
  last30d: number;
  newest: string | null;
  oldest: string | null;
};

async function loadCatalog(): Promise<TableRow[]> {
  const sql = getDb();
  const results = await Promise.all(
    TABLE_CATALOG.map(async (entry) => {
      try {
        const rows = (await sql.query(
          `SELECT
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE ${entry.timeColumn} > now() - interval '1 day')::int AS last_24h,
             COUNT(*) FILTER (WHERE ${entry.timeColumn} > now() - interval '7 days')::int AS last_7d,
             COUNT(*) FILTER (WHERE ${entry.timeColumn} > now() - interval '30 days')::int AS last_30d,
             MAX(${entry.timeColumn}) AS newest,
             MIN(${entry.timeColumn}) AS oldest
           FROM ${entry.table}`
        )) as {
          total: number;
          last_24h: number;
          last_7d: number;
          last_30d: number;
          newest: string | null;
          oldest: string | null;
        }[];
        const r = rows[0] ?? {
          total: 0,
          last_24h: 0,
          last_7d: 0,
          last_30d: 0,
          newest: null,
          oldest: null,
        };
        return {
          ...entry,
          total: Number(r.total ?? 0),
          last24h: Number(r.last_24h ?? 0),
          last7d: Number(r.last_7d ?? 0),
          last30d: Number(r.last_30d ?? 0),
          newest: r.newest,
          oldest: r.oldest,
        } satisfies TableRow;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[admin-database] count failed for ${entry.table}: ${message}`);
        return {
          ...entry,
          total: -1,
          last24h: -1,
          last7d: -1,
          last30d: -1,
          newest: null,
          oldest: null,
        } satisfies TableRow;
      }
    })
  );
  return results;
}

function formatNumber(n: number): string {
  if (n < 0) return "error";
  return new Intl.NumberFormat("en-US").format(n);
}

function formatRelative(iso: string | null): string {
  if (!iso) return "-";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "just now";
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  if (ms < 2_592_000_000) return `${Math.floor(ms / 86_400_000)}d ago`;
  return `${Math.floor(ms / 2_592_000_000)}mo ago`;
}

function formatAbsolute(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const GROUPS: { label: TableRow["group"]; description: string }[] = [
  {
    label: "Pathlight",
    description:
      "Scan inputs, computed results, deduped lead emails, and contact-form leads.",
  },
  {
    label: "Email",
    description: "Outbound delivery state and unsubscribe list.",
  },
  {
    label: "Telemetry",
    description:
      "Operational event stream, Lighthouse history, and per-call API spend.",
  },
  {
    label: "Admin",
    description: "Authentication and protected-route access log.",
  },
];

export default async function AdminDatabasePage() {
  const catalog = await loadCatalog();
  const totalRows = catalog
    .map((c) => (c.total < 0 ? 0 : c.total))
    .reduce((a, b) => a + b, 0);
  const last24hRows = catalog
    .map((c) => (c.last24h < 0 ? 0 : c.last24h))
    .reduce((a, b) => a + b, 0);

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Operations
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Database
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Row counts and last-activity timestamps for every Pathlight,
            email, telemetry, and admin table. Read-only. Inserts and
            mutations stay in the application code paths that own them.
          </p>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Tracked tables" value={String(catalog.length)} />
          <Stat label="Total rows" value={formatNumber(totalRows)} />
          <Stat label="Inserts (24h)" value={formatNumber(last24hRows)} />
          <Stat
            label="Last activity"
            value={formatRelative(
              catalog
                .map((c) => c.newest)
                .filter((x): x is string => x !== null)
                .sort()
                .reverse()[0] ?? null
            )}
          />
        </section>

        {GROUPS.map((g) => {
          const tables = catalog.filter((c) => c.group === g.label);
          if (tables.length === 0) return null;
          return (
            <section
              key={g.label}
              className="mb-6 rounded-xl border border-zinc-200 bg-white p-6"
            >
              <header className="mb-4">
                <h2 className="font-display text-base font-semibold text-zinc-900">
                  {g.label}
                </h2>
                <p className="mt-1 text-xs text-zinc-500">{g.description}</p>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
                      <th className="px-3 py-2 font-semibold">Table</th>
                      <th className="px-3 py-2 text-right font-semibold">Total</th>
                      <th className="px-3 py-2 text-right font-semibold">24h</th>
                      <th className="px-3 py-2 text-right font-semibold">7d</th>
                      <th className="px-3 py-2 text-right font-semibold">30d</th>
                      <th className="px-3 py-2 font-semibold">Newest</th>
                      <th className="px-3 py-2 font-semibold">First row</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map((t) => (
                      <tr key={t.table} className="border-t border-zinc-100 align-top">
                        <td className="px-3 py-3">
                          <div className="font-mono text-sm text-zinc-900">
                            {t.table}
                          </div>
                          <div className="mt-1 max-w-md text-xs text-zinc-500">
                            {t.description}
                          </div>
                        </td>
                        <td
                          className={`px-3 py-3 text-right font-mono ${t.total < 0 ? "text-red-600" : "text-zinc-900"}`}
                        >
                          {formatNumber(t.total)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-zinc-900">
                          {formatNumber(t.last24h)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-zinc-900">
                          {formatNumber(t.last7d)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-zinc-900">
                          {formatNumber(t.last30d)}
                        </td>
                        <td className="px-3 py-3 text-xs text-zinc-600">
                          {formatRelative(t.newest)}
                        </td>
                        <td className="px-3 py-3 text-xs text-zinc-500">
                          {formatAbsolute(t.oldest)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold text-zinc-900">
        {value}
      </p>
    </div>
  );
}
