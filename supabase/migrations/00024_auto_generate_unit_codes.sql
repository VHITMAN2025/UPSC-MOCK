-- Migration: Auto-generate unit_codes from unit_names
-- This fixes NULL unit_codes and adds a trigger to auto-populate them

-- ============================================================================
-- STEP 1: Create mapping function to derive unit_code from unit_name
-- ============================================================================

CREATE OR REPLACE FUNCTION public.derive_unit_code_from_name(
  p_exam_tag TEXT,
  p_unit_name TEXT
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_unit_code TEXT;
BEGIN
  -- Return NULL if inputs are NULL
  IF p_exam_tag IS NULL OR p_unit_name IS NULL THEN
    RETURN NULL;
  END IF;

  -- Group 4 mappings
  IF p_exam_tag = 'TNPSC_GROUP_4' THEN
    CASE 
      -- General Studies
      WHEN p_unit_name = 'Unit I: General Science' THEN v_unit_code := 'G4_GS_U1';
      WHEN p_unit_name = 'Unit II: Geography' THEN v_unit_code := 'G4_GS_U2';
      WHEN p_unit_name = 'Unit II: Geography of India' THEN v_unit_code := 'G4_GS_U2';
      WHEN p_unit_name = 'Unit III: History, Culture of India, and Indian National Movement' THEN v_unit_code := 'G4_GS_U3';
      WHEN p_unit_name = 'Unit IV: Indian Polity' THEN v_unit_code := 'G4_GS_U4';
      WHEN p_unit_name = 'Unit V: Indian Economy and Development Administration in Tamil Nadu' THEN v_unit_code := 'G4_GS_U5';
      WHEN p_unit_name = 'Unit VI: History, Culture, Heritage, and Socio-Political Movements of Tamil Nadu' THEN v_unit_code := 'G4_GS_U6';
      
      -- Aptitude
      WHEN p_unit_name = 'Unit I: Aptitude' THEN v_unit_code := 'G4_APT_U1';
      WHEN p_unit_name = 'Unit II: Reasoning' THEN v_unit_code := 'G4_APT_U2';
      
      -- Tamil
      WHEN p_unit_name = 'அலகு I: இலக்கணம்' THEN v_unit_code := 'G4_TA_U1';
      WHEN p_unit_name = 'அலகு II: சொல்லகராதி' THEN v_unit_code := 'G4_TA_U2';
      WHEN p_unit_name = 'அலகு III: எழுதும் திறன்' THEN v_unit_code := 'G4_TA_U3';
      WHEN p_unit_name = 'அலகு IV: கலைச் சொற்கள்' THEN v_unit_code := 'G4_TA_U4';
      WHEN p_unit_name = 'அலகு V: வாசித்தல் - புரிந்து கொள்ளும் திறன்' THEN v_unit_code := 'G4_TA_U5';
      WHEN p_unit_name = 'அலகு VI: எளிய மொழி பெயர்ப்பு' THEN v_unit_code := 'G4_TA_U6';
      WHEN p_unit_name = 'அலகு VII: இலக்கியம், தமிழ் அறிஞர்களும், தமிழ்த்தொண்டும்' THEN v_unit_code := 'G4_TA_U7';
      
      -- English (alternative track)
      WHEN p_unit_name = 'Unit I: Grammar' THEN v_unit_code := 'G4_EN_U1';
      WHEN p_unit_name = 'Unit II: Vocabulary' THEN v_unit_code := 'G4_EN_U2';
      WHEN p_unit_name = 'Unit III: Writing Skills' THEN v_unit_code := 'G4_EN_U3';
      WHEN p_unit_name = 'Unit IV: Technical Terms' THEN v_unit_code := 'G4_EN_U4';
      WHEN p_unit_name = 'Unit V: Reading Comprehension' THEN v_unit_code := 'G4_EN_U5';
      WHEN p_unit_name = 'Unit VI: Translation' THEN v_unit_code := 'G4_EN_U6';
      WHEN p_unit_name = 'Unit VII: Literary Works' THEN v_unit_code := 'G4_EN_U7';
      
      -- Fallback for unknown
      ELSE v_unit_code := NULL;
    END CASE;
  END IF;

  -- Group 2 mappings
  IF p_exam_tag = 'TNPSC_GROUP_2' THEN
    CASE 
      -- General Studies
      WHEN p_unit_name = 'Unit I: General Science' THEN v_unit_code := 'G2_GS_U1';
      WHEN p_unit_name = 'Unit II: Geography' THEN v_unit_code := 'G2_GS_U2';
      WHEN p_unit_name = 'Unit II: Geography of India' THEN v_unit_code := 'G2_GS_U2';
      WHEN p_unit_name = 'Unit III: History, Culture of India, and Indian National Movement' THEN v_unit_code := 'G2_GS_U3';
      WHEN p_unit_name = 'Unit IV: Indian Polity' THEN v_unit_code := 'G2_GS_U4';
      WHEN p_unit_name = 'Unit V: Indian Economy and Development Administration in Tamil Nadu' THEN v_unit_code := 'G2_GS_U5';
      WHEN p_unit_name = 'Unit VI: History, Culture, Heritage, and Socio-Political Movements in Tamil Nadu' THEN v_unit_code := 'G2_GS_U6';
      
      -- Aptitude
      WHEN p_unit_name = 'Unit I: Aptitude' THEN v_unit_code := 'G2_APT_U1';
      WHEN p_unit_name = 'Unit II: Reasoning' THEN v_unit_code := 'G2_APT_U2';
      
      -- Tamil (G2 uses single combined unit in blueprint)
      WHEN p_unit_name LIKE 'அலகு%' THEN v_unit_code := 'G2_TA_U1';
      
      ELSE v_unit_code := NULL;
    END CASE;
  END IF;

  -- Group 1 mappings
  IF p_exam_tag = 'TNPSC_GROUP_1' THEN
    CASE 
      -- General Studies
      WHEN p_unit_name = 'Unit I: General Science' THEN v_unit_code := 'G1_GS_U1';
      WHEN p_unit_name = 'Unit II: Geography' THEN v_unit_code := 'G1_GS_U2';
      WHEN p_unit_name = 'Unit II: Geography of India' THEN v_unit_code := 'G1_GS_U2';
      WHEN p_unit_name = 'Unit III: History, Culture of India, and Indian National Movement' THEN v_unit_code := 'G1_GS_U3';
      WHEN p_unit_name = 'Unit IV: Indian Polity' THEN v_unit_code := 'G1_GS_U4';
      WHEN p_unit_name = 'Unit V: Indian Economy and Development Administration in Tamil Nadu' THEN v_unit_code := 'G1_GS_U5';
      WHEN p_unit_name = 'Unit VI: History, Culture, Heritage, and Socio-Political Movements in Tamil Nadu' THEN v_unit_code := 'G1_GS_U6';
      
      -- Aptitude
      WHEN p_unit_name = 'Unit I: Aptitude' THEN v_unit_code := 'G1_APT_U1';
      WHEN p_unit_name = 'Unit II: Reasoning' THEN v_unit_code := 'G1_APT_U2';
      
      ELSE v_unit_code := NULL;
    END CASE;
  END IF;

  RETURN v_unit_code;
END;
$$;

-- ============================================================================
-- STEP 2: Fix all existing NULL unit_codes
-- ============================================================================

-- Update all questions with NULL unit_code
UPDATE public.questions
SET unit_code = public.derive_unit_code_from_name(exam_tag, unit_name)
WHERE unit_code IS NULL
  AND exam_tag IN ('TNPSC_GROUP_1', 'TNPSC_GROUP_2', 'TNPSC_GROUP_4');

-- ============================================================================
-- STEP 3: Create trigger to auto-populate unit_code on INSERT/UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_populate_unit_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only auto-populate if unit_code is NULL
  IF NEW.unit_code IS NULL AND NEW.unit_name IS NOT NULL THEN
    NEW.unit_code := public.derive_unit_code_from_name(NEW.exam_tag, NEW.unit_name);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_auto_populate_unit_code ON public.questions;

CREATE TRIGGER trigger_auto_populate_unit_code
  BEFORE INSERT OR UPDATE OF unit_name, exam_tag
  ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_unit_code();

-- ============================================================================
-- STEP 4: Verification query (run this to check results)
-- ============================================================================

-- Check count of questions with NULL unit_code (should be 0 or minimal)
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM public.questions
  WHERE exam_tag IN ('TNPSC_GROUP_1', 'TNPSC_GROUP_2', 'TNPSC_GROUP_4')
    AND unit_code IS NULL;
  
  IF null_count > 0 THEN
    RAISE NOTICE 'WARNING: Still have % questions with NULL unit_code after migration', null_count;
  ELSE
    RAISE NOTICE 'SUCCESS: All questions now have valid unit_codes';
  END IF;
END $$;
