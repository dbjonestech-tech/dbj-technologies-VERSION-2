-- Audio summary support.
-- Pairs with lib/services/voice.ts (script generation + ElevenLabs TTS
-- + Vercel Blob upload), the new `a5` Inngest step, the audio player
-- section in ScanStatus.tsx, and the "Listen to your summary" link
-- in the report email.
--
-- Two new nullable columns on scan_results:
--   audio_summary_url    -- Vercel Blob CDN URL for the MP3
--   audio_summary_script -- the generated script text (kept for
--                          observability + retry without re-running
--                          Haiku if a future TTS regeneration is
--                          needed)
--
-- Provider enum extension: api_usage_events.provider gains
-- 'elevenlabs' so the cost dashboard at /internal/cost can show TTS
-- spend alongside Anthropic / Browserless / PageSpeed / Resend.
--
-- New env vars referenced (set in Vercel):
--   ELEVENLABS_API_KEY      (required for TTS)
--   BLOB_READ_WRITE_TOKEN   (required for Vercel Blob uploads)
--   ELEVENLABS_VOICE_ID     (optional override; defaults to Adam in
--                            lib/services/voice.ts)

ALTER TABLE scan_results
  ADD COLUMN IF NOT EXISTS audio_summary_url TEXT,
  ADD COLUMN IF NOT EXISTS audio_summary_script TEXT;

ALTER TABLE api_usage_events DROP CONSTRAINT IF EXISTS api_usage_events_provider_check;

ALTER TABLE api_usage_events ADD CONSTRAINT api_usage_events_provider_check
  CHECK (provider IN ('anthropic', 'browserless', 'pagespeed', 'resend', 'elevenlabs'));
