"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rescanByScanIdAction } from "@/lib/actions/pathlight-rescan";
import { useToast } from "../../../components/Toast";

export default function RescanButton({ scanId }: { scanId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  const handleClick = () => {
    if (submitting || isPending) return;
    setSubmitting(true);
    startTransition(async () => {
      const result = await rescanByScanIdAction({ scanId });
      setSubmitting(false);
      if (result.ok) {
        toast.show({
          tone: "success",
          message: "Re-scan queued. Opening the new run.",
        });
        router.push(`/admin/monitor/scan/${result.newScanId}`);
      } else {
        toast.show({ tone: "error", message: result.error });
      }
    });
  };

  const busy = submitting || isPending;
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? "Queuing…" : "Re-scan this URL"}
    </button>
  );
}
