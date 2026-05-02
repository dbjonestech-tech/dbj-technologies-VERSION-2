"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import {
  archiveTemplateAction,
  createTemplateAction,
  updateTemplateAction,
} from "@/lib/actions/email";
import { KNOWN_MERGE_FIELDS } from "@/lib/email/render";

interface TemplateRow {
  id: number;
  name: string;
  subject: string;
  bodyMarkdown: string;
  mergeFields: string[];
  updatedAt: string;
}

interface Props {
  ownerEmail: string;
  initial: TemplateRow[];
}

export default function TemplatesClient({ ownerEmail, initial }: Props) {
  const [rows, setRows] = useState<TemplateRow[]>(initial);
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", subject: "", bodyMarkdown: "" });
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function reset() {
    setEditing(null);
    setCreating(false);
    setDraft({ name: "", subject: "", bodyMarkdown: "" });
  }

  function startCreate() {
    setEditing(null);
    setCreating(true);
    setDraft({ name: "", subject: "", bodyMarkdown: "" });
    setError(null);
    setInfo(null);
  }

  function startEdit(row: TemplateRow) {
    setCreating(false);
    setEditing(row);
    setDraft({
      name: row.name,
      subject: row.subject,
      bodyMarkdown: row.bodyMarkdown,
    });
    setError(null);
    setInfo(null);
  }

  function save() {
    if (!draft.name.trim() || !draft.subject.trim() || !draft.bodyMarkdown.trim()) {
      setError("Name, subject, and body are all required.");
      return;
    }
    setError(null);
    setInfo(null);
    start(async () => {
      if (creating) {
        const r = await createTemplateAction(draft);
        if (!r.ok) {
          setError(r.error ?? "Create failed.");
          return;
        }
        setRows((prev) => [
          {
            id: r.id!,
            name: draft.name.trim(),
            subject: draft.subject.trim(),
            bodyMarkdown: draft.bodyMarkdown,
            mergeFields: detectFields(draft.subject, draft.bodyMarkdown),
            updatedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setInfo("Template created.");
        reset();
      } else if (editing) {
        const r = await updateTemplateAction({
          id: editing.id,
          ...draft,
        });
        if (!r.ok) {
          setError(r.error ?? "Update failed.");
          return;
        }
        setRows((prev) =>
          prev.map((p) =>
            p.id === editing.id
              ? {
                  ...p,
                  name: draft.name.trim(),
                  subject: draft.subject.trim(),
                  bodyMarkdown: draft.bodyMarkdown,
                  mergeFields: detectFields(draft.subject, draft.bodyMarkdown),
                  updatedAt: new Date().toISOString(),
                }
              : p
          )
        );
        setInfo("Template updated.");
        reset();
      }
    });
  }

  function archive(id: number) {
    if (!confirm("Archive this template? It will be hidden from the compose picker.")) return;
    start(async () => {
      const r = await archiveTemplateAction(id);
      if (!r.ok) {
        setError(r.error ?? "Archive failed.");
        return;
      }
      setRows((prev) => prev.filter((p) => p.id !== id));
      setInfo("Template archived.");
      if (editing?.id === id) reset();
    });
  }

  return (
    <section className="mt-8 space-y-6">
      <header className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Owner: <span className="font-mono text-zinc-700">{ownerEmail}</span>
        </p>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
        >
          <Plus className="h-3 w-3" /> New template
        </button>
      </header>

      {(creating || editing) && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 font-display text-sm font-semibold text-zinc-900">
            {creating ? "New template" : `Editing: ${editing?.name}`}
          </h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Name
              </label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, name: e.target.value }))
                }
                className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                placeholder="e.g. Pathlight follow-up"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Subject
              </label>
              <input
                type="text"
                value={draft.subject}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, subject: e.target.value }))
                }
                className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm font-mono"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Body
              </label>
              <textarea
                value={draft.bodyMarkdown}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, bodyMarkdown: e.target.value }))
                }
                rows={10}
                className="w-full rounded-md border border-zinc-300 px-2 py-1.5 font-mono text-sm"
              />
            </div>
            <details className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs">
              <summary className="cursor-pointer font-medium text-zinc-800">
                Available merge fields
              </summary>
              <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-[11px] text-zinc-700">
                {KNOWN_MERGE_FIELDS.map((f) => (
                  <li key={f}>{`{{${f}}}`}</li>
                ))}
              </ul>
            </details>

            {error && (
              <p className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-900">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={reset}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {pending && <Loader2 className="h-3 w-3 animate-spin" />}
                <Save className="h-3 w-3" /> Save template
              </button>
            </div>
          </div>
        </div>
      )}

      {info && !error && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900">
          {info}
        </p>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white">
        <header className="border-b border-zinc-100 px-5 py-3">
          <h2 className="font-display text-sm font-semibold text-zinc-900">
            Your templates
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {rows.length} active template{rows.length === 1 ? "" : "s"}.
          </p>
        </header>
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-500">
            No templates yet. Click <strong>New template</strong> above to add one.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {rows.map((t) => (
              <li
                key={t.id}
                className="flex items-start justify-between gap-4 px-5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-900">{t.name}</p>
                  <p className="mt-0.5 truncate font-mono text-xs text-zinc-500">
                    {t.subject}
                  </p>
                  {t.mergeFields.length > 0 && (
                    <p className="mt-1 flex flex-wrap gap-1 text-[10px]">
                      {t.mergeFields.map((f) => (
                        <span
                          key={f}
                          className="rounded bg-sky-50 px-1.5 py-0.5 font-mono text-sky-800"
                        >
                          {f}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(t)}
                    className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => archive(t.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3 w-3" /> Archive
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function detectFields(subject: string, body: string): string[] {
  const re = /\{\{\s*([\w.]+)\s*\}\}/g;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(subject)) !== null) set.add(m[1]!);
  while ((m = re.exec(body)) !== null) set.add(m[1]!);
  return Array.from(set).sort();
}
