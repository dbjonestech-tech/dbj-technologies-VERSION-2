-- Pathlight scan-failure category column.
--
-- Adds one additive nullable TEXT column to scans so the
-- pipeline-throw catch (lib/inngest/functions.ts) can persist the
-- structured failure category produced by lib/services/url.ts on
-- validation failures, plus a "pipeline-error" sentinel for
-- post-validation failures. The /api/scan/[scanId] route surfaces
-- this value to the client; the failure-state UI in
-- ScanStatus.tsx routes the prospect-facing copy off it
-- (connection-blocked vs dns-fail vs http-error vs timeout etc.)
-- so a failed scan stops looking like a generic "something went
-- wrong" and starts naming the actual cause in plain English.
--
-- Pre-feature scans (anything before this migration) coerce to
-- null; the renderer falls back to the legacy generic card when
-- failure_kind is null.
--
-- Idempotent. Safe to re-run.

ALTER TABLE scans
  ADD COLUMN IF NOT EXISTS failure_kind TEXT;
