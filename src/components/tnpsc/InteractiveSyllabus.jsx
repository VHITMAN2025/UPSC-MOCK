import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Search, Sparkles, BookMarked, ArrowRight, CheckCircle2, AlertTriangle, Clock, CircleDot, HelpCircle } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../hooks/useAuth'
import {
  syllabusAnalyticsService,
  CANONICAL_SYLLABUS_TAXONOMY,
  UNIT_11_GENERAL_TAMIL,
  UNIT_11_GENERAL_ENGLISH
} from '../../services/syllabusAnalyticsService'

/**
 * Builds the canonical baseline units structure for the given exam group.
 * Group 1: Exactly Units 1 to 10 (Degree standard; strictly NO Unit 11 Language).
 * Group 2 / 2A: Units 1 to 10 + Unit 11 Language (General Tamil or General English).
 * Group 4: Units 1 to 10 + Unit 11 Language (General Tamil).
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
    meta: `${u.macro_topics?.length || 0} topics · 0 attempted`,
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
      meta: `${unit11Raw.macro_topics?.length || 0} topics · 0 attempted`,
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
        }))
      }))
    })
  }

  return base
}

// Export baseline units for backwards compatibility
export const SYLLABUS_UNITS = buildBaselineUnits('TNPSC Group 4')

export function InteractiveSyllabusPanel({ isModal = false, onClose }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { selectedExam, toast } = useApp()

  const [activeUnitIdx, setActiveUnitIdx] = useState(0)
  const [unitData, setUnitData] = useState(() => buildBaselineUnits(selectedExam))
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Keep baseline in sync when selectedExam changes
  useEffect(() => {
    setUnitData(buildBaselineUnits(selectedExam))
    setActiveUnitIdx(0)
    setLoading(true)
  }, [selectedExam])

  // Sync with live database attempts & canonical syllabus hierarchy
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
              let status = 'Unattempted'
              if (mcAttempts > 0) {
                status = mcScore >= 70 ? 'Mastered' : mcScore < 50 ? 'Needs Review' : 'In Progress'
              }

              return {
                micro_topic_id: mc.micro_topic_id,
                micro_topic_name: mc.micro_topic_name,
                name: mc.micro_topic_name,
                status,
                accuracy_percentage: mcScore,
                total_questions: mc.total_questions || 0,
                attempted_questions: mc.attempted_questions || 0,
                total_attempts: mcAttempts,
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
            meta: `${macros.length} topics · ${attemptedQuestions}/${totalQuestions} attempted`,
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
    return () => { isCancelled = true }
  }, [user?.id, selectedExam])

  const activeUnit = unitData[activeUnitIdx] || unitData[0] || {}
  const hasUnitAttempts = (activeUnit.total_attempts || 0) > 0
  const isWeakZone = hasUnitAttempts && (activeUnit.score < 50)
  const isMastered = hasUnitAttempts && (activeUnit.score >= 70)

  // Dynamic summary KPIs based on real database attempts
  const attemptedUnits = unitData.filter(u => (u.total_attempts || 0) > 0)
  const overallMastery = attemptedUnits.length > 0
    ? Math.round(attemptedUnits.reduce((acc, u) => acc + u.score, 0) / attemptedUnits.length)
    : 0

  const strongUnits = unitData.filter(u => (u.total_attempts || 0) > 0 && u.score >= 65).length
  const needsRevision = unitData.filter(u => (u.total_attempts || 0) > 0 && u.score < 50).length
  const unitsCovered = `${attemptedUnits.length} / ${unitData.length}`

  // Filter units by search query
  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim()) return unitData
    const q = searchQuery.toLowerCase().trim()
    return unitData.filter(u =>
      u.unit_name.toLowerCase().includes(q) ||
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.desc && u.desc.toLowerCase().includes(q)) ||
      (u.macro_topics || []).some(m =>
        m.macro_topic_name.toLowerCase().includes(q) ||
        (m.micro_topics || []).some(t => (t.micro_topic_name || t.name).toLowerCase().includes(q))
      )
    )
  }, [unitData, searchQuery])

  // Topic status toggle for active unit
  function toggleTopicStatus(macroId, topicId) {
    setUnitData(prev => prev.map((u, idx) => {
      if (idx !== activeUnitIdx) return u

      const updatedMacros = (u.macro_topics || []).map(macro => {
        if (macro.macro_topic_id !== macroId && macro.macro_topic_name !== macroId) return macro
        const updatedMicros = (macro.micro_topics || []).map(t => {
          if (t.micro_topic_id !== topicId && t.name !== topicId) return t
          const nextStatus = t.status === 'Mastered'
            ? 'Needs Review'
            : t.status === 'Needs Review'
            ? 'In Progress'
            : 'Mastered'
          return { ...t, status: nextStatus }
        })
        return { ...macro, micro_topics: updatedMicros }
      })

      return { ...u, macro_topics: updatedMacros }
    }))
    toast?.success?.('Topic status updated')
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
      case 'In Progress':
        return {
          label: 'In Progress',
          badgeClass: 'bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]',
          iconBox: 'bg-[#dbeafe] text-[#2563eb]',
          icon: '○'
        }
      default:
        return {
          label: 'Unattempted',
          badgeClass: 'bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0]',
          iconBox: 'bg-[#f1f5f9] text-[#94a3b8]',
          icon: '—'
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
            Explore units → inspect micro-topics → click Practice to launch targeted tests with verified questions.
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

      {/* ── 2. Top Summary KPI Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-4 bg-[#fbfcfe] border-b border-[#edf0f5] shrink-0">
        <div className="bg-gradient-to-br from-[#f5f2ff] to-[#f0eeff] border border-[#ddd7ff] rounded-2xl p-4 shadow-2xs">
          <small className="block text-[10px] font-bold text-[#69758a] uppercase tracking-wider">
            OVERALL SYLLABUS MASTERY
          </small>
          <b className="block mt-1 text-2xl sm:text-3xl font-black text-[#635bff]">
            {overallMastery}%
          </b>
        </div>

        <div className="bg-white border border-[#e5e8ef] rounded-2xl p-4 shadow-2xs">
          <small className="block text-[10px] font-bold text-[#69758a] uppercase tracking-wider">
            STRONG UNITS
          </small>
          <b className="block mt-1 text-2xl sm:text-3xl font-black text-[#10b981]">
            {strongUnits}
          </b>
        </div>

        <div className="bg-white border border-[#e5e8ef] rounded-2xl p-4 shadow-2xs">
          <small className="block text-[10px] font-bold text-[#69758a] uppercase tracking-wider">
            NEEDS REVISION
          </small>
          <b className="block mt-1 text-2xl sm:text-3xl font-black text-[#ef4444]">
            {needsRevision}
          </b>
        </div>

        <div className="bg-white border border-[#e5e8ef] rounded-2xl p-4 shadow-2xs">
          <small className="block text-[10px] font-bold text-[#69758a] uppercase tracking-wider">
            UNITS COVERED
          </small>
          <b className="block mt-1 text-2xl sm:text-3xl font-black text-[#172033]">
            {unitsCovered}
          </b>
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
              const hasAttempts = (unit.total_attempts || 0) > 0
              const isUnitWeak = hasAttempts && unit.score < 50

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
                    <span className={`text-xs font-black ${
                      !hasAttempts
                        ? 'text-[#94a3b8]'
                        : isUnitWeak
                        ? 'text-[#ef4444]'
                        : 'text-[#635bff]'
                    }`}>
                      {hasAttempts ? `${unit.score}%` : '0%'}
                    </span>
                  </div>

                  <div className="text-[10px] text-[#8994a7] mt-1 font-medium">
                    {unit.meta}
                  </div>

                  <div className="w-full h-1.5 bg-[#edf0f5] rounded-full overflow-hidden mt-2.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        !hasAttempts
                          ? 'bg-[#cbd5e1]'
                          : isUnitWeak
                          ? 'bg-gradient-to-r from-[#f59e0b] to-[#ef4444]'
                          : 'bg-gradient-to-r from-[#635bff] to-[#8b5cf6]'
                      }`}
                      style={{ width: `${Math.max(hasAttempts ? 5 : 0, unit.score)}%` }}
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
                    `/practice?subject=${encodeURIComponent(activeUnit.subject || activeUnit.displayName || activeUnit.unit_name)}&unit=${encodeURIComponent(activeUnit.unit_number)}`
                  )
                }
                className="px-5 py-3 rounded-xl bg-[#635bff] text-white font-black text-xs hover:bg-[#4f46e5] transition-all shadow-[0_6px_16px_rgba(99,91,255,0.22)] shrink-0 flex items-center justify-center gap-1.5"
              >
                Generate Practice Set
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mastery Strip (Bold score + Progress Track + Zone Badge) */}
            <div className="flex items-center gap-4 bg-[#f8fafc] border border-[#e5e8ef] rounded-2xl p-4 sm:p-5 mb-8 shadow-2xs">
              <b className="text-2xl sm:text-3xl font-black text-[#172033] min-w-[58px]">
                {hasUnitAttempts ? `${activeUnit.score}%` : '0%'}
              </b>
              <div className="flex-1 h-2.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    !hasUnitAttempts
                      ? 'bg-[#cbd5e1]'
                      : isWeakZone
                      ? 'bg-[#ef4444]'
                      : isMastered
                      ? 'bg-[#10b981]'
                      : 'bg-[#635bff]'
                  }`}
                  style={{ width: `${Math.max(hasUnitAttempts ? 6 : 0, activeUnit.score)}%` }}
                />
              </div>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider shrink-0 border ${
                  !hasUnitAttempts
                    ? 'bg-[#f1f5f9] text-[#64748b] border-[#cbd5e1]'
                    : isWeakZone
                    ? 'bg-[#fff0f0] text-[#ef4444] border-[#fecdd3]'
                    : isMastered
                    ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]'
                    : 'bg-[#eef2ff] text-[#4f46e5] border-[#c7d2fe]'
                }`}
              >
                {!hasUnitAttempts ? 'UNATTEMPTED' : isWeakZone ? 'WEAK ZONE' : isMastered ? 'MASTERED' : 'IN PROGRESS'}
              </span>
            </div>

            {/* Structured Topic Breakdown Grouped by Macro-Topics */}
            <div className="space-y-6">
              {(activeUnit.macro_topics || []).map((macro) => (
                <div key={macro.macro_topic_id || macro.macro_topic_name} className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#e5e8ef]">
                    <div>
                      <h4 className="text-xs font-black text-[#334155] uppercase tracking-wider">
                        {macro.macro_topic_name}
                      </h4>
                      {macro.description && (
                        <p className="text-[11px] text-[#64748b] mt-0.5">{macro.description}</p>
                      )}
                    </div>
                    {macro.total_attempts > 0 && (
                      <span className="text-[11px] font-bold text-[#635bff] bg-[#f0eeff] px-2.5 py-0.5 rounded-md border border-[#ddd7ff]">
                        {macro.accuracy_percentage}% Accuracy
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {(macro.micro_topics || []).map((topic) => {
                      const badge = getStatusBadge(topic.status)
                      const targetSubj = activeUnit.subject || activeUnit.displayName || activeUnit.unit_name
                      const targetUnit = activeUnit.unit_number
                      const topicName = topic.micro_topic_name || topic.name
                      const microId = topic.micro_topic_id

                      return (
                        <div
                          key={topic.micro_topic_id || topic.name}
                          className="border border-[#dfe5ee] rounded-xl px-4 py-3 flex items-center justify-between gap-3 bg-white hover:border-[#c7d2fe] hover:shadow-subtle transition-all"
                        >
                          <div
                            onClick={() =>
                              navigate(
                                `/practice?subject=${encodeURIComponent(targetSubj)}&unit=${encodeURIComponent(targetUnit)}&topic=${encodeURIComponent(topicName)}&micro_topic_id=${encodeURIComponent(microId)}`
                              )
                            }
                            className="flex items-center gap-3 min-w-0 cursor-pointer group/item flex-1"
                            title={`Click to practice ${topicName}`}
                          >
                            <span className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${badge.iconBox}`}>
                              {badge.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-[#172033] group-hover/item:text-[#635bff] transition-colors truncate block">
                                {topicName}
                              </span>
                              {topic.total_questions > 0 && (
                                <span className="text-[10px] text-[#8994a7] block mt-0.5">
                                  {topic.total_questions} verified questions in bank
                                  {topic.total_attempts > 0 ? ` · ${topic.accuracy_percentage}% accuracy` : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() =>
                                navigate(
                                  `/practice?subject=${encodeURIComponent(targetSubj)}&unit=${encodeURIComponent(targetUnit)}&topic=${encodeURIComponent(topicName)}&micro_topic_id=${encodeURIComponent(microId)}`
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-[#f0eeff] hover:bg-[#635bff] text-[#635bff] hover:text-white text-xs font-black border border-[#ddd7ff] hover:border-[#635bff] transition-all flex items-center gap-1 shadow-2xs"
                              title={`Practice this topic: ${topicName}`}
                            >
                              <span>🎯</span>
                              <span>Practice</span>
                            </button>

                            <button
                              onClick={() => toggleTopicStatus(macro.macro_topic_id, topic.micro_topic_id)}
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
              ))}
            </div>
          </div>

          {/* Vina Insight Bottom Callout Note */}
          <div className="mt-8 bg-[#f5f2ff] border border-[#ddd7ff] rounded-2xl p-4 text-xs text-[#4f46e5] leading-relaxed flex items-start gap-2.5 shadow-2xs">
            <Sparkles className="w-4 h-4 text-[#635bff] shrink-0 mt-0.5" />
            <div>
              <b>Vina insight:</b>{' '}
              {!hasUnitAttempts
                ? 'You have not attempted questions in this unit yet. Click "Generate Practice Set" or pick a specific micro-topic to begin.'
                : isWeakZone
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
