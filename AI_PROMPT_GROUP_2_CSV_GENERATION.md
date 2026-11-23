# TNPSC GROUP 2 / 2A - CSV Generation Prompt

## 🎯 COPY THIS EXACT PROMPT TO AI (ChatGPT/Claude/Gemini)

```
I need you to generate a CSV file containing TNPSC Group 2 / Group 2A exam questions.

### CRITICAL CSV FORMAT REQUIREMENTS

**File Encoding:** UTF-8 (required for Tamil Unicode)
**Columns:** 29 columns total
**Header Row (EXACTLY as shown):**
```
question_id,content_hash,exam_tag,source_type,year,subject_name,unit_code,unit_name,macro_topic,micro_topic,sub_topic,difficulty_level,question_type,cognitive_skill,ideal_time_seconds,en_question_text,en_option_a,en_option_b,en_option_c,en_option_d,en_option_e,ta_question_text,ta_option_a,ta_option_b,ta_option_c,ta_option_d,ta_option_e,answer_key,en_explanation,ta_explanation
```

### MANDATORY FIELD VALUES FOR GROUP 2/2A

**Empty Fields (leave blank with,,):**
- `question_id` - Auto-generated
- `content_hash` - Auto-generated  
- `sub_topic` - Leave blank

**Fixed Values:**
- `exam_tag`: **TNPSC_GROUP_2** or **TNPSC_GROUP_2A** (use appropriate tag)
- `source_type`: **PYQ** (Previous Year Question - recommended)
- `year`: Use **2024**, **2023**, or **2026** for practice questions
- `question_type`: **Multiple Choice**
- `ideal_time_seconds`: **45**
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

### GROUP 2/2A APPROVED TAXONOMY - USE EXACTLY AS SHOWN

**Unit 1: General Science (Degree Standard)**
```
unit_code: G2_GS_U1
unit_name: Unit I: General Science
subject_name: General Studies
macro_topic: Scientific Temper & Physics
micro_topic: Scientific Knowledge, Temper, Reasoning & Universe Physics

OR

macro_topic: Chemistry & Life Science
micro_topic: Chemistry in Everyday Life, Biology, Evolution & Genetics

OR

macro_topic: Health, Ecology & Technology
micro_topic: Nutrition, Health, Diseases, Environment & Latest Inventions
```

**Unit 2: Geography of India**
```
unit_code: G2_GS_U2
unit_name: Unit II: Geography of India
subject_name: General Studies
macro_topic: Physical & Economic Geography
micro_topic: Location, Physiography, Climate, Water Resources, Soils & Minerals

OR

macro_topic: Social & Disaster Geography
micro_topic: Population Distribution, Tribes, Disaster Management, Pollution & Climate Change
```

**Unit 3: History, Culture & National Movement**
```
unit_code: G2_GS_U3
unit_name: Unit III: History, Culture of India, and Indian National Movement
subject_name: General Studies
macro_topic: Ancient & Medieval India
micro_topic: Indus Valley, Dynasties, Vijayanagaram, Bahmani & South Indian History

OR

macro_topic: Indian National Movement
micro_topic: National Renaissance, Early Uprisings, INC & Freedom Fighters

OR

macro_topic: Socio-Cultural History
micro_topic: Communalism, Partition, Secularism & Prominent Personalities
```

**Unit 4: Indian Polity**
```
unit_code: G2_GS_U4
unit_name: Unit IV: Indian Polity
subject_name: General Studies
macro_topic: Constitutional Framework
micro_topic: Preamble, Salient Features, Rights, Duties & DPSP

OR

macro_topic: Government Structure & Judiciary
micro_topic: Union/State Executive & Legislature, Local Bodies, Judiciary & Rule of Law

OR

macro_topic: Admin, Corruption & Rights
micro_topic: Anti-Corruption, Lokpal, RTI, Human Rights & Political Parties
```

**Unit 5: Indian Economy & TN Development**
```
unit_code: G2_GS_U5
unit_name: Unit V: Indian Economy and Development Administration in Tamil Nadu
subject_name: General Studies
macro_topic: Macro Economy & Policy
micro_topic: Economic Structure, Five-Year Plans, RBI Policy, Finance Commission & GST

OR

macro_topic: Development & Welfare Admin
micro_topic: Employment, Agriculture, Industry, Poverty, HDI & Social Reforms in Tamil Nadu

OR

macro_topic: Administration & Governance in TN
micro_topic: Reservation Policy, Social Justice, Health/Education Systems, e-Governance & Public Delivery
```

**Unit 6: Tamil Nadu History & Culture**
```
unit_code: G2_GS_U6
unit_name: Unit VI: History, Culture, Heritage, and Socio-Political Movements in Tamil Nadu
subject_name: General Studies
macro_topic: Tamil Society & Thirukkural
micro_topic: Tamil Society, Archaeology, Literature & Thirukkural Relevance

OR

macro_topic: Tamil Nadu Freedom Struggle
micro_topic: Role of TN in Freedom Struggle & Women Leaders

OR

