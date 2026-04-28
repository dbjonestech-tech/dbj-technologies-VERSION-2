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
gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
