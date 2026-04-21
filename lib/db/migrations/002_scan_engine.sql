-- Pathlight scan engine migration.
-- Adds resolved URL + duration to scans, widens the status CHECK to accept 'partial',
-- and gives scan_results a unique index on scan_id so we can upsert safely.

ALTER TABLE scans ADD COLUMN IF NOT EXISTS resolved_url TEXT;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS scan_duration_ms INTEGER;

ALTER TABLE scans DROP CONSTRAINT IF EXISTS scans_status_check;
ALTER TABLE scans ADD CONSTRAINT scans_status_check
  CHECK (status IN ('pending', 'scanning', 'analyzing', 'complete', 'partial', 'failed'));

DROP INDEX IF EXISTS idx_scan_results_scan_id;
CREATE UNIQUE INDEX IF NOT EXISTS scan_results_scan_id_key ON scan_results(scan_id);
