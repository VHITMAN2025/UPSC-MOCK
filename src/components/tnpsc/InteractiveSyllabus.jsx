import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  BookMarked, Loader2, X, Target, CheckCircle2,
  AlertTriangle, RefreshCw, Circle, Search, ArrowRight,
  Sparkles, Layers,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useApp } from '../../contexts/AppContext'
import { syllabusAnalyticsService } from '../../services/syllabusAnalyticsService'

/**
 * Returns status metadata for a topic based on accuracy and attempts:
 * - Mastered: >= 70% accuracy
 * - Needs Review: < 50% accuracy
 * - In Progress / Pending: 50% - 69% accuracy or low attempts
 */
function getTopicStatus(score, attempts = 0) {
  if (attempts > 0 && score >= 70) {
    return {
      label: 'Mastered',
      scoreText: `${score}%`,
      cls: 'mastered',
      badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: '✓',
    }
  }
  if (attempts > 0 && score < 50) {
    return {
      label: 'Needs Review',
      scoreText: `${score}%`,
      cls: 'review',
      badgeCls: 'bg-red-50 text-red-700 border-red-200',
      icon: '!',
    }
  }
  return {
    label: attempts > 0 ? 'In Progress' : 'Pending',
    scoreText: attempts > 0 ? `${score}%` : 'Not Attempted',
    cls: 'pending',
    badgeCls: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: '○',
  }
}

/**
 * Split-Pane Interactive Syllabus Component
 * Left: Unit list with scores & progress
 * Right: Detailed unit view, mastery strip, structured topic breakdown & "Generate Practice Set →" button.
 */
