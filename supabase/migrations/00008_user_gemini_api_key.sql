-- ============================================================
-- USER GEMINI API KEY (BYOK) — Schema Migration
-- Allows each user to save their personal Google Gemini API key
-- to avoid exhausting shared free tier quotas.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

COMMENT ON COLUMN public.profiles.gemini_api_key IS
  'Personal Google Gemini API Key configured by the user for unlimited personal AI Mentor and Vision parsing';
