// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://ca7ba43b092282f239bf28254de03a07@o4511187949256704.ingest.us.sentry.io/4511187956924416",

  // 10% trace sampling in production; 100% in development.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  enableLogs: false,
  sendDefaultPii: false,
});
