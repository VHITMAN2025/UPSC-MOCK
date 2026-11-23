# 🎯 TNPSC GROUP 1 MOCK TEST - 200 QUESTION GENERATION GUIDE

## Overview
This document provides the **EXACT PROMPT** to generate a complete 200-question Group 1 mock test that will display perfectly in your grid navigation system.

---

## 🔥 SYSTEM ARCHITECTURE SUMMARY

### Your Current Implementation:
✅ **Test Generator Service** (`testGeneratorService.js`)
- Generates exactly 200 questions using blueprint quotas
- Hamilton allocation ensures 20% Easy, 50% Medium, 30% Hard
- Zero-repetition tracking across mocks
- Fisher-Yates randomization

✅ **Question Navigator Grid** (`QuestionNavigator.jsx`)
- 5-column grid layout (40 rows for 200 questions)
- Color-coded status: Green (answered), Amber (marked), Gray (unanswered), Blue (current)
- Real-time progress tracking
- Mobile responsive

✅ **Database Structure** (Supabase)
- 29-column question format
- Taxonomy validation (91 approved entries)
- Difficulty case-sensitive matching
- Bilingual support (English + Tamil)

---

## 📊 GROUP 1 EXACT BLUEPRINT (200 Questions)

```
PART A: GENERAL STUDIES (175 Questions)
├─ G1_GS_U1: Unit I: General Science (10Q) → 2 Easy, 5 Medium, 3 Hard
├─ G1_GS_U2: Unit II: Geography of India (10Q) → 2 Easy, 5 Medium, 3 Hard
├─ G1_GS_U3: Unit III: History, Culture & INM (25Q) → 5 Easy, 12 Medium, 8 Hard
├─ G1_GS_U4: Unit IV: Indian Polity (40Q) → 8 Easy, 20 Medium, 12 Hard
├─ G1_GS_U5: Unit V: Indian Economy & TN Dev (50Q) → 10 Easy, 25 Medium, 15 Hard
└─ G1_GS_U6: Unit VI: TN History, Culture & Heritage (40Q) → 8 Easy, 20 Medium, 12 Hard

PART B: APTITUDE & MENTAL ABILITY (25 Questions)
├─ G1_APT_U1: Unit I: Aptitude (15Q) → 3 Easy, 8 Medium, 4 Hard
└─ G1_APT_U2: Unit II: Reasoning (10Q) → 2 Easy, 5 Medium, 3 Hard

TOTAL: 200 Questions (40 Easy + 100 Medium + 60 Hard)
```

---

## 🎯 COMPLETE AI GENERATION PROMPT

**Copy this ENTIRE prompt to ChatGPT/Claude/Gemini:**

```
I need you to generate a complete TNPSC GROUP 1 FULL MOCK TEST with EXACTLY 200 questions in CSV format.

### CRITICAL REQUIREMENTS

**File Format:**
- UTF-8 encoding (required for Tamil Unicode)
- 29 columns total
- ONE header row + 200 data rows = 201 total rows
- No line breaks inside fields

**Header Row (EXACT ORDER):**
```
question_id,content_hash,exam_tag,source_type,year,subject_name,unit_code,unit_name,macro_topic,micro_topic,sub_topic,difficulty_level,question_type,cognitive_skill,ideal_time_seconds,en_question_text,en_option_a,en_option_b,en_option_c,en_option_d,en_option_e,ta_question_text,ta_option_a,ta_option_b,ta_option_c,ta_option_d,ta_option_e,answer_key,en_explanation,ta_explanation
```

**Fixed Values for ALL 200 Questions:**
- `question_id`: Leave blank (,,)
- `content_hash`: Leave blank (,,)
- `exam_tag`: **TNPSC_GROUP_1** (MUST be exact)
- `source_type`: **PYQ**
- `year`: **2024**
- `question_type`: **Multiple Choice**
- `ideal_time_seconds`: **54**
- `answer_key`: Only A, B, C, or D (uppercase)
- `sub_topic`: Leave blank (,,)
- `en_option_e`: Leave blank (,,)
- `ta_option_e`: Leave blank (,,)

**Difficulty Levels (CASE-SENSITIVE):**
- Use ONLY: **EASY**, **MEDIUM**, **HARD** (all uppercase, no "Easy", "Medium", "Hard")

**Cognitive Skills:**
- EASY questions → Use **Recall**
- MEDIUM questions → Use **Comprehension** or **Application**
- HARD questions → Use **Analysis**

---

### EXACT UNIT BREAKDOWN (200 QUESTIONS)

**Generate questions in this EXACT distribution:**

**UNIT 1: General Science (10 Questions)**
- unit_code: **G1_GS_U1**
- unit_name: **Unit I: General Science**
- subject_name: **General Studies**
- Quota: 2 EASY + 5 MEDIUM + 3 HARD

Approved Taxonomy:
```
Macro: Advanced Scientific Temper & Physics
Micro: Scientific Temper, Advanced Physics Principles & Modern Technology Applications

