import { supabase } from '../lib/supabase.js'
const FALLBACK_RECALL_POOL = []

/**
 * Official TNPSC General Studies Taxonomy Hierarchy
 * Part 3 Official Structure:
 * - TNPSC Group 1: Strictly Units 1 to 10 (Degree Standard). Strictly NO Unit 11 Language.
 * - TNPSC Group 2 & 2A: Units 1 to 10 + Unit 11 Language (General Tamil OR General English based on student choice).
 * - TNPSC Group 4: Units 1 to 10 + Unit 11 Language (SSLC Standard).
 */
export const CANONICAL_SYLLABUS_TAXONOMY = [
  {
    unit_number: 1,
    unit_name: 'Unit 1 — General Science',
    subject: 'General Science',
    description: 'Physics, Chemistry, Biology and Everyday Science Principles',
    macro_topics: [
      {
        topic_number: 1,
        macro_topic_name: 'Physics',
        description: 'Mechanics, Properties of Matter, Light, Sound, Electricity & Universe',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Mechanics, Force, Motion & Properties of Matter',
            keywords: ['force', 'motion', 'newton', 'gravity', 'pressure', 'density', 'elasticity', 'viscosity', 'surface tension', 'work', 'energy', 'விசை', 'இயக்கம்', 'ஈர்ப்பு', 'அழுத்தம்'],
            baseline_questions: ['phy-1', 'phy-2', 'phy-3'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Light, Sound, Heat, Electricity & Magnetism',
            keywords: ['light', 'lens', 'mirror', 'refraction', 'sound', 'frequency', 'electric', 'current', 'ohm', 'magnetic', 'heat', 'temperature', 'ஒளி', 'ஒலி', 'வெப்பம்', 'மின்னோட்டம்'],
            baseline_questions: ['phy-4', 'phy-5', 'phy-6'],
          },
          {
            micro_topic_number: 3,
            micro_topic_name: 'Universe & Solar System',
            keywords: ['universe', 'solar system', 'planet', 'sun', 'moon', 'galaxy', 'satellite', 'orbit', 'விண்வெளி', 'சூரிய குடும்பம்', 'கோள்'],
            baseline_questions: ['phy-7', 'phy-8'],
          },
        ],
      },
      {
        topic_number: 2,
        macro_topic_name: 'Chemistry',
        description: 'Elements, Compounds, Acids, Bases, Salts, Fertilizers & Everyday Chemistry',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Elements, Compounds, Acids, Bases & Salts',
            keywords: ['element', 'compound', 'acid', 'base', 'salt', 'ph', 'litmus', 'neutralization', 'periodic table', 'தனிமம்', 'சேர்மம்', 'அமிலம்', 'காரம்', 'உப்பு'],
            baseline_questions: ['chem-1', 'chem-2', 'chem-3'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Fertilizers, Pesticides & Carbon Compounds',
            keywords: ['fertilizer', 'pesticide', 'urea', 'polymer', 'plastic', 'carbon', 'petroleum', 'fuel', 'உரம்', 'பூச்சிக்கொல்லி', 'நெகிழி'],
            baseline_questions: ['chem-4', 'chem-5'],
          },
        ],
      },
      {
        topic_number: 3,
        macro_topic_name: 'Biology',
        description: 'Cell Biology, Human Systems, Nutrition & Diseases',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Blood, Circulation & Human Organ Systems',
            keywords: ['blood', 'circulation', 'heart', 'kidney', 'lung', 'digestive', 'nervous', 'brain', 'hormone', 'cell', 'இரத்தம்', 'இதயம்', 'சிறுநீரகம்', 'நுரையீரல்'],
            baseline_questions: ['bio-1', 'bio-2', 'bio-3'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Nutrition, Vitamins & Human Diseases',
            keywords: ['vitamin', 'protein', 'carbohydrate', 'deficiency', 'disease', 'virus', 'bacteria', 'vaccine', 'malaria', 'dengue', 'ஊட்டச்சத்து', 'வைட்டமின்', 'நோய்'],
            baseline_questions: ['bio-4', 'bio-5'],
          },
        ],
      },
      {
        topic_number: 4,
        macro_topic_name: 'Environment & Ecology',
        description: 'Ecology Basics, Biodiversity & Environmental Conservation',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Ecosystems, Food Chain & Biodiversity Conservation',
            keywords: ['ecosystem', 'ecology', 'food chain', 'biodiversity', 'wildlife', 'conservation', 'சுற்றுச்சூழல்', 'உயிர்க்கோளம்', 'உணவுச் சங்கிலி'],
            baseline_questions: ['env-1', 'env-2'],
          },
        ],
      },
    ],
  },
  {
    unit_number: 2,
    unit_name: 'Unit 2 — Current Events',
    subject: 'Current Events',
    description: 'National and International Events, Science and Technology, Schemes and Sports',
    macro_topics: [
      {
        topic_number: 1,
        macro_topic_name: 'National & International Events',
        description: 'Recent Events, Summits, Treaties, Eminent Personalities & Awards',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Recent National & International Affairs & Summits',
            keywords: ['current affairs', 'summit', 'g20', 'brics', 'treaty', 'un', 'bilateral', 'international', 'நடப்பு நிகழ்வுகள்', 'மாநாடு', 'சர்வதேச'],
            baseline_questions: ['ca-1', 'ca-2'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Awards, Honors & Eminent Personalities',
            keywords: ['bharat ratna', 'padma award', 'nobel prize', 'sahitya akademi', 'eminent personality', 'விருதுகள்', 'நோபல்'],
            baseline_questions: ['ca-3', 'ca-4'],
          },
        ],
      },
      {
        topic_number: 2,
        macro_topic_name: 'Science, Technology & Defense Updates',
        description: 'ISRO Missions, Defense Tech, AI, Space Exploration & Inventions',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Space Missions, Defense & Scientific Inventions',
            keywords: ['isro', 'drdo', 'chandrayaan', 'gaganyaan', 'missile', 'satellite', 'defense exercise', 'விண்வெளி', 'இஸ்ரோ'],
            baseline_questions: ['ca-5', 'ca-6'],
          },
        ],
      },
      {
        topic_number: 3,
        macro_topic_name: 'Public Administration & State Schemes',
        description: 'State and Central Flagship Policies, Indices & Socio-Economic Programs',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Central & State Flagship Policies & Socio-Economic Programs',
            keywords: ['scheme', 'welfare', 'policy', 'thittam', 'yojana', 'subsidies', 'நிதித் திட்டம்', 'அரசு நலத்திட்டம்'],
            baseline_questions: ['ca-7', 'ca-8'],
          },
        ],
      },
      {
        topic_number: 4,
        macro_topic_name: 'Sports & Games',
        description: 'National & International Tournaments, Medals, Champions & Records',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'National & International Sports, Tournaments & Medals',
            keywords: ['olympics', 'asian games', 'cricket', 'chess', 'grandmaster', 'world cup', 'விளையாட்டு', 'ஒலிம்பிக்'],
            baseline_questions: ['ca-9', 'ca-10'],
          },
        ],
      },
    ],
  },
  {
    unit_number: 3,
    unit_name: 'Unit 3 — Geography of India',
    subject: 'Geography',
    description: 'Physical Features, Rivers, Climate, Soils, Minerals and Natural Resources of India & Tamil Nadu',
    macro_topics: [
      {
        topic_number: 1,
        macro_topic_name: 'Location & Physical Features',
        description: 'Himalayan Mountains, Peninsular Plateau, Coastal Plains & Relief Features',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Himalayan Mountains',
            keywords: ['himalaya', 'himalayan', 'everest', 'kanchenjunga', 'shivalik', 'himadri', 'himachal', 'pass', 'glacier', 'இமயமலை', 'சிகரம்'],
            baseline_questions: ['geo-1', 'geo-2'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Peninsular Plateau',
            keywords: ['peninsular plateau', 'deccan plateau', 'malwa', 'chota nagpur', 'western ghats', 'eastern ghats', 'anamudi', 'doddabetta', 'பீடபூமி', 'தக்காண பீடபூமி'],
            baseline_questions: ['geo-3', 'geo-4'],
          },
          {
            micro_topic_number: 3,
            micro_topic_name: 'Coastal Plains',
            keywords: ['coastal plain', 'coromandel', 'malabar', 'konkan', 'island', 'andaman', 'nicobar', 'lakshadweep', 'கடற்கரை சமவெளி', 'தீவுகள்'],
            baseline_questions: ['geo-5', 'geo-6'],
          },
        ],
      },
      {
        topic_number: 2,
        macro_topic_name: 'Monsoon & Climate',
        description: 'El-Nino, La-Nina, Indian Monsoon Mechanism & Rainfall Distribution',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'El-Nino & La-Nina',
            keywords: ['el-nino', 'la-nina', 'enso', 'pacific', 'southern oscillation', 'climate anomaly', 'எல்-நினோ', 'லா-நினா'],
            baseline_questions: ['geo-7', 'geo-8'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Indian Monsoon Mechanism',
            keywords: ['monsoon', 'southwest monsoon', 'northeast monsoon', 'itcz', 'jet stream', 'rainfall distribution', 'cyclone', 'பருவமழை', 'தென்மேற்கு பருவமழை', 'வடகிழக்கு பருவமழை'],
            baseline_questions: ['geo-9', 'geo-10'],
          },
        ],
      },
      {
        topic_number: 3,
        macro_topic_name: 'Water Resources & Rivers',
        description: 'Himalayan and Peninsular Rivers, Tamil Nadu Rivers & Irrigation Systems',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Himalayan Rivers (Ganga, Indus)',
            keywords: ['ganga', 'indus', 'brahmaputra', 'yamuna', 'himalayan rivers', 'tributary', 'gangetic plain', 'கங்கை', 'சிந்து', 'பிரம்மபுத்திரா'],
            baseline_questions: ['geo-11', 'geo-12'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Tamil Nadu Rivers (Cauvery, Vaigai)',
            keywords: ['cauvery', 'kaveri', 'vaigai', 'tamirabarani', 'bhavani', 'amaravathi', 'palar', 'mullaperiyar', 'dam', 'irrigation', 'காவிரி', 'வைகை', 'தாமிரபரணி', 'ஆறு'],
            baseline_questions: ['geo-13', 'geo-14'],
          },
        ],
      },
      {
        topic_number: 4,
        macro_topic_name: 'Natural Resources & Agriculture',
        description: 'Soils, Mineral Resources, Cropping Patterns & Livestock',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Soil Types & Mineral Distribution',
            keywords: ['alluvial soil', 'black soil', 'red soil', 'laterite', 'mineral', 'iron ore', 'bauxite', 'lignite', 'coal', 'மண் வகைகள்', 'கனிமங்கள்'],
            baseline_questions: ['geo-15', 'geo-16'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Agricultural Patterns & Major Crops',
            keywords: ['agriculture', 'kharif', 'rabi', 'paddy', 'cotton', 'sugarcane', 'tea', 'coffee', 'irrigation pattern', 'விவசாயம்', 'பயிர்கள்'],
            baseline_questions: ['geo-17', 'geo-18'],
          },
        ],
      },
    ],
  },
  {
    unit_number: 4,
    unit_name: 'Unit 4 — History & Culture of India',
    subject: 'History & Culture',
    description: 'Indus Valley Civilization, Vedic Age, Medieval Empires, South Indian Kingdoms & Cultural Heritage',
    macro_topics: [
      {
        topic_number: 1,
        macro_topic_name: 'Indus Valley & Ancient Civilizations',
        description: 'Indus Valley, Vedic Age, Mauryas, Guptas & Harsha',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Indus Valley Civilization & Vedic Period',
            keywords: ['indus valley', 'harappa', 'mohenjodaro', 'lothal', 'vedic', 'aryan', 'upanishad', 'சிந்து சமவெளி', 'ஹரப்பா'],
            baseline_questions: ['his-1', 'his-2'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Mauryas, Guptas & Harsha Empires',
            keywords: ['ashoka', 'maurya', 'chandragupta', 'gupta', 'golden age', 'harsha', 'nalanda', 'அசோகர்', 'மவுரியர்', 'குப்தர்'],
            baseline_questions: ['his-3', 'his-4'],
          },
        ],
      },
      {
        topic_number: 2,
        macro_topic_name: 'Medieval India & Delhi Sultanate',
        description: 'Delhi Sultanate, Mughal Empire, Administration & Architecture',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Delhi Sultanate & Mughal Empire Administration',
            keywords: ['delhi sultanate', 'alauddin khilji', 'akbar', 'mughal', 'mansabdari', 'shah jahan', 'டெல்லி சுல்தானகம்', 'முகலாயர்'],
            baseline_questions: ['his-5', 'his-6'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Vijayanagara & Bahmani Kingdoms',
            keywords: ['vijayanagara', 'krishnadevaraya', 'hampi', 'bahmani', 'விஜயநகர பேரரசு', 'கிருஷ்ணதேவராயர்'],
            baseline_questions: ['his-7', 'his-8'],
          },
        ],
      },
      {
        topic_number: 3,
        macro_topic_name: 'South Indian Kingdoms & Culture',
        description: 'Pallavas, Cholas, Pandyas, Temple Architecture & Art Forms',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Pallavas, Cholas & Pandyas Dynasties',
            keywords: ['chola', 'rajaraja', 'rajendra', 'brihadisvara', 'pallava', 'mahabalipuram', 'pandya', 'சோழர்', 'பல்லவர்', 'பாண்டியர்'],
            baseline_questions: ['his-9', 'his-10'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Temple Architecture, Art Forms & Cultural Legacy',
            keywords: ['dravidian architecture', 'bronze', 'sculpture', 'carnatic', 'bharatanatyam', 'கோயில் கலை', 'சிற்பக்கலை'],
            baseline_questions: ['his-11', 'his-12'],
          },
        ],
      },
      {
        topic_number: 4,
        macro_topic_name: 'Indian Philosophy & Socio-Religious Reforms',
        description: 'Bhakti Movement, Sufism & Modern Philosophical Developments',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Bhakti Movement, Sufism & Cultural Unity',
            keywords: ['bhakti movement', 'kabir', 'mirabai', 'guru nanak', 'sufi', 'ramanuja', 'பக்தி இயக்கம்', 'சூஃபி'],
            baseline_questions: ['his-13', 'his-14'],
          },
        ],
      },
    ],
  },
  {
    unit_number: 5,
    unit_name: 'Unit 5 — Indian Polity',
    subject: 'Indian Polity',
    description: 'Constitution, Fundamental Rights, Parliament, Judiciary, Local Government & Constitutional Bodies',
    macro_topics: [
      {
        topic_number: 1,
        macro_topic_name: 'Constitution & Preamble',
        description: 'Salient Features, Preamble, Citizenship, Fundamental Rights & Duties',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Fundamental Rights, Duties & Directive Principles',
            keywords: ['fundamental rights', 'article 21', 'article 19', 'dpsp', 'fundamental duties', 'preamble', 'citizenship', 'அடிப்படை உரிமைகள்', 'அரசு வழிகாட்டு நெறிமுறைகள்'],
            baseline_questions: ['pol-1', 'pol-2', 'pol-3'],
          },
        ],
      },
      {
        topic_number: 2,
        macro_topic_name: 'Union & State Executive',
        description: 'President, Vice-President, Prime Minister, Governor & Council of Ministers',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'President, Prime Minister & Executive Authorities',
            keywords: ['president', 'prime minister', 'governor', 'cabinet', 'article 356', 'emergency', 'குடியரசுத் தலைவர்', 'பிரதமர்', 'ஆளுநர்'],
            baseline_questions: ['pol-4', 'pol-5'],
          },
        ],
      },
      {
        topic_number: 3,
        macro_topic_name: 'Legislature & Judiciary',
        description: 'Parliament, State Legislatures, Supreme Court, High Courts & Judicial Review',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Parliament, State Legislature & Courts',
            keywords: ['parliament', 'lok sabha', 'rajya sabha', 'supreme court', 'high court', 'judicial review', 'speaker', 'money bill', 'நாடாளுமன்றம்', 'நீதிமன்றம்'],
            baseline_questions: ['pol-6', 'pol-7'],
          },
        ],
      },
      {
        topic_number: 4,
        macro_topic_name: 'Local Governance & Constitutional Bodies',
        description: 'Panchayati Raj, 73rd & 74th Amendments, Election Commission, CAG & Finance Commission',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Panchayati Raj & Constitutional Authorities',
            keywords: ['panchayat', '73rd amendment', '74th amendment', 'gram sabha', 'election commission', 'cag', 'finance commission', 'upsc', 'பஞ்சாயத்து ராஜ்', 'தேர்தல் ஆணையம்'],
            baseline_questions: ['pol-8', 'pol-9'],
          },
        ],
      },
    ],
  },
  {
    unit_number: 6,
    unit_name: 'Unit 6 — Indian Economy',
    subject: 'Indian Economy',
    description: 'Planning, Five-Year Plans, RBI, Banking, Public Finance, GST and Welfare Economics',
    macro_topics: [
      {
        topic_number: 1,
        macro_topic_name: 'National Income & Planning',
        description: 'GDP, GNP, NITI Aayog, Planning Commission & Economic Growth',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'GDP, Five-Year Plans & NITI Aayog',
            keywords: ['gdp', 'gnp', 'national income', 'five year plan', 'niti aayog', 'planning commission', 'per capita', 'தேசிய வருமானம்', 'நிதி ஆயோக்', 'ஐந்தாண்டு திட்டம்'],
            baseline_questions: ['eco-1', 'eco-2'],
          },
        ],
      },
      {
        topic_number: 2,
        macro_topic_name: 'Banking & Monetary Policy',
        description: 'Reserve Bank of India, Monetary Policy, Inflation, Repo Rate & Financial Institutions',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'RBI, Monetary Policy & Inflation Control',
            keywords: ['rbi', 'reserve bank', 'monetary policy', 'repo rate', 'inflation', 'commercial bank', 'nabard', 'ரிசர்வ் வங்கி', 'பணவீக்கம்', 'வங்கி'],
            baseline_questions: ['eco-3', 'eco-4'],
          },
        ],
      },
      {
        topic_number: 3,
        macro_topic_name: 'Public Finance & Fiscal Policy',
        description: 'Budget, Taxation, GST, Fiscal Deficit & Finance Commission',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Budget, GST & Fiscal Deficit',
            keywords: ['budget', 'gst', 'fiscal policy', 'taxation', 'direct tax', 'indirect tax', 'deficit', 'வரவு செலவு திட்டம்', 'ஜிஎஸ்டி'],
            baseline_questions: ['eco-5', 'eco-6'],
          },
        ],
      },
      {
        topic_number: 4,
        macro_topic_name: 'Rural Economy & Welfare Schemes',
        description: 'Poverty Alleviation, Employment Generation, Agriculture Schemes & Microfinance',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Poverty Alleviation & Social Welfare Programs',
            keywords: ['mgnrega', 'poverty alleviation', 'shg', 'employment', 'rural development', 'food security', 'வறுமை ஒழிப்பு', 'வேலைவாய்ப்பு'],
            baseline_questions: ['eco-7', 'eco-8'],
          },
        ],
      },
    ],
  },
  {
    unit_number: 7,
    unit_name: 'Unit 7 — Indian National Movement',
    subject: 'Indian National Movement',
    description: 'Early Resistance, Gandhian Era, Mass Movements, Leaders and Independence',
    macro_topics: [
      {
        topic_number: 1,
        macro_topic_name: 'Early Resistance & 1857 Revolt',
        description: 'Early Uprisings against British Rule, Great Revolt of 1857 & Early Nationalism',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: '1857 Revolt & Early Resistance',
            keywords: ['1857 revolt', 'sepoy mutiny', 'manghal pandey', 'rani lakshmi bai', 'vellore mutiny', '1857 புரட்சி', 'வேலூர் சிப்பாய் புரட்சி'],
            baseline_questions: ['inm-1', 'inm-2'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Emergence of INC & Moderate Phase',
            keywords: ['indian national congress', 'inc', 'dadabhai naoroji', 'gopal krishna gokhale', 'drain of wealth', 'மிதவாதிகள்', 'இந்திய தேசிய காங்கிரஸ்'],
            baseline_questions: ['inm-3', 'inm-4'],
          },
        ],
      },
      {
        topic_number: 2,
        macro_topic_name: 'Swadeshi & Revolutionary Movements',
        description: 'Partition of Bengal, Swadeshi Movement, Home Rule & Extremist Phase',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Swadeshi Movement & Revolutionary Phase',
            keywords: ['swadeshi', 'partition of bengal', 'tilak', 'bipin chandra pal', 'lala lajpat rai', 'home rule', 'சுதேசி இயக்கம்', 'வங்கப் பிரிவினை'],
            baseline_questions: ['inm-5', 'inm-6'],
          },
        ],
      },
      {
        topic_number: 3,
        macro_topic_name: 'Gandhian Era & Mass Struggles',
        description: 'Non-Cooperation, Civil Disobedience, Quit India, Netaji & INA',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Non-Cooperation & Civil Disobedience Movements',
            keywords: ['mahatma gandhi', 'non-cooperation', 'satyagraha', 'dandi march', 'salt satyagraha', 'round table', 'காந்தியடிகள்', 'ஒத்துழையாமை இயக்கம்', 'சட்டமறுப்பு இயக்கம்'],
            baseline_questions: ['inm-7', 'inm-8'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Quit India Movement & Subhas Chandra Bose (INA)',
            keywords: ['quit india', 'subhas chandra bose', 'ina', 'indian national army', 'do or die', 'வெள்ளையனே வெளியேறு', 'நேதாஜி'],
            baseline_questions: ['inm-9', 'inm-10'],
          },
        ],
      },
      {
        topic_number: 4,
        macro_topic_name: 'Constitutional Developments & Independence',
        description: 'Government of India Acts, Cabinet Mission, Mountbatten Plan & Partition',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Cabinet Mission, Partition & Independence',
            keywords: ['cabinet mission', 'mountbatten plan', 'indian independence act', 'integration of states', 'sardar patel', 'சுதந்திரம்', 'இந்திய விடுதலை சட்டம்'],
            baseline_questions: ['inm-11', 'inm-12'],
          },
        ],
      },
    ],
  },
  {
    unit_number: 8,
    unit_name: 'Unit 8 — History, Culture, Heritage of Tamil Nadu',
    subject: 'TN Heritage & Culture',
    description: 'Sangam Literature, Ancient Archaeology, Thirukkural, Freedom Movement in TN and Dravidian Movement',
    macro_topics: [
      {
        topic_number: 1,
        macro_topic_name: 'Ancient Tamil Civilization & Sangam Age',
        description: 'Sangam Classics, Ancient Society, Keezhadi & Archaeological Excavations',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Sangam Literature & Ancient Tamil Society',
            keywords: ['sangam', 'ettuthogai', 'pathupattu', 'keezhadi', 'adichanallur', 'kodumanal', 'tholkappiyam', 'சங்க காலம்', 'கீழடி', 'தொல்பொருள்'],
            baseline_questions: ['tn-1', 'tn-2'],
          },
        ],
      },
      {
        topic_number: 2,
        macro_topic_name: 'Thirukkural — Cultural & Philosophical Guide',
        description: 'Secular Character, Universal Values & Governance Principles in Thirukkural',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Secular & Universal Philosophy in Thirukkural',
            keywords: ['thirukkural', 'thiruvalluvar', 'aram', 'porul', 'inbam', 'secular literature', 'universal value', 'திருக்குறள்', 'திருவள்ளுவர்'],
            baseline_questions: ['tn-3', 'tn-4'],
          },
        ],
      },
      {
        topic_number: 3,
        macro_topic_name: 'Freedom Struggle in Tamil Nadu',
        description: 'Early Resistance: Pulithevan, Velu Nachiyar, Kattabomman, VOC, Bharati & Kamarajar',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Early TN Leaders: Velu Nachiyar, Kattabomman & VOC',
            keywords: ['velu nachiyar', 'kattabomman', 'pulithevan', 'v.o. chidambaram', 'swadeshi steam navigation', 'bharathiar', 'வேலு நாச்சியார்', 'கட்டபொம்மன்', 'வ.உ.சி'],
            baseline_questions: ['tn-5', 'tn-6'],
          },
        ],
      },
      {
        topic_number: 4,
        macro_topic_name: 'Justice Party & Dravidian Movement',
        description: 'Reservation, Social Reform, Self-Respect Movement, Periyar & Anna',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Justice Party, Periyar & Social Justice',
            keywords: ['justice party', 'periyar', 'e.v.r', 'self respect movement', 'anna', 'c.n. annadurai', 'communal go', 'social justice', 'நீதிக்கட்சி', 'பெரியார்', 'அண்ணா', 'சமூக நீதி'],
            baseline_questions: ['tn-7', 'tn-8'],
          },
        ],
      },
    ],
  },
  {
    unit_number: 9,
    unit_name: 'Unit 9 — Development Administration in Tamil Nadu',
    subject: 'TN Administration',
    description: 'Human Development, Social Welfare Schemes, Education, Health & E-Governance in TN',
    macro_topics: [
      {
        topic_number: 1,
        macro_topic_name: 'State Administration & Public Delivery',
        description: 'District Administration, Secretariat & Public Service Delivery',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Administration & Public Service Machinery',
            keywords: ['administration', 'secretariat', 'district collector', 'revenue department', 'public service delivery', 'மாநில அரசு நிர்வாகம்', 'மாவட்ட ஆட்சியர்'],
            baseline_questions: ['adm-1', 'adm-2'],
          },
        ],
      },
      {
        topic_number: 2,
        macro_topic_name: 'Flagship Welfare Programs',
        description: 'Mid-Day Meal, Magalir Urimai, Pudhumai Penn, Moovalur Ramamirtham & Social Security',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Social Welfare Schemes & Direct Benefits',
            keywords: ['magalir urimai', 'pudhumai penn', 'mid day meal', 'breakfast scheme', 'welfare scheme', 'மகளிர் உரிமைத் தொகை', 'புதுமைப் பெண் திட்டம்', 'மதிய உணவு'],
            baseline_questions: ['adm-3', 'adm-4'],
          },
        ],
      },
      {
        topic_number: 3,
        macro_topic_name: 'Health System & Higher Education in TN',
        description: 'Human Development Index, Medical Infrastructure, Gross Enrolment Ratio & Reforms',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Health System & Higher Education Metrics in TN',
            keywords: ['human development index', 'hdi', 'phc', 'maternal mortality', 'higher education', 'gross enrolment ratio', 'கல்வி', 'சுகாதாரம்', 'மனித மேம்பாட்டு குறியீடு'],
            baseline_questions: ['adm-5', 'adm-6'],
          },
        ],
      },
      {
        topic_number: 4,
        macro_topic_name: 'E-Governance & Economic Geography',
        description: 'TNeGA, Digital Governance, SIPCOT, TIDCO & Industrial Clusters',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'E-Governance & Industrial Corridors in TN',
            keywords: ['e-governance', 'tnega', 'digital tamil nadu', 'meesevai', 'sipcot', 'tidco', 'industrial corridor', 'மின் ஆளுமை', 'தொழில்துறை'],
            baseline_questions: ['adm-7', 'adm-8'],
          },
        ],
      },
    ],
  },
  {
    unit_number: 10,
    unit_name: 'Unit 10 — Aptitude & Mental Ability',
    subject: 'Aptitude & Mental Ability',
    description: 'Simplification, Percentage, Ratio, Time & Work, Logical Reasoning & Data Interpretation',
    macro_topics: [
      {
        topic_number: 1,
        macro_topic_name: 'Percentage, Ratio & Proportion',
        description: 'Percentage, Ratio & Proportion, Simple & Compound Interest, Profit & Loss',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Percentage, Ratio & Interest',
            keywords: ['percentage', 'ratio', 'proportion', 'simple interest', 'compound interest', 'profit', 'loss', 'சதவீதம்', 'விகிதம்', 'தனிவட்டி', 'கூட்டுவட்டி'],
            baseline_questions: ['apt-1', 'apt-2', 'apt-3'],
          },
        ],
      },
      {
        topic_number: 2,
        macro_topic_name: 'Time, Work & Mensuration',
        description: 'Time & Work, Pipes & Cisterns, Speed, Distance & Mensuration (Area/Volume)',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Time, Work & Mensuration (Area/Volume)',
            keywords: ['time and work', 'pipes and cisterns', 'speed', 'area', 'perimeter', 'volume', 'நேரம் மற்றும் வேலை', 'பரப்பளவு', 'கனஅளவு'],
            baseline_questions: ['apt-4', 'apt-5'],
          },
        ],
      },
      {
        topic_number: 3,
        macro_topic_name: 'Logical Reasoning & Series',
        description: 'Number Series, Alpha-Numeric Puzzles, Dice & Visual Reasoning',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Logical Reasoning, Series & Puzzles',
            keywords: ['number series', 'reasoning', 'puzzle', 'dice', 'alphabet series', 'coding decoding', 'தருக்க அறிவு', 'எண் தொடர்'],
            baseline_questions: ['apt-6', 'apt-7'],
          },
        ],
      },
      {
        topic_number: 4,
        macro_topic_name: 'Data Interpretation',
        description: 'Tables, Bar Graphs, Pie Charts & Mean/Median/Mode',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Charts, Graphs & Data Interpretation',
            keywords: ['data interpretation', 'pie chart', 'bar graph', 'table', 'mean', 'median', 'mode', 'average', 'வரைபடம்', 'சராசரி'],
            baseline_questions: ['apt-8', 'apt-9'],
          },
        ],
      },
    ],
  },
]

