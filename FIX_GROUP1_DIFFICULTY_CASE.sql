-- ============================================================================
-- FIX GROUP 1 DIFFICULTY CASE - Convert to Uppercase
-- ============================================================================
-- Issue: 187 questions have lowercase difficulty ("Easy", "Medium", "Hard")
-- Required: Uppercase ("EASY", "MEDIUM", "HARD") for mock test generation
-- Impact: testGeneratorService.js uses case-sensitive ILIKE matching
-- ============================================================================

-- ─── STEP 1: PREVIEW WHAT WILL BE CHANGED ──────────────────────────────────

SELECT 
  'PREVIEW' as step,
  unit_code,
  difficulty_level as current_value,
  CASE difficulty_level
    WHEN 'Easy' THEN 'EASY'
    WHEN 'Medium' THEN 'MEDIUM'
    WHEN 'Hard' THEN 'HARD'
    WHEN 'easy' THEN 'EASY'
    WHEN 'medium' THEN 'MEDIUM'
    WHEN 'hard' THEN 'HARD'
    ELSE difficulty_level
  END as new_value,
  COUNT(*) as affected_questions
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_1'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND unit_code IN ('G1_GS_U1', 'G1_GS_U2', 'G1_GS_U3', 'G1_GS_U4', 'G1_GS_U5', 'G1_GS_U6', 'G1_APT_U1', 'G1_APT_U2')
  AND difficulty_level NOT IN ('EASY', 'MEDIUM', 'HARD')
GROUP BY unit_code, difficulty_level
ORDER BY unit_code, difficulty_level;

-- ─── STEP 2: APPLY THE FIX ─────────────────────────────────────────────────

UPDATE questions
SET difficulty_level = CASE difficulty_level
  WHEN 'Easy' THEN 'EASY'
  WHEN 'Medium' THEN 'MEDIUM'
  WHEN 'Hard' THEN 'HARD'
  WHEN 'easy' THEN 'EASY'
  WHEN 'medium' THEN 'MEDIUM'
  WHEN 'hard' THEN 'HARD'
  ELSE difficulty_level
END
WHERE id IN (
  SELECT q.id
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_1'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND unit_code IN ('G1_GS_U1', 'G1_GS_U2', 'G1_GS_U3', 'G1_GS_U4', 'G1_GS_U5', 'G1_GS_U6', 'G1_APT_U1', 'G1_APT_U2')
    AND difficulty_level NOT IN ('EASY', 'MEDIUM', 'HARD')
);

-- ─── STEP 3: VERIFY THE FIX ────────────────────────────────────────────────

SELECT 
  'VERIFICATION' as step,
  unit_code,
  difficulty_level,
  COUNT(*) as question_count,
  CASE 
    WHEN difficulty_level IN ('EASY', 'MEDIUM', 'HARD') THEN '✅ CORRECT'
    ELSE '❌ STILL WRONG'
  END as status
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_1'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND unit_code IN ('G1_GS_U1', 'G1_GS_U2', 'G1_GS_U3', 'G1_GS_U4', 'G1_GS_U5', 'G1_GS_U6', 'G1_APT_U1', 'G1_APT_U2')
GROUP BY unit_code, difficulty_level
ORDER BY 
  unit_code,
  CASE difficulty_level 
    WHEN 'EASY' THEN 1 
    WHEN 'MEDIUM' THEN 2 
    WHEN 'HARD' THEN 3 
    ELSE 4
  END;

-- ─── STEP 4: FINAL SUMMARY ─────────────────────────────────────────────────

SELECT 
  'FINAL SUMMARY' as step,
  COUNT(*) as total_group1_questions,
  SUM(CASE WHEN difficulty_level = 'EASY' THEN 1 ELSE 0 END) as easy_count,
  SUM(CASE WHEN difficulty_level = 'MEDIUM' THEN 1 ELSE 0 END) as medium_count,
  SUM(CASE WHEN difficulty_level = 'HARD' THEN 1 ELSE 0 END) as hard_count,
  SUM(CASE WHEN difficulty_level NOT IN ('EASY', 'MEDIUM', 'HARD') THEN 1 ELSE 0 END) as invalid_count,
  CASE 
    WHEN SUM(CASE WHEN difficulty_level NOT IN ('EASY', 'MEDIUM', 'HARD') THEN 1 ELSE 0 END) = 0 
    THEN '✅ ALL FIXED - READY FOR MOCK GENERATION'
    ELSE '❌ STILL HAVE ISSUES'
  END as final_status
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_1'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND unit_code IN ('G1_GS_U1', 'G1_GS_U2', 'G1_GS_U3', 'G1_GS_U4', 'G1_GS_U5', 'G1_GS_U6', 'G1_APT_U1', 'G1_APT_U2');

-- ============================================================================
-- EXECUTION INSTRUCTIONS:
-- ============================================================================
-- 1. First, review the PREVIEW to see what will change
-- 2. Then run the entire script to apply the fix
-- 3. Check the VERIFICATION to confirm all are uppercase
-- 4. Review FINAL SUMMARY to ensure 0 invalid_count
-- 
-- Expected Result:
-- - All difficulty_level values should be: EASY, MEDIUM, or HARD (uppercase)
-- - Final status should show: "✅ ALL FIXED - READY FOR MOCK GENERATION"
-- ============================================================================
