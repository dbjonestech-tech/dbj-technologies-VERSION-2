-- Pathlight Stage 3a: social-share preview.
--
-- Adds one additive nullable JSONB column to scan_results so the
-- post-finalize og-preview step (lib/inngest/functions.ts step o1)
-- can persist the parsed OG / Twitter card metadata plus a list of
-- structural problems detected on the site.
--
-- Source data: scan_results.html_snapshot.html (already populated by
-- migration 034). No AI call; pure HTML parsing of <meta property=og:*>
-- and <meta name=twitter:*> tags. Failures are swallowed by the caller,
-- mirroring the Stage 1/2 side-step posture.
--
-- The column is read by lib/db/queries.ts getFullScanReport and surfaced
-- on the public scan API at /api/scan/[scanId]. The report renderer
-- (app/(grade)/pathlight/[scanId]/OgPreviewSection.tsx) shows the
-- prospect a literal simulation of how their site appears when shared
-- on Facebook, LinkedIn, or Slack.

ALTER TABLE scan_results
  ADD COLUMN IF NOT EXISTS og_preview JSONB;
