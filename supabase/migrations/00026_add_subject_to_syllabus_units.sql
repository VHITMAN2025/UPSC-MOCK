-- Add subject field to syllabus_units table and populate it based on unit_name
-- This allows filtering units by subject in the practice builder

-- Add subject column if it doesn't exist
ALTER TABLE public.syllabus_units 
ADD COLUMN IF NOT EXISTS subject TEXT;

-- Add unit_code column if it doesn't exist  
ALTER TABLE public.syllabus_units 
ADD COLUMN IF NOT EXISTS unit_code TEXT;

-- Update existing records to set subject based on unit_name patterns
UPDATE public.syllabus_units
SET subject = CASE
  -- General Studies units
  WHEN unit_name ILIKE '%General Studies%' OR unit_name ILIKE '%GS%' OR unit_name ILIKE '%History%' OR unit_name ILIKE '%Geography%' OR unit_name ILIKE '%Polity%' OR unit_name ILIKE '%Economy%' OR unit_name ILIKE '%Culture%' THEN 'General Studies'
  -- Science units
  WHEN unit_name ILIKE '%General Science%' OR unit_name ILIKE '%Science%' THEN 'General Studies'
  -- Aptitude units
  WHEN unit_name ILIKE '%Aptitude%' OR unit_name ILIKE '%Mental Ability%' OR unit_name ILIKE '%Reasoning%' THEN 'Aptitude & Mental Ability'
  -- Tamil units
  WHEN unit_name ILIKE '%Tamil%' OR unit_name ILIKE '%தமிழ்%' THEN 'General Tamil'
  -- English units
  WHEN unit_name ILIKE '%English%' THEN 'General English'
  ELSE 'General Studies'
END
WHERE subject IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_syllabus_units_subject ON public.syllabus_units(subject);
CREATE INDEX IF NOT EXISTS idx_syllabus_units_exam_subject ON public.syllabus_units(exam_id, subject);
