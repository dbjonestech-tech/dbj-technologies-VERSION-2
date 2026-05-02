"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { triggerRescanAction } from "@/lib/actions/pathlight-rescan";

interface Props {
  contactId: number;
  gateAllowed: boolean;
  gateReason?: string;
  budgetRemaining: number | null;
}

export default function RescanButton({
  contactId,
  gateAllowed,
  gateReason,
  budgetRemaining,
}: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  function trigger() {
    setError(null);
    setSuccess(null);
    start(async () => {
      const r = await triggerRescanAction({
        contactId,
        reason: reason.trim() || undefined,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSuccess(`Rescan queued. New scan id: ${r.data.scan_id.slice(0, 8)}...`);
      setReason("");
    });
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-zinc-900">
            Pathlight rescan
          </h3>
          <p className="mt-0.5 text-xs text-zinc-600">
            Trigger a fresh Pathlight scan for this contact's website. Counts against the monthly scan budget.
          </p>
        </div>
        <BudgetPill remaining={budgetRemaining} />
      </header>

      {!gateAllowed ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <ShieldAlert className="h-3.5 w-3.5" /> Rescan blocked
          </span>
          <p className="mt-1">{gateReason ?? "Pathlight integrations are paused."}</p>
          <p className="mt-2">
            <Link href="/admin/canopy" className="font-semibold text-amber-900 underline">
              Open Canopy controls →
            </Link>
          </p>
        </div>
      ) : (
        <>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Reason (optional)
            </span>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={pending}
              placeholder="Following up after their hero image fix, etc."
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
            />
          </label>
          <button
            type="button"
            onClick={trigger}
            disabled={pending}
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Trigger rescan
          </button>
        </>
      )}

      {error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}
      {success ? <p className="mt-3 text-xs text-emerald-700">{success}</p> : null}
    </div>
  );
}

function BudgetPill({ remaining }: { remaining: number | null }) {
  if (remaining === null) return null;
  const tone =
    remaining === 0
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : remaining < 5
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ring-1 ${tone}`}>
      {remaining} left
    </span>
  );
}
