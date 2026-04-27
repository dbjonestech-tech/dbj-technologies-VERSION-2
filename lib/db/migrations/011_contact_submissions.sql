-- Contact form submission durability.
-- Pairs with app/(marketing)/api/contact/route.ts (best-effort INSERT
-- alongside the Resend send) and the /admin/leads dashboard.
--
-- One table:
--
-- contact_submissions
--   Append-only log of every contact-form submission that passes
--   validation. Resend remains the canonical delivery path; this table
--   is the durable record for /admin/leads so a Resend outage or
--   buried inbox does not lose lead context.
--
--   Schema mirrors the validated zod payload in route.ts: name, email,
--   phone, company, budget, project_type, message. resend_id is the
--   id Resend returns on send (NULL when the send failed or was
--   skipped). ip + user_agent help correlate spam patterns.
--
--   Retention: kept indefinitely; volume is human-paced.

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  budget TEXT NOT NULL,
  project_type TEXT NOT NULL,
  message TEXT NOT NULL,
  resend_id TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
  ON contact_submissions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_email
  ON contact_submissions(email);
