"use client";

import { useState, useTransition } from "react";
import {
  closeDealLostAction,
  closeDealWonAction,
  reopenDealAction,
  updateDealFieldAction,
  changeDealStageAction,
} from "@/lib/actions/deals";
import {
  DEAL_STAGES,
  formatDealValue,
  type DealRow,
  type DealStage,
} from "@/lib/services/deals";

const STAGE_LABEL: Record<DealStage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

interface Props {
  deal: DealRow;
}

export default function DealDetailClient({ deal: initial }: Props) {
  const [deal, setDeal] = useState<DealRow>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [closeMode, setCloseMode] = useState<"won" | "lost" | null>(null);
  const [closeWonValue, setCloseWonValue] = useState<string>(
    String((Number(initial.value_cents) / 100).toFixed(2))
  );
  const [lossReason, setLossReason] = useState<string>("");

  const isClosed = deal.closed_at !== null;

  function applyField(
    field: "name" | "value_cents" | "expected_close_at" | "probability_pct" | "notes",
    value: string | number | null
  ) {
    setError(null);
    start(async () => {
      const result = await updateDealFieldAction(deal.id, field, value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDeal(result.data);
    });
  }

  function applyStage(next: DealStage) {
    setError(null);
    start(async () => {
      const result = await changeDealStageAction(deal.id, next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDeal(result.data);
    });
  }

  function applyCloseWon() {
    setError(null);
    const dollars = Number(closeWonValue);
    start(async () => {
      const result = await closeDealWonAction(deal.id, Number.isFinite(dollars) ? dollars : undefined);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDeal(result.data);
      setCloseMode(null);
    });
  }

  function applyCloseLost() {
    setError(null);
    if (!lossReason.trim()) {
      setError("Loss reason is required");
      return;
    }
    start(async () => {
      const result = await closeDealLostAction(deal.id, lossReason.trim());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDeal(result.data);
      setCloseMode(null);
    });
  }

  function applyReopen() {
    setError(null);
    start(async () => {
      const result = await reopenDealAction(deal.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDeal(result.data);
    });
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Deal name
            </p>
            <InlineText
              value={deal.name}
              disabled={pending || isClosed}
              onSave={(v) => applyField("name", v)}
            />
          </div>
          <StageBadge stage={deal.stage} closed={isClosed} won={deal.won} />
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <Tile
            label="Value"
            value={formatDealValue(Number(deal.value_cents), deal.currency)}
          >
            <InlineNumber
              valueCents={Number(deal.value_cents)}
              disabled={pending || isClosed}
              onSave={(cents) => applyField("value_cents", cents)}
            />
          </Tile>
          <Tile label="Probability" value={`${deal.probability_pct}%`}>
            <InlineNumber
              valueCents={deal.probability_pct}
              raw
              suffix="%"
              disabled={pending || isClosed}
              onSave={(v) => applyField("probability_pct", v)}
              clamp={[0, 100]}
            />
          </Tile>
          <Tile
            label="Expected close"
            value={deal.expected_close_at ?? "Not set"}
          >
            <InlineDate
              value={deal.expected_close_at}
              disabled={pending || isClosed}
              onSave={(v) => applyField("expected_close_at", v)}
            />
          </Tile>
        </div>

        {!isClosed ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Stage
            </label>
            <select
              value={deal.stage}
              onChange={(e) => applyStage(e.target.value as DealStage)}
              disabled={pending}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
            >
              {DEAL_STAGES.map((s) => (
                <option key={s} value={s} disabled={s === "won" || s === "lost"}>
                  {STAGE_LABEL[s]}
                  {s === "won" || s === "lost" ? " (use Close button)" : ""}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <header className="mb-3">
          <h2 className="font-display text-base font-semibold text-zinc-900">
            Notes
          </h2>
        </header>
        <InlineTextArea
          value={deal.notes ?? ""}
          disabled={pending || isClosed}
          onSave={(v) => applyField("notes", v.length === 0 ? null : v)}
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <header className="mb-3">
          <h2 className="font-display text-base font-semibold text-zinc-900">
            Outcome
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Closing a deal records its final value, locks all fields, and updates the linked contact's primary stage.
          </p>
        </header>

        {isClosed ? (
          <div className="space-y-3">
            <p className="text-sm">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                  deal.won
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                }`}
              >
                {deal.won ? "Won" : "Lost"}
              </span>{" "}
              <span className="text-zinc-600">
                {new Date(deal.closed_at!).toLocaleString()}
              </span>
            </p>
            {deal.loss_reason ? (
              <p className="text-sm text-zinc-700">
                <span className="font-semibold">Reason:</span> {deal.loss_reason}
              </p>
            ) : null}
            <button
              type="button"
              onClick={applyReopen}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
            >
              Reopen deal
            </button>
          </div>
        ) : closeMode === "won" ? (
          <div className="space-y-3">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Final value (USD)
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={closeWonValue}
                onChange={(e) => setCloseWonValue(e.target.value)}
                className="mt-1 block w-48 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={applyCloseWon}
                disabled={pending}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                Confirm Won
              </button>
              <button
                type="button"
                onClick={() => setCloseMode(null)}
                disabled={pending}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : closeMode === "lost" ? (
          <div className="space-y-3">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Loss reason (required)
              </span>
              <textarea
                value={lossReason}
                onChange={(e) => setLossReason(e.target.value)}
                rows={3}
                className="mt-1 block w-full max-w-lg rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                placeholder="Budget constraint, lost to competitor, timing not right, ..."
              />
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={applyCloseLost}
                disabled={pending}
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-700 disabled:opacity-50"
              >
                Confirm Lost
              </button>
              <button
                type="button"
                onClick={() => setCloseMode(null)}
                disabled={pending}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCloseMode("won")}
              disabled={pending}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              Close as Won
            </button>
            <button
              type="button"
              onClick={() => setCloseMode("lost")}
              disabled={pending}
              className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 shadow-sm transition-colors hover:bg-rose-100 disabled:opacity-50"
            >
              Close as Lost
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function StageBadge({
  stage,
  closed,
  won,
}: {
  stage: DealStage;
  closed: boolean;
  won: boolean | null;
}) {
  if (closed) {
    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ${
          won
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
            : "bg-rose-50 text-rose-700 ring-rose-200"
        }`}
      >
        {won ? "Won" : "Lost"}
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-violet-700 ring-1 ring-violet-200">
      {STAGE_LABEL[stage]}
    </span>
  );
}

function Tile({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold text-zinc-900">{value}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function InlineText({
  value,
  onSave,
  disabled,
}: {
  value: string;
  onSave: (v: string) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <input
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value && draft.trim().length > 0) onSave(draft.trim());
      }}
      disabled={disabled}
      className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-display text-2xl font-semibold text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:bg-zinc-50 disabled:opacity-70"
    />
  );
}

function InlineNumber({
  valueCents,
  raw,
  suffix,
  disabled,
  onSave,
  clamp,
}: {
  valueCents: number;
  raw?: boolean;
  suffix?: string;
  disabled?: boolean;
  onSave: (v: number) => void;
  clamp?: [number, number];
}) {
  const [draft, setDraft] = useState(
    raw ? String(valueCents) : String((valueCents / 100).toFixed(2))
  );
  return (
    <div className="flex items-center gap-1 text-xs">
      <input
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const n = Number(draft);
          if (!Number.isFinite(n)) return;
          const clamped = clamp ? Math.max(clamp[0], Math.min(clamp[1], n)) : n;
          onSave(raw ? clamped : Math.round(clamped * 100));
        }}
        disabled={disabled}
        className="w-32 rounded border border-zinc-300 bg-white px-2 py-1 text-xs disabled:bg-zinc-50 disabled:opacity-70"
        min={clamp?.[0]}
        max={clamp?.[1]}
        step={raw ? 1 : "0.01"}
      />
      {suffix ? <span className="text-zinc-500">{suffix}</span> : null}
    </div>
  );
}

function InlineDate({
  value,
  onSave,
  disabled,
}: {
  value: string | null;
  onSave: (v: string | null) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="date"
      value={value ?? ""}
      onChange={(e) => onSave(e.target.value || null)}
      disabled={disabled}
      className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs disabled:bg-zinc-50 disabled:opacity-70"
    />
  );
}

function InlineTextArea({
  value,
  onSave,
  disabled,
}: {
  value: string;
  onSave: (v: string) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onSave(draft);
      }}
      rows={4}
      disabled={disabled}
      placeholder="Internal notes about this deal. Visible to admins only."
      className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:bg-zinc-50 disabled:opacity-70"
    />
  );
}
