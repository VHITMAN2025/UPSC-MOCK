# 📋 SINGLE CSV FORMAT FOR ADMIN IMPORTS

## The ONE File Format You Need

```
📄 question_import_template.csv
   └─ 29 columns (exact order required)
   └─ Taxonomy validated against exam_topics.csv
   └─ Uploaded via Admin Panel → Bulk Upload CSV
```

---

## Column Structure

### Columns 1-3: Auto-Generated _(leave empty)_
| Column | Leave Empty | Notes |
|--------|-------------|-------|
| 1. `question_id` | ✓ | Database auto-generates UUID |
| 2. `content_hash` | ✓ | System computes SHA-256 hash |
| 3. `exam_tag` | **FILL** | `TNPSC_GROUP_1`, `TNPSC_GROUP_2`, `TNPSC_GROUP_4` |

### Columns 4-14: Question Metadata _(required)_
| Column | Example | Validation |
|--------|---------|------------|
| 4. `source_type` | `PYQ` or `VINA` | **Required** |
| 5. `year` | `2024` | **Required for PYQ** (2000-2026) |
| 6. `subject_name` | `General Studies` | Recommended |
| 7. `unit_code` | `Unit 1: General Science` | **Must match exam_topics.csv** |
| 8. `macro_topic` | `Physics` | **Must match exam_topics.csv** |
| 9. `micro_topic` | `Mechanics & Properties of Matter` | **Must match exam_topics.csv** |
| 10. `sub_topic` | _(optional)_ | Additional detail |
| 11. `difficulty_level` | `EASY` / `MEDIUM` / `HARD` | **Required** |
| 12. `question_type` | `Multiple Choice` | Question format |
| 13. `cognitive_skill` | `Recall` | Bloom's taxonomy |
| 14. `ideal_time_seconds` | `54` | Time allocation |

### Columns 15-20: English Content _(required)_
| Column | Example | Notes |
|--------|---------|-------|
| 15. `en_question_text` | `What is Newton's first law?` | **Required** |
| 16. `en_option_a` | `An object at rest stays at rest` | **Required** |
| 17. `en_option_b` | `Force equals mass times acceleration` | **Required** |
| 18. `en_option_c` | `Every action has reaction` | **Required** |
| 19. `en_option_d` | `Energy cannot be created` | **Required** |
| 20. `en_option_e` | _(leave empty)_ | Fixed: "Answer not known" |

### Columns 21-26: Tamil Content _(required)_
| Column | Example | Notes |
|--------|---------|-------|
| 21. `ta_question_text` | `நியூட்டனின் முதல் விதி?` | **Required** |
| 22. `ta_option_a` | _(Tamil text)_ | **Required** |
| 23. `ta_option_b` | _(Tamil text)_ | **Required** |
| 24. `ta_option_c` | _(Tamil text)_ | **Required** |
| 25. `ta_option_d` | _(Tamil text)_ | **Required** |
| 26. `ta_option_e` | _(leave empty)_ | Fixed: "விடை தெரியவில்லை" |

### Columns 27-29: Answer & Explanation _(required)_
| Column | Example | Notes |
|--------|---------|-------|
| 27. `answer_key` | `A` / `B` / `C` / `D` | **Required** |
| 28. `en_explanation` | `Newton's first law states...` | Recommended |
| 29. `ta_explanation` | `நியூட்டனின் விதி...` | Recommended |

---

## Taxonomy Validation

### ✅ Your Taxonomy MUST Match This File:
```
📄 exam_topics.csv
   └─ 80 approved combinations
   └─ 68 rows: ALL_GROUPS (Group 1, 2, 4)
   └─ 12 rows: GROUP_2_AND_4 (Tamil/English language)
```

