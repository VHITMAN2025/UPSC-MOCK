-- Fill in unit_code for questions saved before the app started writing it.
--
-- The mock test generator picks questions by (exam_tag, unit_code). Questions
-- uploaded from a PDF, and CSV questions uploaded before this fix, have the
-- approved catalog unit in unit_name ("Unit 5: Indian Polity") but an empty
-- unit_code, so no mock could ever use them.
--
-- The mapping matches deriveUnitCode() in src/services/masterTaxonomyService.js.
-- Group 1 numbers its units differently from Groups 2 and 4. Only empty unit_code
-- values are filled, and a question with no matching unit (for example Current
-- Events in Group 1, which has no such unit) is left as it was.
-- Safe to run more than once.

UPDATE public.questions q
SET unit_code = CASE
  WHEN q.exam_tag = 'TNPSC_GROUP_1' THEN
    CASE
      WHEN q.unit_name LIKE 'Unit 1:%'  THEN 'UNIT_I'
      WHEN q.unit_name LIKE 'Unit 3:%'  THEN 'UNIT_II'
      WHEN q.unit_name LIKE 'Unit 4:%'  OR q.unit_name LIKE 'Unit 7:%' THEN 'UNIT_III'
      WHEN q.unit_name LIKE 'Unit 5:%'  THEN 'UNIT_IV'
      WHEN q.unit_name LIKE 'Unit 6:%'  OR q.unit_name LIKE 'Unit 9:%' THEN 'UNIT_V'
      WHEN q.unit_name LIKE 'Unit 8:%'  THEN 'UNIT_VI'
      WHEN q.unit_name LIKE 'Unit 10:%' THEN
        CASE WHEN q.macro_topic = 'Logical Reasoning' THEN 'APT_UNIT_II' ELSE 'APT_UNIT_I' END
    END
  ELSE
    CASE
      WHEN q.unit_name LIKE 'Unit 1:%'  THEN 'UNIT_I'
      WHEN q.unit_name LIKE 'Unit 2:%'  THEN 'UNIT_II'
      WHEN q.unit_name LIKE 'Unit 3:%'  THEN 'UNIT_III'
      WHEN q.unit_name LIKE 'Unit 4:%'  THEN 'UNIT_IV'
      WHEN q.unit_name LIKE 'Unit 5:%'  OR q.unit_name LIKE 'Unit 6:%' THEN 'UNIT_V'
      WHEN q.unit_name LIKE 'Unit 7:%'  OR q.unit_name LIKE 'Unit 8:%' OR q.unit_name LIKE 'Unit 9:%' THEN 'UNIT_VI'
      WHEN q.unit_name LIKE 'Unit 10:%' THEN
        CASE WHEN q.macro_topic = 'Logical Reasoning' THEN 'APT_UNIT_II' ELSE 'APT_UNIT_I' END
      WHEN q.unit_name = 'Part A: General Tamil' THEN
        CASE
          WHEN q.macro_topic LIKE 'Ilakkanam%'        THEN 'LANG_TA_A'
          WHEN q.macro_topic LIKE 'Ilakkaiyam%'       THEN 'LANG_TA_B'
          WHEN q.macro_topic LIKE 'Tamil Arignargal%' THEN 'LANG_TA_C'
        END
      WHEN q.unit_name = 'Part A: General English' THEN
        CASE
          WHEN q.macro_topic LIKE 'Grammar%'    THEN 'LANG_EN_A'
          WHEN q.macro_topic LIKE 'Literature%' THEN 'LANG_EN_B'
          WHEN q.macro_topic LIKE 'Authors%'    THEN 'LANG_EN_C'
        END
    END
END
WHERE q.unit_code IS NULL
  AND q.unit_name IS NOT NULL;

-- How many questions still have no unit code (these cannot be used in mocks):
SELECT exam_tag, unit_name, count(*) AS questions_without_unit_code
FROM public.questions
WHERE unit_code IS NULL
GROUP BY exam_tag, unit_name
ORDER BY questions_without_unit_code DESC;
