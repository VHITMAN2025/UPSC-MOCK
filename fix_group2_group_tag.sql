-- Fix Group 2 Questions: Update group_tag Column
-- This ensures mock tests can find the questions

-- STEP 1: Check current state before fix
SELECT 
    'BEFORE FIX' as status,
    COUNT(*) as total_group2_questions,
    COUNT(CASE WHEN group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A') THEN 1 END) as with_correct_tag,
    COUNT(CASE WHEN group_tag IS NULL OR group_tag NOT IN ('Group 2', 'Group 2/2A', 'Group 2A') THEN 1 END) as with_wrong_or_null_tag
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_2';

-- STEP 2: Update group_tag to 'Group 2' for all TNPSC_GROUP_2 questions that don't have it
UPDATE questions
SET group_tag = 'Group 2'
WHERE exam_tag = 'TNPSC_GROUP_2'
  AND (group_tag IS NULL OR group_tag NOT IN ('Group 2', 'Group 2/2A', 'Group 2A'));

-- STEP 3: Verify the fix
SELECT 
    'AFTER FIX' as status,
    COUNT(*) as total_group2_questions,
    COUNT(CASE WHEN group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A') THEN 1 END) as with_correct_tag,
    COUNT(CASE WHEN group_tag IS NULL OR group_tag NOT IN ('Group 2', 'Group 2/2A', 'Group 2A') THEN 1 END) as with_wrong_or_null_tag
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_2';

-- STEP 4: Show usable questions for mock test (should be ~135 now)
SELECT 
    COUNT(*) as usable_for_mock_test
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_2'
  AND group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')
  AND correct_option IS NOT NULL;

-- STEP 5: Breakdown by difficulty (to verify distribution)
SELECT 
    difficulty_level,
    COUNT(*) as count
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_2'
  AND group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')
  AND correct_option IS NOT NULL
GROUP BY difficulty_level
ORDER BY difficulty_level;
