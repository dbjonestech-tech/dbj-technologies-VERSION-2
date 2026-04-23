-- Industry benchmark migration.
-- Adds industry_benchmark JSONB column to scan_results so the web-search
-- benchmark data (source, deal value range, visitor range) can be surfaced
-- on the report. Nullable: old scans remain unaffected.

ALTER TABLE scan_results ADD COLUMN IF NOT EXISTS industry_benchmark JSONB;
