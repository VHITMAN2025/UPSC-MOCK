-- DIAGNOSTIC: Find the real issue with TNPSC Tamil/English columns

-- Query 1: Check a few TNPSC questions showing what's actually in the database
SELECT 
  id,
  exam_tag,
  LEFT(question_text, 60) as question_sample,
  option_a as db_option_a,
  option_a_tamil as db_option_a_tamil,
  option_b as db_option_b,
  option_b_tamil as db_option_b_tamil
FROM questions
WHERE exam_tag LIKE 'TNPSC%'
ORDER BY created_at DESC
LIMIT 10;

-- Query 2: Count questions where option_a contains Tamil characters
SELECT 
  COUNT(*) as total_tnpsc,
  COUNT(CASE WHEN option_a ~ '[\u0B80-\u0BFF]' THEN 1 END) as option_a_has_tamil,
  COUNT(CASE WHEN option_a_tamil ~ '[\u0B80-\u0BFF]' THEN 1 END) as option_a_tamil_has_tamil,
  COUNT(CASE WHEN option_a ~ '[a-zA-Z]' AND option_a !~ '[\u0B80-\u0BFF]' THEN 1 END) as option_a_is_english
FROM questions
WHERE exam_tag LIKE 'TNPSC%';

-- Query 3: Show examples where columns appear swapped (Tamil in English column)
SELECT 
  id,
  LEFT(question_text, 50) as question,
  option_a as should_be_english,
  option_a_tamil as should_be_tamil
FROM questions
WHERE exam_tag LIKE 'TNPSC%'
  AND option_a ~ '[\u0B80-\u0BFF]'
  AND option_a !~ '[a-zA-Z]'
LIMIT 5;

-- Query 4: Show examples where both columns have same value
SELECT 
  id,
  LEFT(question_text, 50) as question,
  option_a,
  option_a_tamil,
  CASE 
    WHEN option_a = option_a_tamil THEN 'DUPLICATE'
    ELSE 'DIFFERENT'
  END as status
FROM questions
WHERE exam_tag LIKE 'TNPSC%'
LIMIT 10;
