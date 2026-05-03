-- Stage 2: HTML capture, full-page screenshots, and form audit.
--
-- Three additive JSONB columns on scan_results, all nullable. No
-- indexes needed for v1; these are read on the per-scan report path
-- (scan_id is already the primary key) and never aggregated.
--
-- html_snapshot       JSONB { html: string, capturedAt: ISO, viewport: "desktop"|"mobile",
--                              strategy: "primary"|"fallback", truncatedAt: number|null }
--                     The HTML body captured alongside the desktop above-the-fold
--                     screenshot. Truncated at 256KB at the Browserless boundary
--                     (matching the change-monitoring fetch limit). Source for
--                     downstream text-side analyses (Stage 3 tone-of-voice,
--                     Item 20 NAP extract, Item 22 OG/social-card preview, etc).
--
-- screenshots_fullpage JSONB { desktop: string|null, mobile: string|null }
--                     Mirrors the existing scan_results.screenshots shape but
--                     captured with fullPage: true. Two parallel Browserless calls
--                     run alongside the existing AtF pair. Rendered in a
--                     collapsible accordion below the AtF hero pair on the report.
--
-- forms_audit         JSONB { extracted: { forms: [...] }, analysis: { items: [...] } | null }
--                     `extracted` is the in-browser DOM walk: per-form fieldCount,
--                     fieldTypes, buttonCopy, action, optional-field count.
--                     `analysis` is the optional model-generated narrative gated
--                     on extracted.forms.length > 0. Rendered as FormsAuditSection
--                     between LighthouseBreakdown and ScreenshotsSection.

ALTER TABLE scan_results
  ADD COLUMN IF NOT EXISTS html_snapshot JSONB;

ALTER TABLE scan_results
  ADD COLUMN IF NOT EXISTS screenshots_fullpage JSONB;

ALTER TABLE scan_results
  ADD COLUMN IF NOT EXISTS forms_audit JSONB;
