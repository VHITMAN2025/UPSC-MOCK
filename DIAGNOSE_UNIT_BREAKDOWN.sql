-- Check actual unit breakdown vs blueprint requirement
SELECT 
  unit_code,
  COUNT(*) as total_in_db,
  SUM(CASE WHEN difficulty_level = 'EASY' THEN 1 ELSE 0 END) as easy_actual,
  SUM(CASE WHEN difficulty_level = 'MEDIUM' THEN 1 ELSE 0 END) as medium_actual,
  SUM(CASE WHEN difficulty_level = 'HARD' THEN 1 ELSE 0 END) as hard_actual,
  CASE unit_code
    WHEN 'G1_GS_U1' THEN 10 WHEN 'G1_GS_U2' THEN 10 WHEN 'G1_GS_U3' THEN 25
    WHEN 'G1_GS_U4' THEN 40 WHEN 'G1_GS_U5' THEN 50 WHEN 'G1_GS_U6' THEN 40
    WHEN 'G1_APT_U1' THEN 15 WHEN 'G1_APT_U2' THEN 10
  END as total_needed,
  CASE unit_code
    WHEN 'G1_GS_U1' THEN 2 WHEN 'G1_GS_U2' THEN 2 WHEN 'G1_GS_U3' THEN 5
    WHEN 'G1_GS_U4' THEN 8 WHEN 'G1_GS_U5' THEN 10 WHEN 'G1_GS_U6' THEN 8
    WHEN 'G1_APT_U1' THEN 3 WHEN 'G1_APT_U2' THEN 2
  END as easy_needed,
  CASE unit_code
    WHEN 'G1_GS_U1' THEN 5 WHEN 'G1_GS_U2' THEN 5 WHEN 'G1_GS_U3' THEN 12
    WHEN 'G1_GS_U4' THEN 20 WHEN 'G1_GS_U5' THEN 25 WHEN 'G1_GS_U6' THEN 20
    WHEN 'G1_APT_U1' THEN 8 WHEN 'G1_APT_U2' THEN 5
  END as medium_needed,
  CASE unit_code
    WHEN 'G1_GS_U1' THEN 3 WHEN 'G1_GS_U2' THEN 3 WHEN 'G1_GS_U3' THEN 8
    WHEN 'G1_GS_U4' THEN 12 WHEN 'G1_GS_U5' THEN 15 WHEN 'G1_GS_U6' THEN 12
    WHEN 'G1_APT_U1' THEN 4 WHEN 'G1_APT_U2' THEN 3
  END as hard_needed,
  CASE
    WHEN COUNT(*) < CASE unit_code
      WHEN 'G1_GS_U1' THEN 10 WHEN 'G1_GS_U2' THEN 10 WHEN 'G1_GS_U3' THEN 25
      WHEN 'G1_GS_U4' THEN 40 WHEN 'G1_GS_U5' THEN 50 WHEN 'G1_GS_U6' THEN 40
      WHEN 'G1_APT_U1' THEN 15 WHEN 'G1_APT_U2' THEN 10
    END THEN '❌ NOT ENOUGH QUESTIONS IN DB'
    ELSE '✅ ENOUGH TOTAL'
  END as status
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_1'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND unit_code IN ('G1_GS_U1', 'G1_GS_U2', 'G1_GS_U3', 'G1_GS_U4', 'G1_GS_U5', 'G1_GS_U6', 'G1_APT_U1', 'G1_APT_U2')
GROUP BY unit_code
ORDER BY unit_code;
