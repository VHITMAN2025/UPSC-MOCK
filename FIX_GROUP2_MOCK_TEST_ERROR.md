# Fix Group 2 Mock Test Error: "Insufficient Questions"

## Problem

Error: `Mock launch error: Insufficient questions in bucket 'Group 2 full-mock blueprint' [all]: requested 200, available 85, deficit 115.`

You imported 135 questions, but mock test only sees 85.

## Root Cause

The `group_tag` column is missing or incorrect on ~50 questions. The mock test filters by `group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')` so questions without this tag are invisible to the mock test system.

## Solution

### Step 1: Diagnose the Issue

Run `diagnose_group2_questions.sql` in Supabase SQL Editor to see:
- How many questions have correct group_tag
- How many have NULL or wrong group_tag
- Breakdown by unit_code

### Step 2: Fix the group_tag Column

Run `fix_group2_group_tag.sql` in Supabase SQL Editor.

This will:
1. Show current state (BEFORE FIX)
2. Update all TNPSC_GROUP_2 questions to have `group_tag = 'Group 2'`
3. Show fixed state (AFTER FIX)
4. Display count of usable questions (should be ~135)

### Step 3: Verify Fix

After running the fix, try launching the mock test again. You should now see:
- Available: ~135 questions
- Deficit: ~65 questions (still need more)

## Why This Happened

When you imported the CSV, the `group_tag` column might not have been populated correctly. The CSV import process should set:
- `exam_tag` = `TNPSC_GROUP_2` ✅ (this worked)
- `group_tag` = `Group 2` ❌ (this failed or was skipped)

## After Fix: You Still Need More Questions

Even after fixing the group_tag, you'll have ~135 questions but need 200 for a full mock test.

**Generate 65-70 more questions** using the corrected `AI_PROMPT_GROUP_2_CSV_GENERATION.md`:

```
Generate 70 TNPSC GROUP 2 questions:

GENERAL STUDIES (50 questions):
- 8 from Unit 1 (G2_GS_U1): 2 EASY + 4 MEDIUM + 2 HARD
- 8 from Unit 2 (G2_GS_U2): 2 EASY + 4 MEDIUM + 2 HARD
- 9 from Unit 3 (G2_GS_U3): 2 EASY + 5 MEDIUM + 2 HARD
- 9 from Unit 4 (G2_GS_U4): 2 EASY + 5 MEDIUM + 2 HARD
- 8 from Unit 5 (G2_GS_U5): 2 EASY + 4 MEDIUM + 2 HARD
- 8 from Unit 6 (G2_GS_U6): 2 EASY + 4 MEDIUM + 2 HARD

APTITUDE (15 questions):
- 10 from G2_APT_U1: Use macro_topic "Commercial & Advanced Math" 
  with micro_topic "Ratio & Proportion, Simple & Compound Interest, Area, Volume, Time & Work"
  Distribution: 2 EASY + 5 MEDIUM + 3 HARD
- 5 from G2_APT_U2: 1 EASY + 3 MEDIUM + 1 HARD

LANGUAGE (5 questions):
- 5 from G2_TA_U1: 1 EASY + 3 MEDIUM + 1 HARD

All questions PYQ source type, year 2024, bilingual.
Use correct unit codes: G2_TA_U1 (not G2_TAMIL_U1), G2_EN_U1 (not G2_ENGLISH_U1)
Format as complete CSV with header row.
```

## Expected Timeline

1. **Right now**: Run `fix_group2_group_tag.sql` (takes 1 second)
2. **After fix**: Mock test will see ~135 questions, still 65 short
3. **Generate 70 more**: Use corrected prompt (takes 5 minutes with AI)
4. **Import new CSV**: Upload to admin panel (takes 1 minute)
5. **Total questions**: ~205 (enough for mock tests!)

## Verification Commands

After everything is done:

```sql
-- Should return ~200+
SELECT COUNT(*) 
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_2'
  AND group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')
  AND correct_option IS NOT NULL;

-- Check difficulty distribution (should be roughly 20/50/30)
SELECT 
    difficulty_level,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM questions
WHERE exam_tag = 'TNPSC_GROUP_2'
  AND group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')
  AND correct_option IS NOT NULL
GROUP BY difficulty_level;
```

## Files Created

- `diagnose_group2_questions.sql` - Check current state
- `fix_group2_group_tag.sql` - Fix the group_tag column
- This guide - How to fix the error

## Next Steps

1. ✅ Run `fix_group2_group_tag.sql` NOW to unlock your 135 questions
2. ⏳ Generate 70 more questions using corrected prompt
3. ⏳ Import the new CSV
4. ✅ Mock tests will work with 200+ questions!
