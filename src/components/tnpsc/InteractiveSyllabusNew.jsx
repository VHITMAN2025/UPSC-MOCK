import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight } from 'lucide-react'
import { useApp, EXAM_OPTIONS } from '../../contexts/AppContext'
import { useAuth } from '../../hooks/useAuth'
import {
  syllabusAnalyticsService,
  CANONICAL_SYLLABUS_TAXONOMY,
  UNIT_11_GENERAL_TAMIL,
  UNIT_11_GENERAL_ENGLISH
} from '../../services/syllabusAnalyticsService'

/**
 * Builds the canonical baseline units structure for the given exam group.
 */
function buildBaselineUnits(selectedExam) {
  const normExam = String(selectedExam || '').toLowerCase()
  const isGroup1 = normExam.includes('group 1') || normExam.includes('group1')
  const isEnglish = normExam.includes('english')

  const base = CANONICAL_SYLLABUS_TAXONOMY.map(u => ({
    unit_number: u.unit_number,
    unit_name: u.unit_name,
    displayName: u.subject || u.unit_name.replace(/^Unit\s*\d+\s*[-—:]*\s*/i, ''),
    subject: u.subject || u.unit_name,
    desc: u.description || '',
    score: 0,
    coverage: 0,
    total_questions: 0,
    attempted_questions: 0,
    total_attempts: 0,
    correct_attempts: 0,
    status: 'unattempted',
    macro_topics: (u.macro_topics || []).map(m => ({
      macro_topic_id: `macro-${u.unit_number}-${m.topic_number}`,
      macro_topic_name: m.macro_topic_name,
      description: m.description || '',
      accuracy_percentage: 0,
      total_questions: 0,
      attempted_questions: 0,
      total_attempts: 0,
      micro_topics: (m.micro_topics || []).map(mc => ({
        micro_topic_id: `micro-${u.unit_number}-${m.topic_number}-${mc.micro_topic_number}`,
        micro_topic_name: mc.micro_topic_name,
        name: mc.micro_topic_name,
        status: 'Unattempted',
        accuracy_percentage: 0,
        total_questions: 0,
        attempted_questions: 0,
        total_attempts: 0,
        completed: false
      }))
    }))
  }))

  if (!isGroup1) {
    const unit11Raw = isEnglish ? UNIT_11_GENERAL_ENGLISH : UNIT_11_GENERAL_TAMIL
    base.push({
      unit_number: unit11Raw.unit_number || 11,
      unit_name: unit11Raw.unit_name,
      displayName: unit11Raw.subject || 'Language (Part A)',
      subject: unit11Raw.subject || 'Language',
      desc: unit11Raw.description || '',
      score: 0,
      coverage: 0,
      total_questions: 0,
      attempted_questions: 0,
      total_attempts: 0,
      correct_attempts: 0,
      status: 'unattempted',
      macro_topics: (unit11Raw.macro_topics || []).map(m => ({
        macro_topic_id: `macro-11-${m.topic_number}`,
        macro_topic_name: m.macro_topic_name,
        description: m.description || '',
        accuracy_percentage: 0,
        total_questions: 0,
        attempted_questions: 0,
        total_attempts: 0,
        micro_topics: (m.micro_topics || []).map(mc => ({
          micro_topic_id: `micro-11-${m.topic_number}-${mc.micro_topic_number}`,
          micro_topic_name: mc.micro_topic_name,
          name: mc.micro_topic_name,
          status: 'Unattempted',
          accuracy_percentage: 0,
          total_questions: 0,
          attempted_questions: 0,
          total_attempts: 0,
          completed: false
        }))
      }))
    })
  }

  return base
}