### Structure of exam_topics.csv:
```csv
exam_group,unit_name,macro_topic_name,micro_topic_name
ALL_GROUPS,Unit 1: General Science,Physics,Mechanics & Properties of Matter
ALL_GROUPS,Unit 1: General Science,Physics,Light, Sound, Heat & Magnetism
ALL_GROUPS,Unit 1: General Science,Chemistry,Elements, Compounds, Acids, Bases & Salts
...
GROUP_2_AND_4,Part A: General Tamil,Ilakkanam (Grammar),Poruthuthal & Pirithu Ezhudhuthal
...
```

### ❌ Common Taxonomy Errors:

| Error | Why It Fails |
|-------|--------------|
| `Unit 1 — General Science` | Wrong format (em dash instead of colon) |
| `Unit 1: Science` | Incomplete unit name |
| `Physics Mechanics` | Missing macro/micro topic structure |
| `Thermodynamics` | Not in approved catalog |

### ✅ Correct Approach:
1. Open `exam_topics.csv` in Excel
2. Find the row with your topic
3. **Copy-paste** the exact strings into your question CSV
4. Do NOT type manually (typos will cause rejection)

---

## PYQ vs VINA

### PYQ (Previous Year Questions)
```csv
source_type,year,notes
PYQ,2024,Auto-files to "TNPSC Group 4 - 2024" paper
```
- **Year is mandatory** (2000-2026)
- **Auto-files** to Previous Year Papers by exam_tag + year
- **Cannot duplicate** existing PYQ (content_hash checked)

### VINA (Practice Questions)
```csv
source_type,year,notes
VINA,2026,Requires manual paper assignment
```
- **Year is optional** (typically future year like 2026)
- **Does NOT auto-file** (admin assigns to custom papers)
- **Cannot match PYQ** content_hash (deduplication gate)

---

## Quick Import Workflow

### 1️⃣ Prepare CSV
```
Open: question_import_template.csv
Reference: exam_topics.csv (copy-paste taxonomy)
Fill: 29 columns per question
Save: UTF-8 CSV format
```

### 2️⃣ Upload via Admin Panel
```
Admin → Extracted Questions → Bulk Upload CSV
```

### 3️⃣ Review Validation
```
✅ Green rows: Valid, ready to import
❌ Red rows: Errors (taxonomy mismatch, missing year, etc.)
🔄 Yellow rows: Duplicates (matches existing PYQ)
```

### 4️⃣ Fix Errors & Confirm
```
Fix errors in CSV → Re-upload → Confirm Import
```

---

## Validation Rules Summary

| Rule | Check | Action if Failed |
|------|-------|------------------|
| **Taxonomy Match** | unit_code + macro_topic + micro_topic must exist in exam_topics.csv | ❌ Rejected |
| **PYQ Year** | PYQ questions must have year (2000-2026) | ❌ Rejected |
| **Deduplication** | VINA cannot match PYQ content_hash | ❌ Rejected |
| **Exam Tag** | Must be TNPSC_GROUP_1/2/4 | ❌ Rejected |
| **Difficulty** | Must be EASY/MEDIUM/HARD | ❌ Rejected |
| **Answer Key** | Must be A/B/C/D | ❌ Rejected |
| **Required Fields** | All marked fields must be filled | ❌ Rejected |

---

## Reference Files

| File | Purpose | Location |
|------|---------|----------|
| `question_import_template.csv` | Template with 5 sample questions | Root |
| `exam_topics.csv` | 80 approved taxonomy combinations | Root |
| `APPROVED_TAXONOMY_REFERENCE.md` | Human-readable taxonomy guide | Root |
| `CSV_IMPORT_FORMAT.md` | Detailed column documentation | Root |
| `ADMIN_CSV_IMPORT_GUIDE.md` | Complete admin guide | Root |

---

## 🚀 Start Here

```bash
1. Download: question_import_template.csv
2. Open: exam_topics.csv (for copy-paste)
3. Fill: Your questions (29 columns)
4. Upload: Admin Panel → Bulk Upload CSV
5. Confirm: After validation passes
```

**That's it. One CSV format. One upload method. Zero exceptions.**
