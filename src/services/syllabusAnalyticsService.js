import { supabase } from '../lib/supabase'
import { FALLBACK_RECALL_POOL } from './tnpscService'

/**
 * Canonical 3-Level Taxonomy Blueprint (Unit -> Macro-Topic -> Micro-Topic)
 * Used to enrich database units/topics with granular Micro-Topics and keyword matchers
 * for both English and Tamil questions.
 */
export const CANONICAL_SYLLABUS_TAXONOMY = [
  {
    unit_number: 1,
    unit_name: 'General Studies',
    subject: 'General Studies',
    description: 'Core History, Polity, Geography, Economy, National Movement & Current Events',
    macro_topics: [
      {
        topic_number: 1,
        macro_topic_name: 'History of India',
        description: 'Ancient, Medieval & Cultural Heritage of India and Tamil Nadu',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Indus Valley Civilization & Vedic Period',
            keywords: ['indus', 'harappa', 'mohenjo', 'vedic', 'rigveda', 'lothal', 'சிந்து', 'ஹரப்பா', 'வேத'],
            baseline_questions: ['ivc-1', 'ivc-2', 'ivc-3', 'ivc-4', 'ivc-5'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Mauryan, Gupta & South Indian Empires (Chola, Pandya, Pallava)',
            keywords: ['maurya', 'ashoka', 'gupta', 'chola', 'pandya', 'pallava', 'thanjavur', 'brihadisvara', 'rajaraja', 'rajendra', 'sangam', 'சோழ', 'பாண்டிய', 'பல்லவ', 'சங்க', 'மௌரிய', 'தஞ்சை'],
            baseline_questions: ['pyq-2', 'emp-1', 'emp-2', 'emp-3', 'emp-4'],
          },
          {
            micro_topic_number: 3,
            micro_topic_name: 'Delhi Sultanate, Mughal Empire & Vijayanagar-Bahmani',
            keywords: ['sultanate', 'mughal', 'akbar', 'babur', 'aurangzeb', 'vijayanagar', 'krishnadevaraya', 'bahmani', 'maratha', 'shivaji', 'முகலாய', 'டெல்லி சுல்தான்', 'விஜயநகர'],
            baseline_questions: ['med-1', 'med-2', 'med-3', 'med-4'],
          },
        ],
      },
      {
        topic_number: 2,
        macro_topic_name: 'National Movement',
        description: 'Indian Freedom Struggle & Tamil Nadu Role in Freedom Movement',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: '1857 Revolt & Early Nationalist Movements',
            keywords: ['1857', 'sepoys', 'congress', 'moderates', 'extremists', 'partition of bengal', 'swadeshi', 'புரட்சி', 'காங்கிரஸ்', 'சுதேசி'],
            baseline_questions: ['inm-1', 'inm-2', 'inm-3', 'inm-4'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Gandhian Era, Non-Cooperation, Civil Disobedience & Quit India',
            keywords: ['gandhi', 'non-cooperation', 'dandi', 'quit india', 'poona pact', 'ambedkar', 'khudai khidmatgar', 'ghaffar khan', 'bose', 'ina', 'காந்தி', 'வெள்ளையனே வெளியேறு', 'பூனா'],
            baseline_questions: ['pyq-4', 'syn-4', 'inm-5', 'inm-6', 'inm-7'],
          },
          {
            micro_topic_number: 3,
            micro_topic_name: 'Tamil Nadu Freedom Fighters & Social Reformers',
            keywords: ['chidambaram', 'kappalottiya', 'bharati', 'bharathiar', 'periyar', 'evr', 'kamaraj', 'rajaji', 'velu nachiyar', 'kattabomman', 'tiruppur kumaran', 'justice party', 'வ.உ.சி', 'பாரதியார்', 'பெரியார்', 'காமராஜர்', 'கட்டபொம்மன்', 'வேலுநாச்சியார்'],
            baseline_questions: ['pyq-6', 'tnm-1', 'tnm-2', 'tnm-3', 'tnm-4'],
          },
        ],
      },
      {
        topic_number: 3,
        macro_topic_name: 'Geography of India',
        description: 'Physical Features, Climate, Rivers, Soil & Resources of India and Tamil Nadu',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Physical Features, Location & Climate of India',
            keywords: ['tropic of cancer', 'himalaya', 'monsoon', 'western ghats', 'eastern ghats', 'latitude', 'longitude', 'island', 'plateau', 'இமயமலை', 'மேற்கு தொடர்ச்சி', 'பருவமழை', 'கடகரேகை'],
            baseline_questions: ['pyq-5', 'geo-1', 'geo-2', 'geo-3'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Rivers, Water Resources & Drainage Systems',
            keywords: ['river', 'ganga', 'godavari', 'dakshin ganga', 'cauvery', 'kaveri', 'krishna', 'vaigai', 'tamirabarani', 'dam', 'tributary', 'ஆறு', 'காவிரி', 'கோதாவரி', 'வைகை', 'தாமிரபரணி'],
            baseline_questions: ['syn-5', 'geo-4', 'geo-5', 'geo-6'],
          },
          {
            micro_topic_number: 3,
            micro_topic_name: 'Soils, Agriculture, Minerals & Population Geography',
            keywords: ['soil', 'alluvial', 'black soil', 'crop', 'agriculture', 'mineral', 'coal', 'census', 'population', 'literacy', 'மண்', 'வேளாண்மை', 'மக்கள் தொகை'],
            baseline_questions: ['geo-7', 'geo-8', 'geo-9'],
          },
        ],
      },
      {
        topic_number: 4,
        macro_topic_name: 'Indian Polity',
        description: 'Constitution of India, Fundamental Rights, Union & State Executive, Judiciary & Local Governance',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Preamble, Fundamental Rights, DPSP & Fundamental Duties',
            keywords: ['preamble', 'fundamental right', 'fundamental duties', 'dpsp', 'article 14', 'article 17', 'article 19', 'article 21', 'article 32', 'writs', 'swaran singh', 'untouchability', 'அடிப்படை உரிமை', 'அடிப்படை கடமை', 'முகவுரை', 'விதி'],
            baseline_questions: ['pyq-3', 'pyq-7', 'pol-1', 'pol-2', 'pol-3'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Union & State Legislature, President, Parliament & Governor',
            keywords: ['president', 'parliament', 'lok sabha', 'rajya sabha', 'nominated', 'prime minister', 'governor', 'chief minister', 'speaker', 'money bill', 'குடியரசுத் தலைவர்', 'பாராளுமன்றம்', 'ஆளுநர்', 'மக்களவை', 'மாநிலங்களவை'],
            baseline_questions: ['syn-6', 'pol-4', 'pol-5', 'pol-6'],
          },
          {
            micro_topic_number: 3,
            micro_topic_name: 'Constitutional Bodies, Panchayati Raj & Amendments',
            keywords: ['finance commission', 'article 280', 'election commission', 'cag', 'upsc', 'panchayat', '73rd', '74th', 'balwant rai', 'sarkaria', 'amendment', 'supreme court', 'high court', 'நிதி ஆணையம்', 'தேர்தல் ஆணையம்', 'பஞ்சாயத்து', 'சட்டத்திருத்தம்'],
            baseline_questions: ['pyq-1', 'pol-7', 'pol-8', 'pol-9'],
          },
        ],
      },
      {
        topic_number: 5,
        macro_topic_name: 'Indian Economy',
        description: 'Planning, RBI, Fiscal Policy, Banking, Poverty Alleviation & TN Economy',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'National Income, NITI Aayog & Five-Year Plans',
            keywords: ['gdp', 'gnp', 'national income', 'niti aayog', 'planning commission', 'five year plan', 'per capita', 'தேசிய வருமானம்', 'நிதி ஆயோக்', 'ஐந்தாண்டு திட்டம்'],
            baseline_questions: ['eco-1', 'eco-2', 'eco-3', 'eco-4'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Reserve Bank of India, Monetary Policy, GST & Banking',
            keywords: ['rbi', 'reserve bank', 'repo rate', 'inflation', 'gst', 'tax', 'fiscal', 'budget', 'bank', 'nabard', 'ரிசர்வ் வங்கி', 'பணவீக்கம்', 'ஜிஎஸ்டி', 'வங்கி'],
            baseline_questions: ['eco-5', 'eco-6', 'eco-7'],
          },
          {
            micro_topic_number: 3,
            micro_topic_name: 'Social Welfare Schemes & Tamil Nadu Economic Development',
            keywords: ['welfare', 'poverty', 'employment', 'mgnrega', 'magalir', 'pudhumai penn', 'human development', 'hdi', 'tn economy', 'சமூக நல', 'மகளிர்', 'புதுமைப் பெண்', 'வறுமை'],
            baseline_questions: ['eco-8', 'eco-9', 'eco-10'],
          },
        ],
      },
      {
        topic_number: 6,
        macro_topic_name: 'Current Events',
        description: 'National & International Events, Government Schemes, Awards, Sports & Space',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'National & Tamil Nadu Government Schemes & Policies',
            keywords: ['scheme', 'policy', 'portal', 'mission', 'initiative', 'chief minister', 'tamil nadu government', 'திட்டம்', 'நடப்பு நிகழ்வு'],
            baseline_questions: ['ca-1', 'ca-2', 'ca-3', 'ca-4'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Science & Tech, ISRO Missions, Defence & International Summits',
            keywords: ['isro', 'satellite', 'chandrayaan', 'gaganyaan', 'aditya', 'summit', 'g20', 'brics', 'award', 'nobel', 'sports', 'olympic', 'இஸ்ரோ', 'சந்திரயான்', 'விருது'],
            baseline_questions: ['ca-5', 'ca-6', 'ca-7'],
          },
        ],
      },
    ],
  },
  {
    unit_number: 2,
    unit_name: 'General Science',
    subject: 'General Science',
    description: 'Physics, Chemistry, Biology, Human Health & Environment and Ecology',
    macro_topics: [
      {
        topic_number: 1,
        macro_topic_name: 'Physics',
        description: 'Mechanics, Light, Sound, Electricity, Magnetism & Universe',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Universe, Solar System, Mechanics & Properties of Matter',
            keywords: ['planet', 'solar system', 'density', 'force', 'newton', 'gravity', 'motion', 'pressure', 'energy', 'work', 'கோள்', 'சூரிய குடும்பம்', 'ஈர்ப்பு', 'விசை'],
            baseline_questions: ['syn-1', 'phy-1', 'phy-2', 'phy-3'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Light, Sound, Heat, Electricity & Nuclear Physics',
            keywords: ['light', 'lens', 'mirror', 'refraction', 'sound', 'frequency', 'electric', 'ohm', 'current', 'magnetic', 'nuclear', 'laser', 'ஒளி', 'ஒலி', 'மின்சாரம்', 'காந்தம்'],
            baseline_questions: ['phy-4', 'phy-5', 'phy-6'],
          },
        ],
      },
      {
        topic_number: 2,
        macro_topic_name: 'Chemistry',
        description: 'Elements, Compounds, Acids, Bases, Salts & Everyday Chemistry',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Elements, Periodic Table, Acids, Bases & Salts',
            keywords: ['acid', 'base', 'salt', 'ph', 'element', 'periodic', 'atom', 'electron', 'oxidation', 'chemical', 'அமிலம்', 'காரம்', 'உப்பு', 'தனிமம்'],
            baseline_questions: ['chem-1', 'chem-2', 'chem-3', 'chem-4'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Fertilizers, Polymers, Metals & Chemistry in Daily Life',
            keywords: ['fertilizer', 'polymer', 'plastic', 'metal', 'alloy', 'carbon', 'petroleum', 'soap', 'உரம்', 'உலோகம்', 'கார்பன்'],
            baseline_questions: ['chem-5', 'chem-6', 'chem-7'],
          },
        ],
      },
      {
        topic_number: 3,
        macro_topic_name: 'Biology',
        description: 'Cell Biology, Human Physiology, Nutrition, Genetics & Diseases',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Human Organ Systems, Blood Circulation & Excretion',
            keywords: ['organ', 'kidney', 'heart', 'blood', 'liver', 'lung', 'brain', 'nervous', 'digestive', 'cell', 'genetics', 'dna', 'சிறுநீரகம்', 'இதயம்', 'இரத்தம்', 'செல்'],
            baseline_questions: ['bio-1', 'bio-2', 'bio-3', 'bio-4'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Nutrition, Vitamins, Deficiency & Communicable Diseases',
            keywords: ['vitamin', 'sunlight', 'protein', 'carbohydrate', 'disease', 'virus', 'bacteria', 'vaccine', 'immunity', 'வைட்டமின்', 'நோய்', 'ஊட்டச்சத்து'],
            baseline_questions: ['syn-3', 'bio-5', 'bio-6', 'bio-7'],
          },
        ],
      },
      {
        topic_number: 4,
        macro_topic_name: 'Environment & Ecology',
        description: 'Biodiversity, Biosphere Reserves, Climate Change & Pollution Control',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Ecosystems, National Parks, Wildlife Sanctuaries & Biosphere Reserves',
            keywords: ['biosphere', 'nilgiri', 'sundarbans', 'mannar', 'national park', 'wildlife', 'sanctuary', 'biodiversity', 'wetland', 'ramsar', 'project tiger', 'உயிர்க்கோள', 'நீலகிரி', 'வனவிலங்கு', 'தேசிய பூங்கா'],
            baseline_questions: ['syn-2', 'env-1', 'env-2', 'env-3'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Climate Change, Greenhouse Effect & Environmental Conventions',
            keywords: ['climate change', 'global warming', 'ozone', 'greenhouse', 'carbon footprint', 'pollution', 'kyoto', 'paris agreement', 'cop', 'புவி வெப்பமடைதல்', 'ஓசோன்', 'மாசுபாடு'],
            baseline_questions: ['env-4', 'env-5', 'env-6'],
          },
        ],
      },
    ],
  },
  {
    unit_number: 3,
    unit_name: 'Aptitude & Mental Ability',
    subject: 'Aptitude',
    description: 'Quantitative Aptitude, Logical Reasoning & Data Analysis',
    macro_topics: [
      {
        topic_number: 1,
        macro_topic_name: 'Simplification',
        description: 'BODMAS, Fractions, Decimals, Square Roots & Algebraic Identities',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'BODMAS, Fractions, Surds & Algebraic Simplification',
            keywords: ['simplify', 'simplification', 'bodmas', 'fraction', 'square root', 'cube root', 'value of', 'சுருக்குக', 'வர்க்கமூலம்'],
            baseline_questions: ['apt-1', 'apt-2', 'apt-3'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'HCF & LCM of Numbers',
            keywords: ['hcf', 'lcm', 'greatest common', 'least common', 'divisible', 'remainder', 'மீ.பொ.வ', 'மீ.சி.ம'],
            baseline_questions: ['apt-4', 'apt-5', 'apt-6'],
          },
        ],
      },
      {
        topic_number: 2,
        macro_topic_name: 'Percentage',
        description: 'Percentage Calculations, Profit & Loss, Simple & Compound Interest',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Percentage, Profit & Loss and Discount',
            keywords: ['percentage', 'percent', '%', 'profit', 'loss', 'cost price', 'selling price', 'discount', 'சதவீதம்', 'இலாபம்', 'நட்டம்'],
            baseline_questions: ['apt-7', 'apt-8', 'apt-9'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Simple Interest (SI) & Compound Interest (CI)',
            keywords: ['simple interest', 'compound interest', 'principal', 'rate of interest', 'per annum', 'தனிவட்டி', 'கூட்டுவட்டி', 'அசல்'],
            baseline_questions: ['apt-10', 'apt-11', 'apt-12'],
          },
        ],
      },
      {
        topic_number: 3,
        macro_topic_name: 'Ratio & Proportion',
        description: 'Ratios, Proportions, Time & Work, Ages and Partnerships',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Ratio, Proportion, Ages & Mixtures',
            keywords: ['ratio', 'proportion', 'age', 'father and son', 'mixture', 'partnership', 'விகிதம்', 'விகிதாச்சாரம்', 'வயது'],
            baseline_questions: ['apt-13', 'apt-14', 'apt-15'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Time & Work, Pipes & Cisterns and Time-Speed-Distance',
            keywords: ['time and work', 'days to complete', 'efficiency', 'pipe', 'cistern', 'train', 'speed', 'distance', 'காலமும் வேலையும்', 'வேகம்'],
            baseline_questions: ['apt-16', 'apt-17', 'apt-18'],
          },
        ],
      },
      {
        topic_number: 4,
        macro_topic_name: 'Number Series',
        description: 'Arithmetic, Geometric, Missing Number & Logical Reasoning Series',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Missing Number Series, AP & GP Progressions',
            keywords: ['series', 'next in the series', 'missing number', 'sequence', 'nth term', 'arithmetic progression', 'தொடர்', 'விடுபட்ட எண்'],
            baseline_questions: ['ns-1', 'ns-2', 'ns-3', 'ns-4'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Coding-Decoding, Puzzles, Dice & Visual Reasoning',
            keywords: ['coding', 'decoding', 'puzzle', 'dice', 'alphanumeric', 'blood relation', 'direction', 'குறியீடு', 'பகடை'],
            baseline_questions: ['ns-5', 'ns-6', 'ns-7'],
          },
        ],
      },
      {
        topic_number: 5,
        macro_topic_name: 'Data Interpretation',
        description: 'Tables, Bar Charts, Pie Charts, Area & Volume Mensuration',
        micro_topics: [
          {
            micro_topic_number: 1,
            micro_topic_name: 'Tabulation, Bar Graphs, Pie Charts & Averages',
            keywords: ['average', 'mean', 'median', 'chart', 'pie', 'graph', 'table', 'data interpretation', 'சராசரி', 'வரைபடம்'],
            baseline_questions: ['di-1', 'di-2', 'di-3'],
          },
          {
            micro_topic_number: 2,
            micro_topic_name: 'Mensuration — Area, Perimeter, Surface Area & Volume (2D/3D)',
            keywords: ['area', 'perimeter', 'volume', 'cylinder', 'cone', 'sphere', 'triangle', 'rectangle', 'circle', 'radius', 'பரப்பளவு', 'சுற்றளவு', 'கனஅளவு'],
            baseline_questions: ['di-4', 'di-5', 'di-6'],
          },
        ],
      },
    ],
  },
]

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

