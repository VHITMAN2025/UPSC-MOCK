-- SIMPLE FIX: Swap all TNPSC option columns
-- This swaps English ↔ Tamil columns for all TNPSC questions
-- Handles NULL values by using temporary columns

-- IMPORTANT: Run ALL queries together in Supabase SQL Editor as a single transaction

BEGIN;

-- Step 1: Add temporary columns (nullable)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS temp_a text;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS temp_b text;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS temp_c text;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS temp_d text;

-- Step 2: Copy English options to temp columns
UPDATE questions
SET
  temp_a = option_a,
  temp_b = option_b,
  temp_c = option_c,
  temp_d = option_d
WHERE exam_tag LIKE 'TNPSC%';

-- Step 3: Move Tamil to English columns (use original English as fallback if Tamil is NULL)
UPDATE questions
SET
  option_a = COALESCE(option_a_tamil, option_a),
  option_b = COALESCE(option_b_tamil, option_b),
  option_c = COALESCE(option_c_tamil, option_c),
  option_d = COALESCE(option_d_tamil, option_d)
WHERE exam_tag LIKE 'TNPSC%';

-- Step 4: Move temp (original English) to Tamil columns
UPDATE questions
SET
  option_a_tamil = temp_a,
  option_b_tamil = temp_b,
  option_c_tamil = temp_c,
  option_d_tamil = temp_d
WHERE exam_tag LIKE 'TNPSC%';

-- Step 5: Drop temporary columns
ALTER TABLE questions DROP COLUMN temp_a;
ALTER TABLE questions DROP COLUMN temp_b;
ALTER TABLE questions DROP COLUMN temp_c;
ALTER TABLE questions DROP COLUMN temp_d;

COMMIT;

-- Step 6: Verify the fix
SELECT 
  id,
  LEFT(question_text, 50) as question,
  option_a as english_option_a,
  option_a_tamil as tamil_option_a,
  option_b as english_option_b,
  option_b_tamil as tamil_option_b
FROM questions
WHERE exam_tag LIKE 'TNPSC%'
LIMIT 5;
