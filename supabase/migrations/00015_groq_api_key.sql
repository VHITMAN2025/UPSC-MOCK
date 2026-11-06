-- Groq replaces Gemini as the browser-configured AI provider.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS groq_api_key TEXT;

NOTIFY pgrst, 'reload schema';
