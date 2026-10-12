-- ============================================================
-- INTERACTIVE SYLLABUS & TOPIC ANALYTICS — Schema & Aggregation RPC
-- Hierarchy: Group/Exam -> Unit -> Macro-Topic -> Micro-Topic
-- Safe to run multiple times (idempotent)
-- ============================================================

-- ── 1. Create Micro-Topics Table (Level 3 of Hierarchy) ────────
CREATE TABLE IF NOT EXISTS public.syllabus_micro_topics (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  macro_topic_id     UUID NOT NULL REFERENCES public.syllabus_topics(id) ON DELETE CASCADE,
  micro_topic_name   TEXT NOT NULL,
  micro_topic_number INTEGER DEFAULT 1,
  description        TEXT,
  display_order      INTEGER DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_syllabus_micro_topics_macro
  ON public.syllabus_micro_topics(macro_topic_id);

ALTER TABLE public.syllabus_micro_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read syllabus_micro_topics" ON public.syllabus_micro_topics;
CREATE POLICY "Anyone can read syllabus_micro_topics"
  ON public.syllabus_micro_topics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage syllabus_micro_topics" ON public.syllabus_micro_topics;
CREATE POLICY "Admins manage syllabus_micro_topics"
  ON public.syllabus_micro_topics FOR ALL USING (public.is_admin() OR auth.role() = 'authenticated');

-- ── 2. Add Taxonomy Metadata Columns to Questions Bank ─────────
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS group_id         UUID REFERENCES public.syllabus_exams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS group_name       TEXT,
  ADD COLUMN IF NOT EXISTS unit_id          UUID REFERENCES public.syllabus_units(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unit_name        TEXT,
  ADD COLUMN IF NOT EXISTS macro_topic_id   UUID REFERENCES public.syllabus_topics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS macro_topic_name TEXT,
  ADD COLUMN IF NOT EXISTS micro_topic_id   UUID REFERENCES public.syllabus_micro_topics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS micro_topic_name TEXT;

CREATE INDEX IF NOT EXISTS idx_questions_taxonomy_group ON public.questions(group_id, group_name);
CREATE INDEX IF NOT EXISTS idx_questions_taxonomy_unit  ON public.questions(unit_id);
CREATE INDEX IF NOT EXISTS idx_questions_taxonomy_macro ON public.questions(macro_topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_taxonomy_micro ON public.questions(micro_topic_id);

-- Also extend recall_questions with taxonomy metadata
ALTER TABLE public.recall_questions
  ADD COLUMN IF NOT EXISTS group_id         UUID REFERENCES public.syllabus_exams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS group_name       TEXT,
  ADD COLUMN IF NOT EXISTS unit_id          UUID REFERENCES public.syllabus_units(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unit_name        TEXT,
  ADD COLUMN IF NOT EXISTS macro_topic_id   UUID REFERENCES public.syllabus_topics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS macro_topic_name TEXT,
  ADD COLUMN IF NOT EXISTS micro_topic_id   UUID REFERENCES public.syllabus_micro_topics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS micro_topic_name TEXT;

-- ── 3. Optimized RPC for Real-Time Coverage & Accuracy ─────────
-- Formulas:
-- Coverage (%) = (COUNT(DISTINCT attempted_question_id) / NULLIF(COUNT(DISTINCT total_questions_in_topic), 0)) * 100
-- Accuracy (%) = (COUNT(correct_answers_in_topic) / NULLIF(COUNT(total_attempts_in_topic), 0)) * 100
CREATE OR REPLACE FUNCTION public.get_syllabus_topic_analytics(
  p_user_id   UUID,
  p_exam_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_exam_id UUID;
  v_result  JSONB;
BEGIN
  SELECT id INTO v_exam_id
  FROM public.syllabus_exams
  WHERE exam_name = p_exam_name
  LIMIT 1;

  IF v_exam_id IS NULL THEN
    RETURN jsonb_build_object(
      'exam_name', p_exam_name,
      'units', '[]'::jsonb
    );
  END IF;

  WITH user_attempts_cte AS (
    SELECT
      aa.id AS attempt_answer_id,
      aa.question_id,
      aa.is_correct
    FROM public.attempt_answers aa
    INNER JOIN public.attempts a ON a.id = aa.attempt_id
    WHERE a.user_id = p_user_id
      AND a.status = 'completed'
      AND aa.selected_option IS NOT NULL
  ),
  micro_stats AS (
    SELECT
      mt.id AS micro_topic_id,
      mt.macro_topic_id,
      mt.micro_topic_name,
      mt.micro_topic_number,
      COUNT(DISTINCT q.id) AS total_questions,
      COUNT(DISTINCT CASE WHEN ua.attempt_answer_id IS NOT NULL THEN q.id END) AS attempted_questions,
      COUNT(ua.attempt_answer_id) AS total_attempts,
      COUNT(CASE WHEN ua.is_correct = true THEN ua.attempt_answer_id END) AS correct_questions,
      COALESCE(
        ROUND(
          (COUNT(DISTINCT CASE WHEN ua.attempt_answer_id IS NOT NULL THEN q.id END)::NUMERIC
           / NULLIF(COUNT(DISTINCT q.id), 0)) * 100, 1
        ), 0
      ) AS coverage_percentage,
      COALESCE(
        ROUND(
          (COUNT(CASE WHEN ua.is_correct = true THEN ua.attempt_answer_id END)::NUMERIC
           / NULLIF(COUNT(ua.attempt_answer_id), 0)) * 100, 1
        ), 0
      ) AS accuracy_percentage
    FROM public.syllabus_micro_topics mt
    LEFT JOIN public.questions q ON q.micro_topic_id = mt.id
    LEFT JOIN user_attempts_cte ua ON ua.question_id = q.id
    GROUP BY mt.id, mt.macro_topic_id, mt.micro_topic_name, mt.micro_topic_number
  )
  SELECT jsonb_build_object(
    'exam_id', v_exam_id,
    'exam_name', p_exam_name,
    'micro_stats', COALESCE(jsonb_agg(row_to_json(micro_stats)), '[]'::jsonb)
  ) INTO v_result
  FROM micro_stats;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
