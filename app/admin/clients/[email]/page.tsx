import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/auth/clients";
import {
  listFilesForProject,
  listProjectsForClient,
  PROJECT_PHASES,
  PROJECT_STATUSES,
  phaseLabel,
  type FileRow,
  type ProjectRow,
} from "@/lib/portal/projects";
import {
  createProjectAction,
  deleteFileAction,
  deleteProjectAction,
  updateClientAction,
  updateProjectAction,
  uploadFileAction,
} from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Client",
  robots: { index: false, follow: false, nocache: true },
};

type Flash = { message: string; tone: "success" | "error" } | null;

function pickFlash(raw: Record<string, string | string[] | undefined>): Flash {
  const get = (k: string) => {
    const v = raw[k];
    return Array.isArray(v) ? v[0] : v;
  };
  if (get("error")) return { message: String(get("error")), tone: "error" };
  if (get("saved"))
    return { message: "Client updated.", tone: "success" };
  if (get("created_project"))
    return { message: "Project created.", tone: "success" };
  if (get("saved_project"))
    return { message: "Project updated.", tone: "success" };
  if (get("deleted_project"))
    return { message: "Project deleted.", tone: "success" };
  if (get("uploaded"))
    return { message: `File "${get("uploaded")}" uploaded.`, tone: "success" };
  if (get("deleted_file"))
    return { message: "File deleted.", tone: "success" };
  return null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatBytes(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default async function AdminClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ email: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { email: rawEmail } = await params;
  const decoded = decodeURIComponent(rawEmail).toLowerCase();
  const [client, projects, raw] = await Promise.all([
    getClient(decoded),
    listProjectsForClient(decoded),
    searchParams,
  ]);
  if (!client) notFound();

  const flash = pickFlash(raw);

  /* Pre-load files per project in parallel. The project detail card
   * needs them inline so the upload form sits next to its current
   * file list; loading per-card would serialize a network round trip
   * per project. */
  const projectFiles = await Promise.all(
    projects.map(async (p) => ({
      project: p,
      files: await listFilesForProject(p.id),
    }))
  );

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6">
          <Link
            href="/admin/clients"
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-900"
          >
            ← Back to clients
          </Link>
          <h1 className="mt-3 font-display text-2xl font-semibold text-zinc-900 sm:text-3xl">
            {client.name ?? client.email}
          </h1>
          <p className="mt-1 font-mono text-xs text-zinc-500">{client.email}</p>
          {client.status === "archived" ? (
            <span className="mt-2 inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-600/20">
              archived
            </span>
          ) : null}
        </header>

        {flash ? <FlashBanner flash={flash} /> : null}

        <ClientInfoCard client={client} />

        <section className="mb-6">
          <h2 className="mb-3 font-display text-lg font-semibold text-zinc-900">
            Projects
          </h2>
          {projectFiles.length === 0 ? (
            <p className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
              No projects yet. Create one below.
            </p>
          ) : (
            <div className="space-y-4">
              {projectFiles.map(({ project, files }) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  files={files}
                  clientEmail={client.email}
                />
              ))}
            </div>
          )}
        </section>

        <CreateProjectCard clientEmail={client.email} />
      </div>
    </div>
  );
}

function FlashBanner({ flash }: { flash: NonNullable<Flash> }) {
  const className =
    flash.tone === "success"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : "bg-red-50 text-red-800 border-red-200";
  return (
    <div className={`mb-6 rounded-md border px-4 py-3 text-sm ${className}`}>
      {flash.message}
    </div>
  );
}

