import React, { useMemo } from 'react'
import {
  Layers, Filter, CheckCircle2, BookMarked, PieChart,
  ChevronDown, ChevronRight, Hash, Compass, Cpu, FileText
} from 'lucide-react'

export const OFFICIAL_SYLLABUS_UNITS = [
  {
    id: 'unit-1',
    unit_number: 1,
    unit_name: 'Unit I: General Science',
    shortName: 'General Science',
    category: 'General Studies',
    color: 'from-blue-500 to-cyan-500',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
  },
  {
    id: 'unit-2',
    unit_number: 2,
    unit_name: 'Unit II: Geography of India',
    shortName: 'Geography of India',
    category: 'General Studies',
    color: 'from-emerald-500 to-teal-500',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  {
    id: 'unit-3',
    unit_number: 3,
    unit_name: 'Unit III: History, Culture of India, and Indian National Movement',
    shortName: 'History & INM',
    category: 'General Studies',
    color: 'from-amber-500 to-orange-500',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'unit-4',
    unit_number: 4,
    unit_name: 'Unit IV: Indian Polity',
    shortName: 'Indian Polity',
    category: 'General Studies',
    color: 'from-indigo-500 to-violet-500',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dotColor: 'bg-indigo-500',
  },
  {
    id: 'unit-5',
    unit_number: 5,
    unit_name: 'Unit V: Indian Economy and Development Administration in Tamil Nadu',
    shortName: 'Economy & TN Dev',
    category: 'General Studies',
    color: 'from-purple-500 to-pink-500',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    dotColor: 'bg-purple-500',
  },
  {
    id: 'unit-6',
    unit_number: 6,
    unit_name: 'Unit VI: History, Culture, Heritage, and Socio-Political Movements in Tamil Nadu',
    shortName: 'TN History & Heritage',
    category: 'General Studies',
    color: 'from-rose-500 to-red-500',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    dotColor: 'bg-rose-500',
  },
  {
    id: 'part-b-aptitude',
    unit_number: 7,
    unit_name: 'Part B: Aptitude (Mental Ability)',
    shortName: 'Aptitude',
    category: 'Aptitude & Mental Ability',
    color: 'from-sky-500 to-blue-600',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    dotColor: 'bg-sky-500',
  },
  {
    id: 'part-b-reasoning',
    unit_number: 8,
    unit_name: 'Part B: Reasoning (Mental Ability)',
    shortName: 'Reasoning',
    category: 'Aptitude & Mental Ability',
    color: 'from-teal-500 to-emerald-600',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    dotColor: 'bg-teal-500',
  },
  {
    id: 'part-c-tamil',
    unit_number: 9,
    unit_name: 'Part C: General Tamil (Language)',
    shortName: 'General Tamil',
    category: 'Language',
    color: 'from-amber-600 to-red-600',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    dotColor: 'bg-orange-500',
  },
  {
    id: 'part-c-english',
    unit_number: 10,
    unit_name: 'Part C: General English (Language)',
    shortName: 'General English',
    category: 'Language',
    color: 'from-indigo-600 to-blue-700',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-600',
  },
]

/**
 * Normalizes any freeform unit title returned by AI or imported into canonical unit name
 */
export function normalizeUnitName(rawName) {
  if (!rawName || typeof rawName !== 'string') return 'Unit I: General Science'
  const norm = rawName.toLowerCase().trim()

  if (norm.includes('science') || norm.includes('அறிவியல்') || norm.includes('unit 1') || norm.includes('unit i:') || norm.includes('unit i ')) {
    return 'Unit I: General Science'
  }
  if (norm.includes('geography') || norm.includes('புவியியல்') || norm.includes('unit 2') || norm.includes('unit ii:') || norm.includes('unit ii ')) {
    return 'Unit II: Geography of India'
  }
  if (norm.includes('polity') || norm.includes('ஆட்சியியல்') || norm.includes('அரசியலமைப்பு') || norm.includes('constitution') || norm.includes('unit 4') || norm.includes('unit 5') || norm.includes('unit iv')) {
    return 'Unit IV: Indian Polity'
  }
  if (norm.includes('economy') || norm.includes('பொருளாதாரம்') || norm.includes('development administration') || norm.includes('வளர்ச்சி நிர்வாகம்') || norm.includes('unit v') || norm.includes('unit 7') || norm.includes('unit 9')) {
    return 'Unit V: Indian Economy and Development Administration in Tamil Nadu'
  }
  if (norm.includes('thirukkural') || norm.includes('திருக்குறள்') || norm.includes('sangam') || norm.includes('சங்கம்') || norm.includes('keezhadi') || norm.includes('கீழடி') || norm.includes('periyar') || norm.includes('பெரியார்') || norm.includes('dravidian') || norm.includes('திராவிட') || norm.includes('unit vi') || norm.includes('unit 8')) {
    return 'Unit VI: History, Culture, Heritage, and Socio-Political Movements in Tamil Nadu'
  }
  if (norm.includes('history') || norm.includes('வரலாறு') || norm.includes('national movement') || norm.includes('national renaissance') || norm.includes('தேசிய இயக்கம்') || norm.includes('unit 3') || norm.includes('unit iii')) {
    return 'Unit III: History, Culture of India, and Indian National Movement'
  }
  if (norm.includes('reasoning') || norm.includes('காரணியவியல்') || norm.includes('puzzle') || norm.includes('dice') || norm.includes('logic')) {
    return 'Part B: Reasoning (Mental Ability)'
  }
  if (norm.includes('aptitude') || norm.includes('திறனறிவு') || norm.includes('percentage') || norm.includes('ratio') || norm.includes('hcf') || norm.includes('lcm') || norm.includes('mental ability') || norm.includes('math')) {
    return 'Part B: Aptitude (Mental Ability)'
  }
  if (norm.includes('tamil') || norm.includes('தமிழ்') || norm.includes('இலக்கணம்') || norm.includes('இலக்கியம்')) {
    return 'Part C: General Tamil (Language)'
  }
  if (norm.includes('english') || norm.includes('grammar') || norm.includes('vocabulary')) {
    return 'Part C: General English (Language)'
  }

  // Check against exact canonical list
  const exact = OFFICIAL_SYLLABUS_UNITS.find(u => u.unit_name.toLowerCase() === norm || u.shortName.toLowerCase() === norm)
  if (exact) return exact.unit_name

  return rawName
}

/**
 * Visual Topic & Unit Separation Summary Component
 */
export function TopicSeparationSummary({
  questions = [],
  selectedTopic = null,
  onSelectTopic,
  viewMode = 'table',
  onToggleViewMode,
  showSeparationToggle = true,
}) {
  const totalQuestions = questions.length

  // Calculate question counts per topic
  const topicStats = useMemo(() => {
    const counts = {}
    // Initialize standard units
    OFFICIAL_SYLLABUS_UNITS.forEach(u => {
      counts[u.unit_name] = {
        config: u,
        count: 0,
        macros: new Set(),
      }
    })

    questions.forEach((q) => {
      const canonical = normalizeUnitName(q.unit_name)
      if (!counts[canonical]) {
        counts[canonical] = {
          config: {
            unit_name: canonical,
            shortName: canonical.split(':')[1]?.trim() || canonical,
            color: 'from-slate-500 to-gray-600',
            badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
            dotColor: 'bg-slate-500',
          },
          count: 0,
          macros: new Set(),
        }
      }
      counts[canonical].count++
      if (q.macro_topic_name) counts[canonical].macros.add(q.macro_topic_name)
    })

    // Return only topics with questions or standard topics
    return Object.values(counts).filter(item => item.count > 0)
  }, [questions])

  if (totalQuestions === 0) return null

  const activeTopicObj = topicStats.find(t => t.config.unit_name === selectedTopic)

  return (
    <div className="bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/60 border border-indigo-100 rounded-2xl p-5 shadow-xs space-y-4">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-body-text">
                Topic &amp; Unit Separation Breakdown
              </h4>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {topicStats.length} Topics Identified
              </span>
            </div>
            <p className="text-xs text-body-secondary mt-0.5">
              AI classified every question into its syllabus unit. Click any topic to inspect or filter questions.
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        {showSeparationToggle && onToggleViewMode && (
          <div className="flex items-center gap-1 bg-white border border-surface-border p-1 rounded-xl self-start sm:self-auto shadow-2xs">
            <button
              onClick={() => onToggleViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-body-secondary hover:text-body-text'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => onToggleViewMode('separated')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'separated'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-body-secondary hover:text-body-text'
              }`}
            >
              Separated by Topic
            </button>
          </div>
        )}
      </div>

      {/* ── Topic Cards Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {topicStats.map(({ config, count, macros }) => {
          const isSelected = selectedTopic === config.unit_name
          const pct = totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0

          return (
            <div
              key={config.unit_name}
              onClick={() => onSelectTopic?.(isSelected ? null : config.unit_name)}
              className={`border rounded-xl p-3 cursor-pointer transition-all ${
                isSelected
                  ? 'border-2 border-indigo-600 bg-white shadow-sm ring-2 ring-indigo-500/10'
                  : 'border-surface-border bg-white hover:border-indigo-300 hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-start justify-between gap-1.5 mb-1.5">
                <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${config.badgeColor} truncate max-w-[140px]`}>
                  {config.shortName}
                </span>
                <span className="text-xs font-black text-body-text">
                  {count} Qs
                </span>
              </div>

              {/* Progress bar representing weightage in current paper */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${config.color}`}
                  style={{ width: `${Math.max(8, pct)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-body-secondary">
                <span>{pct}% of paper</span>
                {macros.size > 0 && <span>{macros.size} sub-topics</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Topic Filter Pills Bar ───────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-indigo-100/70 text-xs">
        <span className="text-[11px] font-bold text-body-secondary whitespace-nowrap flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3 text-indigo-500" /> Filter:
        </span>

        {/* All Tab */}
        <button
          onClick={() => onSelectTopic?.(null)}
          className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
            selectedTopic === null
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white border border-surface-border text-body-secondary hover:text-body-text hover:bg-slate-50'
          }`}
        >
          All Topics ({totalQuestions})
        </button>

        {topicStats.map(({ config, count }) => {
          const isSelected = selectedTopic === config.unit_name
          return (
            <button
              key={config.unit_name}
              onClick={() => onSelectTopic?.(isSelected ? null : config.unit_name)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white border border-surface-border text-body-secondary hover:text-body-text hover:bg-slate-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
              <span>{config.shortName}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Active filter banner */}
      {selectedTopic && (
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-3.5 py-2 text-xs">
          <span className="font-semibold text-indigo-900">
            Showing only questions in <strong>{selectedTopic}</strong> ({activeTopicObj?.count || 0} questions)
          </span>
          <button
            onClick={() => onSelectTopic?.(null)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline ml-2"
          >
            Show All Questions
          </button>
        </div>
      )}
    </div>
  )
}

export default TopicSeparationSummary
