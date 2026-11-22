-- Diagnose group tag mismatch in practice questions
-- Check questions from papers labeled for one group but having a different group_tag

SELECT 
  p.id AS paper_id,
  p.title AS paper_title,
  p.exam_name AS paper_exam,
  q.id AS question_id,
  q.group_tag,
  q.exam_tag,
  SUBSTRING(q.question_text, 1, 100) AS question_preview,
  COUNT(*) OVER (PARTITION BY p.id, q.group_tag) AS count_in_paper
FROM papers p
INNER JOIN questions q ON q.paper_id = p.id
WHERE p.status = 'published'
  AND (
    -- Group 1 paper with non-Group 1 questions
    (p.exam_name = 'TNPSC Group 1' AND q.group_tag != 'Group 1' AND q.group_tag IS NOT NULL)
    OR
    -- Group 2 paper with non-Group 2 questions  
    (p.exam_name = 'TNPSC Group 2/2A' AND q.group_tag NOT IN ('Group 2', 'Group 2/2A', 'Group 2A') AND q.group_tag IS NOT NULL)
    OR
    -- Group 4 paper with non-Group 4 questions
    (p.exam_name = 'TNPSC Group 4' AND q.group_tag != 'Group 4' AND q.group_tag IS NOT NULL)
  )
ORDER BY p.exam_name, p.title, q.group_tag
LIMIT 50;
