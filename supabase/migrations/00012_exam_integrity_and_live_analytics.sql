-- Production integrity contract for the TNPSC question bank and assessment flow.
-- Existing legacy rows are left readable; every newly inserted/edited question is validated.

-- The migration is intentionally rerunnable. A previously installed strict trigger
-- must not block the one-time legacy-data normalisation below.
DROP TRIGGER IF EXISTS questions_require_tnpsc_metadata ON public.questions;

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS group_tag TEXT,
  ADD COLUMN IF NOT EXISTS unit_tag TEXT,
  ADD COLUMN IF NOT EXISTS unit_code TEXT,
  ADD COLUMN IF NOT EXISTS exam_year TEXT,
  ADD COLUMN IF NOT EXISTS is_pyq BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'VINA',
  ADD COLUMN IF NOT EXISTS macro_topic TEXT,
  ADD COLUMN IF NOT EXISTS micro_topic TEXT,
  ADD COLUMN IF NOT EXISTS question_text_tamil TEXT,
  ADD COLUMN IF NOT EXISTS option_a_tamil TEXT,
  ADD COLUMN IF NOT EXISTS option_b_tamil TEXT,
  ADD COLUMN IF NOT EXISTS option_c_tamil TEXT,
  ADD COLUMN IF NOT EXISTS option_d_tamil TEXT,
  ADD COLUMN IF NOT EXISTS year INTEGER,
  ADD COLUMN IF NOT EXISTS exam_group TEXT,
  ADD COLUMN IF NOT EXISTS unit_number INTEGER,
  ADD COLUMN IF NOT EXISTS pyq_year INTEGER,
  ADD COLUMN IF NOT EXISTS language_format JSONB;

UPDATE public.questions
SET exam_group = COALESCE(exam_group, group_tag),
    unit_number = COALESCE(
      unit_number,
      CASE
        WHEN NULLIF(regexp_replace(COALESCE(unit_code, unit_tag, ''), '[^0-9]', '', 'g'), '')::INTEGER BETWEEN 1 AND 10
          THEN NULLIF(regexp_replace(COALESCE(unit_code, unit_tag, ''), '[^0-9]', '', 'g'), '')::INTEGER
        ELSE NULL
      END
    ),
    pyq_year = CASE WHEN COALESCE(source_type, CASE WHEN is_pyq THEN 'PYQ' ELSE 'VINA' END) = 'PYQ'
                    THEN COALESCE(pyq_year, year, NULLIF(exam_year, '')::INTEGER)
                    ELSE NULL END,
    language_format = COALESCE(language_format, jsonb_build_object(
      'english', jsonb_build_object('question', question_text, 'options', jsonb_build_array(option_a, option_b, option_c, option_d)),
      'tamil', jsonb_build_object('question', question_text_tamil, 'options', jsonb_build_array(option_a_tamil, option_b_tamil, option_c_tamil, option_d_tamil))
    ));

ALTER TABLE public.attempt_answers DROP CONSTRAINT IF EXISTS attempt_answers_selected_option_check;
ALTER TABLE public.attempt_answers ADD CONSTRAINT attempt_answers_selected_option_check
  CHECK (selected_option IN ('A', 'B', 'C', 'D', 'E') OR selected_option IS NULL);
ALTER TABLE public.attempt_answers ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER NOT NULL DEFAULT 0
  CHECK (time_spent_seconds >= 0);

CREATE OR REPLACE FUNCTION public.validate_tnpsc_question()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.exam_group IS NULL OR NEW.exam_group NOT IN ('Group 1', 'Group 2', 'Group 2A', 'Group 4') THEN
    RAISE EXCEPTION 'exam_group must be Group 1, Group 2, Group 2A, or Group 4';
  END IF;
  IF NEW.unit_number IS NULL OR NEW.unit_number NOT BETWEEN 1 AND 10 THEN
    RAISE EXCEPTION 'unit_number must be between 1 and 10';
  END IF;
  IF NULLIF(btrim(COALESCE(NEW.macro_topic, '')), '') IS NULL OR NULLIF(btrim(COALESCE(NEW.micro_topic, '')), '') IS NULL THEN
    RAISE EXCEPTION 'macro_topic and micro_topic are required';
  END IF;
  IF COALESCE(NEW.source_type, CASE WHEN NEW.is_pyq THEN 'PYQ' ELSE 'VINA' END) = 'PYQ' AND NEW.pyq_year IS NULL THEN
    RAISE EXCEPTION 'pyq_year is required for PYQ questions';
  END IF;
  IF COALESCE(NEW.source_type, CASE WHEN NEW.is_pyq THEN 'PYQ' ELSE 'VINA' END) <> 'PYQ' AND NEW.pyq_year IS NOT NULL THEN
    RAISE EXCEPTION 'pyq_year must be null for non-PYQ questions';
  END IF;
  IF NEW.language_format IS NULL OR NOT (NEW.language_format ? 'english') OR NOT (NEW.language_format ? 'tamil') THEN
    RAISE EXCEPTION 'language_format must contain english and tamil objects';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS questions_require_tnpsc_metadata ON public.questions;