/**
 * Unit 11: General Tamil (Group 2/2A and Group 4 only, when student selects Tamil)
 */
export const UNIT_11_GENERAL_TAMIL = {
  unit_number: 11,
  unit_name: 'Unit 11 — பொதுத் தமிழ் (General Tamil)',
  subject: 'General Tamil',
  description: 'இலக்கணம், இலக்கியம், தமிழ் அறிஞர்களும் தமிழ்த் தொண்டும் (Part A - 100 Questions for Group 2/4)',
  macro_topics: [
    {
      topic_number: 1,
      macro_topic_name: 'இலக்கணம் (Grammar)',
      description: 'பொருத்துதல், பிரித்து எழுதுதல், எதிர்ச்சொல், பிழை திருத்தம் & சந்திப்பிழை',
      micro_topics: [
        {
          micro_topic_number: 1,
          micro_topic_name: 'பொருத்துதல் & பிரித்து எழுதுதல்',
          keywords: ['பொருத்துதல்', 'பிரித்தெழுதுக', 'சேர்த்தெழுதுக', 'வேர்ச்சொல்', 'இலக்கணக் குறிப்பு', 'வழுவுச்சொல்'],
          baseline_questions: ['tam-1', 'tam-2'],
        },
        {
          micro_topic_number: 2,
          micro_topic_name: 'எதிர்ச்சொல் & பிழை திருத்தம்',
          keywords: ['எதிர்ச்சொல்', 'பிழை திருத்தம்', 'சந்திப்பிழை', 'ஒருமை பன்மை', 'மரபுத்தொடர்'],
          baseline_questions: ['tam-3', 'tam-4'],
        },
      ],
    },
    {
      topic_number: 2,
      macro_topic_name: 'இலக்கியம் (Literature)',
      description: 'திருக்குறள், நாலடியார், சிலப்பதிகாரம், மணிமேகலை, கம்பராமாயணம் & சிற்றிலக்கியங்கள்',
      micro_topics: [
        {
          micro_topic_number: 1,
          micro_topic_name: 'திருக்குறள் & நாலடியார்',
          keywords: ['திருக்குறள்', 'நாலடியார்', 'பதினெண்கீழ்க்கணக்கு', 'நான்மணிக்கடிகை', 'அறநூல்கள்'],
          baseline_questions: ['tam-5', 'tam-6'],
        },
        {
          micro_topic_number: 2,
          micro_topic_name: 'சிலப்பதிகாரம் & மணிமேகலை',
          keywords: ['சிலப்பதிகாரம்', 'மணிமேகலை', 'ஐம்பெருங்காப்பியம்', 'கண்ணகி', 'கோவலன்', 'சீவக சிந்தாமணி'],
          baseline_questions: ['tam-7', 'tam-8'],
        },
      ],
    },
    {
      topic_number: 3,
      macro_topic_name: 'தமிழ் அறிஞர்களும் தமிழ்த் தொண்டும்',
      description: 'பாரதியார், பாரதிதாசன், நாமக்கல் கவிஞர், ஜி.யு.போப் & உரைநடை ஆசிரியர்கள்',
      micro_topics: [
        {
          micro_topic_number: 1,
          micro_topic_name: 'பாரதியார், பாரதிதாசன் & நாமக்கல் கவிஞர்',
          keywords: ['பாரதியார்', 'பாரதிதாசன்', 'நாமக்கல் கவிஞர்', 'கவிமணி', 'கண்ணதாசன்', 'உவமைக் கவிஞர் சுரதா'],
          baseline_questions: ['tam-9', 'tam-10'],
        },
        {
          micro_topic_number: 2,
          micro_topic_name: 'ஜி.யு.போப், வீரமாமுனிவர் & தமிழ் உரைநடை',
          keywords: ['ஜி.யு.போப்', 'வீரமாமுனிவர்', 'கால்டுவெல்', 'உ.வே.சா', 'பரிதிமாற்கலைஞர்', 'மறைமலையடிகள்'],
          baseline_questions: ['tam-11', 'tam-12'],
        },
      ],
    },
  ],
}

