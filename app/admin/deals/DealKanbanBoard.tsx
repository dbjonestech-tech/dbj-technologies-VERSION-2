"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Briefcase, Calendar } from "lucide-react";
import {
  DEAL_STAGES,
  formatDealValue,
  type DealRow,
  type DealStage,
} from "@/lib/services/deals";
import { changeDealStageAction } from "@/lib/actions/deals";

const STAGE_LABEL: Record<DealStage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

const STAGE_TINT: Record<DealStage, { bg: string; border: string; text: string }> = {
  new:        { bg: "bg-blue-50/40",    border: "border-blue-200",    text: "text-blue-700" },
  contacted:  { bg: "bg-amber-50/40",   border: "border-amber-200",   text: "text-amber-700" },
  qualified:  { bg: "bg-violet-50/40",  border: "border-violet-200",  text: "text-violet-700" },
  proposal:   { bg: "bg-cyan-50/40",    border: "border-cyan-200",    text: "text-cyan-700" },
  won:        { bg: "bg-emerald-50/40", border: "border-emerald-200", text: "text-emerald-700" },
  lost:       { bg: "bg-zinc-100/60",   border: "border-zinc-200",    text: "text-zinc-600" },
};

interface Props {
  byStage: Record<DealStage, DealRow[]>;
}

export default function DealKanbanBoard({ byStage }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
      {DEAL_STAGES.map((stage) => {
        const tint = STAGE_TINT[stage];
        const cards = byStage[stage];
        const value = cards.reduce((s, c) => s + Number(c.value_cents), 0);
        return (
          <div
            key={stage}
            className={`flex min-h-[320px] flex-col rounded-xl border ${tint.border} ${tint.bg} p-3`}
          >
            <header className="mb-3">
              <div className="flex items-center justify-between">
                <h2 className={`font-display text-sm font-semibold ${tint.text}`}>
                  {STAGE_LABEL[stage]}
                </h2>
                <span
                  className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-semibold ${tint.text} ring-1 ring-inset ${tint.border}`}
                >
                  {cards.length}
                </span>
              </div>
              {value > 0 ? (
                <p className={`mt-1 font-mono text-[11px] ${tint.text}`}>
                  {formatDealValue(value)}
                </p>
              ) : null}
            </header>
            <ul className="flex-1 space-y-2">
              {cards.length === 0 ? (
                <li className="rounded-md border border-dashed border-zinc-200 bg-white/50 p-3 text-center text-[11px] text-zinc-400">
                  Empty
                </li>
              ) : (
                cards.map((deal) => <DealCard key={deal.id} deal={deal} />)
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function DealCard({ deal }: { deal: DealRow }) {
  const [pending, start] = useTransition();
  const closed = deal.closed_at !== null;
  const expectedClose = deal.expected_close_at;
  const overdue =
    !closed &&
    expectedClose !== null &&
    new Date(expectedClose + "T00:00:00.000Z").getTime() < new Date().setUTCHours(0, 0, 0, 0);

  return (
    <li className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/admin/deals/${deal.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-900">{deal.name}</p>
          <span className="font-mono text-xs font-semibold text-zinc-700">
            {formatDealValue(Number(deal.value_cents), deal.currency)}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          {deal.contact_name || deal.contact_email}
          {deal.contact_company ? ` · ${deal.contact_company}` : ""}
        </p>
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
        <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-600">
          <Briefcase className="h-3 w-3" aria-hidden="true" />
          {deal.probability_pct}%
        </span>
        {expectedClose ? (
          <span
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${
              overdue ? "bg-red-100 text-red-700" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            <Calendar className="h-3 w-3" aria-hidden="true" />
            {expectedClose}
          </span>
        ) : null}
        {deal.loss_reason ? (
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-500" title={deal.loss_reason}>
            Lost: {truncate(deal.loss_reason, 24)}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <select
          value={deal.stage}
          disabled={pending || closed}
          onChange={(e) => {
            const next = e.target.value as DealStage;
            if (next === deal.stage) return;
            start(async () => {
              const result = await changeDealStageAction(deal.id, next);
              if (!result.ok) {
                alert(result.error);
              }
            });
          }}
          aria-label="Change stage"
          className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-700 focus:border-violet-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {DEAL_STAGES.map((s) => (
            <option key={s} value={s} disabled={s === "won" || s === "lost"}>
              {STAGE_LABEL[s]}
              {s === "won" || s === "lost" ? " (close on detail)" : ""}
            </option>
          ))}
        </select>
        <Link
          href={`/admin/deals/${deal.id}`}
          className="text-[10px] font-semibold text-violet-700 hover:underline"
        >
          Open →
        </Link>
      </div>
    </li>
  );
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}
