# TNPSC GROUP 4 - CSV Generation Prompt

## 🎯 COPY THIS EXACT PROMPT TO AI (ChatGPT/Claude/Gemini)

```
I need you to generate a CSV file containing TNPSC Group 4 exam questions.

### CRITICAL CSV FORMAT REQUIREMENTS

**File Encoding:** UTF-8 (required for Tamil Unicode)
**Columns:** 29 columns total
**Header Row (EXACTLY as shown):**
```
question_id,content_hash,exam_tag,source_type,year,subject_name,unit_code,unit_name,macro_topic,micro_topic,sub_topic,difficulty_level,question_type,cognitive_skill,ideal_time_seconds,en_question_text,en_option_a,en_option_b,en_option_c,en_option_d,en_option_e,ta_question_text,ta_option_a,ta_option_b,ta_option_c,ta_option_d,ta_option_e,answer_key,en_explanation,ta_explanation
```

### MANDATORY FIELD VALUES FOR GROUP 4

**Empty Fields (leave blank with,,):**
- `question_id` - Auto-generated
- `content_hash` - Auto-generated  
- `sub_topic` - Leave blank

**Fixed Values:**
- `exam_tag`: **TNPSC_GROUP_4** (EXACTLY this, no variations)
- `source_type`: **PYQ** (Previous Year Question - recommended)
- `year`: Use **2024**, **2023**, or **2026** for practice questions
- `question_type`: **Multiple Choice**
- `ideal_time_seconds`: **36**
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

### GROUP 4 APPROVED TAXONOMY - USE EXACTLY AS SHOWN

#### PART A: GENERAL STUDIES

**Unit 1: General Science**
```
unit_code: G4_GS_U1
unit_name: Unit I: General Science
subject_name: General Studies

Physics Options:
macro_topic: Physics
micro_topic: Mechanics, Force, Pressure & Energy

OR

macro_topic: Physics
micro_topic: Everyday Principles of Electricity, Magnetism, Light, Sound & Heat

OR

macro_topic: Physics
micro_topic: Nuclear Physics & Latest Inventions in Science

Chemistry Options:
macro_topic: Chemistry
micro_topic: Elements, Compounds, Acids, Bases & Salts

OR

macro_topic: Chemistry
micro_topic: Petroleum Products, Fertilizers, Pesticides & Metallurgy

OR

macro_topic: Chemistry
micro_topic: Food Adulterants & Chemical Applications

Biology Options:
macro_topic: Botany & Zoology
micro_topic: Classification of Living Organisms, Evolution & Genetics

OR

macro_topic: Botany & Zoology
micro_topic: Physiology, Nutrition, Health, Hygiene & Human Diseases

Environment:
macro_topic: Environmental Science
micro_topic: Environmental Science & Ecological Balance

Current Affairs:
macro_topic: Current Affairs
micro_topic: Current Affairs in Science & Technology
```

**Unit 2: Geography**
```
unit_code: G4_GS_U2
unit_name: Unit II: Geography
subject_name: General Studies
macro_topic: Physical Geography
micro_topic: Earth Location, Physical Features, Weather & Climate

OR

macro_topic: Physical Geography
micro_topic: Water Resources, Rivers, Soil, Minerals & Natural Resources

OR

macro_topic: Economic & Social Geography
micro_topic: Forest, Wildlife, Agriculture Pattern, Transport & Communication

OR

macro_topic: Economic & Social Geography
micro_topic: Population Density & Distribution in Tamil Nadu and India

OR

macro_topic: Disaster & Environment
micro_topic: Calamities, Disaster Management, Environment & Climate Change

OR

macro_topic: Current Affairs
micro_topic: Geographical Landmarks & Current Affairs
```

**Unit 3: History & Culture**
```
unit_code: G4_GS_U3
unit_name: Unit III: History, Culture of India, and Indian National Movement
subject_name: General Studies
macro_topic: Ancient & Medieval History
micro_topic: Indus Valley Civilization, Guptas, Delhi Sultans, Mughals & Marathas

OR

macro_topic: South Indian History
micro_topic: South Indian History & Early Uprisings

OR

macro_topic: Indian National Movement
micro_topic: Indian National Congress & Emergence of National Leaders

