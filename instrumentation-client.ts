// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://ca7ba43b092282f239bf28254de03a07@o4511187949256704.ingest.us.sentry.io/4511187956924416",

  // Tuned for Lighthouse-perfect mobile Performance:
  //  - Session Replay removed: ~50-80 KB gzipped shipped to every visitor;
  //    rarely useful on a marketing site and dominates the client bundle.
  //  - tracesSampleRate 1.0 -> 0.1 in production so we trace 10% instead
  //    of 100% of sessions; halves outbound network noise during navigation.
  //  - enableLogs and sendDefaultPii disabled. Logging is a per-event
  //    fetch out of the client; PII forwarding inflates events and is
  //    a privacy concern on a public marketing site.
  // To turn Replay back on locally, set NEXT_PUBLIC_SENTRY_REPLAY=1.
  integrations:
    process.env.NEXT_PUBLIC_SENTRY_REPLAY === "1"
      ? [Sentry.replayIntegration()]
      : [],

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  enableLogs: false,
  sendDefaultPii: false,

  // Replay sample rates only matter when the integration is loaded.
  // Kept at zero as a defense in depth in case Replay is enabled.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
