import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "../../PageHeader";
import {
  getSequence,
  getStepsForSequence,
  getEnrollmentsForSequence,
} from "@/lib/canopy/automation/sequences";
import SequenceStepsEditor from "./SequenceStepsEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Sequence",
  robots: { index: false, follow: false, nocache: true },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SequenceDetailPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const sequence = await getSequence(id);
  if (!sequence) notFound();

  const [steps, enrollments] = await Promise.all([
    getStepsForSequence(id),
    getEnrollmentsForSequence(id, 50),
  ]);

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <Link href="/admin/sequences" className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900">
          ← All sequences
        </Link>
        <PageHeader
          palette="violet"
          section="Automation"
          pageName={sequence.name}
          description={sequence.description ?? "Edit steps below. The first step fires immediately on enrollment; subsequent steps wait their delay relative to the previous step."}
        />

        <SequenceStepsEditor sequence={sequence} initialSteps={steps} />

        <section className="mt-10 rounded-xl border border-zinc-200 bg-white p-6">
          <header className="mb-3">
            <h2 className="font-display text-base font-semibold text-zinc-900">
              Recent enrollments ({enrollments.length})
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              Active rows are drained by the cron every 5 minutes.
            </p>
          </header>
          {enrollments.length === 0 ? (
            <p className="text-sm text-zinc-500">No enrollments yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {enrollments.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2 text-xs">
                  <Link href={`/admin/contacts/${e.contact_id}`} className="font-mono text-zinc-700 hover:underline">
                    contact {e.contact_id}
                  </Link>
                  <span className="font-mono text-zinc-500">step {e.current_step_order}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    e.status === "active" ? "bg-emerald-100 text-emerald-700" :
                    e.status === "completed" ? "bg-zinc-100 text-zinc-600" :
                    e.status === "paused" ? "bg-amber-100 text-amber-700" :
                    "bg-rose-100 text-rose-700"
                  }`}>
                    {e.status}
                  </span>
                  <span className="font-mono text-zinc-400">
                    {e.next_run_at ? `next ${new Date(e.next_run_at).toLocaleString()}` : `enrolled ${new Date(e.enrolled_at).toLocaleString()}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