OR

Macro: Advanced Life Science & Ecology
Micro: Advanced Molecular Biology, Genetics, Physiology, Human Diseases & Ecology
```

---

**UNIT 2: Geography of India (10 Questions)**
- unit_code: **G1_GS_U2**
- unit_name: **Unit II: Geography of India**
- subject_name: **General Studies**
- Quota: 2 EASY + 5 MEDIUM + 3 HARD

Approved Taxonomy:
```
Macro: Comprehensive India & World Geography
Micro: Advanced Physical, Economic, Social Geography, Geopolitics & Disaster Management
```

---

**UNIT 3: History, Culture & INM (25 Questions)**
- unit_code: **G1_GS_U3**
- unit_name: **Unit III: History, Culture of India, and Indian National Movement**
- subject_name: **General Studies**
- Quota: 5 EASY + 12 MEDIUM + 8 HARD

Approved Taxonomy:
```
Macro: Deep Indian History & Culture
Micro: Comprehensive Ancient, Medieval, Modern History, Cultural Heritage & Personalities

OR

Macro: National Movement & Current Dynamics
Micro: Indian National Movement, Satyagraha, Militant Movements, Books, Authors & Sports
```

---

**UNIT 4: Indian Polity (40 Questions)**
- unit_code: **G1_GS_U4**
- unit_name: **Unit IV: Indian Polity**
- subject_name: **General Studies**
- Quota: 8 EASY + 20 MEDIUM + 12 HARD

Approved Taxonomy:
```
Macro: Advanced Indian Polity & Governance
Micro: Comprehensive Constitutional Law, Federalism, Judiciary, Administrative Ethics & Public Administration
```

---

**UNIT 5: Indian Economy & TN Development (50 Questions)**
- unit_code: **G1_GS_U5**
- unit_name: **Unit V: Indian Economy and Development Administration in Tamil Nadu**
- subject_name: **General Studies**
- Quota: 10 EASY + 25 MEDIUM + 15 HARD

Approved Taxonomy:
```
Macro: Advanced Macroeconomics & TN Development
Micro: Comprehensive Economic Planning, Fiscal/Monetary Policy, Welfare Administration, Human Development & Governance in TN
```

---

**UNIT 6: TN History & Culture (40 Questions)**
- unit_code: **G1_GS_U6**
- unit_name: **Unit VI: History, Culture, Heritage, and Socio-Political Movements in Tamil Nadu**
- subject_name: **General Studies**
- Quota: 8 EASY + 20 MEDIUM + 12 HARD

Approved Taxonomy:
```
Macro: Advanced Tamil Heritage & Movements
Micro: In-depth Tamil Society, Archaeological Heritage, Thirukkural Philosophy, Justice Party & Dravidian Movement Contributions
```

---

**UNIT 7: Aptitude (15 Questions)**
- unit_code: **G1_APT_U1**
- unit_name: **Unit I: Aptitude**
- subject_name: **Aptitude & Mental Ability**
- Quota: 3 EASY + 8 MEDIUM + 4 HARD

Approved Taxonomy:
```
Macro: Advanced Aptitude
Micro: Comprehensive Quantitative Aptitude: Simplification, Percentage, HCF/LCM, Ratio, SI/CI, Area, Volume, Time & Work
```

---

**UNIT 8: Reasoning (10 Questions)**
- unit_code: **G1_APT_U2**
- unit_name: **Unit II: Reasoning**
- subject_name: **Aptitude & Mental Ability**
- Quota: 2 EASY + 5 MEDIUM + 3 HARD

Approved Taxonomy:
```
Macro: Advanced Reasoning
Micro: Logical Reasoning, Analytical Puzzles, Dice, Visual, Alpha-Numeric & Advanced Number Series
```

---

### EXAMPLE ROWS

**EASY Level Example (Unit 1):**
```csv
,,TNPSC_GROUP_1,PYQ,2024,General Studies,G1_GS_U1,Unit I: General Science,Advanced Scientific Temper & Physics,"Scientific Temper, Advanced Physics Principles & Modern Technology Applications",,EASY,Multiple Choice,Recall,54,What is the SI unit of electric current?,Ampere,Volt,Ohm,Watt,,மின்சாரத்தின் சர்வதேச அலகு என்ன?,ஆம்பியர்,வோல்ட்,ஓம்,வாட்,,A,The SI unit of electric current is Ampere (A).,மின்சாரத்தின் சர்வதேச அலகு ஆம்பியர் (A) ஆகும்.
```

**MEDIUM Level Example (Unit 4):**
```csv
,,TNPSC_GROUP_1,PYQ,2024,General Studies,G1_GS_U4,Unit IV: Indian Polity,Advanced Indian Polity & Governance,"Comprehensive Constitutional Law, Federalism, Judiciary, Administrative Ethics & Public Administration",,MEDIUM,Multiple Choice,Application,54,Which Article of the Constitution provides for judicial review?,Article 13,Article 32,Article 226,Article 368,,அரசியலமைப்பின் எந்த உறுப்பு நீதித்துறை மறுபரிசீலனை அதிகாரத்தை வழங்குகிறது?,உறுப்பு 13,உறுப்பு 32,உறுப்பு 226,உறுப்பு 368,,A,"Article 13 empowers the judiciary to declare laws inconsistent with Fundamental Rights as void, establishing judicial review.","உறுப்பு 13 அடிப்படை உரிமைகளுக்கு முரணான சட்டங்களை நீதித்துறை செல்லாததாக அறிவிக்க அதிகாரம் அளிக்கிறது."
```

**HARD Level Example (Unit 5):**
```csv
,,TNPSC_GROUP_1,PYQ,2024,General Studies,G1_GS_U5,Unit V: Indian Economy and Development Administration in Tamil Nadu,Advanced Macroeconomics & TN Development,"Comprehensive Economic Planning, Fiscal/Monetary Policy, Welfare Administration, Human Development & Governance in TN",,HARD,Multiple Choice,Analysis,54,What is the primary difference between fiscal deficit and revenue deficit?,Fiscal deficit includes capital expenditure; revenue deficit only current expenditure,Revenue deficit includes capital receipts; fiscal deficit does not,Fiscal deficit is always higher than revenue deficit,They are calculated using different base years,,நிதி பற்றாக்குறைக்கும் வருவாய் பற்றாக்குறைக்கும் உள்ள முதன்மை வேறுபாடு என்ன?,நிதி பற்றாக்குறை மூலதன செலவை உள்ளடக்கும்; வருவாய் பற்றாக்குறை நடப்பு செலவை மட்டும் உள்ளடக்கும்,வருவாய் பற்றாக்குறை மூலதன வரவுகளை உள்ளடக்கும்; நிதி பற்றாக்குறை இல்லை,நிதி பற்றாக்குறை எப்போதும் வருவாய் பற்றாக்குறையை விட அதிகம்,அவை வெவ்வேறு அடிப்படை ஆண்டுகளைக் கொண்டு கணக்கிடப்படுகின்றன,,A,"Fiscal deficit = Total expenditure - Total receipts excluding borrowings (includes both capital and revenue). Revenue deficit = Revenue expenditure - Revenue receipts (current account only).","நிதி பற்றாக்குறை = மொத்த செலவு - கடன்களைத் தவிர்த்த மொத்த வரவு (மூலதனம் மற்றும் வருவாய் இரண்டையும் உள்ளடக்கும்). வருவாய் பற்றாக்குறை = வருவாய் செலவு - வருவாய் வரவு (நடப்புக் கணக்கு மட்டும்)."
```

---

### CRITICAL CSV FORMATTING RULES

1. **No line breaks inside any field** - Each question must be on ONE row
2. **Empty fields**: Use ,, (two commas with nothing between)
3. **Commas in text**: Wrap the entire field in double quotes "like this, with comma"
4. **Tamil Unicode**: Ensure proper UTF-8 encoding
5. **Answer keys**: Only A, B, C, or D (uppercase)
6. **Leave Option E blank**: Both en_option_e and ta_option_e must be empty (,,)

---

### VALIDATION CHECKLIST

Before submitting, verify:

- [ ] Exactly 200 data rows (excluding header)
- [ ] All exam_tag values are **TNPSC_GROUP_1**
- [ ] All unit_code values start with **G1_** prefix
- [ ] Difficulty distribution: 40 EASY + 100 MEDIUM + 60 HARD
- [ ] All difficulty_level values are uppercase (EASY/MEDIUM/HARD)
- [ ] All questions have both English (en_*) and Tamil (ta_*) content
- [ ] All answer_key values are A, B, C, or D (uppercase)
- [ ] No line breaks within any CSV field
- [ ] File saved with UTF-8 encoding

---

### GROUP 1 QUESTION CHARACTERISTICS

Questions should demonstrate:

✅ **Advanced Complexity** - Multi-layered analysis required
✅ **Conceptual Integration** - Linking multiple topics/domains
✅ **Policy & Governance Focus** - Administrative perspective
✅ **Current Affairs Integration** - Recent developments (2023-2024)
✅ **Analytical Reasoning** - Beyond factual recall

---

### OUTPUT FORMAT

Generate a complete CSV file with:
1. ONE header row (29 columns)
2. 200 data rows following the exact unit breakdown above
3. UTF-8 encoding
4. Ready to download and import directly

START GENERATING NOW. Provide the complete CSV content.
```

