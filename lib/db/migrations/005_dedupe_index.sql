-- Dedupe + recency index for scan submissions.
-- Pairs with the dedup gate added in app/(grade)/api/scan/route.ts:
--   SELECT id FROM scans
--   WHERE email = $1 AND url = $2
--     AND created_at > now() - interval '24 hours'
--     AND status <> 'failed'
--   ORDER BY created_at DESC
--   LIMIT 1
-- The existing idx_scans_email satisfies only the email filter and forces
-- a heap scan for url + created_at. This composite lets Postgres satisfy
-- the equality + range + ORDER BY in a single index scan. Idempotent.

CREATE INDEX IF NOT EXISTS idx_scans_email_url_created
  ON scans (email, url, created_at DESC);
