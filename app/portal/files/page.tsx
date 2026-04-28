import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { listFilesForClient, phaseLabel, type FileRow, type ProjectRow } from "@/lib/portal/projects";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Files",
  robots: { index: false, follow: false, nocache: true },
};

function formatBytes(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PortalFilesPage() {
  const session = await auth();
  const email = session?.user?.email ?? "";
  const groups = await listFilesForClient(email);
  const totalFiles = groups.reduce((sum, g) => sum + g.files.length, 0);

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Deliverables
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Files
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Everything I have shared with you, grouped by project. Click a
            file to download. Need something that is not here? Email me.
          </p>
        </header>

        {totalFiles === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6">
            {groups.map((g) =>
              g.files.length === 0 ? null : (
                <ProjectFiles key={g.project.id} project={g.project} files={g.files} />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
      <h2 className="font-display text-base font-semibold text-zinc-900">
        Nothing to download yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
        Files appear here as I deliver them. Drafts, finals, briefs,
        anything you need to keep.
      </p>
    </section>
  );
}

function ProjectFiles({
  project,
  files,
}: {
  project: ProjectRow;
  files: FileRow[];
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <header className="border-b border-zinc-200 bg-zinc-50 px-6 py-4">
        <h2 className="font-display text-base font-semibold text-zinc-900">
          {project.name}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Phase: {phaseLabel(project.phase)} {" · "} Status: {project.status}
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-6 py-3 font-semibold">File</th>
              <th className="px-6 py-3 font-semibold">Size</th>
              <th className="px-6 py-3 font-semibold">Added</th>
              <th className="px-6 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.id} className="border-t border-zinc-100">
                <td className="px-6 py-3">
                  <div className="font-medium text-zinc-900">{f.label}</div>
                  {f.description ? (
                    <div className="mt-0.5 text-xs text-zinc-500">
                      {f.description}
                    </div>
                  ) : null}
                </td>
                <td className="px-6 py-3 font-mono text-xs text-zinc-600">
                  {formatBytes(f.size_bytes)}
                </td>
                <td className="px-6 py-3 text-xs text-zinc-600">
                  {formatDate(f.uploaded_at)}
                </td>
                <td className="px-6 py-3 text-right">
                  <Link
                    href={`/portal/files/${f.id}/download`}
                    className="text-sm text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
                  >
                    Download
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
