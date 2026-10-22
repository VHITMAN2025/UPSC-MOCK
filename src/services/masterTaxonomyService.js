/**
 * Master Taxonomy Service & 29-Column Schema Specification
 * 
 * Enforces:
 * 1. Locked Master Taxonomy CSV catalogs for:
 *    - TNPSC Group 1 (Part A Units I-VI + Part B Aptitude = 175 + 25 = 200 Qs)
 *    - TNPSC Group 2 & 2A (Part A Tamil/English 100 + Part B GS 75 + Part C Aptitude 25 = 200 Qs)
 *    - TNPSC Group 4 (Part A Tamil 100 + Part B GS 75 + Part C Aptitude 25 = 200 Qs)
 * 2. Strict Foreign-Key validation for uploaded questions against locked tags
 * 3. SHA-256 Deduplication Gate (blocks VINA questions matching PYQ question text)
 * 4. 29-Column Schema Normalization & Serialization
 */

// ─── 1. Group 1 Locked Master Taxonomy ──────────────────────────────────────
export const GROUP1_MASTER_TAXONOMY = [
  // ── UNIT_I: General Science (Quota: 10) ────────────────────────────────────
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_I', macro_topic: 'Physics', micro_topic: 'Mechanics, Force, Motion & Properties of Matter', sub_topic: 'Laws of Motion & Gravitation' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_I', macro_topic: 'Physics', micro_topic: 'Light, Sound, Heat, Electricity & Magnetism', sub_topic: 'Ohm Law, Resistance & Optics' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_I', macro_topic: 'Chemistry', micro_topic: 'Elements, Compounds, Acids, Bases & Salts', sub_topic: 'pH Scale & Litmus Reactions' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_I', macro_topic: 'Chemistry', micro_topic: 'Fertilizers, Pesticides & Carbon Compounds', sub_topic: 'Urea, Nitrogenous Fertilizers & Polymers' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_I', macro_topic: 'Biology', micro_topic: 'Blood, Circulation & Human Organ Systems', sub_topic: 'Circulatory, Renal & Endocrine Systems' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_I', macro_topic: 'Biology', micro_topic: 'Nutrition, Vitamins & Human Diseases', sub_topic: 'Vitamin Deficiency & Viral Pathogens' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_I', macro_topic: 'Environment & Ecology', micro_topic: 'Ecosystems, Food Chain & Biodiversity Conservation', sub_topic: 'Trophic Levels & Endangered Species' },

  // ── UNIT_II: Geography of India (Quota: 10) ────────────────────────────────
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_II', macro_topic: 'Location & Physical Features', micro_topic: 'Himalayan Mountains, Peninsular Plateau & Coastal Plains', sub_topic: 'Passes, Plateaus & Escarpments' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_II', macro_topic: 'Monsoon & Climate', micro_topic: 'Monsoon Mechanism, Rainfall Patterns & Weather Phenomena', sub_topic: 'South-West & North-East Monsoon Mechanisms' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_II', macro_topic: 'Water Resources & Rivers', micro_topic: 'Himalayan & Peninsular Rivers of India', sub_topic: 'Ganga, Indus, Brahmaputra & Godavari Basins' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_II', macro_topic: 'Water Resources & Rivers', micro_topic: 'Rivers of Tamil Nadu (Cauvery, Vaigai, Thamirabarani)', sub_topic: 'Cauvery River Basin & TN Irrigation Dams' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_II', macro_topic: 'Social & Economic Geography', micro_topic: 'Soil Types, Natural Vegetation & Wild Life Sanctuaries', sub_topic: 'Black Soils, Alluvial Belts & Biosphere Reserves' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_II', macro_topic: 'Social & Economic Geography', micro_topic: 'Population Distribution, Urbanization & Migration', sub_topic: 'Census Demographics & Urban Slums' },

  // ── UNIT_III: History, Culture of India & INM (Quota: 25) ───────────────────
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_III', macro_topic: 'Ancient India', micro_topic: 'Indus Valley Civilization & Vedic Period', sub_topic: 'Harappan Town Planning & Rigvedic Society' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_III', macro_topic: 'Medieval India', micro_topic: 'Guptas, Delhi Sultanate, Mughals & Marathas', sub_topic: 'Gupta Administration & Delhi Sultanate Dynasties' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_III', macro_topic: 'South Indian Dynasties', micro_topic: 'Vijayanagara & Bahmani Empires', sub_topic: 'Krishnadevaraya Rule & Nayankara System' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_III', macro_topic: 'South Indian Dynasties', micro_topic: 'Cholas, Pandyas, Pallavas & South Indian Heritage', sub_topic: 'Chola Local Self-Government (Uttiramerur)' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_III', macro_topic: 'Early Resistance to British Rule', micro_topic: 'Early Uprisings against British Rule & 1857 Revolt', sub_topic: 'Palayakkarar Rebellion & Vellore Mutiny 1806' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_III', macro_topic: 'National Renaissance & Movement', micro_topic: 'Indian National Congress, Moderates, Extremists & Revolutionary Agitations', sub_topic: 'INC Sessions, Surat Split & Swadeshi Movement' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_III', macro_topic: 'Gandhian Era', micro_topic: 'Gandhian Era, Mass Movements & Leaders', sub_topic: 'Non-Cooperation, Civil Disobedience & Quit India' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_III', macro_topic: 'Partition & Independence', micro_topic: 'Communalism, Partition, Independence & Integration of States', sub_topic: 'Cabinet Mission, Mountbatten Plan & Sardar Patel Integration' },

  // ── UNIT_IV: Indian Polity (Quota: 40) ──────────────────────────────────────
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_IV', macro_topic: 'Constitutional Framework', micro_topic: 'Preamble, Salient Features, Union, States & Citizenship', sub_topic: 'Article 1-11, Basic Structure Doctrine' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_IV', macro_topic: 'Fundamental Rights & Duties', micro_topic: 'Fundamental Rights, Directive Principles of State Policy & Fundamental Duties', sub_topic: 'Article 14-32, Article 32 Writs, 42nd Amendment' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_IV', macro_topic: 'Union Government', micro_topic: 'Union Executive: President, Vice-President, Prime Minister & Council of Ministers', sub_topic: 'Presidential Powers & Cabinet Discretion' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_IV', macro_topic: 'Union Parliament', micro_topic: 'Union Parliament: Lok Sabha, Rajya Sabha & Legislative Procedure', sub_topic: 'Money Bills, Speaker Powers & Committees' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_IV', macro_topic: 'State Government', micro_topic: 'State Executive: Governor, Chief Minister & Council of Ministers', sub_topic: 'Governor Discretionary Powers' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_IV', macro_topic: 'State Legislature & Judiciary', micro_topic: 'State Legislature & State Judiciary (High Courts & Subordinate Courts)', sub_topic: 'High Court Writs (Article 226)' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_IV', macro_topic: 'Union Judiciary', micro_topic: 'Supreme Court of India & Judicial Review', sub_topic: 'Appellate Jurisdiction & Collegium System' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_IV', macro_topic: 'Local Self Government', micro_topic: 'Panchayati Raj, 73rd & 74th Constitutional Amendment Acts', sub_topic: 'Three-Tier Gram Panchayat & Nagar Palika' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_IV', macro_topic: 'Constitutional & Statutory Bodies', micro_topic: 'Constitutional & Statutory Bodies: Election Commission, CAG, UPSC, TNPSC, NITI Aayog', sub_topic: 'Article 324, Article 148 CAG Auditing' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_IV', macro_topic: 'Anti-Corruption & Transparency', micro_topic: 'Anti-Corruption Measures: Lokpal, Lokayukta, Central Vigilance Commission, RTI', sub_topic: 'RTI Act 2005 & Ombudsman Mechanism' },

  // ── UNIT_V: Indian Economy & Dev Admin in TN (Quota: 50) ───────────────────
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_V', macro_topic: 'Indian Economy & Planning', micro_topic: 'Nature of Indian Economy, Five-Year Plans & Planning Commission to NITI Aayog', sub_topic: 'Five Year Plan Models & NITI Aayog Strategic Goals' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_V', macro_topic: 'Banking & Monetary Policy', micro_topic: 'Reserve Bank of India, Monetary Policy, Commercial Banking & Financial Inclusion', sub_topic: 'Repo Rate, Reverse Repo & CRR Regulations' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_V', macro_topic: 'Fiscal Policy & Public Finance', micro_topic: 'Sources of Revenue, Fiscal Policy, GST & Finance Commission', sub_topic: 'GST Slabs & 15th/16th Finance Commission Devolution' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_V', macro_topic: 'Agriculture & Rural Economy', micro_topic: 'Agriculture, Land Reforms, Green Revolution & Rural Development', sub_topic: 'MSP, PM-KISAN & Tenancy Reforms' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_V', macro_topic: 'Industry & External Sector', micro_topic: 'Industrial Growth, Foreign Trade & Balance of Payments', sub_topic: 'MSME Policies, FDI & Current Account Deficit' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_V', macro_topic: 'Tamil Nadu Socio-Economic Profile', micro_topic: 'Human Development Indicators (HDI) & Socio-Economic Progress in Tamil Nadu', sub_topic: 'TN Infant Mortality, Literacy & Gender Parity' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_V', macro_topic: 'Social Justice in TN', micro_topic: 'Social Justice, Reservations & Inclusive Growth in Tamil Nadu', sub_topic: '69% Reservation Policy & Caste Survey Precedents' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_V', macro_topic: 'Education & Health in TN', micro_topic: 'Education & Public Health Delivery Systems in Tamil Nadu', sub_topic: 'Mid-Day Meal / Breakfast Scheme & PHC Infrastructure' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_V', macro_topic: 'E-Governance in TN', micro_topic: 'E-Governance Initiatives, Digital Tamil Nadu & Administrative Reforms', sub_topic: 'TNeGA, E-Sevai Centers & Smart City Models' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_V', macro_topic: 'State Welfare Schemes', micro_topic: 'State Welfare Schemes for Women, Children, Farmers & Marginalized Groups', sub_topic: 'Kalaignar Magalir Urimai Thittam & Moovalur Ramamirtham Ammaiyar Scheme' },

  // ── UNIT_VI: History, Culture, Heritage & Movements in TN (Quota: 40) ──────
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_VI', macro_topic: 'Tamil Society & Heritage', micro_topic: 'History of Tamil Society, Archaeological Discoveries & Keezhadi Excavations', sub_topic: 'Keezhadi, Adichanallur & Kodumanal Excavations' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_VI', macro_topic: 'Tamil Literature', micro_topic: 'Sangam Literature, Post-Sangam Literature & Epics (Silappathikaram, Manimekalai)', sub_topic: 'Akananuru, Purananuru & Silappathikaram Narrative' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_VI', macro_topic: 'Thirukkural', micro_topic: 'Thirukkural: Secular Nature, Compassion, Good Governance & Universal Values', sub_topic: 'Thirukkural Couplets on Politics (Porutpaal) & Ethics (Arathupaal)' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_VI', macro_topic: 'Freedom Struggle in TN', micro_topic: 'Role of Tamil Nadu in Freedom Struggle: Early Agitations (Pulithevan, Kattabomman, Maruthu Brothers)', sub_topic: 'Dindigul League & Panchalankurichi Battles' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_VI', macro_topic: 'Freedom Struggle in TN', micro_topic: 'Freedom Fighters of TN: V.O. Chidambaranar, Subramania Bharati, Subramania Siva, Rajaji, Kamarajar', sub_topic: 'Swadeshi Steam Navigation & Vedaranyam Salt Satyagraha' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_VI', macro_topic: 'Dravidian & Reform Movements', micro_topic: 'Self-Respect Movement, Justice Party, Periyar E.V.R. & Anna', sub_topic: 'Non-Brahmin Manifesto 1916 & Vaikom Satyagraha' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'General Studies', unit_code: 'UNIT_VI', macro_topic: 'Social Reform Movements', micro_topic: 'Women Empowerment & Social Reform Movements in Tamil Nadu', sub_topic: 'Dr. Muthulakshmi Reddy & Devadasi Abolition' },

  // ── APT_UNIT_I: Aptitude & Arithmetic (Quota: 15) ──────────────────────────
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'Aptitude & Mental Ability', unit_code: 'APT_UNIT_I', macro_topic: 'Arithmetic Operations', micro_topic: 'Simplification & Percentage', sub_topic: 'BODMAS & Percentage Conversions' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'Aptitude & Mental Ability', unit_code: 'APT_UNIT_I', macro_topic: 'Arithmetic Operations', micro_topic: 'Highest Common Factor (HCF) & Lowest Common Multiple (LCM)', sub_topic: 'Co-primes & LCM-HCF Relation' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'Aptitude & Mental Ability', unit_code: 'APT_UNIT_I', macro_topic: 'Commercial Math', micro_topic: 'Ratio, Proportion & Variations', sub_topic: 'Direct & Inverse Variations' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'Aptitude & Mental Ability', unit_code: 'APT_UNIT_I', macro_topic: 'Commercial Math', micro_topic: 'Simple Interest & Compound Interest', sub_topic: 'Annual vs Semi-annual Compounding' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'Aptitude & Mental Ability', unit_code: 'APT_UNIT_I', macro_topic: 'Mensuration', micro_topic: 'Area, Volume & Mensuration', sub_topic: '2D/3D Cylinders, Spheres & Cones' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'Aptitude & Mental Ability', unit_code: 'APT_UNIT_I', macro_topic: 'Commercial Math', micro_topic: 'Time and Work, Pipes & Cisterns', sub_topic: 'Efficiency & Alternate Days Working' },

  // ── APT_UNIT_II: Mental Ability & Reasoning (Quota: 10) ────────────────────
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'Aptitude & Mental Ability', unit_code: 'APT_UNIT_II', macro_topic: 'Logical Reasoning', micro_topic: 'Logical Reasoning & Syllogism', sub_topic: 'Venn Diagrams & Statement Deductions' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'Aptitude & Mental Ability', unit_code: 'APT_UNIT_II', macro_topic: 'Analytical Reasoning', micro_topic: 'Number Series, Alphanumeric Series & Coding-Decoding', sub_topic: 'Difference Series & Letter Shifts' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'Aptitude & Mental Ability', unit_code: 'APT_UNIT_II', macro_topic: 'Visual Reasoning', micro_topic: 'Puzzles, Dice & Visual Reasoning', sub_topic: 'Opposite Faces of Dice & Seating Arrangements' },
  { exam_tag: 'TNPSC_GROUP_1', subject_name: 'Aptitude & Mental Ability', unit_code: 'APT_UNIT_II', macro_topic: 'Data Interpretation', micro_topic: 'Data Interpretation: Tables, Bar Graphs, Pie Charts & Histograms', sub_topic: 'Percentage Growth from Pie Charts' },
]