OR

macro_topic: Indian National Movement
micro_topic: Role of Ambedkar, Periyar, Bharathiar, V.O.C., Gandhi & Others in Freedom Struggle

OR

macro_topic: Indian Culture & Society
micro_topic: Characteristics of Indian Culture, Unity in Diversity & Secularism
```

**Unit 4: Indian Polity**
```
unit_code: G4_GS_U4
unit_name: Unit IV: Indian Polity
subject_name: General Studies
macro_topic: Constitution & Framework
micro_topic: Constitution of India, Preamble, Salient Features, Union, State & Territory

OR

macro_topic: Rights & Directives
micro_topic: Citizenship, Fundamental Rights, Fundamental Duties & DPSP

OR

macro_topic: Government Organs
micro_topic: Union & State Executive, Legislature, Judiciary & Rule of Law

OR

macro_topic: Local Governance & Federalism
micro_topic: Local Governments, Panchayat Raj & Centre-State Relationships

OR

macro_topic: Admin & Social Justice
micro_topic: Elections, Anti-Corruption Measures, Lokpal, Lokayukta, RTI & Women Empowerment

OR

macro_topic: Political Systems
micro_topic: Consumer Protection, Human Rights & Political Parties in Tamil Nadu and India
```

**Unit 5: Indian Economy & TN Development**
```
unit_code: G4_GS_U5
unit_name: Unit V: Indian Economy and Development Administration in Tamil Nadu
subject_name: General Studies
macro_topic: Indian Economy & Planning
micro_topic: Nature of Indian Economy, Five-Year Plans, Planning Commission & Niti Aayog

OR

macro_topic: Public Finance & Taxation
micro_topic: Sources of Revenue, RBI, Finance Commission & Goods and Services Tax (GST)

OR

macro_topic: Agriculture & Industry
micro_topic: Economic Trends, Employment Generation, Land Reforms & Agricultural Technology

OR

macro_topic: Social Development & Welfare
micro_topic: Rural Welfare Programmes, Poverty, Population, Education & Health Systems in Tamil Nadu

OR

macro_topic: Tamil Nadu Economy
micro_topic: Geography of Tamil Nadu, Economic Growth Impact & Government Welfare Schemes
```

**Unit 6: Tamil Nadu History & Culture**
```
unit_code: G4_GS_U6
unit_name: Unit VI: History, Culture, Heritage, and Socio-Political Movements of Tamil Nadu
subject_name: General Studies
macro_topic: Tamil Society & Archaeology
micro_topic: History of Tamil Society, Archaeological Discoveries & Sangam to Contemporary Literature

OR

macro_topic: Thirukkural Studies
micro_topic: Thirukkural: Secular Literature, Universal Values & Philosophical Content

OR

macro_topic: Tamil Nadu Freedom Struggle
micro_topic: Role of Tamil Nadu in Freedom Struggle & Women Freedom Fighters

OR

macro_topic: Social Reform Movements
micro_topic: Social Reformers, Movements & Social Transformation in Tamil Nadu
```

#### PART B: APTITUDE AND MENTAL ABILITY

**Aptitude Unit 1**
```
unit_code: G4_APT_U1
unit_name: Unit I: Aptitude
subject_name: Aptitude & Mental Ability
macro_topic: Arithmetic
micro_topic: Simplification, Percentage, HCF & LCM

OR

macro_topic: Arithmetic
micro_topic: Ratio and Proportion, Simple Interest & Compound Interest

OR

macro_topic: Commercial & Mensuration Math
micro_topic: Area, Volume, Time and Work
```

**Aptitude Unit 2**
```
unit_code: G4_APT_U2
unit_name: Unit II: Reasoning
subject_name: Aptitude & Mental Ability
macro_topic: Analytical Reasoning
micro_topic: Logical Reasoning, Puzzles, Dice & Visual Reasoning

OR