---

## 📥 HOW TO USE THIS PROMPT

### Step 1: Generate CSV
1. Copy the entire prompt above
2. Paste into ChatGPT, Claude, or Gemini
3. Wait for the AI to generate all 200 questions
4. Download the CSV file

### Step 2: Validate CSV
Run this SQL query in your Supabase SQL Editor:

```sql
-- Validate before import
SELECT 
  unit_code,
  difficulty_level,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE exam_tag != 'TNPSC_GROUP_1') as wrong_exam_tag,
  COUNT(*) FILTER (WHERE difficulty_level NOT IN ('EASY', 'MEDIUM', 'HARD')) as wrong_case
FROM temp_import_table
GROUP BY unit_code, difficulty_level
ORDER BY unit_code, 
  CASE difficulty_level 
    WHEN 'EASY' THEN 1 
    WHEN 'MEDIUM' THEN 2 
    WHEN 'HARD' THEN 3 
  END;
```

Expected output:
```
G1_GS_U1   | EASY   | 2
G1_GS_U1   | MEDIUM | 5
G1_GS_U1   | HARD   | 3
G1_GS_U2   | EASY   | 2
G1_GS_U2   | MEDIUM | 5
G1_GS_U2   | HARD   | 3
...
(Total 24 rows: 8 units × 3 difficulty levels)
```

