"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import {
  createProspectListAction,
  archiveProspectListAction,
} from "@/lib/actions/prospect-lists";
import type { ProspectList } from "@/lib/canopy/prospect-lists";

interface Props {
  lists: ProspectList[];
  gateBlocked: boolean;
  gateReason: string | null;
  remaining: number;
}

export default function ProspectingClient({
  lists,
  gateBlocked,
  gateReason,
  remaining,
}: Props) {
  const [rows, setRows] = useState<ProspectList[]>(lists);
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function handleCreate() {
    if (!draftName.trim()) return;
    setError(null);
    start(async () => {
      const r = await createProspectListAction({ name: draftName.trim() });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setDraftName("");
      setCreating(false);
      router.push(`/admin/prospecting/${r.data.id}`);
    });
  }

  function handleArchive(id: number) {
    if (!confirm("Archive this list?")) return;
    start(async () => {
      const r = await archiveProspectListAction({ listId: id });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setRows((rs) => rs.filter((x) => x.id !== id));
    });
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Scan budget
            </p>
            <p className="mt-1 font-mono text-base font-semibold text-zinc-900">
              {gateBlocked ? "Blocked" : `${remaining} remaining`}
            </p>
            {gateReason ? (
              <p className="mt-1 text-xs text-amber-700">{gateReason}</p>
            ) : null}
          </div>
          {creating ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="List name"
                className="block w-64 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={pending || !draftName.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setDraftName("");
                  setError(null);
                }}
                className="rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" /> New list
            </button>
          )}
        </div>
        {error ? (
          <p className="mt-3 text-xs text-red-700">{error}</p>
        ) : null}
      </section>

      {rows.length === 0 ? (
        <section className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-sm text-zinc-600">
            No prospect lists yet. Create one to start gathering candidates.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="canopy-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Status</th>
                <th className="text-right">Candidates</th>
                <th className="text-right">Scanned</th>
                <th className="text-left">Created by</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link
                      href={`/admin/prospecting/${l.id}`}
                      className="font-semibold text-zinc-900 hover:underline"
                    >
                      {l.name}
                    </Link>
                  </td>
                  <td className="text-xs text-zinc-600">{l.status}</td>
                  <td className="text-right font-mono text-xs">
                    {l.candidate_count ?? 0}
                  </td>
                  <td className="text-right font-mono text-xs">
                    {l.scanned_count ?? 0}
                  </td>
                  <td className="text-xs text-zinc-500">
                    {l.created_by_email ?? "system"}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => handleArchive(l.id)}
                      className="text-xs text-zinc-500 hover:text-red-700 hover:underline"
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
