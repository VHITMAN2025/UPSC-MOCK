# COMPLETE TAXONOMY VALIDATION REFERENCE
## For CSV Import, Database Insertion & Row Validation

**Last Updated:** Based on taxonomyV2.js, validation SQL, and working CSV samples  
**Purpose:** Single source of truth for all taxonomy validation logic

---

## 📋 TABLE OF CONTENTS

1. [Validation Rules](#validation-rules)
2. [TNPSC Group 4 - Complete Taxonomy](#tnpsc-group-4)
3. [TNPSC Group 2 - Complete Taxonomy](#tnpsc-group-2)
4. [TNPSC Group 1 - Complete Taxonomy](#tnpsc-group-1)
5. [CSV Import Format](#csv-import-format)
6. [Database Validation Logic](#database-validation-logic)
7. [Common Errors & Solutions](#common-errors--solutions)

---

## 🔒 VALIDATION RULES

### Critical Requirements for ALL Questions:

| Field | Requirement | Valid Values |
|-------|-------------|--------------|
| **exam_tag** | REQUIRED | `TNPSC_GROUP_1`, `TNPSC_GROUP_2`, `TNPSC_GROUP_4` |
| **unit_code** | REQUIRED | Must match taxonomy (e.g., `G4_GS_U1`) |
| **unit_name** | REQUIRED | Must match taxonomy exactly |
| **macro_topic** | REQUIRED | Must match taxonomy exactly (case-sensitive) |
| **micro_topic** | REQUIRED | Must match taxonomy exactly (case-sensitive) |
| **difficulty_level** | Optional | `EASY`, `MEDIUM`, `HARD` (uppercase only) |
| **answer_key** | REQUIRED | `A`, `B`, `C`, or `D` |
| **source_type** | REQUIRED | `PYQ` or `VINA` |

### Validation Logic:
```
✓ All three fields (unit_code, macro_topic, micro_topic) must exist as a combination in taxonomyV2.js
✓ Exact string match (case-sensitive, whitespace-sensitive)
✓ No NULL or empty values allowed
✓ Database trigger auto-populates unit_code from unit_name if missing
✓ Difficulty level auto-converted to uppercase
```

---

## 📚 TNPSC GROUP 4

### Subject: General Studies

#### G4_GS_U1 - Unit I: General Science

| Macro Topic | Micro Topics (Exact Match Required) |
|-------------|--------------------------------------|
| **Physics** | • Mechanics, Force, Pressure & Energy<br>• Everyday Principles of Electricity, Magnetism, Light, Sound & Heat<br>• Nuclear Physics & Latest Inventions in Science |
| **Chemistry** | • Elements, Compounds, Acids, Bases & Salts<br>• Petroleum Products, Fertilizers, Pesticides & Metallurgy<br>• Food Adulterants & Chemical Applications |
| **Botany & Zoology** | • Classification of Living Organisms, Evolution & Genetics<br>• Physiology, Nutrition, Health, Hygiene & Human Diseases |
| **Environmental Science** | • Environmental Science & Ecological Balance |
| **Current Affairs** | • Current Affairs in Science & Technology |

**Example Valid Row:**
```csv
exam_tag,unit_code,unit_name,macro_topic,micro_topic
TNPSC_GROUP_4,G4_GS_U1,"Unit I: General Science",Physics,"Mechanics, Force, Pressure & Energy"
```

---

#### G4_GS_U2 - Unit II: Geography of India

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Physical Geography** | • Earth Location, Physical Features, Weather & Climate<br>• Water Resources, Rivers, Soil, Minerals & Natural Resources |
| **Economic & Social Geography** | • Forest, Wildlife, Agriculture Pattern, Transport & Communication<br>• Population Density & Distribution in Tamil Nadu and India |
| **Disaster & Environment** | • Calamities, Disaster Management, Environment & Climate Change |
| **Current Affairs** | • Geographical Landmarks & Current Affairs |

**Example Valid Row:**
```csv
TNPSC_GROUP_4,G4_GS_U2,"Unit II: Geography of India","Physical Geography","Earth Location, Physical Features, Weather & Climate"
```

---

#### G4_GS_U3 - Unit III: History, Culture of India, and Indian National Movement

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Ancient & Medieval History** | • Indus Valley Civilization, Guptas, Delhi Sultans, Mughals & Marathas |
| **South Indian History** | • South Indian History & Early Uprisings |
| **Indian National Movement** | • Indian National Congress & Emergence of National Leaders<br>• Role of Ambedkar, Periyar, Bharathiar, V.O.C., Gandhi & Others in Freedom Struggle |
| **Indian Culture & Society** | • Characteristics of Indian Culture, Unity in Diversity & Secularism |

---

#### G4_GS_U4 - Unit IV: Indian Polity

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Constitution & Framework** | • Constitution of India, Preamble, Salient Features, Union, State & Territory |
| **Rights & Directives** | • Citizenship, Fundamental Rights, Fundamental Duties & DPSP |
| **Government Organs** | • Union & State Executive, Legislature, Judiciary & Rule of Law |
| **Local Governance & Federalism** | • Local Governments, Panchayat Raj & Centre-State Relationships |
| **Admin & Social Justice** | • Elections, Anti-Corruption Measures, Lokpal, Lokayukta, RTI & Women Empowerment |
| **Political Systems** | • Consumer Protection, Human Rights & Political Parties in Tamil Nadu and India |

---

#### G4_GS_U5 - Unit V: Indian Economy and Development Administration in Tamil Nadu

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Indian Economy & Planning** | • Nature of Indian Economy, Five-Year Plans, Planning Commission & Niti Aayog |
| **Public Finance & Taxation** | • Sources of Revenue, RBI, Finance Commission & Goods and Services Tax (GST) |
| **Agriculture & Industry** | • Economic Trends, Employment Generation, Land Reforms & Agricultural Technology |
| **Social Development & Welfare** | • Rural Welfare Programmes, Poverty, Population, Education & Health Systems in Tamil Nadu |
| **Tamil Nadu Economy** | • Geography of Tamil Nadu, Economic Growth Impact & Government Welfare Schemes |

---

#### G4_GS_U6 - Unit VI: History, Culture, Heritage, and Socio-Political Movements of Tamil Nadu

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Tamil Society & Archaeology** | • History of Tamil Society, Archaeological Discoveries & Sangam to Contemporary Literature |
| **Thirukkural Studies** | • Thirukkural: Secular Literature, Universal Values & Philosophical Content |
| **Tamil Nadu Freedom Struggle** | • Role of Tamil Nadu in Freedom Struggle & Women Freedom Fighters |
| **Social Reform Movements** | • Social Reformers, Movements & Social Transformation in Tamil Nadu |

---

### Subject: Aptitude & Mental Ability

#### G4_APT_U1 - Unit I: Aptitude

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Arithmetic** | • Simplification, Percentage, HCF & LCM<br>• Ratio and Proportion, Simple Interest & Compound Interest |
| **Commercial & Mensuration Math** | • Area, Volume, Time and Work |

**Example Valid Row:**
```csv
TNPSC_GROUP_4,G4_APT_U1,"Unit I: Aptitude",Arithmetic,"Simplification, Percentage, HCF & LCM"
```

---

#### G4_APT_U2 - Unit II: Reasoning

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Analytical Reasoning** | • Logical Reasoning, Puzzles, Dice & Visual Reasoning |
| **Verbal & Non-Verbal Reasoning** | • Alpha-Numeric Reasoning & Number Series |

---

### Subject: General Tamil

#### G4_TA_U1 - அலகு I: இலக்கணம்

| Macro Topic | Micro Topics |
|-------------|--------------|
| **இலக்கணம் - எழுத்து** | • எழுத்து: பிரித்து எழுதுதல், சேர்த்து எழுதுதல், சந்திப்பிழை & எழுத்து வேறுபாடுகள் |
| **இலக்கணம் - சொல்** | • சொல்: வேர்ச்சொல் அறிதல், வினைமுற்று, வினையெச்சம், பெயரெச்சம் & பிழை திருத்தம் |

#### G4_TA_U2 - அலகு II: சொல்லகராதி

| Macro Topic | Micro Topics |
|-------------|--------------|
| **சொல்லகராதி - பொருள்** | • எதிர்ச்சொல், ஓரெழுத்து ஒரு மொழி, பொருள் அறிதல் & அகர வரிசை |
| **சொல்லகராதி - பயன்பாடு** | • மரூஉச் சொற்கள், பேச்சு வழக்கு, பிழை திருத்தம் & பலபொருள் சொற்கள் |

#### G4_TA_U3 - அலகு III: எழுதும் திறன்

| Macro Topic | Micro Topics |
|-------------|--------------|
| **எழுதும் திறன் - வாக்கியம்** | • சொற்றொடர் அமைப்பு, செய்வினை-செயப்பாட்டு வினை & மரபுத் தமிழ் |

#### G4_TA_U4 - அலகு IV: கலைச் சொற்கள்

| Macro Topic | Micro Topics |
|-------------|--------------|
| **கலைச் சொற்கள்** | • பல்துறை சார்ந்த கலைச் சொற்களுக்கு இணையான தமிழ்ச் சொற்கள் |

#### G4_TA_U5 - அலகு V: வாசித்தல் - புரிந்து கொள்ளும் திறன்

| Macro Topic | Micro Topics |
|-------------|--------------|
| **வாசித்தல் திறன்** | • பத்தி வினாக்கள், தலையங்கம், உவமை மற்றும் பழமொழிகள் |

#### G4_TA_U6 - அலகு VI: எளிய மொழி பெயர்ப்பு

| Macro Topic | Micro Topics |
|-------------|--------------|
| **மொழிபெயர்ப்பு** | • ஆங்கிலச் சொற்களுக்கு இணையான தமிழ்ச் சொற்கள் மற்றும் மொழிபெயர்ப்பு |

#### G4_TA_U7 - அலகு VII: இலக்கியம், தமிழ் அறிஞர்களும், தமிழ்த்தொண்டும்

| Macro Topic | Micro Topics |
|-------------|--------------|
| **இலக்கியம் - திருக்குறள்** | • திருக்குறள் 20 அதிகாரங்கள் மற்றும் மேற்கோள்கள் |
| **அறநூல்கள் & தமிழறிஞர்கள்** | • அறநூல்கள், திராவிட மொழிகள் மற்றும் தமிழறிஞர்களின் தொண்டு |

---

### Subject: General English

#### G4_EN_U1 - Unit I: Grammar

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Grammar** | • Parts of Speech, Concord, Tenses, Voice & Sentence Types<br>• Infinitives, Gerunds, Participles, Question Tags & Punctuation |

#### G4_EN_U2 - Unit II: Vocabulary

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Vocabulary** | • Synonyms, Antonyms, Homonyms, Collocations & Idioms |

#### G4_EN_U3 - Unit III: Writing Skills

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Writing Skills** | • Letter Writing, Jumbled Sentences & Inferences |

#### G4_EN_U4 - Unit IV: Technical Terms

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Technical Terms** | • Administrative & Official Terms |

#### G4_EN_U5 - Unit V: Reading Comprehension

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Comprehension** | • Unseen Passages, Editorials & Fact Ascertainment |

#### G4_EN_U6 - Unit VI: Translation

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Translation** | • Word & Sentence Translation Tasks |

#### G4_EN_U7 - Unit VII: Literary Works

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Poetry & Prose Appreciation** | • Appreciation of Poems, Prose & Authors from School Textbooks |

---

## 📚 TNPSC GROUP 2

### Subject: General Studies

#### G2_GS_U1 - Unit I: General Science

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Scientific Temper & Physics** | • Scientific Knowledge, Temper, Reasoning & Universe Physics |
| **Chemistry & Life Science** | • Chemistry in Everyday Life, Biology, Evolution & Genetics |
| **Health, Ecology & Technology** | • Nutrition, Health, Diseases, Environment & Latest Inventions |

#### G2_GS_U2 - Unit II: Geography of India

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Physical & Economic Geography** | • Location, Physiography, Climate, Water Resources, Soils & Minerals |
| **Social & Disaster Geography** | • Population Distribution, Tribes, Disaster Management, Pollution & Climate Change |

#### G2_GS_U3 - Unit III: History, Culture of India, and Indian National Movement

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Ancient & Medieval India** | • Indus Valley, Dynasties, Vijayanagaram, Bahmani & South Indian History |
| **Indian National Movement** | • National Renaissance, Early Uprisings, INC & Freedom Fighters |
| **Socio-Cultural History** | • Communalism, Partition, Secularism & Prominent Personalities |

#### G2_GS_U4 - Unit IV: Indian Polity

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Constitutional Framework** | • Preamble, Salient Features, Rights, Duties & DPSP |
| **Government Structure & Judiciary** | • Union/State Executive & Legislature, Local Bodies, Judiciary & Rule of Law |
| **Admin, Corruption & Rights** | • Anti-Corruption, Lokpal, RTI, Human Rights & Political Parties |

#### G2_GS_U5 - Unit V: Indian Economy and Development Administration in Tamil Nadu

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Macro Economy & Policy** | • Economic Structure, Five-Year Plans, RBI Policy, Finance Commission & GST |
| **Development & Welfare Admin** | • Employment, Agriculture, Industry, Poverty, HDI & Social Reforms in Tamil Nadu |
| **Administration & Governance in TN** | • Reservation Policy, Social Justice, Health/Education Systems, e-Governance & Public Delivery |

#### G2_GS_U6 - Unit VI: History, Culture, Heritage, and Socio-Political Movements in Tamil Nadu

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Tamil Society & Thirukkural** | • Tamil Society, Archaeology, Literature & Thirukkural Relevance |
| **Tamil Nadu Freedom Struggle** | • Role of TN in Freedom Struggle & Women Leaders |
| **Socio-Political Movements** | • Justice Party, Self-Respect Movement, Dravidian Movement, Periyar & Anna |

### Subject: Aptitude & Mental Ability

#### G2_APT_U1 - Unit I: Aptitude

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Arithmetic** | • Simplification, Percentage, HCF & LCM |
| **Commercial & Advanced Math** | • Ratio & Proportion, Simple & Compound Interest, Area, Volume, Time & Work |

#### G2_APT_U2 - Unit II: Reasoning

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Logical & Analytical Reasoning** | • Logical Reasoning, Puzzles, Dice, Visual & Alpha-Numeric Reasoning, Number Series |

### Subject: General Tamil (Combined Units)

#### G2_TA_U1 - அலகு I முதல் VII: பொதுத் தமிழ்

| Macro Topic | Micro Topics |
|-------------|--------------|
| **பொதுத் தமிழ்** | • இலக்கணம், சொல்லகராதி, எழுதும் திறன், கலைச்சொற்கள், வாசித்தல், மொழிபெயர்ப்பு & இலக்கியம் (SSLC Standard) |

### Subject: General English (Combined Units)

#### G2_EN_U1 - Unit I to VII: General English

| Macro Topic | Micro Topics |
|-------------|--------------|
| **General English** | • Grammar, Vocabulary, Writing Skills, Technical Terms, Comprehension, Translation & Literary Works (SSLC Standard) |

---

## 📚 TNPSC GROUP 1

### Subject: General Studies

#### G1_GS_U1 - Unit I: General Science

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Advanced Scientific Temper & Physics** | • Scientific Temper, Advanced Physics Principles & Modern Technology Applications |
| **Advanced Life Science & Ecology** | • Advanced Molecular Biology, Genetics, Physiology, Human Diseases & Ecology |

#### G1_GS_U2 - Unit II: Geography of India

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Comprehensive India & World Geography** | • Advanced Physical, Economic, Social Geography, Geopolitics & Disaster Management |

#### G1_GS_U3 - Unit III: History, Culture of India, and Indian National Movement

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Deep Indian History & Culture** | • Comprehensive Ancient, Medieval, Modern History, Cultural Heritage & Personalities |
| **National Movement & Current Dynamics** | • Indian National Movement, Satyagraha, Militant Movements, Books, Authors & Sports |

#### G1_GS_U4 - Unit IV: Indian Polity

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Advanced Indian Polity & Governance** | • Comprehensive Constitutional Law, Federalism, Judiciary, Administrative Ethics & Public Administration |

#### G1_GS_U5 - Unit V: Indian Economy and Development Administration in Tamil Nadu

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Advanced Macroeconomics & TN Development** | • Comprehensive Economic Planning, Fiscal/Monetary Policy, Welfare Administration, Human Development & Governance in TN |

#### G1_GS_U6 - Unit VI: History, Culture, Heritage, and Socio-Political Movements in Tamil Nadu

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Advanced Tamil Heritage & Movements** | • In-depth Tamil Society, Archaeological Heritage, Thirukkural Philosophy, Justice Party & Dravidian Movement Contributions |

### Subject: Aptitude & Mental Ability

#### G1_APT_U1 - Unit I: Aptitude

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Advanced Aptitude** | • Comprehensive Quantitative Aptitude: Simplification, Percentage, HCF/LCM, Ratio, SI/CI, Area, Volume, Time & Work |

#### G1_APT_U2 - Unit II: Reasoning

| Macro Topic | Micro Topics |
|-------------|--------------|
| **Advanced Reasoning** | • Logical Reasoning, Analytical Puzzles, Dice, Visual, Alpha-Numeric & Advanced Number Series |

---

## 📝 CSV IMPORT FORMAT

### Required Column Order (29 columns):

```
1.  question_id
2.  content_hash
3.  exam_tag
4.  source_type
5.  year
6.  subject_name
7.  unit_code
8.  unit_name
9.  macro_topic
10. micro_topic
11. sub_topic
12. difficulty_level
13. question_type
14. cognitive_skill
15. ideal_time_seconds
16. en_question_text
17. en_option_a
18. en_option_b
19. en_option_c
20. en_option_d
21. en_option_e
22. ta_question_text
23. ta_option_a
24. ta_option_b
25. ta_option_c
26. ta_option_d
27. ta_option_e
28. answer_key
29. en_explanation
30. ta_explanation
```

### Working CSV Example:

```csv
question_id,content_hash,exam_tag,source_type,year,subject_name,unit_code,unit_name,macro_topic,micro_topic,sub_topic,difficulty_level,question_type,cognitive_skill,ideal_time_seconds,en_question_text,en_option_a,en_option_b,en_option_c,en_option_d,en_option_e,ta_question_text,ta_option_a,ta_option_b,ta_option_c,ta_option_d,ta_option_e,answer_key,en_explanation,ta_explanation
,,TNPSC_GROUP_4,PYQ,2024,General Studies,G4_GS_U1,Unit I: General Science,Physics,"Mechanics, Force, Pressure & Energy",,MEDIUM,Multiple Choice,Recall,54,What is Newton's first law of motion?,An object at rest stays at rest unless acted upon by an external force,Force equals mass times acceleration,Every action has an equal and opposite reaction,Energy cannot be created or destroyed,,நியூட்டனின் முதல் இயக்க விதி என்ன?,ஓய்வில் உள்ள பொருள் வெளி விசை செயல்படும் வரை ஓய்வில் இருக்கும்,விசை = நிறை × முடுக்கம்,ஒவ்வொரு செயலுக்கும் சமமான எதிர்வினை உண்டு,ஆற்றலை உருவாக்கவோ அழிக்கவோ முடியாது,,A,Newton's first law states that an object at rest remains at rest unless acted upon by an external force.,நியூட்டனின் முதல் விதி கூறுகிறது: ஓய்வில் உள்ள பொருள் வெளி விசை செயல்படும் வரை ஓய்விலேயே இருக்கும்.
```

---

## 🔍 DATABASE VALIDATION LOGIC

### SQL Trigger: Auto-Populate unit_code

```sql
CREATE OR REPLACE FUNCTION public.auto_populate_unit_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unit_code IS NULL AND NEW.unit_name IS NOT NULL THEN
    NEW.unit_code := public.derive_unit_code_from_name(NEW.exam_tag, NEW.unit_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### SQL Trigger: Validate Question for Mock

```sql
CREATE OR REPLACE FUNCTION validate_question_for_mock()
RETURNS TRIGGER AS $$
BEGIN
  -- Standardize difficulty_level to uppercase
  IF NEW.difficulty_level IS NOT NULL THEN
    NEW.difficulty_level := UPPER(NEW.difficulty_level);
  END IF;
  
  -- Ensure correct_option is set
  IF NEW.correct_option IS NULL THEN
    RAISE NOTICE 'Question % has NULL correct_option', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Difficulty Level Check Constraint:

```sql
ALTER TABLE questions
ADD CONSTRAINT check_difficulty_level_uppercase
CHECK (difficulty_level IN ('EASY', 'MEDIUM', 'HARD') OR difficulty_level IS NULL);
```

---

## ⚠️ COMMON ERRORS & SOLUTIONS

### Error 1: "Taxonomy is not an approved mapping"

**Cause:** The combination of unit_code + macro_topic + micro_topic doesn't exist in taxonomyV2.js

**Solution:**
1. Check taxonomyV2.js for exact spelling
2. Verify case sensitivity (e.g., "Physics" not "physics")
3. Check for extra spaces or punctuation
4. Ensure exam_tag matches unit_code prefix (G4_ for GROUP_4)

**Example Fix:**
```
❌ WRONG: macro_topic="Physics", micro_topic="Mechanics and Properties"
✅ CORRECT: macro_topic="Physics", micro_topic="Mechanics, Force, Pressure & Energy"
```

---

### Error 2: "NULL unit_code"

**Cause:** unit_code is empty or missing

**Solution:**
- Either provide unit_code directly (e.g., G4_GS_U1)
- OR provide unit_name (trigger will auto-generate unit_code)

**Example:**
```csv
✅ OPTION 1: unit_code="G4_GS_U1", unit_name=""
✅ OPTION 2: unit_code="", unit_name="Unit I: General Science"
```

---

### Error 3: "Difficulty level must be uppercase"

**Cause:** difficulty_level is lowercase (e.g., "easy", "medium")

**Solution:**
- Use: `EASY`, `MEDIUM`, `HARD`
- Database trigger auto-converts to uppercase, but validation may fail before insert

---

### Error 4: "Missing correct answer"

**Cause:** answer_key column is NULL or empty

**Solution:**
```csv
✅ answer_key="A"  (or B, C, D)
❌ answer_key=""   (will be rejected)
```

---

### Error 5: "PYQ question missing year"

**Cause:** source_type is PYQ but year is NULL

**Solution:**
```csv
✅ source_type="PYQ", year="2024"
❌ source_type="PYQ", year=""
```

For VINA questions, year can be empty or future (e.g., 2026)

---

## 🎯 QUICK VALIDATION CHECKLIST

Before importing CSV, verify:

- [ ] exam_tag is one of: `TNPSC_GROUP_1`, `TNPSC_GROUP_2`, `TNPSC_GROUP_4`
- [ ] unit_code matches exam_tag prefix (G4_ for GROUP_4, etc.)
- [ ] unit_name exactly matches one from taxonomyV2.js
- [ ] macro_topic + micro_topic combination exists in taxonomyV2.js
- [ ] difficulty_level is uppercase: `EASY`, `MEDIUM`, or `HARD`
- [ ] answer_key is one of: `A`, `B`, `C`, `D`
- [ ] source_type is either `PYQ` or `VINA`
- [ ] If PYQ, year is provided (e.g., 2024)
- [ ] en_question_text is not empty
- [ ] File is UTF-8 encoded (for Tamil text)

---

## 📊 BLUEPRINT QUOTAS

### TNPSC GROUP 4 (Total: 200 questions)

| Subject | Unit | Quota |
|---------|------|-------|
| General Studies | Unit I | 5 |
| General Studies | Unit II | 5 |
| General Studies | Unit III | 10 |
| General Studies | Unit IV | 15 |
| General Studies | Unit V | 20 |
| General Studies | Unit VI | 20 |
| Aptitude | Unit I | 15 |
| Aptitude | Unit II | 10 |
| Tamil | Unit I | 25 |
| Tamil | Unit II | 15 |
| Tamil | Unit III | 15 |
| Tamil | Unit IV | 10 |
| Tamil | Unit V | 15 |
| Tamil | Unit VI | 5 |
| Tamil | Unit VII | 15 |

**Note:** General English is NOT counted in the 200-question blueprint but questions can still be uploaded.

---

## 🔗 RELATED FILES

- **taxonomyV2.js** - Source of truth for all taxonomy combinations
- **00027_seed_syllabus_units_from_taxonomy.sql** - Unit seeding migration
- **00025_add_question_validation.sql** - Validation triggers and constraints
- **00024_auto_generate_unit_codes.sql** - Auto unit_code population
- **sample_questions_FINAL_WORKING.csv** - Working CSV example with valid data
- **APPROVED_TAXONOMY_REFERENCE.md** - Human-readable taxonomy guide

---

## 📞 SUPPORT

For validation errors:
1. Check this file for exact taxonomy spelling
2. Verify your CSV against `sample_questions_FINAL_WORKING.csv`
3. Run validation SQL to check existing data
4. Check database triggers are active

**Last Verified:** Working system with active database triggers and validated sample CSV

---

**END OF DOCUMENT**
