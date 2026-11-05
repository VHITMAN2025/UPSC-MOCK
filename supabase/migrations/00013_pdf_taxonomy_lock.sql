-- Database source of truth for AI PDF categorisation.
CREATE TABLE IF NOT EXISTS public.question_taxonomy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_group TEXT NOT NULL CHECK (exam_group IN ('ALL_GROUPS', 'GROUP_2_AND_4')),
  unit_name TEXT NOT NULL,
  macro_topic_name TEXT NOT NULL,
  micro_topic_name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (exam_group, unit_name, macro_topic_name, micro_topic_name)
);

ALTER TABLE public.question_taxonomy ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read active taxonomy" ON public.question_taxonomy;
CREATE POLICY "Anyone can read active taxonomy" ON public.question_taxonomy FOR SELECT USING (active);
DROP POLICY IF EXISTS "Admins manage taxonomy" ON public.question_taxonomy;
CREATE POLICY "Admins manage taxonomy" ON public.question_taxonomy FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Imported verbatim from exam_topics.csv. This catalog, not a frontend constant,
-- is the approved source of truth for AI PDF classification.
INSERT INTO public.question_taxonomy (exam_group, unit_name, macro_topic_name, micro_topic_name) VALUES
  ('ALL_GROUPS', 'Unit 1: General Science', 'Physics', 'Mechanics & Properties of Matter'),
  ('ALL_GROUPS', 'Unit 1: General Science', 'Physics', 'Light, Sound, Heat & Magnetism'),
  ('ALL_GROUPS', 'Unit 1: General Science', 'Physics', 'Universe & Solar System'),
  ('ALL_GROUPS', 'Unit 1: General Science', 'Chemistry', 'Elements, Compounds, Acids, Bases & Salts'),
  ('ALL_GROUPS', 'Unit 1: General Science', 'Chemistry', 'Petroleum Products, Fertilizers & Pesticides'),
  ('ALL_GROUPS', 'Unit 1: General Science', 'Biology', 'Main Concepts of Life Science & Classification'),
  ('ALL_GROUPS', 'Unit 1: General Science', 'Biology', 'Blood, Circulation & Human Body Systems'),
  ('ALL_GROUPS', 'Unit 1: General Science', 'Biology', 'Human Diseases (Causes & Cures)'),
  ('ALL_GROUPS', 'Unit 1: General Science', 'Environment', 'Environment, Ecology & Diet'),
  ('ALL_GROUPS', 'Unit 2: Current Events', 'History & Politics', 'Latest Diary of Events & National Symbols'),
  ('ALL_GROUPS', 'Unit 2: Current Events', 'History & Politics', 'Prominent Personalities & Places in News'),
  ('ALL_GROUPS', 'Unit 2: Current Events', 'History & Politics', 'Public Awareness & General Administration'),
  ('ALL_GROUPS', 'Unit 2: Current Events', 'Geography & Science', 'Geographical Landmarks'),
  ('ALL_GROUPS', 'Unit 2: Current Events', 'Geography & Science', 'Latest Inventions in Science & Technology'),
  ('ALL_GROUPS', 'Unit 3: Geography of India', 'Physical Geography', 'Location & Physical Features of India'),
  ('ALL_GROUPS', 'Unit 3: Geography of India', 'Climate & Weather', 'Monsoon, Rainfall & Weather Patterns'),
  ('ALL_GROUPS', 'Unit 3: Geography of India', 'Water & Soil', 'Water Resources & Rivers in India'),
  ('ALL_GROUPS', 'Unit 3: Geography of India', 'Water & Soil', 'Soil, Minerals & Natural Resources'),
  ('ALL_GROUPS', 'Unit 3: Geography of India', 'Economic & Human', 'Agriculture Patterns'),
  ('ALL_GROUPS', 'Unit 3: Geography of India', 'Economic & Human', 'Transport, Communication & Population Density'),
  ('ALL_GROUPS', 'Unit 3: Geography of India', 'Economic & Human', 'Disaster Management & Environmental Impact'),
  ('ALL_GROUPS', 'Unit 4: History & Culture', 'Ancient India', 'Indus Valley Civilization'),
  ('ALL_GROUPS', 'Unit 4: History & Culture', 'Ancient India', 'Guptas'),
  ('ALL_GROUPS', 'Unit 4: History & Culture', 'Medieval India', 'Delhi Sultanate'),
  ('ALL_GROUPS', 'Unit 4: History & Culture', 'Medieval India', 'Mughals & Marathas'),
  ('ALL_GROUPS', 'Unit 4: History & Culture', 'South Indian History', 'Cholas, Pandyas, Pallavas'),
  ('ALL_GROUPS', 'Unit 4: History & Culture', 'Culture & Heritage', 'Characteristics of Indian Culture (Unity in Diversity)'),
  ('ALL_GROUPS', 'Unit 4: History & Culture', 'Culture & Heritage', 'India as a Secular State'),
  ('ALL_GROUPS', 'Unit 5: Indian Polity', 'Constitution Basics', 'Making of the Constitution & Salient Features'),
  ('ALL_GROUPS', 'Unit 5: Indian Polity', 'Constitution Basics', 'Preamble, Citizenship, Union & Territories'),
  ('ALL_GROUPS', 'Unit 5: Indian Polity', 'Rights & Duties', 'Fundamental Rights'),
  ('ALL_GROUPS', 'Unit 5: Indian Polity', 'Rights & Duties', 'Fundamental Duties & Directive Principles (DPSP)'),
  ('ALL_GROUPS', 'Unit 5: Indian Polity', 'Executive & Legislature', 'Union Executive (President, PM, Cabinet)'),
  ('ALL_GROUPS', 'Unit 5: Indian Polity', 'Executive & Legislature', 'State Executive (Governor, CM, Council)'),
  ('ALL_GROUPS', 'Unit 5: Indian Polity', 'Executive & Legislature', 'Parliament & State Legislature'),
  ('ALL_GROUPS', 'Unit 5: Indian Polity', 'Judiciary & Local Govt', 'Supreme Court & High Courts'),
  ('ALL_GROUPS', 'Unit 5: Indian Polity', 'Judiciary & Local Govt', 'Local Government (Panchayati Raj)'),
  ('ALL_GROUPS', 'Unit 5: Indian Polity', 'Judiciary & Local Govt', 'Constitutional & Non-Constitutional Bodies (EC, CAG, UPSC)'),
  ('ALL_GROUPS', 'Unit 6: Indian Economy', 'Nature of Economy', 'Nature of Indian Economy & Five Year Plans'),
  ('ALL_GROUPS', 'Unit 6: Indian Economy', 'Nature of Economy', 'Planning Commission & NITI Aayog'),
  ('ALL_GROUPS', 'Unit 6: Indian Economy', 'Finance & Banking', 'Reserve Bank of India (RBI) & Monetary Policy'),
  ('ALL_GROUPS', 'Unit 6: Indian Economy', 'Finance & Banking', 'Finance Commission & Fiscal Policy'),
  ('ALL_GROUPS', 'Unit 6: Indian Economy', 'Sectors of Economy', 'Agriculture, Industry & Rural Development'),
  ('ALL_GROUPS', 'Unit 6: Indian Economy', 'Sectors of Economy', 'GST & Taxation'),
  ('ALL_GROUPS', 'Unit 7: National Movement', 'Early Uprisings', 'Early Uprisings against British Rule (1857 Revolt)'),
  ('ALL_GROUPS', 'Unit 7: National Movement', 'INC & Moderates', 'Indian National Congress Formation'),
  ('ALL_GROUPS', 'Unit 7: National Movement', 'INC & Moderates', 'Emergence of Leaders (B.R. Ambedkar, Bhagat Singh, etc.)'),
  ('ALL_GROUPS', 'Unit 7: National Movement', 'Gandhian Era', 'Non-Cooperation, Civil Disobedience, Quit India'),
  ('ALL_GROUPS', 'Unit 8: TN History & Culture', 'Ancient Tamilakam', 'History of Tamil Society & Archaeological Discoveries'),
  ('ALL_GROUPS', 'Unit 8: TN History & Culture', 'Ancient Tamilakam', 'Sangam Literature'),
  ('ALL_GROUPS', 'Unit 8: TN History & Culture', 'Thirukkural', 'Significance as Secular Literature & Everyday Relevance'),
  ('ALL_GROUPS', 'Unit 8: TN History & Culture', 'Freedom Struggle in TN', 'Early Agitations against British Rule'),
  ('ALL_GROUPS', 'Unit 8: TN History & Culture', 'Freedom Struggle in TN', 'Role of Women in Freedom Struggle'),
  ('ALL_GROUPS', 'Unit 8: TN History & Culture', 'Social Movements', '19th & 20th Century Socio-Political Movements'),
  ('ALL_GROUPS', 'Unit 8: TN History & Culture', 'Social Movements', 'Justice Party, Dravidian Movement & Periyar'),
  ('ALL_GROUPS', 'Unit 9: TN Administration', 'Welfare & Governance', 'Social Justice & Social Harmony'),
  ('ALL_GROUPS', 'Unit 9: TN Administration', 'Welfare & Governance', 'Education & Health Systems in Tamil Nadu'),
  ('ALL_GROUPS', 'Unit 9: TN Administration', 'Welfare & Governance', 'E-Governance in Tamil Nadu'),
  ('ALL_GROUPS', 'Unit 9: TN Administration', 'TN Geography', 'Geography of Tamil Nadu & its Economic Impact'),
  ('ALL_GROUPS', 'Unit 10: Aptitude', 'Quantitative Aptitude', 'Simplification, LCM & HCF'),
  ('ALL_GROUPS', 'Unit 10: Aptitude', 'Quantitative Aptitude', 'Ratio & Proportion'),
  ('ALL_GROUPS', 'Unit 10: Aptitude', 'Quantitative Aptitude', 'Percentage, Simple & Compound Interest'),
  ('ALL_GROUPS', 'Unit 10: Aptitude', 'Quantitative Aptitude', 'Area & Volume'),
  ('ALL_GROUPS', 'Unit 10: Aptitude', 'Quantitative Aptitude', 'Time & Work'),
  ('ALL_GROUPS', 'Unit 10: Aptitude', 'Logical Reasoning', 'Logical Reasoning & Puzzles'),
  ('ALL_GROUPS', 'Unit 10: Aptitude', 'Logical Reasoning', 'Dice & Visual Reasoning'),
  ('ALL_GROUPS', 'Unit 10: Aptitude', 'Logical Reasoning', 'Alpha-Numeric & Number Series'),
  ('GROUP_2_AND_4', 'Part A: General Tamil', 'Ilakkanam (Grammar)', 'Poruthuthal & Pirithu Ezhudhuthal'),
  ('GROUP_2_AND_4', 'Part A: General Tamil', 'Ilakkanam (Grammar)', 'Pizhai Thiruththam & Sol Porul'),
  ('GROUP_2_AND_4', 'Part A: General Tamil', 'Ilakkaiyam (Literature)', 'Thirukkural & Ettuthogai'),
  ('GROUP_2_AND_4', 'Part A: General Tamil', 'Ilakkaiyam (Literature)', 'Paththuppaattu & Iymperum Kaapiyangal'),
  ('GROUP_2_AND_4', 'Part A: General Tamil', 'Tamil Arignargal (Scholars)', 'Tamil Thondu & Bharathiyar/Bharathidasan'),
  ('GROUP_2_AND_4', 'Part A: General Tamil', 'Tamil Arignargal (Scholars)', 'Urainadai & Samudhaya Thondu'),
  ('GROUP_2_AND_4', 'Part A: General English', 'Grammar', 'Match the following & Synonyms/Antonyms'),
  ('GROUP_2_AND_4', 'Part A: General English', 'Grammar', 'Prefix/Suffix & Articles/Prepositions'),
  ('GROUP_2_AND_4', 'Part A: General English', 'Literature', 'Figures of Speech & Poetry Comprehension'),
  ('GROUP_2_AND_4', 'Part A: General English', 'Literature', 'Important Lines from Poems'),
  ('GROUP_2_AND_4', 'Part A: General English', 'Authors & Literary Works', 'Match Authors with Stories'),
  ('GROUP_2_AND_4', 'Part A: General English', 'Authors & Literary Works', 'Biographies & Characters')
