import type { Metadata } from "next";
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
          description="Where every contact sits in the engagement lifecycle. Move cards through New, Contacted, Qualified, Proposal, Won, Lost via the per-card status menu."
        />

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
