# How to Fix Group 2 CSV Import Errors

## Problem

You generated a Group 2 CSV that has validation errors because it used the **OLD incorrect prompt** before I fixed it.

## The Errors

Your CSV has two types of invalid entries for `G2_APT_U1`:

### ❌ Error Type 1: Using "and" instead of "&"
```
Rows 149, 150, 156, 158, 159, 162:
micro_topic: 'Ratio and Proportion, Simple Interest & Compound Interest'
```
**Should be**:
```
micro_topic: 'Ratio & Proportion, Simple & Compound Interest, Area, Volume, Time & Work'
```

### ❌ Error Type 2: Wrong Macro Topic and Split Micro Topic
```
Rows 155, 157, 160, 163, 164, 166:
macro_topic: 'Commercial & Mensuration Math'
micro_topic: 'Area, Volume, Time and Work'
```
**Should be**:
```
macro_topic: 'Commercial & Advanced Math'
micro_topic: 'Ratio & Proportion, Simple & Compound Interest, Area, Volume, Time & Work'
```

## The ONLY Approved Combinations for G2_APT_U1

There are **ONLY TWO** valid macro/micro combinations for `unit_code: G2_APT_U1`:

### ✅ Option 1: Basic Arithmetic
```
unit_code: G2_APT_U1
macro_topic: Arithmetic
micro_topic: Simplification, Percentage, HCF & LCM
```

### ✅ Option 2: Commercial & Advanced Math (ALL topics combined)
```
unit_code: G2_APT_U1
macro_topic: Commercial & Advanced Math
micro_topic: Ratio & Proportion, Simple & Compound Interest, Area, Volume, Time & Work
```

**CRITICAL NOTES**:
- Use `&` not "and" after "Ratio"
- Use `&` not "and" after "Simple"  
- Use `&` not "and" after "Volume"
- The macro_topic is **"Commercial & Advanced Math"** NOT "Commercial & Mensuration Math"
- ALL commercial topics (Ratio, Interest, Area, Volume, Time) go in ONE micro_topic

## Solutions (Choose ONE)

### Solution 1: Regenerate the CSV (RECOMMENDED)

1. Delete your current Group 2 CSV file
2. Use the **CORRECTED** `AI_PROMPT_GROUP_2_CSV_GENERATION.md` (I just fixed it)
3. Copy the prompt to ChatGPT/Claude/Gemini
4. Specify how many questions you want
5. Download the new CSV
6. Import it

This is the cleanest solution.

### Solution 2: Manual Find & Replace in CSV

If you must salvage the current CSV, do these find/replace operations:

#### Find & Replace 1:
**Find**:
```
G2_APT_U1,Unit I: Aptitude,Arithmetic,"Ratio and Proportion, Simple Interest & Compound Interest"
```
**Replace with**:
```
G2_APT_U1,Unit I: Aptitude,Commercial & Advanced Math,"Ratio & Proportion, Simple & Compound Interest, Area, Volume, Time & Work"
```

#### Find & Replace 2:
**Find**:
```
G2_APT_U1,Unit I: Aptitude,Commercial & Mensuration Math,"Area, Volume, Time and Work"
```
**Replace with**:
```
G2_APT_U1,Unit I: Aptitude,Commercial & Advanced Math,"Ratio & Proportion, Simple & Compound Interest, Area, Volume, Time & Work"
```

**WARNING**: This will make ALL aptitude questions use the same commercial math micro_topic, which may not be ideal. Better to regenerate.

## Why This Happened

The Group 2 prompt I initially created had errors. I've now fixed:

1. ✅ Changed "Ratio and Proportion" → "Ratio & Proportion"
2. ✅ Changed "Commercial & Mensuration Math" → "Commercial & Advanced Math"
3. ✅ Prevented splitting of commercial topics (they must all be together)
4. ✅ Fixed unit codes (G2_TA_U1, G2_EN_U1)

## Verification

After fixing, check your CSV:

```bash
# Count rows with each micro_topic for G2_APT_U1
grep "G2_APT_U1" your_file.csv | cut -d',' -f9 | sort | uniq -c
```

You should ONLY see these two micro_topics:
- `Simplification, Percentage, HCF & LCM`
- `Ratio & Proportion, Simple & Compound Interest, Area, Volume, Time & Work`

If you see any other micro_topics for G2_APT_U1, they're WRONG.

## Questions?

The corrected prompt file is: `AI_PROMPT_GROUP_2_CSV_GENERATION.md`

It now has the correct taxonomy. Just regenerate your CSV and the errors will disappear!