export function InteractiveSyllabusTree() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { selectedExam, setSelectedExam, toast } = useApp()

  const [activeUnitIdx, setActiveUnitIdx] = useState(0)
  const [unitData, setUnitData] = useState(() => buildBaselineUnits(selectedExam))
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState('All') // All, Weak, Moderate, Strong
  const [loading, setLoading] = useState(true)

  // Keep baseline in sync when selectedExam changes
  useEffect(() => {
    setUnitData(buildBaselineUnits(selectedExam))
    setActiveUnitIdx(0)
    setLoading(true)
  }, [selectedExam])

  // Sync with live database attempts
  useEffect(() => {
    let isCancelled = false

    async function syncLiveData() {
      try {
        const liveAnalytics = await syllabusAnalyticsService.getSyllabusWithAnalytics(user?.id, selectedExam)
        if (isCancelled || !liveAnalytics?.units?.length) {
          setLoading(false)
          return
        }

        const enriched = liveAnalytics.units.map(lu => {
          const uScore = Math.round(lu.accuracy_percentage || 0)
          const attempts = lu.total_attempts || 0
          const attemptedQuestions = lu.attempted_questions || 0
          const totalQuestions = lu.total_questions || 0

          let unitStatus = 'unattempted'
          if (attempts > 0) {
            unitStatus = uScore >= 70 ? 'mastered' : uScore < 50 ? 'weak_zone' : 'in_progress'
          }

          const macros = (lu.macro_topics || []).map(lm => {
            const mAttempts = lm.total_attempts || 0
            const mScore = Math.round(lm.accuracy_percentage || 0)

            const micros = (lm.micro_topics || []).map(mc => {
              const mcAttempts = mc.total_attempts || 0
              const mcScore = Math.round(mc.accuracy_percentage || 0)
              const completed = mcAttempts > 0 && mcScore >= 70

              return {
                micro_topic_id: mc.micro_topic_id,
                micro_topic_name: mc.micro_topic_name,
                name: mc.micro_topic_name,
                accuracy_percentage: mcScore,
                total_questions: mc.total_questions || 0,
                attempted_questions: mc.attempted_questions || 0,
                total_attempts: mcAttempts,
                completed
              }
            })

            return {
              macro_topic_id: lm.macro_topic_id || lm.id,
              macro_topic_name: lm.macro_topic_name || lm.topic_name,
              description: lm.description || '',
              accuracy_percentage: mScore,
              total_questions: lm.total_questions || 0,
              attempted_questions: lm.attempted_questions || 0,
              total_attempts: mAttempts,
              micro_topics: micros,
            }
          })

          return {
            unit_number: lu.unit_number,
            unit_name: lu.unit_name,
            displayName: lu.subject || lu.unit_name.replace(/^Unit\s*\d+\s*[-—:]*\s*/i, ''),
            subject: lu.subject || lu.unit_name,
            desc: lu.description || '',
            score: uScore,
            coverage: Math.round(lu.coverage_percentage || 0),
            total_questions: totalQuestions,
            attempted_questions: attemptedQuestions,
            total_attempts: attempts,
            correct_attempts: lu.correct_attempts || 0,
            status: unitStatus,
            macro_topics: macros,
          }
        })

        if (!isCancelled) {
          setUnitData(enriched)
          setLoading(false)
        }
      } catch (err) {
        console.warn('[InteractiveSyllabus] Live sync error:', err)
        if (!isCancelled) setLoading(false)
      }
    }

    syncLiveData()

    const handleAttemptSubmitted = () => {
      syncLiveData()
    }
    window.addEventListener('tnpsc-attempt-submitted', handleAttemptSubmitted)
    window.addEventListener('focus', handleAttemptSubmitted)

    return () => {
      isCancelled = true
      window.removeEventListener('tnpsc-attempt-submitted', handleAttemptSubmitted)
      window.removeEventListener('focus', handleAttemptSubmitted)
    }
  }, [user?.id, selectedExam])

  const activeUnit = unitData[activeUnitIdx] || unitData[0] || {}
  
  // Calculate KPIs
  const attemptedUnits = unitData.filter(u => (u.total_attempts || 0) > 0)
  const overallMastery = attemptedUnits.length > 0
    ? Math.round(attemptedUnits.reduce((acc, u) => acc + u.score, 0) / attemptedUnits.length)
    : 0

  const totalTopics = unitData.reduce((acc, u) => {
    return acc + (u.macro_topics || []).reduce((sum, m) => sum + (m.micro_topics || []).length, 0)
  }, 0)

  const completedTopics = unitData.reduce((acc, u) => {
    return acc + (u.macro_topics || []).reduce((sum, m) => {
      return sum + (m.micro_topics || []).filter(t => t.completed).length
    }, 0)
  }, 0)

  const weakUnits = unitData.filter(u => (u.total_attempts || 0) > 0 && u.score < 50).length

  // Filter units based on selected tab
  const filteredUnits = useMemo(() => {
    let filtered = unitData

    if (filterTab === 'Weak') {
      filtered = unitData.filter(u => (u.total_attempts || 0) > 0 && u.score < 50)
    } else if (filterTab === 'Moderate') {
      filtered = unitData.filter(u => (u.total_attempts || 0) > 0 && u.score >= 50 && u.score < 70)
    } else if (filterTab === 'Strong') {
      filtered = unitData.filter(u => (u.total_attempts || 0) > 0 && u.score >= 70)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(u =>
        u.unit_name.toLowerCase().includes(q) ||
        (u.displayName && u.displayName.toLowerCase().includes(q))
      )
    }

    return filtered
  }, [unitData, filterTab, searchQuery])

  // Toggle topic completion
  const toggleTopicCompletion = (macroId, topicId) => {
    setUnitData(prev => prev.map((u, idx) => {
      if (idx !== activeUnitIdx) return u

      const updatedMacros = (u.macro_topics || []).map(macro => {
        if (macro.macro_topic_id !== macroId) return macro
        const updatedMicros = (macro.micro_topics || []).map(t => {
          if (t.micro_topic_id !== topicId) return t
          return { ...t, completed: !t.completed }
        })
        return { ...macro, micro_topics: updatedMicros }
      })

      return { ...u, macro_topics: updatedMacros }
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Syllabus Tracker</h1>
          
          {/* Exam Group Selector */}
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {EXAM_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Language Toggle */}
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg">
              EN
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg">
              தமிழ்
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-sm text-gray-500 mb-2">SYLLABUS MASTERY</div>
            <div className="text-4xl font-bold text-indigo-600">{overallMastery}%</div>
            <div className="text-xs text-indigo-500 mt-1 font-medium">Group 1</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-sm text-gray-500 mb-2">TOPICS COMPLETED</div>
            <div className="text-4xl font-bold text-green-600">{completedTopics} / {totalTopics}</div>
            <div className="text-xs text-green-500 mt-1 font-medium">Checklist</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-sm text-gray-500 mb-2">WEAK UNITS (&lt;50%)</div>
            <div className="text-4xl font-bold text-red-500">{weakUnits} Units</div>
            <div className="text-xs text-red-400 mt-1 font-medium">Priority</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-[400px_1fr] gap-6">
          {/* Left Panel - Unit List */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-4">
              {['All', 'Weak', 'Moderate', 'Strong'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterTab === tab
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search topic"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Unit List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredUnits.map((unit) => {
                const originalIdx = unitData.findIndex(u => u.unit_number === unit.unit_number)
                const isSelected = originalIdx === activeUnitIdx
                const hasAttempts = (unit.total_attempts || 0) > 0

                let progressColor = 'bg-gray-300'
                if (hasAttempts) {
                  if (unit.score >= 70) progressColor = 'bg-green-500'
                  else if (unit.score >= 50) progressColor = 'bg-blue-500'
                  else progressColor = 'bg-red-500'
                }

                return (
                  <div
                    key={unit.unit_number}
                    onClick={() => setActiveUnitIdx(originalIdx)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-2 border-indigo-500'
                        : 'border border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">{unit.unit_name}</span>
                      <span className={`text-sm font-bold ${
                        hasAttempts ? (unit.score >= 70 ? 'text-green-600' : unit.score >= 50 ? 'text-blue-600' : 'text-red-600') : 'text-gray-400'
                      }`}>
                        {hasAttempts ? `${unit.score}%` : '—'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${progressColor} transition-all duration-500`}
                        style={{ width: `${Math.max(hasAttempts ? 5 : 0, unit.score)}%` }}
                      />
                    </div>

                    <div className="text-xs text-gray-500 mt-1">
                      Accuracy: {unit.score}% · Completed: {unit.attempted_questions}/{unit.total_questions}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Panel - Unit Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{activeUnit.unit_name}</h2>
                <p className="text-sm text-gray-500">
                  Accuracy: {activeUnit.score}% · Completed: {
                    (activeUnit.macro_topics || []).reduce((sum, m) => 
                      sum + (m.micro_topics || []).filter(t => t.completed).length, 0)
                  }/{
                    (activeUnit.macro_topics || []).reduce((sum, m) => 
                      sum + (m.micro_topics || []).length, 0)
                  }
                </p>
              </div>

              <button
                onClick={() =>
                  navigate(
                    `/practice?subject=${encodeURIComponent(activeUnit.subject || activeUnit.displayName || activeUnit.unit_name)}&unit=${encodeURIComponent(activeUnit.unit_number)}`
                  )
                }
                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                Practice Unit (25Q)
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Topics List */}
            <div className="space-y-6 max-h-[600px] overflow-y-auto">
              {(activeUnit.macro_topics || []).map((macro) => (
                <div key={macro.macro_topic_id}>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">{macro.macro_topic_name}</h3>
                  
                  <div className="space-y-2">
                    {(macro.micro_topics || []).map((topic) => {
                      const targetSubj = activeUnit.subject || activeUnit.displayName || activeUnit.unit_name
                      const targetUnit = activeUnit.unit_number
                      const topicName = topic.micro_topic_name || topic.name
                      const microId = topic.micro_topic_id

                      return (
                        <div
                          key={topic.micro_topic_id}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
                        >
                          <input
                            type="checkbox"
                            checked={topic.completed || false}
                            onChange={() => toggleTopicCompletion(macro.macro_topic_id, topic.micro_topic_id)}
                            className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />

                          <div
                            onClick={() =>
                              navigate(
                                `/practice?subject=${encodeURIComponent(targetSubj)}&unit=${encodeURIComponent(targetUnit)}&topic=${encodeURIComponent(topicName)}&micro_topic_id=${encodeURIComponent(microId)}`
                              )
                            }
                            className="flex-1 cursor-pointer"
                          >
                            <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {topicName}
                            </div>
                            {topic.total_attempts > 0 && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {topic.accuracy_percentage}% · {topic.total_attempts} attempts
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() =>
                              navigate(
                                `/practice?subject=${encodeURIComponent(targetSubj)}&unit=${encodeURIComponent(targetUnit)}&topic=${encodeURIComponent(topicName)}&micro_topic_id=${encodeURIComponent(microId)}`
                              )
                            }
                            className="px-4 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                          >
                            Practice {topic.total_questions || 10}Q
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InteractiveSyllabusTree