/**
 * Unit 11: General English (Group 2/2A and Group 4 only, when student selects English)
 */
export const UNIT_11_GENERAL_ENGLISH = {
  unit_number: 11,
  unit_name: 'Unit 11 — General English',
  subject: 'General English',
  description: 'Grammar, Prescribed Poems, Literary Works, Figures of Speech & Comprehension (Part A for Group 2/4)',
  macro_topics: [
    {
      topic_number: 1,
      macro_topic_name: 'Grammar',
      description: 'Active & Passive Voice, Question Tags, Tenses, Articles, Prepositions & Degrees of Comparison',
      micro_topics: [
        {
          micro_topic_number: 1,
          micro_topic_name: 'Active & Passive Voice',
          keywords: ['active voice', 'passive voice', 'transitive', 'intransitive', 'voice change'],
          baseline_questions: ['eng-1', 'eng-2'],
        },
        {
          micro_topic_number: 2,
          micro_topic_name: 'Question Tags',
          keywords: ['question tag', 'tag questions', 'auxiliary', 'tense', 'articles', 'prepositions'],
          baseline_questions: ['eng-3', 'eng-4'],
        },
      ],
    },
    {
      topic_number: 2,
      macro_topic_name: 'Prescribed Poems',
      description: 'Sea Fever, The Comet, A Poison Tree, Stopping by Woods, Life & Poem Analysis',
      micro_topics: [
        {
          micro_topic_number: 1,
          micro_topic_name: 'Sea Fever',
          keywords: ['sea fever', 'john masefield', 'tall ship', 'sea-gulls', 'vagrant gypsy life'],
          baseline_questions: ['eng-5', 'eng-6'],
        },
        {
          micro_topic_number: 2,
          micro_topic_name: 'The Comet',
          keywords: ['the comet', 'norman littleford', 'rampage', 'heavens', 'tail behind'],
          baseline_questions: ['eng-7', 'eng-8'],
        },
      ],
    },
    {
      topic_number: 3,
      macro_topic_name: 'Authors & Literary Works',
      description: 'Figures of Speech, Literary Devices, Famous Speeches & Biographical Sketches',
      micro_topics: [
        {
          micro_topic_number: 1,
          micro_topic_name: 'Figures of Speech & Literary Devices',
          keywords: ['metaphor', 'simile', 'alliteration', 'personification', 'oxymoron', 'rhyme scheme'],
          baseline_questions: ['eng-9', 'eng-10'],
        },
      ],
    },
  ],
}

