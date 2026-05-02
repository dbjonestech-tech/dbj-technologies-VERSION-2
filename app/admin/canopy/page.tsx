import type { Metadata } from "next";
import PageHeader from "../PageHeader";
import { getCanopySettings } from "@/lib/canopy/settings";
import { getRecentChanges } from "@/lib/canopy/audit";
import { getCustomFieldDefinitions } from "@/lib/canopy/custom-fields";
import CanopyControlsClient from "./CanopyControlsClient";
import CustomFieldsManagerClient from "./CustomFieldsManagerClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Canopy controls",
  robots: { index: false, follow: false, nocache: true },
};

export default async function CanopyControlsPage() {
  const [settings, recent, contactDefs, dealDefs] = await Promise.all([
    getCanopySettings(),
    getRecentChanges(20),
    getCustomFieldDefinitions("contact"),
    getCustomFieldDefinitions("deal"),
  ]);

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader
          palette="stone"
          section="Account"
          pageName="Canopy controls"
          description="The three-layer Pathlight lock, white-label branding, digest cadence, and recent setting changes. Every toggle here is audited; every Pathlight scan in Canopy passes through the gate this page configures."
        />

        <CanopyControlsClient initial={settings} />

        <div className="mt-8">
          <CustomFieldsManagerClient contactDefs={contactDefs} dealDefs={dealDefs} />
        </div>

        <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-zinc-900">
            Recent setting changes
          </h2>
          {recent.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No changes recorded yet. Toggle a switch above to see the audit trail populate.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {recent
                .filter((r) => r.entity_type === "canopy_settings")
                .map((r) => (
                  <li key={r.id} className="py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-zinc-700">{r.action}</span>
                      <span className="text-xs text-zinc-500">
                        {new Date(r.occurred_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {r.actor_email ?? "system"}
                      {r.before && r.after ? (
                        <>
                          {" - "}
                          <span className="font-mono">
                            {JSON.stringify(r.before)} → {JSON.stringify(r.after)}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
