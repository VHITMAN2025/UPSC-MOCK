-- ============================================================
-- 00011: MASTER TAXONOMY, 29-COLUMN BLUEPRINT & ZERO-REPETITION
-- ============================================================

-- 1. Ensure questions table supports full 29-column blueprint
DO $$
BEGIN
  -- Content Hash (SHA-256)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'content_hash') THEN
    ALTER TABLE public.questions ADD COLUMN content_hash TEXT;
  END IF;

  -- Exam Tag (TNPSC_GROUP_1, TNPSC_GROUP_2, TNPSC_GROUP_4)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'exam_tag') THEN
    ALTER TABLE public.questions ADD COLUMN exam_tag TEXT DEFAULT 'TNPSC_GROUP_4';
  END IF;

  -- Source Type (PYQ vs VINA - strictly mutually exclusive)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'source_type') THEN
    ALTER TABLE public.questions ADD COLUMN source_type TEXT DEFAULT 'VINA';
  END IF;

  -- Year
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'year') THEN
    ALTER TABLE public.questions ADD COLUMN year INTEGER DEFAULT 2024;
  END IF;

  -- Subject Name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'subject_name') THEN
    ALTER TABLE public.questions ADD COLUMN subject_name TEXT;
  END IF;

  -- Unit Code (UNIT_I .. UNIT_VI, APT_UNIT_I, APT_UNIT_II, LANG_TA_A, etc.)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'unit_code') THEN
    ALTER TABLE public.questions ADD COLUMN unit_code TEXT;
  END IF;

  -- Granular Sub Topic
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'sub_topic') THEN
    ALTER TABLE public.questions ADD COLUMN sub_topic TEXT;
  END IF;

  -- Question Type (MULTIPLE_CHOICE, STATEMENT_EVALUATION, MATCHING, ASSERTION_REASON, CHRONOLOGY)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'question_type') THEN
    ALTER TABLE public.questions ADD COLUMN question_type TEXT DEFAULT 'MULTIPLE_CHOICE';
  END IF;

  -- Cognitive Skill (FACTUAL_RECALL, UNDERSTANDING, APPLICATION, ANALYSIS)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'cognitive_skill') THEN
    ALTER TABLE public.questions ADD COLUMN cognitive_skill TEXT DEFAULT 'FACTUAL_RECALL';
  END IF;

  -- Ideal Time Seconds (45, 60, 75)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'ideal_time_seconds') THEN
    ALTER TABLE public.questions ADD COLUMN ideal_time_seconds INTEGER DEFAULT 54;
  END IF;

  -- Option E (Answer not known / விடை தெரியவில்லை)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'option_e') THEN
    ALTER TABLE public.questions ADD COLUMN option_e TEXT DEFAULT 'Answer not known';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'option_e_tamil') THEN
    ALTER TABLE public.questions ADD COLUMN option_e_tamil TEXT DEFAULT 'விடை தெரியவில்லை';
  END IF;

  -- Separate Explanations
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'en_explanation') THEN
    ALTER TABLE public.questions ADD COLUMN en_explanation TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'ta_explanation') THEN
    ALTER TABLE public.questions ADD COLUMN ta_explanation TEXT;
  END IF;
END $$;

-- 2. Indexes for blueprint filtering & deduplication
CREATE INDEX IF NOT EXISTS idx_questions_content_hash ON public.questions(content_hash);
CREATE INDEX IF NOT EXISTS idx_questions_exam_tag ON public.questions(exam_tag);
CREATE INDEX IF NOT EXISTS idx_questions_source_type ON public.questions(source_type);
CREATE INDEX IF NOT EXISTS idx_questions_unit_code ON public.questions(unit_code);

-- 3. Zero-Repetition Tracking Table
CREATE TABLE IF NOT EXISTS public.user_question_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  exam_tag TEXT NOT NULL DEFAULT 'TNPSC_GROUP_1',
  times_seen INTEGER NOT NULL DEFAULT 1,
  last_attempt_status TEXT DEFAULT 'ATTEMPTED',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_question_seen UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_user_q_history_user ON public.user_question_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_q_history_tag ON public.user_question_history(exam_tag);
CREATE INDEX IF NOT EXISTS idx_user_q_history_times_seen ON public.user_question_history(times_seen);

ALTER TABLE public.user_question_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own question history" ON public.user_question_history;
CREATE POLICY "Users can read own question history"
  ON public.user_question_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own question history" ON public.user_question_history;
CREATE POLICY "Users can insert own question history"
  ON public.user_question_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own question history" ON public.user_question_history;
CREATE POLICY "Users can update own question history"
  ON public.user_question_history FOR UPDATE
  USING (auth.uid() = user_id);
