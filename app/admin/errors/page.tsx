import type { Metadata } from "next";
import {
  getTopSentryIssues,
  type SentryIssue,
} from "@/lib/services/sentry-summary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Errors",
  robots: { index: false, follow: false, nocache: true },
};

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function levelClass(level: string): string {
  if (level === "fatal" || level === "error") return "bg-red-50 text-red-700 border-red-200";
  if (level === "warning") return "bg-amber-50 text-amber-700 border-amber-200";
  if (level === "info") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

export default async function ErrorsPage() {
  const issues = await getTopSentryIssues();
  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Health
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Errors
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Top unresolved Sentry issues from the trailing 24 hours.
            Cached 5 minutes via Upstash Redis. Click any row to open
            the issue in Sentry.
          </p>
        </header>

        <Section title="Unresolved issues (24h)">
          {issues.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No issues, or Sentry credentials not configured. Set
              SENTRY_AUTH_TOKEN, SENTRY_ORG_SLUG, SENTRY_PROJECT_SLUG.
            </p>
          ) : (
            <IssuesTable rows={issues} />
          )}
        </Section>
      </div>
    </div>
  );
}

function IssuesTable({ rows }: { rows: SentryIssue[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-semibold">ID</th>
            <th className="px-3 py-2 font-semibold">Level</th>
            <th className="px-3 py-2 font-semibold">Title</th>
            <th className="px-3 py-2 text-right font-semibold">Events</th>
            <th className="px-3 py-2 text-right font-semibold">Users</th>
            <th className="px-3 py-2 text-right font-semibold">Last seen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-zinc-100">
              <td className="px-3 py-2 font-mono text-[11px] text-zinc-700">
                <a href={r.permalink} target="_blank" rel="noreferrer" className="hover:underline">
                  {r.shortId}
                </a>
              </td>
              <td className="px-3 py-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${levelClass(r.level)}`}
                >
                  {r.level}
                </span>
              </td>
              <td className="px-3 py-2 text-xs text-zinc-900">
                <a href={r.permalink} target="_blank" rel="noreferrer" className="hover:underline">
                  {r.title}
                </a>
                {r.culprit ? (
                  <span className="ml-2 text-zinc-500">{r.culprit}</span>
                ) : null}
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">{r.count}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700">{r.userCount}</td>
              <td className="px-3 py-2 text-right font-mono text-xs text-zinc-500">
                {formatRelative(r.lastSeen)}
              </td>
            </tr>
          ))}
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
