import type { Metadata } from "next";
import {
  getLatestInfraStatuses,
  type InfraStatusRow,
} from "@/lib/services/infrastructure";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Infrastructure",
  robots: { index: false, follow: false, nocache: true },
};

const RESOURCE_ORDER = ["tls", "whois", "mx", "spf", "dkim", "dmarc"];

function statusClass(status: string): string {
  if (status === "ok") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "warn") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "fail") return "bg-red-50 text-red-700 border-red-200";
  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function daysUntil(iso: string | null): string {
  if (!iso) return "-";
  const ms = new Date(iso).getTime() - Date.now();
  const days = Math.floor(ms / (24 * 3600 * 1000));
  if (days < 0) return "expired";
  if (days < 1) return "<1d";
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export default async function InfrastructurePage() {
  const rows = await getLatestInfraStatuses();
  const byTarget = new Map<string, InfraStatusRow[]>();
  for (const r of rows) {
    if (!byTarget.has(r.target)) byTarget.set(r.target, []);
    byTarget.get(r.target)!.push(r);
  }

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Health
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Infrastructure
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            TLS, WHOIS, MX, SPF, DKIM, and DMARC for every managed
            domain. Daily check at 08:00 UTC. Sentry-warns at 14 days
            from cert expiry, 30 days from registration expiry, or any
            DNS auth fail.
          </p>
        </header>

        {byTarget.size === 0 ? (
          <p className="text-sm text-zinc-500">No checks recorded yet. The first cron run hydrates this page.</p>
        ) : (
          Array.from(byTarget.entries()).map(([target, rows]) => (
            <Section key={target} title={target}>
              <DomainGrid rows={rows} />
            </Section>
          ))
        )}
      </div>
    </div>
  );
}

function DomainGrid({ rows }: { rows: InfraStatusRow[] }) {
  const lookup = new Map<string, InfraStatusRow>();
  for (const r of rows) lookup.set(r.resource, r);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
      {RESOURCE_ORDER.map((resource) => {
        const row = lookup.get(resource);
        if (!row) {
          return (
            <div
              key={resource}
              className="rounded-xl border border-dashed border-zinc-200 bg-white/50 p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                {resource}
              </p>
              <p className="mt-1 text-xs text-zinc-400">no data</p>
            </div>
          );
        }
        return (
          <div
            key={resource}
            className={`rounded-xl border p-4 ${statusClass(row.status)}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
              {resource}
            </p>
            <p className="mt-1 font-mono text-xs">
              {row.expiresAt ? daysUntil(row.expiresAt) : row.status}
            </p>
            <p className="mt-1 text-[10px] opacity-70">
              {formatRelative(row.checkedAt)}
            </p>
          </div>
        );
      })}
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
      <h2 className="mb-4 font-mono text-sm font-semibold text-zinc-900">
        {title}
      </h2>
      {children}
    </section>
  );
}
