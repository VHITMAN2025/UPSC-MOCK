-- Diagnose Group 2 Question Availability for Mock Tests
-- Run this in Supabase SQL Editor

-- 1. Check total Group 2 questions and their group_tag values
SELECT 
    group_tag,
    COUNT(*) as total_questions,
    COUNT(CASE WHEN correct_option IS NOT NULL THEN 1 END) as with_answer,
    COUNT(CASE WHEN difficulty_level = 'EASY' THEN 1 END) as easy,
    COUNT(CASE WHEN difficulty_level = 'MEDIUM' THEN 1 END) as medium,
    COUNT(CASE WHEN difficulty_level = 'HARD' THEN 1 END) as hard
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_2' 
   OR group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')
GROUP BY group_tag
ORDER BY group_tag;

-- 2. Check questions by unit_code
SELECT 
    unit_code,
    group_tag,
    COUNT(*) as count
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_2'
GROUP BY unit_code, group_tag
ORDER BY unit_code;

-- 3. Check if group_tag column is NULL or incorrect
SELECT 
    id,
    exam_tag,
    group_tag,
    unit_code,
    LEFT(question_text, 50) as question_preview
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_2'
  AND (group_tag IS NULL OR group_tag NOT IN ('Group 2', 'Group 2/2A', 'Group 2A'))
LIMIT 20;

-- 4. Count questions that mock test can actually use
-- (These match the criteria: correct group_tag AND has answer)
SELECT 
    COUNT(*) as usable_for_mock_test
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_2'
  AND group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')
  AND correct_option IS NOT NULL;

-- 5. Detailed breakdown by unit for mock test
SELECT 
    unit_code,
    difficulty_level,
    COUNT(*) as count
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_2'
  AND group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')
  AND correct_option IS NOT NULL
GROUP BY unit_code, difficulty_level
ORDER BY unit_code, difficulty_level;
