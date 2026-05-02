"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createSequenceAction, deleteSequenceAction, updateSequenceAction } from "@/lib/actions/sequences";
import type { SequenceRow, SequenceStatus } from "@/lib/canopy/automation/sequences";

interface Props {
  initial: SequenceRow[];
}

const STATUS_TONES: Record<SequenceStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700",
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  archived: "bg-zinc-100 text-zinc-400",
};

export default function SequencesListClient({ initial }: Props) {
  const [sequences, setSequences] = useState<SequenceRow[]>(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const router = useRouter();

  function handleCreate() {
    if (!draftName.trim()) return;
    setError(null);
    start(async () => {
      const r = await createSequenceAction({ name: draftName.trim() });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setDraftName("");
      setCreating(false);
      router.push(`/admin/sequences/${r.id}`);
    });
  }

  function handleStatus(id: number, status: SequenceStatus) {
    setError(null);
    setSequences((s) => s.map((row) => (row.id === id ? { ...row, status } : row)));
    start(async () => {
      const r = await updateSequenceAction({ id, status });
      if (!r.ok) setError(r.error);
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this sequence and all its enrollments?")) return;
    setError(null);
    start(async () => {
      const r = await deleteSequenceAction(id);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSequences((s) => s.filter((row) => row.id !== id));
    });
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-600">
          {sequences.length === 0 ? "No sequences yet." : `${sequences.length} sequence${sequences.length === 1 ? "" : "s"}.`}
        </p>
        {creating ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Sequence name"
              className="block w-64 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={pending || !draftName.trim()}
              className="inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm transition-colors hover:bg-emerald-100 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setDraftName("");
              }}
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
          >
            <Plus className="h-4 w-4" />
            New sequence
          </button>
        )}
      </div>

      {error ? <p className="text-xs text-rose-700">{error}</p> : null}

      {sequences.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Steps</th>
                <th className="px-4 py-2">Active enrollments</th>
                <th className="px-4 py-2">Updated</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sequences.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/sequences/${s.id}`} className="font-medium text-zinc-900 hover:underline">
                      {s.name}
                    </Link>
                    {s.description ? <p className="mt-0.5 text-xs text-zinc-500">{s.description}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={s.status}
                      onChange={(e) => handleStatus(s.id, e.target.value as SequenceStatus)}
                      disabled={pending}
                      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${STATUS_TONES[s.status]} disabled:opacity-50`}
                    >
                      <option value="draft">draft</option>
                      <option value="active">active</option>
                      <option value="paused">paused</option>
                      <option value="archived">archived</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{s.step_count}</td>
                  <td className="px-4 py-3 font-mono text-xs">{s.active_enrollments}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {new Date(s.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
