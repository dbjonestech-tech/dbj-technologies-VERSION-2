"use client";

import { useState, useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { recomputeLeadScoreAction } from "@/lib/actions/lead-scoring";
import type { LeadScoreComponents } from "@/lib/canopy/lead-scoring";

interface Props {
  contactId: number;
  initialScore: number | null;
  initialComponents: Record<string, unknown> | null;
  computedAt: string | null;
}

export default function LeadScoreBadge({
  contactId,
  initialScore,
  initialComponents,
  computedAt: initialComputedAt,
}: Props) {
  const [score, setScore] = useState<number | null>(initialScore);
  const [components, setComponents] = useState<Record<string, unknown> | null>(initialComponents);
  const [computedAt, setComputedAt] = useState<string | null>(initialComputedAt);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function recompute() {
    setError(null);
    start(async () => {
      const r = await recomputeLeadScoreAction(contactId);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setScore(r.data.score);
      setComponents({ ...(r.data.components as unknown as Record<string, unknown>), inputs: r.data.inputs });
      setComputedAt(new Date().toISOString());
    });
  }

  const tone =
    score === null
      ? "bg-zinc-100 text-zinc-600 ring-zinc-200"
      : score >= 75
        ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
        : score >= 50
          ? "bg-amber-100 text-amber-700 ring-amber-200"
          : "bg-rose-100 text-rose-700 ring-rose-200";

  const cmp = (components ?? null) as (LeadScoreComponents & { inputs?: Record<string, unknown> }) | null;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-zinc-900">
            Lead score
          </h3>
          <p className="mt-0.5 text-xs text-zinc-600">
            Weighted composite of Pathlight, engagement, recency, touchpoints, deal value, and source. Tunable from Canopy controls.
          </p>
        </div>
        <button
          type="button"
          onClick={recompute}
          disabled={pending}
          aria-label="Recompute lead score"
          className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {pending ? "Computing" : "Recompute"}
        </button>
      </header>

      <div className="flex items-center gap-4">
        <div
          className={`flex h-20 w-20 flex-col items-center justify-center rounded-full ring-2 ring-inset ${tone}`}
        >
          <span className="font-mono text-2xl font-semibold">
            {score === null ? "-" : score}
          </span>
          <span className="text-[8px] uppercase tracking-wider opacity-80">score</span>
        </div>
        <div className="flex-1">
          {cmp ? (
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <ComponentBar label="Pathlight"   value={pickNumber(cmp.pathlight)} />
              <ComponentBar label="Engagement"  value={pickNumber(cmp.engagement)} />
              <ComponentBar label="Recency"     value={pickNumber(cmp.recency)} />
              <ComponentBar label="Touchpoints" value={pickNumber(cmp.touchpoints)} />
              <ComponentBar label="Deal value"  value={pickNumber(cmp.deal_value)} />
              <ComponentBar label="Source"      value={pickNumber(cmp.source)} />
            </div>
          ) : (
            <p className="text-xs text-zinc-500">
              No score yet. Click Recompute to compute the first score from current data.
            </p>
          )}
        </div>
      </div>

      {computedAt ? (
        <p className="mt-3 text-[11px] text-zinc-400">
          Computed {new Date(computedAt).toLocaleString()}
        </p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </section>
  );
}

function ComponentBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-zinc-600">{label}</span>
        <span className="font-mono text-zinc-900">{Math.round(value)}</span>
      </div>
      <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-zinc-100">
        <span
          className="block h-full rounded-full bg-violet-500"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function pickNumber(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}
