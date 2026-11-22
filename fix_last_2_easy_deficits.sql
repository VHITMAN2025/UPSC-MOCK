-- FIX: Convert 2 MEDIUM questions to EASY to fill the final deficits
-- This will complete the 200-question requirement

-- 1. Convert 1 MEDIUM → EASY for G4_APT_U2 (Reasoning)
UPDATE questions
SET difficulty_level = 'EASY'
WHERE id IN (
  SELECT q.id
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_4'
    AND q.unit_code = 'G4_APT_U2'
    AND q.difficulty_level = 'MEDIUM'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND q.correct_option IS NOT NULL
  ORDER BY q.created_at DESC
  LIMIT 1
);

-- 2. Convert 1 MEDIUM → EASY for G4_GS_U5 (Indian Economy)
UPDATE questions
SET difficulty_level = 'EASY'
WHERE id IN (
  SELECT q.id
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_4'
    AND q.unit_code = 'G4_GS_U5'
    AND q.difficulty_level = 'MEDIUM'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND q.correct_option IS NOT NULL
  ORDER BY q.created_at DESC
  LIMIT 1
);

-- 3. Verify the fix - check EASY counts for these units
SELECT 
  'Final Fix Verification' as status,
  q.unit_code,
  q.difficulty_level,
  COUNT(q.id) as count
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_4'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND q.correct_option IS NOT NULL
  AND q.unit_code IN ('G4_APT_U2', 'G4_GS_U5')
  AND q.difficulty_level = 'EASY'
GROUP BY q.unit_code, q.difficulty_level
ORDER BY q.unit_code;

-- 4. Final count check - should be at least 200
SELECT 
  'FINAL TOTAL CHECK' as status,
  COUNT(q.id) as total_usable_questions
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_4'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND q.correct_option IS NOT NULL
  AND q.unit_code IS NOT NULL;
