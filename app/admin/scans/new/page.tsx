import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { canFireScan } from "@/lib/canopy/pathlight-gate";
import PageHeader from "../../PageHeader";
import { AdminScanForm } from "./AdminScanForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "New Pathlight scan",
  robots: { index: false, follow: false, nocache: true },
};

/* Admin one-shot scan trigger.
 *
 * Fires a Pathlight scan from inside Canopy without going through
 * the public Pathlight form (no Cloudflare Turnstile, no per-IP
 * rate limit, no per-email rate limit, no 24h dedupe collision).
 * Useful during prospect demos when the public form's friction
 * gets in the way.
 *
 * Still routes through the three-layer Pathlight gate; the page
 * pre-flights the gate so the form renders a disabled state with
 * the operator-facing reason if any layer is currently blocking.
 * Also reads the admin's email server-side and passes it into the
 * form as the default recipient so the common case (Joshua scans
 * his own email for an exploratory look) is one-click. */
export default async function NewAdminScanPage() {
  const session = await auth();
  const adminEmail = session?.user?.email ?? null;
  const gate = await canFireScan("prospecting");

  return (
    <div className="px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader
          palette="teal"
          section="Operations"
          pageName="New Pathlight scan"
          description="Trigger a Pathlight scan from inside Canopy. Skips the public form's bot challenge and per-IP rate limit. Still routed through the three-layer Pathlight gate so the monthly budget and prospecting toggle apply."
        />

        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
          {gate.allowed ? (
            <AdminScanForm
              defaultEmail={adminEmail ?? ""}
              budgetRemaining={gate.remaining ?? null}
            />
          ) : (
            <GateBlockedNotice reason={gate.reason ?? "Scan gate denied."} />
          )}
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          Each successful trigger writes a `pathlight.admin-scan` entry to the
          audit log with the URL, recipient email, and your admin email so the
          source of every scan is traceable. Want to look at past scans
          instead?{" "}
          <Link
            href="/admin/scans"
            className="text-zinc-700 underline-offset-2 hover:underline"
          >
            See the scan list
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function GateBlockedNotice({ reason }: { reason: string }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-zinc-900">
        Pathlight scans are currently blocked
      </h2>
      <p className="text-sm text-zinc-600">{reason}</p>
      <p className="text-xs text-zinc-500">
        Toggles and the monthly scan budget live in{" "}
        <Link
          href="/admin/canopy"
          className="text-zinc-700 underline-offset-2 hover:underline"
        >
          Canopy controls
        </Link>
        . Flip the master kill on, enable prospecting, set a monthly budget,
        and reload this page.
      </p>
    </div>
  );
}
