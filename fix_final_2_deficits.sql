-- FIX: Convert 2 questions to fill the remaining deficits
-- Based on the allocation, we need to fix the HARD deficits that are blocking generation

-- Option 1: Fix G4_TA_U2 HARD deficit (1 MEDIUM → HARD)
UPDATE questions
SET difficulty_level = 'HARD'
WHERE id IN (
  SELECT q.id
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_4'
    AND q.unit_code = 'G4_TA_U2'
    AND q.difficulty_level = 'MEDIUM'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND q.correct_option IS NOT NULL
  ORDER BY q.created_at DESC
  LIMIT 1
);

-- Option 2: Fix G4_TA_U3 HARD deficit (1 MEDIUM → HARD)
UPDATE questions
SET difficulty_level = 'HARD'
WHERE id IN (
  SELECT q.id
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_4'
    AND q.unit_code = 'G4_TA_U3'
    AND q.difficulty_level = 'MEDIUM'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND q.correct_option IS NOT NULL
  ORDER BY q.created_at DESC
  LIMIT 1
);

-- Verify the fix
SELECT 
  'Final Check' as status,
  q.unit_code,
  q.difficulty_level,
  COUNT(q.id) as count
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_4'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND q.correct_option IS NOT NULL
  AND q.unit_code IN ('G4_TA_U2', 'G4_TA_U3')
GROUP BY q.unit_code, q.difficulty_level
ORDER BY q.unit_code, q.difficulty_level;
