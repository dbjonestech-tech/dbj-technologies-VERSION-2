-- Pathlight database schema
-- Run once via: npx tsx lib/db/setup.ts

CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  email TEXT NOT NULL,
  business_name TEXT,
  industry TEXT DEFAULT 'general',
  city TEXT,
  state TEXT DEFAULT 'TX',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scanning', 'analyzing', 'complete', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  lighthouse_data JSONB,
  screenshots JSONB,
  ai_analysis JSONB,
  pathlight_score INTEGER,
  pillar_scores JSONB,
  remediation_items JSONB,
  revenue_impact JSONB,
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
