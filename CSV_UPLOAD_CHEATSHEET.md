# 📊 CSV UPLOAD CHEATSHEET

## One Page Reference for Admin Question Imports

---

## 📄 THE ONE CSV FORMAT

```
29 columns → question_import_template.csv
```

| # | Column | Fill? | Example/Rule |
|---|--------|-------|--------------|
| 1 | question_id | ❌ Empty | Auto-generated |
| 2 | content_hash | ❌ Empty | Auto-computed |
| 3 | exam_tag | ✅ **YES** | `TNPSC_GROUP_4` |
| 4 | source_type | ✅ **YES** | `PYQ` or `VINA` |
| 5 | year | ✅ **PYQ only** | `2024` (2000-2026) |
| 6 | subject_name | ✅ Yes | `General Studies` |
| 7 | unit_code | ✅ **YES** | From exam_topics.csv |
| 8 | macro_topic | ✅ **YES** | From exam_topics.csv |
| 9 | micro_topic | ✅ **YES** | From exam_topics.csv |
| 10 | sub_topic | ⚪ Optional | Additional detail |
| 11 | difficulty_level | ✅ **YES** | `EASY`/`MEDIUM`/`HARD` |
| 12 | question_type | ✅ Yes | `Multiple Choice` |
| 13 | cognitive_skill | ✅ Yes | `Recall` |
| 14 | ideal_time_seconds | ✅ Yes | `54` |
| 15 | en_question_text | ✅ **YES** | English question |
| 16 | en_option_a | ✅ **YES** | English option A |
| 17 | en_option_b | ✅ **YES** | English option B |
| 18 | en_option_c | ✅ **YES** | English option C |
| 19 | en_option_d | ✅ **YES** | English option D |
| 20 | en_option_e | ❌ Empty | Fixed value |
| 21 | ta_question_text | ✅ **YES** | Tamil question |
| 22 | ta_option_a | ✅ **YES** | Tamil option A |
| 23 | ta_option_b | ✅ **YES** | Tamil option B |
| 24 | ta_option_c | ✅ **YES** | Tamil option C |
| 25 | ta_option_d | ✅ **YES** | Tamil option D |
| 26 | ta_option_e | ❌ Empty | Fixed value |
| 27 | answer_key | ✅ **YES** | `A` / `B` / `C` / `D` |
| 28 | en_explanation | ✅ Yes | English explanation |
| 29 | ta_explanation | ✅ Yes | Tamil explanation |

---

## 🎯 CRITICAL RULES

### Rule 1: Taxonomy MUST Match exam_topics.csv

```
✅ CORRECT (copy-pasted from exam_topics.csv):
unit_code: Unit 1: General Science
macro_topic: Physics
micro_topic: Mechanics & Properties of Matter

❌ WRONG (typed manually with typo):
unit_code: Unit 1 - General Science  ← Wrong separator
macro_topic: Physics
micro_topic: Mechanics and Properties  ← Wrong wording
```

**FIX**: Always copy-paste from `exam_topics.csv`. Never type manually.

---

### Rule 2: PYQ Needs Year, VINA Doesn't

```
✅ PYQ Example:
source_type: PYQ
year: 2024
→ Auto-files to "TNPSC Group 4 - 2024" paper

✅ VINA Example:
source_type: VINA
year: 2026 (or empty)
→ Admin manually assigns to custom papers
```

---

### Rule 3: exam_tag Format

```
✅ CORRECT:
TNPSC_GROUP_1
TNPSC_GROUP_2
TNPSC_GROUP_4

❌ WRONG:
TNPSC GROUP 4  ← Space not underscore
Group4  ← Missing prefix
TNPSC_GROUP_3  ← No Group 3
```

---

## 📋 4-Step Upload Process

### Step 1: Prepare CSV
```
1. Download question_import_template.csv
2. Open exam_topics.csv in separate window
3. Copy-paste taxonomy strings (columns 7, 8, 9)
4. Fill question content (columns 15-29)
5. Save as UTF-8 CSV
```

### Step 2: Upload
```
Admin Panel → Extracted Questions → Bulk Upload CSV
```

### Step 3: Review Validation
```
System shows:
✅ Valid rows (green)
❌ Invalid rows (red) with error messages
🔄 Duplicate rows (yellow)
```

### Step 4: Confirm Import
```
Fix any errors → Re-upload → Confirm Import
```

---

## ⚠️ Common Errors & Fixes

| Error Message | Cause | Fix |
|---------------|-------|-----|
| "Question taxonomy is not an approved exam_topics.csv mapping" | Typo in unit/macro/micro topic | Copy-paste exact strings from exam_topics.csv |
| "A PYQ question needs the year" | Missing year for PYQ | Add year 2000-2026 in column 5 |
| "Deduplication Gate: VINA matches PYQ" | VINA question text identical to existing PYQ | Change source_type to PYQ or modify question text |
| "exam_tag must be TNPSC_GROUP_1, _2, or _4" | Wrong format | Use underscore: TNPSC_GROUP_4 |
| "difficulty_level must be EASY, MEDIUM, or HARD" | Wrong spelling | Use UPPERCASE: MEDIUM not Medium |
| "answer_key must be A, B, C, or D" | Invalid key | Use single letter: A not 1 or Option A |

