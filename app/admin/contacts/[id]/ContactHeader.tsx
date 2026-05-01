"use client";

import { useState, useTransition } from "react";
import { Pencil, Save, X } from "lucide-react";
import {
  CONTACT_STATUSES,
  type ContactRow,
  type ContactStatus,
} from "@/lib/services/contacts";
import { updateContactAction } from "@/lib/actions/contacts";

const STATUS_LABEL: Record<ContactStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

const STATUS_TINT: Record<ContactStatus, string> = {
  new: "bg-blue-100 text-blue-700 ring-blue-300",
  contacted: "bg-amber-100 text-amber-700 ring-amber-300",
  qualified: "bg-violet-100 text-violet-700 ring-violet-300",
  proposal: "bg-cyan-100 text-cyan-700 ring-cyan-300",
  won: "bg-emerald-100 text-emerald-700 ring-emerald-300",
  lost: "bg-zinc-100 text-zinc-600 ring-zinc-300",
};

const SOURCE_LABEL: Record<string, string> = {
  pathlight_scan: "Pathlight scan",
  contact_form: "Contact form",
  manual: "Manual entry",
  client_import: "Engagement client",
};

export default function ContactHeader({ contact }: { contact: ContactRow }) {
  const [c, setC] = useState(contact);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function applyPatch(patch: Parameters<typeof updateContactAction>[1]) {
    startTransition(async () => {
      const result = await updateContactAction(c.id, patch);
      if (result.ok) {
        setC(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  const isOverdue =
    c.followUpDate !== null &&
    new Date(c.followUpDate + "T00:00:00.000Z").getTime() <
      new Date().setUTCHours(0, 0, 0, 0);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6">
      <dl className="space-y-4 text-sm">
        <Field
          label="Name"
          value={c.name ?? ""}
          onSave={(v) => applyPatch({ name: v.trim() || null })}
          pending={pending}
        />
        <Row label="Email">
          <span className="font-mono text-zinc-900">{c.email}</span>
          <p className="text-[10px] text-zinc-400">
            Email is the unique identifier and is not editable.
          </p>
        </Row>
        <Field
          label="Company"
          value={c.company ?? ""}
          onSave={(v) => applyPatch({ company: v.trim() || null })}
          pending={pending}
        />
        <Field
          label="Phone"
          value={c.phone ?? ""}
          onSave={(v) => applyPatch({ phone: v.trim() || null })}
          pending={pending}
        />
        <Field
          label="Website"
          value={c.website ?? ""}
          onSave={(v) => applyPatch({ website: v.trim() || null })}
          pending={pending}
          render={(v) =>
            v ? (
              <a
                href={v.startsWith("http") ? v : `https://${v}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-700 hover:underline"
              >
                {v}
              </a>
            ) : null
          }
        />
        <Row label="Status">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${STATUS_TINT[c.status]}`}
            >
              {STATUS_LABEL[c.status]}
            </span>
            <select
              value={c.status}
              onChange={(e) => applyPatch({ status: e.target.value as ContactStatus })}
              disabled={pending}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 focus:border-pink-400 focus:outline-none disabled:opacity-60"
            >
              {CONTACT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
        </Row>
        <Row label="Follow-up">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={c.followUpDate ?? ""}
              onChange={(e) =>
                applyPatch({ followUpDate: e.target.value || null })
              }
              disabled={pending}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 focus:border-pink-400 focus:outline-none disabled:opacity-60"
            />
            {c.followUpDate ? (
              <button
                type="button"
                onClick={() => applyPatch({ followUpDate: null })}
                disabled={pending}
                className="text-[11px] text-zinc-500 hover:text-zinc-900"
              >
                Clear
              </button>
            ) : null}
            {isOverdue ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-300">
                Overdue
              </span>
            ) : null}
          </div>
        </Row>
        <Row label="Source">
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">
            {SOURCE_LABEL[c.source] ?? c.source}
          </span>
        </Row>
        <Row label="Created">
          <p className="font-mono text-[11px] text-zinc-600">
            {new Date(c.createdAt).toLocaleString("en-US")}
          </p>
        </Row>
        {c.lastActivityAt ? (
          <Row label="Last activity">
            <p className="font-mono text-[11px] text-zinc-600">
              {new Date(c.lastActivityAt).toLocaleString("en-US")}
            </p>
          </Row>
        ) : null}
      </dl>
      {error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-3">
      <dt className="pt-0.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

function Field({
  label,
  value,
  onSave,
  pending,
  render,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  pending: boolean;
  render?: (v: string) => React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <Row label={label}>
        <div className="flex items-center gap-2">
          <span className="text-zinc-900">
            {value ? (render ? render(value) : value) : (
              <span className="text-zinc-400">Not set</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => {
              setDraft(value);
              setEditing(true);
            }}
            aria-label={`Edit ${label.toLowerCase()}`}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      </Row>
    );
  }

  return (
    <Row label={label}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft !== value) onSave(draft);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (draft !== value) onSave(draft);
              setEditing(false);
            } else if (e.key === "Escape") {
              setEditing(false);
              setDraft(value);
            }
          }}
          disabled={pending}
          className="flex-1 min-w-[200px] rounded-md border border-pink-300 bg-white px-2 py-1 text-xs text-zinc-900 focus:border-pink-500 focus:outline-none disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setDraft(value);
          }}
          aria-label="Cancel edit"
          className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <X className="h-3 w-3" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            if (draft !== value) onSave(draft);
            setEditing(false);
          }}
          aria-label="Save edit"
          className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50"
        >
          <Save className="h-3 w-3" />
        </button>
      </div>
    </Row>
  );
}