// ─── 2. Group 2 & 2A Locked Master Taxonomy ──────────────────────────────────
export const GROUP2_MASTER_TAXONOMY = [
  // ── Language Part A: General Tamil (Quota: 100) ───────────────────────────
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Tamil', unit_code: 'LANG_TA_A', macro_topic: 'பொதுத்தமிழ் இலக்கணம்', micro_topic: 'பொருத்துதல் & பொருத்தமான பொருளைத் தெரிவு செய்தல்', sub_topic: 'சொல்-பொருள் பொருத்துதல்' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Tamil', unit_code: 'LANG_TA_A', macro_topic: 'பொதுத்தமிழ் இலக்கணம்', micro_topic: 'பிரித்தெழுதுக & சேர்த்தெழுதுக', sub_topic: 'உயிர்வரிசை & மெய்வரிசை புணர்ச்சி' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Tamil', unit_code: 'LANG_TA_A', macro_topic: 'பொதுத்தமிழ் இலக்கணம்', micro_topic: 'சந்திப்பிழை நீக்குதல், ஒருமை பன்மை பிழை நீக்குதல்', sub_topic: 'வல்லினம் மிகும் மிகா இடங்கள்' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Tamil', unit_code: 'LANG_TA_A', macro_topic: 'பொதுத்தமிழ் இலக்கணம்', micro_topic: 'வேர்ச்சொல்லைத் தேர்வு செய்தல் & வினைமுற்று, வினையெச்சம் அமைத்தல்', sub_topic: 'பெயரெச்சம், வினையெச்சம் & தொழிற் பெயர்' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Tamil', unit_code: 'LANG_TA_A', macro_topic: 'பொதுத்தமிழ் இலக்கணம்', micro_topic: 'அகரவரிசைப்படி சொற்களைச் சீர் செய்தல்', sub_topic: 'உயிர், மெய், உயிர்மெய் அகரவரிசை' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Tamil', unit_code: 'LANG_TA_A', macro_topic: 'பொதுத்தமிழ் இலக்கணம்', micro_topic: 'பெயர்ச்சொல்லின் வகை அறிதல் & இலக்கணக் குறிப்பு', sub_topic: 'பொருட்பெயர், இடப்பெயர், பண்புப்பெயர்' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Tamil', unit_code: 'LANG_TA_A', macro_topic: 'பொதுத்தமிழ் இலக்கணம்', micro_topic: 'தன்வினை, பிறவினை, செய்வினை, செயப்பாட்டு வினை வாக்கியங்களைக் கண்டறிதல்', sub_topic: 'வினை அமைப்புகள் & நேரடி கூற்று' },

  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Tamil', unit_code: 'LANG_TA_B', macro_topic: 'பொதுத்தமிழ் இலக்கியம்', micro_topic: 'திருக்குறள் தொடர்பான செய்திகள், மேற்கோள்கள்', sub_topic: 'அறத்துப்பால் & பொருட்பால் அதிகாரங்கள்' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Tamil', unit_code: 'LANG_TA_B', macro_topic: 'பொதுத்தமிழ் இலக்கியம்', micro_topic: 'எட்டுத்தொகை & பத்துப்பாட்டு நூல்கள்', sub_topic: 'நற்றிணை, குறுந்தொகை, முல்லைப்பாட்டு' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Tamil', unit_code: 'LANG_TA_B', macro_topic: 'பொதுத்தமிழ் இலக்கியம்', micro_topic: 'பதினெண்கீழ்க்கணக்கு நூல்கள் (நாலடியார், நான்மணிக்கடிகை, இன்னா நாற்பது)', sub_topic: 'நீதி நூல்கள் & மூதுரை' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Tamil', unit_code: 'LANG_TA_B', macro_topic: 'பொதுத்தமிழ் இலக்கியம்', micro_topic: 'சிலப்பதிகாரம், மணிமேகலை & ஐம்பெருங்காப்பியங்கள்', sub_topic: 'கண்ணகி வழக்குரை & மணிமேகலை பாத்திரம்' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Tamil', unit_code: 'LANG_TA_B', macro_topic: 'பொதுத்தமிழ் இலக்கியம்', micro_topic: 'பெரியபுராணம், கம்பராமாயணம் & சிற்றிலக்கியங்கள்', sub_topic: 'கலிங்கத்துப்பரணி & முக்கூடற்பள்ளு' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Tamil', unit_code: 'LANG_TA_B', macro_topic: 'பொதுத்தமிழ் இலக்கியம்', micro_topic: 'நாட்டுப்புறப் பாட்டுகள், சித்தர் பாடல்கள்', sub_topic: 'தாலாட்டுப் பாடல், சித்தர் தத்துவங்கள்' },

  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Tamil', unit_code: 'LANG_TA_C', macro_topic: 'தமிழ் அறிஞர்களும் தமிழ்த் தொண்டும்', micro_topic: 'பாரதியார், பாரதிதாசன், நாமக்கல் கவிஞர், கவிமணி தேசிக விநாயகம் பிள்ளை', sub_topic: 'பாரதி பாடல்கள் & புதுக்கவிதை இயக்கம்' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Tamil', unit_code: 'LANG_TA_C', macro_topic: 'தமிழ் அறிஞர்களும் தமிழ்த் தொண்டும்', micro_topic: 'உ.வே. சாமிநாதையர், தெ.பொ. மீனாட்சிசுந்தரனார், சி. இலக்குவனார்', sub_topic: 'சுவடி பதிப்புப் பணிகள் & உ.வே.சா' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Tamil', unit_code: 'LANG_TA_C', macro_topic: 'தமிழ் அறிஞர்களும் தமிழ்த் தொண்டும்', micro_topic: 'தேவநேயப் பாவாணர், ஜி.யு. போப், வீரமாமுனிவர் தமிழ்த் தொண்டு', sub_topic: 'செந்தமிழ்ச் சொற்பிறப்பியல் & மொழிபெயர்ப்புகள்' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Tamil', unit_code: 'LANG_TA_C', macro_topic: 'தமிழ் அறிஞர்களும் தமிழ்த் தொண்டும்', micro_topic: 'பெரியார், அண்ணா, முத்துராமலிங்கத் தேவர், காமராசர் சமுதாயத் தொண்டு', sub_topic: 'எழுத்துச் சீர்திருத்தம் & கல்விப் புரட்சி' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Tamil', unit_code: 'LANG_TA_C', macro_topic: 'தமிழ் அறிஞர்களும் தமிழ்த் தொண்டும்', micro_topic: 'தமிழ் உரைநடை வளர்ச்சி, இதழியல் & கலைகள் (நாடகம், திரைப்படம்)', sub_topic: 'நாடகத் தந்தை பம்மல் சம்பந்தனார்' },

  // ── Language Part A: General English (Quota: 100) ─────────────────────────
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General English', unit_code: 'LANG_EN_A', macro_topic: 'Grammar', micro_topic: 'Match Phrases and Synonyms/Antonyms', sub_topic: 'Vocabulary & Contextual Meanings' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General English', unit_code: 'LANG_EN_A', macro_topic: 'Grammar', micro_topic: 'Prepositions, Question Tags & Articles', sub_topic: 'Tag Inversion & Definite Articles' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General English', unit_code: 'LANG_EN_A', macro_topic: 'Grammar', micro_topic: 'Active Voice and Passive Voice', sub_topic: 'Past/Present Participle Passive Conversions' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General English', unit_code: 'LANG_EN_A', macro_topic: 'Grammar', micro_topic: 'Tenses, Direct & Indirect Speech', sub_topic: 'Reported Speech with Modal Auxiliaries' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General English', unit_code: 'LANG_EN_A', macro_topic: 'Grammar', micro_topic: 'Degrees of Comparison & Sentence Correction', sub_topic: 'Superlative to Comparative Transformations' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General English', unit_code: 'LANG_EN_A', macro_topic: 'Grammar', micro_topic: 'Compound Words & Blended Words', sub_topic: 'Portmanteau Words & Hyphenated Compounds' },

  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General English', unit_code: 'LANG_EN_B', macro_topic: 'Literature / Prescribed Poems', micro_topic: 'Figures of Speech (Alliteration, Metaphor, Personification)', sub_topic: 'Metaphor, Simile & Hyperbole Recognition' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General English', unit_code: 'LANG_EN_B', macro_topic: 'Literature / Prescribed Poems', micro_topic: 'Prescribed Poem Appreciation (Sea Fever, The Comet, Courage)', sub_topic: 'John Masefield & Norman Littleford Lines' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General English', unit_code: 'LANG_EN_B', macro_topic: 'Literature / Prescribed Poems', micro_topic: 'Poetic Lines and Author Identification', sub_topic: 'Rhyme Scheme & Stanza Analysis' },

  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General English', unit_code: 'LANG_EN_C', macro_topic: 'Authors and Literary Works', micro_topic: 'Biographies of Eminent Personalities (Mahatma Gandhi, Helen Keller, Dr. Salim Ali)', sub_topic: 'The Story of My Experiments with Truth' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General English', unit_code: 'LANG_EN_C', macro_topic: 'Authors and Literary Works', micro_topic: "Shakespeare's Works, Plays and Famous Quotes", sub_topic: 'Merchant of Venice & Julius Caesar Quotes' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General English', unit_code: 'LANG_EN_C', macro_topic: 'Authors and Literary Works', micro_topic: 'Oscar Wilde, Rabindranath Tagore, R.K. Narayan Short Stories', sub_topic: 'Malgudi Days & The Model Millionaire' },

  // ── General Studies Part B (Quota: 75) ────────────────────────────────────
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Studies', unit_code: 'UNIT_I', macro_topic: 'General Science', micro_topic: 'Mechanics, Force, Motion & Everyday Science', sub_topic: 'Newtonian Physics & Pressure' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Studies', unit_code: 'UNIT_I', macro_topic: 'General Science', micro_topic: 'Human Physiology, Nutrients & Common Diseases', sub_topic: 'Deficiencies & Body Systems' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Studies', unit_code: 'UNIT_II', macro_topic: 'Current Events', micro_topic: 'National & Regional Events, Welfare Schemes & Sports', sub_topic: 'State Flagship Schemes & National Awards' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Studies', unit_code: 'UNIT_III', macro_topic: 'Geography of India', micro_topic: 'Monsoon, Rainfall & Rivers of India and Tamil Nadu', sub_topic: 'Cauvery & Vaigai Rivers, Monsoon Winds' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Studies', unit_code: 'UNIT_IV', macro_topic: 'History and Culture of India', micro_topic: 'Indus Valley, Guptas, Delhi Sultans, Mughals & South Indian History', sub_topic: 'South Indian Temples & Gupta Age' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Studies', unit_code: 'UNIT_V', macro_topic: 'Indian Polity & Economy', micro_topic: 'Constitution, Fundamental Rights, Parliament & Indian Banking / GST', sub_topic: 'Fundamental Rights, RBI & GST Council' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'General Studies', unit_code: 'UNIT_VI', macro_topic: 'INM & Tamil Nadu Heritage / Dev Admin', micro_topic: 'Indian National Movement, Thirukkural & Social Justice in TN', sub_topic: 'V.O.C., Periyar, Dravidian Movement & Thirukkural Ethics' },

  // ── Aptitude Part C (Quota: 25) ───────────────────────────────────────────
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'Aptitude & Mental Ability', unit_code: 'APT_UNIT_I', macro_topic: 'Arithmetic Operations', micro_topic: 'Simplification, Percentage, Ratio, HCF & LCM, Simple/Compound Interest', sub_topic: 'Percentage & Interest Calculations' },
  { exam_tag: 'TNPSC_GROUP_2', subject_name: 'Aptitude & Mental Ability', unit_code: 'APT_UNIT_II', macro_topic: 'Logical Reasoning', micro_topic: 'Number Series, Puzzles, Visual Reasoning & Data Interpretation', sub_topic: 'Series Completion & Visual Puzzles' },
]