---

## 📚 Reference Files

### 1. question_import_template.csv
**Template with 5 sample questions**
- 4 PYQ examples (Physics, Chemistry, Polity, Aptitude)
- 1 VINA example (Geography)
- Use as starting point

### 2. exam_topics.csv
**80 approved taxonomy combinations**
- 68 rows: ALL_GROUPS
- 12 rows: GROUP_2_AND_4 (Tamil/English language)
- Copy-paste source for columns 7, 8, 9

### 3. APPROVED_TAXONOMY_REFERENCE.md
**Human-readable taxonomy guide**
- Organized by exam group
- Shows all units and topics
- Good for browsing

### 4. ADMIN_CSV_IMPORT_GUIDE.md
**Complete detailed guide**
- Full documentation
- Validation rules
- Workflow examples

---

## 🎓 Sample Rows

### PYQ Question (Group 4, 2024, Physics)
```csv
,,TNPSC_GROUP_4,PYQ,2024,General Studies,Unit 1: General Science,Physics,Mechanics & Properties of Matter,,MEDIUM,Multiple Choice,Recall,54,What is Newton's first law?,An object at rest stays at rest,Force equals mass times acceleration,Every action has an equal reaction,Energy cannot be created or destroyed,,நியூட்டனின் முதல் விதி என்ன?,ஓய்வில் உள்ள பொருள் ஓய்வில் இருக்கும்,விசை = நிறை × முடுக்கம்,ஒவ்வொரு செயலுக்கும் எதிர்வினை உண்டு,ஆற்றலை உருவாக்கவோ அழிக்கவோ முடியாது,,A,Newton's first law states that an object at rest remains at rest unless acted upon by an external force.,நியூட்டனின் முதல் விதி கூறுகிறது: ஓய்வில் உள்ள பொருள் வெளி விசை செயல்படும் வரை ஓய்விலேயே இருக்கும்.
```

### VINA Question (Group 4, Practice, Geography)
```csv
,,TNPSC_GROUP_4,VINA,2026,General Studies,Unit 3: Geography of India,Physical Geography,Location & Physical Features of India,,MEDIUM,Multiple Choice,Recall,54,Which is the longest river in India?,Ganges,Yamuna,Brahmaputra,Godavari,,இந்தியாவின் மிக நீளமான ஆறு எது?,கங்கை,யமுனை,பிரம்மபுத்திரா,கோதாவரி,,A,The Ganges (Ganga) is the longest river in India at approximately 2525 km.,கங்கை (கங்கா) இந்தியாவின் மிக நீளமான ஆறு - சுமார் 2525 கி.மீ.
```

---

## ✅ Pre-Upload Checklist

Before clicking "Confirm Import", verify:

- [ ] CSV has exactly 29 columns in correct order
- [ ] Columns 1, 2, 20, 26 are empty (auto-generated/fixed)
- [ ] exam_tag is TNPSC_GROUP_1, _2, or _4
- [ ] source_type is PYQ or VINA
- [ ] PYQ questions have year (2000-2026)
- [ ] unit_code, macro_topic, micro_topic copied from exam_topics.csv
- [ ] difficulty_level is EASY, MEDIUM, or HARD (uppercase)
- [ ] answer_key is A, B, C, or D
- [ ] Both English and Tamil text provided
- [ ] File saved as UTF-8 CSV

---

## 🚀 Quick Start

```bash
# 1. Download template
question_import_template.csv

# 2. Reference taxonomy
exam_topics.csv (copy-paste columns 7, 8, 9)

# 3. Fill questions
29 columns per row

# 4. Upload
Admin → Extracted Questions → Bulk Upload CSV

# 5. Confirm
After validation passes
```

---

## 🔒 Database Enforcement

```
question_taxonomy table (80 rows)
         ↓
  Database Trigger
         ↓
Rejects ANY question with non-matching taxonomy
         ↓
Zero taxonomy mismatches guaranteed
```

**This is enforced at the database level and cannot be bypassed.**

---

## 📞 Still Stuck?

### Checklist:
1. ✅ Using question_import_template.csv as base?
2. ✅ Copy-pasted taxonomy from exam_topics.csv (not typed)?
3. ✅ PYQ has year 2000-2026?
4. ✅ exam_tag uses underscore (TNPSC_GROUP_4)?
5. ✅ Saved as UTF-8 CSV?

### If validation still fails:
1. Download fresh question_import_template.csv
2. Copy ONE working sample row
3. Modify ONLY question/answer text
4. Keep taxonomy IDENTICAL
5. Test upload with just that one row

---

**Remember: ONE CSV FORMAT. ONE TAXONOMY SOURCE. ONE UPLOAD METHOD.**
