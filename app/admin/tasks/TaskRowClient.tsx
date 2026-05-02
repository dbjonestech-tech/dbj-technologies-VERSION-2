"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, Loader2, RotateCcw } from "lucide-react";
import {
  completeTaskAction,
  reopenTaskAction,
} from "@/lib/actions/activities";
import type { TaskPriority } from "@/lib/services/activities";
import type { TaskRow } from "@/lib/services/tasks";

const PRIORITY_TINT: Record<TaskPriority, string> = {
  urgent: "bg-red-50 text-red-700 ring-red-200",
  high:   "bg-amber-50 text-amber-700 ring-amber-200",
  medium: "bg-violet-50 text-violet-700 ring-violet-200",
  low:    "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

export default function TaskRowClient({ task }: { task: TaskRow }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const completed = task.completed_at !== null;
  const overdue =
    !completed &&
    task.due_at !== null &&
    new Date(task.due_at).getTime() < Date.now();

  const title = typeof task.payload?.title === "string" ? task.payload.title : "Task";
  const body = typeof task.payload?.body === "string" ? task.payload.body : null;

  function toggleComplete() {
    setError(null);
    start(async () => {
      const r = completed
        ? await reopenTaskAction(task.id)
        : await completeTaskAction(task.id);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <li className="flex items-start gap-3 px-3 py-3 hover:bg-zinc-50">
      <button
        type="button"
        onClick={toggleComplete}
        disabled={pending}
        aria-label={completed ? "Reopen task" : "Mark complete"}
        className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border transition-colors disabled:opacity-50 ${
          completed
            ? "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600"
            : "border-zinc-300 bg-white hover:border-violet-400"
        }`}
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : completed ? (
          <Check className="h-3 w-3" />
        ) : null}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className={`text-sm font-medium ${completed ? "text-zinc-400 line-through" : "text-zinc-900"}`}>
            {title}
          </p>
          {task.priority ? (
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${PRIORITY_TINT[task.priority]}`}
            >
              {task.priority}
            </span>
          ) : null}
          {overdue ? (
            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-700">
              Overdue
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">
          {task.due_at ? `Due ${new Date(task.due_at).toLocaleString()}` : "No due date"}
          {task.owner_email ? ` · ${task.owner_email}` : ""}
        </p>
        {body ? (
          <p className="mt-1 text-xs text-zinc-600">{body}</p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
          {task.contact_id && task.contact_email ? (
            <Link
              href={`/admin/contacts/${task.contact_id}`}
              className="rounded bg-pink-50 px-1.5 py-0.5 font-mono text-pink-700 hover:bg-pink-100"
            >
              {task.contact_name || task.contact_email}
            </Link>
          ) : null}
          {task.deal_id && task.deal_name ? (
            <Link
              href={`/admin/deals/${task.deal_id}`}
              className="rounded bg-violet-50 px-1.5 py-0.5 font-mono text-violet-700 hover:bg-violet-100"
            >
              {task.deal_name}
            </Link>
          ) : null}
          {completed ? (
            <button
              type="button"
              onClick={toggleComplete}
              disabled={pending}
              className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-700"
            >
              <RotateCcw className="h-3 w-3" /> Reopen
            </button>
          ) : null}
        </div>
        {error ? (
          <p className="mt-1 text-[11px] text-red-700">{error}</p>
        ) : null}
      </div>
    </li>
  );
}