ON CONFLICT (exam_group, unit_name, macro_topic_name, micro_topic_name) DO UPDATE
SET active = true;

-- A question can be published only with an exact active taxonomy row. Questions
-- marked NEEDS_REVIEW must be corrected by an admin before publication.
CREATE OR REPLACE FUNCTION public.question_has_approved_taxonomy(
  p_unit TEXT, p_macro TEXT, p_micro TEXT
) RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.question_taxonomy
    WHERE active AND unit_name = p_unit AND macro_topic_name = p_macro AND micro_topic_name = p_micro
  );
$$;

-- This database trigger prevents any API, admin screen, or import script from
-- publishing a question whose Unit > Macro > Micro combination is not in the
-- approved CSV catalog.
CREATE OR REPLACE FUNCTION public.enforce_question_taxonomy_catalog()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.question_has_approved_taxonomy(NEW.unit_name, NEW.macro_topic, NEW.micro_topic) THEN
    RAISE EXCEPTION 'Question taxonomy is not an approved exam_topics.csv mapping: % > % > %',
      NEW.unit_name, NEW.macro_topic, NEW.micro_topic
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_question_taxonomy_catalog ON public.questions;
CREATE TRIGGER enforce_question_taxonomy_catalog
  BEFORE INSERT OR UPDATE OF unit_name, macro_topic, micro_topic ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_question_taxonomy_catalog();
