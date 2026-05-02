import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import PageHeader from "../../PageHeader";
import {
  getProspectList,
  getProspectCandidates,
} from "@/lib/canopy/prospect-lists";
import { getCanopySettings } from "@/lib/canopy/settings";
import CandidateClient from "./CandidateClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Prospect list",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ProspectListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idRaw } = await params;
  const listId = Number(idRaw);
  if (!Number.isFinite(listId) || listId <= 0) notFound();

  const [list, candidates, settings] = await Promise.all([
    getProspectList(listId),
    getProspectCandidates(listId),
    getCanopySettings(),
  ]);
  if (!list) notFound();

  const gateBlocked =
    !settings.pathlight_master_enabled ||
    !settings.prospecting_enabled ||
    settings.monthly_scan_budget <= 0;
  const remaining = Math.max(
    settings.monthly_scan_budget - settings.scans_used_this_period,
    0
  );
  const gateReason = !settings.pathlight_master_enabled
    ? "Pathlight master kill is on."
    : !settings.prospecting_enabled
      ? "Prospecting is disabled in settings."
      : settings.monthly_scan_budget <= 0
        ? "Monthly scan budget is 0."
        : null;

  return (
    <div className="px-6 py-10 sm:px-10">
      <PageHeader
        palette="lime"
        section="Prospecting"
        pageName={list.name}
        description={
          list.notes ?? "Add candidates and scan them one by one. Each scan counts against the monthly Pathlight budget."
        }
      />
      <p className="mt-2 text-xs">
        <Link href="/admin/prospecting" className="text-zinc-500 hover:underline">
          ← All lists
        </Link>
      </p>

      <CandidateClient
        listId={listId}
        candidates={candidates}
        gateBlocked={gateBlocked}
        gateReason={gateReason}
        remaining={remaining}
      />
    </div>
  );
}
