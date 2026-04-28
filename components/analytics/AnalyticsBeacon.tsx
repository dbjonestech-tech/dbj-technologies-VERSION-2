"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * First-party analytics beacon.
 *
 * Single mounted component that owns the entire client side of the
 * visitor analytics pipeline:
 *
 *   1. POST /api/track/view on mount and on every route change.
 *      Receives back a pageViewId used to correlate engagement.
 *
 *   2. Observe Core Web Vitals (LCP, INP, CLS, FCP) and Navigation
 *      Timing TTFB using native PerformanceObserver. No external
 *      package -- the math here mirrors what the web-vitals library
 *      does, kept inline to avoid a runtime dependency.
 *
 *   3. Track max scroll depth via a passive scroll listener.
 *
 *   4. Flush an engagement payload to /api/track/engage when the
 *      page becomes hidden, before unload, or on route change. Uses
 *      navigator.sendBeacon so the request survives unload.
 *
 * Mounted only on public marketing surfaces. Admin, portal, and
 * /pathlight/[scanId] pages exclude this component (and the route
 * handler also blocks those paths defense-in-depth).
 */

type EngagementSnapshot = {
  pageViewId: string;
  dwellMs: number | null;
  maxScrollPct: number | null;
  cwvLcpMs: number | null;
  cwvInpMs: number | null;
  cwvCls: number | null;
  cwvTtfbMs: number | null;
  cwvFcpMs: number | null;
};

function postBeacon(url: string, body: unknown): void {
  try {
    const payload = JSON.stringify(body);
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const ok = navigator.sendBeacon(url, blob);
      if (ok) return;
    }
    /* sendBeacon failed or unavailable -- fall back to keepalive fetch
     * which gives the browser permission to complete the request even
     * after the page goes away. */
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {
      /* swallow: analytics is best-effort */
    });
  } catch {
    /* swallow */
  }
}

