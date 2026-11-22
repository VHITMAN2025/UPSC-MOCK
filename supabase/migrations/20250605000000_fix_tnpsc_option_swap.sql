-- Fix TNPSC questions where English and Tamil options are swapped
-- This happens when Tamil text ends up in option_a/b/c/d (English columns)
-- and needs to be swapped with option_a/b/c/d_tamil (Tamil columns)

-- Backup table (optional, for safety)
-- CREATE TABLE IF NOT EXISTS questions_backup_20250605 AS SELECT * FROM questions WHERE exam_tag LIKE 'TNPSC%';

-- Swap English and Tamil options for TNPSC questions where option_a contains Tamil
UPDATE questions
SET
  option_a = option_a_tamil,
  option_a_tamil = option_a,
  option_b = option_b_tamil,
  option_b_tamil = option_b,
  option_c = option_c_tamil,
  option_c_tamil = option_c,
  option_d = option_d_tamil,
  option_d_tamil = option_d
WHERE
  exam_tag LIKE 'TNPSC%'
  AND option_a ~ '[\u0B80-\u0BFF]'  -- Contains Tamil Unicode characters
  AND option_a !~ '[a-zA-Z]';        -- Does NOT contain English letters

-- Verify the fix
-- SELECT 
--   id,
--   LEFT(question_text, 50) as question,
--   option_a as english_option_a,
--   option_a_tamil as tamil_option_a
-- FROM questions
-- WHERE exam_tag LIKE 'TNPSC%'
-- LIMIT 10;
