"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CONSENT_KEY = "dbj-cookie-consent";
const CONSENT_EVENT = "dbj-cookie-consent-change";

type Consent = "accepted" | "declined" | null;

// /pathlight is the public landing page and is tracked. Anything beneath
// (/pathlight/<scanId>, /pathlight/unsubscribe) carries private data in the
// URL and must not reach Google Analytics.
function isExcludedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/pathlight/")) return true;
  return false;
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(CONSENT_KEY);
      if (stored === "accepted" || stored === "declined") {
        setConsent(stored);
      }
    } catch {
      /* localStorage blocked: treat as no consent */
    }

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail === "accepted" || detail === "declined") {
        setConsent(detail);
      }
    };
    window.addEventListener(CONSENT_EVENT, handler as EventListener);
    return () =>
      window.removeEventListener(CONSENT_EVENT, handler as EventListener);
  }, []);

  useEffect(() => {
    if (!GA_ID || typeof window === "undefined") return;
    const flag = `ga-disable-${GA_ID}`;
    (window as unknown as Record<string, boolean>)[flag] =
      consent !== "accepted";
  }, [consent]);

  // SPA pageview tracking. Fires page_view on every Next.js client-side
  // route change while consent is accepted and the path is not excluded.
  // The inline init script below sets `send_page_view: false` so the
  // initial pageview also flows through this effect rather than firing
  // implicitly from `gtag('config')`, which would double-count when
  // combined with this effect.
  //
  // Race: under `afterInteractive` strategy the inline init may run in a
  // future tick after this effect first fires. The fallback writes
  // directly to `window.dataLayer` (creating it if absent) so any
  // pageview queued before gtag.js loads is processed when it does.
  useEffect(() => {
    if (!GA_ID) return;
    if (!hydrated) return;
    if (consent !== "accepted") return;
    if (isExcludedPath(pathname)) return;
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      gtag?: (...args: unknown[]) => void;
      dataLayer?: unknown[];
    };
    const params = {
      page_path: pathname,
      page_location: window.location.href,
      page_title: typeof document !== "undefined" ? document.title : "",
    };
    if (typeof w.gtag === "function") {
      w.gtag("event", "page_view", params);
    } else {
      if (!w.dataLayer) w.dataLayer = [];
      w.dataLayer.push(["event", "page_view", params]);
    }
  }, [pathname, consent, hydrated]);

  if (!GA_ID) return null;
  if (!hydrated) return null;
  if (consent !== "accepted") return null;
  if (isExcludedPath(pathname)) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true, send_page_view: false });
        `}
      </Script>
    </>
  );
}
