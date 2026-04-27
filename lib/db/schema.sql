-- Pathlight database schema
-- Run once via: npx tsx lib/db/setup.ts

CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  resolved_url TEXT,
  email TEXT NOT NULL,
  business_name TEXT,
  industry TEXT DEFAULT 'general',
  city TEXT,
  state TEXT DEFAULT 'TX',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scanning', 'analyzing', 'complete', 'partial', 'failed')),
  error_message TEXT,
  scan_duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL UNIQUE REFERENCES scans(id) ON DELETE CASCADE,
  lighthouse_data JSONB,
  screenshots JSONB,
  ai_analysis JSONB,
  pathlight_score INTEGER,
  pillar_scores JSONB,
  remediation_items JSONB,
  revenue_impact JSONB,
  industry_benchmark JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id),
  email TEXT NOT NULL,
  business_name TEXT,
  url TEXT,
  industry TEXT,
  city TEXT,
  state TEXT,
  scan_count INTEGER DEFAULT 1,
  last_scan_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_scans_email ON scans(email);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE UNIQUE INDEX IF NOT EXISTS scan_results_scan_id_key ON scan_results(scan_id);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS email_unsubscribes (
  email TEXT PRIMARY KEY,
  unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('report_delivery', 'followup_48h', 'followup_5d', 'breakup_8d')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'skipped', 'failed', 'bounced', 'complained', 'delivered', 'delivery_delayed')),
  resend_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_events_scan ON email_events(scan_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(email_type);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_email_event_resend_id_status
  ON email_events (resend_id, status)
  WHERE resend_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS api_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'browserless', 'pagespeed', 'resend')),
  operation TEXT NOT NULL,
  model TEXT,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  cache_write_tokens INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('ok', 'retry', 'fail')),
  attempt INTEGER NOT NULL DEFAULT 1,
  cost_usd NUMERIC(12, 6) NOT NULL DEFAULT 0,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_scan ON api_usage_events(scan_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_provider ON api_usage_events(provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_occurred_at ON api_usage_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_provider_occurred_at ON api_usage_events(provider, occurred_at DESC);
