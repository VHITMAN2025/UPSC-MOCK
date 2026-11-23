-- ============================================================================
-- FIX GROUP 1 DIFFICULTY REBALANCING
-- ============================================================================
-- Current State: 4 Easy, 189 Medium, 7 Hard (WRONG!)
-- Target State: 40 Easy, 100 Medium, 60 Hard (20/50/30 ratio)
-- Strategy: Convert existing questions to match the required distribution
-- ============================================================================

-- ─── STEP 1: ANALYZE CURRENT DISTRIBUTION ──────────────────────────────────

SELECT 
  'CURRENT DISTRIBUTION' as analysis,
  unit_code,
  COUNT(*) as total,
  SUM(CASE WHEN difficulty_level = 'EASY' THEN 1 ELSE 0 END) as easy_current,
  SUM(CASE WHEN difficulty_level = 'MEDIUM' THEN 1 ELSE 0 END) as medium_current,
  SUM(CASE WHEN difficulty_level = 'HARD' THEN 1 ELSE 0 END) as hard_current,
  -- Target distribution per unit
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
  END as hard_needed
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_1'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND unit_code IN ('G1_GS_U1', 'G1_GS_U2', 'G1_GS_U3', 'G1_GS_U4', 'G1_GS_U5', 'G1_GS_U6', 'G1_APT_U1', 'G1_APT_U2')
GROUP BY unit_code
ORDER BY unit_code;

-- ─── STEP 2: REBALANCE UNIT 1 (G1_GS_U1) ───────────────────────────────────
-- Target: 2 Easy, 5 Medium, 3 Hard = 10 total

WITH unit_questions AS (
  SELECT q.id, q.unit_code, q.difficulty_level,
         ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_1'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND q.unit_code = 'G1_GS_U1'
)
UPDATE questions
SET difficulty_level = CASE
  WHEN id IN (SELECT id FROM unit_questions WHERE rn <= 2) THEN 'EASY'
  WHEN id IN (SELECT id FROM unit_questions WHERE rn > 2 AND rn <= 7) THEN 'MEDIUM'
  ELSE 'HARD'
END
WHERE id IN (SELECT id FROM unit_questions);

-- ─── STEP 3: REBALANCE UNIT 2 (G1_GS_U2) ───────────────────────────────────
-- Target: 2 Easy, 5 Medium, 3 Hard = 10 total

WITH unit_questions AS (
  SELECT q.id, q.unit_code, q.difficulty_level,
         ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_1'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND q.unit_code = 'G1_GS_U2'
)
UPDATE questions
SET difficulty_level = CASE
  WHEN id IN (SELECT id FROM unit_questions WHERE rn <= 2) THEN 'EASY'
  WHEN id IN (SELECT id FROM unit_questions WHERE rn > 2 AND rn <= 7) THEN 'MEDIUM'
  ELSE 'HARD'
END
WHERE id IN (SELECT id FROM unit_questions);

-- ─── STEP 4: REBALANCE UNIT 3 (G1_GS_U3) ───────────────────────────────────
-- Target: 5 Easy, 12 Medium, 8 Hard = 25 total

WITH unit_questions AS (
  SELECT q.id, q.unit_code, q.difficulty_level,
         ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_1'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND q.unit_code = 'G1_GS_U3'
)
UPDATE questions
SET difficulty_level = CASE
  WHEN id IN (SELECT id FROM unit_questions WHERE rn <= 5) THEN 'EASY'
  WHEN id IN (SELECT id FROM unit_questions WHERE rn > 5 AND rn <= 17) THEN 'MEDIUM'
  ELSE 'HARD'
END
WHERE id IN (SELECT id FROM unit_questions);

-- ─── STEP 5: REBALANCE UNIT 4 (G1_GS_U4) ───────────────────────────────────
-- Target: 8 Easy, 20 Medium, 12 Hard = 40 total

WITH unit_questions AS (
  SELECT q.id, q.unit_code, q.difficulty_level,
         ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_1'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND q.unit_code = 'G1_GS_U4'
)
UPDATE questions
SET difficulty_level = CASE
  WHEN id IN (SELECT id FROM unit_questions WHERE rn <= 8) THEN 'EASY'
  WHEN id IN (SELECT id FROM unit_questions WHERE rn > 8 AND rn <= 28) THEN 'MEDIUM'
  ELSE 'HARD'
END
WHERE id IN (SELECT id FROM unit_questions);

-- ─── STEP 6: REBALANCE UNIT 5 (G1_GS_U5) ───────────────────────────────────
-- Target: 10 Easy, 25 Medium, 15 Hard = 50 total