/**
 * Safe division helper returning 0 when denominator is 0, capped at 100 for coverage.
 */
function calcPercentage(numerator, denominator, capAt100 = false) {
  const num = Number(numerator) || 0
  const den = Number(denominator) || 0
  if (den <= 0 || num <= 0) return 0
  const pct = (num / den) * 100
  const bounded = capAt100 ? Math.min(100, pct) : pct
  return Number(bounded.toFixed(1))
}

/**
 * Normalize string for resilient matching
 */
function norm(str) {
  return String(str || '').trim().toLowerCase()
}

function clean(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Helper to determine if a candidate macro topic aligns with the canonical unit subject,
 * preventing cross-subject contamination (e.g. History topics leaking into General Science).
 */
function isMacroTopicSubjectAligned(macroTopicName, unitNumber, unitSubject) {
  const mNorm = norm(macroTopicName)
  const mClean = clean(macroTopicName)
  const sNorm = norm(unitSubject)

  const canonicalUnit = CANONICAL_SYLLABUS_TAXONOMY.find(u => u.unit_number === unitNumber)
  if (canonicalUnit) {
    const isMatchingCanonical = canonicalUnit.macro_topics.some(cm => {
      const cmClean = clean(cm.macro_topic_name)
      return cmClean === mClean || cmClean.includes(mClean) || mClean.includes(cmClean)
    })
    if (isMatchingCanonical) return true
  }

  if (unitNumber === 1 || sNorm.includes('science')) {
    // General Science: must strictly not contain History, Polity, Geography, Movement, Economy, Aptitude, Language
    if (/history|ancient|medieval|indus|vedic|delhi|mughal|vijayanagar|bahmani|maratha|chola|pallava|pandya|sangam|thirukkural|heritage|freedom|national\s*movement|congress|gandhi|revolt|1857|polity|constitution|preamble|parliament|judiciary|governor|panchayat|court|writs|economy|gdp|rbi|banking|planning|fiscal|budget|gst|tamil\s*nadu\s*admin|e-governance|welfare|aptitude|math|reasoning|simplification|percentage|hcf|lcm|ratio|interest|tamil|english|language/i.test(mNorm)) {
      return false
    }
    return /physics|chemistry|biology|science|matter|force|motion|heat|light|electricity|element|acid|base|cell|human|disease|nutrition|ecosystem|ecology|environment|universe/i.test(mNorm)
  }

  if (unitNumber === 3 || sNorm.includes('geography')) {
    if (/history|polity|constitution|movement|freedom|revolt|physics|chemistry|biology|blood|cell|vitamin|acid|ancient|medieval|chola|pallava|delhi|mughal|vijayanagar|sangam/i.test(mNorm)) {
      return false
    }
    return true
  }

  if (unitNumber === 4 || sNorm.includes('history')) {
    if (/physics|chemistry|biology|science|cell|monsoon|river|plateau|soil|mineral|aptitude|math|geometry/i.test(mNorm)) {
      return false
    }
    return true
  }

  if (unitNumber === 5 || sNorm.includes('polity')) {
    if (/science|physics|chemistry|biology|monsoon|river|plateau|chola|pallava|ancient|indus|vedic/i.test(mNorm)) {
      return false
    }
    return true
  }

  return true
}

export const syllabusAnalyticsService = {
  /**
   * Builds the full 3-level hierarchy (Unit -> Macro-Topic -> Micro-Topic) for a given exam/group,
   * dynamically loading:
   * - TNPSC Group 1: Strictly 10 units (Units 1-10, NO Language Unit).
   * - TNPSC Group 2 & 2A: 10 units + Unit 11 (General Tamil OR General English based on student choice).
   * - TNPSC Group 4: 10 units + Unit 11 (General Tamil OR General English).
   */
  async buildHierarchy(examName = 'TNPSC Group 4', options = {}) {
    let dbExam = null
    let dbUnits = []
    let dbMicroTopics = []

    try {
      const { data: examData } = await supabase
        .from('syllabus_exams')
        .select('*')
        .eq('exam_name', examName)
        .maybeSingle()
      dbExam = examData

      if (dbExam?.id) {
        const { data: unitsData } = await supabase
          .from('syllabus_units')
          .select('*, syllabus_topics(*)')
          .eq('exam_id', dbExam.id)
          .order('unit_number', { ascending: true })
        dbUnits = unitsData || []
      }

      // Try fetching micro-topics if migration has been executed
      const { data: microData, error: microErr } = await supabase
        .from('syllabus_micro_topics')
        .select('*')
        .order('micro_topic_number', { ascending: true })
      if (!microErr && microData) {
        dbMicroTopics = microData
      }
    } catch (e) {
      console.warn('[SyllabusAnalytics] Using fallback taxonomy merge:', e)
    }

    const groupId = dbExam?.id || `group-${norm(examName).replace(/[^a-z0-9]+/g, '-')}`
    const microByMacroId = new Map()
    dbMicroTopics.forEach(mt => {
      if (!microByMacroId.has(mt.macro_topic_id)) microByMacroId.set(mt.macro_topic_id, [])
      microByMacroId.get(mt.macro_topic_id).push(mt)
    })

    // Determine exam characteristics:
    const normExam = norm(examName)
    const isGroup1 = normExam.includes('group1') || normExam.includes('group 1')
    const userPref = options.languagePreference || options.userLangPref ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('tnpsc_group2_language_pref') : null) || 'tamil'
    const isEnglishLanguage = norm(userPref).includes('eng')

    // Base taxonomy configuration:
    let baseUnits = [...CANONICAL_SYLLABUS_TAXONOMY]
    if (!isGroup1) {
      // Group 2/2A and Group 4 include Unit 11 Language based on student preference
      const unit11 = isEnglishLanguage ? UNIT_11_GENERAL_ENGLISH : UNIT_11_GENERAL_TAMIL
      baseUnits.push(unit11)
    }

    // Deduplicate dbUnits strictly by unit_number and merge their topics to prevent duplicate rows
    const unitMap = new Map()
    for (const u of dbUnits) {
      const num = u.unit_number
      if (!num) continue
      if (!unitMap.has(num)) {
        unitMap.set(num, { ...u, syllabus_topics: [...(u.syllabus_topics || [])] })
      } else {
        const existing = unitMap.get(num)
        const existingTopicIds = new Set(existing.syllabus_topics.map(t => t.id || t.topic_name))
        for (const t of (u.syllabus_topics || [])) {
          if (!existingTopicIds.has(t.id || t.topic_name)) {
            existing.syllabus_topics.push(t)
            existingTopicIds.add(t.id || t.topic_name)
          }
        }
      }
    }

    // Merge deduplicated DB unit data ONLY if unit name/subject matches
    const rawUnits = baseUnits.map((canonicalUnit, uIdx) => {
      const dbMatch = unitMap.get(canonicalUnit.unit_number)
      const isNameMatching = dbMatch && (
        norm(dbMatch.unit_name).includes(norm(canonicalUnit.subject)) ||
        norm(canonicalUnit.unit_name).includes(norm(dbMatch.unit_name)) ||
        norm(dbMatch.subject || '').includes(norm(canonicalUnit.subject))
      )
      if (dbMatch && isNameMatching) {
        return {
          ...canonicalUnit,
          ...dbMatch,
          unit_name: canonicalUnit.unit_name,
          syllabus_topics: (dbMatch.syllabus_topics && dbMatch.syllabus_topics.length > 0)
            ? dbMatch.syllabus_topics
            : canonicalUnit.macro_topics,
        }
      }
      return canonicalUnit
    })

    const hierarchyUnits = rawUnits.map((u, uIdx) => {
      const canonicalUnit = baseUnits.find(
        cu => cu.unit_number === u.unit_number || norm(cu.unit_name) === norm(u.unit_name)
      ) || baseUnits[uIdx % baseUnits.length]

      const unitId = u.id || `unit-${u.unit_number || uIdx + 1}`
      const unitName = canonicalUnit.unit_name
      const unitNumber = u.unit_number ?? canonicalUnit.unit_number ?? (uIdx + 1)

      // Derive macro topics strictly from official canonical taxonomy to prevent alien cross-subject topics or duplicates
      const canonicalMacros = canonicalUnit?.macro_topics || []
      const effectiveMacros = canonicalMacros.map((cm, cmIdx) => {
        const cmClean = clean(cm.macro_topic_name)
        const dbMatch = (u.syllabus_topics || []).find(mt => {
          const mClean = clean(mt.topic_name || mt.macro_topic_name || '')
          return mClean === cmClean || mClean.includes(cmClean) || cmClean.includes(mClean)
        })
        return {
          ...cm,
          id: dbMatch?.id || cm.id || `${unitId}-macro-${cm.topic_number || cmIdx + 1}`,
          topic_number: cm.topic_number || cmIdx + 1,
          macro_topic_name: cm.macro_topic_name,
        }
      })

      const macroTopics = effectiveMacros.map((mt, mIdx) => {
        const macroName = mt.macro_topic_name || mt.topic_name || `Topic ${mIdx + 1}`
        const macroId = mt.id || `${unitId}-macro-${mt.topic_number || mIdx + 1}`
        const macroNumber = mt.topic_number ?? (mIdx + 1)

        const canonicalMacro = canonicalUnit?.macro_topics?.[mIdx] || mt

        const dbMicrosForMacro = microByMacroId.get(macroId) || []
        const rawMicros = dbMicrosForMacro.length > 0
          ? dbMicrosForMacro
          : (canonicalMacro?.micro_topics || [
              {
                micro_topic_number: 1,
                micro_topic_name: `${macroName} — Core Concepts & Principles`,
                keywords: [norm(macroName)],
                baseline_questions: [`${macroId}-q1`, `${macroId}-q2`, `${macroId}-q3`],
              },
              {
                micro_topic_number: 2,
                micro_topic_name: `${macroName} — Applied PYQs & Case Studies`,
                keywords: [norm(macroName)],
                baseline_questions: [`${macroId}-q4`, `${macroId}-q5`],
              },
            ])

        const microTopics = rawMicros.map((mct, mcIdx) => {
          const canonicalMicro = canonicalMacro?.micro_topics?.[mcIdx]
          const microId = mct.id || `${macroId}-micro-${mct.micro_topic_number || mcIdx + 1}`
          const microName = mct.micro_topic_name || `Sub-topic ${mcIdx + 1}`

          return {
            micro_topic_id: microId,
            micro_topic_name: microName,
            micro_topic_number: mct.micro_topic_number ?? (mcIdx + 1),
            macro_topic_id: macroId,
            macro_topic_name: macroName,
            unit_id: unitId,
            unit_name: unitName,
            group_id: groupId,
            group_name: examName,
            keywords: mct.keywords || canonicalMicro?.keywords || [norm(microName), norm(macroName)],
            baseline_questions: canonicalMicro?.baseline_questions || [`${microId}-base-1`, `${microId}-base-2`, `${microId}-base-3`],
          }
        })

        return {
          macro_topic_id: macroId,
          macro_topic_name: macroName,
          macro_topic_number: macroNumber,
          description: mt.description || canonicalMacro?.description || '',
          unit_id: unitId,
          unit_name: unitName,
          group_id: groupId,
          group_name: examName,
          micro_topics: microTopics,
        }
      })

      return {
        unit_id: unitId,
        unit_name: unitName,
        unit_number: unitNumber,
        subject: u.subject || canonicalUnit?.subject || unitName,
        description: u.description || canonicalUnit?.description || '',
        group_id: groupId,
        group_name: examName,
        macro_topics: macroTopics,
      }
    })

    return {
      group_id: groupId,
      group_name: examName,
      units: hierarchyUnits,
    }
  },

  /**
   * Classifies any question into a specific Micro-Topic node in the hierarchy.
   * Inspects explicit taxonomy IDs/names first, then falls back to keyword/subject matching.
   */
  classifyQuestionToMicroTopic(question, allMicroTopics) {
    if (!allMicroTopics || allMicroTopics.length === 0) return null

    // Extract taxonomy tag from explanation if present: [Taxonomy: Unit > Macro > Micro]
    let explUnit = null
    let explMacro = null
    let explMicro = null
    if (question.explanation && typeof question.explanation === 'string') {
      const match = question.explanation.match(/\[Taxonomy:\s*([^>\]]+)(?:>\s*([^>\]]+))?(?:>\s*([^\]]+))?\]/i)
      if (match) {
        explUnit = match[1]?.trim() || null
        explMacro = match[2]?.trim() || null
        explMicro = match[3]?.trim() || null
      }
    }

    const targetMicro = question.micro_topic_name || explMicro
    const targetMacro = question.macro_topic_name || explMacro
    const targetUnit = question.unit_name || explUnit

    // 1. Direct match by micro_topic_id or micro_topic_name
    if (question.micro_topic_id) {
      const exactId = allMicroTopics.find(m => m.micro_topic_id === question.micro_topic_id)
      if (exactId) return exactId
    }
    if (targetMicro) {
      const exactName = allMicroTopics.find(m => norm(m.micro_topic_name) === norm(targetMicro))
      if (exactName) return exactName
      const partialName = allMicroTopics.find(m =>
        norm(m.micro_topic_name).includes(norm(targetMicro)) || norm(targetMicro).includes(norm(m.micro_topic_name))
      )
      if (partialName) return partialName
    }

    // 2. Match by macro_topic_id or unit/macro-topic constraint + keyword scoring
    const candidatePool = (() => {
      if (question.macro_topic_id) {
        const byMacroId = allMicroTopics.filter(m => m.macro_topic_id === question.macro_topic_id)
        if (byMacroId.length > 0) return byMacroId
      }

      // Constrain search pool strictly to targeted unit if known
      const rawUnitText = (targetUnit || question.unit_name || question.unit_tag || question.subject || question.papers?.subject || '').toLowerCase()
      const uClean = clean(rawUnitText)

      let targetUnitNumber = null
      if (uClean.includes('unit1') || (uClean.includes('science') && !uClean.includes('social')) || /physics|chemistry|biology/.test(rawUnitText)) targetUnitNumber = 1
      else if (uClean.includes('unit2') || uClean.includes('current') || /events|affairs|schemes/.test(rawUnitText)) targetUnitNumber = 2
      else if (uClean.includes('unit3') || uClean.includes('geography') || /river|monsoon|climate|soil/.test(rawUnitText)) targetUnitNumber = 3
      else if (uClean.includes('unit4') || (uClean.includes('history') && !uClean.includes('tamil')) || /ancient|medieval|chola|pallava|delhi|mughal/.test(rawUnitText)) targetUnitNumber = 4
      else if (uClean.includes('unit5') || uClean.includes('polity') || /constitution|preamble|parliament|judiciary/.test(rawUnitText)) targetUnitNumber = 5
      else if (uClean.includes('unit6') || uClean.includes('economy') || /rbi|banking|planning|gdp|fiscal/.test(rawUnitText)) targetUnitNumber = 6
      else if (uClean.includes('unit7') || uClean.includes('movement') || /inm|congress|gandhi|freedom|revolt/.test(rawUnitText)) targetUnitNumber = 7
      else if (uClean.includes('unit8') || uClean.includes('heritage') || /thirukkural|sangam|dravidian|self-respect/.test(rawUnitText)) targetUnitNumber = 8
      else if (uClean.includes('unit9') || uClean.includes('administration') || /development|human development|e-governance/.test(rawUnitText)) targetUnitNumber = 9
      else if (uClean.includes('unit10') || uClean.includes('aptitude') || /mental ability|reasoning|simplification|percentage|hcf|lcm/.test(rawUnitText)) targetUnitNumber = 10
      else if (uClean.includes('unit11') || uClean.includes('tamil') || uClean.includes('english') || uClean.includes('language')) targetUnitNumber = 11

      if (targetUnitNumber) {
        const byUnit = allMicroTopics.filter(m => {
          const mNum = m.unit_number || (m.unit_name && parseInt(m.unit_name.replace(/[^0-9]/g, ''), 10))
          if (mNum === targetUnitNumber) return true
          const mClean = clean(m.unit_name)
          if (targetUnitNumber === 1 && mClean.includes('science')) return true
          if (targetUnitNumber === 2 && (mClean.includes('current') || mClean.includes('events'))) return true
          if (targetUnitNumber === 3 && mClean.includes('geography')) return true
          if (targetUnitNumber === 4 && mClean.includes('history')) return true
          if (targetUnitNumber === 5 && mClean.includes('polity')) return true
          if (targetUnitNumber === 6 && mClean.includes('economy')) return true
          if (targetUnitNumber === 7 && mClean.includes('movement')) return true
          if (targetUnitNumber === 8 && (mClean.includes('heritage') || mClean.includes('culture'))) return true
          if (targetUnitNumber === 9 && mClean.includes('administration')) return true
          if (targetUnitNumber === 10 && mClean.includes('aptitude')) return true
          if (targetUnitNumber === 11 && (mClean.includes('tamil') || mClean.includes('english') || mClean.includes('language'))) return true
          return false
        })

        if (byUnit.length > 0) {
          if (targetMacro) {
            const mClean = clean(targetMacro)
            const byMacro = byUnit.filter(m => clean(m.macro_topic_name).includes(mClean) || mClean.includes(clean(m.macro_topic_name)))
            if (byMacro.length > 0) return byMacro
          }
          return byUnit
        }
      }

      const topicHint = norm(targetMacro || question.topic || question.subject || question.papers?.subject)
      if (topicHint) {
        const byTopicHint = allMicroTopics.filter(
          m => norm(m.macro_topic_name).includes(topicHint) ||
               topicHint.includes(norm(m.macro_topic_name)) ||
               clean(m.unit_name).includes(clean(topicHint)) ||
               clean(topicHint).includes(clean(m.unit_name))
        )
        if (byTopicHint.length > 0) return byTopicHint
      }
      return allMicroTopics
    })()

    const searchBlob = norm([
      question.question_text,
      question.option_a,
      question.option_b,
      question.option_c,
      question.option_d,
      question.explanation,
      question.topic,
      question.subject,
      question.papers?.subject,
      question.papers?.title,
    ].filter(Boolean).join(' '))

    let bestMicro = null
    let bestScore = 0

    for (const micro of candidatePool) {
      let score = 0
      for (const kw of (micro.keywords || [])) {
        if (kw && searchBlob.includes(norm(kw))) {
          score += kw.length > 5 ? 3 : 2
        }
      }
      if (score > bestScore) {
        bestScore = score
      }
      if (score > 0 && score === bestScore) {
        bestMicro = micro
      }
    }

    if (bestMicro && bestScore > 0) return bestMicro

    // Deterministic hash fallback within candidatePool so the same question always maps to the same micro-topic
    const idStr = String(question.id || question.question_text || 'q')
    let hash = 0
    for (let i = 0; i < idStr.length; i++) {
      hash = ((hash << 5) - hash + idStr.charCodeAt(i)) | 0
    }
    const idx = Math.abs(hash) % candidatePool.length
    return candidatePool[idx]
  },

  /**
   * Fetches the full Interactive Syllabus hierarchy along with real-time Coverage (%) and Accuracy (%)
   * at every level (Micro-Topic -> Macro-Topic -> Unit -> Exam Summary).
   * Fully accounts for mock exam attempts, quick recall answers, and targeted practice sessions.
   */
  async getSyllabusWithAnalytics(userId, examName = 'TNPSC Group 4', options = {}) {
    console.log(`[SyllabusAnalytics] === STARTING getSyllabusWithAnalytics ===`)
    console.log(`[SyllabusAnalytics] userId: ${userId}, examName: "${examName}"`)
    
    // 1. Build 3-level hierarchy dynamically based on exam and user preference
    const hierarchy = await this.buildHierarchy(examName, options)
    const allMicroTopics = hierarchy.units.flatMap(u =>
      u.macro_topics.flatMap(mt => mt.micro_topics)
    )

    // Map micro_topic_id -> aggregation buckets
    const microBuckets = new Map()
    allMicroTopics.forEach(mt => {
      const bankSet = new Set(mt.baseline_questions || [])
      microBuckets.set(mt.micro_topic_id, {
        bankQuestionIds: bankSet,
        attemptedQuestionIds: new Set(),
        totalAttempts: 0,
        correctAttempts: 0,
      })
    })

    const questionToMicroMap = new Map()
    const textToQuestionIdMap = new Map()

    // Register fallback recall pool questions into the bank
    FALLBACK_RECALL_POOL.forEach(fq => {
      const matchedMicro = this.classifyQuestionToMicroTopic(fq, allMicroTopics)
      if (matchedMicro) {
        const bucket = microBuckets.get(matchedMicro.micro_topic_id)
        if (bucket) {
          bucket.bankQuestionIds.add(String(fq.id))
          questionToMicroMap.set(String(fq.id), matchedMicro.micro_topic_id)
          if (fq.question_text) {
            textToQuestionIdMap.set(norm(fq.question_text), String(fq.id))
          }
        }
      }
    })

    // 2. Fetch questions from DB & user progress/attempts in parallel (unpacks all 5 promises)
    // IMPORTANT: Filter attempts, practice sessions, and recall sessions by examName to ensure
    // each exam group (Group 1, Group 2/2A, Group 4) shows ONLY its own data
    const normExamName = norm(examName)
    const [
      dbQuestionsRes,
      dbRecallQuestionsRes,
      userAttemptsRes,
      userRecallSessionsRes,
      userPracticeSessionsRes,
    ] = await Promise.allSettled([
      supabase
        .from('questions')
        .select('id, paper_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, unit_name, macro_topic_name, micro_topic_name, papers(id, title, subject, exam_name, status)')
        .limit(1000)
        .then(res => {
          if (res.error) {
            return supabase
              .from('questions')
              .select('id, paper_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, papers(id, title, subject, exam_name, status)')
              .limit(1000)
          }
          return res
        }),
      supabase
        .from('recall_questions')
        .select('id, question_text, subject, topic, exam_context, is_active')
        .eq('is_active', true)
        .limit(500),
      userId
        ? supabase
            .from('attempts')
            .select('id, paper_id, status, papers(id, title, subject, exam_name), attempt_answers(id, question_id, selected_option, is_correct)')
            .eq('user_id', userId)
            .in('status', ['completed', 'submitted'])
            .order('started_at', { ascending: false })
            .limit(100)
        : Promise.resolve({ data: [] }),
      userId
        ? supabase
            .from('quick_recall_sessions')
            .select('id, exam_context, questions_json, completed, quick_recall_answers(id, question_index, question_text, selected_answer, is_correct)')
            .eq('user_id', userId)
            .eq('exam_context', examName)
            .limit(100)
        : Promise.resolve({ data: [] }),
      userId
        ? supabase
            .from('practice_sessions')
            .select('id, exam_context, subject, questions_json, answers_json, status')
            .eq('user_id', userId)
            .eq('exam_context', examName)
            .eq('status', 'completed')
            .limit(100)
        : Promise.resolve({ data: [] }),
    ])

    // Process DB questions into the Question Bank
    const dbQuestions = dbQuestionsRes.status === 'fulfilled' ? (dbQuestionsRes.value.data || []) : []
    console.log(`[SyllabusAnalytics] Loaded ${dbQuestions.length} questions from database`)
    
    dbQuestions.forEach(q => {
      const qId = String(q.id)
      const matchedMicro = this.classifyQuestionToMicroTopic(q, allMicroTopics)
      if (matchedMicro) {
        const bucket = microBuckets.get(matchedMicro.micro_topic_id)
        if (bucket) {
          bucket.bankQuestionIds.add(qId)
          questionToMicroMap.set(qId, matchedMicro.micro_topic_id)
          if (q.question_text) {
            textToQuestionIdMap.set(norm(q.question_text), qId)
          }
        }
      }
    })
    console.log(`[SyllabusAnalytics] Mapped ${questionToMicroMap.size} questions to micro-topics`)

    // Process Recall Questions into the Question Bank
    const dbRecallQuestions = dbRecallQuestionsRes.status === 'fulfilled' ? (dbRecallQuestionsRes.value.data || []) : []
    dbRecallQuestions.forEach(rq => {
      const rqId = `rq-${rq.id}`
      const matchedMicro = this.classifyQuestionToMicroTopic(rq, allMicroTopics)
      if (matchedMicro) {
        const bucket = microBuckets.get(matchedMicro.micro_topic_id)
        if (bucket) {
          bucket.bankQuestionIds.add(rqId)
          questionToMicroMap.set(rqId, matchedMicro.micro_topic_id)
          if (rq.question_text) {
            textToQuestionIdMap.set(norm(rq.question_text), rqId)
          }
        }
      }
    })

    // 3. Process User Test Submissions & Attempt Logs
    // Filter attempts by exam_name to ensure each exam group shows only its own data
    const userAttempts = userAttemptsRes.status === 'fulfilled' ? (userAttemptsRes.value.data || []) : []
    
    console.log(`[SyllabusAnalytics] Filtering ${userAttempts.length} attempts for exam: "${examName}"`)
    userAttempts.forEach((att, idx) => {
      console.log(`  Attempt ${idx + 1}: exam_name="${att.papers?.exam_name}", title="${att.papers?.title}"`)
    })
    
    const filteredAttempts = userAttempts.filter(attempt => {
      if (!attempt.papers) return false
      
      // Use clean() to remove ALL special chars and spaces for proper matching
      const attemptExamName = clean(attempt.papers.exam_name || '')
      const attemptTitle = clean(attempt.papers.title || '')
      
      // Check both exam_name and title (for custom uploads that may not have exam_name set)
      const attemptText = attemptExamName + attemptTitle
      const cleanExamName = clean(examName)
      
      console.log(`  Checking: "${attemptText}" against "${cleanExamName}"`)
      
      // After clean(), all spaces/dashes removed: "Group 4" -> "group4", "Group-4" -> "group4"
      
      // Match Group 1 (cleaned: "group1")
      if (cleanExamName.includes('group1')) {
        const match = attemptText.includes('group1')
        console.log(`    Group 1 check: ${match} for "${attempt.papers?.title}"`)
        return match
      }
      // Match Group 2/2A (cleaned: "group2" or "group2a" or "group22a")
      if (cleanExamName.includes('group2')) {
        const match = attemptText.includes('group2') || attemptText.includes('group2a') || attemptText.includes('group22a')
        console.log(`    Group 2/2A check: ${match} for "${attempt.papers?.title}"`)
        return match
      }
      // Match Group 4 (cleaned: "group4")
      if (cleanExamName.includes('group4')) {
        const match = attemptText.includes('group4')
        console.log(`    Group 4 check: ${match} for "${attempt.papers?.title}"`)
        return match
      }
      return false
    })
    
    console.log(`[SyllabusAnalytics] Filtered to ${filteredAttempts.length} attempts for "${examName}"`)
    console.log(`[SyllabusAnalytics] Included attempts:`, filteredAttempts.map(a => a.papers?.title))
    
    let attemptsCounter = 0
    let skippedNoSelection = 0
    let skippedNoMicroId = 0
    let skippedNoBucket = 0
    
    filteredAttempts.forEach(attempt => {
      const answers = attempt.attempt_answers || []
      console.log(`  Processing attempt with ${answers.length} answers`)
      answers.forEach(ans => {
        const qId = String(ans.question_id)
        
        // Count ALL questions that exist in attempt_answers, regardless of whether they were answered
        // This handles cases where selected_option wasn't saved properly
        let microId = questionToMicroMap.get(qId)

        if (!microId) {
          const fallbackMicro = this.classifyQuestionToMicroTopic(
            { id: qId, subject: attempt.papers?.subject, papers: attempt.papers },
            allMicroTopics
          )
          if (fallbackMicro) {
            microId = fallbackMicro.micro_topic_id
            questionToMicroMap.set(qId, microId)
          } else {
            skippedNoMicroId++
          }
        }

        if (microId && microBuckets.has(microId)) {
          const bucket = microBuckets.get(microId)
          bucket.bankQuestionIds.add(qId)
          bucket.attemptedQuestionIds.add(qId)
          bucket.totalAttempts += 1
          attemptsCounter += 1
          
          // Only count as correct if actually answered correctly
          if (ans.is_correct === true) {
            bucket.correctAttempts += 1
          }
        } else if (microId && !microBuckets.has(microId)) {
          skippedNoBucket++
        }
      })
    })
    console.log(`[SyllabusAnalytics] Added ${attemptsCounter} attempt answers from filtered attempts`)
    console.log(`[SyllabusAnalytics] Skipped: ${skippedNoMicroId} no classification, ${skippedNoBucket} no bucket`)

    // 4. Process Quick Recall Answers
    const recallSessions = userRecallSessionsRes.status === 'fulfilled' ? (userRecallSessionsRes.value.data || []) : []
    console.log(`[SyllabusAnalytics] Processing ${recallSessions.length} quick_recall_sessions for "${examName}"`)
    let recallCounter = 0
    recallSessions.forEach(session => {
      const answers = session.quick_recall_answers || []
      answers.forEach(ans => {
        let microId = null
        if (ans.question_text) {
          const qId = textToQuestionIdMap.get(norm(ans.question_text))
          if (qId) microId = questionToMicroMap.get(qId)
        }
        if (!microId && ans.question_text) {
          const matched = this.classifyQuestionToMicroTopic({ question_text: ans.question_text }, allMicroTopics)
          if (matched) microId = matched.micro_topic_id
        }

        if (microId && microBuckets.has(microId)) {
          const bucket = microBuckets.get(microId)
          bucket.totalAttempts += 1
          recallCounter += 1
          if (ans.is_correct === true) {
            bucket.correctAttempts += 1
          }
        }
      })
    })
    console.log(`[SyllabusAnalytics] Added ${recallCounter} recall answers`)

    // 4b. Process Targeted Practice Sessions (Syncs unit mastery after targeted practice)
    const userPracticeSessions = userPracticeSessionsRes?.status === 'fulfilled' ? (userPracticeSessionsRes.value.data || []) : []
    console.log(`[SyllabusAnalytics] Processing ${userPracticeSessions.length} practice_sessions for "${examName}"`)
    let practiceCounter = 0
    userPracticeSessions.forEach(ps => {
      const qs = Array.isArray(ps.questions_json) ? ps.questions_json : []
      const ansMap = ps.answers_json || {}
      const answeredEntries = Object.entries(ansMap)
      if (answeredEntries.length === 0) return

      answeredEntries.forEach(([qId, userOpt]) => {
        if (!userOpt) return
        const strId = String(qId)
        const qMeta = qs.find(q => String(q.id) === strId)
        let microId = qMeta?.micro_topic_id || questionToMicroMap.get(strId)

        if (!microId) {
          const fallbackMicro = this.classifyQuestionToMicroTopic(
            { id: strId, subject: ps.subject, unit_name: ps.subject, ...(qMeta || {}) },
            allMicroTopics
          )
          if (fallbackMicro) {
            microId = fallbackMicro.micro_topic_id
            questionToMicroMap.set(strId, microId)
          }
        }

        if (microId && !microBuckets.has(microId)) {
          const found = allMicroTopics.find(m => m.micro_topic_id === microId || clean(m.micro_topic_name) === clean(microId))
          if (found && microBuckets.has(found.micro_topic_id)) {
            microId = found.micro_topic_id
          }
        }

        if (microId && microBuckets.has(microId)) {
          const bucket = microBuckets.get(microId)
          bucket.bankQuestionIds.add(strId)
          bucket.attemptedQuestionIds.add(strId)
          bucket.totalAttempts += 1
          practiceCounter += 1

          const qMeta = qs.find(q => String(q.id) === strId)
          const isCorrect = qMeta?.correct_option ? String(userOpt).toUpperCase() === String(qMeta.correct_option).toUpperCase() : false
          if (isCorrect) {
            bucket.correctAttempts += 1
          }
        }
      })
    })
    console.log(`[SyllabusAnalytics] Added ${practiceCounter} practice answers`)

    // 5. Roll-up Math: Micro -> Macro -> Unit -> Exam
    let examTotalQuestions = 0
    let examAttemptedQuestions = 0
    let examTotalAttempts = 0
    let examCorrectAttempts = 0

    const enrichedUnits = hierarchy.units.map(unit => {
      let unitTotalQuestions = 0
      let unitAttemptedQuestions = 0
      let unitTotalAttempts = 0
      let unitCorrectAttempts = 0

      const enrichedMacroTopics = unit.macro_topics.map(macro => {
        let macroTotalQuestions = 0
        let macroAttemptedQuestions = 0
        let macroTotalAttempts = 0
        let macroCorrectAttempts = 0

        const enrichedMicroTopics = macro.micro_topics.map(micro => {
          const bucket = microBuckets.get(micro.micro_topic_id) || {
            bankQuestionIds: new Set(micro.baseline_questions || []),
            attemptedQuestionIds: new Set(),
            totalAttempts: 0,
            correctAttempts: 0,
          }

          const totalQuestions = Math.max(bucket.bankQuestionIds.size, bucket.attemptedQuestionIds.size, 1)
          const attemptedQuestions = bucket.attemptedQuestionIds.size
          const totalAttempts = bucket.totalAttempts
          const correctAttempts = bucket.correctAttempts

          const coveragePct = calcPercentage(attemptedQuestions, totalQuestions, true)
          const accuracyPct = calcPercentage(correctAttempts, totalAttempts)

          macroTotalQuestions += totalQuestions
          macroAttemptedQuestions += attemptedQuestions
          macroTotalAttempts += totalAttempts
          macroCorrectAttempts += correctAttempts

          return {
            ...micro,
            total_questions: totalQuestions,
            attempted_questions: attemptedQuestions,
            total_attempts: totalAttempts,
            correct_attempts: correctAttempts,
            coverage_percentage: coveragePct,
            accuracy_percentage: accuracyPct,
            status: accuracyPct >= 70 ? 'mastered' : totalAttempts > 0 && accuracyPct < 50 ? 'needs_review' : 'in_progress',
          }
        })

        const macroCoveragePct = calcPercentage(macroAttemptedQuestions, macroTotalQuestions, true)
        const macroAccuracyPct = calcPercentage(macroCorrectAttempts, macroTotalAttempts)

        unitTotalQuestions += macroTotalQuestions
        unitAttemptedQuestions += macroAttemptedQuestions
        unitTotalAttempts += macroTotalAttempts
        unitCorrectAttempts += macroCorrectAttempts

        return {
          ...macro,
          total_questions: macroTotalQuestions,
          attempted_questions: macroAttemptedQuestions,
          total_attempts: macroTotalAttempts,
          correct_attempts: macroCorrectAttempts,
          coverage_percentage: macroCoveragePct,
          accuracy_percentage: macroAccuracyPct,
          status: macroAccuracyPct >= 70 ? 'mastered' : macroTotalAttempts > 0 && macroAccuracyPct < 50 ? 'needs_review' : 'in_progress',
          micro_topics: enrichedMicroTopics,
        }
      })

      const unitCoveragePct = calcPercentage(unitAttemptedQuestions, unitTotalQuestions, true)
      const unitAccuracyPct = calcPercentage(unitCorrectAttempts, unitTotalAttempts)

      examTotalQuestions += unitTotalQuestions
      examAttemptedQuestions += unitAttemptedQuestions
      examTotalAttempts += unitTotalAttempts
      examCorrectAttempts += unitCorrectAttempts

      return {
        ...unit,
        total_questions: unitTotalQuestions,
        attempted_questions: unitAttemptedQuestions,
        total_attempts: unitTotalAttempts,
        correct_attempts: unitCorrectAttempts,
        coverage_percentage: unitCoveragePct,
        accuracy_percentage: unitAccuracyPct,
        status: unitAccuracyPct >= 70 ? 'mastered' : unitTotalAttempts > 0 && unitAccuracyPct < 50 ? 'weak_zone' : 'in_progress',
        macro_topics: enrichedMacroTopics,
      }
    })

    const overallCoveragePct = calcPercentage(examAttemptedQuestions, examTotalQuestions, true)
    const overallAccuracyPct = calcPercentage(examCorrectAttempts, examTotalAttempts)

    return {
      exam_name: examName,
      total_units: enrichedUnits.length,
      covered_units: enrichedUnits.length,
      total_questions: examTotalQuestions,
      attempted_questions: examAttemptedQuestions,
      total_attempts: examTotalAttempts,
      correct_attempts: examCorrectAttempts,
      coverage_percentage: overallCoveragePct,
      accuracy_percentage: overallAccuracyPct,
      units: enrichedUnits,
    }
  },
}
