"use client";

import { useEffect } from "react";

/**
 * First-party error beacon.
 *
 * Sibling to AnalyticsBeacon. Mounted in the root layout so it covers
 * every surface (marketing, admin, portal, /pathlight). Listens to
 * window error and unhandled promise rejection events and POSTs them
 * to /api/track/error, which inserts into error_events for grouping
 * and display on /admin/errors.
 *
 * Coexists with Sentry (app/global-error.tsx). Sentry is the DBJ
 * paid-tooling sink; error_events is the productized self-hosted
 * sink that ships with every Canopy install.
 */
export function ErrorBeacon() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const send = (payload: {
      message: string;
      stack?: string | null;
      source?: "client";
      severity?: "error" | "warning";
      url?: string;
    }) => {
      try {
        const body = JSON.stringify({
          message: payload.message,
          stack: payload.stack ?? null,
          source: payload.source ?? "client",
          severity: payload.severity ?? "error",
          url: payload.url ?? window.location.href,
        });
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: "application/json" });
          if (navigator.sendBeacon("/api/track/error", blob)) return;
        }
        fetch("/api/track/error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
          credentials: "same-origin",
        }).catch(() => {});
      } catch {
        /* swallow - error reporting must never throw */
      }
    };

    const onError = (event: ErrorEvent) => {
      send({
        message: event.message || "uncaught error",
        stack: event.error?.stack ?? null,
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
          ? reason
          : "unhandled promise rejection";
      const stack = reason instanceof Error ? reason.stack ?? null : null;
      send({ message, stack });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