CREATE TRIGGER questions_require_tnpsc_metadata
  BEFORE INSERT OR UPDATE OF exam_group, unit_number, macro_topic, micro_topic, pyq_year, language_format, source_type, is_pyq
  ON public.questions FOR EACH ROW EXECUTE FUNCTION public.validate_tnpsc_question();

CREATE INDEX IF NOT EXISTS idx_questions_practice_filter
  ON public.questions (exam_group, unit_number, macro_topic, micro_topic)
  WHERE correct_option IS NOT NULL;

-- One authoritative scoring path. Option E and NULL are always unattempted and never penalized.
CREATE OR REPLACE FUNCTION public.submit_attempt_rpc(p_attempt_id UUID, p_answers JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_attempt public.attempts%ROWTYPE; v_paper public.papers%ROWTYPE; v_q RECORD;
  v_selected TEXT; v_correct INT := 0; v_incorrect INT := 0; v_unanswered INT := 0;
  v_score NUMERIC := 0; v_marks NUMERIC; v_accuracy NUMERIC := 0;
BEGIN
  SELECT * INTO v_attempt FROM public.attempts WHERE id = p_attempt_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  IF v_attempt.user_id <> auth.uid() AND NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized attempt submission'; END IF;
  IF v_attempt.status = 'completed' THEN RAISE EXCEPTION 'Attempt is already completed'; END IF;
  SELECT * INTO v_paper FROM public.papers WHERE id = v_attempt.paper_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Associated paper not found'; END IF;
  FOR v_q IN SELECT id, correct_option FROM public.questions WHERE paper_id = v_paper.id ORDER BY question_number LOOP
    SELECT upper(nullif(btrim(value->>'selected_option'), '')) INTO v_selected
    FROM jsonb_array_elements(COALESCE(p_answers, '[]'::jsonb)) value WHERE value->>'question_id' = v_q.id::text LIMIT 1;
    IF v_selected IS NULL OR v_selected = 'E' THEN
      v_unanswered := v_unanswered + 1; v_marks := 0;
      INSERT INTO public.attempt_answers(attempt_id, question_id, selected_option, is_correct, marks_obtained)
      VALUES(v_attempt.id, v_q.id, NULLIF(v_selected, 'E'), NULL, 0)
      ON CONFLICT(attempt_id, question_id) DO UPDATE SET selected_option = EXCLUDED.selected_option, is_correct = NULL, marks_obtained = 0;
    ELSIF v_selected = upper(v_q.correct_option) THEN
      v_correct := v_correct + 1; v_marks := COALESCE(v_paper.marks_per_question, 1.5);
      INSERT INTO public.attempt_answers(attempt_id, question_id, selected_option, is_correct, marks_obtained)
      VALUES(v_attempt.id, v_q.id, v_selected, true, v_marks)
      ON CONFLICT(attempt_id, question_id) DO UPDATE SET selected_option = EXCLUDED.selected_option, is_correct = true, marks_obtained = EXCLUDED.marks_obtained;
    ELSE
      v_incorrect := v_incorrect + 1; v_marks := -abs(COALESCE(v_paper.negative_marking, 0));
      INSERT INTO public.attempt_answers(attempt_id, question_id, selected_option, is_correct, marks_obtained)
      VALUES(v_attempt.id, v_q.id, v_selected, false, v_marks)
      ON CONFLICT(attempt_id, question_id) DO UPDATE SET selected_option = EXCLUDED.selected_option, is_correct = false, marks_obtained = EXCLUDED.marks_obtained;
    END IF;
    v_score := v_score + v_marks;
  END LOOP;
  IF v_correct + v_incorrect > 0 THEN v_accuracy := round(100.0 * v_correct / (v_correct + v_incorrect), 2); END IF;
  UPDATE public.attempts SET status='completed', score=round(v_score,2), correct_count=v_correct, incorrect_count=v_incorrect,
    unanswered_count=v_unanswered, accuracy=v_accuracy, submitted_at=now() WHERE id=v_attempt.id;
  RETURN jsonb_build_object('attempt_id',v_attempt.id,'score',round(v_score,2),'correct_count',v_correct,'incorrect_count',v_incorrect,'unanswered_count',v_unanswered,'accuracy',v_accuracy);
END $$;