### Step 3: Import to Database
Use your existing CSV import functionality in Admin Dashboard

### Step 4: Generate Mock Test
The `testGeneratorService.generateGroup1Test()` will automatically:
- Pull exactly 200 questions from the imported pool
- Apply Fisher-Yates shuffling
- Assign question numbers 1-200
- Track zero-repetition across mocks
- Display in the 5-column grid (40 rows)

---

## 🎨 GRID DISPLAY BEHAVIOR

Your `QuestionNavigator.jsx` will render:

```
┌────────────────────────────────────────┐
│   Question Palette       200 Total     │
├────────────────────────────────────────┤
│  [40]     [25]      [135]              │
│ Answered  Review   Remaining           │
├────────────────────────────────────────┤
│  [1]  [2]  [3]  [4]  [5]               │ Row 1
│  [6]  [7]  [8]  [9]  [10]              │ Row 2
│  [11] [12] [13] [14] [15]              │ Row 3
│  ...                                   │
│  [196][197][198][199][200]             │ Row 40
├────────────────────────────────────────┤
│ 🟢 Answered  🟠 Marked  ⚪ Unanswered  │
└────────────────────────────────────────┘
```

**Color States:**
- 🔵 **Blue with ring** - Current question
- 🟢 **Green** - Answered (bg-emerald-600)
- 🟠 **Amber** - Marked for review (bg-amber-400)
- ⚪ **Gray** - Not answered (bg-slate-100)

