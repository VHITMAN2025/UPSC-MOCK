# Approved Question Taxonomy Reference

This document lists all approved taxonomy mappings for question imports. Every question MUST have valid values for:
- `unit_name` (or `unit_tag`)
- `macro_topic`
- `micro_topic`

## ALL_GROUPS (Applicable to All Exam Groups)

### Unit 1: General Science

**Physics**
- Mechanics & Properties of Matter
- Light, Sound, Heat & Magnetism
- Universe & Solar System

**Chemistry**
- Elements, Compounds, Acids, Bases & Salts
- Petroleum Products, Fertilizers & Pesticides

**Biology**
- Main Concepts of Life Science & Classification
- Blood, Circulation & Human Body Systems
- Human Diseases (Causes & Cures)

**Environment**
- Environment, Ecology & Diet

### Unit 2: Current Events

**History & Politics**
- Latest Diary of Events & National Symbols
- Prominent Personalities & Places in News
- Public Awareness & General Administration

**Geography & Science**
- Geographical Landmarks
- Latest Inventions in Science & Technology

### Unit 3: Geography of India

**Physical Geography**
- Location & Physical Features of India

**Climate & Weather**
- Monsoon, Rainfall & Weather Patterns

**Water & Soil**
- Water Resources & Rivers in India
- Soil, Minerals & Natural Resources

**Economic & Human**
- Agriculture Patterns
- Transport, Communication & Population Density
- Disaster Management & Environmental Impact

### Unit 4: History & Culture

**Ancient India**
- Indus Valley Civilization
- Guptas

**Medieval India**
- Delhi Sultanate
- Mughals & Marathas

**South Indian History**
- Cholas, Pandyas, Pallavas

**Culture & Heritage**
- Characteristics of Indian Culture (Unity in Diversity)
- India as a Secular State

### Unit 5: Indian Polity

**Constitution Basics**
- Making of the Constitution & Salient Features
- Preamble, Citizenship, Union & Territories

**Rights & Duties**
- Fundamental Rights
- Fundamental Duties & Directive Principles (DPSP)

**Executive & Legislature**
- Union Executive (President, PM, Cabinet)
- State Executive (Governor, CM, Council)
- Parliament & State Legislature

**Judiciary & Local Govt**
- Supreme Court & High Courts
- Local Government (Panchayati Raj)
- Constitutional & Non-Constitutional Bodies (EC, CAG, UPSC)

### Unit 6: Indian Economy

**Nature of Economy**
- Nature of Indian Economy & Five Year Plans
- Planning Commission & NITI Aayog

**Finance & Banking**
- Reserve Bank of India (RBI) & Monetary Policy
- Finance Commission & Fiscal Policy

**Sectors of Economy**
- Agriculture, Industry & Rural Development
- GST & Taxation

### Unit 7: National Movement

**Early Uprisings**
- Early Uprisings against British Rule (1857 Revolt)

**INC & Moderates**
- Indian National Congress Formation
- Emergence of Leaders (B.R. Ambedkar, Bhagat Singh, etc.)

**Gandhian Era**
- Non-Cooperation, Civil Disobedience, Quit India

### Unit 8: TN History & Culture

**Ancient Tamilakam**
- History of Tamil Society & Archaeological Discoveries
- Sangam Literature

**Thirukkural**
- Significance as Secular Literature & Everyday Relevance

**Freedom Struggle in TN**
- Early Agitations against British Rule
- Role of Women in Freedom Struggle

**Social Movements**
- 19th & 20th Century Socio-Political Movements
- Justice Party, Dravidian Movement & Periyar

### Unit 9: TN Administration

**Welfare & Governance**
- Social Justice & Social Harmony
- Education & Health Systems in Tamil Nadu
- E-Governance in Tamil Nadu

**TN Geography**
- Geography of Tamil Nadu & its Economic Impact

### Unit 10: Aptitude

**Quantitative Aptitude**
- Simplification, LCM & HCF
- Ratio & Proportion
- Percentage, Simple & Compound Interest
- Area & Volume
- Time & Work

**Logical Reasoning**
- Logical Reasoning & Puzzles
- Dice & Visual Reasoning
- Alpha-Numeric & Number Series

---

## GROUP_2_AND_4 ONLY (Group 2 & 4 Specific)

### Part A: General Tamil

**Ilakkanam (Grammar)**
- Poruthuthal & Pirithu Ezhudhuthal
- Pizhai Thiruththam & Sol Porul

**Ilakkaiyam (Literature)**
- Thirukkural & Ettuthogai
- Paththuppaattu & Iymperum Kaapiyangal

**Tamil Arignargal (Scholars)**
- Tamil Thondu & Bharathiyar/Bharathidasan
- Urainadai & Samudhaya Thondu

### Part A: General English

**Grammar**
- Match the following & Synonyms/Antonyms
- Prefix/Suffix & Articles/Prepositions

**Literature**
- Figures of Speech & Poetry Comprehension
- Important Lines from Poems

**Authors & Literary Works**
- Match Authors with Stories
- Biographies & Characters

---

## CSV Column Requirements

Your CSV MUST have these columns with valid values:

1. **unit_name** or **unit_tag** - Exact match required (e.g., "Unit 1: General Science")
2. **macro_topic** - Exact match required (e.g., "Physics")
3. **micro_topic** - Exact match required (e.g., "Mechanics & Properties of Matter")

### Example Valid CSV Row:
```
unit_name,macro_topic,micro_topic,question_text,...
"Unit 1: General Science","Physics","Mechanics & Properties of Matter","What is Newton's first law?",...
```

## Common Errors:

❌ **NULL or empty values** - Will be rejected
❌ **Misspelled taxonomy** - Must match exactly
❌ **Custom taxonomy** - Only approved combinations allowed

✅ **Solution**: Use exact taxonomy values from this document
