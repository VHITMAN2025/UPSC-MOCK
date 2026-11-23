# TNPSC GROUP 1 - CSV Generation Prompt

## 🎯 COPY THIS EXACT PROMPT TO AI (ChatGPT/Claude/Gemini)

```
I need you to generate a CSV file containing TNPSC Group 1 exam questions.

### CRITICAL CSV FORMAT REQUIREMENTS

**File Encoding:** UTF-8 (required for Tamil Unicode)
**Columns:** 29 columns total
**Header Row (EXACTLY as shown):**
```
question_id,content_hash,exam_tag,source_type,year,subject_name,unit_code,unit_name,macro_topic,micro_topic,sub_topic,difficulty_level,question_type,cognitive_skill,ideal_time_seconds,en_question_text,en_option_a,en_option_b,en_option_c,en_option_d,en_option_e,ta_question_text,ta_option_a,ta_option_b,ta_option_c,ta_option_d,ta_option_e,answer_key,en_explanation,ta_explanation
```

### MANDATORY FIELD VALUES FOR GROUP 1

**Empty Fields (leave blank with,,):**
- `question_id` - Auto-generated
- `content_hash` - Auto-generated  
- `sub_topic` - Leave blank

**Fixed Values:**
- `exam_tag`: **TNPSC_GROUP_1** (EXACTLY this, no variations)
- `source_type`: **PYQ** (Previous Year Question - recommended)
- `year`: Use **2024**, **2023**, or **2026** for practice questions
- `question_type`: **Multiple Choice**
- `ideal_time_seconds`: **54**
- `answer_key`: **A**, **B**, **C**, or **D** (uppercase only)

**Difficulty Distribution (CRITICAL - MUST FOLLOW):**
- **20% EASY** - Basic recall questions
- **50% MEDIUM** - Standard application questions  
- **30% HARD** - Advanced analysis questions

**Use ONLY:** `EASY`, `MEDIUM`, `HARD` (all uppercase)

**Example:** 10 questions = 2 EASY + 5 MEDIUM + 3 HARD

**Cognitive Skills:**
- `Recall` - Memory-based (pair with EASY)
- `Comprehension` - Understanding-based (pair with MEDIUM)
- `Application` - Concept application (pair with MEDIUM)
- `Analysis` - Higher-order thinking (pair with HARD)

### GROUP 1 APPROVED TAXONOMY - USE EXACTLY AS SHOWN

**Unit 1: General Science (Advanced)**
```
unit_code: G1_GS_U1
unit_name: Unit I: General Science
subject_name: General Studies
macro_topic: Advanced Scientific Temper & Physics
micro_topic: Scientific Temper, Advanced Physics Principles & Modern Technology Applications

OR

macro_topic: Advanced Life Science & Ecology
micro_topic: Advanced Molecular Biology, Genetics, Physiology, Human Diseases & Ecology
```

**Unit 2: Geography (Comprehensive)**
```
unit_code: G1_GS_U2
unit_name: Unit II: Geography of India
subject_name: General Studies
macro_topic: Comprehensive India & World Geography
micro_topic: Advanced Physical, Economic, Social Geography, Geopolitics & Disaster Management
```

**Unit 3: History & Culture (Deep)**
```
unit_code: G1_GS_U3
unit_name: Unit III: History, Culture of India, and Indian National Movement
subject_name: General Studies
macro_topic: Deep Indian History & Culture
micro_topic: Comprehensive Ancient, Medieval, Modern History, Cultural Heritage & Personalities

OR

