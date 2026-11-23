# Group 2 CSV Generation Prompt - Corrections Applied

## Issues Found

Your Group 2 CSV had validation errors. I've fixed the AI_PROMPT_GROUP_2_CSV_GENERATION.md file.

## Errors Fixed

### Error 1: Aptitude Unit 1 Micro Topic (Rows 149-166)

**Problem**: 
```
micro_topic: 'Ratio and Proportion, Simple & Compound Interest, Area, Volume, Time & Work'
```

**Why it failed**: The approved taxonomy (TOPIC_077 and TOPIC_078) splits this into TWO separate entries:
- TOPIC_077: `Arithmetic` → `Simplification, Percentage, HCF & LCM`
- TOPIC_078: `Commercial & Advanced Math` → `Ratio and Proportion, Simple & Compound Interest, Area, Volume, Time & Work`

**But wait!** Looking at Group 4's approved taxonomy, these are actually split further:
- TOPIC_038: `Arithmetic` → `Ratio and Proportion, Simple Interest & Compound Interest`
- TOPIC_039: `Commercial & Mensuration Math` → `Area, Volume, Time and Work`

**Solution**: Updated the prompt to warn users NOT to combine all topics. Questions should use one of these exact combinations:
1. `macro_topic: Arithmetic` + `micro_topic: Simplification, Percentage, HCF & LCM`
2. `macro_topic: Arithmetic` + `micro_topic: Ratio and Proportion, Simple Interest & Compound Interest`
3. `macro_topic: Commercial & Mensuration Math` + `micro_topic: Area, Volume, Time and Work`

### Error 2: Wrong Unit Codes for Language (Rows 182-201)

**Problem**: 
- Used `G2_TAMIL_U1` (invalid)
- Used `G2_ENGLISH_U1` (invalid)

**Correct unit codes**:
- `G2_TA_U1` (for Tamil)
- `G2_EN_U1` (for English)

**Why**: The database schema expects short codes `TA` and `EN`, not `TAMIL` and `ENGLISH`.

## Corrected Taxonomy for Group 2

### Aptitude Unit 1 (CORRECTED)
```
unit_code: G2_APT_U1
unit_name: Unit I: Aptitude
subject_name: Aptitude & Mental Ability

Option 1:
macro_topic: Arithmetic
micro_topic: Simplification, Percentage, HCF & LCM

Option 2:
macro_topic: Arithmetic  
micro_topic: Ratio and Proportion, Simple Interest & Compound Interest

Option 3:
macro_topic: Commercial & Mensuration Math
micro_topic: Area, Volume, Time and Work
```

### Language Units (CORRECTED)
```
Tamil:
unit_code: G2_TA_U1 (not G2_TAMIL_U1)
unit_name: Part C: General Tamil
subject_name: பொதுத் தமிழ்
macro_topic: பொதுத் தமிழ்
micro_topic: இலக்கணம், சொல்லகராதி, எழுதும் திறன், கலைச்சொற்கள், வாசித்தல், மொழிபெயர்ப்பு & இலக்கியம் (SSLC Standard)

English:
unit_code: G2_EN_U1 (not G2_ENGLISH_U1)
unit_name: Part C: General English
subject_name: General English
macro_topic: General English
micro_topic: Grammar, Vocabulary, Writing Skills, Technical Terms, Comprehension, Translation & Literary Works (SSLC Standard)
```

## What You Need to Do

### If you already generated a CSV with errors:

1. **Fix the unit codes** in your CSV:
   - Find all `G2_TAMIL_U1` → Replace with `G2_TA_U1`
   - Find all `G2_ENGLISH_U1` → Replace with `G2_EN_U1`

2. **Fix the aptitude micro topics** in your CSV:
   - Find rows with `unit_code = 'G2_APT_U1'`
   - For questions about Ratio/Proportion/Interest: Use `macro_topic: Arithmetic` and `micro_topic: Ratio and Proportion, Simple Interest & Compound Interest`
   - For questions about Area/Volume/Time: Use `macro_topic: Commercial & Mensuration Math` and `micro_topic: Area, Volume, Time and Work`
   - For questions about Simplification/Percentage/HCF/LCM: Use `macro_topic: Arithmetic` and `micro_topic: Simplification, Percentage, HCF & LCM`

3. **Re-import the corrected CSV**

### If you haven't generated the CSV yet:

✅ The prompt file has been fixed! Just use it as-is now.

## Validation Checklist

After generating your CSV, verify:

- [ ] No `G2_TAMIL_U1` unit codes (should be `G2_TA_U1`)
- [ ] No `G2_ENGLISH_U1` unit codes (should be `G2_EN_U1`)
- [ ] No combined aptitude micro topics (split into Arithmetic and Commercial & Mensuration Math)
- [ ] All micro_topics match exactly from approved taxonomy (character-for-character)
- [ ] Use `&` not `and` in micro topics
- [ ] Proper comma placement in micro topics

## Files Updated

- ✅ `AI_PROMPT_GROUP_2_CSV_GENERATION.md` - Fixed both issues
- ✅ This document created to explain the fixes

## Testing Your CSV

Before importing, you can test your CSV with this SQL:

```sql
-- Check for invalid unit codes
SELECT DISTINCT unit_code 
FROM (SELECT unnest(string_to_array('YOUR_CSV_ROW_UNIT_CODES', ',')) as unit_code) sub
WHERE unit_code NOT IN ('G2_GS_U1', 'G2_GS_U2', 'G2_GS_U3', 'G2_GS_U4', 'G2_GS_U5', 'G2_GS_U6', 'G2_APT_U1', 'G2_APT_U2', 'G2_TA_U1', 'G2_EN_U1');

-- Check for invalid micro topics under G2_APT_U1
SELECT DISTINCT macro_topic, micro_topic
FROM questions_staging
WHERE unit_code = 'G2_APT_U1'
  AND micro_topic NOT IN (
    'Simplification, Percentage, HCF & LCM',
    'Ratio and Proportion, Simple Interest & Compound Interest',
    'Area, Volume, Time and Work'
  );
```

## Summary

The Group 2 prompt had two bugs that would cause CSV validation errors. Both have been fixed:
1. Aptitude topics were incorrectly combined → Now split correctly
2. Language unit codes were wrong → Now use correct short codes (TA/EN)

You can now use the updated `AI_PROMPT_GROUP_2_CSV_GENERATION.md` to generate valid CSVs!
