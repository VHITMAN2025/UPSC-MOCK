-- DIAGNOSTIC: Group 4 Question Analysis
-- This query will show us exactly what's happening with Group 4 questions

-- 1. Total questions by paper type
SELECT 
  'Total by Paper Type' as analysis,
  p.exam_type,
  COUNT(q.id) as question_count
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_4'
GROUP BY p.exam_type
ORDER BY question_count DESC;

-- 2. Questions that WOULD BE INCLUDED (same filters as test generator)
SELECT 
  'Questions Meeting Test Generator Criteria' as analysis,
  COUNT(q.id) as usable_count
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_4'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND q.correct_option IS NOT NULL
  AND q.unit_code IS NOT NULL;

-- 3. Breakdown by unit_code and difficulty (only usable questions)
SELECT 
  'Usable Questions by Unit & Difficulty' as analysis,
  q.unit_code,
  q.difficulty_level,
  COUNT(q.id) as count
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_4'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND q.correct_option IS NOT NULL
  AND q.unit_code IS NOT NULL
GROUP BY q.unit_code, q.difficulty_level
ORDER BY q.unit_code, q.difficulty_level;

-- 4. Questions imported in last 15 minutes
SELECT 
  'Recently Imported Questions' as analysis,
  q.id,
  q.unit_code,
  q.unit_name,
  q.difficulty_level,
  p.exam_type,
  q.correct_option,
  q.created_at
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_4'
  AND q.created_at > NOW() - INTERVAL '15 minutes'
ORDER BY q.created_at DESC;

-- 5. Check for NULL unit_codes (these won't be picked up)
SELECT 
  'Questions with NULL unit_code' as analysis,
  COUNT(q.id) as null_unit_code_count,
  p.exam_type,
  q.unit_name
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_4'
  AND q.unit_code IS NULL
GROUP BY p.exam_type, q.unit_name;

-- 6. Check for NULL correct_option (these won't be picked up)
SELECT 
  'Questions with NULL correct_option' as analysis,
  COUNT(q.id) as null_correct_option_count,
  p.exam_type
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_4'
  AND q.correct_option IS NULL
GROUP BY p.exam_type;

-- 7. Detailed breakdown: What we need vs what we have (per unit)
-- This shows the allocation matrix requirements
WITH blueprint AS (
  SELECT 'G4_GS_U1' as unit_code, 5 as quota UNION ALL
  SELECT 'G4_GS_U2', 5 UNION ALL
  SELECT 'G4_GS_U3', 10 UNION ALL
  SELECT 'G4_GS_U4', 15 UNION ALL
  SELECT 'G4_GS_U5', 20 UNION ALL
  SELECT 'G4_GS_U6', 20 UNION ALL
  SELECT 'G4_APT_U1', 15 UNION ALL
  SELECT 'G4_APT_U2', 10 UNION ALL
  SELECT 'G4_TA_U1', 25 UNION ALL
  SELECT 'G4_TA_U2', 15 UNION ALL
  SELECT 'G4_TA_U3', 15 UNION ALL
  SELECT 'G4_TA_U4', 10 UNION ALL
  SELECT 'G4_TA_U5', 15 UNION ALL
  SELECT 'G4_TA_U6', 5 UNION ALL
  SELECT 'G4_TA_U7', 15
),
usable_questions AS (
  SELECT 
    q.unit_code,
    q.difficulty_level,
    COUNT(q.id) as available
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_4'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND q.correct_option IS NOT NULL
    AND q.unit_code IS NOT NULL
  GROUP BY q.unit_code, q.difficulty_level
)
SELECT 
  'Blueprint vs Available' as analysis,
  b.unit_code,
  b.quota as total_needed,
  ROUND(b.quota * 0.20) as easy_needed,
  ROUND(b.quota * 0.50) as medium_needed,
  ROUND(b.quota * 0.30) as hard_needed,
  COALESCE(SUM(CASE WHEN uq.difficulty_level = 'EASY' THEN uq.available ELSE 0 END), 0) as easy_available,
  COALESCE(SUM(CASE WHEN uq.difficulty_level = 'MEDIUM' THEN uq.available ELSE 0 END), 0) as medium_available,
  COALESCE(SUM(CASE WHEN uq.difficulty_level = 'HARD' THEN uq.available ELSE 0 END), 0) as hard_available,
  COALESCE(SUM(uq.available), 0) as total_available,
  b.quota - COALESCE(SUM(uq.available), 0) as deficit
FROM blueprint b
LEFT JOIN usable_questions uq ON b.unit_code = uq.unit_code
GROUP BY b.unit_code, b.quota
ORDER BY deficit DESC, b.unit_code;
