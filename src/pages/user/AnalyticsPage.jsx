import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, Target, CheckCircle2, XCircle, Minus,
  TrendingUp, TrendingDown, Loader2, AlertCircle, AlertTriangle,
  BookOpen, Award, Flame, Trophy, Brain, Sparkles, Layers,
  ArrowRight, Clock, Timer, Filter, Zap, ChevronRight,
} from 'lucide-react'
import {
  BarChart, Bar, Cell, ReferenceLine,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useAuth } from '../../hooks/useAuth'
import { useApp } from '../../contexts/AppContext'
import { analyticsService } from '../../services/tnpscService'
import { syllabusAnalyticsService } from '../../services/syllabusAnalyticsService'
import { formatDate } from '../../lib/utils'

const TNPSC_BENCHMARK_SEC = 54        // 3 hours (10,800s) / 200 questions
const BEHIND_PACE_THRESHOLD_SEC = 70  // >= 70-75s triggers "Behind Pace"

const PACING_CATEGORIES = [
  'All Categories',
  'Aptitude & Mental Ability',
  'General Knowledge / Recall',
  'Indian Polity & Governance',
  'History & TN Heritage',
  'Science, Geography & Economy',
  'Language (Tamil / English)',
]

/**
 * Formats a signed or unsigned second count into human-readable "Xm Ys" or "Ys"
 */
