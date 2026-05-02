"use client";

import { useState, useTransition } from "react";
import { Loader2, Tag as TagIcon, TagsIcon, Trash2, Send, Download, X } from "lucide-react";
import {
  bulkAddTagAction,
  bulkRemoveTagAction,
  bulkEnrollInSequenceAction,
  bulkDeleteContactsAction,
  bulkExportContactsAction,
} from "@/lib/actions/bulk-contacts";
import type { SequenceRow } from "@/lib/canopy/automation/sequences";

interface Props {
  selectedIds: number[];
  sequences: SequenceRow[];
  onClear: () => void;
  onMutated: () => void;
}

export default function BulkActionsBar({ selectedIds, sequences, onClear, onMutated }: Props) {
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"none" | "add_tag" | "remove_tag" | "enroll" | "delete">("none");
  const [tag, setTag] = useState("");
  const [sequenceId, setSequenceId] = useState<number>(sequences[0]?.id ?? 0);
  const [status, setStatus] = useState<{ tone: "ok" | "err"; message: string } | null>(null);

  function reset() {
    setMode("none");
    setTag("");
    setStatus(null);
  }

  function handleAddTag() {
    if (!tag.trim()) return;
    setStatus(null);
    start(async () => {
      const r = await bulkAddTagAction({ contact_ids: selectedIds, tag });
      if (!r.ok) {
        setStatus({ tone: "err", message: r.error });
        return;
      }
      setStatus({ tone: "ok", message: `Tagged ${r.affected} contact${r.affected === 1 ? "" : "s"} with "${tag}".` });
      reset();
      onMutated();
    });
  }

  function handleRemoveTag() {
    if (!tag.trim()) return;
    setStatus(null);
    start(async () => {
      const r = await bulkRemoveTagAction({ contact_ids: selectedIds, tag });
      if (!r.ok) {
        setStatus({ tone: "err", message: r.error });
        return;
      }
      setStatus({ tone: "ok", message: `Removed "${tag}" from ${r.affected} contact${r.affected === 1 ? "" : "s"}.` });
      reset();
      onMutated();
    });
  }

  function handleEnroll() {
    if (!sequenceId) return;
    setStatus(null);
    start(async () => {
      const r = await bulkEnrollInSequenceAction({ contact_ids: selectedIds, sequence_id: sequenceId });
      if (!r.ok) {
        setStatus({ tone: "err", message: r.error });
        return;
      }
      setStatus({ tone: "ok", message: `Enrolled ${r.affected} of ${selectedIds.length} contacts.` });
      reset();
      onMutated();
    });
  }

  function handleDelete() {
    if (!confirm(`Permanently delete ${selectedIds.length} contact${selectedIds.length === 1 ? "" : "s"} and all their activities, deals, and notes?`)) {
      return;
    }
    setStatus(null);
    start(async () => {
      const r = await bulkDeleteContactsAction({ contact_ids: selectedIds });
      if (!r.ok) {
        setStatus({ tone: "err", message: r.error });
        return;
      }
      setStatus({ tone: "ok", message: `Deleted ${r.affected} contact${r.affected === 1 ? "" : "s"}.` });
      onClear();
      onMutated();
    });
  }

  function handleExport() {
    setStatus(null);
    start(async () => {
      const r = await bulkExportContactsAction({ contact_ids: selectedIds });
      if (!r.ok) {
        setStatus({ tone: "err", message: r.error });
        return;
      }
      const blob = new Blob([r.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = r.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus({ tone: "ok", message: `Exported ${selectedIds.length} contact${selectedIds.length === 1 ? "" : "s"}.` });
    });
  }

  return (
    <section className="mb-3 rounded-xl border border-pink-200 bg-pink-50/60 p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-semibold text-pink-900">
          {selectedIds.length} selected
        </p>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-xs text-pink-800 hover:text-pink-950"
        >
          <X className="h-3 w-3" />
          Clear
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <BulkButton icon={TagIcon} label="Add tag" onClick={() => setMode("add_tag")} disabled={pending} />
          <BulkButton icon={TagsIcon} label="Remove tag" onClick={() => setMode("remove_tag")} disabled={pending} />
          <BulkButton
            icon={Send}
            label="Enroll in sequence"
            onClick={() => setMode("enroll")}
            disabled={pending || sequences.length === 0}
          />
          <BulkButton icon={Download} label="Export CSV" onClick={handleExport} disabled={pending} />
          <BulkButton icon={Trash2} label="Delete" onClick={handleDelete} disabled={pending} tone="danger" />
        </div>
      </div>

      {mode === "add_tag" || mode === "remove_tag" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="tag (e.g. hot-lead)"
            className="flex-1 min-w-[200px] rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm shadow-sm"
            autoFocus
          />
          <button
            type="button"
            onClick={mode === "add_tag" ? handleAddTag : handleRemoveTag}
            disabled={pending || !tag.trim()}
            className="inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === "add_tag" ? "Apply tag" : "Remove tag"}
          </button>
          <button type="button" onClick={reset} className="text-xs text-zinc-500 hover:text-zinc-900">
            Cancel
          </button>
        </div>
      ) : null}

      {mode === "enroll" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={sequenceId}
            onChange={(e) => setSequenceId(Number(e.target.value))}
            className="flex-1 min-w-[200px] rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm shadow-sm"
          >
            {sequences.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status}, {s.step_count} steps)
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleEnroll}
            disabled={pending || !sequenceId}
            className="inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enroll
          </button>
          <button type="button" onClick={reset} className="text-xs text-zinc-500 hover:text-zinc-900">
            Cancel
          </button>
        </div>
      ) : null}

      {status ? (
        <p className={`mt-2 text-xs ${status.tone === "ok" ? "text-emerald-700" : "text-rose-700"}`}>
          {status.message}
        </p>
      ) : null}
    </section>
  );
}

function BulkButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "danger";
}) {
  const cls =
    tone === "danger"
      ? "border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
      : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium shadow-sm disabled:opacity-50 ${cls}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