// ─── 3. Group 4 Locked Master Taxonomy ──────────────────────────────────────
export const GROUP4_MASTER_TAXONOMY = [
  // ── Language Part A: General Tamil (SSLC Standard) (Quota: 100) ───────────
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Tamil', unit_code: 'LANG_TA_A', macro_topic: 'பொதுத்தமிழ் இலக்கணம்', micro_topic: 'பொருத்துதல் & பொருத்தமான பொருளைத் தெரிவு செய்தல்', sub_topic: 'சொல்-பொருள் பொருத்துதல்' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Tamil', unit_code: 'LANG_TA_A', macro_topic: 'பொதுத்தமிழ் இலக்கணம்', micro_topic: 'பிரித்தெழுதுக & சேர்த்தெழுதுக', sub_topic: 'புணர்ச்சி விதிகள்' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Tamil', unit_code: 'LANG_TA_A', macro_topic: 'பொதுத்தமிழ் இலக்கணம்', micro_topic: 'சந்திப்பிழை நீக்குதல், ஒருமை பன்மை பிழை நீக்குதல்', sub_topic: 'வல்லினம் மிகும் மிகா இடங்கள்' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Tamil', unit_code: 'LANG_TA_A', macro_topic: 'பொதுத்தமிழ் இலக்கணம்', micro_topic: 'வேர்ச்சொல்லைத் தேர்வு செய்தல் & வினைமுற்று, வினையெச்சம் அமைத்தல்', sub_topic: 'வேர்ச்சொல் வினையெச்சம்' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Tamil', unit_code: 'LANG_TA_A', macro_topic: 'பொதுத்தமிழ் இலக்கணம்', micro_topic: 'அகரவரிசைப்படி சொற்களைச் சீர் செய்தல்', sub_topic: 'அகரவரிசை' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Tamil', unit_code: 'LANG_TA_A', macro_topic: 'பொதுத்தமிழ் இலக்கணம்', micro_topic: 'பெயர்ச்சொல்லின் வகை அறிதல் & இலக்கணக் குறிப்பு', sub_topic: 'பெயர்ச்சொற்கள்' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Tamil', unit_code: 'LANG_TA_A', macro_topic: 'பொதுத்தமிழ் இலக்கணம்', micro_topic: 'தன்வினை, பிறவினை, செய்வினை, செயப்பாட்டு வினை வாக்கியங்களைக் கண்டறிதல்', sub_topic: 'வினை வகை' },

  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Tamil', unit_code: 'LANG_TA_B', macro_topic: 'பொதுத்தமிழ் இலக்கியம்', micro_topic: 'திருக்குறள் தொடர்பான செய்திகள், மேற்கோள்கள்', sub_topic: 'திருக்குறள் அறநெறி' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Tamil', unit_code: 'LANG_TA_B', macro_topic: 'பொதுத்தமிழ் இலக்கியம்', micro_topic: 'எட்டுத்தொகை & பத்துப்பாட்டு நூல்கள்', sub_topic: 'சங்க இலக்கிய நூல்கள்' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Tamil', unit_code: 'LANG_TA_B', macro_topic: 'பொதுத்தமிழ் இலக்கியம்', micro_topic: 'பதினெண்கீழ்க்கணக்கு நூல்கள் (நாலடியார், நான்மணிக்கடிகை, இன்னா நாற்பது)', sub_topic: 'நீதி நூல்கள்' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Tamil', unit_code: 'LANG_TA_B', macro_topic: 'பொதுத்தமிழ் இலக்கியம்', micro_topic: 'சிலப்பதிகாரம், மணிமேகலை & ஐம்பெருங்காப்பியங்கள்', sub_topic: 'இரட்டைக் காப்பியங்கள்' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Tamil', unit_code: 'LANG_TA_B', macro_topic: 'பொதுத்தமிழ் இலக்கியம்', micro_topic: 'பெரியபுராணம், கம்பராமாயணம் & சிற்றிலக்கியங்கள்', sub_topic: 'பக்தி இலக்கியம் & கம்பன்' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Tamil', unit_code: 'LANG_TA_B', macro_topic: 'பொதுத்தமிழ் இலக்கியம்', micro_topic: 'நாட்டுப்புறப் பாட்டுகள், சித்தர் பாடல்கள்', sub_topic: 'நாட்டுப்புறப் பாடல்கள்' },

  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Tamil', unit_code: 'LANG_TA_C', macro_topic: 'தமிழ் அறிஞர்களும் தமிழ்த் தொண்டும்', micro_topic: 'பாரதியார், பாரதிதாசன், நாமக்கல் கவிஞர், கவிமணி தேசிக விநாயகம் பிள்ளை', sub_topic: 'விடுதலைக் கவிஞர்கள்' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Tamil', unit_code: 'LANG_TA_C', macro_topic: 'தமிழ் அறிஞர்களும் தமிழ்த் தொண்டும்', micro_topic: 'உ.வே. சாமிநாதையர், தெ.பொ. மீனாட்சிசுந்தரனார், சி. இலக்குவனார்', sub_topic: 'தமிழ்த் தொண்டர்கள்' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Tamil', unit_code: 'LANG_TA_C', macro_topic: 'தமிழ் அறிஞர்களும் தமிழ்த் தொண்டும்', micro_topic: 'தேவநேயப் பாவாணர், ஜி.யு. போப், வீரமாமுனிவர் தமிழ்த் தொண்டு', sub_topic: 'அயல்நாட்டு தமிழறிஞர்கள்' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Tamil', unit_code: 'LANG_TA_C', macro_topic: 'தமிழ் அறிஞர்களும் தமிழ்த் தொண்டும்', micro_topic: 'பெரியார், அண்ணா, முத்துராமலிங்கத் தேவர், காமராசர் சமுதாயத் தொண்டு', sub_topic: 'சமூகச் சீர்திருத்தம்' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Tamil', unit_code: 'LANG_TA_C', macro_topic: 'தமிழ் அறிஞர்களும் தமிழ்த் தொண்டும்', micro_topic: 'தமிழ் உரைநடை வளர்ச்சி, இதழியல் & கலைகள் (நாடகம், திரைப்படம்)', sub_topic: 'உரைநடை & இதழியல்' },

  // ── General Studies Part B (SSLC Standard) (Quota: 75) ────────────────────
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Studies', unit_code: 'UNIT_I', macro_topic: 'General Science', micro_topic: 'Nature of Universe, Force, Motion, Matter, Acid-Base & Living World', sub_topic: 'Basic Science & Everyday Life' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Studies', unit_code: 'UNIT_II', macro_topic: 'Current Events', micro_topic: 'Current Affairs, Awards, Sports, National Symbols & State Welfare', sub_topic: 'Recent Milestones & Welfare Schemes' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Studies', unit_code: 'UNIT_III', macro_topic: 'Geography of India', micro_topic: 'Location, Physical Features, Monsoon, Water Resources & TN Rivers', sub_topic: 'Cauvery River & Monsoon Climate' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Studies', unit_code: 'UNIT_IV', macro_topic: 'History and Culture of India', micro_topic: 'Indus Valley, Guptas, Sultanate, Mughals, Marathas & South Indian History', sub_topic: 'South Indian Kings & Architecture' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Studies', unit_code: 'UNIT_V', macro_topic: 'Indian Polity & Economy', micro_topic: 'Constitution, Fundamental Rights, Parliament, Panchayat Raj & Planning Commission/RBI', sub_topic: '73rd Amendment, Fundamental Rights & Banking' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'General Studies', unit_code: 'UNIT_VI', macro_topic: 'Indian National Movement & TN Heritage', micro_topic: '1857 Revolt, INC, Freedom Fighters of TN, Thirukkural & Dravidian Movement', sub_topic: 'Kattabomman, Bharati, Periyar & Thirukkural' },

  // ── Aptitude Part C (SSLC Standard) (Quota: 25) ───────────────────────────
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'Aptitude & Mental Ability', unit_code: 'APT_UNIT_I', macro_topic: 'Arithmetic Operations', micro_topic: 'Simplification, Percentage, HCF & LCM, Ratio, Simple & Compound Interest, Time & Work', sub_topic: 'Arithmetic & Simple Interest' },
  { exam_tag: 'TNPSC_GROUP_4', subject_name: 'Aptitude & Mental Ability', unit_code: 'APT_UNIT_II', macro_topic: 'Logical Reasoning', micro_topic: 'Logical Reasoning, Number Series, Puzzles & Visual Reasoning', sub_topic: 'Number Sequences & Reasoning Puzzles' },
]

