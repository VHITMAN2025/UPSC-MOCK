-- SIMPLE CHECK: For each unit, show needed vs available by difficulty
-- Using simple rounding: 20% EASY, 50% MEDIUM, 30% HARD

SELECT 
  b.unit_code,
  b.quota,
  -- Needed (simple rounding)
  ROUND(b.quota * 0.20) as need_easy,
  ROUND(b.quota * 0.50) as need_medium,
  ROUND(b.quota * 0.30) as need_hard,
  -- Available
  COALESCE(SUM(CASE WHEN q.difficulty_level ILIKE 'easy' THEN 1 ELSE 0 END), 0) as have_easy,
  COALESCE(SUM(CASE WHEN q.difficulty_level ILIKE 'medium' THEN 1 ELSE 0 END), 0) as have_medium,
  COALESCE(SUM(CASE WHEN q.difficulty_level ILIKE 'hard' THEN 1 ELSE 0 END), 0) as have_hard,
  -- Deficits
  GREATEST(0, ROUND(b.quota * 0.20) - COALESCE(SUM(CASE WHEN q.difficulty_level ILIKE 'easy' THEN 1 ELSE 0 END), 0)) as deficit_easy,
  GREATEST(0, ROUND(b.quota * 0.50) - COALESCE(SUM(CASE WHEN q.difficulty_level ILIKE 'medium' THEN 1 ELSE 0 END), 0)) as deficit_medium,
  GREATEST(0, ROUND(b.quota * 0.30) - COALESCE(SUM(CASE WHEN q.difficulty_level ILIKE 'hard' THEN 1 ELSE 0 END), 0)) as deficit_hard
FROM (
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
) b
LEFT JOIN questions q ON q.unit_code = b.unit_code 
  AND q.exam_tag = 'TNPSC_GROUP_4'
LEFT JOIN papers p ON q.paper_id = p.id
WHERE p.exam_type IS NULL 
  OR (p.exam_type NOT IN ('Full Mock', 'Custom') AND q.correct_option IS NOT NULL)
GROUP BY b.unit_code, b.quota
HAVING 
  GREATEST(0, ROUND(b.quota * 0.20) - COALESCE(SUM(CASE WHEN q.difficulty_level ILIKE 'easy' THEN 1 ELSE 0 END), 0)) > 0
  OR GREATEST(0, ROUND(b.quota * 0.50) - COALESCE(SUM(CASE WHEN q.difficulty_level ILIKE 'medium' THEN 1 ELSE 0 END), 0)) > 0
  OR GREATEST(0, ROUND(b.quota * 0.30) - COALESCE(SUM(CASE WHEN q.difficulty_level ILIKE 'hard' THEN 1 ELSE 0 END), 0)) > 0
ORDER BY b.unit_code;
