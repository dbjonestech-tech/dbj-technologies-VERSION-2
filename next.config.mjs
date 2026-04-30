import { withSentryConfig } from "@sentry/nextjs";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  turbopack: {
    root: resolve(__dirname),
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    /* Client deliverables uploaded through /admin/clients/[email]
     * server actions can include design files, PDFs, mockups. The
     * default 1MB body limit is too small for studio work. 4MB is the
     * Vercel function body cap; v2 will move large files to a direct-
     * to-Blob upload pattern that bypasses the action route entirely. */
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/maintenance-support",
        destination: "/pricing/maintenance",
        permanent: true,
      },
      /* /internal/* was the legacy admin namespace before the
       * authenticated admin shell moved to /admin/*. Keep these
       * 301s so any bookmarked or already-published links resolve. */
      {
        source: "/internal/monitor/:path*",
        destination: "/admin/monitor/:path*",
        permanent: true,
      },
      {
        source: "/internal/monitor",
        destination: "/admin/monitor",
        permanent: true,
      },
      {
        source: "/internal/cost",
        destination: "/admin/costs",
        permanent: true,
      },
      {
        source: "/internal",
        destination: "/admin",
        permanent: true,
      },
      /* /work/blueprints/* was the original namespace for vertical
       * reference architectures. Renamed to /work/design-briefs/* to
       * match the refined "Design Brief" vocabulary surfaced site-wide. */
      {
        source: "/work/blueprints/:slug*",
        destination: "/work/design-briefs/:slug*",
        permanent: true,
      },
      {
        source: "/work/blueprints",
        destination: "/work#design-briefs",
        permanent: true,
      },
      /* Legacy: /pricing/operations -> /pricing/canopy was the rename
       * redirect from 2026-04-28. Canopy was then pulled from the public
       * pricing page on 2026-04-30 (premature to sell with one install).
       * Both old URLs now route to the work-page case study so existing
       * inbound links land somewhere useful instead of 404. */
      {
        source: "/pricing/operations",
        destination: "/work/canopy",
        permanent: true,
      },
      {
        source: "/pricing/canopy",
        destination: "/work/canopy",
        permanent: true,
      },
      /* Service slug rename (2026-04-30): old developer-jargon slugs
       * (frontend-architecture, backend-systems, cloud-infrastructure,
       * interface-engineering, ecommerce-platforms, web-performance)
       * renamed to buyer-friendly equivalents. 301s preserve any
       * inbound link equity from prior crawl. */
      {
        source: "/services/frontend-architecture",
        destination: "/services/website-design",
        permanent: true,
      },
      {
        source: "/services/backend-systems",
        destination: "/services/business-systems",
        permanent: true,
      },
      {
        source: "/services/cloud-infrastructure",
        destination: "/services/hosting",
        permanent: true,
      },
      {
        source: "/services/interface-engineering",
        destination: "/services/user-experience",
        permanent: true,
      },
      {
        source: "/services/ecommerce-platforms",
        destination: "/services/ecommerce",
        permanent: true,
      },
      {
        source: "/services/web-performance",
        destination: "/services/speed-and-search",
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "dbj-technologies",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