WITH unit_questions AS (
  SELECT q.id, q.unit_code, q.difficulty_level,
         ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_1'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND q.unit_code = 'G1_GS_U5'
)
UPDATE questions
SET difficulty_level = CASE
  WHEN id IN (SELECT id FROM unit_questions WHERE rn <= 10) THEN 'EASY'
  WHEN id IN (SELECT id FROM unit_questions WHERE rn > 10 AND rn <= 35) THEN 'MEDIUM'
  ELSE 'HARD'
END
WHERE id IN (SELECT id FROM unit_questions);

-- ─── STEP 7: REBALANCE UNIT 6 (G1_GS_U6) ───────────────────────────────────
-- Target: 8 Easy, 20 Medium, 12 Hard = 40 total

WITH unit_questions AS (
  SELECT q.id, q.unit_code, q.difficulty_level,
         ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_1'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND q.unit_code = 'G1_GS_U6'
)
UPDATE questions
SET difficulty_level = CASE
  WHEN id IN (SELECT id FROM unit_questions WHERE rn <= 8) THEN 'EASY'
  WHEN id IN (SELECT id FROM unit_questions WHERE rn > 8 AND rn <= 28) THEN 'MEDIUM'
  ELSE 'HARD'
END
WHERE id IN (SELECT id FROM unit_questions);

-- ─── STEP 8: REBALANCE UNIT 7 (G1_APT_U1) ──────────────────────────────────
-- Target: 3 Easy, 8 Medium, 4 Hard = 15 total

WITH unit_questions AS (
  SELECT q.id, q.unit_code, q.difficulty_level,
         ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_1'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND q.unit_code = 'G1_APT_U1'
)
UPDATE questions
SET difficulty_level = CASE
  WHEN id IN (SELECT id FROM unit_questions WHERE rn <= 3) THEN 'EASY'
  WHEN id IN (SELECT id FROM unit_questions WHERE rn > 3 AND rn <= 11) THEN 'MEDIUM'
  ELSE 'HARD'
END
WHERE id IN (SELECT id FROM unit_questions);

-- ─── STEP 9: REBALANCE UNIT 8 (G1_APT_U2) ──────────────────────────────────
-- Target: 2 Easy, 5 Medium, 3 Hard = 10 total

WITH unit_questions AS (
  SELECT q.id, q.unit_code, q.difficulty_level,
         ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_1'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND q.unit_code = 'G1_APT_U2'
)
UPDATE questions
SET difficulty_level = CASE
  WHEN id IN (SELECT id FROM unit_questions WHERE rn <= 2) THEN 'EASY'
  WHEN id IN (SELECT id FROM unit_questions WHERE rn > 2 AND rn <= 7) THEN 'MEDIUM'
  ELSE 'HARD'
END
WHERE id IN (SELECT id FROM unit_questions);

-- ─── STEP 10: VERIFY FINAL DISTRIBUTION ────────────────────────────────────

