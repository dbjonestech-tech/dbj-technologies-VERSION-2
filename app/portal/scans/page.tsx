import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Pathlight scans",
  robots: { index: false, follow: false, nocache: true },
};

type ScanRow = {
  id: string;
  url: string;
  business_name: string | null;
  status: string;
  pathlight_score: number | null;
  created_at: string;
  completed_at: string | null;
};

async function listScansForEmail(email: string): Promise<ScanRow[]> {
  if (!email) return [];
  const sql = getDb();
  const rows = (await sql`
    SELECT s.id::text, s.url, s.business_name, s.status,
           sr.pathlight_score, s.created_at, s.completed_at
    FROM scans s
    LEFT JOIN scan_results sr ON sr.scan_id = s.id
    WHERE s.email = ${email}
    ORDER BY s.created_at DESC
    LIMIT 100
  `) as ScanRow[];
  return rows;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function scoreClass(n: number | null): string {
  if (n === null) return "text-zinc-400";
  if (n >= 90) return "text-emerald-600";
  if (n >= 75) return "text-amber-600";
  return "text-red-600";
}

function statusBadge(s: string): { className: string; label: string } {
  if (s === "complete")
    return {
      className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      label: "complete",
    };
  if (s === "partial")
    return {
      className: "bg-amber-50 text-amber-700 ring-amber-600/20",
      label: "partial",
    };
  if (s === "failed")
    return {
      className: "bg-red-50 text-red-700 ring-red-600/20",
      label: "failed",
    };
  return {
    className: "bg-zinc-100 text-zinc-700 ring-zinc-600/20",
    label: s,
  };
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function PortalScansPage() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase().trim() ?? "";
  const rows = await listScansForEmail(email);

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Diagnostics
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Pathlight scans
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Every Pathlight scan run from this email. Reports stay live at
            their original URLs; click through to view or share. Want a
            fresh scan? Run one at{" "}
            <Link
              href="/pathlight"
              className="text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
            >
              dbjtechnologies.com/pathlight
            </Link>
            .
          </p>
        </header>

        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-zinc-50">
                  <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Site</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 text-right font-semibold">Score</th>
                    <th className="px-6 py-3 text-right font-semibold">Report</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const badge = statusBadge(row.status);
                    return (
                      <tr key={row.id} className="border-t border-zinc-100">
                        <td className="px-6 py-3 text-xs text-zinc-600">
                          {formatDate(row.created_at)}
                        </td>
                        <td className="px-6 py-3">
                          <div className="font-medium text-zinc-900">
                            {row.business_name ?? hostname(row.url)}
                          </div>
                          <div className="font-mono text-[11px] text-zinc-500">
                            {row.url}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td
                          className={`px-6 py-3 text-right font-mono ${scoreClass(row.pathlight_score)}`}
                        >
                          {row.pathlight_score ?? "-"}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Link
                            href={`/pathlight/${row.id}`}
                            target="_blank"
                            className="text-sm text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
      <h2 className="font-display text-base font-semibold text-zinc-900">
        No Pathlight scans yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
        Run your first scan from the public Pathlight surface. It is free
        and takes a couple of minutes.
      </p>
      <Link
        href="/pathlight"
        className="mt-4 inline-flex items-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
      >
        Open Pathlight
      </Link>
    </section>
  );
}
