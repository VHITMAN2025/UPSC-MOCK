-- FINAL STEP: Delete 270 corrupted TNPSC Group 1 questions
-- After running this, you'll re-import from your corrected CSV

-- This will delete from these papers:
-- - TNPSC Group 1 Full Mock Test (23 Oct 2026) - 82 questions
-- - TNPSC Group 1 Previous Year Paper 2023 - 87 questions  
-- - TNPSC Group 1 Previous Year Paper 2024 - 101 questions

DELETE FROM questions
WHERE exam_tag = 'TNPSC_GROUP_1';

-- Verify deletion
SELECT 
  COUNT(*) as remaining_group1_questions
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_1';
-- Should return 0

-- Check other groups are unaffected
SELECT 
  exam_tag,
  COUNT(*) as question_count
FROM questions
WHERE exam_tag LIKE 'TNPSC%'
GROUP BY exam_tag;
