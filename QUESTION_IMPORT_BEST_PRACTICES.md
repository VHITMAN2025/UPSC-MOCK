# Question Import Best Practices

## To Prevent Mock Test Generation Issues

### 1. **Always Set Difficulty Levels**
When importing questions via CSV, ensure **every question** has a difficulty_level:
- Use uppercase: `EASY`, `MEDIUM`, or `HARD`
- ❌ Don't use: "Easy", "Medium", "Hard", "easy", "medium", "hard"
- Distribution target: 20% EASY, 50% MEDIUM, 30% HARD per unit

### 2. **Verify Unit Coverage**
Before importing, check which units need questions:
```sql
-- Run this query to see deficit units
\i monitor_question_bank_health.sql
```

### 3. **Use Correct Paper Types**
Questions must be in papers with these exam_type values:
- ✅ **"Previous Year"** (recommended for imported questions)
- ✅ **"Prelims"**
- ✅ **"Optional"**
- ❌ **"Full Mock"** (excluded - reserved for generated tests)
- ❌ **"Custom"** (excluded - reserved for user-created tests)

### 4. **Required Fields Checklist**
Every question MUST have:
- ✅ `exam_tag` (e.g., TNPSC_GROUP_4)
- ✅ `unit_code` (e.g., G4_GS_U1) or `unit_name` (auto-generates unit_code)
- ✅ `correct_option` (A, B, C, D, or E)
- ✅ `difficulty_level` (EASY, MEDIUM, or HARD)
- ✅ Valid `macro_topic` and `micro_topic` from approved taxonomy

### 5. **Pre-Import Health Check**
Run before every major import:
```sql
SELECT * FROM question_bank_health;
```

Look for:
- Units with 0 questions
- Missing difficulty levels
- Imbalanced distributions

### 6. **Post-Import Verification**
After importing, run:
```sql
-- Check if any deficits remain
\i monitor_question_bank_health.sql
```

### 7. **Quick Fix for Deficits**
If mock generation fails with "Insufficient questions":
1. Run `monitor_question_bank_health.sql` to identify deficit units
2. Convert existing questions instead of importing new ones:
   ```sql
   -- Example: Convert MEDIUM to HARD for deficit unit
   UPDATE questions
   SET difficulty_level = 'HARD'
   WHERE unit_code = 'G4_XX_UX'
     AND difficulty_level = 'MEDIUM'
     AND exam_tag = 'TNPSC_GROUP_4'
   LIMIT 1;
   ```

## Common Mistakes to Avoid

### ❌ Don't Do This:
- Import all questions as "Medium" difficulty
- Leave unit_code or unit_name NULL
- Use paper type "Custom" or "Full Mock"
- Mix uppercase/lowercase in difficulty_level
- Skip validation after import

### ✅ Do This Instead:
- Distribute questions across EASY/MEDIUM/HARD
- Always provide unit_name (unit_code auto-generates)
- Use paper type "Previous Year"
- Use uppercase EASY/MEDIUM/HARD only
- Run health check after every import

## Emergency Recovery

If mock generation is broken:
1. Run `monitor_question_bank_health.sql` → identify gaps
2. Run conversion SQL to redistribute difficulty levels
3. Verify with health check query
4. Test mock generation

## Monitoring Dashboard

Add to your admin panel:
```sql
SELECT * FROM question_bank_health;
```

Shows at a glance:
- Total questions per exam group
- EASY/MEDIUM/HARD distribution
- Units with questions

Green = healthy, Red = needs attention
