-- FINAL CHECK: Show exact needed vs available for each unit-difficulty combination
SELECT 
  b.unit_code,
  'EASY' as difficulty,
  ROUND(b.quota * 0.20) as needed,
  COALESCE(SUM(CASE WHEN q.difficulty_level = 'EASY' THEN 1 ELSE 0 END), 0) as available,
  ROUND(b.quota * 0.20) - COALESCE(SUM(CASE WHEN q.difficulty_level = 'EASY' THEN 1 ELSE 0 END), 0) as deficit
FROM (
  SELECT 'G4_GS_U1' as unit_code, 5 as quota UNION ALL
  SELECT 'G4_GS_U2', 5 UNION ALL SELECT 'G4_GS_U3', 10 UNION ALL
  SELECT 'G4_GS_U4', 15 UNION ALL SELECT 'G4_GS_U5', 20 UNION ALL
  SELECT 'G4_GS_U6', 20 UNION ALL SELECT 'G4_APT_U1', 15 UNION ALL
  SELECT 'G4_APT_U2', 10 UNION ALL SELECT 'G4_TA_U1', 25 UNION ALL
  SELECT 'G4_TA_U2', 15 UNION ALL SELECT 'G4_TA_U3', 15 UNION ALL
  SELECT 'G4_TA_U4', 10 UNION ALL SELECT 'G4_TA_U5', 15 UNION ALL
  SELECT 'G4_TA_U6', 5 UNION ALL SELECT 'G4_TA_U7', 15
) b
LEFT JOIN questions q ON q.unit_code = b.unit_code AND q.exam_tag = 'TNPSC_GROUP_4'
LEFT JOIN papers p ON q.paper_id = p.id
WHERE p.exam_type IS NULL OR (p.exam_type NOT IN ('Full Mock', 'Custom') AND q.correct_option IS NOT NULL)
GROUP BY b.unit_code, b.quota
HAVING ROUND(b.quota * 0.20) - COALESCE(SUM(CASE WHEN q.difficulty_level = 'EASY' THEN 1 ELSE 0 END), 0) > 0

UNION ALL

SELECT 
  b.unit_code,
  'MEDIUM' as difficulty,
  ROUND(b.quota * 0.50) as needed,
  COALESCE(SUM(CASE WHEN q.difficulty_level = 'MEDIUM' THEN 1 ELSE 0 END), 0) as available,
  ROUND(b.quota * 0.50) - COALESCE(SUM(CASE WHEN q.difficulty_level = 'MEDIUM' THEN 1 ELSE 0 END), 0) as deficit
FROM (
  SELECT 'G4_GS_U1' as unit_code, 5 as quota UNION ALL
  SELECT 'G4_GS_U2', 5 UNION ALL SELECT 'G4_GS_U3', 10 UNION ALL
  SELECT 'G4_GS_U4', 15 UNION ALL SELECT 'G4_GS_U5', 20 UNION ALL
  SELECT 'G4_GS_U6', 20 UNION ALL SELECT 'G4_APT_U1', 15 UNION ALL
  SELECT 'G4_APT_U2', 10 UNION ALL SELECT 'G4_TA_U1', 25 UNION ALL
  SELECT 'G4_TA_U2', 15 UNION ALL SELECT 'G4_TA_U3', 15 UNION ALL
  SELECT 'G4_TA_U4', 10 UNION ALL SELECT 'G4_TA_U5', 15 UNION ALL
  SELECT 'G4_TA_U6', 5 UNION ALL SELECT 'G4_TA_U7', 15
) b
LEFT JOIN questions q ON q.unit_code = b.unit_code AND q.exam_tag = 'TNPSC_GROUP_4'
LEFT JOIN papers p ON q.paper_id = p.id
WHERE p.exam_type IS NULL OR (p.exam_type NOT IN ('Full Mock', 'Custom') AND q.correct_option IS NOT NULL)
GROUP BY b.unit_code, b.quota
HAVING ROUND(b.quota * 0.50) - COALESCE(SUM(CASE WHEN q.difficulty_level = 'MEDIUM' THEN 1 ELSE 0 END), 0) > 0

UNION ALL

SELECT 
  b.unit_code,
  'HARD' as difficulty,
  ROUND(b.quota * 0.30) as needed,
  COALESCE(SUM(CASE WHEN q.difficulty_level = 'HARD' THEN 1 ELSE 0 END), 0) as available,
  ROUND(b.quota * 0.30) - COALESCE(SUM(CASE WHEN q.difficulty_level = 'HARD' THEN 1 ELSE 0 END), 0) as deficit
FROM (
  SELECT 'G4_GS_U1' as unit_code, 5 as quota UNION ALL
  SELECT 'G4_GS_U2', 5 UNION ALL SELECT 'G4_GS_U3', 10 UNION ALL
  SELECT 'G4_GS_U4', 15 UNION ALL SELECT 'G4_GS_U5', 20 UNION ALL
  SELECT 'G4_GS_U6', 20 UNION ALL SELECT 'G4_APT_U1', 15 UNION ALL
  SELECT 'G4_APT_U2', 10 UNION ALL SELECT 'G4_TA_U1', 25 UNION ALL
  SELECT 'G4_TA_U2', 15 UNION ALL SELECT 'G4_TA_U3', 15 UNION ALL
  SELECT 'G4_TA_U4', 10 UNION ALL SELECT 'G4_TA_U5', 15 UNION ALL
  SELECT 'G4_TA_U6', 5 UNION ALL SELECT 'G4_TA_U7', 15
) b
LEFT JOIN questions q ON q.unit_code = b.unit_code AND q.exam_tag = 'TNPSC_GROUP_4'
LEFT JOIN papers p ON q.paper_id = p.id
WHERE p.exam_type IS NULL OR (p.exam_type NOT IN ('Full Mock', 'Custom') AND q.correct_option IS NOT NULL)
GROUP BY b.unit_code, b.quota
HAVING ROUND(b.quota * 0.30) - COALESCE(SUM(CASE WHEN q.difficulty_level = 'HARD' THEN 1 ELSE 0 END), 0) > 0

ORDER BY deficit DESC, unit_code, difficulty;
