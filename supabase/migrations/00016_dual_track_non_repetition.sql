-- ============================================================
-- 00016: DUAL-TRACK NON-REPETITION (MOCK VS QUICK RECALL)
-- & RECALL QUESTIONS 29-COLUMN CANONICAL UPGRADE
-- ============================================================

-- 1. Dual-Track Non-Repetition: Mock Test History
CREATE TABLE IF NOT EXISTS public.user_mock_question_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL,
  exam_tag TEXT NOT NULL DEFAULT 'TNPSC_GROUP_4',
  times_seen INTEGER NOT NULL DEFAULT 1,
  last_attempt_status TEXT DEFAULT 'ATTEMPTED',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_mock_question_seen UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_user_mock_q_user ON public.user_mock_question_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mock_q_tag ON public.user_mock_question_history(exam_tag);
CREATE INDEX IF NOT EXISTS idx_user_mock_q_times ON public.user_mock_question_history(times_seen);

ALTER TABLE public.user_mock_question_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own mock question history" ON public.user_mock_question_history;
CREATE POLICY "Users can read own mock question history"
  ON public.user_mock_question_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own mock question history" ON public.user_mock_question_history;
CREATE POLICY "Users can insert own mock question history"
  ON public.user_mock_question_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own mock question history" ON public.user_mock_question_history;
CREATE POLICY "Users can update own mock question history"
  ON public.user_mock_question_history FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. Dual-Track Non-Repetition: Quick Recall History
CREATE TABLE IF NOT EXISTS public.user_quick_recall_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL,
  exam_tag TEXT NOT NULL DEFAULT 'TNPSC_GROUP_4',
  times_seen INTEGER NOT NULL DEFAULT 1,
  last_attempt_status TEXT DEFAULT 'ATTEMPTED',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_recall_question_seen UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_user_recall_q_user ON public.user_quick_recall_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recall_q_tag ON public.user_quick_recall_history(exam_tag);
CREATE INDEX IF NOT EXISTS idx_user_recall_q_times ON public.user_quick_recall_history(times_seen);

ALTER TABLE public.user_quick_recall_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own recall question history" ON public.user_quick_recall_history;
CREATE POLICY "Users can read own recall question history"
  ON public.user_quick_recall_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own recall question history" ON public.user_quick_recall_history;
CREATE POLICY "Users can insert own recall question history"
  ON public.user_quick_recall_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recall question history" ON public.user_quick_recall_history;
CREATE POLICY "Users can update own recall question history"
  ON public.user_quick_recall_history FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Upgrade recall_questions table with Canonical 29-Column Schema columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'content_hash') THEN
    ALTER TABLE public.recall_questions ADD COLUMN content_hash TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'exam_tag') THEN
    ALTER TABLE public.recall_questions ADD COLUMN exam_tag TEXT DEFAULT 'TNPSC_GROUP_4';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'source_type') THEN
    ALTER TABLE public.recall_questions ADD COLUMN source_type TEXT DEFAULT 'VINA';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'year') THEN
    ALTER TABLE public.recall_questions ADD COLUMN year INTEGER DEFAULT 2024;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'subject_name') THEN
    ALTER TABLE public.recall_questions ADD COLUMN subject_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'unit_code') THEN
    ALTER TABLE public.recall_questions ADD COLUMN unit_code TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'macro_topic') THEN
    ALTER TABLE public.recall_questions ADD COLUMN macro_topic TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'micro_topic') THEN
    ALTER TABLE public.recall_questions ADD COLUMN micro_topic TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'sub_topic') THEN
    ALTER TABLE public.recall_questions ADD COLUMN sub_topic TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'difficulty_level') THEN
    ALTER TABLE public.recall_questions ADD COLUMN difficulty_level TEXT DEFAULT 'MEDIUM';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'question_type') THEN
    ALTER TABLE public.recall_questions ADD COLUMN question_type TEXT DEFAULT 'MULTIPLE_CHOICE';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'cognitive_skill') THEN
    ALTER TABLE public.recall_questions ADD COLUMN cognitive_skill TEXT DEFAULT 'FACTUAL_RECALL';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'ideal_time_seconds') THEN
    ALTER TABLE public.recall_questions ADD COLUMN ideal_time_seconds INTEGER DEFAULT 45;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'option_e') THEN
    ALTER TABLE public.recall_questions ADD COLUMN option_e TEXT DEFAULT 'Answer not known';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'option_e_tamil') THEN
    ALTER TABLE public.recall_questions ADD COLUMN option_e_tamil TEXT DEFAULT 'விடை தெரியவில்லை';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'option_a_tamil') THEN
    ALTER TABLE public.recall_questions ADD COLUMN option_a_tamil TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'option_b_tamil') THEN
    ALTER TABLE public.recall_questions ADD COLUMN option_b_tamil TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'option_c_tamil') THEN
    ALTER TABLE public.recall_questions ADD COLUMN option_c_tamil TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'option_d_tamil') THEN
    ALTER TABLE public.recall_questions ADD COLUMN option_d_tamil TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'en_explanation') THEN
    ALTER TABLE public.recall_questions ADD COLUMN en_explanation TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recall_questions' AND column_name = 'ta_explanation') THEN
    ALTER TABLE public.recall_questions ADD COLUMN ta_explanation TEXT;
  END IF;
END $$;
