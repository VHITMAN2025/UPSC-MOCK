# Practice Test Diagnostic Guide

## Issue Reported
Practice tests are not working.

## Recent Fixes Applied
✅ **Group Tag Filtering** - Fixed in `src/services/tnpscService.js` (line 1720-1728)
- Group 1 practice now only shows Group 1 questions
- Group 2 practice now only shows Group 2/2A questions
- Group 4 practice now only shows Group 4 questions

## Diagnostic Steps

### Step 1: Verify Questions Exist in Database

Run this SQL in Supabase SQL Editor:

```sql
-- Check question counts by group
SELECT 
    group_tag,
    COUNT(*) as total_questions,
    COUNT(CASE WHEN correct_option IS NOT NULL THEN 1 END) as questions_with_answer
FROM questions
WHERE group_tag IN ('Group 1', 'Group 2', 'Group 2/2A', 'Group 2A', 'Group 4')
GROUP BY group_tag
ORDER BY group_tag;
```

**Expected Result**: You should see counts for each group. If any group shows 0 questions, that's the problem.

### Step 2: Check Published Papers

```sql
SELECT id, title, exam_name, status
FROM papers
WHERE status = 'published'
ORDER BY exam_name;
```

**Expected Result**: Papers with `exam_name` containing "Group 1", "Group 2", or "Group 4" should exist and be published.

### Step 3: Test Practice Session Creation

1. Start the dev server:
   ```cmd
   npm run dev
   ```

2. Open browser console (F12)

3. Navigate to Practice section

4. Try to create a practice session for Group 1

5. Check console for errors

### Step 4: Common Issues & Solutions

#### Issue A: "No verified questions available"

**Cause**: No questions match the selected criteria (unit, subject, or group)

**Solution**:
1. Run `diagnose_practice_test.sql` to check question distribution
2. Verify `group_tag` column is populated correctly
3. Check if questions have `correct_option` filled

#### Issue B: Practice page shows loading spinner forever

**Cause**: API call failing or hanging

**Solution**:
1. Check browser console for errors
2. Check Network tab for failed API calls
3. Verify Supabase connection (check `.env` file)
4. Check if RLS policies are blocking the query

#### Issue C: Questions from wrong group appearing

**Cause**: Group tag filtering not working

**Solution**: Already fixed! The recent update added:
```javascript
if (examGroupFilter) {
  if (Array.isArray(examGroupFilter)) {
    p1Query = p1Query.in('group_tag', examGroupFilter)
    p2Query = p2Query.in('group_tag', examGroupFilter)
  } else {
    p1Query = p1Query.eq('group_tag', examGroupFilter)
    p2Query = p2Query.eq('group_tag', examGroupFilter)
  }
}
```

#### Issue D: Practice test starts but no questions load

**Cause**: Questions selected but not properly formatted

**Solution**:
1. Check if `VALID_PRACTICE_FIELDS` includes all required fields
2. Verify question data structure in console
3. Check if `papers` relation is being loaded properly

### Step 5: Verify Fix Effectiveness

Run this to check if group filtering is working:

```sql
-- Simulate Group 1 practice query
SELECT 
    id,
    question_text,
    group_tag,
    unit_code,
    macro_topic
FROM questions
WHERE 
    correct_option IS NOT NULL
    AND group_tag = 'Group 1'
LIMIT 10;

-- Simulate Group 2 practice query
SELECT 
    id,
    question_text,
    group_tag,
    unit_code,
    macro_topic
FROM questions
WHERE 
    correct_option IS NOT NULL
    AND group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')
LIMIT 10;

-- Simulate Group 4 practice query
SELECT 
    id,
    question_text,
    group_tag,
    unit_code,
    macro_topic
FROM questions
WHERE 
    correct_option IS NOT NULL
    AND group_tag = 'Group 4'
LIMIT 10;
```

## Quick Test Procedure

1. **Start dev server**: `npm run dev`
2. **Login** to the app
3. **Navigate** to Practice section
4. **Select Group** (e.g., Group 1)
5. **Select Unit** (e.g., Unit 1 or "All Subjects")
6. **Set question count** (e.g., 10 questions)
7. **Click "Start Practice"**
8. **Check**:
   - Does practice session start?
   - Are questions displayed?
   - Are questions from the correct group?
   - Do questions have proper Tamil translations?

## Expected Behavior After Fix

✅ **Group 1 Practice**:
- Shows ONLY questions with `group_tag = 'Group 1'`
- Questions should have `unit_code` starting with `G1_`
- No Group 2 or Group 4 questions should appear

✅ **Group 2 Practice**:
- Shows ONLY questions with `group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')`
- Questions should have `unit_code` starting with `G2_`
- No Group 1 or Group 4 questions should appear

✅ **Group 4 Practice**:
- Shows ONLY questions with `group_tag = 'Group 4'`
- Questions should have `unit_code` starting with `G4_`
- No Group 1 or Group 2 questions should appear

## Error Messages and Meanings

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| "No verified questions currently available" | No questions match your criteria | Check question bank, select "All Subjects" |
| "Unable to find the selected mistake questions" | Fix Test mode but questions not found | Return to exam review and reselect |
| Network Error / Failed to fetch | API connection issue | Check Supabase connection, RLS policies |
| "Practice session creation failed" | Database insert failed | Check practice_sessions table permissions |

## Files to Check

- **Service Layer**: `src/services/tnpscService.js` (lines 1685-1745)
- **Practice Page**: `src/pages/user/PracticePage.jsx`
- **API Routes**: Check Supabase Functions if using edge functions
- **Database**: `questions` table, `papers` table, `practice_sessions` table

## If Practice Tests Still Don't Work

Please provide:
1. **Error message** from browser console (F12)
2. **SQL query results** from Step 1 above (question counts)
3. **Network tab screenshot** showing failed API calls
4. **Exact steps** you took before the error occurred

With this information, I can diagnose the specific issue more precisely.

## Contact Points

- Check `GROUP_TAG_PRACTICE_FIX.md` for detailed fix documentation
- Check `diagnose_practice_test.sql` for database diagnostic queries
- Review browser console for JavaScript errors
- Review Supabase logs for database errors
