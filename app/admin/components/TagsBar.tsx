"use client";

import { useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { addTagAction, removeTagAction } from "@/lib/actions/tags";

interface Props {
  entityType: "contact" | "deal";
  entityId: number;
  initialTags: string[];
}

export default function TagsBar({ entityType, entityId, initialTags }: Props) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add() {
    const value = draft.trim();
    if (!value) return;
    setError(null);
    start(async () => {
      const r = await addTagAction({ entityType, entityId, tag: value });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setTags(r.tags);
      setDraft("");
    });
  }

  function remove(tag: string) {
    setError(null);
    setTags((t) => t.filter((x) => x !== tag));
    start(async () => {
      const r = await removeTagAction({ entityType, entityId, tag });
      if (!r.ok) {
        setError(r.error);
        setTags(initialTags);
      } else {
        setTags(r.tags);
      }
    });
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Tags
        </h3>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" /> : null}
      </header>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.length === 0 ? (
          <span className="text-xs text-zinc-400">No tags yet</span>
        ) : (
          tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200"
            >
              {t}
              <button
                type="button"
                aria-label={`Remove ${t}`}
                onClick={() => remove(t)}
                disabled={pending}
                className="text-violet-500 hover:text-violet-800 disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          disabled={pending}
          placeholder="Add tag and press Enter"
          className="min-w-[160px] flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
        />
      </div>
      {error ? (
        <p className="mt-2 text-[11px] text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
