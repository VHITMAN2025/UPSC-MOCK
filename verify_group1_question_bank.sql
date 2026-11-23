-- ============================================================================
-- GROUP 1 QUESTION BANK VERIFICATION - 200Q Mock Test Readiness Check
-- ============================================================================
-- Purpose: Verify you have enough questions to generate a full 200Q mock test
-- Expected: At least 200 questions distributed across 8 units with 20/50/30 ratio

-- ─── PART 1: CURRENT INVENTORY BY UNIT & DIFFICULTY ───────────────────────

SELECT 
  'INVENTORY CHECK' as report_section,
  unit_code,
  difficulty_level,
  COUNT(*) as available_count,
  CASE unit_code
    WHEN 'G1_GS_U1' THEN 
      CASE difficulty_level
        WHEN 'EASY' THEN 2
        WHEN 'MEDIUM' THEN 5
        WHEN 'HARD' THEN 3
      END
    WHEN 'G1_GS_U2' THEN 
      CASE difficulty_level
        WHEN 'EASY' THEN 2
        WHEN 'MEDIUM' THEN 5
        WHEN 'HARD' THEN 3
      END
    WHEN 'G1_GS_U3' THEN 
      CASE difficulty_level
        WHEN 'EASY' THEN 5
        WHEN 'MEDIUM' THEN 12
        WHEN 'HARD' THEN 8
      END
    WHEN 'G1_GS_U4' THEN 
      CASE difficulty_level
        WHEN 'EASY' THEN 8
        WHEN 'MEDIUM' THEN 20
        WHEN 'HARD' THEN 12
      END
    WHEN 'G1_GS_U5' THEN 
      CASE difficulty_level
        WHEN 'EASY' THEN 10
        WHEN 'MEDIUM' THEN 25
        WHEN 'HARD' THEN 15
      END
    WHEN 'G1_GS_U6' THEN 
      CASE difficulty_level
        WHEN 'EASY' THEN 8
        WHEN 'MEDIUM' THEN 20
        WHEN 'HARD' THEN 12
      END
    WHEN 'G1_APT_U1' THEN 
      CASE difficulty_level
        WHEN 'EASY' THEN 3
        WHEN 'MEDIUM' THEN 8
        WHEN 'HARD' THEN 4
      END
    WHEN 'G1_APT_U2' THEN 
      CASE difficulty_level
        WHEN 'EASY' THEN 2
        WHEN 'MEDIUM' THEN 5
        WHEN 'HARD' THEN 3
      END
  END as required_for_1_mock,
  COUNT(*) - CASE unit_code
    WHEN 'G1_GS_U1' THEN CASE difficulty_level WHEN 'EASY' THEN 2 WHEN 'MEDIUM' THEN 5 WHEN 'HARD' THEN 3 END
    WHEN 'G1_GS_U2' THEN CASE difficulty_level WHEN 'EASY' THEN 2 WHEN 'MEDIUM' THEN 5 WHEN 'HARD' THEN 3 END
    WHEN 'G1_GS_U3' THEN CASE difficulty_level WHEN 'EASY' THEN 5 WHEN 'MEDIUM' THEN 12 WHEN 'HARD' THEN 8 END
    WHEN 'G1_GS_U4' THEN CASE difficulty_level WHEN 'EASY' THEN 8 WHEN 'MEDIUM' THEN 20 WHEN 'HARD' THEN 12 END
    WHEN 'G1_GS_U5' THEN CASE difficulty_level WHEN 'EASY' THEN 10 WHEN 'MEDIUM' THEN 25 WHEN 'HARD' THEN 15 END
    WHEN 'G1_GS_U6' THEN CASE difficulty_level WHEN 'EASY' THEN 8 WHEN 'MEDIUM' THEN 20 WHEN 'HARD' THEN 12 END
    WHEN 'G1_APT_U1' THEN CASE difficulty_level WHEN 'EASY' THEN 3 WHEN 'MEDIUM' THEN 8 WHEN 'HARD' THEN 4 END
    WHEN 'G1_APT_U2' THEN CASE difficulty_level WHEN 'EASY' THEN 2 WHEN 'MEDIUM' THEN 5 WHEN 'HARD' THEN 3 END
  END as surplus_or_deficit,
  CASE 
    WHEN COUNT(*) >= CASE unit_code
      WHEN 'G1_GS_U1' THEN CASE difficulty_level WHEN 'EASY' THEN 2 WHEN 'MEDIUM' THEN 5 WHEN 'HARD' THEN 3 END
      WHEN 'G1_GS_U2' THEN CASE difficulty_level WHEN 'EASY' THEN 2 WHEN 'MEDIUM' THEN 5 WHEN 'HARD' THEN 3 END
      WHEN 'G1_GS_U3' THEN CASE difficulty_level WHEN 'EASY' THEN 5 WHEN 'MEDIUM' THEN 12 WHEN 'HARD' THEN 8 END
      WHEN 'G1_GS_U4' THEN CASE difficulty_level WHEN 'EASY' THEN 8 WHEN 'MEDIUM' THEN 20 WHEN 'HARD' THEN 12 END
      WHEN 'G1_GS_U5' THEN CASE difficulty_level WHEN 'EASY' THEN 10 WHEN 'MEDIUM' THEN 25 WHEN 'HARD' THEN 15 END
      WHEN 'G1_GS_U6' THEN CASE difficulty_level WHEN 'EASY' THEN 8 WHEN 'MEDIUM' THEN 20 WHEN 'HARD' THEN 12 END
      WHEN 'G1_APT_U1' THEN CASE difficulty_level WHEN 'EASY' THEN 3 WHEN 'MEDIUM' THEN 8 WHEN 'HARD' THEN 4 END
      WHEN 'G1_APT_U2' THEN CASE difficulty_level WHEN 'EASY' THEN 2 WHEN 'MEDIUM' THEN 5 WHEN 'HARD' THEN 3 END
    END THEN '✅ READY'
    ELSE '❌ DEFICIT'
  END as status
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_1'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND q.correct_option IS NOT NULL
  AND unit_code IN ('G1_GS_U1', 'G1_GS_U2', 'G1_GS_U3', 'G1_GS_U4', 'G1_GS_U5', 'G1_GS_U6', 'G1_APT_U1', 'G1_APT_U2')
  AND difficulty_level IN ('EASY', 'MEDIUM', 'HARD')
