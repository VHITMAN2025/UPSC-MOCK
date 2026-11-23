-- Diagnose which Group 2 unit codes are causing the deficit
-- Run this to see which units have insufficient questions

-- Check what the mock test actually needs (Group 2 blueprint)
SELECT 'GROUP 2 BLUEPRINT REQUIREMENTS' as info;

-- From taxonomyV2.js, Group 2 needs these units with quotas:
-- This shows what the system is looking for

WITH required_units AS (
  SELECT 'G2_TA_U1' as unit_code, 'Part C: General Tamil' as unit_name, 35 as quota
  UNION ALL SELECT 'G2_TA_U2', 'தமிழ் இலக்கணம்', 35
  UNION ALL SELECT 'G2_TA_U3', 'தமிழ் இலக்கியம்', 30
  UNION ALL SELECT 'G2_GS_U1', 'Unit I: General Science', 5
  UNION ALL SELECT 'G2_GS_U2', 'Unit II: Geography of India', 5
  UNION ALL SELECT 'G2_GS_U3', 'Unit III: History, Culture & INM', 10
  UNION ALL SELECT 'G2_GS_U4', 'Unit IV: Indian Polity', 15
  UNION ALL SELECT 'G2_GS_U5', 'Unit V: Indian Economy & TN Dev', 20
  UNION ALL SELECT 'G2_GS_U6', 'Unit VI: TN History & Culture', 20
  UNION ALL SELECT 'G2_APT_U1', 'Unit I: Aptitude', 15
  UNION ALL SELECT 'G2_APT_U2', 'Unit II: Reasoning', 10
)
SELECT 
  r.unit_code,
  r.unit_name,
  r.quota as required,
  COALESCE(COUNT(q.id), 0) as available,
  r.quota - COALESCE(COUNT(q.id), 0) as deficit
FROM required_units r
LEFT JOIN questions q ON q.unit_code = r.unit_code
  AND q.exam_tag = 'TNPSC_GROUP_2'
  AND q.group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')
LEFT JOIN papers p ON q.paper_id = p.id
WHERE p.exam_type NOT IN ('Full Mock', 'Custom') OR p.exam_type IS NULL
GROUP BY r.unit_code, r.unit_name, r.quota
ORDER BY deficit DESC;

-- Show actual unit codes in your database
SELECT 'ACTUAL UNIT CODES IN YOUR DATABASE' as info;
SELECT 
  unit_code,
  COUNT(*) as total_questions,
  COUNT(CASE WHEN difficulty_level = 'Easy' THEN 1 END) as easy,
  COUNT(CASE WHEN difficulty_level = 'Medium' THEN 1 END) as medium,
  COUNT(CASE WHEN difficulty_level = 'Hard' THEN 1 END) as hard
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_2'
  AND q.group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
GROUP BY unit_code
ORDER BY unit_code;
