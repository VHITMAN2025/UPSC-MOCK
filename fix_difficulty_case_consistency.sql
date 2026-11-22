-- FIX: Standardize all difficulty_level values to uppercase
-- The database has inconsistent casing: "Medium" vs "MEDIUM"

-- 1. Check all difficulty_level variations across all Group 4 questions
SELECT DISTINCT 
  difficulty_level,
  COUNT(*) as count
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_4'
GROUP BY difficulty_level
ORDER BY difficulty_level;

-- 2. Standardize all to uppercase (EASY, MEDIUM, HARD)
UPDATE questions
SET difficulty_level = UPPER(difficulty_level)
WHERE exam_tag = 'TNPSC_GROUP_4'
  AND difficulty_level != UPPER(difficulty_level);

-- 3. Verify the fix
SELECT 
  'After Standardization' as status,
  difficulty_level,
  COUNT(*) as count
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_4'
GROUP BY difficulty_level
ORDER BY difficulty_level;

-- 4. Check if this fixed the deficit
SELECT 
  'Total Usable Questions' as check_type,
  COUNT(q.id) as total_count
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_4'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND q.correct_option IS NOT NULL
  AND q.unit_code IS NOT NULL;
