-- ============================================================
-- INTELLIGENT TEST GENERATION ENGINE — Schema Migration
-- Supports stratified (Unit x Difficulty) sampling and Group 2 Language Specialization
-- ============================================================

-- 1. Extend questions table with difficulty_level, part_code, unit_code, and tags
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS part_code        TEXT,
  ADD COLUMN IF NOT EXISTS unit_code        TEXT,
  ADD COLUMN IF NOT EXISTS tags             TEXT[] DEFAULT '{}'::TEXT[];

CREATE INDEX IF NOT EXISTS idx_questions_diff_unit
  ON public.questions(group_name, unit_code, difficulty_level);

CREATE INDEX IF NOT EXISTS idx_questions_tags_gin
  ON public.questions USING GIN (tags);

-- 2. Extend recall_questions table with the same columns
ALTER TABLE public.recall_questions
  ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS part_code        TEXT,
  ADD COLUMN IF NOT EXISTS unit_code        TEXT,
  ADD COLUMN IF NOT EXISTS tags             TEXT[] DEFAULT '{}'::TEXT[];

CREATE INDEX IF NOT EXISTS idx_recall_questions_diff_unit
  ON public.recall_questions(group_name, unit_code, difficulty_level);

-- 3. Extend profiles table with group2_language_pref
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS group2_language_pref TEXT DEFAULT 'General Tamil'
  CHECK (group2_language_pref IN ('General English', 'General Tamil'));

COMMENT ON COLUMN public.profiles.group2_language_pref IS
  'Preferred subject for TNPSC Group 2 Part 1: General English or General Tamil';
