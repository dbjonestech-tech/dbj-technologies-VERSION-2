import type { Metadata } from "next";
import PageHeader from "../PageHeader";
import { listProspectLists } from "@/lib/canopy/prospect-lists";
import { getCanopySettings } from "@/lib/canopy/settings";
import ProspectingClient from "./ProspectingClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Prospecting",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ProspectingPage() {
  const [lists, settings] = await Promise.all([
    listProspectLists(),
    getCanopySettings(),
  ]);
  const gateBlocked =
    !settings.pathlight_master_enabled ||
    !settings.prospecting_enabled ||
    settings.monthly_scan_budget <= 0;
  const remaining = Math.max(
    settings.monthly_scan_budget - settings.scans_used_this_period,
    0
  );

  return (
    <div className="px-6 py-10 sm:px-10">
      <PageHeader
        palette="lime"
        section="Pathlight"
        pageName="Prospecting"
        description="Curated lists of candidate sites for outreach. The vertical lookup runs at list-time so you can see which candidates the curated database covers. Scans only fire from explicit per-row clicks and are subject to the master kill, the prospecting toggle, and the monthly scan budget."
      />

      <ProspectingClient
        lists={lists}
        gateBlocked={gateBlocked}
        gateReason={
          !settings.pathlight_master_enabled
            ? "Pathlight master kill is on. Toggle it off in /admin/canopy to fire scans."
            : !settings.prospecting_enabled
              ? "Prospecting is disabled in /admin/canopy. Toggle it on first."
              : settings.monthly_scan_budget <= 0
                ? "Monthly scan budget is 0. Set a budget in /admin/canopy."
                : null
        }
        remaining={remaining}
      />
    </div>
  );
}
