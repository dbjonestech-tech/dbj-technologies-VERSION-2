import type { Metadata } from "next";
import PageHeader from "../PageHeader";
import { getCanopySettings } from "@/lib/canopy/settings";
import { getRecentChanges } from "@/lib/canopy/audit";
import { getCustomFieldDefinitions } from "@/lib/canopy/custom-fields";
import { getSessionRole } from "@/lib/canopy/rbac";
import CanopyControlsClient from "./CanopyControlsClient";
import CustomFieldsManagerClient from "./CustomFieldsManagerClient";
import ConnectedAccountsPanel from "./ConnectedAccountsPanel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Canopy controls",
  robots: { index: false, follow: false, nocache: true },
};

interface FlashState {
  tone: "success" | "error" | "info";
  message: string;
}

function readGoogleFlash(searchParams: Record<string, string | string[] | undefined>): FlashState | null {
  const raw = searchParams["google"];
  const status = Array.isArray(raw) ? raw[0] : raw;
  if (!status) return null;

  const emailRaw = searchParams["email"];
  const email = (Array.isArray(emailRaw) ? emailRaw[0] : emailRaw) ?? null;
  const reasonRaw = searchParams["reason"];
  const reason = (Array.isArray(reasonRaw) ? reasonRaw[0] : reasonRaw) ?? null;
  const messageRaw = searchParams["message"];
  const message = (Array.isArray(messageRaw) ? messageRaw[0] : messageRaw) ?? null;

  switch (status) {
    case "connected":
      return {
        tone: "success",
        message: email
          ? `Connected Gmail (${email}). Inbound and outbound messages will sync going forward.`
          : "Connected Gmail.",
      };
    case "disconnected":
      return {
        tone: "info",
        message: "Disconnected Gmail. The token has been revoked at Google.",
      };
    case "error":
      return {
        tone: "error",
        message: `Could not connect Gmail: ${reason ?? "unknown"}${
          message ? ` (${message})` : ""
        }`,
      };
    default:
      return null;
  }
}

export default async function CanopyControlsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const flash = readGoogleFlash(sp);

  const [settings, recent, contactDefs, dealDefs, session] = await Promise.all([
    getCanopySettings(),
    getRecentChanges(20),
    getCustomFieldDefinitions("contact"),
    getCustomFieldDefinitions("deal"),
    getSessionRole(),
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

        {flash && (
          <div
            className={`mb-6 rounded-md border px-4 py-3 text-sm ${
              flash.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : flash.tone === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-900"
                  : "border-sky-200 bg-sky-50 text-sky-900"
            }`}
          >
            {flash.message}
          </div>
        )}

        <CanopyControlsClient initial={settings} />

        <div className="mt-8">
          <CustomFieldsManagerClient contactDefs={contactDefs} dealDefs={dealDefs} />
        </div>

        {session && (
          <ConnectedAccountsPanel currentUserEmail={session.email} />
        )}

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
