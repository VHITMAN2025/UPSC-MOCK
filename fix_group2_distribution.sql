-- Fix Group 2 Question Distribution Issues
-- Run this in Supabase SQL Editor

-- STEP 1: Check current state
SELECT 'CURRENT STATE' as status;
SELECT 
    unit_code,
    difficulty_level,
    COUNT(*) as count
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_2'
  AND group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')
GROUP BY unit_code, difficulty_level
ORDER BY unit_code, difficulty_level;

SELECT 
    'Total:' as metric,
    COUNT(*) as count
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_2'
  AND group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A');

-- STEP 2: Delete invalid unit_code questions
DELETE FROM questions
WHERE exam_tag = 'TNPSC_GROUP_2'
  AND unit_code = 'UNIT_II';

SELECT 'Deleted UNIT_II questions' as status;

-- STEP 3: Keep only 15 English questions (delete 181 excess)
-- Keep the first 15, delete the rest
WITH english_to_keep AS (
  SELECT id
  FROM questions
  WHERE exam_tag = 'TNPSC_GROUP_2'
    AND unit_code = 'G2_EN_U1'
    AND group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')
  ORDER BY id
  LIMIT 15
)
DELETE FROM questions
WHERE exam_tag = 'TNPSC_GROUP_2'
  AND unit_code = 'G2_EN_U1'
  AND id NOT IN (SELECT id FROM english_to_keep);

SELECT 'Kept only 15 English questions, deleted rest' as status;

-- STEP 4: Check new state
SELECT 'AFTER CLEANUP' as status;
SELECT 
    unit_code,
    difficulty_level,
    COUNT(*) as count
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_2'
  AND group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')
GROUP BY unit_code, difficulty_level
ORDER BY unit_code, difficulty_level;

SELECT 
    'Total after cleanup:' as metric,
    COUNT(*) as count
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_2'
  AND group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A');

-- STEP 5: Show what you need to generate
SELECT 'NEEDED TO REACH 200 QUESTIONS' as status;
WITH current_count AS (
  SELECT COUNT(*) as total
  FROM questions
  WHERE exam_tag = 'TNPSC_GROUP_2'
    AND group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')
)
SELECT 
    200 - total as questions_needed,
    ROUND((200 - total) * 0.20) as easy_needed,
    ROUND((200 - total) * 0.50) as medium_needed,
    ROUND((200 - total) * 0.30) as hard_needed
FROM current_count;