macro_topic: Verbal & Non-Verbal Reasoning
micro_topic: Alpha-Numeric Reasoning & Number Series
```

#### PART C: TAMIL ELIGIBILITY TEST (தமிழ் தகுதித் தேர்வு)

**அலகு I: இலக்கணம்**
```
unit_code: G4_TAMIL_U1
unit_name: அலகு I: இலக்கணம்
subject_name: பொதுத் தமிழ்
macro_topic: இலக்கணம் - எழுத்து
micro_topic: எழுத்து: பிரித்து எழுதுதல், சேர்த்து எழுதுதல், சந்திப்பிழை & எழுத்து வேறுபாடுகள்

OR

macro_topic: இலக்கணம் - சொல்
micro_topic: சொல்: வேர்ச்சொல் அறிதல், வினைமுற்று, வினையெச்சம், பெயரெச்சம் & பிழை திருத்தம்
```

**அலகு II: சொல்லகராதி**
```
unit_code: G4_TAMIL_U2
unit_name: அலகு II: சொல்லகராதி
subject_name: பொதுத் தமிழ்
macro_topic: சொல்லகராதி - பொருள்
micro_topic: எதிர்ச்சொல், ஓரெழுத்து ஒரு மொழி, பொருள் அறிதல் & அகர வரிசை

OR

macro_topic: சொல்லகராதி - பயன்பாடு
micro_topic: மரூஉச் சொற்கள், பேச்சு வழக்கு, பிழை திருத்தம் & பலபொருள் சொற்கள்
```

**அலகு III: எழுதும் திறன்**
```
unit_code: G4_TAMIL_U3
unit_name: அலகு III: எழுதும் திறன்
subject_name: பொதுத் தமிழ்
macro_topic: எழுதும் திறன் - வாக்கியம்
micro_topic: சொற்றொடர் அமைப்பு, செய்வினை-செயப்பாட்டு வினை & மரபுத் தமிழ்
```

**அலகு IV: கலைச் சொற்கள்**
```
unit_code: G4_TAMIL_U4
unit_name: அலகு IV: கலைச் சொற்கள்
subject_name: பொதுத் தமிழ்
macro_topic: கலைச் சொற்கள்
micro_topic: பல்துறை சார்ந்த கலைச் சொற்களுக்கு இணையான தமிழ்ச் சொற்கள்
```

**அலகு V: வாசித்தல் திறன்**
```
unit_code: G4_TAMIL_U5
unit_name: அலகு V: வாசித்தல் - புரிந்து கொள்ளும் திறன்
subject_name: பொதுத் தமிழ்
macro_topic: வாசித்தல் திறன்
micro_topic: பத்தி வினாக்கள், தலையங்கம், உவமை மற்றும் பழமொழிகள்
```

**அலகு VI: மொழிபெயர்ப்பு**
```
unit_code: G4_TAMIL_U6
unit_name: அலகு VI: எளிய மொழி பெயர்ப்பு
subject_name: பொதுத் தமிழ்
macro_topic: மொழிபெயர்ப்பு
micro_topic: ஆங்கிலச் சொற்களுக்கு இணையான தமிழ்ச் சொற்கள் மற்றும் மொழிபெயர்ப்பு
```

**அலகு VII: இலக்கியம்**
```
unit_code: G4_TAMIL_U7
unit_name: அலகு VII: இலக்கியம், தமிழ் அறிஞர்களும், தமிழ்த்தொண்டும்
subject_name: பொதுத் தமிழ்
macro_topic: இலக்கியம் - திருக்குறள்
micro_topic: திருக்குறள் 20 அதிகாரங்கள் மற்றும் மேற்கோள்கள்

OR

macro_topic: அறநூல்கள் & தமிழறிஞர்கள்
micro_topic: அறநூல்கள், திராவிட மொழிகள் மற்றும் தமிழறிஞர்களின் தொண்டு
```

#### PART C: GENERAL ENGLISH

**English Unit 1: Grammar**
```
unit_code: G4_ENGLISH_U1
unit_name: Unit I: Grammar
subject_name: General English
macro_topic: Grammar
micro_topic: Parts of Speech, Concord, Tenses, Voice & Sentence Types

OR

