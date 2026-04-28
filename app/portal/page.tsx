import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { getClient } from "@/lib/auth/clients";
import {
  listProjectsForClient,
  PROJECT_PHASES,
  phaseIndex,
  phaseLabel,
  type ProjectRow,
} from "@/lib/portal/projects";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Project",
  robots: { index: false, follow: false, nocache: true },
};

function firstName(email: string | null | undefined, name: string | null | undefined): string {
  if (name) return name.split(" ")[0] ?? name;
  if (!email) return "there";
  return email.split("@")[0]?.split(/[._-]/)[0] ?? "there";
}

function formatDate(iso: string | null): string {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(iso: string | null): string {
  if (!iso) return "-";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "moments ago";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  if (ms < 2_592_000_000) return `${Math.floor(ms / 86_400_000)}d ago`;
  return `${Math.floor(ms / 2_592_000_000)}mo ago`;
}

export default async function PortalHome() {
  const session = await auth();
  const email = session?.user?.email ?? "";
  const client = email ? await getClient(email) : null;
  const projects = email ? await listProjectsForClient(email) : [];
  const active = projects.filter((p) => p.status === "active");
  const paused = projects.filter((p) => p.status === "paused");
  const completed = projects.filter((p) => p.status === "completed");
  const greeting = firstName(email, client?.name ?? null);

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Welcome back
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            {greeting}.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Here is where things stand. I update this surface as the work
            moves. If anything looks off, email me at{" "}
            <a
              href="mailto:joshua@dbjtechnologies.com"
              className="text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
            >
              joshua@dbjtechnologies.com
            </a>
            .
          </p>
        </header>

        {active.length === 0 && paused.length === 0 ? (
          <EmptyState />
        ) : (
          <section className="mb-8 grid gap-4">
            {active.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
            {paused.length > 0 ? (
              <>
                <h2 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Paused
                </h2>
                {paused.map((p) => (
                  <ProjectCard key={p.id} project={p} muted />
                ))}
              </>
            ) : null}
          </section>
        )}

        {completed.length > 0 ? (
          <ProjectHistory projects={completed} />
        ) : null}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
      <h2 className="font-display text-base font-semibold text-zinc-900">
        No active projects yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
        I have not opened a project for you yet. If you were expecting one
        to be here, send me a note and I will get it set up.
      </p>
    </section>
  );
}

function ProjectCard({
  project,
  muted = false,
}: {
  project: ProjectRow;
  muted?: boolean;
}) {
  const idx = phaseIndex(project.phase);
  return (
    <article
      className={
        "rounded-xl border border-zinc-200 bg-white p-6 " +
        (muted ? "opacity-70" : "")
      }
    >
      <header className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-zinc-900">
            {project.name}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Updated {formatRelative(project.updated_at)}
          </p>
        </div>
        <Link
          href={`/portal/files?project=${project.id}`}
          className="text-sm text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
        >
          View files →
        </Link>
      </header>

      <PhaseTracker currentIndex={idx} />

      <dl className="mt-6 grid gap-5 sm:grid-cols-3">
        <Field label="Where we are">
          {project.current_milestone ?? (
            <span className="text-zinc-400">Setting up</span>
          )}
        </Field>
        <Field label="Up next">
          {project.next_deliverable ?? (
            <span className="text-zinc-400">Pending</span>
          )}
        </Field>
        <Field label="Projected ETA">{formatDate(project.projected_eta)}</Field>
      </dl>
    </article>
  );
}

function PhaseTracker({ currentIndex }: { currentIndex: number }) {
  return (
    <ol className="flex w-full items-stretch gap-1.5" aria-label="Project phase">
      {PROJECT_PHASES.map((p, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        const upcoming = i > currentIndex;
        return (
          <li key={p} className="flex flex-1 flex-col gap-1">
            <span
              className={
                "h-1.5 w-full rounded-full " +
                (done
                  ? "bg-zinc-900"
                  : current
                    ? "bg-[#0891b2]"
                    : "bg-zinc-200")
              }
              aria-hidden="true"
            />
            <span
              className={
                "text-[10px] font-semibold uppercase tracking-wider " +
                (current
                  ? "text-[#0891b2]"
                  : done
                    ? "text-zinc-900"
                    : upcoming
                      ? "text-zinc-400"
                      : "")
              }
            >
              {phaseLabel(p)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-zinc-900">{children}</dd>
    </div>
  );
}

function ProjectHistory({ projects }: { projects: ProjectRow[] }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6">
      <header className="mb-4">
        <h2 className="font-display text-base font-semibold text-zinc-900">
          Past projects
        </h2>
        <p className="mt-1 text-xs text-zinc-500">Completed engagements.</p>
      </header>
      <ul className="space-y-2">
        {projects.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-baseline justify-between gap-2 border-t border-zinc-100 pt-3 first:border-t-0 first:pt-0"
          >
            <div>
              <p className="font-medium text-zinc-900">{p.name}</p>
              <p className="text-xs text-zinc-500">
                Wrapped at {phaseLabel(p.phase)}
                {p.completed_at
                  ? `, ${formatDate(p.completed_at)}`
                  : ""}
              </p>
            </div>
            <Link
              href={`/portal/files?project=${p.id}`}
              className="text-xs text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
            >
              View files
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