function ClientInfoCard({
  client,
}: {
  client: NonNullable<Awaited<ReturnType<typeof getClient>>>;
}) {
  return (
    <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
      <header className="mb-4">
        <h2 className="font-display text-base font-semibold text-zinc-900">
          Client info
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Notes are internal-only; they never appear in /portal.
        </p>
      </header>
      <form action={updateClientAction} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="email" value={client.email} />
        <Field label="Name">
          <input
            type="text"
            name="name"
            defaultValue={client.name ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </Field>
        <Field label="Company">
          <input
            type="text"
            name="company"
            defaultValue={client.company ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Internal notes">
            <textarea
              name="notes"
              rows={3}
              defaultValue={client.notes ?? ""}
              className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Save
          </button>
        </div>
      </form>
    </section>
  );
}

function ProjectCard({
  project,
  files,
  clientEmail,
}: {
  project: ProjectRow;
  files: FileRow[];
  clientEmail: string;
}) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-6">
      <form action={updateProjectAction} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={project.id} />
        <input type="hidden" name="client_email" value={clientEmail} />
        <Field label="Project name">
          <input
            type="text"
            name="name"
            defaultValue={project.name}
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phase">
            <select
              name="phase"
              defaultValue={project.phase}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
            >
              {PROJECT_PHASES.map((p) => (
                <option key={p} value={p}>
                  {phaseLabel(p)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              name="status"
              defaultValue={project.status}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Current milestone">
          <input
            type="text"
            name="current_milestone"
            defaultValue={project.current_milestone ?? ""}
            placeholder="e.g. Wireframes in review"
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </Field>
        <Field label="Next deliverable">
          <input
            type="text"
            name="next_deliverable"
            defaultValue={project.next_deliverable ?? ""}
            placeholder="e.g. Hi-fi mockups by Friday"
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </Field>
        <Field label="Projected ETA">
          <input
            type="date"
            name="projected_eta"
            defaultValue={project.projected_eta ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </Field>
        <div className="sm:col-span-2 flex items-center justify-between">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Save project
          </button>
          <span className="text-xs text-zinc-400">
            Created {formatDate(project.created_at)}
            {project.completed_at
              ? ` · Completed ${formatDate(project.completed_at)}`
              : ""}
          </span>
        </div>
      </form>

      <FilesSection
        project={project}
        files={files}
        clientEmail={clientEmail}
      />

      <form
        action={deleteProjectAction}
        className="mt-4 border-t border-zinc-100 pt-4"
      >
        <input type="hidden" name="id" value={project.id} />
        <input type="hidden" name="client_email" value={clientEmail} />
        <button
          type="submit"
          className="text-xs font-medium text-zinc-500 hover:text-red-700 hover:underline"
        >
          Delete this project
        </button>
      </form>
    </article>
  );
}

function FilesSection({
  project,
  files,
  clientEmail,
}: {
  project: ProjectRow;
  files: FileRow[];
  clientEmail: string;
}) {
  return (
    <div className="mt-6 border-t border-zinc-100 pt-4">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        Files ({files.length})
      </h3>
      {files.length > 0 ? (
        <ul className="mb-4 space-y-1.5">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
            >
              <div>
                <span className="font-medium text-zinc-900">{f.label}</span>
                {f.description ? (
                  <span className="ml-2 text-xs text-zinc-500">
                    {f.description}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span className="font-mono">{formatBytes(f.size_bytes)}</span>
                <span>{formatDate(f.uploaded_at)}</span>
                <Link
                  href={`/portal/files/${f.id}/download`}
                  className="text-zinc-700 hover:underline"
                  prefetch={false}
                >
                  Download
                </Link>
                <form action={deleteFileAction}>
                  <input type="hidden" name="id" value={f.id} />
                  <input
                    type="hidden"
                    name="client_email"
                    value={clientEmail}
                  />
                  <button
                    type="submit"
                    className="text-zinc-500 hover:text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-xs text-zinc-500">No files uploaded yet.</p>
      )}

      <form
        action={uploadFileAction}
        encType="multipart/form-data"
        className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-3 sm:items-end"
      >
        <input type="hidden" name="project_id" value={project.id} />
        <input type="hidden" name="client_email" value={clientEmail} />
        <Field label="Label" required>
          <input
            type="text"
            name="label"
            required
            placeholder="Hi-fi mockups v2"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </Field>
        <Field label="Description">
          <input
            type="text"
            name="description"
            placeholder="Optional"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </Field>
        <Field label="File" required>
          <input
            type="file"
            name="file"
            required
            className="w-full text-xs file:mr-2 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-zinc-700"
          />
        </Field>
        <div className="sm:col-span-3">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Upload file
          </button>
          <span className="ml-3 text-[11px] text-zinc-500">
            Max ~4MB per file (Vercel function limit). Larger files will need direct upload, deferred to v2.
          </span>
        </div>
      </form>
    </div>
  );
}

function CreateProjectCard({ clientEmail }: { clientEmail: string }) {
  return (
    <section className="mb-6 rounded-xl border border-dashed border-zinc-300 bg-white p-6">
      <header className="mb-4">
        <h2 className="font-display text-base font-semibold text-zinc-900">
          Create project
        </h2>
      </header>
      <form action={createProjectAction} className="grid gap-3 sm:grid-cols-3 sm:items-end">
        <input type="hidden" name="client_email" value={clientEmail} />
        <Field label="Project name" required>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. Site rebuild"
            className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </Field>
        <Field label="Starting phase">
          <select
            name="phase"
            defaultValue="discovery"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          >
            {PROJECT_PHASES.map((p) => (
              <option key={p} value={p}>
                {phaseLabel(p)}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Create
        </button>
      </form>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}