macro_topic: Grammar
micro_topic: Infinitives, Gerunds, Participles, Question Tags & Punctuation
```

**English Unit 2: Vocabulary**
```
unit_code: G4_ENGLISH_U2
unit_name: Unit II: Vocabulary
subject_name: General English
macro_topic: Vocabulary
micro_topic: Synonyms, Antonyms, Homonyms, Collocations & Idioms
```

**English Unit 3: Writing Skills**
```
unit_code: G4_ENGLISH_U3
unit_name: Unit III: Writing Skills
subject_name: General English
macro_topic: Writing Skills
micro_topic: Letter Writing, Jumbled Sentences & Inferences
```

**English Unit 4: Technical Terms**
```
unit_code: G4_ENGLISH_U4
unit_name: Unit IV: Technical Terms
subject_name: General English
macro_topic: Technical Terms
micro_topic: Administrative & Official Terms
```

**English Unit 5: Comprehension**
```
unit_code: G4_ENGLISH_U5
unit_name: Unit V: Reading Comprehension
subject_name: General English
macro_topic: Comprehension
micro_topic: Unseen Passages, Editorials & Fact Ascertainment
```

**English Unit 6: Translation**
```
unit_code: G4_ENGLISH_U6
unit_name: Unit VI: Translation
subject_name: General English
macro_topic: Translation
micro_topic: Word & Sentence Translation Tasks
```

**English Unit 7: Literary Works**
```
unit_code: G4_ENGLISH_U7
unit_name: Unit VII: Literary Works
subject_name: General English
macro_topic: Poetry & Prose Appreciation
micro_topic: Appreciation of Poems, Prose & Authors from School Textbooks
```

### EXAMPLE ROWS FOR GROUP 4

**EASY Level Example:**
```
,,TNPSC_GROUP_4,PYQ,2024,General Studies,G4_GS_U1,Unit I: General Science,Physics,"Mechanics, Force, Pressure & Energy",,EASY,Multiple Choice,Recall,36,What is the unit of force in the SI system?,Newton,Joule,Watt,Pascal,,எஸ்.ஐ. அமைப்பில் விசையின் அலகு என்ன?,நியூட்டன்,ஜூல்,வாட்,பாஸ்கல்,,A,The SI unit of force is Newton (N). One Newton is the force required to accelerate a 1 kg mass at 1 m/s².,விசையின் எஸ்.ஐ. அலகு நியூட்டன் (N) ஆகும். ஒரு நியூட்டன் என்பது 1 கிலோ நிறையை 1 மீ/வி² முடுக்கத்தில் செலுத்தத் தேவையான விசை.
```

**MEDIUM Level Example:**
```
,,TNPSC_GROUP_4,PYQ,2024,General Studies,G4_GS_U4,Unit IV: Indian Polity,Rights & Directives,"Citizenship, Fundamental Rights, Fundamental Duties & DPSP",,MEDIUM,Multiple Choice,Comprehension,36,Which Article abolished Untouchability?,Article 14,Article 15,Article 17,Article 19,,தீண்டாமையை ஒழித்த உறுப்பு எது?,உறுப்பு 14,உறுப்பு 15,உறுப்பு 17,உறுப்பு 19,,C,"Article 17 of the Indian Constitution abolished untouchability and forbids its practice in any form. The enforcement of any disability arising out of untouchability is a criminal offense.",இந்திய அரசியலமைப்பின் உறுப்பு 17 தீண்டாமையை ஒழித்து அதை எந்த வடிவிலும் கடைப்பிடிப்பதை தடை செய்கிறது. தீண்டாமையால் எழும் எந்த இயலாமையையும் நடைமுறைப்படுத்துவது குற்றமாகும்.
```

**HARD Level Example:**
```
,,TNPSC_GROUP_4,PYQ,2024,பொதுத் தமிழ்,G4_TAMIL_U1,அலகு I: இலக்கணம்,இலக்கணம் - சொல்,"சொல்: வேர்ச்சொல் அறிதல், வினைமுற்று, வினையெச்சம், பெயரெச்சம் & பிழை திருத்தம்",,HARD,Multiple Choice,Analysis,36,"'படித்துக்கொண்டிருந்தான்' என்ற சொல்லில் உள்ள வேர்ச்சொல் எது?",படி,படித்து,படித்துக் கொண்டு,கொண்டிருந்தான்,,"'படித்துக்கொண்டிருந்தான்' என்ற சொல்லில் உள்ள வேர்ச்சொல் எது?",படி,படித்து,படித்துக் கொண்டு,கொண்டிருந்தான்,,A,"'படித்துக்கொண்டிருந்தான்' என்ற சொல் பல இடைநிலைகளைக் கொண்டது. இதன் வேர்ச்சொல் 'படி' ஆகும். மற்றவை பகுதிகள் அல்லது இடைநிலைகள்.","'படித்துக்கொண்டிருந்தான்' என்ற சொல் பல இடைநிலைகளைக் கொண்டது. இதன் வேர்ச்சொல் 'படி' ஆகும். மற்றவை பகுதிகள் அல்லது இடைநிலைகள்."
```

**English Example:**
```
,,TNPSC_GROUP_4,PYQ,2024,General English,G4_ENGLISH_U1,Unit I: Grammar,Grammar,"Parts of Speech, Concord, Tenses, Voice & Sentence Types",,MEDIUM,Multiple Choice,Application,36,Identify the noun in the sentence: The children played in the garden.,played,children,in,garden,,வாக்கியத்தில் உள்ள பெயர்ச்சொல்லைக் கண்டறியவும்: The children played in the garden.,played,children,in,garden,,B,"Both 'children' and 'garden' are nouns, but 'children' is the subject noun (who performed the action). 'Garden' is also a noun. In this case, 'children' is the primary noun as subject.",இரண்டும் பெயர்ச்சொற்கள் தான். ஆனால் 'children' வினை செய்பவர் (கர்த்தா). இங்கு முதன்மை பெயர்ச்சொல் 'children' ஆகும்.
```

### CSV FORMAT RULES

1. **No line breaks inside fields** - Each question on ONE row
2. **Empty fields between commas** - Use ,, for blank fields  
3. **Quotes for commas in text** - If text contains comma, wrap in "quotes"
4. **Tamil Unicode required** - Save as UTF-8 encoding
5. **Leave en_option_e and ta_option_e blank** - Only use A-D

### WHAT I NEED YOU TO GENERATE

Generate **[NUMBER]** TNPSC GROUP 4 questions:
- Cover **[SPECIFY PARTS/UNITS, e.g., "Part A Units 1-6, Part B Aptitude, Part C Tamil"]**
- Difficulty: **20% EASY, 50% MEDIUM, 30% HARD**
- All questions must have:
  - Correct exam_tag: TNPSC_GROUP_4
  - Correct unit_code from G4 taxonomy above
  - Both English and Tamil text (for General Studies and Aptitude)
  - Tamil-only text for Tamil units (both question and options in Tamil)
  - English-only text for English units
  - Valid answer_key (A, B, C, or D)
  - Proper difficulty distribution per unit

Format as complete CSV with header row, ready to download.
```

