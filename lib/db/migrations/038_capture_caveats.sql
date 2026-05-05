-- Pathlight capture-confidence layer.
--
-- Adds one additive nullable JSONB column to scan_results so the
-- post-finalize cv1 step (lib/inngest/functions.ts) can persist the
-- list of caveats that apply to this scan: things our automated
-- capture could not fully verify, plus a plain-English explanation
-- the report renders at the top so the prospect reads the rest of
-- the analysis with appropriate context.
--
-- Source data: existing scan_results columns (html_snapshot,
-- ai_analysis, og_preview, screenshots) plus a server-side fetch
-- check on og:image. No AI call. Failures swallowed by the caller,
-- matches the a5/f1/c1/o1 side-step posture.
--
-- Idempotent. Safe to re-run.

ALTER TABLE scan_results
  ADD COLUMN IF NOT EXISTS capture_caveats JSONB;
