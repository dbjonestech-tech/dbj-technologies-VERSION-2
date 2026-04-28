import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getSessionDetail,
  getSessionPath,
} from "@/lib/services/analytics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Session detail",
  robots: { index: false, follow: false, nocache: true },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function formatDwell(ms: number | null): string {
  if (ms === null || ms === undefined) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [session, path] = await Promise.all([
    getSessionDetail(id),
    getSessionPath(id),
  ]);
  if (!session) notFound();

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
          Session
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900">
          {session.id}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Visitor{" "}
          <span className="font-mono text-zinc-900">{session.visitorId}</span> ·{" "}
          {formatRelative(session.startedAt)} · {session.pageCount} page view{session.pageCount === 1 ? "" : "s"}
        </p>

        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          <Card label="Entry path" value={session.entryPath ?? "-"} mono />
          <Card label="Exit path" value={session.exitPath ?? "-"} mono />
          <Card label="Referrer" value={session.referrer ?? "-"} mono />
          <Card label="UTM source" value={session.utmSource ?? "-"} />
          <Card label="UTM medium" value={session.utmMedium ?? "-"} />
          <Card label="UTM campaign" value={session.utmCampaign ?? "-"} />
          <Card
            label="Geo"
            value={
              [session.city, session.region, session.country]
                .filter(Boolean)
                .join(", ") || "-"
            }
          />
          <Card label="Device" value={session.deviceType ?? "-"} />
        </section>

        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-zinc-900">
            Conversion
          </h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-zinc-500">
                Pathlight scan
              </dt>
              <dd className="mt-1 font-mono text-xs text-zinc-900">
                {session.convertedScanId ? (
                  <Link
                    href={`/admin/scans?id=${session.convertedScanId}`}
                    className="hover:underline"
                  >
                    {session.convertedScanId}
                  </Link>
                ) : (
                  <span className="text-zinc-400">none</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-zinc-500">
                Contact submission
              </dt>
              <dd className="mt-1 font-mono text-xs text-zinc-900">
                {session.convertedContactId ? (
                  <Link
                    href={`/admin/leads?id=${session.convertedContactId}`}
                    className="hover:underline"
                  >
                    {session.convertedContactId}
                  </Link>
                ) : (
                  <span className="text-zinc-400">none</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-zinc-900">
            Page-by-page
          </h2>
          {path.length === 0 ? (
            <p className="text-sm text-zinc-500">No page views recorded.</p>
          ) : (
            <ol className="space-y-2">
              {path.map((p, i) => (
                <li key={p.id} className="flex items-baseline gap-3 text-sm">
                  <span className="w-6 font-mono text-xs text-zinc-400">
                    {i + 1}.
                  </span>
                  <span className="font-mono text-xs text-zinc-900">
                    {p.path}
                    {p.query ? <span className="text-zinc-500">{p.query}</span> : null}
                  </span>
                  <span className="ml-auto font-mono text-[11px] text-zinc-500">
                    dwell {formatDwell(p.dwellMs)} · scroll{" "}
                    {p.scrollPct === null ? "-" : `${p.scrollPct}%`}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 ${mono ? "font-mono text-xs" : "text-sm"} text-zinc-900`}>
        {value}
      </p>
    </div>
  );
}
