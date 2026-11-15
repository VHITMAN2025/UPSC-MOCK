-- Quick Recall question pool: give recall_questions the same 29-column fields
-- as the main question bank, so the admin grid can edit, filter and import
-- them directly. Run once in the Supabase SQL Editor. Safe to re-run.

ALTER TABLE public.recall_questions
  ADD COLUMN IF NOT EXISTS exam_tag           TEXT,
  ADD COLUMN IF NOT EXISTS source_type        TEXT NOT NULL DEFAULT 'VINA',
  ADD COLUMN IF NOT EXISTS year               INTEGER,
  ADD COLUMN IF NOT EXISTS subject_name       TEXT,
  ADD COLUMN IF NOT EXISTS unit_code          TEXT,
  ADD COLUMN IF NOT EXISTS macro_topic        TEXT,
  ADD COLUMN IF NOT EXISTS micro_topic        TEXT,
  ADD COLUMN IF NOT EXISTS sub_topic          TEXT,
  ADD COLUMN IF NOT EXISTS difficulty_level   TEXT,
  ADD COLUMN IF NOT EXISTS question_type      TEXT NOT NULL DEFAULT 'MULTIPLE_CHOICE',
  ADD COLUMN IF NOT EXISTS cognitive_skill    TEXT,
  ADD COLUMN IF NOT EXISTS ideal_time_seconds INTEGER DEFAULT 54,
  ADD COLUMN IF NOT EXISTS content_hash       TEXT,
  ADD COLUMN IF NOT EXISTS option_a_tamil     TEXT,
  ADD COLUMN IF NOT EXISTS option_b_tamil     TEXT,
  ADD COLUMN IF NOT EXISTS option_c_tamil     TEXT,
  ADD COLUMN IF NOT EXISTS option_d_tamil     TEXT,
  ADD COLUMN IF NOT EXISTS explanation_tamil  TEXT;

CREATE INDEX IF NOT EXISTS idx_recall_q_unit_code   ON public.recall_questions(unit_code);
CREATE INDEX IF NOT EXISTS idx_recall_q_source_type ON public.recall_questions(source_type);
CREATE INDEX IF NOT EXISTS idx_recall_q_hash        ON public.recall_questions(content_hash);
CREATE INDEX IF NOT EXISTS idx_recall_q_created     ON public.recall_questions(created_at DESC);

-- Fill the new columns for questions uploaded before this migration. Their
-- metadata lived in tags such as 'unit_code:UNIT_I' and 'macro:Physics'.
-- Only empty columns are filled; nothing already set is overwritten.
UPDATE public.recall_questions r SET
  exam_tag = COALESCE(r.exam_tag,
    (SELECT substr(t, 10) FROM unnest(r.tags) AS t WHERE t LIKE 'exam_tag:%' LIMIT 1),
    r.exam_context),
  unit_code = COALESCE(r.unit_code,
    (SELECT substr(t, 11) FROM unnest(r.tags) AS t WHERE t LIKE 'unit_code:%' LIMIT 1)),
  macro_topic = COALESCE(r.macro_topic,
    (SELECT substr(t, 7) FROM unnest(r.tags) AS t WHERE t LIKE 'macro:%' LIMIT 1),
    r.topic),
  micro_topic = COALESCE(r.micro_topic,
    (SELECT substr(t, 7) FROM unnest(r.tags) AS t WHERE t LIKE 'micro:%' LIMIT 1)),
  sub_topic = COALESCE(r.sub_topic,
    (SELECT substr(t, 5) FROM unnest(r.tags) AS t WHERE t LIKE 'sub:%' LIMIT 1)),
  cognitive_skill = COALESCE(r.cognitive_skill,
    (SELECT substr(t, 5) FROM unnest(r.tags) AS t WHERE t LIKE 'cog:%' LIMIT 1)),
  year = COALESCE(r.year,
    (SELECT substr(t, 6)::INTEGER FROM unnest(r.tags) AS t WHERE t ~ '^year:[0-9]{4}$' LIMIT 1)),
  source_type = CASE
    WHEN EXISTS (SELECT 1 FROM unnest(r.tags) AS t WHERE t = 'source:PYQ') THEN 'PYQ'
    ELSE r.source_type
  END,
  subject_name = COALESCE(r.subject_name, r.subject),
  difficulty_level = COALESCE(r.difficulty_level, upper(r.difficulty))
WHERE r.exam_tag IS NULL
   OR r.unit_code IS NULL
   OR r.macro_topic IS NULL
   OR r.difficulty_level IS NULL;
