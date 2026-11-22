-- Seed syllabus_units table with proper unit data from TAXONOMY_V2
-- This populates units with subject, unit_code, and unit_name for filtering

DO $$
DECLARE
  v_group4_exam_id UUID;
  v_group2_exam_id UUID;
  v_group1_exam_id UUID;
BEGIN
  -- Get exam IDs
  SELECT id INTO v_group4_exam_id FROM public.syllabus_exams WHERE exam_name = 'TNPSC Group 4';
  SELECT id INTO v_group2_exam_id FROM public.syllabus_exams WHERE exam_name = 'TNPSC Group 2/2A';
  SELECT id INTO v_group1_exam_id FROM public.syllabus_exams WHERE exam_name = 'TNPSC Group 1';

  -- TNPSC GROUP 4 UNITS
  IF v_group4_exam_id IS NOT NULL THEN
    -- General Studies Units
    INSERT INTO public.syllabus_units (exam_id, subject, unit_code, unit_name, unit_number)
    VALUES 
      (v_group4_exam_id, 'General Studies', 'G4_GS_U1', 'Unit I: General Science', 1),
      (v_group4_exam_id, 'General Studies', 'G4_GS_U2', 'Unit II: Geography of India', 2),
      (v_group4_exam_id, 'General Studies', 'G4_GS_U3', 'Unit III: History, Culture of India, and Indian National Movement', 3),
      (v_group4_exam_id, 'General Studies', 'G4_GS_U4', 'Unit IV: Indian Polity', 4),
      (v_group4_exam_id, 'General Studies', 'G4_GS_U5', 'Unit V: Indian Economy and Development Administration in Tamil Nadu', 5),
      (v_group4_exam_id, 'General Studies', 'G4_GS_U6', 'Unit VI: History, Culture, Heritage, and Socio-Political Movements of Tamil Nadu', 6)
    ON CONFLICT DO NOTHING;

    -- Aptitude & Mental Ability Units
    INSERT INTO public.syllabus_units (exam_id, subject, unit_code, unit_name, unit_number)
    VALUES 
      (v_group4_exam_id, 'Aptitude & Mental Ability', 'G4_APT_U1', 'Unit I: Aptitude', 7),
      (v_group4_exam_id, 'Aptitude & Mental Ability', 'G4_APT_U2', 'Unit II: Reasoning', 8)
    ON CONFLICT DO NOTHING;

    -- General Tamil Units
    INSERT INTO public.syllabus_units (exam_id, subject, unit_code, unit_name, unit_number)
    VALUES 
      (v_group4_exam_id, 'General Tamil', 'G4_TA_U1', 'அலகு I: இலக்கணம்', 9),
      (v_group4_exam_id, 'General Tamil', 'G4_TA_U2', 'அலகு II: சொல்லகராதி', 10),
      (v_group4_exam_id, 'General Tamil', 'G4_TA_U3', 'அலகு III: எழுதும் திறன்', 11),
      (v_group4_exam_id, 'General Tamil', 'G4_TA_U4', 'அலகு IV: கலைச் சொற்கள்', 12),
      (v_group4_exam_id, 'General Tamil', 'G4_TA_U5', 'அலகு V: வாசித்தல் - புரிந்து கொள்ளும் திறன்', 13),
      (v_group4_exam_id, 'General Tamil', 'G4_TA_U6', 'அலகு VI: எளிய மொழி பெயர்ப்பு', 14),
      (v_group4_exam_id, 'General Tamil', 'G4_TA_U7', 'அலகு VII: இலக்கியம், தமிழ் அறிஞர்களும், தமிழ்த்தொண்டும்', 15)
    ON CONFLICT DO NOTHING;

    -- General English Units
    INSERT INTO public.syllabus_units (exam_id, subject, unit_code, unit_name, unit_number)
    VALUES 
      (v_group4_exam_id, 'General English', 'G4_EN_U1', 'Unit I: Grammar', 16),
      (v_group4_exam_id, 'General English', 'G4_EN_U2', 'Unit II: Vocabulary', 17),
      (v_group4_exam_id, 'General English', 'G4_EN_U3', 'Unit III: Writing Skills', 18),
      (v_group4_exam_id, 'General English', 'G4_EN_U4', 'Unit IV: Technical Terms', 19),
      (v_group4_exam_id, 'General English', 'G4_EN_U5', 'Unit V: Reading Comprehension', 20),
      (v_group4_exam_id, 'General English', 'G4_EN_U6', 'Unit VI: Translation', 21),
      (v_group4_exam_id, 'General English', 'G4_EN_U7', 'Unit VII: Literary Works', 22)
    ON CONFLICT DO NOTHING;
  END IF;

  -- TNPSC GROUP 2 UNITS
  IF v_group2_exam_id IS NOT NULL THEN
    -- General Studies Units
    INSERT INTO public.syllabus_units (exam_id, subject, unit_code, unit_name, unit_number)
    VALUES 
      (v_group2_exam_id, 'General Studies', 'G2_GS_U1', 'Unit I: General Science', 1),
      (v_group2_exam_id, 'General Studies', 'G2_GS_U2', 'Unit II: Geography of India', 2),
      (v_group2_exam_id, 'General Studies', 'G2_GS_U3', 'Unit III: History, Culture of India, and Indian National Movement', 3),
      (v_group2_exam_id, 'General Studies', 'G2_GS_U4', 'Unit IV: Indian Polity', 4),
      (v_group2_exam_id, 'General Studies', 'G2_GS_U5', 'Unit V: Indian Economy and Development Administration in Tamil Nadu', 5),
      (v_group2_exam_id, 'General Studies', 'G2_GS_U6', 'Unit VI: History, Culture, Heritage, and Socio-Political Movements in Tamil Nadu', 6)
    ON CONFLICT DO NOTHING;

    -- Aptitude & Mental Ability Units
    INSERT INTO public.syllabus_units (exam_id, subject, unit_code, unit_name, unit_number)
    VALUES 
      (v_group2_exam_id, 'Aptitude & Mental Ability', 'G2_APT_U1', 'Unit I: Aptitude', 7),
      (v_group2_exam_id, 'Aptitude & Mental Ability', 'G2_APT_U2', 'Unit II: Reasoning', 8)
    ON CONFLICT DO NOTHING;

    -- General Tamil Units (Combined)
    INSERT INTO public.syllabus_units (exam_id, subject, unit_code, unit_name, unit_number)
    VALUES 
      (v_group2_exam_id, 'General Tamil', 'G2_TA_U1', 'அலகு I முதல் VII: பொதுத் தமிழ்', 9)
    ON CONFLICT DO NOTHING;

    -- General English Units (Combined)
    INSERT INTO public.syllabus_units (exam_id, subject, unit_code, unit_name, unit_number)
    VALUES 
      (v_group2_exam_id, 'General English', 'G2_EN_U1', 'Unit I to VII: General English', 10)
    ON CONFLICT DO NOTHING;
  END IF;

  -- TNPSC GROUP 1 UNITS
  IF v_group1_exam_id IS NOT NULL THEN
    -- General Studies Units
    INSERT INTO public.syllabus_units (exam_id, subject, unit_code, unit_name, unit_number)
    VALUES 
      (v_group1_exam_id, 'General Studies', 'G1_GS_U1', 'Unit I: General Science', 1),
      (v_group1_exam_id, 'General Studies', 'G1_GS_U2', 'Unit II: Geography of India', 2),
      (v_group1_exam_id, 'General Studies', 'G1_GS_U3', 'Unit III: History, Culture of India, and Indian National Movement', 3),
      (v_group1_exam_id, 'General Studies', 'G1_GS_U4', 'Unit IV: Indian Polity', 4),
      (v_group1_exam_id, 'General Studies', 'G1_GS_U5', 'Unit V: Indian Economy and Development Administration in Tamil Nadu', 5),
      (v_group1_exam_id, 'General Studies', 'G1_GS_U6', 'Unit VI: History, Culture, Heritage, and Socio-Political Movements in Tamil Nadu', 6)
    ON CONFLICT DO NOTHING;

    -- Aptitude & Mental Ability Units
    INSERT INTO public.syllabus_units (exam_id, subject, unit_code, unit_name, unit_number)
    VALUES 
      (v_group1_exam_id, 'Aptitude & Mental Ability', 'G1_APT_U1', 'Unit I: Aptitude', 7),
      (v_group1_exam_id, 'Aptitude & Mental Ability', 'G1_APT_U2', 'Unit II: Reasoning', 8)
    ON CONFLICT DO NOTHING;
  END IF;

END $$;
