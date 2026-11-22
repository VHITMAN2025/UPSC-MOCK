-- DIAGNOSTIC: Check TNPSC questions to understand the column swap issue

-- Step 1: Check sample of TNPSC questions showing all option columns
SELECT 
  id,
  exam_tag,
  LEFT(question_text, 50) as question,
  option_a,
  option_a_tamil,
  option_b,
  option_b_tamil
FROM questions
WHERE exam_tag LIKE 'TNPSC%'
LIMIT 5;

-- Step 2: Count how many TNPSC questions have Tamil in English columns
-- (English columns should have Latin characters, not Tamil Unicode)
SELECT 
  COUNT(*) as total_tnpsc_questions,
  COUNT(CASE 
    WHEN option_a ~ '[\u0B80-\u0BFF]' THEN 1 
  END) as questions_with_tamil_in_option_a,
  COUNT(CASE 
    WHEN option_a_tamil ~ '[\u0B80-\u0BFF]' THEN 1 
  END) as questions_with_tamil_in_option_a_tamil
FROM questions
WHERE exam_tag LIKE 'TNPSC%';

-- Step 3: Show specific examples where Tamil is in English columns
SELECT 
  id,
  option_a as should_be_english_but_is,
  option_a_tamil as should_be_tamil_and_is
FROM questions
WHERE exam_tag LIKE 'TNPSC%'
  AND option_a ~ '[\u0B80-\u0BFF]'
LIMIT 10;
