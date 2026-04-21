"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type ScanState = {
  scanId: string;
  url: string;
  status: string;
  completedAt: string | null;
  errorMessage: string | null;
};

const ACTIVE_STATUSES = new Set(["pending", "scanning", "analyzing"]);

const STATUS_COPY: Record<string, string> = {
  pending: "Queued...",
  scanning: "Scanning your website...",
  analyzing: "Running AI analysis...",
  complete: "Scan complete!",
  failed: "Scan failed",
};

export function ScanStatus({ initial }: { initial: ScanState }) {
  const [state, setState] = useState<ScanState>(initial);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!ACTIVE_STATUSES.has(state.status)) return;

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/scan/${state.scanId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          scanId: string;
          status: string;
          completedAt: string | null;
          errorMessage: string | null;
        };
        setState((prev) => ({
          ...prev,
          status: data.status,
          completedAt: data.completedAt,
          errorMessage: data.errorMessage,
        }));
      } catch {
        // Silently ignore transient poll failures; next tick will retry.
      }
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [state.scanId, state.status]);

  useEffect(() => {
    if (!ACTIVE_STATUSES.has(state.status) && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [state.status]);

  const isActive = ACTIVE_STATUSES.has(state.status);
  const isComplete = state.status === "complete";
  const isFailed = state.status === "failed";

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center px-6 py-16"
      style={{ backgroundColor: "#06060a", color: "#e7ebf2" }}
    >
      <div className="w-full max-w-[600px] text-center">
        <p className="text-xs uppercase tracking-[0.25em]" style={{ color: "#6b7280" }}>
          Pathlight scan
        </p>
        <h1
          className="mt-2 break-all font-display text-2xl font-semibold sm:text-3xl"
          style={{ color: "#e7ebf2" }}
        >
          {state.url}
        </h1>

        <div className="mt-12 flex flex-col items-center gap-6">
          {isActive ? (
            <>
              <PulseRing />
              <div>
                <div className="font-display text-lg font-semibold" style={{ color: "#60a5fa" }}>
                  {STATUS_COPY[state.status] ?? "Working..."}
                </div>
                <div className="mt-2 text-sm" style={{ color: "#9aa3b2" }}>
                  This usually takes about 60 seconds.
                </div>
              </div>
            </>
          ) : null}

          {isComplete ? (
            <div
              className="w-full rounded-2xl border p-8"
              style={{
                borderColor: "rgba(59,130,246,0.25)",
                backgroundColor: "rgba(10,12,18,0.7)",
              }}
            >
              <div className="font-display text-xl font-semibold" style={{ color: "#60a5fa" }}>
                Scan complete!
              </div>
              <p className="mt-3 text-sm" style={{ color: "#c5ccd8" }}>
                Your full report is being built.
              </p>
            </div>
          ) : null}

          {isFailed ? (
            <div
              className="w-full rounded-2xl border p-8"
              style={{
                borderColor: "rgba(239,68,68,0.35)",
                backgroundColor: "rgba(127,29,29,0.12)",
              }}
            >
              <div className="font-display text-xl font-semibold" style={{ color: "#fca5a5" }}>
                Scan failed
              </div>
              {state.errorMessage ? (
                <p className="mt-3 text-sm" style={{ color: "#f5c6c6" }}>
                  {state.errorMessage}
                </p>
              ) : null}
              <Link
                href="/grade"
                className="mt-6 inline-block rounded-full px-5 py-2 text-sm font-semibold"
                style={{
                  backgroundImage: "linear-gradient(135deg, #3b82f6, #0891b2)",
                  color: "white",
                }}
              >
                Try Again
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PulseRing() {
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex h-16 w-16 items-center justify-center"
    >
      <span
        className="absolute inline-block h-full w-full animate-ping rounded-full"
        style={{ backgroundColor: "rgba(59,130,246,0.35)" }}
      />
      <span
        className="relative inline-block h-8 w-8 rounded-full"
        style={{ backgroundImage: "linear-gradient(135deg, #3b82f6, #0891b2)" }}
      />
    </span>
  );
}