macro_topic: Socio-Political Movements
micro_topic: Justice Party, Self-Respect Movement, Dravidian Movement, Periyar & Anna
```

**Aptitude Unit 1**
```
unit_code: G2_APT_U1
unit_name: Unit I: Aptitude
subject_name: Aptitude & Mental Ability
macro_topic: Arithmetic
micro_topic: Simplification, Percentage, HCF & LCM
```

**IMPORTANT - For Commercial Math Questions**:
```
unit_code: G2_APT_U1
unit_name: Unit I: Aptitude
subject_name: Aptitude & Mental Ability
macro_topic: Commercial & Advanced Math
micro_topic: Ratio & Proportion, Simple & Compound Interest, Area, Volume, Time & Work
```

**CRITICAL**: Use `&` (ampersand) NOT "and". The exact approved micro_topic is:
`Ratio & Proportion, Simple & Compound Interest, Area, Volume, Time & Work`

**Aptitude Unit 2**
```
unit_code: G2_APT_U2
unit_name: Unit II: Reasoning
subject_name: Aptitude & Mental Ability
macro_topic: Logical & Analytical Reasoning
micro_topic: Logical Reasoning, Puzzles, Dice, Visual & Alpha-Numeric Reasoning, Number Series
```

**General Tamil (SSLC Standard)**
```
unit_code: G2_TA_U1
unit_name: Part C: General Tamil
subject_name: பொதுத் தமிழ்
macro_topic: பொதுத் தமிழ்
micro_topic: இலக்கணம், சொல்லகராதி, எழுதும் திறன், கலைச்சொற்கள், வாசித்தல், மொழிபெயர்ப்பு & இலக்கியம் (SSLC Standard)
```

**General English (SSLC Standard)**
```
unit_code: G2_EN_U1
unit_name: Part C: General English
subject_name: General English
macro_topic: General English
micro_topic: Grammar, Vocabulary, Writing Skills, Technical Terms, Comprehension, Translation & Literary Works (SSLC Standard)
```

### EXAMPLE ROWS FOR GROUP 2/2A

**EASY Level Example:**
```
,,TNPSC_GROUP_2,PYQ,2024,General Studies,G2_GS_U1,Unit I: General Science,Scientific Temper & Physics,"Scientific Knowledge, Temper, Reasoning & Universe Physics",,EASY,Multiple Choice,Recall,45,Which law states that energy cannot be created or destroyed?,Law of Conservation of Energy,Newton's First Law,Law of Inertia,Kepler's Law,,ஆற்றலை உருவாக்கவோ அழிக்கவோ முடியாது என்று கூறும் விதி எது?,ஆற்றல் பாதுகாப்பு விதி,நியூட்டனின் முதல் விதி,மந்தநிலை விதி,கெப்ளரின் விதி,,A,The Law of Conservation of Energy states that energy can neither be created nor destroyed; it can only be transformed from one form to another.,ஆற்றல் பாதுகாப்பு விதி ஆற்றலை உருவாக்கவோ அழிக்கவோ முடியாது என்கிறது; அது ஒரு வடிவத்திலிருந்து மற்றொரு வடிவத்திற்கு மாற்றப்படலாம்.
```

**MEDIUM Level Example:**
```
,,TNPSC_GROUP_2,PYQ,2024,General Studies,G2_GS_U4,Unit IV: Indian Polity,Constitutional Framework,"Preamble, Salient Features, Rights, Duties & DPSP",,MEDIUM,Multiple Choice,Comprehension,45,Which part of the Indian Constitution deals with Fundamental Rights?,Part III,Part IV,Part V,Part VI,,இந்திய அரசியலமைப்பின் எந்தப் பகுதி அடிப்படை உரிமைகளைப் பற்றியது?,பகுதி III,பகுதி IV,பகுதி V,பகுதி VI,,A,Part III of the Indian Constitution (Articles 12-35) deals with Fundamental Rights guaranteed to all citizens.,இந்திய அரசியலமைப்பின் பகுதி III (உறுப்புகள் 12-35) அனைத்து குடிமக்களுக்கும் உத்தரவாதமளிக்கப்பட்ட அடிப்படை உரிமைகளைப் பற்றியது.
```

**HARD Level Example:**
```
,,TNPSC_GROUP_2,PYQ,2024,General Studies,G2_GS_U5,Unit V: Indian Economy and Development Administration in Tamil Nadu,Macro Economy & Policy,"Economic Structure, Five-Year Plans, RBI Policy, Finance Commission & GST",,HARD,Multiple Choice,Analysis,45,What is the primary objective of the Monetary Policy Committee (MPC) in India?,Maintaining price stability while keeping growth in mind,Regulating stock market,Controlling fiscal deficit,Managing foreign exchange reserves,,இந்தியாவில் பண்டக் கொள்கைக் குழுவின் (MPC) முதன்மை நோக்கம் என்ன?,வளர்ச்சியை மனதில் கொண்டு விலை நிலைத்தன்மையை பராமரித்தல்,பங்குச் சந்தையை ஒழுங்குபடுத்துதல்,நிதிப் பற்றாக்குறையை கட்டுப்படுத்துதல்,அந்நிய செலாவணி இருப்புகளை நிர்வகித்தல்,,A,"The MPC was constituted under Section 45ZB of the RBI Act, 1934. Its primary objective is to maintain price stability (targeting inflation at 4% ±2%) while keeping in mind the objective of growth.","MPC ரிசர்வ் வங்கி சட்டம் 1934-ன் பிரிவு 45ZB-ன் கீழ் அமைக்கப்பட்டது. இதன் முதன்மை நோக்கம் வளர்ச்சியின் நோக்கத்தை மனதில் கொண்டு விலை நிலைத்தன்மையை (பணவீக்கம் 4% ±2% இலக்காக) பராமரிப்பதாகும்."
```

### CSV FORMAT RULES

1. **No line breaks inside fields** - Each question on ONE row
2. **Empty fields between commas** - Use ,, for blank fields  
3. **Quotes for commas in text** - If text contains comma, wrap in "quotes"
4. **Tamil Unicode required** - Save as UTF-8 encoding
5. **Leave en_option_e and ta_option_e blank** - Only use A-D

### WHAT I NEED YOU TO GENERATE

Generate **[NUMBER]** TNPSC GROUP 2/2A questions:
- Cover **[SPECIFY UNITS, e.g., "Units 1-6, Aptitude, Language"]**
- Difficulty: **20% EASY, 50% MEDIUM, 30% HARD**
- All questions must have:
  - Correct exam_tag: TNPSC_GROUP_2 or TNPSC_GROUP_2A
  - Correct unit_code from G2 taxonomy above
  - Both English and Tamil text
  - Valid answer_key (A, B, C, or D)
  - Proper difficulty distribution per unit

Format as complete CSV with header row, ready to download.
```