export function AnalyticsBeacon() {
  const pathname = usePathname();

  const stateRef = useRef<{
    pageViewId: string | null;
    enteredAt: number;
    visibleAccumMs: number;
    lastVisibleStart: number | null;
    maxScrollPct: number;
    cwv: {
      lcp: number | null;
      inp: number | null;
      cls: number;
      fcp: number | null;
      ttfb: number | null;
    };
    flushedFinal: boolean;
  } | null>(null);

  const observersRef = useRef<PerformanceObserver[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    /* 1. New page-view: send the view beacon and reset local state. */
    const enteredAt = Date.now();
    stateRef.current = {
      pageViewId: null,
      enteredAt,
      visibleAccumMs: 0,
      lastVisibleStart: document.visibilityState === "visible" ? enteredAt : null,
      maxScrollPct: 0,
      cwv: { lcp: null, inp: null, cls: 0, fcp: null, ttfb: null },
      flushedFinal: false,
    };

    const search = typeof window !== "undefined" ? window.location.search : "";
    const viewBody = {
      path: pathname,
      query: search.length > 0 ? search : null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      viewportW: typeof window !== "undefined" ? window.innerWidth : null,
      viewportH: typeof window !== "undefined" ? window.innerHeight : null,
    };
    fetch("/api/track/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(viewBody),
      credentials: "same-origin",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { pageViewId?: string | null } | null) => {
        if (body?.pageViewId && stateRef.current) {
          stateRef.current.pageViewId = body.pageViewId;
        }
      })
      .catch(() => {
        /* swallow */
      });

    /* 2. CWV observers. PerformanceObserver may be missing in older
     *    browsers; we guard each setup individually. */
    if ("PerformanceObserver" in window) {
      try {
        /* TTFB from Navigation Timing is available immediately. */
        const navEntries = performance.getEntriesByType("navigation");
        const nav = navEntries[0] as PerformanceNavigationTiming | undefined;
        if (nav && stateRef.current) {
          stateRef.current.cwv.ttfb = Math.round(nav.responseStart);
        }
      } catch {
        /* ignore */
      }

      const observe = (
        entryTypes: string,
        handler: (entry: PerformanceEntry) => void
      ) => {
        try {
          const obs = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) handler(entry);
          });
          obs.observe({ type: entryTypes, buffered: true } as PerformanceObserverInit);
          observersRef.current.push(obs);
        } catch {
          /* unsupported entry type -- fine, just skip */
        }
      };

      observe("largest-contentful-paint", (entry) => {
        const lcp = entry as PerformanceEntry & { renderTime?: number; loadTime?: number; startTime: number };
        const value = lcp.renderTime || lcp.loadTime || lcp.startTime;
        if (stateRef.current) {
          stateRef.current.cwv.lcp = Math.round(value);
        }
      });

      observe("paint", (entry) => {
        if (entry.name === "first-contentful-paint" && stateRef.current) {
          stateRef.current.cwv.fcp = Math.round(entry.startTime);
        }
      });

      observe("layout-shift", (entry) => {
        const shift = entry as PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        };
        if (!shift.hadRecentInput && stateRef.current) {
          stateRef.current.cwv.cls += shift.value;
        }
      });

      observe("event", (entry) => {
        /* INP is the maximum interaction latency observed during the
         * visit. event-timing entries above 16ms are interaction
         * candidates; we keep the running max. */
        const e = entry as PerformanceEntry & { duration: number; interactionId?: number };
        if (e.interactionId && e.duration > 0 && stateRef.current) {
          const cur = stateRef.current.cwv.inp;
          stateRef.current.cwv.inp = cur === null ? Math.round(e.duration) : Math.max(cur, Math.round(e.duration));
        }
      });
    }

    /* 3. Scroll depth: passive listener tracks max % of document
     *    height reached. */
    const onScroll = () => {
      if (!stateRef.current) return;
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const viewport = window.innerHeight;
      const scrolled = window.scrollY + viewport;
      if (docHeight <= viewport) {
        stateRef.current.maxScrollPct = 100;
        return;
      }
      const pct = Math.max(
        0,
        Math.min(100, Math.round((scrolled / docHeight) * 100))
      );
      if (pct > stateRef.current.maxScrollPct) {
        stateRef.current.maxScrollPct = pct;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    /* 4. Visibility tracking: accumulate dwell only while the tab is
     *    visible. */
    const onVisibility = () => {
      const s = stateRef.current;
      if (!s) return;
      const now = Date.now();
      if (document.visibilityState === "visible") {
        s.lastVisibleStart = now;
      } else if (s.lastVisibleStart !== null) {
        s.visibleAccumMs += now - s.lastVisibleStart;
        s.lastVisibleStart = null;
        flushEngagement();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const flushEngagement = () => {
      const s = stateRef.current;
      if (!s || !s.pageViewId) return;
      const dwell =
        s.visibleAccumMs +
        (s.lastVisibleStart !== null ? Date.now() - s.lastVisibleStart : 0);
      const snapshot: EngagementSnapshot = {
        pageViewId: s.pageViewId,
        dwellMs: dwell,
        maxScrollPct: s.maxScrollPct,
        cwvLcpMs: s.cwv.lcp,
        cwvInpMs: s.cwv.inp,
        cwvCls: Number(s.cwv.cls.toFixed(4)),
        cwvTtfbMs: s.cwv.ttfb,
        cwvFcpMs: s.cwv.fcp,
      };
      postBeacon("/api/track/engage", snapshot);
    };

    const onPageHide = () => {
      const s = stateRef.current;
      if (!s || s.flushedFinal) return;
      s.flushedFinal = true;
      flushEngagement();
    };
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onPageHide);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onPageHide);
      onPageHide();
      for (const obs of observersRef.current) {
        try {
          obs.disconnect();
        } catch {
          /* ignore */
        }
      }
      observersRef.current = [];
    };
  }, [pathname]);

  return null;
}
