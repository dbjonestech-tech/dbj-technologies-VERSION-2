"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  CONTACT_STATUSES,
  type ContactListRow,
  type ContactStatus,
} from "@/lib/services/contacts";
import { changeStatusAction } from "@/lib/actions/contacts";

const STATUS_LABEL: Record<ContactStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

const COLUMN_TINT: Record<ContactStatus, { bg: string; border: string; text: string }> = {
  new: {
    bg: "bg-blue-50/40",
    border: "border-blue-200",
    text: "text-blue-700",
  },
  contacted: {
    bg: "bg-amber-50/40",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  qualified: {
    bg: "bg-violet-50/40",
    border: "border-violet-200",
    text: "text-violet-700",
  },
  proposal: {
    bg: "bg-cyan-50/40",
    border: "border-cyan-200",
    text: "text-cyan-700",
  },
  won: {
    bg: "bg-emerald-50/40",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  lost: {
    bg: "bg-zinc-100/60",
    border: "border-zinc-200",
    text: "text-zinc-600",
  },
};

export default function PipelineBoard({
  byStatus,
  order,
}: {
  byStatus: Record<ContactStatus, ContactListRow[]>;
  order: ContactStatus[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
      {order.map((status) => {
        const tint = COLUMN_TINT[status];
        const cards = byStatus[status];
        return (
          <div
            key={status}
            className={`flex min-h-[300px] flex-col rounded-xl border ${tint.border} ${tint.bg} p-3`}
          >
            <header className="mb-3 flex items-center justify-between">
              <h2 className={`font-display text-sm font-semibold ${tint.text}`}>
                {STATUS_LABEL[status]}
              </h2>
              <span
                className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-semibold ${tint.text} ring-1 ring-inset ${tint.border}`}
              >
                {cards.length}
              </span>
            </header>
            <ul className="flex-1 space-y-2">
              {cards.length === 0 ? (
                <li className="rounded-md border border-dashed border-zinc-200 bg-white/50 p-3 text-center text-[11px] text-zinc-400">
                  Empty
                </li>
              ) : (
                cards.map((c) => <PipelineCard key={c.id} contact={c} />)
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function PipelineCard({ contact }: { contact: ContactListRow }) {
  const [pending, startTransition] = useTransition();
  const followUpOverdue =
    contact.followUpDate !== null &&
    new Date(contact.followUpDate + "T00:00:00.000Z").getTime() <
      new Date().setUTCHours(0, 0, 0, 0);

  return (
    <li className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/admin/contacts/${contact.id}`} className="block">
        <p className="text-sm font-semibold text-zinc-900">
          {contact.name || contact.email}
        </p>
        {contact.company ? (
          <p className="text-[11px] text-zinc-500">{contact.company}</p>
        ) : null}
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-600">
          {contact.source.replace("_", " ")}
        </span>
        {contact.lastActivityAt ? (
          <span className="text-zinc-400">
            {formatRel(contact.lastActivityAt)}
          </span>
        ) : null}
        {contact.followUpDate ? (
          <span
            className={`rounded px-1.5 py-0.5 ${
              followUpOverdue
                ? "bg-red-100 text-red-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            Follow-up {contact.followUpDate}
          </span>
        ) : null}
        {contact.scanCount > 0 ? (
          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-violet-700">
            {contact.scanCount} scan{contact.scanCount === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <select
          value={contact.status}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.value as ContactStatus;
            startTransition(async () => {
              await changeStatusAction(contact.id, next);
            });
          }}
          aria-label="Change status"
          className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-700 focus:border-pink-400 focus:outline-none disabled:opacity-60"
        >
          {CONTACT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <Link
          href={`/admin/contacts/${contact.id}`}
          className="text-[10px] font-semibold text-pink-700 hover:underline"
        >
          Open →
        </Link>
      </div>
    </li>
  );
}

function formatRel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h`;
  return `${Math.floor(ms / 86_400_000)}d`;
}
