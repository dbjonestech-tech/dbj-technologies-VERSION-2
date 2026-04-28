"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const CONSENT_KEY = "dbj-cookie-consent";
const CONSENT_EVENT = "dbj-cookie-consent-change";

export function CookieConsent() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname?.startsWith("/admin")) {
      setShow(false);
      return;
    }
    try {
      const stored = window.localStorage.getItem(CONSENT_KEY);
      if (stored === "accepted" || stored === "declined") {
        setShow(false);
        return;
      }
      setShow(true);
    } catch {
      setShow(false);
    }
  }, [pathname]);

  const decide = (value: "accepted" | "declined") => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch {
      /* persisting consent is best-effort */
    }
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
    setShow(false);
  };

  if (!show) return null;
  if (pathname?.startsWith("/admin")) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="print-hidden fixed inset-x-0 bottom-0 z-[60] border-t border-white/10"
      style={{ backgroundColor: "#06060a" }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-3 text-sm text-zinc-200 sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-snug">
          This site uses cookies for analytics.{" "}
          <a
            href="/privacy"
            className="underline underline-offset-2 hover:text-white"
          >
            Privacy policy
          </a>
          .
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => decide("declined")}
            className="rounded-md border border-white/20 px-4 py-1.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="rounded-md bg-white px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
