import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Search, Sparkles, BookMarked, ArrowRight } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../hooks/useAuth'
import { syllabusAnalyticsService } from '../../services/syllabusAnalyticsService'

/**
 * Standard 10-Unit TNPSC Syllabus matching reference design (media_1791895213021_25551e0d.jpg)
 * and interactive prototype (media_1791890577135_4c9ee280.html).
 */
export const SYLLABUS_UNITS = [
  {
    unit_number: 1,
    unit_name: 'Unit 1 — General Science',
    displayName: 'General Science',
    score: 0,
    meta: 'Science basics · 4 topics',
    desc: 'Physics, chemistry, biology and everyday science concepts commonly used in TNPSC preparation.',
    foundationTopics: [
      { id: 'u1-t1', name: 'Physics — Motion & Force', status: 'Needs Review' },
      { id: 'u1-t2', name: 'Chemistry — Acids, Bases & Salts', status: 'Needs Review' },
    ],
    applicationTopics: [
      { id: 'u1-t3', name: 'Biology — Human Systems', status: 'Needs Review' },
      { id: 'u1-t4', name: 'Environment — Ecology Basics', status: 'Needs Review' },
    ]
  },
  {
    unit_number: 2,
    unit_name: 'Unit 2 — Current Events',
    displayName: 'Current Events',
    score: 0,
    meta: 'National & regional events · 4 topics',
    desc: 'History, national symbols, appointments, state profiles, awards, honors, sports and government welfare schemes.',
    foundationTopics: [
      { id: 'u2-t1', name: 'National & State Current Events', status: 'Needs Review' },
      { id: 'u2-t2', name: 'Government Welfare Schemes & Policies', status: 'Needs Review' },
    ],
    applicationTopics: [
      { id: 'u2-t3', name: 'Science, Technology & Defense Milestones', status: 'Needs Review' },
      { id: 'u2-t4', name: 'Awards, Honors & Sports Profiles', status: 'Needs Review' },
    ]
  },
  {
    unit_number: 3,
    unit_name: 'Unit 3 — Geography of India',
    displayName: 'Geography of India',
    score: 0,
    meta: 'Physical & human geography · 8 topics',
    desc: 'Location & physical features, monsoon, rainfall, weather, climate, water resources and rivers of India & Tamil Nadu.',
    foundationTopics: [
      { id: 'geo_himalayan_mountains', name: 'Himalayan Mountains', status: 'Needs Review' },
      { id: 'geo_peninsular_plateau', name: 'Peninsular Plateau', status: 'Needs Review' },
      { id: 'geo_coastal_plains', name: 'Coastal Plains', status: 'Needs Review' },
      { id: 'geo_elnino_lanina', name: 'El-Nino & La-Nina', status: 'Needs Review' },
    ],
    applicationTopics: [
      { id: 'geo_monsoon_mechanism', name: 'Indian Monsoon Mechanism', status: 'Needs Review' },
      { id: 'geo_himalayan_rivers', name: 'Himalayan Rivers (Ganga, Indus)', status: 'Needs Review' },
      { id: 'geo_tn_rivers', name: 'Tamil Nadu Rivers (Cauvery, Vaigai)', status: 'Needs Review' },
      { id: 'geo_water_resources', name: 'Water Resources & Climate Patterns', status: 'Needs Review' },
    ]
  },
  {
    unit_number: 4,
    unit_name: 'Unit 4 — History & Culture of India',
    displayName: 'History & Culture of India',
    score: 0,
    meta: 'Ancient & medieval India · 4 topics',
    desc: 'Indus Valley civilization, Guptas, Delhi Sultans, Mughals and Marathas, Age of Vijayanagaram and Bahmani Kingdoms, South Indian history.',
    foundationTopics: [
      { id: 'u4-t1', name: 'Indus Valley Civilization & Vedic Period', status: 'Needs Review' },
      { id: 'u4-t2', name: 'Guptas, Delhi Sultanate & Mughals', status: 'Needs Review' },
    ],
    applicationTopics: [
      { id: 'u4-t3', name: 'South Indian History & Vijayanagar Empire', status: 'Needs Review' },
      { id: 'u4-t4', name: 'Social Harmony & Cultural Synthesis', status: 'Needs Review' },
    ]
  },
  {
    unit_number: 5,
    unit_name: 'Unit 5 — Indian Polity',
    displayName: 'Indian Polity',
    score: 0,
    meta: 'Constitution & governance · 4 topics',
    desc: 'Constitution of India, Preamble to the Constitution, Salient features of the Constitution, Union, State and Union Territory, Citizenship, Fundamental Rights, Fundamental Duties.',
    foundationTopics: [
      { id: 'u5-t1', name: 'Preamble, Fundamental Rights & Duties', status: 'Needs Review' },
      { id: 'u5-t2', name: 'Union Executive, Parliament & President', status: 'Needs Review' },
    ],
    applicationTopics: [
      { id: 'u5-t3', name: 'State Executive & Judiciary', status: 'Needs Review' },
      { id: 'u5-t4', name: 'Panchayati Raj & Constitutional Authorities', status: 'Needs Review' },
    ]
  },
  {
    unit_number: 6,
    unit_name: 'Unit 6 — Indian Economy',
    displayName: 'Indian Economy',
    score: 0,
    meta: 'Economy & planning · 4 topics',
    desc: 'Nature of Indian Economy, Five year plan models, Planning Commission and Niti Aayog, Sources of revenue, Reserve Bank of India, Fiscal Policy and Monetary Policy.',
    foundationTopics: [
      { id: 'u6-t1', name: 'Nature of Indian Economy & Planning Models', status: 'Needs Review' },
      { id: 'u6-t2', name: 'Banking, RBI & Monetary Policy', status: 'Needs Review' },
    ],
    applicationTopics: [
      { id: 'u6-t3', name: 'Public Finance, GST & Budgeting', status: 'Needs Review' },
      { id: 'u6-t4', name: 'Economic Reforms & Tamil Nadu Economy', status: 'Needs Review' },
    ]
  },
  {
    unit_number: 7,
    unit_name: 'Unit 7 — Indian National Movement',
    displayName: 'Indian National Movement',
    score: 0,
    meta: 'Freedom movement · 4 topics',
    desc: 'National renaissance, Early uprising against British rule, Indian National Congress, Emergence of leaders, Different modes of agitations.',
    foundationTopics: [
      { id: 'u7-t1', name: 'Early Uprisings & 1857 Revolt', status: 'Needs Review' },
      { id: 'u7-t2', name: 'Indian National Congress & Moderate Era', status: 'Needs Review' },
    ],
    applicationTopics: [
      { id: 'u7-t3', name: 'Gandhian Era & Mass Mobilization', status: 'Needs Review' },
      { id: 'u7-t4', name: 'Communalism, Partition & Independence', status: 'Needs Review' },
    ]
  },
  {
    unit_number: 8,
    unit_name: 'Unit 8 — History, Culture, Heritage of Tamil Nadu',
    displayName: 'History, Culture, Heritage of TN',
    score: 0,
    meta: 'Tamil heritage · 4 topics',
    desc: 'History of Tamil Society, Archaeological discoveries, Sangam literature to contemporary literature, Thirukkural, Role of Tamil Nadu in freedom struggle.',
    foundationTopics: [
      { id: 'u8-t1', name: 'Sangam Literature & Archaeological Finds', status: 'Needs Review' },
      { id: 'u8-t2', name: 'Thirukkural — Secular & Universal Ethics', status: 'Needs Review' },
    ],
    applicationTopics: [
      { id: 'u8-t3', name: 'Role of TN in Freedom Struggle', status: 'Needs Review' },
      { id: 'u8-t4', name: 'Self-Respect & Dravidian Movement', status: 'Needs Review' },
    ]
  },
  {
    unit_number: 9,
    unit_name: 'Unit 9 — Development Administration in Tamil Nadu',
    displayName: 'Development Administration in TN',
    score: 0,
    meta: 'State administration · 4 topics',
    desc: 'Human Development Indicators in Tamil Nadu, Social Justice and Social Harmony as Cornerstones of Socio-Economic Development, Education and Health systems.',
    foundationTopics: [
      { id: 'u9-t1', name: 'Human Development Indicators & Social Justice', status: 'Needs Review' },
      { id: 'u9-t2', name: 'Education & Health Delivery Systems', status: 'Needs Review' },
    ],
    applicationTopics: [
      { id: 'u9-t3', name: 'e-Governance & Administrative Reforms in TN', status: 'Needs Review' },
      { id: 'u9-t4', name: 'Welfare Schemes & Economic Geography of TN', status: 'Needs Review' },
    ]
  },
  {
    unit_number: 10,
    unit_name: 'Unit 10 — Aptitude & Mental Ability',
    displayName: 'Aptitude & Mental Ability',
    score: 0,
    meta: 'Aptitude & reasoning · 4 topics',
    desc: 'Simplification, Percentage, Highest Common Factor (HCF), Lowest Common Multiple (LCM), Ratio and Proportion, Simple interest, Compound interest, Time and Work, Logical Reasoning.',
    foundationTopics: [
      { id: 'u10-t1', name: 'Percentage, Ratio & Simple/Compound Interest', status: 'Needs Review' },
      { id: 'u10-t2', name: 'Time, Work & Mensuration', status: 'Needs Review' },
    ],
    applicationTopics: [
      { id: 'u10-t3', name: 'Logical Reasoning, Number Series & Puzzles', status: 'Needs Review' },
      { id: 'u10-t4', name: 'Data Interpretation & Graphs', status: 'Needs Review' },
    ]
  },
  {
    unit_number: 11,
    unit_name: 'Unit 11 — Language: General Tamil / General English',
    displayName: 'Language Paper (Part A)',
    score: 0,
    meta: 'Part A Language · 4 topics · Group 2/2A & Group 4',
    desc: 'General Tamil (இலக்கணம், இலக்கியம், தமிழ் அறிஞர்கள்) OR General English (Grammar, Prescribed Poems, Authors). Mandatory 100 questions for Group 2/2A and Group 4 (Not in Group 1).',
    foundationTopics: [
      { id: 'eng_active_passive', name: 'Active & Passive Voice / பொதுத்தமிழ் இலக்கணம்', status: 'Needs Review' },
      { id: 'eng_question_tags', name: 'Question Tags / பிரித்தெழுதுக & சேர்த்தெழுதுக', status: 'Needs Review' },
    ],
    applicationTopics: [
      { id: 'eng_sea_fever', name: 'Sea Fever / திருக்குறள் தொடர்பான செய்திகள்', status: 'Needs Review' },
      { id: 'eng_the_comet', name: 'The Comet / சிலப்பதிகாரம் & மணிமேகலை', status: 'Needs Review' },
    ]
  }
]

