-- FIX: Convert 3 existing MEDIUM questions to HARD to fill the exact deficit
-- This is safer than importing new questions that might fail validation

-- 1. Convert 1 MEDIUM to HARD for G4_GS_U1 (General Science)
UPDATE questions
SET difficulty_level = 'HARD'
WHERE id IN (
  SELECT q.id
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_4'
    AND q.unit_code = 'G4_GS_U1'
    AND q.difficulty_level = 'MEDIUM'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND q.correct_option IS NOT NULL
  ORDER BY q.created_at DESC
  LIMIT 1
);

-- 2. Convert 1 MEDIUM to HARD for G4_TA_U5 (Reading Comprehension)
UPDATE questions
SET difficulty_level = 'HARD'
WHERE id IN (
  SELECT q.id
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_4'
    AND q.unit_code = 'G4_TA_U5'
    AND q.difficulty_level = 'MEDIUM'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND q.correct_option IS NOT NULL
  ORDER BY q.created_at DESC
  LIMIT 1
);

-- 3. Convert 1 MEDIUM to HARD for G4_TA_U6 (Translation)
UPDATE questions
SET difficulty_level = 'HARD'
WHERE id IN (
  SELECT q.id
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_4'
    AND q.unit_code = 'G4_TA_U6'
    AND q.difficulty_level = 'MEDIUM'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND q.correct_option IS NOT NULL
  ORDER BY q.created_at DESC
  LIMIT 1
);

-- 4. Verify the fix worked
SELECT 
  'After Fix - HARD counts' as check_type,
  q.unit_code,
  COUNT(q.id) as hard_count
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_4'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND q.correct_option IS NOT NULL
  AND q.unit_code IN ('G4_GS_U1', 'G4_TA_U5', 'G4_TA_U6')
  AND q.difficulty_level ILIKE 'hard'
GROUP BY q.unit_code
ORDER BY q.unit_code;
