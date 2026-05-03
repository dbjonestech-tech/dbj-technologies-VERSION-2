-- Stage 1: page critique (CTA inventory + headline alternatives + hero
-- observation). One additive nullable JSONB column on scan_results.
--
-- page_critique  JSONB  { ctas: [...], headline: { current, alternatives },
--                          heroObservation: string }
--                       Persisted by a new post-finalize side-step (c1 in
--                       lib/inngest/functions.ts) that runs AFTER the report
--                       email ships and BEFORE the first follow-up sleep.
--                       Failure is swallowed (mirrors the audio + forms-audit
--                       side-step posture). Rendered as HeroCritiqueSection
--                       between LighthouseBreakdown and FormsAuditSection on
--                       the report.
--
-- Stage 1 deliberately does NOT modify the existing scan_results.ai_analysis
-- column or the underlying visionAuditSchema. The page-critique call is a
-- separate artifact with its own schema; one schema's failure cannot poison
-- the other (the Stage 0 audit's primary concern with bundling Item 1 into
-- the existing vision call).

ALTER TABLE scan_results
  ADD COLUMN IF NOT EXISTS page_critique JSONB;
