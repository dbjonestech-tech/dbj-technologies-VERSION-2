import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "../PageHeader";
import {
  listUnacknowledgedSignals,
  type SignalWithContact,
} from "@/lib/canopy/change-monitoring";
import { getCanopySettings } from "@/lib/canopy/settings";
import WebsiteChangesClient from "./WebsiteChangesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Website changes",
  robots: { index: false, follow: false, nocache: true },
};

const KIND_LABEL: Record<SignalWithContact["change_kind"], string> = {
  etag: "Etag changed",
  last_modified: "Last-Modified changed",
  content_hash: "Content body changed",
  first_seen: "First observation",
  error: "Fetch error",
};

const KIND_TONE: Record<SignalWithContact["change_kind"], string> = {
  etag: "bg-sky-100 text-sky-700",
  last_modified: "bg-sky-100 text-sky-700",
  content_hash: "bg-amber-100 text-amber-700",
  first_seen: "bg-zinc-100 text-zinc-600",
  error: "bg-red-100 text-red-700",
};

export default async function WebsiteChangesPage() {
  const [signals, settings] = await Promise.all([
    listUnacknowledgedSignals(100),
    getCanopySettings(),
  ]);

  return (
    <div className="px-6 py-10 sm:px-10">
      <PageHeader
        palette="lime"
        section="Pathlight Advanced"
        pageName="Website changes"
        description="Daily probe of every active-deal contact's website. Etag, Last-Modified, or content-hash changes since the last observation appear here as actionable signals. No scan auto-fires; you choose whether to re-scan based on the change."
      />

      {!settings.change_monitoring_enabled ? (
        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Change monitoring is currently disabled. Toggle <code className="font-mono">change_monitoring_enabled</code> on in <Link className="underline" href="/admin/canopy">/admin/canopy</Link> for the daily cron to start writing signals.
        </section>
      ) : null}

      <WebsiteChangesClient
        initial={signals.map((s) => ({
          ...s,
          kind_label: KIND_LABEL[s.change_kind],
          kind_tone: KIND_TONE[s.change_kind],
        }))}
      />
    </div>
  );
}