**Interaction:**
- Click any number button → Jump to that question
- Scroll through 200 questions in grid
- Real-time status updates

---

## 🔧 TECHNICAL IMPLEMENTATION

Your system already has:

### Backend (testGeneratorService.js)
```javascript
// Generates 200Q with exact blueprint
await testGeneratorService.generateGroup1Test({
  userId: user.id,
  strict: true,
  allowFallback: false
})

// Returns:
{
  examType: 'TNPSC Group 1',
  totalQuestions: 200,
  questions: [/* 200 questions */],
  allocationMatrix: [/* unit quotas */],
  distribution: {
    difficulty: { easy: 40, medium: 100, hard: 60 },
    units: { G1_GS_U1: 10, G1_GS_U2: 10, ... }
  }
}
```

### Frontend (QuestionNavigator.jsx)
```jsx
<QuestionNavigator
  questions={questions}        // 200 questions
  currentIndex={currentIndex}  // 0-199
  onSelectQuestion={jumpTo}
  answers={userAnswers}
  markedForReview={markedSet}
  onSubmitExam={submitHandler}
/>
```

### Database Query (Automatic)
```sql
SELECT * FROM questions
WHERE exam_tag = 'TNPSC_GROUP_1'
  AND unit_code = 'G1_GS_U1'
  AND difficulty_level ILIKE 'EASY'
  AND papers.exam_type NOT IN ('Full Mock', 'Custom')
ORDER BY RANDOM()
LIMIT 2;
```

---

## ✅ FINAL CHECKLIST

Before launching mock test:

- [ ] 200 questions imported to database
- [ ] All unit_code values match G1_* pattern
- [ ] Difficulty distribution verified (40E/100M/60H)
- [ ] Tamil translations complete for all questions
- [ ] Answer keys validated (A/B/C/D only)
- [ ] Grid displays 40 rows × 5 columns = 200 buttons
- [ ] Navigation clicks work smoothly
- [ ] Progress tracking updates in real-time
- [ ] Zero-repetition tracking enabled

---

## 📞 SUPPORT

If you encounter issues:

1. **Missing questions in a unit**: Check unit_code spelling (case-sensitive)
2. **Wrong difficulty count**: Verify EASY/MEDIUM/HARD (all uppercase)
3. **Grid not displaying 200**: Check SQL query filters
4. **Tamil not displaying**: Ensure UTF-8 encoding in CSV

---

**Generated:** January 2025  
**Version:** 1.0  
**System:** TNPSC Mock Test Platform
