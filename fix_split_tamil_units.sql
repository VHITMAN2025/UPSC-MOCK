-- Fix Group 2 Tamil Unit Code Mismatch
-- The mock test expects G2_TA_U1, G2_TA_U2, G2_TA_U3 (100 questions total)
-- But you only have G2_TA_U1 (35 questions)
-- Solution: We need to generate 65 MORE Tamil questions OR use English instead

-- OPTION 1: If you want Tamil mock tests, you need 65 more Tamil questions
-- OPTION 2: Use English questions instead (you have 21 G2_EN_U1)

-- Let's check the taxonomyV2.js blueprint to see what language option you're using
SELECT 'CHECKING YOUR CONFIGURATION' as status;

-- For now, let's see if we can use a workaround:
-- Update the English questions to fill the Tamil slots temporarily

-- TEMPORARY WORKAROUND (NOT RECOMMENDED FOR PRODUCTION):
-- This will allow mock test to work, but uses English questions in Tamil slots

-- First, let's check what we have
SELECT 'CURRENT STATE' as status;
SELECT 
    unit_code,
    COUNT(*) as count,
    COUNT(CASE WHEN difficulty_level = 'Easy' THEN 1 END) as easy,
    COUNT(CASE WHEN difficulty_level = 'Medium' THEN 1 END) as medium,
    COUNT(CASE WHEN difficulty_level = 'Hard' THEN 1 END) as hard
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_2'
  AND q.group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND (q.unit_code LIKE 'G2_TA_%' OR q.unit_code LIKE 'G2_EN_%')
GROUP BY unit_code;

-- The real solution: You need to generate 65 MORE questions with these unit codes:
-- G2_TA_U2 (Tamil Grammar): 35 questions (7 Easy, 17 Medium, 11 Hard)
-- G2_TA_U3 (Tamil Literature): 30 questions (6 Easy, 15 Medium, 9 Hard)

SELECT 'YOU NEED TO GENERATE THESE QUESTIONS:' as action_required;
SELECT 'G2_TA_U2' as unit_code, 'தமிழ் இலக்கணம் (Tamil Grammar)' as unit_name, 35 as total, 7 as easy, 17 as medium, 11 as hard
UNION ALL
SELECT 'G2_TA_U3', 'தமிழ் இலக்கியம் (Tamil Literature)', 30, 6, 15, 9;

-- Alternative: Check if your system supports English-only Group 2 tests
-- If yes, you need questions for:
-- G2_EN_U1, G2_EN_U2, G2_EN_U3 instead of Tamil units