export function InteractiveSyllabusTree() {
  const { user } = useAuth()
  const { selectedExam, toast } = useApp()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const targetUnitId     = searchParams.get('unit')
  const targetUnitNumber = searchParams.get('unitNumber')

  const [loading, setLoading]             = useState(true)
  const [analytics, setAnalytics]         = useState(null)
  const [selectedUnitIdx, setSelectedUnitIdx] = useState(0)
  const [searchQuery, setSearchQuery]     = useState('')

  useEffect(() => {
    loadSyllabus()
  }, [selectedExam, user?.id])

  async function loadSyllabus() {
    setLoading(true)
    try {
      const data = await syllabusAnalyticsService.getSyllabusWithAnalytics(user?.id, selectedExam)
      setAnalytics(data)

      // Handle direct unit drill-down if provided via URL
      if (data?.units?.length > 0) {
        if (targetUnitId || targetUnitNumber) {
          const matchIdx = data.units.findIndex(
            u => String(u.unit_id) === String(targetUnitId) || String(u.unit_number) === String(targetUnitNumber)
          )
          if (matchIdx !== -1) {
            setSelectedUnitIdx(matchIdx)
          }
        }
      }
    } catch (err) {
      console.error('[InteractiveSyllabus] Load error:', err)
      toast?.error?.('Failed to load syllabus analytics')
    } finally {
      setLoading(false)
    }
  }

  // Filter units on the left pane based on search input
  const units = analytics?.units || []
  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim()) return units
    const q = searchQuery.toLowerCase().trim()
    return units.filter(u =>
      u.unit_name.toLowerCase().includes(q) ||
      (u.macro_topics || []).some(m => m.macro_topic_name.toLowerCase().includes(q))
    )
  }, [units, searchQuery])

  // Currently selected unit
  const activeUnit = units[selectedUnitIdx] || units[0] || null

  // Summary counts
  const totalUnits = units.length
  const overallMastery = analytics?.accuracy_percentage ?? analytics?.coverage_percentage ?? 0
  const strongUnitsCount = units.filter(u => Number(u.accuracy_percentage || 0) >= 70 && Number(u.total_attempts || 0) > 0).length
  const weakUnitsCount   = units.filter(u => Number(u.accuracy_percentage || 0) < 50 || Number(u.total_attempts || 0) === 0).length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-surface-border">
        <Loader2 className="w-8 h-8 animate-spin text-tnpsc-brand" />
        <p className="text-xs text-body-secondary font-medium">Loading Interactive Syllabus & Topic Analytics…</p>
      </div>
    )
  }

  if (!activeUnit) {
    return (
      <div className="bg-white rounded-2xl border border-surface-border p-12 text-center">
        <BookMarked className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-bold text-body-text">No syllabus units found for {selectedExam}</p>
      </div>
    )
  }

  const activeScore = Number(activeUnit.accuracy_percentage || 0)
  const isWeakZone  = activeScore < 50 || Number(activeUnit.total_attempts || 0) === 0
  const isMastered  = activeScore >= 70 && Number(activeUnit.total_attempts || 0) > 0

  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-subtle overflow-hidden flex flex-col">
      {/* ── Summary Strip (Matching HTML Prototype) ──────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 bg-slate-50/70 border-b border-surface-border">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-3.5">
          <small className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
            Overall Syllabus Mastery
          </small>
          <b className="block mt-1 text-2xl font-black text-indigo-900">
            {overallMastery}%
          </b>
        </div>

        <div className="bg-white border border-surface-border rounded-xl p-3.5">
          <small className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
            Strong Units (&ge;70%)
          </small>
          <b className="block mt-1 text-2xl font-black text-emerald-600">
            {strongUnitsCount}
          </b>
        </div>

        <div className="bg-white border border-surface-border rounded-xl p-3.5">
          <small className="block text-[10px] font-bold text-red-600 uppercase tracking-wider">
            Needs Revision (&lt;50%)
          </small>
          <b className="block mt-1 text-2xl font-black text-red-600">
            {weakUnitsCount}
          </b>
        </div>

        <div className="bg-white border border-surface-border rounded-xl p-3.5">
          <small className="block text-[10px] font-bold text-body-secondary uppercase tracking-wider">
            Units Covered
          </small>
          <b className="block mt-1 text-2xl font-black text-body-text">
            {totalUnits} / {totalUnits}
          </b>
        </div>
      </div>

      {/* ── Split-Pane Body ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-[580px]">
        {/* ── Left Pane: Unit List (~42% width) ─────────────────────── */}
        <div className="w-full lg:w-[42%] border-b lg:border-b-0 lg:border-r border-surface-border bg-white p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-body-text">{units.length} Syllabus Units</span>
            <span className="text-[11px] text-body-secondary">Real-time candidate data</span>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search units or topics…"
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-surface-border rounded-lg outline-none focus:ring-1 focus:ring-tnpsc-brand"
            />
          </div>

          {/* Units list */}
          <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
            {filteredUnits.map((unit) => {
              const originalIdx = units.findIndex(u => u.unit_id === unit.unit_id)
              const isSelected = activeUnit.unit_id === unit.unit_id
              const score = Number(unit.accuracy_percentage || 0)
              const hasAttempts = Number(unit.total_attempts || 0) > 0
              const isUnitWeak = !hasAttempts || score < 50

              return (
                <div
                  key={unit.unit_id || unit.unit_number}
                  onClick={() => {
                    setSelectedUnitIdx(originalIdx !== -1 ? originalIdx : 0)
                    if (targetUnitId || targetUnitNumber) setSearchParams({})
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-tnpsc-brand bg-indigo-50/50 shadow-sm ring-1 ring-tnpsc-brand/20'
                      : 'border-surface-border bg-white hover:border-indigo-200 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-body-text truncate">
                      Unit {unit.unit_number} — {unit.unit_name}
                    </span>
                    <span
                      className={`text-xs font-black shrink-0 ${
                        isUnitWeak ? 'text-red-600' : score >= 70 ? 'text-emerald-600' : 'text-indigo-600'
                      }`}
                    >
                      {hasAttempts ? `${score}%` : '0%'}
                    </span>
                  </div>

                  <p className="text-[11px] text-body-secondary truncate">
                    {unit.macro_topics?.length || 0} Topics · {unit.attempted_questions || 0}/{unit.total_questions || 0} attempted
                  </p>

                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnitWeak ? 'bg-red-500' : score >= 70 ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(score, hasAttempts ? 4 : 0))}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Right Pane: Unit Details & Practice Launcher (~58% width) */}
        <div className="w-full lg:w-[58%] p-6 lg:p-8 bg-slate-50/30 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            {/* Header: Unit #, Title & Generate Practice Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
              <div>
                <span className="text-xs font-bold text-tnpsc-brand uppercase tracking-wider">
                  Unit {activeUnit.unit_number}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-body-text mt-0.5">
                  {activeUnit.unit_name}
                </h3>
              </div>

              <button
                onClick={() =>
                  navigate(
                    `/practice?subject=${encodeURIComponent(activeUnit.unit_name)}&unit=${encodeURIComponent(activeUnit.unit_number)}`
                  )
                }
                className="px-5 py-3 rounded-xl bg-tnpsc-brand text-white font-black text-xs hover:bg-tnpsc-brand-dark transition-all shadow-brand shrink-0 flex items-center justify-center gap-1.5"
              >
                Generate Practice Set
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mastery Strip (Matching HTML Prototype) */}
            <div className="flex items-center gap-4 bg-white border border-surface-border rounded-2xl p-4 shadow-subtle">
              <b className="text-2xl sm:text-3xl font-black text-body-text min-w-[58px]">
                {Number(activeUnit.total_attempts || 0) > 0 ? `${activeScore}%` : '0%'}
              </b>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isWeakZone ? 'bg-red-500' : isMastered ? 'bg-emerald-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(activeScore, Number(activeUnit.total_attempts) > 0 ? 5 : 0))}%` }}
                />
              </div>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider shrink-0 border ${
                  isWeakZone
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : isMastered
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                {isWeakZone ? 'WEAK ZONE' : isMastered ? 'MASTERED' : 'IN PROGRESS'}
              </span>
            </div>

            {/* Structured Topic Breakdown (Clean rows, NO nested accordions) */}
            <div className="space-y-4">
              <div className="border-b border-surface-border pb-2 flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  CORE SYLLABUS TOPICS &amp; MASTERY
                </h4>
                <span className="text-[11px] text-body-secondary font-semibold">
                  {activeUnit.macro_topics?.length || 0} Topics
                </span>
              </div>

              <div className="space-y-2.5">
                {(activeUnit.macro_topics || []).map((macro) => {
                  const macroScore = Number(macro.accuracy_percentage || 0)
                  const macroAttempts = Number(macro.total_attempts || 0)
                  const status = getTopicStatus(macroScore, macroAttempts)

                  return (
                    <div
                      key={macro.macro_topic_id}
                      className="bg-white border border-surface-border rounded-xl px-4 py-3 flex items-center justify-between gap-3 hover:border-indigo-200 hover:shadow-subtle transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 border ${
                            status.cls === 'mastered'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : status.cls === 'review'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {status.icon}
                        </span>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-body-text truncate">
                            {macro.macro_topic_name}
                          </p>
                          <p className="text-[11px] text-body-secondary">
                            {macro.micro_topics?.length || 0} Micro-Topics · {macro.attempted_questions || 0}/{macro.total_questions || 0} attempted
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-lg border ${status.badgeCls}`}
                        >
                          {status.label} {macroAttempts > 0 ? `(${macroScore}%)` : ''}
                        </span>

                        <button
                          onClick={() =>
                            navigate(
                              `/practice?subject=${encodeURIComponent(activeUnit.unit_name)}&topic=${encodeURIComponent(macro.macro_topic_name)}`
                            )
                          }
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-tnpsc-brand bg-indigo-50 hover:bg-indigo-100 transition-colors"
                          title="Practice this specific topic"
                        >
                          Practice →
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Vina Insight Bottom Note */}
          <div className="mt-6 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100 rounded-xl p-3.5 text-xs text-indigo-900 leading-relaxed">
            <span className="font-black text-tnpsc-brand mr-1">✨ Vina Insight:</span>
            {isWeakZone ? (
              <>
                <strong>{activeUnit.unit_name}</strong> is currently flagged as a Weak Zone. Prioritize questions marked <em>Needs Review</em> to strengthen core fundamentals before attempting full mock tests.
              </>
            ) : isMastered ? (
              <>
                You have strong mastery in <strong>{activeUnit.unit_name}</strong> ({activeScore}%). Maintain momentum with occasional spaced-repetition drills.
              </>
            ) : (
              <>
                Continue practicing the remaining unattempted topics in <strong>{activeUnit.unit_name}</strong> to push unit accuracy above the 70% mastery threshold.
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Modal wrapper for Interactive Syllabus (used from Dashboard)
 */
export function InteractiveSyllabus({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
        <div className="p-4 border-b border-surface-border flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-tnpsc-brand" />
            <h2 className="text-base font-black text-body-text">Interactive Syllabus &amp; Topic Analytics</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <InteractiveSyllabusTree />
        </div>
      </div>
    </div>
  )
}