function formatDeltaSeconds(deltaSec) {
  const abs = Math.abs(Math.round(deltaSec))
  const mins = Math.floor(abs / 60)
  const secs = abs % 60
  if (mins === 0) return `${secs}s`
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

/**
 * Classifies a syllabus unit's accuracy into Weak (<50%), Moderate (50%-70%), or Strong (>70%)
 */
function classifyUnitAccuracyTier(accuracyPct) {
  const acc = Number(accuracyPct || 0)
  if (acc > 70) {
    return {
      key: 'strong',
      label: 'Strong',
      rangeLabel: '> 70%',
      badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      barColor: 'bg-emerald-500',
      dotColor: 'bg-emerald-500',
      cardBorder: 'hover:border-emerald-400',
    }
  }
  if (acc >= 50) {
    return {
      key: 'moderate',
      label: 'Moderate',
      rangeLabel: '50% – 70%',
      badgeCls: 'bg-amber-50 text-amber-700 border-amber-200',
      barColor: 'bg-amber-500',
      dotColor: 'bg-amber-500',
      cardBorder: 'hover:border-amber-400',
    }
  }
  return {
    key: 'weak',
    label: 'Weak',
    rangeLabel: '< 50%',
    badgeCls: 'bg-red-50 text-red-700 border-red-200',
    barColor: 'bg-red-500',
    dotColor: 'bg-red-500',
    cardBorder: 'hover:border-red-400',
  }
}

/**
 * Custom Tooltip for Module 3: Historical Mock Test Trend Bar Chart
 */
function MockTrendTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const item = payload[0]?.payload
  if (!item) return null

  const hasDelta = item.attempt > 1
  const isUp = item.deltaScore > 0
  const isDown = item.deltaScore < 0

  return (
    <div className="bg-slate-900 text-white rounded-xl p-3.5 shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[210px]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-700 pb-1.5">
        <span className="font-black text-indigo-300">{item.label}</span>
        {item.date && (
          <span className="text-[10px] text-slate-400">{formatDate(item.date)}</span>
        )}
      </div>
      <p className="font-semibold text-white line-clamp-1">{item.paperTitle}</p>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="bg-slate-800 rounded-lg px-2.5 py-1.5">
          <p className="text-[10px] text-slate-400">Aggregate Score</p>
          <p className="text-sm font-black text-white">{item.score}%</p>
        </div>
        <div className="bg-slate-800 rounded-lg px-2.5 py-1.5">
          <p className="text-[10px] text-slate-400">Accuracy</p>
          <p className="text-sm font-black text-emerald-400">{item.accuracy}%</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-300">
        <span>{item.correct} Correct · {item.wrong} Wrong</span>
        {hasDelta && (
          <span
            className={`font-bold px-1.5 py-0.5 rounded ${
              isUp
                ? 'bg-emerald-500/20 text-emerald-300'
                : isDown
                ? 'bg-red-500/20 text-red-300'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            {isUp ? `+${item.deltaScore}%` : `${item.deltaScore}%`} vs prev
          </span>
        )}
      </div>
    </div>
  )
}

export function AnalyticsPage() {
  const { user } = useAuth()
  const { selectedExam } = useApp()
  const navigate = useNavigate()

  const [data, setData]                 = useState(null)
  const [recallData, setRecallData]     = useState(null)
  const [syllabusData, setSyllabusData] = useState(null)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  // Module 1 State: Pacing Category Filter & Log View
  const [selectedPacingCategory, setSelectedPacingCategory] = useState('All Categories')
  const [showAllPacingQuestions, setShowAllPacingQuestions] = useState(false)

  // Module 2 State: Unit Accuracy Tier Filter ('all' | 'weak' | 'moderate' | 'strong')
  const [selectedUnitTier, setSelectedUnitTier] = useState('all')

  // Module 3 State: Bar Chart Metric ('score' | 'accuracy')
  const [trendMetric, setTrendMetric] = useState('score')

  useEffect(() => {
    if (user?.id) load()
  }, [user?.id, selectedExam])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [overviewRes, recallRes, syllabusRes] = await Promise.allSettled([
        analyticsService.getOverview(user.id, selectedExam),
        analyticsService.getQuickRecallAnalytics(user.id),
        syllabusAnalyticsService.getSyllabusWithAnalytics(user.id, selectedExam),
      ])

      if (overviewRes.status === 'fulfilled') setData(overviewRes.value)
      if (recallRes.status === 'fulfilled')   setRecallData(recallRes.value)
      if (syllabusRes.status === 'fulfilled') setSyllabusData(syllabusRes.value)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Module 1 Computations: Pacing & Time-Tracking ──────────────────────────
  const allQuestionTimings = data?.pacing?.questionTimings ?? []

  // Available categories dynamically enriched with any custom categories present
  const availablePacingCategories = useMemo(() => {
    const set = new Set(PACING_CATEGORIES)
    allQuestionTimings.forEach(qt => {
      if (qt.category) set.add(qt.category)
    })
    return Array.from(set)
  }, [allQuestionTimings])

  const filteredQuestionTimings = useMemo(() => {
    if (selectedPacingCategory === 'All Categories') return allQuestionTimings
    return allQuestionTimings.filter(qt => qt.category === selectedPacingCategory)
  }, [allQuestionTimings, selectedPacingCategory])

  const pacingSummary = useMemo(() => {
    const count = filteredQuestionTimings.length
    if (count === 0) {
      return {
        count: 0,
        avgTimeSec: 0,
        totalActualSec: 0,
        totalTargetSec: 0,
        netDeltaSec: 0, // > 0 means time lost (behind pace); < 0 means time gained (ahead of pace)
        behindPaceCount: 0,
        watchPaceCount: 0,
        onPaceCount: 0,
        projected200QsMin: 180,
        overallStatus: 'on_pace', // 'behind' | 'watch' | 'on_pace'
      }
    }

    const totalActualSec = filteredQuestionTimings.reduce((s, q) => s + q.timeSpentSec, 0)
    const totalTargetSec = count * TNPSC_BENCHMARK_SEC
    const netDeltaSec = totalActualSec - totalTargetSec
    const avgTimeSec = Math.round(totalActualSec / count)

    const behindPaceCount = filteredQuestionTimings.filter(q => q.timeSpentSec >= BEHIND_PACE_THRESHOLD_SEC).length
    const watchPaceCount  = filteredQuestionTimings.filter(q => q.timeSpentSec > TNPSC_BENCHMARK_SEC && q.timeSpentSec < BEHIND_PACE_THRESHOLD_SEC).length
    const onPaceCount     = filteredQuestionTimings.filter(q => q.timeSpentSec <= TNPSC_BENCHMARK_SEC).length
    const projected200QsMin = Math.round((avgTimeSec * 200) / 60)

    const overallStatus =
      avgTimeSec >= BEHIND_PACE_THRESHOLD_SEC
        ? 'behind'
        : avgTimeSec > TNPSC_BENCHMARK_SEC
        ? 'watch'
        : 'on_pace'

    return {
      count,
      avgTimeSec,
      totalActualSec,
      totalTargetSec,
      netDeltaSec,
      behindPaceCount,
      watchPaceCount,
      onPaceCount,
      projected200QsMin,
      overallStatus,
    }
  }, [filteredQuestionTimings])

  // Category-by-category pacing breakdown
  const categoryPacingBreakdown = useMemo(() => {
    const map = {}
    allQuestionTimings.forEach(qt => {
      const cat = qt.category || 'General Knowledge / Recall'
      if (!map[cat]) {
        map[cat] = { category: cat, count: 0, totalSec: 0, behindCount: 0, correctCount: 0 }
      }
      map[cat].count += 1
      map[cat].totalSec += qt.timeSpentSec
      if (qt.timeSpentSec >= BEHIND_PACE_THRESHOLD_SEC) map[cat].behindCount += 1
      if (qt.isCorrect) map[cat].correctCount += 1
    })

    return Object.values(map)
      .map(c => {
        const avgSec = c.count > 0 ? Math.round(c.totalSec / c.count) : 0
        const netDeltaSec = c.totalSec - c.count * TNPSC_BENCHMARK_SEC
        const status =
          avgSec >= BEHIND_PACE_THRESHOLD_SEC
            ? 'behind'
            : avgSec > TNPSC_BENCHMARK_SEC
            ? 'watch'
            : 'on_pace'
        return {
          ...c,
          avgSec,
          netDeltaSec,
          status,
          accuracyPct: c.count > 0 ? Math.round((c.correctCount / c.count) * 100) : 0,
        }
      })
      .sort((a, b) => b.avgSec - a.avgSec)
  }, [allQuestionTimings])

  // ── Module 2 Computations: Unit-Level Accuracy (Weak / Moderate / Strong) ──
  const classifiedUnits = useMemo(() => {
    const rawUnits = syllabusData?.units ?? []
    return rawUnits.map(u => {
      const tier = classifyUnitAccuracyTier(u.accuracy_percentage)
      return {
        ...u,
        tier,
      }
    })
  }, [syllabusData])

  const unitTierCounts = useMemo(() => {
    const counts = { all: classifiedUnits.length, strong: 0, moderate: 0, weak: 0 }
    classifiedUnits.forEach(u => {
      counts[u.tier.key] = (counts[u.tier.key] || 0) + 1
    })
    return counts
  }, [classifiedUnits])

  const filteredUnits = useMemo(() => {
    if (selectedUnitTier === 'all') return classifiedUnits
    return classifiedUnits.filter(u => u.tier.key === selectedUnitTier)
  }, [classifiedUnits, selectedUnitTier])

  // ── Module 3 Computations: Historical Mock Test Trend ──────────────────────
  const mockTestHistory = data?.mockTestHistory ?? []
  const trendSummary = data?.trendSummary ?? {
    hasMultipleTests: false,
    totalTests: 0,
    firstScore: 0,
    latestScore: 0,
    previousScore: 0,
    highestScore: 0,
    latestDeltaScore: 0,
    latestDeltaPct: 0,
    overallDeltaScore: 0,
    overallDeltaPct: 0,
    direction: 'neutral',
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-tnpsc-brand" />
        <p className="text-xs text-body-secondary">Loading Master Analytics modules...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={load} className="ml-auto text-xs underline text-red-700">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tnpsc-brand-light text-tnpsc-brand flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-body-text">Master Analytics</h1>
            <p className="text-xs text-body-secondary">
              {selectedExam} · Pacing & Time-Tracking (54s Benchmark), Unit Accuracy Tiers & Historical Mock Test Trajectory
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/syllabus')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-tnpsc-brand text-white hover:bg-tnpsc-brand-dark transition-colors shadow-sm"
          >
            <Layers className="w-3.5 h-3.5" />
            Interactive Syllabus Tree
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODULE 1: PACING & TIME-TRACKING MODULE (54s TNPSC BENCHMARK)
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-6">
        {/* Module Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800">
                Module 1 · Pacing & Time-Tracking
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                TNPSC Benchmark: 54s / Question (3 Hrs / 200 Qs)
              </span>
            </div>
            <h2 className="text-base font-bold text-body-text flex items-center gap-2">
              <Timer className="w-4 h-4 text-tnpsc-brand" /> Question Response Pacing & Time-Loss Analyzer
            </h2>
            <p className="text-xs text-body-secondary">
              Tracks question-level response durations against the 54s target pace and flags slow responses (≥ {BEHIND_PACE_THRESHOLD_SEC}s)
            </p>
          </div>

          {/* Pace Status Pill */}
          {pacingSummary.count > 0 && (
            <div className="flex items-center gap-2 self-start lg:self-auto">
              {pacingSummary.overallStatus === 'behind' ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-red-50 text-red-700 border border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Behind Pace (Avg {pacingSummary.avgTimeSec}s/Q)
                </span>
              ) : pacingSummary.overallStatus === 'watch' ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Above Target Pace (Avg {pacingSummary.avgTimeSec}s/Q)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  On Target Pace (Avg {pacingSummary.avgTimeSec}s/Q)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Category Filter Controls */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-body-secondary">
            <Filter className="w-3.5 h-3.5 text-tnpsc-brand" />
            <span>Filter Pacing by Section / Question Category:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {availablePacingCategories.map(category => {
              const active = selectedPacingCategory === category
              const countInCat =
                category === 'All Categories'
                  ? allQuestionTimings.length
                  : allQuestionTimings.filter(q => q.category === category).length

              return (
                <button
                  key={category}
                  onClick={() => setSelectedPacingCategory(category)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-tnpsc-brand text-white shadow-sm'
                      : 'bg-slate-100 text-body-secondary hover:bg-slate-200 hover:text-body-text'
                  }`}
                >
                  <span>{category}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    {countInCat}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {pacingSummary.count === 0 ? (
          <div className="bg-slate-50 border border-surface-border rounded-xl p-8 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-body-text">
              No question timing logs recorded for "{selectedPacingCategory}" yet
            </p>
            <p className="text-xs text-body-secondary max-w-md mx-auto">
              Attempt a Mock Test, Custom Practice session, or Daily Quick Recall to populate real-time question pacing metrics against the 54-second TNPSC benchmark.
            </p>
          </div>
        ) : (
          <>
            {/* Threshold Alert Banner */}
            {pacingSummary.behindPaceCount > 0 || pacingSummary.netDeltaSec > 0 ? (
              <div className="bg-red-50/90 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-600 text-white tracking-wider">
                        Behind Pace Alert
                      </span>
                      <p className="text-xs font-bold text-red-900">
                        {pacingSummary.behindPaceCount} question{pacingSummary.behindPaceCount === 1 ? '' : 's'} exceeded the {BEHIND_PACE_THRESHOLD_SEC}s response threshold
                      </p>
                    </div>
                    <p className="text-xs text-red-700 mt-1">
                      {pacingSummary.netDeltaSec > 0 ? (
                        <>
                          You have lost <strong>+{formatDeltaSeconds(pacingSummary.netDeltaSec)}</strong> relative to the 54s/question TNPSC target pace in{' '}
                          <strong>{selectedPacingCategory}</strong>. At this pace ({pacingSummary.avgTimeSec}s/Q), a 200-question paper would take{' '}
                          <strong>{pacingSummary.projected200QsMin} mins</strong> (target: 180 mins).
                        </>
                      ) : (
                        <>
                          While your overall average is {pacingSummary.avgTimeSec}s/Q, {pacingSummary.behindPaceCount} slow question(s) took ≥ {BEHIND_PACE_THRESHOLD_SEC}s. Skip and mark lengthy calculations for review to protect your buffer.
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-black text-red-700 bg-white border border-red-200 px-3 py-1.5 rounded-lg self-start sm:self-center">
                  Threshold: ≥ {BEHIND_PACE_THRESHOLD_SEC}s
                </span>
              </div>
            ) : (
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-900">
                      Ahead of Target Pace in {selectedPacingCategory}
                    </p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      You gained <strong>{formatDeltaSeconds(pacingSummary.netDeltaSec)}</strong> relative to the 54s/question benchmark (averaging {pacingSummary.avgTimeSec}s/Q).
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-700 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg">
                  On Pace (≤ 54s)
                </span>
              </div>
            )}

            {/* 4 Pacing KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1: TNPSC Target Benchmark */}
              <div className="bg-slate-50 border border-surface-border rounded-xl p-4">
                <div className="flex items-center justify-between text-body-secondary mb-1.5">
                  <span className="text-xs font-semibold">TNPSC Benchmark</span>
                  <Target className="w-4 h-4 text-tnpsc-brand" />
                </div>
                <p className="text-2xl font-black text-body-text">{TNPSC_BENCHMARK_SEC}s <span className="text-xs font-semibold text-body-secondary">/ Q</span></p>
                <p className="text-[11px] text-body-secondary mt-1">200 Qs in 180 mins (3 hrs)</p>
              </div>

              {/* KPI 2: Candidate Avg Response Time */}
              <div className="bg-slate-50 border border-surface-border rounded-xl p-4">
                <div className="flex items-center justify-between text-body-secondary mb-1.5">
                  <span className="text-xs font-semibold">Your Avg Response</span>
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <p
                    className={`text-2xl font-black ${
                      pacingSummary.avgTimeSec >= BEHIND_PACE_THRESHOLD_SEC
                        ? 'text-red-600'
                        : pacingSummary.avgTimeSec > TNPSC_BENCHMARK_SEC
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {pacingSummary.avgTimeSec}s
                  </p>
                  <span className="text-xs font-bold text-body-secondary">
                    ({pacingSummary.avgTimeSec >= TNPSC_BENCHMARK_SEC ? '+' : ''}
                    {pacingSummary.avgTimeSec - TNPSC_BENCHMARK_SEC}s vs target)
                  </span>
                </div>
                <p className="text-[11px] text-body-secondary mt-1">
                  Across {pacingSummary.count} tracked questions
                </p>
              </div>

              {/* KPI 3: Total Time Lost / Gained Relative to Target Pace */}
              <div
                className={`rounded-xl p-4 border ${
                  pacingSummary.netDeltaSec > 0
                    ? 'bg-red-50/60 border-red-200'
                    : 'bg-emerald-50/60 border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-body-text">
                    Time {pacingSummary.netDeltaSec > 0 ? 'Lost vs. Target' : 'Gained vs. Target'}
                  </span>
                  <Timer
                    className={`w-4 h-4 ${
                      pacingSummary.netDeltaSec > 0 ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  />
                </div>
                <p
                  className={`text-2xl font-black ${
                    pacingSummary.netDeltaSec > 0 ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  {pacingSummary.netDeltaSec > 0 ? '+' : '-'}
                  {formatDeltaSeconds(pacingSummary.netDeltaSec)}
                </p>
                <p className="text-[11px] text-body-secondary mt-1">
                  {pacingSummary.netDeltaSec > 0
                    ? 'Behind 54s/Q cumulative budget'
                    : 'Ahead of 54s/Q cumulative budget'}
                </p>
              </div>

              {/* KPI 4: Slow Questions Exceeding Threshold (>= 70s) */}
              <div className="bg-slate-50 border border-surface-border rounded-xl p-4">
                <div className="flex items-center justify-between text-body-secondary mb-1.5">
                  <span className="text-xs font-semibold">Slow Responses (≥{BEHIND_PACE_THRESHOLD_SEC}s)</span>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-body-text">{pacingSummary.behindPaceCount}</p>
                  <span className="text-xs font-semibold text-red-600">
                    ({Math.round((pacingSummary.behindPaceCount / pacingSummary.count) * 100)}% of Qs)
                  </span>
                </div>
                <p className="text-[11px] text-body-secondary mt-1">
                  {pacingSummary.onPaceCount} on pace (≤54s) · {pacingSummary.watchPaceCount} borderline
                </p>
              </div>
            </div>

            {/* Category Pacing Comparison & Question-Level Log */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              {/* Left 5 Cols: Section / Category Pacing Breakdown */}
              <div className="lg:col-span-5 bg-slate-50/70 rounded-xl border border-surface-border p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-body-text uppercase tracking-wider">
                    Category Pacing vs. 54s Target
                  </h3>
                  <span className="text-[10px] font-semibold text-body-secondary">
                    Click row to filter
                  </span>
                </div>
                <div className="space-y-3">
                  {categoryPacingBreakdown.map(cat => {
                    const isSelected = selectedPacingCategory === cat.category
                    const barPct = Math.min(100, Math.round((cat.avgSec / 95) * 100))
                    const benchmarkMarkerPct = Math.round((TNPSC_BENCHMARK_SEC / 95) * 100)

                    return (
                      <div
                        key={cat.category}
                        onClick={() =>
                          setSelectedPacingCategory(
                            isSelected ? 'All Categories' : cat.category
                          )
                        }
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-tnpsc-brand ring-2 ring-tnpsc-brand/15'
                            : 'bg-white border-surface-border hover:border-tnpsc-brand/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold text-body-text truncate">
                            {cat.category}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs font-black text-body-text">
                              {cat.avgSec}s/Q
                            </span>
                            {cat.status === 'behind' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                                Behind Pace
                              </span>
                            ) : cat.status === 'watch' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                +Above 54s
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                On Pace
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar with 54s Benchmark Marker */}
                        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              cat.status === 'behind'
                                ? 'bg-red-500'
                                : cat.status === 'watch'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${barPct}%` }}
                          />
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-slate-800/70"
                            style={{ left: `${benchmarkMarkerPct}%` }}
                            title="54s TNPSC Benchmark"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-body-secondary mt-1.5">
                          <span>{cat.count} Qs · {cat.accuracyPct}% Acc</span>
                          <span
                            className={
                              cat.netDeltaSec > 0 ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'
                            }
                          >
                            {cat.netDeltaSec > 0
                              ? `+${formatDeltaSeconds(cat.netDeltaSec)} lost`
                              : `-${formatDeltaSeconds(cat.netDeltaSec)} saved`}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right 7 Cols: Question-Level Pacing & Threshold Log */}
              <div className="lg:col-span-7 bg-slate-50/70 rounded-xl border border-surface-border p-4 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-body-text uppercase tracking-wider">
                      Question-Level Response Time Log ({selectedPacingCategory})
                    </h3>
                    <p className="text-[11px] text-body-secondary">
                      Flags individual questions taking ≥ {BEHIND_PACE_THRESHOLD_SEC}s as "Behind Pace"
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">≤54s On Pace</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">55–69s Watch</span>
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-700">≥70s Behind Pace</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {(showAllPacingQuestions
                    ? filteredQuestionTimings.slice(0, 30)
                    : filteredQuestionTimings.slice(0, 8)
                  ).map((item, idx) => {
                    const isBehind = item.timeSpentSec >= BEHIND_PACE_THRESHOLD_SEC
                    const isWatch = item.timeSpentSec > TNPSC_BENCHMARK_SEC && !isBehind
                    const deltaSign = item.deltaFromBenchmarkSec > 0 ? '+' : ''

                    return (
                      <div
                        key={item.id || idx}
                        className={`bg-white rounded-xl border px-3.5 py-2.5 flex items-center justify-between gap-3 ${
                          isBehind
                            ? 'border-red-200 bg-red-50/20'
                            : 'border-surface-border'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                              Q{item.questionNumber}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700">
                              {item.category}
                            </span>
                            <span className="text-[10px] text-body-secondary truncate">
                              · {item.sourceTitle}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-body-text truncate">
                            {item.questionText}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="text-right">
                            <p
                              className={`text-xs font-black ${
                                isBehind
                                  ? 'text-red-600'
                                  : isWatch
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                              }`}
                            >
                              {item.timeSpentSec}s
                            </p>
                            <p className="text-[10px] text-body-secondary">
                              {deltaSign}{item.deltaFromBenchmarkSec}s vs 54s
                            </p>
                          </div>

                          <span
                            className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                              isBehind
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : isWatch
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {isBehind ? 'Behind Pace' : isWatch ? 'Above 54s' : 'On Pace'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {filteredQuestionTimings.length > 8 && (
                  <button
                    onClick={() => setShowAllPacingQuestions(v => !v)}
                    className="w-full py-2 text-xs font-bold text-tnpsc-brand hover:bg-white rounded-lg border border-transparent hover:border-surface-border transition-colors"
                  >
                    {showAllPacingQuestions
                      ? 'Show Fewer Questions'
                      : `View More Tracked Questions (${filteredQuestionTimings.length} total)`}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          MODULE 2: UNIT-LEVEL ACCURACY (STRENGTHS VS. WEAKNESSES)
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                Module 2 · Unit-Level Accuracy
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Weak (&lt;50%) · Moderate (50%–70%) · Strong (&gt;70%)
              </span>
            </div>
            <h2 className="text-base font-bold text-body-text flex items-center gap-2">
              <Layers className="w-4 h-4 text-tnpsc-brand" /> Syllabus Unit Strengths vs. Weaknesses
            </h2>
            <p className="text-xs text-body-secondary">
              Click on any unit card below to drill down directly into that unit's Macro-Topics & Micro-Topics inside the Interactive Syllabus
            </p>
          </div>

          <button
            onClick={() => navigate('/syllabus')}
            className="text-xs font-bold text-tnpsc-brand hover:underline flex items-center gap-1 self-start lg:self-auto"
          >
            View Full Interactive Syllabus <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Tier Classification Summary Cards + Filter Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              id: 'all',
              title: 'All Syllabus Units',
              subtitle: 'Complete Exam Blueprint',
              count: unitTierCounts.all,
              cls: 'border-surface-border bg-slate-50 text-body-text',
              activeCls: 'ring-2 ring-tnpsc-brand border-tnpsc-brand bg-tnpsc-brand-light/40',
            },
            {
              id: 'strong',
              title: 'Strong Units (> 70%)',
              subtitle: 'High Mastery Tier',
              count: unitTierCounts.strong,
              cls: 'border-emerald-200 bg-emerald-50/50 text-emerald-900',
              activeCls: 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50',
            },
            {
              id: 'moderate',
              title: 'Moderate (50% – 70%)',
              subtitle: 'Consolidation Tier',
              count: unitTierCounts.moderate,
              cls: 'border-amber-200 bg-amber-50/50 text-amber-900',
              activeCls: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50',
            },
            {
              id: 'weak',
              title: 'Weak Units (< 50%)',
              subtitle: 'Priority Focus Tier',
              count: unitTierCounts.weak,
              cls: 'border-red-200 bg-red-50/50 text-red-900',
              activeCls: 'ring-2 ring-red-600 border-red-600 bg-red-50',
            },
          ].map(tab => {
            const isActive = selectedUnitTier === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedUnitTier(tab.id)}
                className={`text-left rounded-xl border p-3.5 transition-all ${
                  isActive ? tab.activeCls : `${tab.cls} hover:opacity-90`
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">{tab.title}</span>
                  <span className="text-lg font-black">{tab.count}</span>
                </div>
                <p className="text-[11px] opacity-75">{tab.subtitle}</p>
              </button>
            )
          })}
        </div>

        {/* Unit Cards Grid with Interactive Syllabus Drill-Down */}
        {filteredUnits.length === 0 ? (
          <div className="bg-slate-50 border border-surface-border rounded-xl p-8 text-center">
            <p className="text-sm font-bold text-body-text">
              No units currently in the "{selectedUnitTier.toUpperCase()}" tier
            </p>
            <button
              onClick={() => setSelectedUnitTier('all')}
              className="mt-2 text-xs font-bold text-tnpsc-brand hover:underline"
            >
              Show All {classifiedUnits.length} Units
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUnits.map(unit => {
              const acc = Number(unit.accuracy_percentage || 0)
              const cov = Number(unit.coverage_percentage || 0)
              const tier = unit.tier

              return (
                <div
                  key={unit.unit_id || unit.unit_number}
                  onClick={() =>
                    navigate(
                      `/syllabus?unit=${encodeURIComponent(unit.unit_id)}&unitNumber=${unit.unit_number}`
                    )
                  }
                  className={`group bg-white rounded-xl border border-surface-border p-4 shadow-subtle transition-all cursor-pointer hover:shadow-md ${tier.cardBorder}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-tnpsc-brand text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        U{unit.unit_number}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-body-text group-hover:text-tnpsc-brand transition-colors truncate">
                          {unit.unit_name}
                        </h3>
                        <p className="text-[11px] text-body-secondary">
                          {unit.macro_topics?.length || 0} Macro-Topics · {unit.correct_questions}/{unit.total_attempts} Correct Attempts
                        </p>
                      </div>
                    </div>

                    {/* Accuracy Tier Badge: Weak (<50%), Moderate (50-70%), Strong (>70%) */}
                    <span
                      className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border ${tier.badgeCls}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${tier.dotColor}`} />
                      {acc}% · {tier.label}
                    </span>
                  </div>

                  {/* Accuracy Progress Bar */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-body-secondary">
                          Unit Accuracy ({tier.label}: {tier.rangeLabel})
                        </span>
                        <span className="font-black text-body-text">{acc}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${tier.barColor}`}
                          style={{ width: `${Math.min(100, Math.max(acc, 2))}%` }}
                        />
                      </div>
                    </div>

                    {/* Coverage Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-body-secondary">
                          Question Bank Coverage ({unit.attempted_questions}/{unit.total_questions} Qs)
                        </span>
                        <span className="font-bold text-body-secondary">{cov}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, cov)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-surface-border flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-body-secondary">
                      {tier.key === 'weak'
                        ? 'Recommended: Revise fundamentals & practice Micro-Topics'
                        : tier.key === 'moderate'
                        ? 'Recommended: Target weak sub-topics to cross 70%'
                        : 'Strong mastery — maintain with timed mock revisions'}
                    </span>
                    <span className="font-bold text-tnpsc-brand flex items-center gap-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform">
                      Open Unit <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          MODULE 3: HISTORICAL MOCK TEST TREND VISUALIZER (BAR CHART)
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">
                Module 3 · Historical Trend Visualizer
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Chronological Progression (Mock Test 1 → Latest)
              </span>
            </div>
            <h2 className="text-base font-bold text-body-text flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-tnpsc-brand" /> Historical Mock Test Performance Trajectory
            </h2>
            <p className="text-xs text-body-secondary">
              Tracks aggregate scores across successive mock tests with upward/downward delta indicators
            </p>
          </div>

          {/* Upward / Downward Trend Indicator & Metric Toggle */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {mockTestHistory.length > 0 && (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${
                  trendSummary.direction === 'up'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : trendSummary.direction === 'down'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {trendSummary.direction === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : trendSummary.direction === 'down' ? (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                ) : (
                  <Minus className="w-4 h-4 text-slate-500" />
                )}
                <span>
                  {trendSummary.hasMultipleTests ? (
                    <>
                      {trendSummary.latestDeltaScore >= 0 ? '+' : ''}
                      {trendSummary.latestDeltaScore}% pts ({trendSummary.latestDeltaPct >= 0 ? '+' : ''}
                      {trendSummary.latestDeltaPct}%) vs. Prev Test
                    </>
                  ) : (
                    <>Baseline Set: {trendSummary.latestScore}% (Mock Test 1)</>
                  )}
                </span>
              </div>
            )}

            {/* Toggle Score vs Accuracy */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              {[
                { key: 'score', label: 'Aggregate Score' },
                { key: 'accuracy', label: 'Accuracy %' },
              ].map(m => (
                <button
                  key={m.key}
                  onClick={() => setTrendMetric(m.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    trendMetric === m.key
                      ? 'bg-white text-tnpsc-brand shadow-sm'
                      : 'text-body-secondary hover:text-body-text'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {mockTestHistory.length === 0 ? (
          <div className="bg-slate-50 border border-surface-border rounded-xl p-10 text-center space-y-3">
            <BarChart3 className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-body-text">No Completed Mock Tests Yet</p>
              <p className="text-xs text-body-secondary max-w-md mx-auto">
                Complete your first full mock test or PYQ paper to unlock your chronological bar chart and upward/downward trajectory indicators.
              </p>
            </div>
            <button
              onClick={() => navigate('/mock-tests')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-tnpsc-brand text-white hover:bg-tnpsc-brand-dark transition-colors"
            >
              <Zap className="w-3.5 h-3.5" /> Start Mock Test 1
            </button>
          </div>
        ) : (
          <>
            {/* Trajectory KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-surface-border rounded-xl p-3.5">
                <p className="text-[11px] font-semibold text-body-secondary">First Mock Test (MT 1)</p>
                <p className="text-xl font-black text-body-text mt-0.5">{trendSummary.firstScore}%</p>
                <p className="text-[10px] text-body-secondary mt-0.5">Starting baseline</p>
              </div>

              <div className="bg-slate-50 border border-surface-border rounded-xl p-3.5">
                <p className="text-[11px] font-semibold text-body-secondary">
                  Latest Mock Test (MT {trendSummary.totalTests})
                </p>
                <p className="text-xl font-black text-tnpsc-brand mt-0.5">{trendSummary.latestScore}%</p>
                <p className="text-[10px] text-body-secondary mt-0.5">Most recent attempt</p>
              </div>

              <div className="bg-slate-50 border border-surface-border rounded-xl p-3.5">
                <p className="text-[11px] font-semibold text-body-secondary">Personal Best Score</p>
                <p className="text-xl font-black text-emerald-700 mt-0.5">{trendSummary.highestScore}%</p>
                <p className="text-[10px] text-body-secondary mt-0.5">Across {trendSummary.totalTests} mock test(s)</p>
              </div>

              <div
                className={`rounded-xl p-3.5 border ${
                  trendSummary.overallDeltaScore > 0
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : trendSummary.overallDeltaScore < 0
                    ? 'bg-red-50/60 border-red-200'
                    : 'bg-slate-50 border-surface-border'
                }`}
              >
                <p className="text-[11px] font-semibold text-body-secondary">Overall Trajectory (MT 1 → Latest)</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {trendSummary.overallDeltaScore > 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : trendSummary.overallDeltaScore < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : null}
                  <p
                    className={`text-xl font-black ${
                      trendSummary.overallDeltaScore > 0
                        ? 'text-emerald-700'
                        : trendSummary.overallDeltaScore < 0
                        ? 'text-red-700'
                        : 'text-body-text'
                    }`}
                  >
                    {trendSummary.overallDeltaScore >= 0 ? '+' : ''}
                    {trendSummary.overallDeltaScore}%
                  </p>
                </div>
                <p className="text-[10px] text-body-secondary mt-0.5">
                  {trendSummary.overallDeltaPct >= 0 ? '+' : ''}
                  {trendSummary.overallDeltaPct}% net score change
                </p>
              </div>
            </div>

            {/* Chronological Bar Chart */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockTestHistory}
                  margin={{ top: 12, right: 16, left: -10, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `${v}%`}
                  />
                  <Tooltip content={<MockTrendTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <ReferenceLine
                    y={70}
                    stroke="#16a34a"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Strong Benchmark (70%)',
                      position: 'insideTopRight',
                      fill: '#15803d',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  />
                  <Bar
                    dataKey={trendMetric}
                    radius={[8, 8, 0, 0]}
                    maxBarSize={54}
                  >
                    {mockTestHistory.map((entry, idx) => {
                      const val = Number(entry[trendMetric] || 0)
                      const fill =
                        val > 70
                          ? '#10b981' // Strong emerald
                          : val >= 50
                          ? '#635BFF' // Brand indigo
                          : '#ef4444' // Needs focus red
                      return <Cell key={`cell-${idx}`} fill={fill} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chronological Test Cards Strip with Per-Test Delta Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {mockTestHistory.slice(-4).map(test => {
                const isFirst = test.attempt === 1
                const isUp = test.deltaScore > 0
                const isDown = test.deltaScore < 0
                return (
                  <div
                    key={test.attemptId}
                    onClick={() => navigate(`/attempt/${test.attemptId}/result`)}
                    className="border border-surface-border rounded-xl p-3.5 hover:border-tnpsc-brand/40 hover:bg-slate-50/70 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {test.label}
                      </span>
                      {!isFirst ? (
                        <span
                          className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isUp
                              ? 'bg-emerald-50 text-emerald-700'
                              : isDown
                              ? 'bg-red-50 text-red-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isUp ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : isDown ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : null}
                          {isUp ? `+${test.deltaScore}%` : `${test.deltaScore}%`}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">Baseline</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-body-text truncate">{test.paperTitle}</p>
                    <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-surface-border">
                      <span className="font-black text-tnpsc-brand">{test.score}% Score</span>
                      <span className="text-[11px] text-body-secondary">{test.accuracy}% Acc</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          DEDICATED QUICK_RECALL PERFORMANCE SECTION
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-purple-100 text-purple-800 tracking-wider">
              QUICK_RECALL
            </span>
            <div>
              <h2 className="text-sm font-bold text-body-text flex items-center gap-2">
                <Brain className="w-4 h-4 text-tnpsc-brand" /> Daily Quick Recall Performance
              </h2>
              <p className="text-xs text-body-secondary">
                Deterministic revision metrics · 50% PYQ + 50% Synthetic question mix
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-200">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Streak Rule: 5/5 to Qualify</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-surface-border rounded-xl p-4">
            <div className="flex items-center justify-between text-body-secondary mb-2">
              <span className="text-xs font-semibold">Active Streak</span>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-black text-body-text">{recallData?.currentStreak ?? 0} d</p>
            <p className="text-[11px] text-body-secondary mt-0.5">Consecutive 5/5 days</p>
          </div>

          <div className="bg-slate-50 border border-surface-border rounded-xl p-4">
            <div className="flex items-center justify-between text-body-secondary mb-2">
              <span className="text-xs font-semibold">Best Streak</span>
              <Trophy className="w-4 h-4 text-yellow-600" />
            </div>
            <p className="text-2xl font-black text-body-text">{recallData?.highestStreak ?? 0} d</p>
            <p className="text-[11px] text-body-secondary mt-0.5">All-time record</p>
          </div>

          <div className="bg-slate-50 border border-surface-border rounded-xl p-4">
            <div className="flex items-center justify-between text-body-secondary mb-2">
              <span className="text-xs font-semibold">5/5 Perfect Rate</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700">{recallData?.qualifyRate ?? '0'}%</p>
            <p className="text-[11px] text-body-secondary mt-0.5">
              {recallData?.perfectSessions ?? 0} of {recallData?.totalSessions ?? 0} sessions
            </p>
          </div>

          <div className="bg-slate-50 border border-surface-border rounded-xl p-4">
            <div className="flex items-center justify-between text-body-secondary mb-2">
              <span className="text-xs font-semibold">Recall Points</span>
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-purple-700">+{recallData?.recallPoints ?? 0}</p>
            <p className="text-[11px] text-body-secondary mt-0.5">Total earned</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-blue-900">PYQ Archive Accuracy</span>
              <span className="font-black text-blue-800">{recallData?.pyqAccuracy ?? '—'}%</span>
            </div>
            <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Number(recallData?.pyqAccuracy) || 0)}%` }}
              />
            </div>
            <p className="text-[11px] text-body-secondary mt-2">
              Tested on authentic TNPSC & UPSC previous year exam questions.
            </p>
          </div>

          <div className="border border-purple-200 bg-purple-50/40 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-purple-900">Synthetic / Model Accuracy</span>
              <span className="font-black text-purple-800">{recallData?.synAccuracy ?? '—'}%</span>
            </div>
            <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Number(recallData?.synAccuracy) || 0)}%` }}
              />
            </div>
            <p className="text-[11px] text-body-secondary mt-2">
              Tested on curriculum model questions and spaced repetition revision.
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          CUMULATIVE MOCK EXAM SUMMARY & ERROR BREAKDOWN
         ══════════════════════════════════════════════════════════════════════ */}
      {data?.hasData && (
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-5">
          <div>
            <h2 className="text-sm font-bold text-body-text">Cumulative Mock Exam Summary</h2>
            <p className="text-xs text-body-secondary">
              Aggregated across {data.totalAttempts} completed mock test paper(s)
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Attempts',  value: data.totalAttempts,     icon: BookOpen,  color: 'text-tnpsc-brand bg-tnpsc-brand-light' },
              { label: 'Avg Score',       value: `${data.avgScore}%`,    icon: Award,     color: 'text-emerald-700 bg-emerald-50' },
              { label: 'Avg Accuracy',    value: `${data.avgAccuracy}%`, icon: Target,    color: 'text-blue-700 bg-blue-50' },
              { label: 'Total Questions', value: data.totalQuestions,    icon: BarChart3, color: 'text-purple-700 bg-purple-50' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-slate-50 rounded-xl border border-surface-border p-4">
                <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-2.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-body-text">{value}</p>
                <p className="text-xs text-body-secondary mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Correct',  value: data.totalCorrect,  icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
              { label: 'Wrong',    value: data.totalWrong,    icon: XCircle,      color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
              { label: 'Skipped',  value: data.totalSkipped,  icon: Minus,        color: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`rounded-xl border p-3.5 text-center ${bg}`}>
                <Icon className={`w-5 h-5 mx-auto mb-1.5 ${color}`} />
                <p className="text-lg font-bold text-body-text">{value}</p>
                <p className="text-xs text-body-secondary">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
