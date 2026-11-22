-- FIX: Delete corrupted TNPSC questions and prepare for re-import
-- The CSV upload bug has been fixed in questionService.js
-- Now we need to delete the bad data and re-import from the correct CSV

-- IMPORTANT: You have 1,529 TNPSC questions across 16 papers
-- Be careful which ones you delete!

-- Step 1: Check which questions have duplicate option values
-- (These are the ones affected by the bug)
SELECT 
  COUNT(*) as total_with_duplicates,
  exam_tag,
  COUNT(DISTINCT paper_id) as affected_papers
FROM questions
WHERE exam_tag LIKE 'TNPSC%'
  AND option_a = option_a_tamil
GROUP BY exam_tag;

-- Step 2: Show sample of corrupted questions
SELECT 
  p.title as paper,
  q.question_number,
  LEFT(q.question_text, 50) as question,
  q.option_a as should_be_english,
  q.option_a_tamil as should_be_tamil,
  CASE 
    WHEN q.option_a = q.option_a_tamil THEN 'CORRUPTED'
    ELSE 'OK'
  END as status
FROM questions q
JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag LIKE 'TNPSC%'
LIMIT 20;

-- Step 3: SAFER APPROACH - Only delete questions from specific papers
-- Option A: Delete ONLY Group 1 questions if your CSV is for Group 1
-- DELETE FROM questions
-- WHERE exam_tag = 'TNPSC_GROUP_1';

-- Option B: Delete questions from a specific paper by paper_id
-- (Find the paper_id from Step 2 results above)
-- DELETE FROM questions
-- WHERE paper_id = 'YOUR_PAPER_ID_HERE';

-- Option C: Delete ALL TNPSC questions (DANGEROUS - backs up all 1,529)
-- Only use this if you're sure you want to re-import everything
-- DELETE FROM questions
-- WHERE exam_tag LIKE 'TNPSC%';

-- Step 4: Verify deletion count BEFORE running
SELECT 
  COUNT(*) as questions_that_will_be_deleted
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_1';  -- Change this to match your DELETE WHERE clause

-- After deleting:
-- 1. Refresh your browser (Ctrl+F5)
-- 2. Re-upload your TNPSC-GROUP-1-200-Questions-CORRECT-sam-1.csv file
-- 3. The fixed code will now properly map en_option_a → option_a and ta_option_a → option_a_tamil
