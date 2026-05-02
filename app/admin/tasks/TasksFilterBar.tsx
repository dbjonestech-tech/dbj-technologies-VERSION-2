"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SCOPES = [
  { value: "mine", label: "Mine" },
  { value: "all", label: "All" },
];
const STATUSES = [
  { value: "all_open", label: "Open" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
];
const PRIORITIES = [
  { value: "all", label: "Any priority" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function TasksFilterBar({
  scope,
  status,
  priority,
}: {
  scope: string;
  status: string;
  priority: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <FilterGroup label="Scope" value={scope} options={SCOPES} onChange={(v) => update("scope", v)} />
      <FilterGroup label="Status" value={status} options={STATUSES} onChange={(v) => update("status", v)} />
      <FilterGroup label="Priority" value={priority} options={PRIORITIES} onChange={(v) => update("priority", v)} />
      <Link
        href="/admin/tasks"
        className="ml-auto rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
      >
        Reset
      </Link>
    </div>
  );
}

function FilterGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