## ✅ VALIDATION CHECKLIST

After receiving generated CSV:

- [ ] exam_tag is exactly **TNPSC_GROUP_2** or **TNPSC_GROUP_2A** for all rows
- [ ] unit_code starts with **G2_** prefix
- [ ] All taxonomy values match approved list above
- [ ] Difficulty distribution is 20% EASY, 50% MEDIUM, 30% HARD
- [ ] difficulty_level is uppercase (EASY/MEDIUM/HARD)
- [ ] Both English (en_*) and Tamil (ta_*) columns filled
- [ ] answer_key is A, B, C, or D (uppercase)
- [ ] No line breaks within CSV fields
- [ ] File saved as UTF-8 encoding

## 🎓 GROUP 2/2A QUESTION CHARACTERISTICS

Group 2/2A questions should be:
- **Degree-level complexity** - Requires conceptual understanding
- **Application-oriented** - Practical knowledge application
- **Administrative context** - Focus on governance & public service
- **Current affairs awareness** - Recent developments in polity/economy
- **Analytical thinking** - Not just memory-based

## 📊 RECOMMENDED DISTRIBUTION PER UNIT

For balanced coverage:
- **25 questions/unit** = 5 EASY + 12 MEDIUM + 8 HARD
- **20 questions/unit** = 4 EASY + 10 MEDIUM + 6 HARD  
- **15 questions/unit** = 3 EASY + 8 MEDIUM + 4 HARD
- **10 questions/unit** = 2 EASY + 5 MEDIUM + 3 HARD

## 🚀 USAGE EXAMPLE

```
Generate 150 TNPSC GROUP 2 questions:
- 20 questions from Unit 1 (G2_GS_U1): 4 EASY + 10 MEDIUM + 6 HARD
- 15 questions from Unit 2 (G2_GS_U2): 3 EASY + 8 MEDIUM + 4 HARD
- 25 questions from Unit 3 (G2_GS_U3): 5 EASY + 12 MEDIUM + 8 HARD
- 25 questions from Unit 4 (G2_GS_U4): 5 EASY + 12 MEDIUM + 8 HARD
- 25 questions from Unit 5 (G2_GS_U5): 5 EASY + 12 MEDIUM + 8 HARD
- 20 questions from Unit 6 (G2_GS_U6): 4 EASY + 10 MEDIUM + 6 HARD
- 10 questions from Aptitude (G2_APT_U1/U2): 2 EASY + 5 MEDIUM + 3 HARD
- 10 questions from Language (G2_TA_U1 or G2_EN_U1): 2 EASY + 5 MEDIUM + 3 HARD

All questions PYQ source type, year 2024, bilingual (English + Tamil).
Format as complete CSV ready to import.
```

## 📝 NOTES

- **Group 2 vs 2A**: Use TNPSC_GROUP_2 for general Group 2 questions. Use TNPSC_GROUP_2A when specifically targeting Group 2A syllabus variations.
- **Ideal time**: Group 2/2A questions should have `ideal_time_seconds: 45` (slightly faster than Group 1's 54 seconds)
- **Language questions**: Tamil questions must be in Tamil script; English questions in English
- **Degree standard**: Questions should be at undergraduate level complexity