export const syllabusAnalyticsService = {
  /**
   * Builds the full 3-level hierarchy (Unit -> Macro-Topic -> Micro-Topic) for a given exam/group,
   * merging live database units/topics/micro-topics with the canonical taxonomy blueprint.
   */
  async buildHierarchy(examName = 'TNPSC Group 4') {
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

      // Try fetching micro-topics if migration 00006 has been executed
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

    // If database has units for this exam, enrich them with micro-topics
    const rawUnits = dbUnits.length > 0 ? dbUnits : CANONICAL_SYLLABUS_TAXONOMY

    const hierarchyUnits = rawUnits.map((u, uIdx) => {
      const canonicalUnit = CANONICAL_SYLLABUS_TAXONOMY.find(
        cu => norm(cu.unit_name) === norm(u.unit_name) || cu.unit_number === u.unit_number
      ) || CANONICAL_SYLLABUS_TAXONOMY[uIdx % CANONICAL_SYLLABUS_TAXONOMY.length]

      const unitId = u.id || `unit-${u.unit_number || uIdx + 1}`
      const unitName = u.unit_name || canonicalUnit.unit_name
      const unitNumber = u.unit_number ?? canonicalUnit.unit_number ?? (uIdx + 1)

      const rawMacros = (u.syllabus_topics && u.syllabus_topics.length > 0)
        ? [...u.syllabus_topics].sort((a, b) => (a.topic_number || 0) - (b.topic_number || 0))
        : (canonicalUnit?.macro_topics || [])

      const macroTopics = rawMacros.map((mt, mIdx) => {
        const macroName = mt.topic_name || mt.macro_topic_name || `Topic ${mIdx + 1}`
        const macroId = mt.id || `${unitId}-macro-${mt.topic_number || mIdx + 1}`
        const macroNumber = mt.topic_number ?? (mIdx + 1)

        // Find matching canonical macro-topic for rich micro-topics and keyword matchers
        const canonicalMacro = canonicalUnit?.macro_topics?.find(
          cm => norm(cm.macro_topic_name) === norm(macroName) ||
                norm(macroName).includes(norm(cm.macro_topic_name)) ||
                norm(cm.macro_topic_name).includes(norm(macroName))
        ) || canonicalUnit?.macro_topics?.[mIdx]

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

    // 1. Direct match by micro_topic_id or micro_topic_name
    if (question.micro_topic_id) {
      const exactId = allMicroTopics.find(m => m.micro_topic_id === question.micro_topic_id)
      if (exactId) return exactId
    }
    if (question.micro_topic_name) {
      const exactName = allMicroTopics.find(m => norm(m.micro_topic_name) === norm(question.micro_topic_name))
      if (exactName) return exactName
    }

    // 2. Match by macro_topic_id or macro_topic_name + keyword scoring
    const candidatePool = (() => {
      if (question.macro_topic_id) {
        const byMacroId = allMicroTopics.filter(m => m.macro_topic_id === question.macro_topic_id)
        if (byMacroId.length > 0) return byMacroId
      }
      const topicHint = norm(question.macro_topic_name || question.topic || question.subject || question.papers?.subject)
      if (topicHint) {
        const byTopicHint = allMicroTopics.filter(
          m => norm(m.macro_topic_name).includes(topicHint) ||
               topicHint.includes(norm(m.macro_topic_name)) ||
               norm(m.unit_name).includes(topicHint)
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
        bestMicro = micro
      }
    }

    if (bestMicro) return bestMicro

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
   */
  async getSyllabusWithAnalytics(userId, examName = 'TNPSC Group 4') {
    // 1. Build 3-level hierarchy
    const hierarchy = await this.buildHierarchy(examName)
    const allMicroTopics = hierarchy.units.flatMap(u =>
      u.macro_topics.flatMap(mt => mt.micro_topics)
    )

    // Map micro_topic_id -> aggregation buckets
    const microBuckets = new Map()
    allMicroTopics.forEach(mt => {
      const bankSet = new Set(mt.baseline_questions || [])
      microBuckets.set(mt.micro_topic_id, {
        bankQuestionIds: bankSet,          // Set of unique question IDs in bank for this micro-topic
        attemptedQuestionIds: new Set(),   // Set of unique question IDs attempted by user
        totalAttempts: 0,                  // Total answered attempts in this micro-topic
        correctAttempts: 0,                // Total correct answers in this micro-topic
      })
    })

    // Map question_id -> micro_topic_id and normalized question_text -> question_id
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

    // 2. Fetch questions from DB (questions + recall_questions) & user progress/attempts in parallel
    const [
      dbQuestionsRes,
      dbRecallQuestionsRes,
      userAttemptsRes,
      userRecallSessionsRes,
      userProgressRes,
    ] = await Promise.allSettled([
      supabase
        .from('questions')
        .select('id, paper_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, papers(id, title, subject, exam_name, status)')
        .limit(1000),
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
            .order('started_at', { ascending: false })
            .limit(100)
        : Promise.resolve({ data: [] }),
      userId
        ? supabase
            .from('quick_recall_sessions')
            .select('id, exam_context, questions_json, completed, quick_recall_answers(id, question_index, question_text, selected_answer, is_correct)')
            .eq('user_id', userId)
            .limit(100)
        : Promise.resolve({ data: [] }),
      userId
        ? supabase
            .from('user_syllabus_progress')
            .select('*')
            .eq('user_id', userId)
        : Promise.resolve({ data: [] }),
    ])

    // Process DB questions into the Question Bank
    const dbQuestions = dbQuestionsRes.status === 'fulfilled' ? (dbQuestionsRes.value.data || []) : []
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

    // 3. Process User Test Submissions & Attempt Logs (Mock Tests, BYOP Papers, PYQ Papers)
    const userAttempts = userAttemptsRes.status === 'fulfilled' ? (userAttemptsRes.value.data || []) : []
    userAttempts.forEach(attempt => {
      const answers = attempt.attempt_answers || []
      answers.forEach(ans => {
        // Only count questions actually attempted (where user selected an option)
        if (!ans.selected_option) return

        const qId = String(ans.question_id)
        let microId = questionToMicroMap.get(qId)

        // If question wasn't in initial batch, classify using paper subject
        if (!microId) {
          const fallbackMicro = this.classifyQuestionToMicroTopic(
            { id: qId, subject: attempt.papers?.subject, papers: attempt.papers },
            allMicroTopics
          )
          if (fallbackMicro) {
            microId = fallbackMicro.micro_topic_id
            questionToMicroMap.set(qId, microId)
          }
        }

        if (microId && microBuckets.has(microId)) {
          const bucket = microBuckets.get(microId)
          // Ensure question is registered in bankQuestionIds so attempted <= total_questions always holds
          bucket.bankQuestionIds.add(qId)
          // Deduplicate attempted question IDs via Set (avoids coverage > 100%)
          bucket.attemptedQuestionIds.add(qId)
          // Increment total attempts & correct answers for Accuracy calculation
          bucket.totalAttempts += 1
          if (ans.is_correct === true) {
            bucket.correctAttempts += 1
          }
        }
      })
    })

    // 4. Process Quick Recall Answers into Topic Analytics
    const recallSessions = userRecallSessionsRes.status === 'fulfilled' ? (userRecallSessionsRes.value.data || []) : []
    recallSessions.forEach(session => {
      const answers = session.quick_recall_answers || []
      const qsJson = Array.isArray(session.questions_json) ? session.questions_json : []

      answers.forEach(ans => {
        if (!ans.selected_answer) return
        const qSnap = qsJson[ans.question_index] || {}
        const qTextNorm = norm(ans.question_text || qSnap.question_text)
        let qId = (qSnap.id && String(qSnap.id)) || textToQuestionIdMap.get(qTextNorm) || `qr-q-${qTextNorm.slice(0, 32)}`

        let microId = questionToMicroMap.get(qId)
        if (!microId) {
          const matchedMicro = this.classifyQuestionToMicroTopic(
            { id: qId, question_text: ans.question_text || qSnap.question_text, subject: qSnap.subject },
            allMicroTopics
          )
          if (matchedMicro) {
            microId = matchedMicro.micro_topic_id
            questionToMicroMap.set(qId, microId)
          }
        }

        if (microId && microBuckets.has(microId)) {
          const bucket = microBuckets.get(microId)
          bucket.bankQuestionIds.add(qId)
          bucket.attemptedQuestionIds.add(qId)
          bucket.totalAttempts += 1
          if (ans.is_correct === true) {
            bucket.correctAttempts += 1
          }
        }
      })
    })

    // Manual topic status map (from user_syllabus_progress)
    const progressRows = userProgressRes.status === 'fulfilled' ? (userProgressRes.value.data || []) : []
    const manualProgressMap = Object.fromEntries(progressRows.map(p => [p.topic_id, p]))

    // 5. Compute Bottom-Up & Roll-Up Aggregations (Micro-Topic -> Macro-Topic -> Unit -> Exam)
    const examBankSet = new Set()
    const examAttemptedSet = new Set()
    let examTotalAttempts = 0
    let examCorrectAttempts = 0

    const enrichedUnits = hierarchy.units.map(unit => {
      const unitBankSet = new Set()
      const unitAttemptedSet = new Set()
      let unitTotalAttempts = 0
      let unitCorrectAttempts = 0

      const enrichedMacros = unit.macro_topics.map(macro => {
        const macroBankSet = new Set()
        const macroAttemptedSet = new Set()
        let macroTotalAttempts = 0
        let macroCorrectAttempts = 0

        const enrichedMicros = macro.micro_topics.map(micro => {
          const bucket = microBuckets.get(micro.micro_topic_id) || {
            bankQuestionIds: new Set(),
            attemptedQuestionIds: new Set(),
            totalAttempts: 0,
            correctAttempts: 0,
          }

          // Roll up sets into Macro, Unit, and Exam
          bucket.bankQuestionIds.forEach(id => {
            macroBankSet.add(id)
            unitBankSet.add(id)
            examBankSet.add(id)
          })
          bucket.attemptedQuestionIds.forEach(id => {
            macroAttemptedSet.add(id)
            unitAttemptedSet.add(id)
            examAttemptedSet.add(id)
          })

          macroTotalAttempts += bucket.totalAttempts
          macroCorrectAttempts += bucket.correctAttempts
          unitTotalAttempts += bucket.totalAttempts
          unitCorrectAttempts += bucket.correctAttempts
          examTotalAttempts += bucket.totalAttempts
          examCorrectAttempts += bucket.correctAttempts

          const totalQuestions = bucket.bankQuestionIds.size
          const attemptedQuestions = bucket.attemptedQuestionIds.size
          const totalAttempts = bucket.totalAttempts
          const correctQuestions = bucket.correctAttempts

          const coveragePct = calcPercentage(attemptedQuestions, totalQuestions, true)
          const accuracyPct = calcPercentage(correctQuestions, totalAttempts, true)

          return {
            ...micro,
            total_questions: totalQuestions,
            attempted_questions: attemptedQuestions,
            total_attempts: totalAttempts,
            correct_questions: correctQuestions,
            coverage_percentage: coveragePct,
            accuracy_percentage: accuracyPct,
          }
        })

        const macroTotalQuestions = macroBankSet.size
        const macroAttemptedQuestions = macroAttemptedSet.size
        const macroCoveragePct = calcPercentage(macroAttemptedQuestions, macroTotalQuestions, true)
        const macroAccuracyPct = calcPercentage(macroCorrectAttempts, macroTotalAttempts, true)

        const manualProg = manualProgressMap[macro.macro_topic_id]

        return {
          ...macro,
          status: manualProg?.status || (macroCoveragePct >= 80 ? 'completed' : macroCoveragePct > 0 ? 'in_progress' : 'not_started'),
          total_questions: macroTotalQuestions,
          attempted_questions: macroAttemptedQuestions,
          total_attempts: macroTotalAttempts,
          correct_questions: macroCorrectAttempts,
          coverage_percentage: macroCoveragePct,
          accuracy_percentage: macroAccuracyPct,
          micro_topics: enrichedMicros,
        }
      })

      const unitTotalQuestions = unitBankSet.size
      const unitAttemptedQuestions = unitAttemptedSet.size
      const unitCoveragePct = calcPercentage(unitAttemptedQuestions, unitTotalQuestions, true)
      const unitAccuracyPct = calcPercentage(unitCorrectAttempts, unitTotalAttempts, true)

      return {
        ...unit,
        total_questions: unitTotalQuestions,
        attempted_questions: unitAttemptedQuestions,
        total_attempts: unitTotalAttempts,
        correct_questions: unitCorrectAttempts,
        coverage_percentage: unitCoveragePct,
        accuracy_percentage: unitAccuracyPct,
        macro_topics: enrichedMacros,
      }
    })

    const overallTotalQuestions = examBankSet.size
    const overallAttemptedQuestions = examAttemptedSet.size
    const overallCoveragePct = calcPercentage(overallAttemptedQuestions, overallTotalQuestions, true)
    const overallAccuracyPct = calcPercentage(examCorrectAttempts, examTotalAttempts, true)

    return {
      group_id: hierarchy.group_id,
      group_name: hierarchy.group_name,
      total_questions: overallTotalQuestions,
      attempted_questions: overallAttemptedQuestions,
      total_attempts: examTotalAttempts,
      correct_questions: examCorrectAttempts,
      coverage_percentage: overallCoveragePct,
      accuracy_percentage: overallAccuracyPct,
      units: enrichedUnits,
      manualProgressMap,
    }
  },
}
