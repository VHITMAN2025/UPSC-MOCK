# CSV Import Format for Admin Question Upload

## Required CSV Structure

The admin panel accepts CSV files with **29 columns** in the following order:

### Column List (in exact order):

1. **question_id** - Unique identifier (auto-generated if empty)
2. **content_hash** - SHA-256 hash (auto-generated from question text)
3. **exam_tag** - Exam group: `TNPSC_GROUP_1`, `TNPSC_GROUP_2`, or `TNPSC_GROUP_4`
4. **source_type** - Question source: `PYQ` (Previous Year) or `VINA` (Practice)
5. **year** - Exam year (e.g., 2024, 2022, 2019)
6. **subject_name** - Subject (e.g., "General Studies", "Tamil", "English")
7. **unit_code** - Unit identifier (e.g., "Unit 1", "Unit 2")
8. **macro_topic** - Macro topic category (see taxonomy reference)
9. **micro_topic** - Micro topic name (must match approved taxonomy)
10. **sub_topic** - Optional sub-topic detail
11. **difficulty_level** - Difficulty: `EASY`, `MEDIUM`, or `HARD`
12. **question_type** - Type of question (e.g., "Multiple Choice", "Matching")
13. **cognitive_skill** - Cognitive level (e.g., "Recall", "Application", "Analysis")
14. **ideal_time_seconds** - Recommended time in seconds (typically 54 for TNPSC)
15. **en_question_text** - Question text in English
16. **en_option_a** - Option A in English
17. **en_option_b** - Option B in English
18. **en_option_c** - Option C in English
19. **en_option_d** - Option D in English
20. **en_option_e** - Option E in English (auto-filled: "Answer not known")
21. **ta_question_text** - Question text in Tamil
22. **ta_option_a** - Option A in Tamil
23. **ta_option_b** - Option B in Tamil
24. **ta_option_c** - Option C in Tamil
25. **ta_option_d** - Option D in Tamil
26. **ta_option_e** - Option E in Tamil (auto-filled: "விடை தெரியாது")
27. **answer_key** - Correct answer: `A`, `B`, `C`, or `D`
28. **en_explanation** - Explanation in English
29. **ta_explanation** - Explanation in Tamil

---

## Required Fields (MUST have values)

### Critical Fields:
- **exam_tag** - Must be one of: `TNPSC_GROUP_1`, `TNPSC_GROUP_2`, `TNPSC_GROUP_4`
- **source_type** - Must be `PYQ` or `VINA`
- **year** - Required for PYQ questions
- **unit_code** - Must match approved taxonomy (e.g., "Unit 1: General Science")
- **macro_topic** - Must match approved taxonomy (e.g., "Physics")
- **micro_topic** - Must match approved taxonomy exactly
- **en_question_text** - Question text is required
- **answer_key** - Must be A, B, C, or D

### Auto-Generated Fields (leave empty):
- **question_id** - System generates unique ID
- **content_hash** - System generates SHA-256 hash
- **en_option_e** - System adds "Answer not known"
- **ta_option_e** - System adds "விடை தெரியாது"

---

## Taxonomy Validation

**IMPORTANT:** The `unit_code`, `macro_topic`, and `micro_topic` must match **exactly** with the approved taxonomy in `exam_topics.csv`.

### Example Valid Combinations:

**Unit 1: General Science**
- macro_topic: `Physics`, micro_topic: `Mechanics & Properties of Matter`
- macro_topic: `Chemistry`, micro_topic: `Elements, Compounds, Acids, Bases & Salts`
- macro_topic: `Biology`, micro_topic: `Blood, Circulation & Human Body Systems`

**Unit 5: Indian Polity**
- macro_topic: `Constitution Basics`, micro_topic: `Preamble, Citizenship, Union & Territories`
- macro_topic: `Rights & Duties`, micro_topic: `Fundamental Rights`

**Unit 10: Aptitude**
- macro_topic: `Quantitative Aptitude`, micro_topic: `Simplification, LCM & HCF`
- macro_topic: `Logical Reasoning`, micro_topic: `Logical Reasoning & Puzzles`

**See `exam_topics.csv` for the complete list of approved taxonomy mappings.**

---

## Example CSV Row

```csv
question_id,content_hash,exam_tag,source_type,year,subject_name,unit_code,macro_topic,micro_topic,sub_topic,difficulty_level,question_type,cognitive_skill,ideal_time_seconds,en_question_text,en_option_a,en_option_b,en_option_c,en_option_d,en_option_e,ta_question_text,ta_option_a,ta_option_b,ta_option_c,ta_option_d,ta_option_e,answer_key,en_explanation,ta_explanation
,,TNPSC_GROUP_4,PYQ,2024,General Studies,Unit 1: General Science,Physics,Mechanics & Properties of Matter,,MEDIUM,Multiple Choice,Recall,54,What is Newton's first law of motion?,An object at rest stays at rest,Force equals mass times acceleration,Every action has an equal reaction,Energy cannot be created or destroyed,,"நியூட்டனின் முதல் இயக்க விதி என்ன?",ஓய்வில் உள்ள பொருள் ஓய்வில் இருக்கும்,விசை = நிறை × முடுக்கம்,ஒவ்வொரு செயலுக்கும் எதிர்வினை உண்டு,ஆற்றலை உருவாக்கவோ அழிக்கவோ முடியாது,,A,Newton's first law states that an object at rest remains at rest unless acted upon by an external force.,நியூட்டனின் முதல் விதி கூறுகிறது: ஓய்வில் உள்ள பொருள் வெளி விசை செயல்படும் வரை ஓய்விலேயே இருக்கும்.
```

