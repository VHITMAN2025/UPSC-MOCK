-- COMPREHENSIVE: Find remaining deficit by comparing allocation matrix to actual availability
-- The allocation matrix uses Hamilton method to distribute difficulty across units

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
-- Calculate exact allocation using Hamilton method (same as testGeneratorService.js)
allocation AS (
  SELECT 
    unit_code,
    quota,
    -- Raw distribution: 20% easy, 50% medium, 30% hard
    quota * 0.20 as raw_easy,
    quota * 0.50 as raw_medium,
    quota * 0.30 as raw_hard,
    -- Floor values
    FLOOR(quota * 0.20) as floor_easy,
    FLOOR(quota * 0.50) as floor_medium,
    FLOOR(quota * 0.30) as floor_hard,
    -- Calculate remainder
    quota - (FLOOR(quota * 0.20) + FLOOR(quota * 0.50) + FLOOR(quota * 0.30)) as remainder
  FROM blueprint
),
-- Apply Hamilton largest remainder method
allocation_with_remainder AS (
  SELECT 
    unit_code,
    quota,
    -- Start with floor values
    floor_easy + CASE 
      WHEN (raw_easy - floor_easy) >= (raw_medium - floor_medium) 
       AND (raw_easy - floor_easy) >= (raw_hard - floor_hard) 
       AND remainder >= 1 THEN 1 
      WHEN (raw_easy - floor_easy) >= (raw_hard - floor_hard)
       AND remainder >= 2
       AND (raw_medium - floor_medium) >= (raw_easy - floor_easy) THEN 1
      ELSE 0 
    END as need_easy,
    floor_medium + CASE 
      WHEN (raw_medium - floor_medium) >= (raw_easy - floor_easy) 
       AND (raw_medium - floor_medium) >= (raw_hard - floor_hard) 
       AND remainder >= 1 THEN 1
      WHEN (raw_medium - floor_medium) >= (raw_hard - floor_hard)
       AND remainder >= 2
       AND (raw_easy - floor_easy) >= (raw_medium - floor_medium) THEN 1  
      ELSE 0 
    END as need_medium,
    floor_hard + CASE 
      WHEN (raw_hard - floor_hard) >= (raw_easy - floor_easy) 
       AND (raw_hard - floor_hard) >= (raw_medium - floor_medium) 
       AND remainder >= 1 THEN 1
      WHEN (raw_hard - floor_hard) >= (raw_easy - floor_easy)
       AND remainder >= 2
       AND (raw_medium - floor_medium) >= (raw_hard - floor_hard) THEN 1
      ELSE 0 
    END as need_hard
  FROM allocation
),
-- Get actual available counts
available AS (
  SELECT 
    q.unit_code,
    SUM(CASE WHEN q.difficulty_level ILIKE 'easy' THEN 1 ELSE 0 END) as have_easy,
    SUM(CASE WHEN q.difficulty_level ILIKE 'medium' THEN 1 ELSE 0 END) as have_medium,
    SUM(CASE WHEN q.difficulty_level ILIKE 'hard' THEN 1 ELSE 0 END) as have_hard
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_4'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND q.correct_option IS NOT NULL
    AND q.unit_code IS NOT NULL
  GROUP BY q.unit_code
)
-- Compare allocation vs available to find deficits
SELECT 
  a.unit_code,
  a.quota as total_needed,
  a.need_easy,
  a.need_medium,
  a.need_hard,
  COALESCE(av.have_easy, 0) as have_easy,
  COALESCE(av.have_medium, 0) as have_medium,
  COALESCE(av.have_hard, 0) as have_hard,
  GREATEST(0, a.need_easy - COALESCE(av.have_easy, 0)) as deficit_easy,
  GREATEST(0, a.need_medium - COALESCE(av.have_medium, 0)) as deficit_medium,
  GREATEST(0, a.need_hard - COALESCE(av.have_hard, 0)) as deficit_hard,
  GREATEST(0, a.need_easy - COALESCE(av.have_easy, 0)) + 
  GREATEST(0, a.need_medium - COALESCE(av.have_medium, 0)) + 
  GREATEST(0, a.need_hard - COALESCE(av.have_hard, 0)) as total_deficit
FROM allocation_with_remainder a
LEFT JOIN available av ON a.unit_code = av.unit_code
WHERE (
  a.need_easy > COALESCE(av.have_easy, 0) OR
  a.need_medium > COALESCE(av.have_medium, 0) OR
  a.need_hard > COALESCE(av.have_hard, 0)
)
ORDER BY total_deficit DESC, a.unit_code;