GROUP BY unit_code, difficulty_level
ORDER BY 
  unit_code,
  CASE difficulty_level 
    WHEN 'EASY' THEN 1 
    WHEN 'MEDIUM' THEN 2 
    WHEN 'HARD' THEN 3 
  END;

-- ─── PART 2: OVERALL SUMMARY ──────────────────────────────────────────────

SELECT 
  'OVERALL SUMMARY' as report_section,
  COUNT(*) as total_questions,
  SUM(CASE WHEN difficulty_level = 'EASY' THEN 1 ELSE 0 END) as easy_count,
  SUM(CASE WHEN difficulty_level = 'MEDIUM' THEN 1 ELSE 0 END) as medium_count,
  SUM(CASE WHEN difficulty_level = 'HARD' THEN 1 ELSE 0 END) as hard_count,
  ROUND(SUM(CASE WHEN difficulty_level = 'EASY' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) as easy_percent,
  ROUND(SUM(CASE WHEN difficulty_level = 'MEDIUM' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) as medium_percent,
  ROUND(SUM(CASE WHEN difficulty_level = 'HARD' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) as hard_percent,
  CASE 
    WHEN COUNT(*) >= 200 THEN '✅ READY FOR FULL MOCK'
    ELSE '❌ NEED ' || (200 - COUNT(*))::text || ' MORE QUESTIONS'
  END as mock_test_readiness
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_1'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND q.correct_option IS NOT NULL
  AND unit_code IN ('G1_GS_U1', 'G1_GS_U2', 'G1_GS_U3', 'G1_GS_U4', 'G1_GS_U5', 'G1_GS_U6', 'G1_APT_U1', 'G1_APT_U2')
  AND difficulty_level IN ('EASY', 'MEDIUM', 'HARD');

-- ─── PART 3: UNITS WITH DEFICITS ──────────────────────────────────────────

SELECT 
  'DEFICIT REPORT' as report_section,
  unit_code,
  difficulty_level,
  COUNT(*) as current_count,
  CASE unit_code
    WHEN 'G1_GS_U1' THEN CASE difficulty_level WHEN 'EASY' THEN 2 WHEN 'MEDIUM' THEN 5 WHEN 'HARD' THEN 3 END
    WHEN 'G1_GS_U2' THEN CASE difficulty_level WHEN 'EASY' THEN 2 WHEN 'MEDIUM' THEN 5 WHEN 'HARD' THEN 3 END
    WHEN 'G1_GS_U3' THEN CASE difficulty_level WHEN 'EASY' THEN 5 WHEN 'MEDIUM' THEN 12 WHEN 'HARD' THEN 8 END
    WHEN 'G1_GS_U4' THEN CASE difficulty_level WHEN 'EASY' THEN 8 WHEN 'MEDIUM' THEN 20 WHEN 'HARD' THEN 12 END
    WHEN 'G1_GS_U5' THEN CASE difficulty_level WHEN 'EASY' THEN 10 WHEN 'MEDIUM' THEN 25 WHEN 'HARD' THEN 15 END
    WHEN 'G1_GS_U6' THEN CASE difficulty_level WHEN 'EASY' THEN 8 WHEN 'MEDIUM' THEN 20 WHEN 'HARD' THEN 12 END
    WHEN 'G1_APT_U1' THEN CASE difficulty_level WHEN 'EASY' THEN 3 WHEN 'MEDIUM' THEN 8 WHEN 'HARD' THEN 4 END
    WHEN 'G1_APT_U2' THEN CASE difficulty_level WHEN 'EASY' THEN 2 WHEN 'MEDIUM' THEN 5 WHEN 'HARD' THEN 3 END
  END as required,
  CASE unit_code
    WHEN 'G1_GS_U1' THEN CASE difficulty_level WHEN 'EASY' THEN 2 WHEN 'MEDIUM' THEN 5 WHEN 'HARD' THEN 3 END
    WHEN 'G1_GS_U2' THEN CASE difficulty_level WHEN 'EASY' THEN 2 WHEN 'MEDIUM' THEN 5 WHEN 'HARD' THEN 3 END
    WHEN 'G1_GS_U3' THEN CASE difficulty_level WHEN 'EASY' THEN 5 WHEN 'MEDIUM' THEN 12 WHEN 'HARD' THEN 8 END
    WHEN 'G1_GS_U4' THEN CASE difficulty_level WHEN 'EASY' THEN 8 WHEN 'MEDIUM' THEN 20 WHEN 'HARD' THEN 12 END
    WHEN 'G1_GS_U5' THEN CASE difficulty_level WHEN 'EASY' THEN 10 WHEN 'MEDIUM' THEN 25 WHEN 'HARD' THEN 15 END
    WHEN 'G1_GS_U6' THEN CASE difficulty_level WHEN 'EASY' THEN 8 WHEN 'MEDIUM' THEN 20 WHEN 'HARD' THEN 12 END
    WHEN 'G1_APT_U1' THEN CASE difficulty_level WHEN 'EASY' THEN 3 WHEN 'MEDIUM' THEN 8 WHEN 'HARD' THEN 4 END
    WHEN 'G1_APT_U2' THEN CASE difficulty_level WHEN 'EASY' THEN 2 WHEN 'MEDIUM' THEN 5 WHEN 'HARD' THEN 3 END
  END - COUNT(*) as deficit,
  '❌ NEED MORE' as action_required
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_1'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND q.correct_option IS NOT NULL
  AND unit_code IN ('G1_GS_U1', 'G1_GS_U2', 'G1_GS_U3', 'G1_GS_U4', 'G1_GS_U5', 'G1_GS_U6', 'G1_APT_U1', 'G1_APT_U2')
  AND difficulty_level IN ('EASY', 'MEDIUM', 'HARD')
GROUP BY unit_code, difficulty_level
HAVING COUNT(*) < CASE unit_code
  WHEN 'G1_GS_U1' THEN CASE difficulty_level WHEN 'EASY' THEN 2 WHEN 'MEDIUM' THEN 5 WHEN 'HARD' THEN 3 END
  WHEN 'G1_GS_U2' THEN CASE difficulty_level WHEN 'EASY' THEN 2 WHEN 'MEDIUM' THEN 5 WHEN 'HARD' THEN 3 END
  WHEN 'G1_GS_U3' THEN CASE difficulty_level WHEN 'EASY' THEN 5 WHEN 'MEDIUM' THEN 12 WHEN 'HARD' THEN 8 END
  WHEN 'G1_GS_U4' THEN CASE difficulty_level WHEN 'EASY' THEN 8 WHEN 'MEDIUM' THEN 20 WHEN 'HARD' THEN 12 END
  WHEN 'G1_GS_U5' THEN CASE difficulty_level WHEN 'EASY' THEN 10 WHEN 'MEDIUM' THEN 25 WHEN 'HARD' THEN 15 END
  WHEN 'G1_GS_U6' THEN CASE difficulty_level WHEN 'EASY' THEN 8 WHEN 'MEDIUM' THEN 20 WHEN 'HARD' THEN 12 END
  WHEN 'G1_APT_U1' THEN CASE difficulty_level WHEN 'EASY' THEN 3 WHEN 'MEDIUM' THEN 8 WHEN 'HARD' THEN 4 END
  WHEN 'G1_APT_U2' THEN CASE difficulty_level WHEN 'EASY' THEN 2 WHEN 'MEDIUM' THEN 5 WHEN 'HARD' THEN 3 END
END
ORDER BY deficit DESC;

-- ─── PART 4: TAXONOMY VALIDATION ──────────────────────────────────────────

SELECT 
  'TAXONOMY VALIDATION' as report_section,
  unit_code,
  macro_topic,
  micro_topic,
  COUNT(*) as question_count,
  CASE 
    WHEN unit_code = 'G1_GS_U1' AND macro_topic IN ('Advanced Scientific Temper & Physics', 'Advanced Life Science & Ecology') THEN '✅ VALID'
    WHEN unit_code = 'G1_GS_U2' AND macro_topic = 'Comprehensive India & World Geography' THEN '✅ VALID'
    WHEN unit_code = 'G1_GS_U3' AND macro_topic IN ('Deep Indian History & Culture', 'National Movement & Current Dynamics') THEN '✅ VALID'
    WHEN unit_code = 'G1_GS_U4' AND macro_topic = 'Advanced Indian Polity & Governance' THEN '✅ VALID'
    WHEN unit_code = 'G1_GS_U5' AND macro_topic = 'Advanced Macroeconomics & TN Development' THEN '✅ VALID'
    WHEN unit_code = 'G1_GS_U6' AND macro_topic = 'Advanced Tamil Heritage & Movements' THEN '✅ VALID'
    WHEN unit_code = 'G1_APT_U1' AND macro_topic = 'Advanced Aptitude' THEN '✅ VALID'
    WHEN unit_code = 'G1_APT_U2' AND macro_topic = 'Advanced Reasoning' THEN '✅ VALID'
    ELSE '⚠️ INVALID TAXONOMY'
  END as taxonomy_status
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_1'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND unit_code IN ('G1_GS_U1', 'G1_GS_U2', 'G1_GS_U3', 'G1_GS_U4', 'G1_GS_U5', 'G1_GS_U6', 'G1_APT_U1', 'G1_APT_U2')
GROUP BY unit_code, macro_topic, micro_topic
ORDER BY unit_code, question_count DESC;

-- ─── PART 5: DATA QUALITY ISSUES ──────────────────────────────────────────

SELECT 
  'DATA QUALITY ISSUES' as report_section,
  'Missing Tamil translations' as issue_type,
  COUNT(*) as affected_questions
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_1'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND (
    q.question_text_tamil IS NULL OR q.question_text_tamil = '' OR
    q.option_a_tamil IS NULL OR q.option_a_tamil = '' OR
    q.option_b_tamil IS NULL OR q.option_b_tamil = '' OR
    q.option_c_tamil IS NULL OR q.option_c_tamil = '' OR
    q.option_d_tamil IS NULL OR q.option_d_tamil = ''
  )

UNION ALL

SELECT 
  'DATA QUALITY ISSUES',
  'Missing English explanation',
  COUNT(*)
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_1'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND (q.explanation IS NULL OR q.explanation = '')

UNION ALL

SELECT 
  'DATA QUALITY ISSUES',
  'Invalid difficulty case',
  COUNT(*)
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_1'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND difficulty_level NOT IN ('EASY', 'MEDIUM', 'HARD')

UNION ALL

SELECT 
  'DATA QUALITY ISSUES',
  'Invalid answer key',
  COUNT(*)
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_1'
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND correct_option NOT IN ('A', 'B', 'C', 'D');

-- ============================================================================
-- INTERPRETATION GUIDE:
-- ============================================================================
-- 
-- ✅ READY Status: You have enough questions to generate mock tests
-- ❌ DEFICIT Status: Need to import more questions for that unit/difficulty
-- 
-- Target Distribution (200Q Mock Test):
-- - Total: 200 questions
-- - Easy: 40 (20%)
-- - Medium: 100 (50%)  
-- - Hard: 60 (30%)
-- 
-- If you see deficits, use the AI prompt in GROUP_1_MOCK_TEST_GENERATION_PROMPT.md
-- to generate questions specifically for those units/difficulties.
-- ============================================================================