// ─── Map by Exam Tag ────────────────────────────────────────────────────────
export const MASTER_TAXONOMIES = {
  TNPSC_GROUP_1: GROUP1_MASTER_TAXONOMY,
  TNPSC_GROUP_2: GROUP2_MASTER_TAXONOMY,
  TNPSC_GROUP_4: GROUP4_MASTER_TAXONOMY,
  'TNPSC Group 1': GROUP1_MASTER_TAXONOMY,
  'TNPSC Group 2/2A': GROUP2_MASTER_TAXONOMY,
  'TNPSC Group 4': GROUP4_MASTER_TAXONOMY,
}

// ─── 200-Question Official Blueprints ───────────────────────────────────────
export const OFFICIAL_200Q_BLUEPRINTS = {
  TNPSC_GROUP_1: [
    { unit_code: 'UNIT_I',     subject_name: 'General Studies', quota: 10, title: 'Unit I: General Science' },
    { unit_code: 'UNIT_II',    subject_name: 'General Studies', quota: 10, title: 'Unit II: Geography of India' },
    { unit_code: 'UNIT_III',   subject_name: 'General Studies', quota: 25, title: 'Unit III: History, Culture of India & INM' },
    { unit_code: 'UNIT_IV',    subject_name: 'General Studies', quota: 40, title: 'Unit IV: Indian Polity' },
    { unit_code: 'UNIT_V',     subject_name: 'General Studies', quota: 50, title: 'Unit V: Indian Economy & Dev Admin in TN' },
    { unit_code: 'UNIT_VI',    subject_name: 'General Studies', quota: 40, title: 'Unit VI: History, Culture & Movements in TN' },
    { unit_code: 'APT_UNIT_I', subject_name: 'Aptitude & Mental Ability', quota: 15, title: 'Part B: Aptitude & Arithmetic' },
    { unit_code: 'APT_UNIT_II',subject_name: 'Aptitude & Mental Ability', quota: 10, title: 'Part B: Mental Ability & Reasoning' },
  ],
  TNPSC_GROUP_2_TAMIL: [
    { unit_code: 'LANG_TA_A',  subject_name: 'General Tamil', quota: 35, title: 'Language Part A: பொதுத்தமிழ் இலக்கணம்' },
    { unit_code: 'LANG_TA_B',  subject_name: 'General Tamil', quota: 35, title: 'Language Part A: பொதுத்தமிழ் இலக்கியம்' },
    { unit_code: 'LANG_TA_C',  subject_name: 'General Tamil', quota: 30, title: 'Language Part A: தமிழ் அறிஞர்களும் தொண்டும்' },
    { unit_code: 'UNIT_I',     subject_name: 'General Studies', quota: 5,  title: 'Part B: General Science' },
    { unit_code: 'UNIT_II',    subject_name: 'General Studies', quota: 5,  title: 'Part B: Current Events' },
    { unit_code: 'UNIT_III',   subject_name: 'General Studies', quota: 10, title: 'Part B: Geography of India' },
    { unit_code: 'UNIT_IV',    subject_name: 'General Studies', quota: 15, title: 'Part B: History and Culture of India' },
    { unit_code: 'UNIT_V',     subject_name: 'General Studies', quota: 20, title: 'Part B: Indian Polity & Economy' },
    { unit_code: 'UNIT_VI',    subject_name: 'General Studies', quota: 20, title: 'Part B: INM & TN Heritage / Dev Admin' },
    { unit_code: 'APT_UNIT_I', subject_name: 'Aptitude & Mental Ability', quota: 15, title: 'Part C: Aptitude & Arithmetic' },
    { unit_code: 'APT_UNIT_II',subject_name: 'Aptitude & Mental Ability', quota: 10, title: 'Part C: Mental Ability & Reasoning' },
  ],
  TNPSC_GROUP_2_ENGLISH: [
    { unit_code: 'LANG_EN_A',  subject_name: 'General English', quota: 35, title: 'Language Part A: Grammar' },
    { unit_code: 'LANG_EN_B',  subject_name: 'General English', quota: 35, title: 'Language Part A: Prescribed Poems' },
    { unit_code: 'LANG_EN_C',  subject_name: 'General English', quota: 30, title: 'Language Part A: Authors & Works' },
    { unit_code: 'UNIT_I',     subject_name: 'General Studies', quota: 5,  title: 'Part B: General Science' },
    { unit_code: 'UNIT_II',    subject_name: 'General Studies', quota: 5,  title: 'Part B: Current Events' },
    { unit_code: 'UNIT_III',   subject_name: 'General Studies', quota: 10, title: 'Part B: Geography of India' },
    { unit_code: 'UNIT_IV',    subject_name: 'General Studies', quota: 15, title: 'Part B: History and Culture of India' },
    { unit_code: 'UNIT_V',     subject_name: 'General Studies', quota: 20, title: 'Part B: Indian Polity & Economy' },
    { unit_code: 'UNIT_VI',    subject_name: 'General Studies', quota: 20, title: 'Part B: INM & TN Heritage / Dev Admin' },
    { unit_code: 'APT_UNIT_I', subject_name: 'Aptitude & Mental Ability', quota: 15, title: 'Part C: Aptitude & Arithmetic' },
    { unit_code: 'APT_UNIT_II',subject_name: 'Aptitude & Mental Ability', quota: 10, title: 'Part C: Mental Ability & Reasoning' },
  ],
  TNPSC_GROUP_4: [
    { unit_code: 'LANG_TA_A',  subject_name: 'General Tamil', quota: 35, title: 'Language Part A: பகுதி-அ இலக்கணம்' },
    { unit_code: 'LANG_TA_B',  subject_name: 'General Tamil', quota: 35, title: 'Language Part A: பகுதி-ஆ இலக்கியம்' },
    { unit_code: 'LANG_TA_C',  subject_name: 'General Tamil', quota: 30, title: 'Language Part A: பகுதி-இ தமிழ் அறிஞர்கள்' },
    { unit_code: 'UNIT_I',     subject_name: 'General Studies', quota: 8,  title: 'Part B: General Science (SSLC)' },
    { unit_code: 'UNIT_II',    subject_name: 'General Studies', quota: 7,  title: 'Part B: Current Events' },
    { unit_code: 'UNIT_III',   subject_name: 'General Studies', quota: 12, title: 'Part B: Geography of India' },
    { unit_code: 'UNIT_IV',    subject_name: 'General Studies', quota: 15, title: 'Part B: History and Culture of India' },
    { unit_code: 'UNIT_V',     subject_name: 'General Studies', quota: 18, title: 'Part B: Indian Polity & Economy' },
    { unit_code: 'UNIT_VI',    subject_name: 'General Studies', quota: 15, title: 'Part B: INM & Tamil Nadu Culture' },
    { unit_code: 'APT_UNIT_I', subject_name: 'Aptitude & Mental Ability', quota: 15, title: 'Part C: Aptitude & Arithmetic' },
    { unit_code: 'APT_UNIT_II',subject_name: 'Aptitude & Mental Ability', quota: 10, title: 'Part C: Mental Ability & Reasoning' },
  ],
}

