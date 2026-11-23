-- Diagnose Practice Test Issues
-- Run this in Supabase SQL Editor to check if practice tests should work

-- 1. Check total questions available by group
SELECT 
    group_tag,
    COUNT(*) as total_questions,
    COUNT(CASE WHEN correct_option IS NOT NULL THEN 1 END) as questions_with_answer
FROM questions
WHERE group_tag IN ('Group 1', 'Group 2', 'Group 2/2A', 'Group 2A', 'Group 4')
GROUP BY group_tag
ORDER BY group_tag;

-- 2. Check papers table for published papers
SELECT 
    id,
    title,
    exam_name,
    status,
    subject
FROM papers
WHERE status = 'published'
ORDER BY exam_name, title;

-- 3. Check Group 1 questions breakdown
SELECT 
    paper_id,
    COUNT(*) as question_count,
    COUNT(CASE WHEN correct_option IS NOT NULL THEN 1 END) as answered_questions
FROM questions
WHERE group_tag = 'Group 1'
GROUP BY paper_id;

-- 4. Check Group 2 questions breakdown
SELECT 
    paper_id,
    COUNT(*) as question_count,
    COUNT(CASE WHEN correct_option IS NOT NULL THEN 1 END) as answered_questions
FROM questions
WHERE group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')
GROUP BY paper_id;

-- 5. Check Group 4 questions breakdown
SELECT 
    paper_id,
    COUNT(*) as question_count,
    COUNT(CASE WHEN correct_option IS NOT NULL THEN 1 END) as answered_questions
FROM questions
WHERE group_tag = 'Group 4'
GROUP BY paper_id;

-- 6. Check recent practice sessions (last 10)
SELECT 
    id,
    user_id,
    exam_context,
    question_count,
    status,
    created_at
FROM practice_sessions
ORDER BY created_at DESC
LIMIT 10;

-- 7. Check if any practice sessions failed recently
SELECT 
    id,
    exam_context,
    question_count,
    status,
    created_at,
    error_message
FROM practice_sessions
WHERE status = 'error' OR status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