macro_topic: National Movement & Current Dynamics
micro_topic: Indian National Movement, Satyagraha, Militant Movements, Books, Authors & Sports
```

**Unit 4: Indian Polity (Advanced)**
```
unit_code: G1_GS_U4
unit_name: Unit IV: Indian Polity
subject_name: General Studies
macro_topic: Advanced Indian Polity & Governance
micro_topic: Comprehensive Constitutional Law, Federalism, Judiciary, Administrative Ethics & Public Administration
```

**Unit 5: Indian Economy (Advanced)**
```
unit_code: G1_GS_U5
unit_name: Unit V: Indian Economy and Development Administration in Tamil Nadu
subject_name: General Studies
macro_topic: Advanced Macroeconomics & TN Development
micro_topic: Comprehensive Economic Planning, Fiscal/Monetary Policy, Welfare Administration, Human Development & Governance in TN
```

**Unit 6: Tamil Nadu (Advanced)**
```
unit_code: G1_GS_U6
unit_name: Unit VI: History, Culture, Heritage, and Socio-Political Movements in Tamil Nadu
subject_name: General Studies
macro_topic: Advanced Tamil Heritage & Movements
micro_topic: In-depth Tamil Society, Archaeological Heritage, Thirukkural Philosophy, Justice Party & Dravidian Movement Contributions
```

**Aptitude Unit 1 (Advanced)**
```
unit_code: G1_APT_U1
unit_name: Unit I: Aptitude
subject_name: Aptitude & Mental Ability
macro_topic: Advanced Aptitude
micro_topic: Comprehensive Quantitative Aptitude: Simplification, Percentage, HCF/LCM, Ratio, SI/CI, Area, Volume, Time & Work
```

**Aptitude Unit 2 (Advanced)**
```
unit_code: G1_APT_U2
unit_name: Unit II: Reasoning
subject_name: Aptitude & Mental Ability
macro_topic: Advanced Reasoning
micro_topic: Logical Reasoning, Analytical Puzzles, Dice, Visual, Alpha-Numeric & Advanced Number Series
```

### EXAMPLE ROWS FOR GROUP 1

**EASY Level Example:**
```
,,TNPSC_GROUP_1,PYQ,2024,General Studies,G1_GS_U1,Unit I: General Science,Advanced Scientific Temper & Physics,"Scientific Temper, Advanced Physics Principles & Modern Technology Applications",,EASY,Multiple Choice,Recall,54,What is the SI unit of electric current?,Ampere,Volt,Ohm,Watt,,மின்சாரத்தின் சர்வதேச அலகு என்ன?,ஆம்பியர்,வோல்ட்,ஓம்,வாட்,,A,The SI unit of electric current is Ampere (A).,மின்சாரத்தின் சர்வதேச அலகு ஆம்பியர் (A) ஆகும்.
```

**MEDIUM Level Example:**
```
,,TNPSC_GROUP_1,PYQ,2024,General Studies,G1_GS_U4,Unit IV: Indian Polity,Advanced Indian Polity & Governance,"Comprehensive Constitutional Law, Federalism, Judiciary, Administrative Ethics & Public Administration",,MEDIUM,Multiple Choice,Application,54,Which Article of the Constitution provides for judicial review?,Article 13,Article 32,Article 226,Article 368,,அரசியலமைப்பின் எந்த உறுப்பு நீதித்துறை மறுபரிசீலனை அதிகாரத்தை வழங்குகிறது?,உறுப்பு 13,உறுப்பு 32,உறுப்பு 226,உறுப்பு 368,,A,"Article 13 empowers the judiciary to declare laws inconsistent with Fundamental Rights as void, establishing judicial review.","உறுப்பு 13 அடிப்படை உரிமைகளுக்கு முரணான சட்டங்களை நீதித்துறை செல்லாததாக அறிவிக்க அதிகாரம் அளிக்கிறது."
```

**HARD Level Example:**
```
,,TNPSC_GROUP_1,PYQ,2024,General Studies,G1_GS_U5,Unit V: Indian Economy and Development Administration in Tamil Nadu,Advanced Macroeconomics & TN Development,"Comprehensive Economic Planning, Fiscal/Monetary Policy, Welfare Administration, Human Development & Governance in TN",,HARD,Multiple Choice,Analysis,54,What is the primary difference between fiscal deficit and revenue deficit?,Fiscal deficit includes capital expenditure; revenue deficit only current expenditure,Revenue deficit includes capital receipts; fiscal deficit does not,Fiscal deficit is always higher than revenue deficit,They are calculated using different base years,,நிதி பற்றாக்குறைக்கும் வருவாய் பற்றாக்குறைக்கும் உள்ள முதன்மை வேறுபாடு என்ன?,நிதி பற்றாக்குறை மூலதன செலவை உள்ளடக்கும்; வருவாய் பற்றாக்குறை நடப்பு செலவை மட்டும் உள்ளடக்கும்,வருவாய் பற்றாக்குறை மூலதன வரவுகளை உள்ளடக்கும்; நிதி பற்றாக்குறை இல்லை,நிதி பற்றாக்குறை எப்போதும் வருவாய் பற்றாக்குறையை விட அதிகம்,அவை வெவ்வேறு அடிப்படை ஆண்டுகளைக் கொண்டு கணக்கிடப்படுகின்றன,,A,"Fiscal deficit = Total expenditure - Total receipts excluding borrowings (includes both capital and revenue). Revenue deficit = Revenue expenditure - Revenue receipts (current account only).","நிதி பற்றாக்குறை = மொத்த செலவு - கடன்களைத் தவிர்த்த மொத்த வரவு (மூலதனம் மற்றும் வருவாய் இரண்டையும் உள்ளடக்கும்). வருவாய் பற்றாக்குறை = வருவாய் செலவு - வருவாய் வரவு (நடப்புக் கணக்கு மட்டும்)."
```

### CSV FORMAT RULES

1. **No line breaks inside fields** - Each question on ONE row
2. **Empty fields between commas** - Use ,, for blank fields  
3. **Quotes for commas in text** - If text contains comma, wrap in "quotes"
4. **Tamil Unicode required** - Save as UTF-8 encoding
5. **Leave en_option_e and ta_option_e blank** - Only use A-D

### WHAT I NEED YOU TO GENERATE

Generate **[NUMBER]** TNPSC GROUP 1 questions:
- Cover **[SPECIFY UNITS, e.g., "Units 1-6"]**
- Difficulty: **20% EASY, 50% MEDIUM, 30% HARD**
- All questions must have:
  - Correct exam_tag: TNPSC_GROUP_1
  - Correct unit_code from G1 taxonomy above
  - Both English and Tamil text
  - Valid answer_key (A, B, C, or D)
  - Proper difficulty distribution per unit

Format as complete CSV with header row, ready to download.
```

