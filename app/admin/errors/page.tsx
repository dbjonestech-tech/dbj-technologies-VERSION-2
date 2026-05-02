import type { Metadata } from "next";
import {
  getTopSentryIssues,
  type SentryIssue,
} from "@/lib/services/sentry-summary";
import {
  loadErrorHeadline,
  loadErrorHourlyBuckets,
  loadTopErrorGroups,
  loadErrorsBySource,
  relativeTime,
  type ErrorHeadline,
  type ErrorGroupRow,
  type ErrorSourceRow,
} from "@/lib/services/errors";
import type { SparkPoint } from "@/lib/services/dashboard-kpis";
import Sparkline from "../Sparkline";
import PageHeader from "../PageHeader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Errors",
  robots: { index: false, follow: false, nocache: true },
};

function levelClass(level: string): string {
  if (level === "fatal" || level === "error") return "bg-red-50 text-red-700 border-red-200";
  if (level === "warning") return "bg-amber-50 text-amber-700 border-amber-200";
  if (level === "info") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function sourceClass(source: string): string {
  if (source === "client") return "bg-amber-50 text-amber-700 border-amber-200";
  if (source === "server") return "bg-red-50 text-red-700 border-red-200";
  if (source === "edge") return "bg-purple-50 text-purple-700 border-purple-200";
  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function bucketsToSparkPoints(buckets: number[]): SparkPoint[] {
  const now = Date.now();
  return buckets.map((value, i) => {
    const t = new Date(now - (buckets.length - 1 - i) * 3600_000);
    const label = `${t.getHours().toString().padStart(2, "0")}:00`;
    return { label, value };
  });
}

function formatRelativeIso(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export default async function ErrorsPage() {
  let head: ErrorHeadline | null = null;
  let hourly: number[] = [];
  let groups: ErrorGroupRow[] = [];
  let bySource: ErrorSourceRow[] = [];
  let firstPartyError: string | null = null;

  try {
    [head, hourly, groups, bySource] = await Promise.all([
      loadErrorHeadline(),
      loadErrorHourlyBuckets(),
      loadTopErrorGroups(),
      loadErrorsBySource(),
    ]);
  } catch (err) {
    firstPartyError = err instanceof Error ? err.message : "unknown error";
  }

  let sentryIssues: SentryIssue[] = [];
  let sentryError: string | null = null;
  try {
    sentryIssues = await getTopSentryIssues();
  } catch (err) {
    sentryError = err instanceof Error ? err.message : "unknown error";
  }

  const sparkPoints = bucketsToSparkPoints(hourly);
  const peakHour = hourly.length ? Math.max(...hourly) : 0;
  const sourceTotal = bySource.reduce((s, r) => s + r.events, 0) || 1;

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          palette="red"
          section="Health"
          pageName="Errors"
          description="First-party application errors, grouped by fingerprint. Sentry issues shown below as a secondary feed for DBJ-internal debugging."
        />

        {firstPartyError ? (
          <Section title="First-party events (24h)">
            <p className="text-sm text-amber-700">
              Could not load error_events: {firstPartyError}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Migration 023 may not have run. From the project root:{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px]">
                node --env-file=.env.local scripts/run-migration.mjs lib/db/migrations/023_error_events.sql
              </code>
            </p>
          </Section>
        ) : head ? (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="Events (24h)" value={head.errors_24h} previous={head.errors_prev_24h} />
              <StatTile label="Unique groups (24h)" value={head.unique_24h} />
              <StatTile label="Affected visitors (24h)" value={head.affected_users_24h} />
              <StatTile label="Events (7d)" value={head.errors_7d} />
            </div>

            <Section title="Hourly volume (last 24 hours)">
              <div className="text-red-600">
                <Sparkline points={sparkPoints} colorClass="text-red-600" height={64} />
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Peak hour: {peakHour.toLocaleString()} events
              </p>
            </Section>

            <Section title="By source (last 7 days)">
              {bySource.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No first-party errors in the last 7 days. The ErrorBeacon is mounted in the root layout
                  and posts to <code className="font-mono text-[11px]">/api/track/error</code> on
                  window.error and unhandledrejection.
                </p>
              ) : (
                <ul className="space-y-2">
                  {bySource.map((s) => {
                    const pct = Math.round((s.events / sourceTotal) * 100);
                    return (
                      <li key={s.source}>
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="font-mono uppercase tracking-wider text-zinc-700">
                            {s.source}
                          </span>
                          <span className="font-mono text-zinc-500">
                            {s.events.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                          <span
                            className="block h-full rounded-full bg-red-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>

            <Section title="Top error groups (last 7 days, by event count)">
              {groups.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No error groups in the last 7 days. Trigger a runtime error in any browser session
                  to verify the pipeline.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="canopy-table w-full min-w-[840px] text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
                        <th className="px-3 py-2 font-semibold">Message</th>
                        <th className="px-3 py-2 font-semibold">Source</th>
                        <th className="px-3 py-2 text-right font-semibold">Events</th>
                        <th className="px-3 py-2 text-right font-semibold">Visitors</th>
                        <th className="px-3 py-2 text-right font-semibold">First seen</th>
                        <th className="px-3 py-2 text-right font-semibold">Last seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((g) => (
                        <tr key={g.fingerprint} className="border-t border-zinc-100">
                          <td className="max-w-[420px] truncate px-3 py-2 font-mono text-xs text-zinc-900">
                            {g.message}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${sourceClass(g.source)}`}
                            >
                              {g.source}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-zinc-700">
                            {g.events.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-zinc-700">
                            {g.users.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs text-zinc-500">
                            {relativeTime(g.first_at)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs text-zinc-500">
                            {relativeTime(g.last_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          </>
        ) : null}

        <Section title="Sentry - DBJ paid issue tracker (24h)">
          {sentryError ? (
            <p className="text-sm text-amber-700">
              Could not load Sentry issues: {sentryError}
            </p>
          ) : sentryIssues.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No issues, or Sentry credentials not configured. Set SENTRY_AUTH_TOKEN, SENTRY_ORG_SLUG, SENTRY_PROJECT_SLUG.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="canopy-table w-full min-w-[800px] text-sm">
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
                  {sentryIssues.map((r) => (
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
                        {formatRelativeIso(r.lastSeen)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  previous,
}: {
  label: string;
  value: number;
  previous?: number;
}) {
  let delta: { sign: "up" | "down" | "flat"; pct: number } | null = null;
  if (typeof previous === "number" && previous > 0) {
    const pct = Math.round(((value - previous) / previous) * 100);
    delta = { sign: pct > 0 ? "up" : pct < 0 ? "down" : "flat", pct: Math.abs(pct) };
  }
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl font-semibold text-zinc-900">
        {value.toLocaleString()}
      </p>
      {delta ? (
        <p className="mt-1 text-[11px] text-zinc-500">
          {delta.sign === "up" ? "↑" : delta.sign === "down" ? "↓" : "→"}{" "}
          {delta.pct}% vs prior 24h
        </p>
      ) : null}
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
