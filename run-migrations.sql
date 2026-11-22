-- Run this file in Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste and Run

-- Migration 00026: Add subject field to syllabus_units
ALTER TABLE public.syllabus_units 
ADD COLUMN IF NOT EXISTS subject TEXT;

ALTER TABLE public.syllabus_units 
ADD COLUMN IF NOT EXISTS unit_code TEXT;

UPDATE public.syllabus_units
SET subject = CASE
  WHEN unit_name ILIKE '%General Studies%' OR unit_name ILIKE '%GS%' OR unit_name ILIKE '%History%' OR unit_name ILIKE '%Geography%' OR unit_name ILIKE '%Polity%' OR unit_name ILIKE '%Economy%' OR unit_name ILIKE '%Culture%' THEN 'General Studies'
  WHEN unit_name ILIKE '%General Science%' OR unit_name ILIKE '%Science%' THEN 'General Studies'
  WHEN unit_name ILIKE '%Aptitude%' OR unit_name ILIKE '%Mental Ability%' OR unit_name ILIKE '%Reasoning%' THEN 'Aptitude & Mental Ability'
  WHEN unit_name ILIKE '%Tamil%' OR unit_name ILIKE '%தமிழ்%' THEN 'General Tamil'
  WHEN unit_name ILIKE '%English%' THEN 'General English'
  ELSE 'General Studies'
END
WHERE subject IS NULL;

CREATE INDEX IF NOT EXISTS idx_syllabus_units_subject ON public.syllabus_units(subject);
CREATE INDEX IF NOT EXISTS idx_syllabus_units_exam_subject ON public.syllabus_units(exam_id, subject);

-- Migration 00027: Seed syllabus units from taxonomy
DO $$
DECLARE
  v_group4_exam_id UUID;
  v_group2_exam_id UUID;
  v_group1_exam_id UUID;