## ✅ VALIDATION CHECKLIST

After receiving generated CSV:

- [ ] exam_tag is exactly **TNPSC_GROUP_1** for all rows
- [ ] unit_code starts with **G1_** prefix
- [ ] All taxonomy values match approved list above
- [ ] Difficulty distribution is 20% EASY, 50% MEDIUM, 30% HARD
- [ ] difficulty_level is uppercase (EASY/MEDIUM/HARD)
- [ ] Both English (en_*) and Tamil (ta_*) columns filled
- [ ] answer_key is A, B, C, or D (uppercase)
- [ ] No line breaks within CSV fields
- [ ] File saved as UTF-8 encoding

## 🎓 GROUP 1 QUESTION CHARACTERISTICS

Group 1 questions should be:
- **Advanced complexity** - Deeper analysis required
- **Multi-concept integration** - Connecting multiple topics
- **Policy & governance focus** - Administrative perspective
- **Current affairs integration** - Recent developments
- **Analytical reasoning** - Not just factual recall

## 📊 RECOMMENDED DISTRIBUTION PER UNIT

For balanced coverage:
- **25 questions/unit** = 5 EASY + 12 MEDIUM + 8 HARD
- **20 questions/unit** = 4 EASY + 10 MEDIUM + 6 HARD  
- **15 questions/unit** = 3 EASY + 8 MEDIUM + 4 HARD
- **10 questions/unit** = 2 EASY + 5 MEDIUM + 3 HARD

## 🚀 USAGE EXAMPLE

```
Generate 100 TNPSC GROUP 1 questions:
- 15 questions from Unit 1 (G1_GS_U1): 3 EASY + 8 MEDIUM + 4 HARD
- 15 questions from Unit 2 (G1_GS_U2): 3 EASY + 8 MEDIUM + 4 HARD
- 20 questions from Unit 3 (G1_GS_U3): 4 EASY + 10 MEDIUM + 6 HARD
- 20 questions from Unit 4 (G1_GS_U4): 4 EASY + 10 MEDIUM + 6 HARD
- 15 questions from Unit 5 (G1_GS_U5): 3 EASY + 7 MEDIUM + 5 HARD
- 10 questions from Unit 6 (G1_GS_U6): 2 EASY + 5 MEDIUM + 3 HARD
- 5 questions from Aptitude (G1_APT_U1/U2): 1 EASY + 2 MEDIUM + 2 HARD

All questions PYQ source type, year 2024, bilingual (English + Tamil).
Format as complete CSV ready to import.
```
