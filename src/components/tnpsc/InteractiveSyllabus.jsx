import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookMarked, ChevronRight, ChevronDown, Loader2, X, Target,
  CheckCircle2, RefreshCw, Circle, Search, Award, Layers,
  BarChart3, Play, ChevronsUpDown, Sparkles,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useApp } from '../../contexts/AppContext'
import { syllabusService } from '../../services/tnpscService'
import { syllabusAnalyticsService } from '../../services/syllabusAnalyticsService'

const STATUS_CONFIG = {
  completed:      { label: 'Completed',      color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  in_progress:    { label: 'In Progress',    color: 'text-blue-700 bg-blue-50 border-blue-200',          icon: RefreshCw },
  needs_revision: { label: 'Needs Revision', color: 'text-amber-700 bg-amber-50 border-amber-200',       icon: RefreshCw },
  not_started:    { label: 'Not Started',    color: 'text-slate-600 bg-slate-100 border-slate-200',      icon: Circle },
}

/**
 * Helper to return badge color classes and label for Accuracy (%)
 */
function getAccuracyBadgeStyle(accuracyPct, totalAttempts) {
  if (!totalAttempts || totalAttempts <= 0) {
    return {
      cls: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
      text: '0% Acc (No attempts)',
      shortText: '0% Acc',
    }
  }
  if (accuracyPct >= 70) {
    return {
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      text: `${accuracyPct}% Accuracy`,
      shortText: `${accuracyPct}% Acc`,
    }
  }
  if (accuracyPct >= 45) {
    return {
      cls: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      text: `${accuracyPct}% Accuracy`,
      shortText: `${accuracyPct}% Acc`,
    }
  }
  return {
    cls: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
    text: `${accuracyPct}% Accuracy`,
    shortText: `${accuracyPct}% Acc`,
  }
}

/**
 * Helper to return progress bar fill color for Coverage (%)
 */
function getCoverageBarColor(coveragePct) {
  if (coveragePct >= 75) return 'bg-emerald-500'
  if (coveragePct >= 35) return 'bg-tnpsc-brand'
  if (coveragePct > 0)   return 'bg-blue-500'
  return 'bg-slate-300'
}

/**
 * Core Interactive Syllabus & Topic Analytics Tree Component
 * Renders the 3-level hierarchy: Unit -> Macro-Topic -> Micro-Topic
 * with real-time Coverage (%) progress bars and Accuracy (%) performance badges.
 */
export function InteractiveSyllabusTree() {
  const { user } = useAuth()
  const { selectedExam, toast } = useApp()
  const navigate = useNavigate()

  const [loading, setLoading]             = useState(true)
  const [analytics, setAnalytics]         = useState(null)
  const [expandedUnits, setExpandedUnits] = useState({})
  const [expandedMacros, setExpandedMacros] = useState({})
  const [savingStatus, setSavingStatus]   = useState({})
  const [searchQuery, setSearchQuery]     = useState('')
  const [activeFilter, setActiveFilter]   = useState('all') // 'all' | 'attempted' | 'strong' | 'weak' | 'untouched'

  useEffect(() => {
    loadSyllabusAnalytics()
  }, [selectedExam, user?.id])

  async function loadSyllabusAnalytics() {
    setLoading(true)
    try {
      const payload = await syllabusAnalyticsService.getSyllabusWithAnalytics(user?.id, selectedExam)
      setAnalytics(payload)

      // Auto-expand first unit and its first macro-topic for immediate visibility
      if (payload?.units?.length > 0) {
        const firstUnit = payload.units[0]
        setExpandedUnits({ [firstUnit.unit_id]: true })
        if (firstUnit.macro_topics?.length > 0) {
          setExpandedMacros({ [firstUnit.macro_topics[0].macro_topic_id]: true })
        }
      }
    } catch (err) {
      console.error('[InteractiveSyllabus] Load error:', err)
      toast?.error?.('Failed to load interactive syllabus analytics')
    } finally {
      setLoading(false)
    }
  }

  async function handleMacroStatusChange(macroTopicId, newStatus) {
    if (!user?.id) return
    setSavingStatus(prev => ({ ...prev, [macroTopicId]: true }))
    try {
      const score = newStatus === 'completed' ? 100
                  : newStatus === 'in_progress' ? 50
                  : newStatus === 'needs_revision' ? 25 : 0
      await syllabusService.upsertProgress(user.id, macroTopicId, newStatus, score)
      setAnalytics(prev => {
        if (!prev) return prev
        return {
          ...prev,
          units: prev.units.map(u => ({
            ...u,
            macro_topics: u.macro_topics.map(mt =>
              mt.macro_topic_id === macroTopicId ? { ...mt, status: newStatus } : mt
            ),
          })),
        }
      })
    } catch (e) {
      // Update locally even if topic ID is synthetic/canonical
      setAnalytics(prev => {
        if (!prev) return prev
        return {
          ...prev,
          units: prev.units.map(u => ({
            ...u,
            macro_topics: u.macro_topics.map(mt =>
              mt.macro_topic_id === macroTopicId ? { ...mt, status: newStatus } : mt
            ),
          })),
        }
      })
    } finally {
      setSavingStatus(prev => ({ ...prev, [macroTopicId]: false }))
    }
  }

  function handleExpandAll() {
    if (!analytics?.units) return
    const allU = {}
    const allM = {}
    analytics.units.forEach(u => {
      allU[u.unit_id] = true
      u.macro_topics?.forEach(m => { allM[m.macro_topic_id] = true })
    })
    setExpandedUnits(allU)
    setExpandedMacros(allM)
  }

  function handleCollapseAll() {
    setExpandedUnits({})
    setExpandedMacros({})
  }

  // Filter hierarchy based on search query and active filter pill
  const filteredUnits = useMemo(() => {
    if (!analytics?.units) return []
    const q = searchQuery.trim().toLowerCase()

    const matchesFilter = (node) => {
      if (activeFilter === 'attempted') return node.coverage_percentage > 0
      if (activeFilter === 'strong')    return node.total_attempts > 0 && node.accuracy_percentage >= 70
      if (activeFilter === 'weak')      return node.total_attempts > 0 && node.accuracy_percentage < 50
      if (activeFilter === 'untouched') return node.coverage_percentage === 0
      return true
    }

    return analytics.units
      .map(unit => {
        const unitMatchesSearch = !q || unit.unit_name.toLowerCase().includes(q)

        const macroList = (unit.macro_topics || [])
          .map(macro => {
            const macroMatchesSearch = !q || unitMatchesSearch || macro.macro_topic_name.toLowerCase().includes(q)

            const microList = (macro.micro_topics || []).filter(micro => {
              const microMatchesSearch = !q || macroMatchesSearch || micro.micro_topic_name.toLowerCase().includes(q)
              return microMatchesSearch && matchesFilter(micro)
            })

            if (microList.length > 0 || (macroMatchesSearch && matchesFilter(macro) && activeFilter === 'all')) {
              return {
                ...macro,
                micro_topics: microList.length > 0 ? microList : macro.micro_topics,
              }
            }
            return null
          })
          .filter(Boolean)

        if (macroList.length > 0) {
          return { ...unit, macro_topics: macroList }
        }
        return null
      })
      .filter(Boolean)
  }, [analytics, searchQuery, activeFilter])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-tnpsc-brand" />
        <p className="text-xs text-body-secondary">Computing real-time syllabus coverage & accuracy...</p>
      </div>
    )
  }

  const totalUnits = analytics?.units?.length || 0
  const totalMacros = analytics?.units?.reduce((s, u) => s + (u.macro_topics?.length || 0), 0) || 0
  const totalMicros = analytics?.units?.reduce(
    (s, u) => s + (u.macro_topics?.reduce((ms, m) => ms + (m.micro_topics?.length || 0), 0) || 0),
    0
  )
  const overallAccStyle = getAccuracyBadgeStyle(analytics?.accuracy_percentage ?? 0, analytics?.total_attempts ?? 0)

  return (
    <div className="space-y-6">
      {/* ── Top Roll-Up Analytics Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Overall Topic Coverage (%) */}
        <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-tnpsc-brand-light text-tnpsc-brand flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-body-secondary uppercase tracking-wider">Syllabus Coverage</p>
                <p className="text-[11px] text-body-secondary">Unique Bank Qs Attempted</p>
              </div>
            </div>
            <span className="text-2xl font-black text-tnpsc-brand">
              {analytics?.coverage_percentage ?? 0}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden my-2.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getCoverageBarColor(analytics?.coverage_percentage ?? 0)}`}
              style={{ width: `${Math.min(100, analytics?.coverage_percentage ?? 0)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-body-secondary">
            <span>
              <strong className="text-body-text">{analytics?.attempted_questions ?? 0}</strong> / {analytics?.total_questions ?? 0} unique questions
            </span>
            <span className="text-[11px] font-medium text-slate-500">Deduplicated</span>
          </div>
        </div>

        {/* Card 2: Overall Topic Accuracy (%) */}
        <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-body-secondary uppercase tracking-wider">Topic Accuracy</p>
                <p className="text-[11px] text-body-secondary">Correct / Total Attempts</p>
              </div>
            </div>
            <span className="text-2xl font-black text-body-text">
              {analytics?.accuracy_percentage ?? 0}%
            </span>
          </div>
          <div className="my-2.5 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${overallAccStyle.cls}`}>
              <span className={`w-2 h-2 rounded-full ${overallAccStyle.dot}`} />
              {overallAccStyle.text}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-body-secondary">
            <span>
              <strong className="text-body-text">{analytics?.correct_questions ?? 0}</strong> correct of {analytics?.total_attempts ?? 0} attempts
            </span>
            <button
              onClick={loadSyllabusAnalytics}
              className="text-tnpsc-brand hover:underline font-semibold flex items-center gap-1"
              title="Refresh real-time metrics"
            >
              <RefreshCw className="w-3 h-3" /> Sync
            </button>
          </div>
        </div>

        {/* Card 3: Taxonomy Hierarchy Summary */}
        <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-body-secondary uppercase tracking-wider">Taxonomy Tree</p>
                <p className="text-[11px] text-body-secondary">{analytics?.group_name || selectedExam}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              3-Tier Hierarchy
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 my-2 pt-1">
            <div className="bg-slate-50 rounded-xl px-3 py-2 text-center border border-surface-border">
              <p className="text-base font-black text-body-text">{totalUnits}</p>
              <p className="text-[10px] font-semibold text-body-secondary uppercase">Units</p>
            </div>
            <div className="bg-slate-50 rounded-xl px-3 py-2 text-center border border-surface-border">
              <p className="text-base font-black text-body-text">{totalMacros}</p>
              <p className="text-[10px] font-semibold text-body-secondary uppercase">Macro-Topics</p>
            </div>
            <div className="bg-slate-50 rounded-xl px-3 py-2 text-center border border-surface-border">
              <p className="text-base font-black text-body-text">{totalMicros}</p>
              <p className="text-[10px] font-semibold text-body-secondary uppercase">Micro-Topics</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search, Filters & Expand/Collapse Bar ────────────────────── */}
      <div className="bg-white rounded-2xl border border-surface-border p-4 shadow-subtle flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter by Unit, Macro-Topic (e.g. Indian Polity), or Micro-Topic..."
            className="w-full pl-9 pr-8 py-2 text-xs border border-surface-border rounded-xl outline-none focus:ring-2 focus:ring-tnpsc-brand"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all',       label: 'All Topics' },
            { id: 'attempted', label: 'Attempted (>0%)' },
            { id: 'strong',    label: 'High Accuracy (≥70%)' },
            { id: 'weak',      label: 'Needs Focus (<50%)' },
            { id: 'untouched', label: 'Untouched (0%)' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeFilter === f.id
                  ? 'bg-tnpsc-brand text-white shadow-sm'
                  : 'bg-slate-100 text-body-secondary hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Expand / Collapse All */}
        <div className="flex items-center gap-1.5 shrink-0 border-l border-surface-border pl-3">
          <button
            onClick={handleExpandAll}
            className="px-2.5 py-1.5 text-xs font-semibold text-body-secondary hover:text-tnpsc-brand hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" /> Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-2.5 py-1.5 text-xs font-semibold text-body-secondary hover:text-tnpsc-brand hover:bg-slate-50 rounded-lg transition-colors"
          >
            Collapse
          </button>
        </div>
      </div>

      {/* ── 3-Level Hierarchy Tree: Unit > Macro-Topic > Micro-Topic ── */}
      {filteredUnits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-border p-12 text-center">
          <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-body-text">No matching syllabus topics found</p>
          <p className="text-xs text-body-secondary mt-1">
            Try clearing your search filter or switching to "All Topics".
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUnits.map(unit => {
            const isUnitOpen = !!expandedUnits[unit.unit_id]
            const unitAccBadge = getAccuracyBadgeStyle(unit.accuracy_percentage, unit.total_attempts)
            const unitCovColor = getCoverageBarColor(unit.coverage_percentage)

            return (
              <div
                key={unit.unit_id}
                className="bg-white rounded-2xl border border-surface-border shadow-subtle overflow-hidden transition-all"
              >
                {/* ─── LEVEL 1: UNIT HEADER ─────────────────────────────── */}
                <div
                  onClick={() => setExpandedUnits(prev => ({ ...prev, [unit.unit_id]: !prev[unit.unit_id] }))}
                  className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-6 py-4 bg-slate-50/80 hover:bg-slate-100/70 cursor-pointer transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-tnpsc-brand text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm">
                      U{unit.unit_number}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-body-text">{unit.unit_name}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-surface-border text-body-secondary">
                          {unit.macro_topics?.length || 0} Macro-Topics
                        </span>
                      </div>
                      {unit.description && (
                        <p className="text-xs text-body-secondary mt-0.5 line-clamp-1">{unit.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Unit Roll-Up Metrics: Coverage Bar + Accuracy Badge */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 shrink-0">
                    {/* Unit Coverage Progress Bar */}
                    <div className="w-40 sm:w-44">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-body-secondary">Unit Coverage</span>
                        <span className="font-black text-body-text">
                          {unit.coverage_percentage}%{' '}
                          <span className="font-normal text-body-secondary">
                            ({unit.attempted_questions}/{unit.total_questions})
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${unitCovColor}`}
                          style={{ width: `${Math.min(100, unit.coverage_percentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Unit Accuracy Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${unitAccBadge.cls}`}
                      title={`Correct: ${unit.correct_questions} / Total Attempts: ${unit.total_attempts}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${unitAccBadge.dot}`} />
                      {unitAccBadge.shortText}
                    </span>

                    {isUnitOpen ? (
                      <ChevronDown className="w-5 h-5 text-body-secondary shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-body-secondary shrink-0" />
                    )}
                  </div>
                </div>

                {/* ─── LEVEL 2: MACRO-TOPICS LIST ───────────────────────── */}
                {isUnitOpen && (
                  <div className="divide-y divide-surface-border border-t border-surface-border">
                    {unit.macro_topics.map(macro => {
                      const isMacroOpen = !!expandedMacros[macro.macro_topic_id]
                      const macroAccBadge = getAccuracyBadgeStyle(macro.accuracy_percentage, macro.total_attempts)
                      const macroCovColor = getCoverageBarColor(macro.coverage_percentage)
                      const statusCfg = STATUS_CONFIG[macro.status] || STATUS_CONFIG.not_started
                      const StatusIcon = statusCfg.icon

                      return (
                        <div key={macro.macro_topic_id} className="bg-white">
                          {/* Macro-Topic Header Row */}
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-6 py-3.5 hover:bg-slate-50/60 transition-colors">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedMacros(prev => ({
                                  ...prev,
                                  [macro.macro_topic_id]: !prev[macro.macro_topic_id],
                                }))
                              }
                              className="flex items-start sm:items-center gap-3 text-left min-w-0 flex-1"
                            >
                              <div className="flex items-center gap-1.5 text-body-secondary mt-0.5 sm:mt-0 shrink-0">
                                {isMacroOpen ? (
                                  <ChevronDown className="w-4 h-4 text-tnpsc-brand" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-body-secondary" />
                                )}
                                <span className="w-6 h-6 rounded-lg bg-tnpsc-brand-light text-tnpsc-brand text-xs font-bold flex items-center justify-center">
                                  {unit.unit_number}.{macro.macro_topic_number}
                                </span>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-bold text-body-text">
                                    {macro.macro_topic_name}
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                                    {macro.micro_topics?.length || 0} Micro-Topics
                                  </span>
                                </div>
                                {macro.description && (
                                  <p className="text-[11px] text-body-secondary mt-0.5 line-clamp-1">
                                    {macro.description}
                                  </p>
                                )}
                              </div>
                            </button>

                            {/* Macro-Topic Roll-Up Metrics & Controls */}
                            <div className="flex flex-wrap items-center gap-3 pl-9 lg:pl-0 shrink-0">
                              {/* Macro Coverage Progress Bar */}
                              <div className="w-36 sm:w-40">
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                  <span className="font-semibold text-body-secondary">Coverage</span>
                                  <span className="font-bold text-body-text">
                                    {macro.coverage_percentage}% ({macro.attempted_questions}/{macro.total_questions})
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${macroCovColor}`}
                                    style={{ width: `${Math.min(100, macro.coverage_percentage)}%` }}
                                  />
                                </div>
                              </div>

                              {/* Macro Accuracy Badge */}
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${macroAccBadge.cls}`}
                                title={`${macro.correct_questions} correct out of ${macro.total_attempts} attempts`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${macroAccBadge.dot}`} />
                                {macroAccBadge.shortText}
                              </span>

                              {/* Status Selector */}
                              {savingStatus[macro.macro_topic_id] ? (
                                <Loader2 className="w-4 h-4 animate-spin text-tnpsc-brand" />
                              ) : (
                                <select
                                  value={macro.status || 'not_started'}
                                  onChange={e => handleMacroStatusChange(macro.macro_topic_id, e.target.value)}
                                  className={`text-[11px] font-bold rounded-lg px-2 py-1 border cursor-pointer outline-none ${statusCfg.color}`}
                                  aria-label={`Status for ${macro.macro_topic_name}`}
                                >
                                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>

                          {/* ─── LEVEL 3: MICRO-TOPICS TREE LEAF NODES ────── */}
                          {isMacroOpen && (
                            <div className="bg-slate-50/70 border-t border-surface-border pl-6 sm:pl-12 pr-4 sm:pr-6 py-2.5 space-y-2">
                              {macro.micro_topics.map(micro => {
                                const microAccBadge = getAccuracyBadgeStyle(micro.accuracy_percentage, micro.total_attempts)
                                const microCovColor = getCoverageBarColor(micro.coverage_percentage)

                                return (
                                  <div
                                    key={micro.micro_topic_id}
                                    className="bg-white rounded-xl border border-surface-border px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-tnpsc-brand/40 transition-colors"
                                  >
                                    {/* Micro-Topic Title & Taxonomy Tags */}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-tnpsc-brand bg-tnpsc-brand-light px-1.5 py-0.5 rounded">
                                          {unit.unit_number}.{macro.macro_topic_number}.{micro.micro_topic_number}
                                        </span>
                                        <p className="text-xs sm:text-sm font-semibold text-body-text">
                                          {micro.micro_topic_name}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] text-body-secondary">
                                        <span>{micro.group_name}</span>
                                        <span>•</span>
                                        <span>{micro.unit_name}</span>
                                        <span>•</span>
                                        <span>{micro.macro_topic_name}</span>
                                      </div>
                                    </div>

                                    {/* Micro-Topic Progress Indicators: Coverage Bar + Accuracy Badge + Practice Action */}
                                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                                      {/* Coverage Progress Bar */}
                                      <div className="w-36">
                                        <div className="flex items-center justify-between text-[10px] mb-1">
                                          <span className="text-body-secondary font-medium">Coverage</span>
                                          <span className="font-bold text-body-text">
                                            {micro.coverage_percentage}% ({micro.attempted_questions}/{micro.total_questions} Qs)
                                          </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all duration-500 ${microCovColor}`}
                                          style={{ width: `${Math.min(100, micro.coverage_percentage)}%` }}
                                          />
                                        </div>
                                      </div>

                                      {/* Accuracy Performance Badge */}
                                      <div className="flex flex-col items-end">
                                        <span
                                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${microAccBadge.cls}`}
                                        >
                                          <span className={`w-1.5 h-1.5 rounded-full ${microAccBadge.dot}`} />
                                          {microAccBadge.shortText}
                                        </span>
                                        <span className="text-[10px] text-body-secondary mt-0.5">
                                          {micro.correct_questions}/{micro.total_attempts} correct
                                        </span>
                                      </div>

                                      {/* Quick Practice Topic Button */}
                                      <button
                                        type="button"
                                        onClick={() => navigate(`/practice?subject=${encodeURIComponent(unit.unit_name)}&topic=${encodeURIComponent(micro.micro_topic_name)}`)}
                                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-tnpsc-brand hover:text-white text-body-text text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                                        title={`Practice questions for ${micro.micro_topic_name}`}
                                      >
                                        <Play className="w-3 h-3" /> Practice
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Modal wrapper for InteractiveSyllabus (when opened as an overlay)
 */
export function InteractiveSyllabus({ onClose }) {
  const { selectedExam } = useApp()

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-50 rounded-2xl shadow-modal flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-surface-border shrink-0">
          <div className="flex items-center gap-3">
            <BookMarked className="w-5 h-5 text-tnpsc-brand" />
            <div>
              <h2 className="text-base font-bold text-body-text">Interactive Syllabus & Topic Analytics</h2>
              <p className="text-xs text-body-secondary">{selectedExam} · Unit → Macro-Topic → Micro-Topic</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-body-secondary" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <InteractiveSyllabusTree key={selectedExam} />
        </div>
      </div>
    </div>
  )
}