---

## CSV File Requirements

### File Format:
- **Encoding:** UTF-8 (required for Tamil text)
- **Separator:** Comma (`,`)
- **Line Ending:** LF or CRLF
- **Extension:** `.csv`

### Text Formatting:
- Wrap text with commas in double quotes: `"text, with comma"`
- Escape quotes by doubling them: `"He said ""hello"""`
- Tamil text must be in UTF-8 encoding

---

## PYQ vs VINA Questions

### PYQ (Previous Year Questions):
- **source_type:** `PYQ`
- **year:** Required (e.g., 2024, 2022, 2019)
- **Purpose:** Official past exam questions
- **Auto-filing:** System automatically creates papers by group and year
- **Visibility:** Shows in "Previous Year Papers" section for students

### VINA (Practice Questions):
- **source_type:** `VINA`
- **year:** Optional (can be empty or future year like 2026)
- **Purpose:** Practice questions for mock tests
- **Paper Assignment:** Must select a target paper during import
- **Visibility:** Used in mock tests and practice sessions

---

## Common Errors & Solutions

### Error: "Question taxonomy is not an approved exam_topics.csv mapping"
**Cause:** The combination of `unit_code`, `macro_topic`, `micro_topic` doesn't match the approved taxonomy.

**Solution:**
1. Open `exam_topics.csv`
2. Find the correct combination for your unit
3. Copy the **exact** text (case-sensitive, punctuation included)
4. Update your CSV with the matching values

### Error: "PYQ question missing year"
**Cause:** PYQ questions require a valid year.

**Solution:** Add a year value (e.g., 2024) in the `year` column.

### Error: "Duplicate blocked: this text matches an official PYQ question"
**Cause:** You're trying to import a VINA question that has the same text as an existing PYQ question.

**Solution:** This is intentional to prevent duplicates. Either:
- Modify the VINA question text slightly
- Remove the duplicate row from your CSV

### Error: "Missing correct answer selection"
**Cause:** The `answer_key` column is empty or invalid.

**Solution:** Set `answer_key` to A, B, C, or D (the correct option).

---

## Step-by-Step Import Process

1. **Prepare CSV File**
   - Use the 29-column format above
   - Ensure taxonomy matches `exam_topics.csv`
   - Save as UTF-8 CSV

2. **Navigate to Admin Panel**
   - Go to: Admin → Extracted Questions

3. **Select Group**
   - Choose the target exam group (Group 1, 2, or 4)

4. **Upload CSV**
   - Click "Import from CSV"
   - Select your CSV file
   - For VINA questions: Select target paper
   - For PYQ questions: No paper selection needed (auto-filed)

5. **Review Import**
   - Check validation messages
   - Fix any errors shown
   - Re-upload if needed

6. **Verify Questions**
   - Questions appear in the grid
   - PYQ questions auto-create papers
   - VINA questions added to selected paper

---

## Sample CSV Templates

### Minimal PYQ Example:
```csv
question_id,content_hash,exam_tag,source_type,year,subject_name,unit_code,macro_topic,micro_topic,sub_topic,difficulty_level,question_type,cognitive_skill,ideal_time_seconds,en_question_text,en_option_a,en_option_b,en_option_c,en_option_d,en_option_e,ta_question_text,ta_option_a,ta_option_b,ta_option_c,ta_option_d,ta_option_e,answer_key,en_explanation,ta_explanation
,,TNPSC_GROUP_4,PYQ,2024,General Studies,Unit 1: General Science,Physics,Mechanics & Properties of Matter,,MEDIUM,Multiple Choice,Recall,54,What is force?,Push or pull,Energy,Power,Work,,விசை என்றால் என்ன?,இழுத்தல் அல்லது தள்ளுதல்,ஆற்றல்,ஆற்றல் விகிதம்,வேலை,,A,Force is a push or pull acting on an object.,விசை என்பது ஒரு பொருளின் மீது செயல்படும் இழுப்பு அல்லது தள்ளுதலாகும்.
```

### Minimal VINA Example:
```csv
question_id,content_hash,exam_tag,source_type,year,subject_name,unit_code,macro_topic,micro_topic,sub_topic,difficulty_level,question_type,cognitive_skill,ideal_time_seconds,en_question_text,en_option_a,en_option_b,en_option_c,en_option_d,en_option_e,ta_question_text,ta_option_a,ta_option_b,ta_option_c,ta_option_d,ta_option_e,answer_key,en_explanation,ta_explanation
,,TNPSC_GROUP_4,VINA,2026,General Studies,Unit 10: Aptitude,Quantitative Aptitude,Simplification, LCM & HCF,,EASY,Multiple Choice,Application,54,Simplify: 5 + 3 × 2,11,16,13,10,,எளிதாக்குக: 5 + 3 × 2,11,16,13,10,,B,Follow BODMAS: 3×2=6, then 5+6=11,BODMAS பின்பற்றுக: 3×2=6, பின் 5+6=11
```

---

## Reference Files

- **exam_topics.csv** - Complete approved taxonomy (80 mappings)
- **APPROVED_TAXONOMY_REFERENCE.md** - Human-readable taxonomy guide
- **This file** - CSV import format specification

For questions or issues, refer to these files or check the admin panel validation messages.
