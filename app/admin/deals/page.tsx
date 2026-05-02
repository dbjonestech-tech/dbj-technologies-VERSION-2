import type { Metadata } from "next";
import Link from "next/link";
import {
  getDealsForKanban,
  getDealRollups,
  formatDealValue,
} from "@/lib/services/deals";
import { getSessionRole, getQueryOwnerFilter } from "@/lib/canopy/rbac";
import PageHeader from "../PageHeader";
import DealKanbanBoard from "./DealKanbanBoard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Deals",
  robots: { index: false, follow: false, nocache: true },
};

export default async function DealsPage() {
  const sr = await getSessionRole();
  const ownerFilter = getQueryOwnerFilter(sr);
  const [byStage, rollups] = await Promise.all([
    getDealsForKanban(ownerFilter),
    getDealRollups(),
  ]);

  const empty =
    byStage.new.length === 0 &&
    byStage.contacted.length === 0 &&
    byStage.qualified.length === 0 &&
    byStage.proposal.length === 0 &&
    byStage.won.length === 0 &&
    byStage.lost.length === 0;

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <PageHeader
          palette="violet"
          section="Relationships"
          pageName="Deals"
          description="Every active opportunity, scoped per-deal so one contact can have multiple deals over time. Move a deal through New, Contacted, Qualified, Proposal via the per-card stage dropdown. Close as Won or Lost from the deal's detail page so the outcome and loss reason are captured."
        />

        <RollupsRow
          weighted={rollups.weighted_pipeline_cents}
          unweighted={rollups.unweighted_pipeline_cents}
          closedWonMonth={rollups.closed_won_this_month_cents}
          openCount={rollups.open_count}
          wonCount={rollups.won_this_month_count}
          lostCount={rollups.lost_this_month_count}
        />

        {empty ? (
          <EmptyState />
        ) : (
          <DealKanbanBoard byStage={byStage} />
        )}
      </div>
    </div>
  );
}

function RollupsRow({
  weighted,
  unweighted,
  closedWonMonth,
  openCount,
  wonCount,
  lostCount,
}: {
  weighted: number;
  unweighted: number;
  closedWonMonth: number;
  openCount: number;
  wonCount: number;
  lostCount: number;
}) {
  return (
    <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <RollupTile
        label="Weighted pipeline"
        value={formatDealValue(weighted)}
        sub={`${openCount} open deal${openCount === 1 ? "" : "s"}`}
        accent="violet"
      />
      <RollupTile
        label="Unweighted pipeline"
        value={formatDealValue(unweighted)}
        sub="Sum of all open deal values"
        accent="zinc"
      />
      <RollupTile
        label="Closed-Won this month"
        value={formatDealValue(closedWonMonth)}
        sub={`${wonCount} won · ${lostCount} lost`}
        accent="emerald"
      />
    </section>
  );
}

function RollupTile({
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
  const accentBar =
    accent === "violet"
      ? "bg-violet-500"
      : accent === "emerald"
        ? "bg-emerald-500"
        : "bg-zinc-400";
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${accentBar}`} />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </p>
      </div>
      <p className={`mt-2 font-mono text-3xl font-semibold ${accentText}`}>{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{sub}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center">
      <p className="font-display text-lg font-semibold text-zinc-900">
        No deals yet
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        Create a deal from any contact's detail page, or run migration 025 if you have not yet:
      </p>
      <p className="mt-3 inline-block rounded bg-zinc-100 px-3 py-1.5 font-mono text-[11px] text-zinc-700">
        node --env-file=.env.local scripts/run-migration.mjs lib/db/migrations/025_deals.sql
      </p>
      <p className="mt-4">
        <Link
          href="/admin/contacts"
          className="text-sm font-semibold text-violet-700 hover:underline"
        >
          Open Contacts →
        </Link>
      </p>
    </div>
  );
}
