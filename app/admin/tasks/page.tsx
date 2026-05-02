import type { Metadata } from "next";
import { auth } from "@/auth";
import { getTasks, type TaskFilter } from "@/lib/services/tasks";
import type { TaskPriority } from "@/lib/services/activities";
import PageHeader from "../PageHeader";
import TasksFilterBar from "./TasksFilterBar";
import TaskRowClient from "./TaskRowClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Tasks",
  robots: { index: false, follow: false, nocache: true },
};

type SearchParams = {
  scope?: string;
  status?: string;
  priority?: string;
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const ownerEmail = session?.user?.email ?? null;

  const scopeRaw: "mine" | "all" = sp.scope === "all" ? "all" : "mine";
  const statusRaw: NonNullable<TaskFilter["status"]> =
    sp.status === "overdue" || sp.status === "completed" || sp.status === "all_open"
      ? sp.status
      : "all_open";
  const priorityRaw: TaskPriority | "all" =
    sp.priority === "urgent" ||
    sp.priority === "high" ||
    sp.priority === "medium" ||
    sp.priority === "low"
      ? sp.priority
      : "all";

  const filter: TaskFilter = {
    ownerEmail,
    scope: scopeRaw,
    status: statusRaw,
    priority: priorityRaw,
  };

  const tasks = await getTasks(filter);

  const counts = await getTasks({ ownerEmail, scope: "mine", status: "overdue" });

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader
          palette="amber"
          section="Operations"
          pageName="Tasks"
          description="Every task across all contacts and deals. Filter by scope, status, and priority. Mark a task complete with one click; the audit log captures who did what and when."
        />

        <TasksFilterBar
          scope={scopeRaw}
          status={statusRaw}
          priority={priorityRaw}
        />

        {filter.scope === "mine" && counts.length > 0 && filter.status !== "overdue" ? (
          <a
            href="/admin/tasks?scope=mine&status=overdue"
            className="mb-6 inline-block rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
          >
            You have {counts.length} overdue task{counts.length === 1 ? "" : "s"} - view overdue →
          </a>
        ) : null}

        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          {tasks.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-zinc-500">
              No tasks match the current filter. Tasks are created from any contact or deal detail page using the activity composer.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {tasks.map((t) => (
                <TaskRowClient key={t.id} task={t} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
