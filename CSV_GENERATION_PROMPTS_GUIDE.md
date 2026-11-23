# CSV Generation Prompts Guide

## Overview

This folder contains **three comprehensive AI prompts** for generating TNPSC CSV question files for Groups 1, 2/2A, and 4. Each prompt is ready to copy-paste into any AI tool (ChatGPT, Claude, Gemini) to generate properly formatted CSV files.

## Available Prompts

| File | Exam Group | Ideal Time | Complexity | Units |
|------|------------|------------|------------|-------|
| `AI_PROMPT_GROUP_1_CSV_GENERATION.md` | Group 1 | 54 seconds | Advanced (Degree+) | 6 GS + 2 Aptitude |
| `AI_PROMPT_GROUP_2_CSV_GENERATION.md` | Group 2/2A | 45 seconds | Degree Standard | 6 GS + 2 Aptitude + Language |
| `AI_PROMPT_GROUP_4_CSV_GENERATION.md` | Group 4 | 36 seconds | SSLC Standard | 6 GS + 2 Apt + 7 Tamil + 7 English |

## Key Features (All Prompts)

✅ **Exact 29-column CSV format** matching database schema  
✅ **Complete approved taxonomy** with unit codes and macro/micro topics  
✅ **Difficulty distribution**: 20% EASY, 50% MEDIUM, 30% HARD  
✅ **Bilingual support**: English + Tamil for all questions  
✅ **Example questions** showing correct format for each difficulty level  
✅ **Validation checklist** to verify generated CSV  
✅ **Usage examples** with specific question counts per unit  

## How to Use

### Step 1: Choose Your Group
Select the appropriate prompt file based on which exam group you need questions for.

### Step 2: Open the Prompt File
Open the `.md` file in any text editor and copy the **entire prompt section** (starts with "I need you to generate...").

### Step 3: Customize Your Request
At the end of the prompt, specify:
- **Number of questions** you want (e.g., 100, 200)
- **Unit distribution** (e.g., "20 questions from Unit 1, 15 from Unit 2...")
- **Specific topics** if needed

### Step 4: Generate CSV
1. Paste the prompt into ChatGPT, Claude, or Gemini
2. Wait for the AI to generate the complete CSV
3. Download the generated CSV file

### Step 5: Validate
Use the validation checklist in the prompt file to verify:
- Correct `exam_tag` (TNPSC_GROUP_1, TNPSC_GROUP_2, or TNPSC_GROUP_4)
- Correct `unit_code` prefix (G1_, G2_, or G4_)
- Difficulty distribution matches 20/50/30 split
- All taxonomy values match approved list
- UTF-8 encoding with Tamil Unicode

### Step 6: Import to Database
1. Log into admin panel
2. Navigate to CSV Upload section
3. Select your CSV file
4. Review the preview
5. Click "Import Questions"

## Difficulty Distribution Examples

For **10 questions**: 2 EASY + 5 MEDIUM + 3 HARD  
For **20 questions**: 4 EASY + 10 MEDIUM + 6 HARD  
For **25 questions**: 5 EASY + 12 MEDIUM + 8 HARD  
For **100 questions**: 20 EASY + 50 MEDIUM + 30 HARD  
For **200 questions**: 40 EASY + 100 MEDIUM + 60 HARD  

## Group-Specific Notes

### Group 1 (Advanced)
- **Target audience**: Administrative officers
- **Complexity**: Deepest analysis, policy-oriented
- **Question characteristics**: Multi-concept integration, current affairs
- **Ideal time**: 54 seconds per question

### Group 2/2A (Degree Standard)
- **Target audience**: Assistant posts
- **Complexity**: Degree-level understanding
- **Question characteristics**: Application-oriented, governance focus
- **Ideal time**: 45 seconds per question
- **Language**: Includes SSLC-level Tamil or English test

### Group 4 (SSLC Standard)
- **Target audience**: Clerical/support staff
- **Complexity**: School-leaving certificate level
- **Question characteristics**: Factual recall, straightforward application
- **Ideal time**: 36 seconds per question
- **Language**: Extensive Tamil (7 units) and English (7 units) sections

## Taxonomy Structure

All prompts use the **91-entry approved taxonomy** from `APPROVED_TAXONOMY_REFERENCE.md`.

### Unit Code Prefixes:
- **G1_** = Group 1
- **G2_** = Group 2/2A
- **G4_** = Group 4

### Subject Name Options:
- `General Studies` - For GS units
- `Aptitude & Mental Ability` - For aptitude/reasoning units
- `பொதுத் தமிழ்` - For Tamil language units
- `General English` - For English language units

## Common Issues & Solutions

### Issue 1: Tamil Characters Show as Boxes
**Solution**: Save CSV as UTF-8 encoding (not ANSI or Windows-1252)

### Issue 2: Difficulty Distribution Incorrect
**Solution**: Manually verify counts. Use formula: EASY=20%, MEDIUM=50%, HARD=30%

### Issue 3: Taxonomy Validation Error
**Solution**: Compare macro_topic and micro_topic character-by-character with approved taxonomy. Even "&" vs "and" matters!

### Issue 4: CSV Import Fails
**Solution**: Check for:
- Line breaks inside fields (not allowed)
- Missing commas (must have 29 columns)
- Unquoted commas in text (wrap in "quotes")

## Quick Start Example

```
# Generate 100 Group 1 questions

1. Open AI_PROMPT_GROUP_1_CSV_GENERATION.md
2. Copy the full prompt
3. Paste into ChatGPT
4. Add at the end: "Generate 100 questions distributed evenly across all 6 units"
5. Download the CSV
6. Import via admin panel
```

## File Locations

- **Prompt Files**: `AI_PROMPT_GROUP_[1|2|4]_CSV_GENERATION.md`
- **Taxonomy Reference**: `APPROVED_TAXONOMY_REFERENCE.md`
- **CSV Format Spec**: `CSV_IMPORT_FORMAT.md`
- **Admin Guide**: `ADMIN_CSV_IMPORT_GUIDE.md`

## Support

If you encounter issues:
1. Check the validation checklist in the prompt file
2. Review `APPROVED_TAXONOMY_REFERENCE.md` for exact taxonomy strings
3. Consult `CSV_IMPORT_FORMAT.md` for column specifications
4. Review previous successful imports in the database

## Version Info

- **Created**: November 22, 2026
- **Format Version**: 29-column CSV (v2)
- **Taxonomy Version**: 91-entry approved taxonomy
- **Compatible with**: Supabase question bank schema

---

**Next Steps**: Choose your target group and start generating questions! Each prompt is production-ready and tested.
