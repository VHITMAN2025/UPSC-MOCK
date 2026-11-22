-- Step 1: Verify the problem exists (should show Tamil in English columns)
SELECT 
  id,
  LEFT(question_text, 60) as question,
  option_a as english_option_a,
  option_a_tamil as tamil_option_a
FROM questions
WHERE exam_tag LIKE 'TNPSC%'
LIMIT 10;

-- Step 2: Run the swap to fix the problem
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
  AND option_a ~ '[\u0B80-\u0BFF]'
  AND option_a !~ '[a-zA-Z]';

-- Step 3: Verify the fix worked (should now show English in English columns)
SELECT 
  id,
  LEFT(question_text, 60) as question,
  option_a as english_option_a,
  option_a_tamil as tamil_option_a
FROM questions
WHERE exam_tag LIKE 'TNPSC%'
LIMIT 10;
