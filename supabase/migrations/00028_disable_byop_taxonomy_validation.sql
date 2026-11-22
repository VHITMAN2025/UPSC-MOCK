-- Disable strict taxonomy validation trigger to allow BYOP (Bring Your Own Paper) uploads
-- BYOP allows users to upload their own practice tests with any taxonomy structure

-- Option 1: DROP the trigger completely (simplest - allows any taxonomy)
DROP TRIGGER IF EXISTS enforce_question_taxonomy_catalog ON public.questions;

-- Option 2: If you want to keep the trigger but make it a warning instead of blocking:
-- CREATE OR REPLACE FUNCTION public.enforce_question_taxonomy_catalog()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   IF NOT public.question_has_approved_taxonomy(NEW.unit_name, NEW.macro_topic, NEW.micro_topic) THEN
--     RAISE WARNING 'Question taxonomy is not in the approved catalog: % > % > %',
--       NEW.unit_name, NEW.macro_topic, NEW.micro_topic;
--   END IF;
--   RETURN NEW;
-- END;
-- $$;

-- Note: The function question_has_approved_taxonomy() and question_taxonomy table
-- are kept intact - they can still be used for validation in the admin UI
-- This just removes the database-level enforcement so BYOP can work