// ─── 4. SHA-256 Deduplication Hash ───────────────────────────────────────────
export async function computeQuestionContentHash(enText = '', taText = '') {
  const norm = (str) =>
    String(str || '')
      .toLowerCase()
      .replace(/[^\w\u0B80-\u0BFF]/g, '')
      .trim()

  const combined = norm(enText) + '||' + norm(taText)
  if (!combined || combined === '||') {
    return 'empty_hash_' + Math.random().toString(36).substring(2, 10)
  }

  try {
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle?.digest) {
      const msgUint8 = new TextEncoder().encode(combined)
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgUint8)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }
  } catch {}

  // Fallback FNV-1a 64-bit hash
  let h1 = 0x811c9dc5
  let h2 = 0x48493021
  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 0x01000193)
    h2 = Math.imul(h2 ^ ch, 0x5bd1e995)
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0')
}

// ─── 5. Strict Foreign-Key & Master Taxonomy Validation ─────────────────────
export function normalizeExamTag(rawTag) {
  const s = String(rawTag || '').toUpperCase().trim()
  if (s.includes('1') || s.includes('ONE')) return 'TNPSC_GROUP_1'
  if (s.includes('2')) return 'TNPSC_GROUP_2'
  return 'TNPSC_GROUP_4'
}

export function validateQuestionAgainstMasterTaxonomy(question, targetExamTag) {
  const examTag = normalizeExamTag(targetExamTag || question.exam_tag)
  const masterList = MASTER_TAXONOMIES[examTag] || GROUP4_MASTER_TAXONOMY

  const qUnitCode = String(question.unit_code || '').trim().toUpperCase()
  const qMacro = String(question.macro_topic || '').trim().toLowerCase()
  const qMicro = String(question.micro_topic || '').trim().toLowerCase()

  const errors = []

  // Check unit_code
  const validUnitCodes = new Set(masterList.map(m => m.unit_code.toUpperCase()))
  if (!qUnitCode || !validUnitCodes.has(qUnitCode)) {
    errors.push(`Invalid unit_code '${qUnitCode}' for ${examTag}. Must be one of: ${Array.from(validUnitCodes).join(', ')}`)
  }

  // Check macro_topic
  const matchingUnits = masterList.filter(m => m.unit_code.toUpperCase() === qUnitCode)
  const validMacros = new Set(matchingUnits.map(m => m.macro_topic.toLowerCase()))
  if (matchingUnits.length > 0 && qMacro) {
    const isMacroValid = Array.from(validMacros).some(vm => vm === qMacro || qMacro.includes(vm) || vm.includes(qMacro))
    if (!isMacroValid) {
      errors.push(`Out-of-syllabus macro_topic '${question.macro_topic}' under unit '${qUnitCode}'.`)
    }
  }

  // Check micro_topic
  const validMicros = new Set(matchingUnits.map(m => m.micro_topic.toLowerCase()))
  if (matchingUnits.length > 0 && qMicro) {
    const isMicroValid = Array.from(validMicros).some(vm => vm === qMicro || qMicro.includes(vm) || vm.includes(qMicro))
    if (!isMicroValid) {
      errors.push(`Out-of-syllabus micro_topic '${question.micro_topic}' under unit '${qUnitCode}'.`)
    }
  }

  // Check source_type mutual exclusivity
  const source = String(question.source_type || 'VINA').toUpperCase().trim()
  if (source !== 'PYQ' && source !== 'VINA') {
    errors.push(`Invalid source_type '${source}'. Must be strictly 'PYQ' or 'VINA'.`)
  }

  // Check answer_key
  const key = String(question.answer_key || question.correct_option || '').toUpperCase().trim()
  if (!['A', 'B', 'C', 'D'].includes(key)) {
    errors.push(`Invalid answer_key '${key}'. Must be strictly A, B, C, or D (Option E is reserved for unattempted).`)
  }

  // Check question text
  if (!question.en_question_text && !question.question_text && !question.ta_question_text && !question.question_text_tamil) {
    errors.push('Question text is missing in both English and Tamil.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    examTag,
  }
}

// ─── 6. 29-Column Schema Normalization ───────────────────────────────────────
export function normalizeTo29Columns(rawQ, index = 1) {
  const examTag = normalizeExamTag(rawQ.exam_tag || rawQ.group_tag || rawQ.group_name)
  const source = (rawQ.source_type || (rawQ.is_pyq ? 'PYQ' : 'VINA')).toUpperCase().trim()
  const qId = rawQ.question_id || rawQ.id || `${examTag === 'TNPSC_GROUP_1' ? 'G1' : examTag === 'TNPSC_GROUP_2' ? 'G2' : 'G4'}_${source}_${String(index).padStart(4, '0')}`

  const enText = rawQ.en_question_text || rawQ.question_text || ''
  const taText = rawQ.ta_question_text || rawQ.question_text_tamil || ''

  const expl = rawQ.explanation || ''
  let enExpl = rawQ.en_explanation || expl.replace(/\[Metadata:[^\]]+\]\s*/g, '').replace(/\[Taxonomy:[^\]]+\]\s*/g, '').trim()
  let taExpl = rawQ.ta_explanation || rawQ.explanation_tamil || ''

  // Infer unit_code if not explicitly set
  let uCode = rawQ.unit_code || ''
  if (!uCode) {
    const uName = (rawQ.unit_name || rawQ.unit_tag || '').toUpperCase()
    if (uName.includes('SCIENCE') || uName.includes('UNIT 1') || uName === '1') uCode = 'UNIT_I'
    else if (uName.includes('GEOGRAPHY') || uName.includes('UNIT 2') || uName === '2') uCode = 'UNIT_II'
    else if (uName.includes('HISTORY') || uName.includes('UNIT 3') || uName === '3') uCode = 'UNIT_III'
    else if (uName.includes('POLITY') || uName.includes('UNIT 4') || uName === '4') uCode = 'UNIT_IV'
    else if (uName.includes('ECONOMY') || uName.includes('UNIT 5') || uName === '5') uCode = 'UNIT_V'
    else if (uName.includes('HERITAGE') || uName.includes('UNIT 6') || uName === '6') uCode = 'UNIT_VI'
    else if (uName.includes('APTITUDE') || uName.includes('UNIT 10') || uName === '10') uCode = 'APT_UNIT_I'
    else if (uName.includes('TAMIL') || uName.includes('UNIT 11') || uName === '11') uCode = 'LANG_TA_A'
    else if (uName.includes('ENGLISH')) uCode = 'LANG_EN_A'
    else uCode = 'UNIT_I'
  }

  const answerKey = String(rawQ.answer_key || rawQ.correct_option || 'A').toUpperCase().trim()

  return {
    // 1-5
    question_id: qId,
    content_hash: rawQ.content_hash || '',
    exam_tag: examTag,
    source_type: source === 'PYQ' ? 'PYQ' : 'VINA',
    year: parseInt(rawQ.year || rawQ.exam_year, 10) || (source === 'PYQ' ? 2024 : 2026),

    // 6-10
    subject_name: rawQ.subject_name || rawQ.subject || (uCode.startsWith('LANG_TA') ? 'General Tamil' : uCode.startsWith('LANG_EN') ? 'General English' : uCode.startsWith('APT') ? 'Aptitude & Mental Ability' : 'General Studies'),
    unit_code: uCode,
    macro_topic: rawQ.macro_topic || rawQ.macro_topic_name || 'General',
    micro_topic: rawQ.micro_topic || rawQ.micro_topic_name || 'General Concepts',
    sub_topic: rawQ.sub_topic || rawQ.topic_name || '',

    // 11-14
    difficulty_level: (rawQ.difficulty_level || 'MEDIUM').toUpperCase(),
    question_type: (rawQ.question_type || 'MULTIPLE_CHOICE').toUpperCase(),
    cognitive_skill: (rawQ.cognitive_skill || 'FACTUAL_RECALL').toUpperCase(),
    ideal_time_seconds: parseInt(rawQ.ideal_time_seconds, 10) || 54,

    // 15-20 (English stem + options)
    en_question_text: enText,
    en_option_a: rawQ.en_option_a || rawQ.option_a || '',
    en_option_b: rawQ.en_option_b || rawQ.option_b || '',
    en_option_c: rawQ.en_option_c || rawQ.option_c || '',
    en_option_d: rawQ.en_option_d || rawQ.option_d || '',
    en_option_e: 'Answer not known',

    // 21-26 (Tamil stem + options)
    ta_question_text: taText,
    ta_option_a: rawQ.ta_option_a || rawQ.option_a_tamil || '',
    ta_option_b: rawQ.ta_option_b || rawQ.option_b_tamil || '',
    ta_option_c: rawQ.ta_option_c || rawQ.option_c_tamil || '',
    ta_option_d: rawQ.ta_option_d || rawQ.option_d_tamil || '',
    ta_option_e: 'விடை தெரியவில்லை',

    // 27-29 (Answer key & bilingual explanations)
    answer_key: ['A', 'B', 'C', 'D'].includes(answerKey) ? answerKey : 'A',
    en_explanation: enExpl,
    ta_explanation: taExpl,
  }
}

// ─── 7. Master Taxonomy CSV Exporter ─────────────────────────────────────────
export function generateMasterTaxonomyCsv(taxonomyList) {
  const headers = ['exam_tag', 'subject_name', 'unit_code', 'macro_topic', 'micro_topic', 'sub_topic']
  const escapeCell = (val) => `"${String(val || '').replace(/"/g, '""')}"`

  const rows = taxonomyList.map(item =>
    headers.map(h => escapeCell(item[h])).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

export function generate29ColumnTemplateCsv() {
  const headers = [
    'question_id', 'content_hash', 'exam_tag', 'source_type', 'year',
    'subject_name', 'unit_code', 'macro_topic', 'micro_topic', 'sub_topic',
    'difficulty_level', 'question_type', 'cognitive_skill', 'ideal_time_seconds',
    'en_question_text', 'en_option_a', 'en_option_b', 'en_option_c', 'en_option_d', 'en_option_e',
    'ta_question_text', 'ta_option_a', 'ta_option_b', 'ta_option_c', 'ta_option_d', 'ta_option_e',
    'answer_key', 'en_explanation', 'ta_explanation'
  ]
  return headers.join(',') + '\n'
}
