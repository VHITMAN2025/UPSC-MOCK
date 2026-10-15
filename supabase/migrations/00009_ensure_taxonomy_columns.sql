-- ============================================================
-- ENSURE 3-LEVEL TAXONOMY COLUMNS & TABLES
-- Level 1: Unit (Broad Subject)
-- Level 2: Macro-Topic (Sub-category)
-- Level 3: Micro-Topic (Exact Chapter)
-- Safe, idempotent script for Supabase SQL Editor
-- ============================================================

-- 1. Ensure syllabus_micro_topics table exists
CREATE TABLE IF NOT EXISTS public.syllabus_micro_topics (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  macro_topic_id     UUID REFERENCES public.syllabus_topics(id) ON DELETE CASCADE,
  micro_topic_name   TEXT NOT NULL,
  micro_topic_number INTEGER DEFAULT 1,
  keywords           TEXT[] DEFAULT '{}',
  description        TEXT,
  display_order      INTEGER DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_syllabus_micro_topics_macro
  ON public.syllabus_micro_topics(macro_topic_id);

ALTER TABLE public.syllabus_micro_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read syllabus_micro_topics" ON public.syllabus_micro_topics;
CREATE POLICY "Anyone can read syllabus_micro_topics"
  ON public.syllabus_micro_topics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage syllabus_micro_topics" ON public.syllabus_micro_topics;
CREATE POLICY "Authenticated users can manage syllabus_micro_topics"
  ON public.syllabus_micro_topics FOR ALL USING (auth.role() = 'authenticated');

-- 2. Ensure questions table has Level 1, Level 2, Level 3 taxonomy columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'group_name') THEN
    ALTER TABLE public.questions ADD COLUMN group_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'unit_id') THEN
    ALTER TABLE public.questions ADD COLUMN unit_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'unit_name') THEN
    ALTER TABLE public.questions ADD COLUMN unit_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'unit_code') THEN
    ALTER TABLE public.questions ADD COLUMN unit_code TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'macro_topic_id') THEN
    ALTER TABLE public.questions ADD COLUMN macro_topic_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'macro_topic_name') THEN
    ALTER TABLE public.questions ADD COLUMN macro_topic_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'micro_topic_id') THEN
    ALTER TABLE public.questions ADD COLUMN micro_topic_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'micro_topic_name') THEN
    ALTER TABLE public.questions ADD COLUMN micro_topic_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'part_code') THEN
    ALTER TABLE public.questions ADD COLUMN part_code TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'difficulty_level') THEN
    ALTER TABLE public.questions ADD COLUMN difficulty_level TEXT DEFAULT 'Medium';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'tags') THEN
    ALTER TABLE public.questions ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_questions_unit_name ON public.questions(unit_name);
CREATE INDEX IF NOT EXISTS idx_questions_macro_topic_name ON public.questions(macro_topic_name);
CREATE INDEX IF NOT EXISTS idx_questions_micro_topic_name ON public.questions(micro_topic_name);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON public.questions USING gin(tags);

-- 3. Ensure recall_questions table has taxonomy columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'unit_name') THEN
    ALTER TABLE public.recall_questions ADD COLUMN unit_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'macro_topic_name') THEN
    ALTER TABLE public.recall_questions ADD COLUMN macro_topic_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'micro_topic_name') THEN
    ALTER TABLE public.recall_questions ADD COLUMN micro_topic_name TEXT;
  END IF;
END $$;