export function InteractiveSyllabusPanel({ isModal = false, onClose }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { selectedExam, toast } = useApp()
  const isGroup1 = selectedExam?.includes('Group 1')
  
  // Group 1 has 175 GS + 25 Aptitude (Units 1-10). Group 2/2A and Group 4 include Part A Language (Unit 11).
  const initialUnits = useMemo(() => {
    return SYLLABUS_UNITS.filter(u => {
      if (u.unit_number === 11 && isGroup1) return false
      return true
    })
  }, [isGroup1])

  const [activeUnitIdx, setActiveUnitIdx] = useState(0)
  const [unitData, setUnitData] = useState(initialUnits)
  const [searchQuery, setSearchQuery] = useState('')

  // Keep unitData in sync when exam context changes
  useEffect(() => {
    setUnitData(initialUnits)
    setActiveUnitIdx(0)
  }, [initialUnits])

  // Sync with live database attempts (strictly deduplicating by unit_number)
  useEffect(() => {
    let isCancelled = false
    async function syncLiveData() {
      if (!user?.id) {
        console.warn('[InteractiveSyllabus] No user logged in, skipping live sync')
        return
      }
      console.log('[InteractiveSyllabus] Fetching analytics for:', selectedExam)
      try {
        const liveAnalytics = await syllabusAnalyticsService.getSyllabusWithAnalytics(user.id, selectedExam)
        console.log('[InteractiveSyllabus] Live analytics received:', {
          exam: liveAnalytics?.exam_name,
          totalAttempts: liveAnalytics?.total_attempts,
          units: liveAnalytics?.units?.map(u => ({
            unit: u.unit_number,
            accuracy: u.accuracy_percentage,
            coverage: u.coverage_percentage,
            attempts: u.total_attempts
          }))
        })
        if (isCancelled || !liveAnalytics?.units?.length) return

        setUnitData(prevUnits => {
          return prevUnits.map(unit => {
            const liveMatch = liveAnalytics.units.find(lu => lu.unit_number === unit.unit_number)
            // If no match OR no attempts for this specific exam group, return default 0% data
            if (!liveMatch || liveMatch.total_attempts === 0) return unit

            const liveAccuracy = Math.round(liveMatch.accuracy_percentage || 0)
            const liveCoverage = Math.round(liveMatch.coverage_percentage || 0)
            
            // Only update if this unit actually has attempts for THIS exam group
            if (liveMatch.attempted_questions === 0) return unit
            
            const fLen = unit.foundationTopics.length
            return {
              ...unit,
              score: liveAccuracy,
              coverage: liveCoverage,
              meta: `${liveMatch.macro_topics?.length || unit.foundationTopics.length + unit.applicationTopics.length} topics · ${liveMatch.attempted_questions || 0}/${liveMatch.total_questions || 0} attempted`,
              foundationTopics: unit.foundationTopics.map((t, idx) => {
                const liveMacro = liveMatch.macro_topics?.[idx]
                if (!liveMacro || !liveMacro.total_attempts) return t
                const mScore = Number(liveMacro.accuracy_percentage || 0)
                const status = mScore >= 70 ? 'Mastered' : mScore < 50 ? 'Needs Review' : 'In Progress'
                return { ...t, status }
              }),
              applicationTopics: unit.applicationTopics.map((t, idx) => {
                const liveMacro = liveMatch.macro_topics?.[fLen + idx]
                if (!liveMacro || !liveMacro.total_attempts) return t
                const mScore = Number(liveMacro.accuracy_percentage || 0)
                const status = mScore >= 70 ? 'Mastered' : mScore < 50 ? 'Needs Review' : 'In Progress'
                return { ...t, status }
              })
            }
          })
        })
      } catch (err) {
        console.warn('[InteractiveSyllabus] Live sync background note:', err)
      }
    }

    syncLiveData()
    return () => { isCancelled = true }
  }, [user?.id, selectedExam])

  const activeUnit = unitData[activeUnitIdx] || unitData[0]
  const isWeakZone = activeUnit.score < 50
  const isMastered = activeUnit.score >= 70

  // Calculate dynamic roll-up summary KPIs
  const overallAccuracy = Math.round(unitData.reduce((acc, u) => acc + u.score, 0) / unitData.length)
  const overallCoverage = Math.round(unitData.reduce((acc, u) => acc + (u.coverage || 0), 0) / unitData.length)
  const strongUnits = unitData.filter(u => u.score >= 65).length
  const needsRevision = unitData.filter(u => u.score < 50 && (u.coverage || 0) > 0).length
  const unitsCovered = `${unitData.length} / ${unitData.length}`

  // Filter units by search query
  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim()) return unitData
    const q = searchQuery.toLowerCase().trim()
    return unitData.filter(u =>
      u.unit_name.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      u.desc.toLowerCase().includes(q) ||
      u.foundationTopics.some(t => t.name.toLowerCase().includes(q)) ||
      u.applicationTopics.some(t => t.name.toLowerCase().includes(q))
    )
  }, [unitData, searchQuery])

  // Toggle topic status between Mastered, Needs Review, In Progress
  function toggleTopicStatus(sectionKey, topicId) {
    setUnitData(prev => prev.map((u, idx) => {
      if (idx !== activeUnitIdx) return u

      const updateList = (list) => list.map(t => {
        if (t.id !== topicId) return t
        const nextStatus = t.status === 'Mastered'
          ? 'In Progress'
          : t.status === 'In Progress'
          ? 'Needs Review'
          : 'Mastered'
        return { ...t, status: nextStatus }
      })

      const newFoundation = sectionKey === 'foundation' ? updateList(u.foundationTopics) : u.foundationTopics
      const newApplication = sectionKey === 'application' ? updateList(u.applicationTopics) : u.applicationTopics

      // Recalculate unit score based on topics
      const allTopics = [...newFoundation, ...newApplication]
      const completedCount = allTopics.filter(t => t.status === 'Mastered').length
      const inProgressCount = allTopics.filter(t => t.status === 'In Progress').length
      const newScore = Math.round(((completedCount * 100) + (inProgressCount * 60)) / allTopics.length)

      return {
        ...u,
        score: newScore,
        foundationTopics: newFoundation,
        applicationTopics: newApplication,
      }
    }))
    toast?.success?.('Status updated')
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Mastered':
        return {
          label: 'Mastered',
          badgeClass: 'bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]',
          iconBox: 'bg-[#d1fae5] text-[#059669]',
          icon: '✓'
        }
      case 'Needs Review':
        return {
          label: 'Needs Review',
          badgeClass: 'bg-[#fff1f2] text-[#ef4444] border border-[#fecdd3]',
          iconBox: 'bg-[#fee2e2] text-[#ef4444]',
          icon: '!'
        }
      default:
        return {
          label: 'In Progress',
          badgeClass: 'bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]',
          iconBox: 'bg-[#dbeafe] text-[#2563eb]',
          icon: '○'
        }
    }
  }

  return (
    <div className={`w-full bg-white flex flex-col overflow-hidden ${
      isModal
        ? 'max-w-5xl h-[88vh] max-h-[820px] rounded-3xl shadow-2xl border border-surface-border animate-scale-in'
        : 'rounded-2xl border border-surface-border shadow-subtle min-h-[720px]'
    }`}>
      {/* ── 1. Top Header ─────────────────────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-[#edf0f5] bg-white flex items-start justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#8994a7] mb-1 font-medium">
            <span>Dashboard</span>
            <span className="text-[#8994a7]">›</span>
            <span className="text-[#635bff] font-extrabold">Interactive Syllabus</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Colorful Stacked Layers Icon matching Prototype */}
            <div className="relative w-7 h-7 shrink-0">
              <div className="absolute inset-0 bg-[#06b6d4] rounded-[6px] -rotate-6 opacity-75" />
              <div className="absolute inset-0 bg-[#ec4899] rounded-[6px] rotate-6 opacity-75" />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#635bff] to-[#8b5cf6] rounded-[6px] flex items-center justify-center shadow-xs">
                <BookMarked className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight">
              {selectedExam || 'TNPSC Group 4'} — Interactive Syllabus
            </h2>
          </div>

          <p className="text-xs text-[#69758a] mt-1">
            Explore units → inspect micro-topics → identify your preparation level.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#f1f3f7] hover:bg-[#e2e6ee] text-[#64748b] hover:text-[#172033] flex items-center justify-center transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── 2. Top Summary KPI Row (Exactly matches Image & Prototype) ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-6 py-4 bg-[#fbfcfe] border-b border-[#edf0f5] shrink-0">
        <div className="bg-gradient-to-br from-[#ecfeff] to-[#cffafe] border border-[#a5f3fc] rounded-2xl p-4 shadow-2xs">
          <small className="block text-[10px] font-bold text-[#69758a] uppercase tracking-wider">
            OVERALL SYLLABUS COVERAGE
          </small>
          <b className="block mt-1 text-2xl sm:text-3xl font-black text-[#0891b2]">
            {overallCoverage}%
          </b>
          <small className="block text-[9px] text-[#8994a7] mt-0.5">
            Questions attempted across all units
          </small>
        </div>

        <div className="bg-white border border-[#e5e8ef] rounded-2xl p-4 shadow-2xs">
          <small className="block text-[10px] font-bold text-[#69758a] uppercase tracking-wider">
            STRONG UNITS
          </small>
          <b className="block mt-1 text-2xl sm:text-3xl font-black text-[#10b981]">
            {strongUnits}
          </b>
          <small className="block text-[9px] text-[#8994a7] mt-0.5">
            Units with ≥65% accuracy
          </small>
        </div>

        <div className="bg-white border border-[#e5e8ef] rounded-2xl p-4 shadow-2xs">
          <small className="block text-[10px] font-bold text-[#69758a] uppercase tracking-wider">
            NEEDS REVISION
          </small>
          <b className="block mt-1 text-2xl sm:text-3xl font-black text-[#ef4444]">
            {needsRevision}
          </b>
          <small className="block text-[9px] text-[#8994a7] mt-0.5">
            Units with &lt;50% accuracy
          </small>
        </div>
      </div>

      {/* ── 3. Split Body: Unit List & Tracker Detail ──────────────────────── */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Left column: Dynamic Syllabus Units */}
        <div className="w-full md:w-[44%] lg:w-[42%] p-5 overflow-y-auto border-r border-[#edf0f5] bg-white space-y-2.5">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-[#172033]">{unitData.length} Syllabus Units</span>
            <span className="text-[11px] text-[#8994a7] font-semibold">Select a unit to inspect topics</span>
          </div>

          {/* Quick Search Input */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-[#8994a7] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search units or topics..."
              className="w-full pl-8 pr-3 py-2 text-xs border border-[#e2e6ee] rounded-xl outline-none focus:border-[#635bff] focus:ring-1 focus:ring-[#635bff]/20 transition-all placeholder:text-[#8994a7]"
            />
          </div>

          <div className="space-y-2">
            {filteredUnits.map((unit) => {
              const originalIdx = unitData.findIndex(u => u.unit_number === unit.unit_number)
              const isSelected = originalIdx === activeUnitIdx
              const isUnitWeak = unit.score < 50

              return (
                <div
                  key={unit.unit_number}
                  onClick={() => setActiveUnitIdx(originalIdx)}
                  className={`border rounded-2xl p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-2 border-[#635bff] bg-[#f6f4ff] shadow-[0_5px_16px_rgba(99,91,255,0.08)]'
                      : 'border-[#e5e8ef] hover:border-[#c7d2fe] hover:bg-[#fafaff]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-[#172033] truncate">
                      {unit.unit_name}
                    </span>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className={`text-xs font-black ${isUnitWeak ? 'text-[#ef4444]' : 'text-[#635bff]'}`}>
                        {unit.score}% Acc
                      </span>
                      <span className="text-[10px] font-bold text-[#8994a7]">
                        {unit.coverage || 0}% Cov
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-[#8994a7] mt-1 font-medium">
                    {unit.meta}
                  </div>

                  <div className="w-full h-1.5 bg-[#edf0f5] rounded-full overflow-hidden mt-2.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnitWeak
                          ? 'bg-gradient-to-r from-[#f59e0b] to-[#ef4444]'
                          : 'bg-gradient-to-r from-[#635bff] to-[#8b5cf6]'
                      }`}
                      style={{ width: `${Math.max(5, unit.score)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column: Selected Unit Details & Topics */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto bg-white flex flex-col justify-between">
          <div>
            {/* Header: Unit #, Title & Generate Practice Button */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-bold text-[#635bff] uppercase tracking-wider">
                  Unit {activeUnit.unit_number}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight mt-0.5">
                  {activeUnit.displayName || activeUnit.unit_name}
                </h3>
                <p className="text-xs text-[#69758a] mt-1 max-w-xl">
                  {activeUnit.desc}
                </p>
              </div>

              <button
                onClick={() =>
                  navigate(
                    `/practice?subject=${encodeURIComponent(activeUnit.displayName || activeUnit.unit_name)}&unit=${encodeURIComponent(activeUnit.unit_number)}`
                  )
                }
                className="px-5 py-3 rounded-xl bg-[#635bff] text-white font-black text-xs hover:bg-[#4f46e5] transition-all shadow-[0_6px_16px_rgba(99,91,255,0.22)] shrink-0 flex items-center justify-center gap-1.5"
              >
                Generate Practice Set
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mastery Strip (Bold score + Progress Track + Zone Badge) */}
            <div className="bg-[#f8fafc] border border-[#e5e8ef] rounded-2xl p-4 sm:p-5 mb-8 shadow-2xs space-y-3">
              {/* Accuracy Row */}
              <div className="flex items-center gap-4">
                <div className="min-w-[80px]">
                  <p className="text-xs font-bold text-[#69758a] uppercase tracking-wider mb-1">Accuracy</p>
                  <b className="text-2xl sm:text-3xl font-black text-[#172033]">
                    {activeUnit.score}%
                  </b>
                </div>
                <div className="flex-1 h-2.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isWeakZone ? 'bg-[#ef4444]' : isMastered ? 'bg-[#10b981]' : 'bg-[#635bff]'
                    }`}
                    style={{ width: `${Math.max(6, activeUnit.score)}%` }}
                  />
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider shrink-0 border ${
                    isWeakZone
                      ? 'bg-[#fff0f0] text-[#ef4444] border-[#fecdd3]'
                      : isMastered
                      ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]'
                      : 'bg-[#eef2ff] text-[#4f46e5] border-[#c7d2fe]'
                  }`}
                >
                  {isWeakZone ? 'WEAK' : isMastered ? 'MASTERED' : 'IN PROGRESS'}
                </span>
              </div>

              {/* Coverage Row */}
              <div className="flex items-center gap-4">
                <div className="min-w-[80px]">
                  <p className="text-xs font-bold text-[#69758a] uppercase tracking-wider mb-1">Coverage</p>
                  <b className="text-2xl sm:text-3xl font-black text-[#172033]">
                    {activeUnit.coverage || 0}%
                  </b>
                </div>
                <div className="flex-1 h-2.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#06b6d4] to-[#0891b2]"
                    style={{ width: `${Math.max(6, activeUnit.coverage || 0)}%` }}
                  />
                </div>
                <span className="text-xs text-[#69758a] shrink-0 min-w-[100px] text-right">
                  {(() => {
                    const match = activeUnit.meta?.match(/(\d+)\/(\d+)\s+attempted/)
                    if (match) return `${match[1]}/${match[2]} questions`
                    // Fallback: calculate from coverage percentage
                    const metaMatch = activeUnit.meta?.match(/(\d+)\s+topics/)
                    const estimated = metaMatch ? Math.ceil((activeUnit.coverage || 0) / 100 * 55) : 0
                    return `~${estimated}/55 questions`
                  })()}
                </span>
              </div>
            </div>

            {/* Structured Topic Breakdown */}
            <div className="space-y-6">
              {/* Section 1: FOUNDATION & CORE CONCEPTS */}
              <div>
                <h4 className="text-xs font-black text-[#334155] uppercase tracking-wider pb-2 border-b border-[#e5e8ef] mb-3">
                  FOUNDATION &amp; CORE CONCEPTS
                </h4>
                <div className="space-y-2.5">
                  {activeUnit.foundationTopics.map((topic) => {
                    const badge = getStatusBadge(topic.status)
                    return (
                      <div
                        key={topic.id}
                        className="border border-[#dfe5ee] rounded-xl px-4 py-3 flex items-center justify-between gap-3 bg-white hover:border-[#c7d2fe] hover:shadow-subtle transition-all"
                      >
                        <div
                          onClick={() =>
                            navigate(
                              `/practice?subject=${encodeURIComponent(activeUnit.displayName || activeUnit.unit_name)}&unit=${encodeURIComponent(activeUnit.unit_number)}&topic=${encodeURIComponent(topic.name)}&micro_topic_id=${encodeURIComponent(topic.id)}`
                            )
                          }
                          className="flex items-center gap-3 min-w-0 cursor-pointer group/item flex-1"
                          title={`Click to practice ${topic.name}`}
                        >
                          <span className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${badge.iconBox}`}>
                            {badge.icon}
                          </span>
                          <span className="text-xs font-bold text-[#172033] group-hover/item:text-[#635bff] transition-colors truncate">
                            {topic.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() =>
                              navigate(
                                `/practice?subject=${encodeURIComponent(activeUnit.displayName || activeUnit.unit_name)}&unit=${encodeURIComponent(activeUnit.unit_number)}&topic=${encodeURIComponent(topic.name)}&micro_topic_id=${encodeURIComponent(topic.id)}`
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-[#f0eeff] hover:bg-[#635bff] text-[#635bff] hover:text-white text-xs font-black border border-[#ddd7ff] hover:border-[#635bff] transition-all flex items-center gap-1 shadow-2xs"
                            title={`Practice this topic: ${topic.name}`}
                          >
                            <span>🎯</span>
                            <span>Practice</span>
                          </button>

                          <button
                            onClick={() => toggleTopicStatus('foundation', topic.id)}
                            className={`text-xs font-black px-3 py-1 rounded-lg shrink-0 transition-transform hover:scale-105 active:scale-95 ${badge.badgeClass}`}
                            title="Click to toggle status"
                          >
                            {badge.label}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Section 2: APPLICATION & REVISION */}
              <div>
                <h4 className="text-xs font-black text-[#334155] uppercase tracking-wider pb-2 border-b border-[#e5e8ef] mb-3">
                  APPLICATION &amp; REVISION
                </h4>
                <div className="space-y-2.5">
                  {activeUnit.applicationTopics.map((topic) => {
                    const badge = getStatusBadge(topic.status)
                    return (
                      <div
                        key={topic.id}
                        className="border border-[#dfe5ee] rounded-xl px-4 py-3 flex items-center justify-between gap-3 bg-white hover:border-[#c7d2fe] hover:shadow-subtle transition-all"
                      >
                        <div
                          onClick={() =>
                            navigate(
                              `/practice?subject=${encodeURIComponent(activeUnit.displayName || activeUnit.unit_name)}&unit=${encodeURIComponent(activeUnit.unit_number)}&topic=${encodeURIComponent(topic.name)}&micro_topic_id=${encodeURIComponent(topic.id)}`
                            )
                          }
                          className="flex items-center gap-3 min-w-0 cursor-pointer group/item flex-1"
                          title={`Click to practice ${topic.name}`}
                        >
                          <span className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${badge.iconBox}`}>
                            {badge.icon}
                          </span>
                          <span className="text-xs font-bold text-[#172033] group-hover/item:text-[#635bff] transition-colors truncate">
                            {topic.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() =>
                              navigate(
                                `/practice?subject=${encodeURIComponent(activeUnit.displayName || activeUnit.unit_name)}&unit=${encodeURIComponent(activeUnit.unit_number)}&topic=${encodeURIComponent(topic.name)}&micro_topic_id=${encodeURIComponent(topic.id)}`
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-[#f0eeff] hover:bg-[#635bff] text-[#635bff] hover:text-white text-xs font-black border border-[#ddd7ff] hover:border-[#635bff] transition-all flex items-center gap-1 shadow-2xs"
                            title={`Practice this topic: ${topic.name}`}
                          >
                            <span>🎯</span>
                            <span>Practice</span>
                          </button>

                          <button
                            onClick={() => toggleTopicStatus('application', topic.id)}
                            className={`text-xs font-black px-3 py-1 rounded-lg shrink-0 transition-transform hover:scale-105 active:scale-95 ${badge.badgeClass}`}
                            title="Click to toggle status"
                          >
                            {badge.label}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Vina Insight Bottom Callout Note */}
          <div className="mt-8 bg-[#f5f2ff] border border-[#ddd7ff] rounded-2xl p-4 text-xs text-[#4f46e5] leading-relaxed flex items-start gap-2.5 shadow-2xs">
            <Sparkles className="w-4 h-4 text-[#635bff] shrink-0 mt-0.5" />
            <div>
              <b>Vina insight:</b>{' '}
              {isWeakZone
                ? 'This unit is a weak zone. Start with the topics marked Needs Review, then complete a focused practice set.'
                : 'Keep progressing through the pending topics and revisit any area marked Needs Review.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Inline Tree wrapper for SyllabusPage (/syllabus)
 */
export function InteractiveSyllabusTree(props) {
  return <InteractiveSyllabusPanel isModal={false} {...props} />
}

/**
 * Modal Container for Dashboard
 */
export function InteractiveSyllabus({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-[7px] flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose() }}
    >
      <InteractiveSyllabusPanel isModal={true} onClose={onClose} />
    </div>
  )
}

export default InteractiveSyllabus