## ✅ VALIDATION CHECKLIST

After receiving generated CSV:

- [ ] exam_tag is exactly **TNPSC_GROUP_4** for all rows
- [ ] unit_code starts with **G4_** prefix
- [ ] All taxonomy values match approved list above
- [ ] Difficulty distribution is 20% EASY, 50% MEDIUM, 30% HARD
- [ ] difficulty_level is uppercase (EASY/MEDIUM/HARD)
- [ ] Language questions use correct script (Tamil/English)
- [ ] General Studies questions are bilingual (English + Tamil)
- [ ] answer_key is A, B, C, or D (uppercase)
- [ ] No line breaks within CSV fields
- [ ] File saved as UTF-8 encoding

## 🎓 GROUP 4 QUESTION CHARACTERISTICS

Group 4 questions should be:
- **SSLC level complexity** - School-leaving certificate standard
- **Straightforward application** - Direct application of concepts
- **Factual recall emphasis** - More memory-based than analytical
- **Basic comprehension** - Clear and simple language
- **Foundation building** - Core concepts and fundamentals

## 📊 RECOMMENDED DISTRIBUTION

For balanced coverage (200 question example):
- **Part A: General Studies (120 questions)**
  - Unit 1 (Science): 20 questions = 4 EASY + 10 MEDIUM + 6 HARD
  - Unit 2 (Geography): 20 questions = 4 EASY + 10 MEDIUM + 6 HARD
  - Unit 3 (History): 20 questions = 4 EASY + 10 MEDIUM + 6 HARD
  - Unit 4 (Polity): 20 questions = 4 EASY + 10 MEDIUM + 6 HARD
  - Unit 5 (Economy): 20 questions = 4 EASY + 10 MEDIUM + 6 HARD
  - Unit 6 (TN): 20 questions = 4 EASY + 10 MEDIUM + 6 HARD

