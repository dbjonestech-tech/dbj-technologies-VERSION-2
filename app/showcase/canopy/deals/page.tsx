import { DEMO_DEALS, DEMO_PIPELINE, formatUsd } from "@/lib/demo/fixtures";
import type { DealStage } from "@/lib/services/deals";

const STAGES: DealStage[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
];

const STAGE_LABEL: Record<DealStage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

const STAGE_TINT: Record<DealStage, string> = {
  new: "border-blue-200 bg-blue-50/50",
  contacted: "border-amber-200 bg-amber-50/50",
  qualified: "border-violet-200 bg-violet-50/50",
  proposal: "border-cyan-200 bg-cyan-50/50",
  won: "border-emerald-200 bg-emerald-50/50",
  lost: "border-zinc-200 bg-zinc-50/50",
};

const STAGE_DOT: Record<DealStage, string> = {
  new: "bg-blue-500",
  contacted: "bg-amber-500",
  qualified: "bg-violet-500",
  proposal: "bg-cyan-500",
  won: "bg-emerald-500",
  lost: "bg-zinc-400",
};

export default function ShowcaseDealsPage() {
  const byStage = STAGES.reduce(
    (acc, s) => {
      acc[s] = DEMO_DEALS.filter((d) => d.stage === s);
      return acc;
    },
    {} as Record<DealStage, typeof DEMO_DEALS>
  );

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-700">
            Relationships
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Deals
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Every active opportunity, scoped per-deal so one contact
            can have multiple deals over time. Move a deal through New,
            Contacted, Qualified, Proposal via the per-card stage
            dropdown. Close as Won or Lost from the deal's detail
            page.
          </p>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Weighted pipeline"
            value={formatUsd(DEMO_PIPELINE.weightedCents)}
            sub={`${DEMO_PIPELINE.openCount} open deals`}
            accent="violet"
          />
          <Stat
            label="Unweighted pipeline"
            value={formatUsd(DEMO_PIPELINE.unweightedCents)}
            sub="Sum of all open deal values"
            accent="zinc"
          />
          <Stat
            label="Closed-Won this month"
            value={formatUsd(DEMO_PIPELINE.closedWonMonthCents)}
            sub={`${DEMO_PIPELINE.wonMonthCount} won`}
            accent="emerald"
          />
          <Stat
            label="Avg cycle (won)"
            value="22d"
            sub="Discovery to close"
            accent="zinc"
          />
        </section>

        <section className="overflow-x-auto pb-2">
          <div className="grid min-w-[1100px] grid-cols-6 gap-3">
            {STAGES.map((stage) => {
              const cards = byStage[stage];
              const total = cards.reduce(
                (s, d) => s + Number(d.valueCents),
                0
              );
              return (
                <div
                  key={stage}
                  className={`flex flex-col rounded-xl border p-3 ${STAGE_TINT[stage]}`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-700">
                      <span
                        aria-hidden="true"
                        className={`inline-block h-1.5 w-1.5 rounded-full ${STAGE_DOT[stage]}`}
                      />
                      {STAGE_LABEL[stage]}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {cards.length}
                    </span>
                  </div>
                  <p className="mb-3 font-mono text-xs text-zinc-600">
                    {formatUsd(total)}
                  </p>
                  <ol className="space-y-2">
                    {cards.map((d) => (
                      <li
                        key={d.id}
                        className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow"
                      >
                        <p className="line-clamp-2 text-sm font-semibold text-zinc-900">
                          {d.name}
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          {d.contactName} · {d.contactCompany}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-zinc-900">
                            {formatUsd(d.valueCents)}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            {d.probabilityPct}%
                          </span>
                        </div>
                      </li>
                    ))}
                    {cards.length === 0 ? (
                      <li className="rounded-lg border border-dashed border-zinc-200 px-2 py-3 text-center text-[11px] text-zinc-400">
                        no deals
                      </li>
                    ) : null}
                  </ol>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: "violet" | "emerald" | "zinc";
}) {
  const accentText =
    accent === "violet"
      ? "text-violet-700"
      : accent === "emerald"
        ? "text-emerald-700"
        : "text-zinc-700";
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={`mt-2 font-mono text-2xl font-semibold ${accentText}`}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-zinc-500">{sub}</p>
    </div>
  );
}