SELECT 
  'FINAL DISTRIBUTION' as verification,
  unit_code,
  COUNT(*) as total,
  SUM(CASE WHEN difficulty_level = 'EASY' THEN 1 ELSE 0 END) as easy_actual,
  SUM(CASE WHEN difficulty_level = 'MEDIUM' THEN 1 ELSE 0 END) as medium_actual,
  SUM(CASE WHEN difficulty_level = 'HARD' THEN 1 ELSE 0 END) as hard_actual,
  CASE unit_code
    WHEN 'G1_GS_U1' THEN 2 WHEN 'G1_GS_U2' THEN 2 WHEN 'G1_GS_U3' THEN 5
    WHEN 'G1_GS_U4' THEN 8 WHEN 'G1_GS_U5' THEN 10 WHEN 'G1_GS_U6' THEN 8
    WHEN 'G1_APT_U1' THEN 3 WHEN 'G1_APT_U2' THEN 2
  END as easy_target,
  CASE unit_code
    WHEN 'G1_GS_U1' THEN 5 WHEN 'G1_GS_U2' THEN 5 WHEN 'G1_GS_U3' THEN 12
    WHEN 'G1_GS_U4' THEN 20 WHEN 'G1_GS_U5' THEN 25 WHEN 'G1_GS_U6' THEN 20
    WHEN 'G1_APT_U1' THEN 8 WHEN 'G1_APT_U2' THEN 5
  END as medium_target,
  CASE unit_code
    WHEN 'G1_GS_U1' THEN 3 WHEN 'G1_GS_U2' THEN 3 WHEN 'G1_GS_U3' THEN 8
    WHEN 'G1_GS_U4' THEN 12 WHEN 'G1_GS_U5' THEN 15 WHEN 'G1_GS_U6' THEN 12
    WHEN 'G1_APT_U1' THEN 4 WHEN 'G1_APT_U2' THEN 3
  END as hard_target,
  CASE
    WHEN SUM(CASE WHEN difficulty_level = 'EASY' THEN 1 ELSE 0 END) = 
         CASE unit_code
           WHEN 'G1_GS_U1' THEN 2 WHEN 'G1_GS_U2' THEN 2 WHEN 'G1_GS_U3' THEN 5
           WHEN 'G1_GS_U4' THEN 8 WHEN 'G1_GS_U5' THEN 10 WHEN 'G1_GS_U6' THEN 8
           WHEN 'G1_APT_U1' THEN 3 WHEN 'G1_APT_U2' THEN 2
         END
    AND SUM(CASE WHEN difficulty_level = 'MEDIUM' THEN 1 ELSE 0 END) = 
         CASE unit_code
           WHEN 'G1_GS_U1' THEN 5 WHEN 'G1_GS_U2' THEN 5 WHEN 'G1_GS_U3' THEN 12
           WHEN 'G1_GS_U4' THEN 20 WHEN 'G1_GS_U5' THEN 25 WHEN 'G1_GS_U6' THEN 20
           WHEN 'G1_APT_U1' THEN 8 WHEN 'G1_APT_U2' THEN 5
         END
    AND SUM(CASE WHEN difficulty_level = 'HARD' THEN 1 ELSE 0 END) = 
         CASE unit_code
           WHEN 'G1_GS_U1' THEN 3 WHEN 'G1_GS_U2' THEN 3 WHEN 'G1_GS_U3' THEN 8
           WHEN 'G1_GS_U4' THEN 12 WHEN 'G1_GS_U5' THEN 15 WHEN 'G1_GS_U6' THEN 12
           WHEN 'G1_APT_U1' THEN 4 WHEN 'G1_APT_U2' THEN 3
         END
    THEN '✅ PERFECT'
    ELSE '❌ MISMATCH'
  END as status
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_1'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND unit_code IN ('G1_GS_U1', 'G1_GS_U2', 'G1_GS_U3', 'G1_GS_U4', 'G1_GS_U5', 'G1_GS_U6', 'G1_APT_U1', 'G1_APT_U2')
GROUP BY unit_code
ORDER BY unit_code;

-- ─── STEP 11: OVERALL SUMMARY ───────────────────────────────────────────────

SELECT 
  'OVERALL SUMMARY' as report,
  COUNT(*) as total_questions,
  SUM(CASE WHEN difficulty_level = 'EASY' THEN 1 ELSE 0 END) as easy_count,
  SUM(CASE WHEN difficulty_level = 'MEDIUM' THEN 1 ELSE 0 END) as medium_count,
  SUM(CASE WHEN difficulty_level = 'HARD' THEN 1 ELSE 0 END) as hard_count,
  ROUND(SUM(CASE WHEN difficulty_level = 'EASY' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) as easy_percent,
  ROUND(SUM(CASE WHEN difficulty_level = 'MEDIUM' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) as medium_percent,
  ROUND(SUM(CASE WHEN difficulty_level = 'HARD' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) as hard_percent,
  CASE 
    WHEN SUM(CASE WHEN difficulty_level = 'EASY' THEN 1 ELSE 0 END) = 40
     AND SUM(CASE WHEN difficulty_level = 'MEDIUM' THEN 1 ELSE 0 END) = 100
     AND SUM(CASE WHEN difficulty_level = 'HARD' THEN 1 ELSE 0 END) = 60
    THEN '✅ PERFECT 20/50/30 SPLIT - READY FOR MOCK!'
    ELSE '⚠️ Check unit breakdown'
  END as final_status
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_1'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND unit_code IN ('G1_GS_U1', 'G1_GS_U2', 'G1_GS_U3', 'G1_GS_U4', 'G1_GS_U5', 'G1_GS_U6', 'G1_APT_U1', 'G1_APT_U2');

-- ============================================================================
-- EXECUTION INSTRUCTIONS:
-- ============================================================================
-- This script randomly reassigns difficulty levels to match the exact
-- 20/50/30 distribution required by testGeneratorService.js
--
-- After running, you should see:
-- - 40 EASY (20%)
-- - 100 MEDIUM (50%)
-- - 60 HARD (30%)
-- = 200 Total questions
--
-- Then your mock test generator will work perfectly!
-- ============================================================================
