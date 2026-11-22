-- Check if the 3 HARD questions were imported successfully
SELECT 
  q.id,
  q.unit_code,
  q.unit_name,
  q.difficulty_level,
  q.correct_option,
  p.exam_type,
  q.created_at,
  LEFT(q.question_text, 50) as question_preview
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_4'
  AND q.created_at > NOW() - INTERVAL '30 minutes'
ORDER BY q.created_at DESC;

-- Check the exact HARD count for the 3 deficit units
SELECT 
  q.unit_code,
  q.difficulty_level,
  COUNT(q.id) as count
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_4'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND q.correct_option IS NOT NULL
  AND q.unit_code IN ('G4_GS_U1', 'G4_TA_U5', 'G4_TA_U6')
  AND q.difficulty_level = 'HARD'
GROUP BY q.unit_code, q.difficulty_level
ORDER BY q.unit_code;
