import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "../PageHeader";
import { listSequences, formatDelay } from "@/lib/canopy/automation/sequences";
import SequencesListClient from "./SequencesListClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Sequences",
  robots: { index: false, follow: false, nocache: true },
};

export default async function SequencesPage() {
  const sequences = await listSequences();
  return (
    <div className="px-6 py-10 sm:px-10">
      <PageHeader
        palette="violet"
        section="Automation"
        pageName="Sequences"
        description="Multi-step drip campaigns. The sequence advancer cron drains active enrollments every 5 minutes and runs at most one step per enrollment per fire."
      />

      <SequencesListClient initial={sequences} />

      <p className="mt-8 text-xs text-zinc-500">
        Email steps are deferred until Phase 4 (Gmail OAuth) ships. Until then, email steps no-op cleanly and the sequence advances past them.{" "}
        <Link href="/admin/canopy" className="font-semibold text-zinc-700 hover:underline">
          Manage Pathlight gates
        </Link>
        {" / "}
        <Link href="/admin/automations" className="font-semibold text-zinc-700 hover:underline">
          Workflow rules
        </Link>
      </p>

      {sequences.length > 0 ? (
        <section className="mt-10 rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="font-display text-base font-semibold text-zinc-900">Step delay reference</h2>
          <p className="mt-1 text-xs text-zinc-600">
            How sequence step delays are interpreted. The first step always fires immediately; subsequent steps wait their delay relative to the previous step running.
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-700 sm:grid-cols-4">
            <li>0 - {formatDelay(0)}</li>
            <li>3600 - {formatDelay(3600)}</li>
            <li>86400 - {formatDelay(86400)}</li>
            <li>259200 - {formatDelay(259200)}</li>
            <li>604800 - {formatDelay(604800)}</li>
          </ul>
        </section>
      ) : null}
    </div>
  );
}
