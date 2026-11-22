-- Check the exact case of difficulty_level values in database
SELECT DISTINCT 
  difficulty_level,
  COUNT(*) as count
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_4'
GROUP BY difficulty_level
ORDER BY difficulty_level;

-- Check if ILIKE matches work correctly
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
  AND q.difficulty_level ILIKE 'hard'
GROUP BY q.unit_code, q.difficulty_level;
