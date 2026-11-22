-- MONITORING: Check question bank health before importing new questions
-- Run this periodically to ensure sufficient questions for mock test generation

-- 1. Overall health check
SELECT * FROM question_bank_health;

-- 2. Detailed deficit analysis for Group 4
WITH blueprint AS (
  SELECT 'G4_GS_U1' as unit_code, 5 as quota, 'General Studies' as subject UNION ALL
  SELECT 'G4_GS_U2', 5, 'General Studies' UNION ALL
  SELECT 'G4_GS_U3', 10, 'General Studies' UNION ALL
  SELECT 'G4_GS_U4', 15, 'General Studies' UNION ALL
  SELECT 'G4_GS_U5', 20, 'General Studies' UNION ALL
  SELECT 'G4_GS_U6', 20, 'General Studies' UNION ALL
  SELECT 'G4_APT_U1', 15, 'Aptitude' UNION ALL
  SELECT 'G4_APT_U2', 10, 'Aptitude' UNION ALL
  SELECT 'G4_TA_U1', 25, 'Tamil' UNION ALL
  SELECT 'G4_TA_U2', 15, 'Tamil' UNION ALL
  SELECT 'G4_TA_U3', 15, 'Tamil' UNION ALL
  SELECT 'G4_TA_U4', 10, 'Tamil' UNION ALL
  SELECT 'G4_TA_U5', 15, 'Tamil' UNION ALL
  SELECT 'G4_TA_U6', 5, 'Tamil' UNION ALL
  SELECT 'G4_TA_U7', 15, 'Tamil'
),
available AS (
  SELECT 
    q.unit_code,
    SUM(CASE WHEN q.difficulty_level = 'EASY' THEN 1 ELSE 0 END) as have_easy,
    SUM(CASE WHEN q.difficulty_level = 'MEDIUM' THEN 1 ELSE 0 END) as have_medium,
    SUM(CASE WHEN q.difficulty_level = 'HARD' THEN 1 ELSE 0 END) as have_hard
  FROM questions q
  INNER JOIN papers p ON q.paper_id = p.id
  WHERE q.exam_tag = 'TNPSC_GROUP_4'
    AND p.exam_type NOT IN ('Full Mock', 'Custom')
    AND q.correct_option IS NOT NULL
    AND q.unit_code IS NOT NULL
  GROUP BY q.unit_code
)
SELECT 
  b.subject,
  b.unit_code,
  b.quota as total_need,
  ROUND(b.quota * 0.20) as need_easy,
  ROUND(b.quota * 0.50) as need_medium,
  ROUND(b.quota * 0.30) as need_hard,
  COALESCE(a.have_easy, 0) as have_easy,
  COALESCE(a.have_medium, 0) as have_medium,
  COALESCE(a.have_hard, 0) as have_hard,
  CASE 
    WHEN COALESCE(a.have_easy, 0) < ROUND(b.quota * 0.20) THEN '⚠️ DEFICIT'
    ELSE '✅ OK'
  END as easy_status,
  CASE 
    WHEN COALESCE(a.have_medium, 0) < ROUND(b.quota * 0.50) THEN '⚠️ DEFICIT'
    ELSE '✅ OK'
  END as medium_status,
  CASE 
    WHEN COALESCE(a.have_hard, 0) < ROUND(b.quota * 0.30) THEN '⚠️ DEFICIT'
    ELSE '✅ OK'
  END as hard_status
FROM blueprint b
LEFT JOIN available a ON b.unit_code = a.unit_code
ORDER BY 
  CASE 
    WHEN COALESCE(a.have_easy, 0) < ROUND(b.quota * 0.20) 
      OR COALESCE(a.have_medium, 0) < ROUND(b.quota * 0.50)
      OR COALESCE(a.have_hard, 0) < ROUND(b.quota * 0.30)
    THEN 0 ELSE 1 
  END,
  b.subject, b.unit_code;

-- 3. Show units with zero questions (critical issues)
SELECT 
  tv2.unit_code,
  tv2.title as unit_name,
  COUNT(q.id) as question_count
FROM (
  SELECT unnest(ARRAY['G4_GS_U1','G4_GS_U2','G4_GS_U3','G4_GS_U4','G4_GS_U5','G4_GS_U6',
                      'G4_APT_U1','G4_APT_U2','G4_TA_U1','G4_TA_U2','G4_TA_U3','G4_TA_U4',
                      'G4_TA_U5','G4_TA_U6','G4_TA_U7']) as unit_code,
         unnest(ARRAY['Unit I: General Science','Unit II: Geography of India',
                      'Unit III: History Culture of India and Indian National Movement',
                      'Unit IV: Indian Polity','Unit V: Indian Economy and Development Administration in Tamil Nadu',
                      'Unit VI: History Culture Heritage and Socio-Political Movements of Tamil Nadu',
                      'Unit I: Aptitude','Unit II: Reasoning','அலகு I: இலக்கணம்','அலகு II: சொல்லகராதி',
                      'அலகு III: எழுதும் திறன்','அலகு IV: கலைச் சொற்கள்','அலகு V: வாசித்தல் - புரிந்து கொள்ளும் திறன்',
                      'அலகு VI: எளிய மொழி பெயர்ப்பு','அலகு VII: இலக்கியம், தமிழ் அறிஞர்களும், தமிழ்த்தொண்டும்']) as title
) tv2
LEFT JOIN questions q ON q.unit_code = tv2.unit_code AND q.exam_tag = 'TNPSC_GROUP_4'
LEFT JOIN papers p ON q.paper_id = p.id
WHERE p.id IS NULL OR (p.exam_type NOT IN ('Full Mock', 'Custom') AND q.correct_option IS NOT NULL)
GROUP BY tv2.unit_code, tv2.title
HAVING COUNT(q.id) = 0
ORDER BY tv2.unit_code;
