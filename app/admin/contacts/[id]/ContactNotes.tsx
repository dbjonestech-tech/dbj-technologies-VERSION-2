"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import type { ContactNoteEntry } from "@/lib/services/contacts";
import { addNoteAction, deleteNoteAction } from "@/lib/actions/contacts";

/* Notes input + manual-note delete affordances. The full chronological
 * timeline lives on the server-rendered detail page; this component
 * only handles the writable surface (input at the top + per-note
 * delete buttons inline below). After a successful add we clear the
 * textarea and rely on revalidatePath inside the Server Action to
 * surface the new note in the timeline on the next render. */

export default function ContactNotes({
  contactId,
  notes,
}: {
  contactId: number;
  notes: ContactNoteEntry[];
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    const content = draft.trim();
    if (!content) return;
    startTransition(async () => {
      const result = await addNoteAction(contactId, content);
      if (result.ok) {
        setDraft("");
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  function onDelete(noteId: number) {
    startTransition(async () => {
      const result = await deleteNoteAction(noteId, contactId);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  const manualNotes = notes.filter((n) => n.noteType === "note");

  return (
    <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        Add a note
      </p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        placeholder="Anything to remember about this contact..."
        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-pink-400 focus:outline-none"
      />
      {error ? (
        <p className="mt-2 text-xs text-red-700">{error}</p>
      ) : null}
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[11px] text-zinc-500">
          {manualNotes.length} manual note{manualNotes.length === 1 ? "" : "s"} on file.
        </p>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !draft.trim()}
          className="rounded-md bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Add note"}
        </button>
      </div>

      {manualNotes.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {manualNotes.map((n) => (
            <li
              key={n.id}
              className="flex items-start gap-2 rounded-md border border-zinc-200 bg-white p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap text-sm text-zinc-900">
                  {n.content}
                </p>
                <p className="mt-1 text-[10px] text-zinc-400">
                  {n.createdBy ? `${n.createdBy} · ` : ""}
                  {new Date(n.createdAt).toLocaleString("en-US")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Delete this note?")) onDelete(n.id);
                }}
                aria-label="Delete note"
                className="rounded-md p-1 text-zinc-400 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
