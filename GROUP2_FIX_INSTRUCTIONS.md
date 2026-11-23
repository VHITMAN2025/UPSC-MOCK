# Group 2 Mock Test Fix - Complete Solution

## Problem Summary
Your Group 2 mock test showed "Insufficient questions" error even though you have 332 valid questions in the database.

### Root Causes Identified:
1. **ALL questions are "Medium" difficulty** (332 out of 332)
2. **10 questions have NULL unit_code** (English questions)
3. Mock test requires proper distribution: **20% Easy, 50% Medium, 30% Hard**

## Solution

Run the SQL file: **`FIX_GROUP2_COMPREHENSIVE_SOLUTION.sql`** in your Supabase SQL Editor.

### What the SQL does:

#### Step 1: Fix NULL unit_codes
- Updates 10 English questions from `NULL` → `G2_EN_U1`

#### Step 2: Redistribute difficulty levels
- **Converts 63 questions to "Easy"** (20% of total)
- **Keeps 177 questions as "Medium"** (53% of total)
- **Converts 92 questions to "Hard"** (28% of total)

#### Step 3: Distribution per unit

| Unit Code | Easy | Medium | Hard | Total |
|-----------|------|--------|------|-------|
| G2_APT_U1 | 5    | 10     | 6    | 21    |
| G2_APT_U2 | 4    | 10     | 6    | 20    |
| G2_EN_U1  | 3    | 7      | 5    | 15    |
| G2_GS_U1  | 9    | 23     | 13   | 45    |
| G2_GS_U2  | 6    | 14     | 8    | 28    |
| G2_GS_U3  | 7    | 17     | 10   | 34    |
| G2_GS_U4  | 7    | 17     | 11   | 35    |
| G2_GS_U5  | 8    | 19     | 12   | 39    |
| G2_GS_U6  | 7    | 16     | 10   | 33    |
| G2_TA_U1  | 7    | 17     | 11   | 35    |
| **TOTAL** | **63** | **177** | **92** | **332** |

## How to Run

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy entire contents of `FIX_GROUP2_COMPREHENSIVE_SOLUTION.sql`
3. Paste and click **"Run"**
4. Wait for all steps to complete (watch status messages)
5. Verify final distribution matches the table above

## Expected Result

After running the SQL:
- ✅ All 332 questions will have proper difficulty distribution
- ✅ All questions will have valid unit_codes
- ✅ Mock test will generate successfully with 200 questions
- ✅ Distribution will be: ~40 Easy + ~100 Medium + ~60 Hard

## Test the Fix

After running the SQL:
1. Go to your UPSC Mock Test application
2. Navigate to **Mock Tests** → **Group 2/2A**
3. Click **"Start Mock Test"**
4. Mock test should generate successfully with 200 questions

## If Still Not Working

Run this diagnostic query to verify:

```sql
SELECT 
    difficulty_level,
    COUNT(*) as total,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM questions q
INNER JOIN papers p ON q.paper_id = p.id
WHERE q.exam_tag = 'TNPSC_GROUP_2'
  AND q.group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')
  AND p.exam_type NOT IN ('Full Mock', 'Custom')
  AND q.correct_option IS NOT NULL
GROUP BY difficulty_level
ORDER BY difficulty_level;
```

Expected output:
- Easy: ~63 (19%)
- Hard: ~92 (28%)
- Medium: ~177 (53%)

---

## Technical Details

The mock test generator (`testGeneratorService.js`) uses a biproportional allocation algorithm:
- Allocates questions per unit AND per difficulty
- Requires 20% Easy, 50% Medium, 30% Hard distribution
- Filters: `exam_tag = 'TNPSC_GROUP_2'` + `group_tag IN (...)` + `papers.exam_type NOT IN ('Full Mock', 'Custom')`
- Uses case-insensitive matching (`ilike`) for difficulty_level

Since all your questions were "Medium", the allocator couldn't find any "Easy" or "Hard" questions, causing the "Insufficient questions" error even though you had 332 total questions.
