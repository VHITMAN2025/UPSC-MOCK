-- Taxonomy v2: review and remap of questions saved under the legacy taxonomy.
--
-- Questions imported before taxonomy v2 keep their legacy unit, macro and micro names.
-- Most legacy micro topics do not match a v2 topic by name, so this migration does not
-- move any question by itself. It provides:
--   1. taxonomy_remap: one row per legacy topic, with the v2 topic it should move to.
--      A row is applied only when confirmed = true.
--   2. apply_taxonomy_remap(): applies the confirmed rows and returns how many questions moved.
--   3. questions_needing_taxonomy_review: every TNPSC question whose names are not a v2 topic.
--
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS public.taxonomy_remap (
  id BIGSERIAL PRIMARY KEY,
  exam_group TEXT NOT NULL,
  old_unit_name TEXT NOT NULL,
  old_macro_topic TEXT NOT NULL,
  old_micro_topic TEXT NOT NULL,
  new_unit_code TEXT NOT NULL,
  new_unit_name TEXT NOT NULL,
  new_macro_topic TEXT NOT NULL,
  new_micro_topic TEXT NOT NULL,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (exam_group, old_unit_name, old_macro_topic, old_micro_topic)
);

ALTER TABLE public.taxonomy_remap ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage taxonomy remap" ON public.taxonomy_remap;
CREATE POLICY "Admins manage taxonomy remap" ON public.taxonomy_remap
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Moves every question that matches a confirmed remap row. The trigger from 00013 still
-- checks the new names against question_taxonomy, so a row pointing at a non-v2 topic fails.
CREATE OR REPLACE FUNCTION public.apply_taxonomy_remap()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  r RECORD;
  moved INTEGER;
  total INTEGER := 0;
BEGIN
  FOR r IN SELECT * FROM public.taxonomy_remap WHERE confirmed LOOP
    UPDATE public.questions q
    SET unit_code = r.new_unit_code,
        unit_name = r.new_unit_name,
        macro_topic = r.new_macro_topic,
        micro_topic = r.new_micro_topic
    WHERE q.exam_tag = r.exam_group
      AND q.unit_name = r.old_unit_name
      AND q.macro_topic = r.old_macro_topic
      AND q.micro_topic = r.old_micro_topic;
    GET DIAGNOSTICS moved = ROW_COUNT;
    total := total + moved;
  END LOOP;
  RETURN total;
END;
$$;

-- Questions whose unit, macro and micro names are not an active v2 topic for their group.
-- security_invoker makes the view follow the caller's access to public.questions.
CREATE OR REPLACE VIEW public.questions_needing_taxonomy_review
WITH (security_invoker = true) AS
SELECT q.id, q.exam_tag, q.unit_code, q.unit_name, q.macro_topic, q.micro_topic
FROM public.questions q
WHERE q.exam_tag IN ('TNPSC_GROUP_1', 'TNPSC_GROUP_2', 'TNPSC_GROUP_4')
  AND NOT EXISTS (
    SELECT 1 FROM public.question_taxonomy t
    WHERE t.active
      AND t.exam_group = q.exam_tag
      AND t.unit_name = q.unit_name
      AND t.macro_topic_name = q.macro_topic
      AND t.micro_topic_name = q.micro_topic
  );
