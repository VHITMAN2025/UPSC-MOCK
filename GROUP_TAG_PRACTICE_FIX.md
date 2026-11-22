# Practice Question Group Tag Filtering Fix

## Issue
When users selected "TNPSC Group 1" for practice sessions, they were getting questions tagged with "Group 4" or other incorrect group tags. Similarly for Group 2 and Group 4 practice sessions.

## Root Cause
The `fetchVerifiedQuestionsPool` function in `src/services/tnpscService.js` was only filtering questions by `paper_id` (based on the paper's exam_name), but **not by the question's `group_tag` column**.

This meant:
- If a paper was labeled "TNPSC Group 1"
- But contained some questions with `group_tag = "Group 4"`
- Those Group 4 questions would appear in Group 1 practice sessions

## Solution
Added explicit `group_tag` filtering in the `fetchVerifiedQuestionsPool` function:

```javascript
async function fetchVerifiedQuestionsPool(examContext = null) {
  let paperIds = []
  let examGroupFilter = null  // ← NEW
  
  if (examContext) {
    const normContext = String(examContext).toLowerCase().trim()
    
    // NEW: Determine which group filter to apply
    if (normContext.includes('group 1')) {
      examGroupFilter = 'Group 1'
    } else if (normContext.includes('group 2')) {
      examGroupFilter = ['Group 2', 'Group 2/2A', 'Group 2A']
    } else if (normContext.includes('group 4')) {
      examGroupFilter = 'Group 4'
    }
    
    // ... paper filtering logic ...
  }

  let p1Query = supabase.from('questions')...
  let p2Query = supabase.from('questions')...

  if (paperIds.length > 0) {
    p1Query = p1Query.in('paper_id', paperIds)
    p2Query = p2Query.in('paper_id', paperIds)
  }
  
  // NEW: Filter by group_tag
  if (examGroupFilter) {
    if (Array.isArray(examGroupFilter)) {
      p1Query = p1Query.in('group_tag', examGroupFilter)
      p2Query = p2Query.in('group_tag', examGroupFilter)
    } else {
      p1Query = p1Query.eq('group_tag', examGroupFilter)
      p2Query = p2Query.eq('group_tag', examGroupFilter)
    }
  }

  const [res1, res2] = await Promise.all([p1Query, p2Query])
  return [...(res1.data || []), ...(res2.data || [])]
}
```

## What Changed
1. Added `examGroupFilter` variable to determine the correct group tag based on exam context
2. Added `.eq('group_tag', ...)` or `.in('group_tag', [...])` filtering to both query ranges
3. Group 2 allows multiple variations: 'Group 2', 'Group 2/2A', 'Group 2A'

## Impact
✅ **Group 1 Practice** → Only fetches questions with `group_tag = 'Group 1'`
✅ **Group 2/2A Practice** → Only fetches questions with `group_tag IN ('Group 2', 'Group 2/2A', 'Group 2A')`
✅ **Group 4 Practice** → Only fetches questions with `group_tag = 'Group 4'`

## Files Modified
- `src/services/tnpscService.js` - Updated `fetchVerifiedQuestionsPool` function

## Testing
To verify the fix is working, users can:
1. Select "TNPSC Group 1" from exam selector
2. Start a practice session
3. Check the question badges - should only show "TNPSC Group 1" or "Group 1"
4. Should NOT see "Group 4" or "Group 2" badges

## Diagnostic Query
Created `diagnose_group_tag_mismatch.sql` to identify any remaining mismatched questions in the database.

## Related Issues
This fix also automatically applies to:
- Available question count display
- Practice session question selection
- All practice modes (standard, adaptive, fix test)