BEGIN
  SELECT id INTO v_group4_exam_id FROM public.syllabus_exams WHERE exam_name = 'TNPSC Group 4';
  SELECT id INTO v_group2_exam_id FROM public.syllabus_exams WHERE exam_name = 'TNPSC Group 2/2A';
  SELECT id INTO v_group1_exam_id FROM public.syllabus_exams WHERE exam_name = 'TNPSC Group 1';

  -- Clear existing units to avoid conflicts
  DELETE FROM public.syllabus_units;

  -- TNPSC GROUP 4 UNITS
  IF v_group4_exam_id IS NOT NULL THEN
    INSERT INTO public.syllabus_units (exam_id, subject, unit_code, unit_name, unit_number)
    VALUES 
      (v_group4_exam_id, 'General Studies', 'G4_GS_U1', 'Unit I: General Science', 1),
      (v_group4_exam_id, 'General Studies', 'G4_GS_U2', 'Unit II: Geography of India', 2),
      (v_group4_exam_id, 'General Studies', 'G4_GS_U3', 'Unit III: History, Culture of India, and Indian National Movement', 3),
      (v_group4_exam_id, 'General Studies', 'G4_GS_U4', 'Unit IV: Indian Polity', 4),
      (v_group4_exam_id, 'General Studies', 'G4_GS_U5', 'Unit V: Indian Economy and Development Administration in Tamil Nadu', 5),
      (v_group4_exam_id, 'General Studies', 'G4_GS_U6', 'Unit VI: History, Culture, Heritage, and Socio-Political Movements of Tamil Nadu', 6),
      (v_group4_exam_id, 'Aptitude & Mental Ability', 'G4_APT_U1', 'Unit I: Aptitude', 7),
      (v_group4_exam_id, 'Aptitude & Mental Ability', 'G4_APT_U2', 'Unit II: Reasoning', 8),
      (v_group4_exam_id, 'General Tamil', 'G4_TA_U1', 'அலகு I: இலக்கணம்', 9),
      (v_group4_exam_id, 'General Tamil', 'G4_TA_U2', 'அலகு II: சொல்லகராதி', 10),
      (v_group4_exam_id, 'General Tamil', 'G4_TA_U3', 'அலகு III: எழுதும் திறன்', 11),
      (v_group4_exam_id, 'General Tamil', 'G4_TA_U4', 'அலகு IV: கலைச் சொற்கள்', 12),
      (v_group4_exam_id, 'General Tamil', 'G4_TA_U5', 'அலகு V: வாசித்தல் - புரிந்து கொள்ளும் திறன்', 13),
      (v_group4_exam_id, 'General Tamil', 'G4_TA_U6', 'அலகு VI: எளிய மொழி பெயர்ப்பு', 14),
      (v_group4_exam_id, 'General Tamil', 'G4_TA_U7', 'அலகு VII: இலக்கியம், தமிழ் அறிஞர்களும், தமிழ்த்தொண்டும்', 15),
      (v_group4_exam_id, 'General English', 'G4_EN_U1', 'Unit I: Grammar', 16),
      (v_group4_exam_id, 'General English', 'G4_EN_U2', 'Unit II: Vocabulary', 17),
      (v_group4_exam_id, 'General English', 'G4_EN_U3', 'Unit III: Writing Skills', 18),
      (v_group4_exam_id, 'General English', 'G4_EN_U4', 'Unit IV: Technical Terms', 19),
      (v_group4_exam_id, 'General English', 'G4_EN_U5', 'Unit V: Reading Comprehension', 20),
      (v_group4_exam_id, 'General English', 'G4_EN_U6', 'Unit VI: Translation', 21),
      (v_group4_exam_id, 'General English', 'G4_EN_U7', 'Unit VII: Literary Works', 22);
  END IF;

  -- TNPSC GROUP 2 UNITS
  IF v_group2_exam_id IS NOT NULL THEN
    INSERT INTO public.syllabus_units (exam_id, subject, unit_code, unit_name, unit_number)
    VALUES 
      (v_group2_exam_id, 'General Studies', 'G2_GS_U1', 'Unit I: General Science', 1),
      (v_group2_exam_id, 'General Studies', 'G2_GS_U2', 'Unit II: Geography of India', 2),
      (v_group2_exam_id, 'General Studies', 'G2_GS_U3', 'Unit III: History, Culture of India, and Indian National Movement', 3),
      (v_group2_exam_id, 'General Studies', 'G2_GS_U4', 'Unit IV: Indian Polity', 4),
      (v_group2_exam_id, 'General Studies', 'G2_GS_U5', 'Unit V: Indian Economy and Development Administration in Tamil Nadu', 5),
      (v_group2_exam_id, 'General Studies', 'G2_GS_U6', 'Unit VI: History, Culture, Heritage, and Socio-Political Movements in Tamil Nadu', 6),
      (v_group2_exam_id, 'Aptitude & Mental Ability', 'G2_APT_U1', 'Unit I: Aptitude', 7),
      (v_group2_exam_id, 'Aptitude & Mental Ability', 'G2_APT_U2', 'Unit II: Reasoning', 8),
      (v_group2_exam_id, 'General Tamil', 'G2_TA_U1', 'அலகு I முதல் VII: பொதுத் தமிழ்', 9),
      (v_group2_exam_id, 'General English', 'G2_EN_U1', 'Unit I to VII: General English', 10);
  END IF;

  -- TNPSC GROUP 1 UNITS
  IF v_group1_exam_id IS NOT NULL THEN
    INSERT INTO public.syllabus_units (exam_id, subject, unit_code, unit_name, unit_number)
    VALUES 
      (v_group1_exam_id, 'General Studies', 'G1_GS_U1', 'Unit I: General Science', 1),
      (v_group1_exam_id, 'General Studies', 'G1_GS_U2', 'Unit II: Geography of India', 2),
      (v_group1_exam_id, 'General Studies', 'G1_GS_U3', 'Unit III: History, Culture of India, and Indian National Movement', 3),
      (v_group1_exam_id, 'General Studies', 'G1_GS_U4', 'Unit IV: Indian Polity', 4),
      (v_group1_exam_id, 'General Studies', 'G1_GS_U5', 'Unit V: Indian Economy and Development Administration in Tamil Nadu', 5),
      (v_group1_exam_id, 'General Studies', 'G1_GS_U6', 'Unit VI: History, Culture, Heritage, and Socio-Political Movements in Tamil Nadu', 6),
      (v_group1_exam_id, 'Aptitude & Mental Ability', 'G1_APT_U1', 'Unit I: Aptitude', 7),
      (v_group1_exam_id, 'Aptitude & Mental Ability', 'G1_APT_U2', 'Unit II: Reasoning', 8);
  END IF;

END $$;

-- Verify the data
SELECT 
  se.exam_name,
  su.subject,
  su.unit_code,
  su.unit_name,
  su.unit_number
FROM public.syllabus_units su
JOIN public.syllabus_exams se ON su.exam_id = se.id
ORDER BY se.exam_name, su.unit_number;
