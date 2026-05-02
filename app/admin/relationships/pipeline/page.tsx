import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getContacts, type ContactStatus } from "@/lib/services/contacts";
import PageHeader from "../../PageHeader";
import PipelineBoard from "./PipelineBoard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Pipeline",
  robots: { index: false, follow: false, nocache: true },
};

const STATUS_ORDER: ContactStatus[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
];

export default async function PipelinePage() {
  const all = await getContacts();
  const byStatus: Record<ContactStatus, typeof all> = {
    new: [],
    contacted: [],
    qualified: [],
    proposal: [],
    won: [],
    lost: [],
  };
  for (const row of all) {
    byStatus[row.status].push(row);
  }
  const total = all.length;
  const active =
    byStatus.new.length +
    byStatus.contacted.length +
    byStatus.qualified.length +
    byStatus.proposal.length;
  const won = byStatus.won.length;
  const lost = byStatus.lost.length;

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <PageHeader
          palette="rose"
          section="Relationships"
          pageName="Pipeline"
          description="Where every contact sits in the engagement lifecycle. This board moves contacts through their primary stage. For deal-level tracking with values, weighted forecasting, and won/lost outcomes, use the Deals board."
        />

        <Link
          href="/admin/deals"
          className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-violet-200 bg-gradient-to-br from-white via-violet-50/40 to-violet-50 p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div>
            <p className="font-display text-sm font-semibold text-zinc-900">
              Deal-level tracking lives at /admin/deals
            </p>
            <p className="mt-0.5 text-xs text-zinc-600">
              One contact can have multiple deals over time, each with its own value, probability, and close date. Weighted pipeline rollups and won/lost analytics live there.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            Open Deals <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </span>
        </Link>

        <PipelineBoard byStatus={byStatus} order={STATUS_ORDER} />

        <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-700">
            <span className="font-semibold text-zinc-900">{total}</span> total
            contact{total === 1 ? "" : "s"} ·{" "}
            <span className="font-semibold text-zinc-900">{active}</span> in
            active pipeline (new + contacted + qualified + proposal) ·{" "}
            <span className="font-semibold text-emerald-700">{won}</span> won ·{" "}
            <span className="font-semibold text-zinc-500">{lost}</span> lost
          </p>
        </section>
      </div>
    </div>
  );
}