- **Part B: Aptitude (30 questions)**
  - Unit 1 (Arithmetic): 20 questions = 4 EASY + 10 MEDIUM + 6 HARD
  - Unit 2 (Reasoning): 10 questions = 2 EASY + 5 MEDIUM + 3 HARD

- **Part C: Language (50 questions total)**
  - **Tamil (25 questions)**: Distribute across 7 units
  - **English (25 questions)**: Distribute across 7 units

## 🚀 USAGE EXAMPLE

```
Generate 200 TNPSC GROUP 4 questions:

PART A - GENERAL STUDIES (120 questions):
- 20 from G4_GS_U1 (Science): 4 EASY + 10 MEDIUM + 6 HARD
- 20 from G4_GS_U2 (Geography): 4 EASY + 10 MEDIUM + 6 HARD
- 20 from G4_GS_U3 (History): 4 EASY + 10 MEDIUM + 6 HARD
- 20 from G4_GS_U4 (Polity): 4 EASY + 10 MEDIUM + 6 HARD
- 20 from G4_GS_U5 (Economy): 4 EASY + 10 MEDIUM + 6 HARD
- 20 from G4_GS_U6 (TN History): 4 EASY + 10 MEDIUM + 6 HARD

PART B - APTITUDE (30 questions):
- 20 from G4_APT_U1 (Arithmetic): 4 EASY + 10 MEDIUM + 6 HARD
- 10 from G4_APT_U2 (Reasoning): 2 EASY + 5 MEDIUM + 3 HARD

PART C - TAMIL (25 questions):
- 4 from G4_TAMIL_U1: 1 EASY + 2 MEDIUM + 1 HARD
- 4 from G4_TAMIL_U2: 1 EASY + 2 MEDIUM + 1 HARD
- 3 from G4_TAMIL_U3: 1 EASY + 1 MEDIUM + 1 HARD
- 3 from G4_TAMIL_U4: 1 EASY + 1 MEDIUM + 1 HARD
- 4 from G4_TAMIL_U5: 1 EASY + 2 MEDIUM + 1 HARD
- 3 from G4_TAMIL_U6: 1 EASY + 1 MEDIUM + 1 HARD
- 4 from G4_TAMIL_U7: 1 EASY + 2 MEDIUM + 1 HARD

PART C - ENGLISH (25 questions):
- 5 from G4_ENGLISH_U1: 1 EASY + 3 MEDIUM + 1 HARD
- 4 from G4_ENGLISH_U2: 1 EASY + 2 MEDIUM + 1 HARD
- 3 from G4_ENGLISH_U3: 1 EASY + 1 MEDIUM + 1 HARD
- 3 from G4_ENGLISH_U4: 1 EASY + 1 MEDIUM + 1 HARD
- 4 from G4_ENGLISH_U5: 1 EASY + 2 MEDIUM + 1 HARD
- 3 from G4_ENGLISH_U6: 1 EASY + 1 MEDIUM + 1 HARD
- 3 from G4_ENGLISH_U7: 1 EASY + 1 MEDIUM + 1 HARD

All questions PYQ source type, year 2024.
General Studies & Aptitude: bilingual (English + Tamil)
Tamil units: Tamil only
English units: English only
Format as complete CSV ready to import.
```

## 📝 IMPORTANT NOTES

- **Ideal time**: Group 4 questions should have `ideal_time_seconds: 36` (fastest among all groups)
- **Tamil questions**: For G4_TAMIL_U* units, BOTH question and all options must be in Tamil script
- **English questions**: For G4_ENGLISH_U* units, question and options in English only
- **General Studies/Aptitude**: Always bilingual (both en_* and ta_* columns filled)
- **SSLC Standard**: Questions should be at 10th standard complexity level
