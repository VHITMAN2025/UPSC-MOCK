-- UNDO THE PREVIOUS SWAP - We swapped the wrong way!
-- The CSV file was CORRECT, but the import mapping was wrong
-- This will restore the correct English → English, Tamil → Tamil mapping

-- IMPORTANT: Run ALL queries together in Supabase SQL Editor

BEGIN;

-- Step 1: Add temporary columns (nullable)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS temp_a text;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS temp_b text;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS temp_c text;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS temp_d text;

-- Step 2: Copy current English columns (which have Tamil) to temp
UPDATE questions
SET
  temp_a = option_a,
  temp_b = option_b,
  temp_c = option_c,
  temp_d = option_d
WHERE exam_tag LIKE 'TNPSC%';

-- Step 3: Move Tamil columns to English columns
UPDATE questions
SET
  option_a = COALESCE(option_a_tamil, option_a),
  option_b = COALESCE(option_b_tamil, option_b),
  option_c = COALESCE(option_c_tamil, option_c),
  option_d = COALESCE(option_d_tamil, option_d)
WHERE exam_tag LIKE 'TNPSC%';

-- Step 4: Move temp (original English with Tamil) to Tamil columns
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

-- Step 6: Verify - should now show English in english columns, Tamil in tamil columns
SELECT 
  id,
  LEFT(question_text, 50) as question,
  option_a as should_be_english,
  option_a_tamil as should_be_tamil,
  option_b as should_be_english_b,
  option_b_tamil as should_be_tamil_b
FROM questions
WHERE exam_tag LIKE 'TNPSC%'
LIMIT 10;
