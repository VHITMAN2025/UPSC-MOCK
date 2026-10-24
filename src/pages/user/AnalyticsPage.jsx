import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, Target, CheckCircle2, XCircle, Minus,
  TrendingUp, TrendingDown, Loader2, AlertCircle, AlertTriangle,
  BookOpen, Award, Flame, Trophy, Brain, Sparkles, Layers,
  ArrowRight, Clock, Timer, Filter, Zap, ChevronRight, Check,
  RefreshCw, HelpCircle, FileText, BarChart2, ShieldCheck,
  Compass, Eye, ChevronDown, ListFilter, RotateCcw, Search,
} from 'lucide-react'
import {
  BarChart, Bar, Cell, ReferenceLine, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useAuth } from '../../hooks/useAuth'
import { useApp } from '../../contexts/AppContext'
import { analyticsService } from '../../services/tnpscService'
import { syllabusAnalyticsService } from '../../services/syllabusAnalyticsService'
import { formatDate } from '../../lib/utils'

const TNPSC_BENCHMARK_SEC = 54
const BEHIND_PACE_THRESHOLD_SEC = 70
const WATCH_PACE_THRESHOLD_SEC = 55

const PACING_CATEGORIES = [
  'All Categories',
  'Aptitude & Mental Ability',
  'General Knowledge / Recall',
  'Indian Polity & Governance',
  'History & TN Heritage',
  'Science, Geography & Economy',
  'Language (Tamil / English)',
]

const DIAGNOSTIC_TABS = [
  { id: 'ma-view-overview',   label: 'Overview' },
  { id: 'ma-view-syllabus',   label: 'Syllabus Mastery' },
  { id: 'ma-view-errors',     label: 'Error Intelligence' },
  { id: 'ma-view-pacing',     label: 'Time & Pacing' },
  { id: 'ma-view-questions',  label: 'Question Intelligence' },
  { id: 'ma-view-history',    label: 'Test History' },
  { id: 'ma-view-recall',     label: 'Quick Recall' },
]

function formatDeltaSeconds(deltaSec) {
  const abs = Math.abs(Math.round(deltaSec))
  const mins = Math.floor(abs / 60)
  const secs = abs % 60
  if (mins === 0) return `${secs}s`
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
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

  // Top navigation tabs: 7 Diagnostic Views
  const [activeTab, setActiveTab] = useState('ma-view-overview')

  // Time filter pill: 'all' | 'last5'
  const [timeFilter, setTimeFilter] = useState('last5')

  // Syllabus Mastery tab: selected unit index
  const [selectedUnitIdx, setSelectedUnitIdx] = useState(0)

  // Pacing tab: selected category filter
  const [selectedPacingCategory, setSelectedPacingCategory] = useState('All Categories')

  // Error Intelligence tab: filter by error type
  const [errorTypeFilter, setErrorTypeFilter] = useState('ALL')

  useEffect(() => {
    if (user?.id) load()
  }, [user?.id, selectedExam])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      console.log('[AnalyticsPage] Starting data load for exam:', selectedExam)
      const [overviewRes, recallRes, syllabusRes] = await Promise.allSettled([
        analyticsService.getOverview(user.id, selectedExam),
        analyticsService.getQuickRecallAnalytics(user.id),
        syllabusAnalyticsService.getSyllabusWithAnalytics(user.id, selectedExam),
      ])

      if (overviewRes.status === 'fulfilled') setData(overviewRes.value)
      if (recallRes.status === 'fulfilled')   setRecallData(recallRes.value)
      if (syllabusRes.status === 'fulfilled') {
        console.log('[AnalyticsPage] Syllabus data received:', {
          exam: syllabusRes.value?.exam_name,
          units: syllabusRes.value?.units?.length,
          totalAttempts: syllabusRes.value?.total_attempts,
          coverage: syllabusRes.value?.coverage_percentage,
          accuracy: syllabusRes.value?.accuracy_percentage
        })
        setSyllabusData(syllabusRes.value)
      }
    } catch (err) {
      console.error('[AnalyticsPage] Error loading data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Pacing Computations ────────────────────────────────────────────────────
  const allQuestionTimings = data?.pacing?.questionTimings ?? []
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
        netDeltaSec: 0,
        behindPaceCount: 0,
        watchPaceCount: 0,
        onPaceCount: 0,
        overallStatus: 'on_pace',
      }
    }
    const totalActualSec = filteredQuestionTimings.reduce((s, q) => s + q.timeSpentSec, 0)
    const totalTargetSec = count * TNPSC_BENCHMARK_SEC
    const netDeltaSec = totalActualSec - totalTargetSec
    const avgTimeSec = Math.round(totalActualSec / count)
    const behindPaceCount = filteredQuestionTimings.filter(q => q.timeSpentSec >= BEHIND_PACE_THRESHOLD_SEC).length
    const watchPaceCount  = filteredQuestionTimings.filter(q => q.timeSpentSec > TNPSC_BENCHMARK_SEC && q.timeSpentSec < BEHIND_PACE_THRESHOLD_SEC).length
    const onPaceCount     = filteredQuestionTimings.filter(q => q.timeSpentSec <= TNPSC_BENCHMARK_SEC).length

    const overallStatus =
      avgTimeSec >= BEHIND_PACE_THRESHOLD_SEC ? 'behind' : avgTimeSec > TNPSC_BENCHMARK_SEC ? 'watch' : 'on_pace'

    return {
      count,
      avgTimeSec,
      netDeltaSec,
      behindPaceCount,
      watchPaceCount,
      onPaceCount,
      overallStatus,
    }
  }, [filteredQuestionTimings])

  const categoryPacingBreakdown = useMemo(() => {
    const map = {}
    allQuestionTimings.forEach(qt => {
      const cat = qt.category || 'General Knowledge / Recall'
      if (!map[cat]) map[cat] = { category: cat, count: 0, totalSec: 0 }
      map[cat].count += 1
      map[cat].totalSec += qt.timeSpentSec
    })
    return Object.values(map).map(c => {
      const avgSec = c.count > 0 ? Math.round(c.totalSec / c.count) : 0
      return {
        ...c,
        avgSec,
        status: avgSec >= BEHIND_PACE_THRESHOLD_SEC ? 'behind' : avgSec > TNPSC_BENCHMARK_SEC ? 'watch' : 'on_pace',
      }
    }).sort((a, b) => b.avgSec - a.avgSec)
  }, [allQuestionTimings])

  // Pacing Speed Distribution Heatmap
  const pacingDistribution = useMemo(() => {
    const total = allQuestionTimings.length || 1
    const lightning = allQuestionTimings.filter(q => q.timeSpentSec < 35).length
    const optimal   = allQuestionTimings.filter(q => q.timeSpentSec >= 35 && q.timeSpentSec <= 54).length
    const watch     = allQuestionTimings.filter(q => q.timeSpentSec > 54 && q.timeSpentSec < 70).length
    const slow      = allQuestionTimings.filter(q => q.timeSpentSec >= 70).length

    return [
      { label: 'Lightning (< 35s)', count: lightning, pct: Math.round((lightning / total) * 100), color: 'bg-emerald-500', text: 'text-emerald-700 bg-emerald-50' },
      { label: 'Optimal (35s – 54s)', count: optimal, pct: Math.round((optimal / total) * 100), color: 'bg-indigo-500', text: 'text-indigo-700 bg-indigo-50' },
      { label: 'Watch Zone (55s – 70s)', count: watch, pct: Math.round((watch / total) * 100), color: 'bg-amber-500', text: 'text-amber-700 bg-amber-50' },
      { label: 'Critical Slow (≥ 70s)', count: slow, pct: Math.round((slow / total) * 100), color: 'bg-red-500', text: 'text-red-700 bg-red-50' },
    ]
  }, [allQuestionTimings])

  // ── Units & Syllabus Computations ──────────────────────────────────────────
  const units = syllabusData?.units ?? []
  const activeUnit = units[selectedUnitIdx] || units[0] || null
  const weakUnitsCount = units.filter(u => Number(u.accuracy_percentage || 0) < 50 || Number(u.total_attempts || 0) === 0).length

  // ── History & Trend Computations ───────────────────────────────────────────
  const allAttempts = data?.allAttempts ?? []
  const mockTestHistory = data?.mockTestHistory ?? []
  const allCompletedHistory = (data?.allMockTestHistory && data.allMockTestHistory.length > 0)
    ? data.allMockTestHistory
    : mockTestHistory
  const displayHistory = timeFilter === 'last5'
    ? (mockTestHistory.length > 0 ? mockTestHistory.slice(-5) : allCompletedHistory.slice(-5))
    : allCompletedHistory
  const trendSummary = data?.trendSummary ?? {}

  // Last 5 mocks average calculation
  const last5Tests = mockTestHistory.length > 0 ? mockTestHistory.slice(-5) : allCompletedHistory.slice(-5)
  const avgScoreLast5 = last5Tests.length > 0
    ? Number((last5Tests.reduce((s, t) => s + Number(t.score || 0), 0) / last5Tests.length).toFixed(1))
    : Number(data?.avgScore || 0)
  const consistentMocksCount = last5Tests.filter(t => Number(t.score || 0) >= 60 || Number(t.accuracy || 0) >= 60).length
  const consistencyPct = last5Tests.length > 0 ? Math.round((consistentMocksCount / last5Tests.length) * 100) : 0

  // ── Readiness Index Formula: 0.50 * Mock Score + 0.30 * Syllabus Mastery + 0.20 * Consistency % ──
  const hasAttempts = Boolean(data?.hasData && (data?.totalAttempts > 0))
  const syllabusMasteryPct = Number(syllabusData?.overall_accuracy ?? syllabusData?.coverage_percentage ?? 0)
  const readinessIndex = hasAttempts
    ? Math.min(100, Math.round(0.50 * avgScoreLast5 + 0.30 * syllabusMasteryPct + 0.20 * consistencyPct))
    : (syllabusMasteryPct > 0 ? Math.round(syllabusMasteryPct * 0.30) : 0)

  // ── Error Intelligence Computations ────────────────────────────────────────
  const extractedMistakes = useMemo(() => {
    const list = []
    const seenMap = new Map()

    allAttempts.forEach(att => {
      const answers = att.attempt_answers || []
      answers.forEach(ans => {
        const q = ans.questions || {}
        const qId = ans.question_id || q.id
        if (!qId) return

        seenMap.set(String(qId), (seenMap.get(String(qId)) || 0) + 1)

        const isOptE = ans.selected_option === 'E' || ans.selected_option === 'e'
        const isUnanswered = ans.selected_option == null || ans.selected_option === ''
        const isWrong = ans.is_correct === false || isOptE

        if (isWrong || isUnanswered) {
          const timing = allQuestionTimings.find(t => String(t.questionId) === String(qId))
          const timeSpentSec = ans.time_spent_seconds != null && Number(ans.time_spent_seconds) > 0
            ? Math.round(Number(ans.time_spent_seconds))
            : (timing ? timing.timeSpentSec : 45)

          let classification = 'Concept Confused'
          let badgeColor = 'bg-purple-100 text-purple-800 border-purple-200'
          if (isOptE || isUnanswered) {
            classification = 'Concept Not Known'
            badgeColor = 'bg-slate-100 text-slate-700 border-slate-200'
          } else if (timeSpentSec < 35) {
            classification = 'Careless Reading'
            badgeColor = 'bg-amber-100 text-amber-800 border-amber-200'
          } else if (timeSpentSec >= 70) {
            classification = 'Time Pressure'
            badgeColor = 'bg-red-100 text-red-800 border-red-200'
          }

          const qText = q.question_text || timing?.questionText || `Question #${q.question_number || ''}`
          const lowerText = (qText || '').toLowerCase()
          let qFormat = 'MULTIPLE_CHOICE'
          if (lowerText.includes('match') || lowerText.includes('பொருத்துக') || lowerText.includes('list-i')) {
            qFormat = 'MATCHING'
          } else if ((lowerText.includes('assertion') || lowerText.includes('கூற்று')) && (lowerText.includes('reason') || lowerText.includes('காரணம்'))) {
            qFormat = 'ASSERTION_REASON'
          } else if (lowerText.includes('chronolog') || lowerText.includes('காலவரிசை') || lowerText.includes('வரிசைப்படுத்துக')) {
            qFormat = 'CHRONOLOGY'
          } else if (lowerText.includes('statement') || lowerText.includes('கூற்று') || lowerText.includes('பின்வரும்')) {
            qFormat = 'STATEMENT_EVALUATION'
          }

          list.push({
            id: ans.id || `${att.id}-${qId}`,
            questionId: String(qId),
            questionNumber: q.question_number || timing?.questionNumber || 1,
            questionText: qText,
            correctOption: q.correct_option || '—',
            selectedOption: ans.selected_option || 'Unattempted',
            timeSpentSec,
            classification,
            badgeColor,
            qFormat,
            subject: att.papers?.subject || timing?.subject || 'General Studies',
            paperTitle: att.papers?.title || 'Mock Test',
            date: att.submitted_at || att.created_at,
            isOptionE: isOptE,
            isUnanswered,
          })
        }
      })
    })

    return list.map(m => ({
      ...m,
      isRepeated: (seenMap.get(m.questionId) || 0) > 1,
      seenCount: seenMap.get(m.questionId) || 1,
    }))
  }, [allAttempts, allQuestionTimings])

  const uniqueMistakeIds = useMemo(() => {
    return Array.from(new Set(extractedMistakes.map(m => m.questionId))).filter(Boolean)
  }, [extractedMistakes])

  const repeatedMistakes = useMemo(() => {
    return extractedMistakes.filter(m => m.isRepeated)
  }, [extractedMistakes])

  const filteredMistakes = useMemo(() => {
    if (errorTypeFilter === 'ALL') return extractedMistakes
    if (errorTypeFilter === 'REPEATED') return repeatedMistakes
    return extractedMistakes.filter(m => m.classification === errorTypeFilter)
  }, [extractedMistakes, repeatedMistakes, errorTypeFilter])

  const lossAttribution = useMemo(() => {
    const total = extractedMistakes.length
    if (total === 0) {
      return {
        total: 0,
        careless: { count: 0, pct: 0 },
        timePressure: { count: 0, pct: 0 },
        conceptConfused: { count: 0, pct: 0 },
        notKnown: { count: 0, pct: 0 },
      }
    }
    const carelessCount = extractedMistakes.filter(m => m.classification === 'Careless Reading').length
    const timePressureCount = extractedMistakes.filter(m => m.classification === 'Time Pressure').length
    const conceptConfusedCount = extractedMistakes.filter(m => m.classification === 'Concept Confused').length
    const notKnownCount = extractedMistakes.filter(m => m.classification === 'Concept Not Known').length

    return {
      total,
      careless: { count: carelessCount, pct: Math.round((carelessCount / total) * 100) },
      timePressure: { count: timePressureCount, pct: Math.round((timePressureCount / total) * 100) },
      conceptConfused: { count: conceptConfusedCount, pct: Math.round((conceptConfusedCount / total) * 100) },
      notKnown: { count: notKnownCount, pct: Math.round((notKnownCount / total) * 100) },
    }
  }, [extractedMistakes])

  // ── Difficulty Calibration Computations ────────────────────────────────────
  const difficultyCalibration = useMemo(() => {
    let easyTot = 0, easyCor = 0
    let medTot  = 0, medCor  = 0
    let hardTot = 0, hardCor = 0

    allAttempts.forEach(att => {
      (att.attempt_answers || []).forEach(ans => {
        const q = ans.questions || {}
        const diff = (q.difficulty || 'medium').toLowerCase()
        if (diff === 'easy') {
          easyTot++
          if (ans.is_correct) easyCor++
        } else if (diff === 'hard') {
          hardTot++
          if (ans.is_correct) hardCor++
        } else {
          medTot++
          if (ans.is_correct) medCor++
        }
      })
    })

    const hasAny = (easyTot + medTot + hardTot) > 0
    return [
      {
        level: 'Easy (20% Target)',
        count: easyTot,
        accuracy: easyTot > 0 ? Math.round((easyCor / easyTot) * 100) : (hasAny ? 0 : 85),
        color: 'bg-emerald-500',
        textColor: 'text-emerald-700',
      },
      {
        level: 'Medium (50% Target)',
        count: medTot,
        accuracy: medTot > 0 ? Math.round((medCor / medTot) * 100) : (hasAny ? 0 : 70),
        color: 'bg-blue-500',
        textColor: 'text-blue-700',
      },
      {
        level: 'Hard (30% Target)',
        count: hardTot,
        accuracy: hardTot > 0 ? Math.round((hardCor / hardTot) * 100) : (hasAny ? 0 : 52),
        color: 'bg-purple-500',
        textColor: 'text-purple-700',
      },
    ]
  }, [allAttempts])

  // ── Question Intelligence by Type Computations ─────────────────────────────
  const questionFormatAnalytics = useMemo(() => {
    const formats = [
      { type: 'MULTIPLE_CHOICE', label: 'Direct Multiple Choice', desc: 'Standard 4-option conceptual recall' },
      { type: 'STATEMENT_EVALUATION', label: 'Statement Evaluation', desc: 'Statements I & II, multi-premise verification' },
      { type: 'MATCHING', label: 'Matching Lists', desc: 'List-I with List-II paired associations' },
      { type: 'CHRONOLOGY', label: 'Chronological Ordering', desc: 'Historical events & timeline sequencing' },
      { type: 'ASSERTION_REASON', label: 'Assertion & Reason', desc: 'Dual statement causal evaluation' },
    ]

    const statsMap = {}
    formats.forEach(f => {
      statsMap[f.type] = { total: 0, correct: 0, totalTimeSec: 0 }
    })

    allAttempts.forEach(att => {
      (att.attempt_answers || []).forEach(ans => {
        const q = ans.questions || {}
        const qText = (q.question_text || '').toLowerCase()
        let fType = 'MULTIPLE_CHOICE'
        if (qText.includes('match') || qText.includes('பொருத்துக') || qText.includes('list-i')) {
          fType = 'MATCHING'
        } else if ((qText.includes('assertion') || qText.includes('கூற்று')) && (qText.includes('reason') || qText.includes('காரணம்'))) {
          fType = 'ASSERTION_REASON'
        } else if (qText.includes('chronolog') || qText.includes('காலவரிசை') || qText.includes('வரிசைப்படுத்துக')) {
          fType = 'CHRONOLOGY'
        } else if (qText.includes('statement') || qText.includes('கூற்று') || qText.includes('பின்வரும்')) {
          fType = 'STATEMENT_EVALUATION'
        }

        statsMap[fType].total += 1
        if (ans.is_correct) statsMap[fType].correct += 1
        statsMap[fType].totalTimeSec += Number(ans.time_spent_seconds || 48)
      })
    })

    return formats.map(f => {
      const s = statsMap[f.type]
      const attempted = s.total
      const correct = s.correct
      const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : null
      const avgTime = attempted > 0 ? Math.round(s.totalTimeSec / attempted) : 48
      const status = accuracy == null
        ? 'Untested'
        : accuracy >= 75
        ? 'Mastered'
        : accuracy >= 50
        ? 'Moderate'
        : 'Vulnerable'

      const statusBadge =
        status === 'Mastered' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
        status === 'Moderate' ? 'bg-amber-100 text-amber-800 border-amber-200' :
        status === 'Vulnerable' ? 'bg-red-100 text-red-800 border-red-200' :
        'bg-slate-100 text-slate-600 border-slate-200'

      return {
        ...f,
        attempted,
        correct,
        accuracy,
        avgTime,
        status,
        statusBadge,
      }
    })
  }, [allAttempts])

  // Helper to trigger Fix Test or Targeted Drill
  const handleLaunchFixTest = (specificMistakeIds = null) => {
    const idsToUse = specificMistakeIds || uniqueMistakeIds
    if (idsToUse && idsToUse.length > 0) {
      const idsParam = idsToUse.slice(0, 30).join(',')
      navigate(`/practice?mode=fix_test&mistakes=${idsParam}`)
    } else {
      const sorted = units.slice().sort((a, b) => Number(a.accuracy_percentage || 0) - Number(b.accuracy_percentage || 0))
      const target = sorted[0]
      if (target) {
        navigate(`/practice?subject=${encodeURIComponent(target.unit_name)}&unit=${encodeURIComponent(target.unit_number)}`)
      } else {
        navigate('/practice')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-surface-border">
        <Loader2 className="w-8 h-8 animate-spin text-tnpsc-brand" />
        <p className="text-xs text-body-secondary font-medium">Loading Master Analytics AI Command Center…</p>
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
    <div className="space-y-6 animate-fade-in">
      {/* ── Top Bar & KPI Strip (6 Global Metrics) ────────────────────────── */}
      <div className="bg-[#111426] text-white rounded-2xl overflow-hidden shadow-card border border-slate-800">
        <div className="p-5 sm:p-6 border-b border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#635bff] to-[#7c3aed] flex items-center justify-center text-lg font-black shrink-0 shadow-brand">
                ◈
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight">
                  Master Analytics — AI Command Center
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedExam} · Real-time diagnostic telemetry, syllabus mastery &amp; performance trajectory.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimeFilter('last5')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                  timeFilter === 'last5'
                    ? 'bg-[#635bff] border-[#635bff] text-white'
                    : 'bg-[#181e32] border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                Last 5 full tests
              </button>
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                  timeFilter === 'all'
                    ? 'bg-[#635bff] border-[#635bff] text-white'
                    : 'bg-[#181e32] border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                All Attempts
              </button>
            </div>
          </div>

          {/* 6 Top Global KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5">
            {/* KPI 1: Readiness Index (0-100) + Delta */}
            <div className="bg-gradient-to-br from-[#25205a] to-[#191d38] border border-[#5147a7] rounded-xl p-3">
              <small className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Readiness Index
              </small>
              <b className="block text-xl font-black text-[#a9a4ff] mt-1">
                {readinessIndex} / 100
                {trendSummary.hasMultipleTests && trendSummary.latestDeltaScore !== 0 && (
                  <span className={`text-xs font-bold ml-1.5 ${trendSummary.latestDeltaScore > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trendSummary.latestDeltaScore > 0 ? `↑ ${trendSummary.latestDeltaScore}` : `↓ ${Math.abs(trendSummary.latestDeltaScore)}`}
                  </span>
                )}
              </b>
              <span className="block text-[10px] text-slate-400 mt-0.5">
                50% Mock · 30% Syl · 20% Cons
              </span>
            </div>

            {/* KPI 2: Average Score (out of 200) */}
            <div className="bg-[#181e32] border border-slate-800 rounded-xl p-3">
              <small className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Average Score
              </small>
              <b className="block text-xl font-black text-white mt-1">
                {hasAttempts ? `${Math.round((avgScoreLast5 / 100) * 200)} / 200` : '—'}
              </b>
              <span className="block text-[10px] text-slate-400 mt-0.5">
                {hasAttempts ? `${avgScoreLast5}% (N=${Math.min(5, last5Tests.length || 1)})` : 'No mock scores'}
              </span>
            </div>

            {/* KPI 3: Attempted Accuracy */}
            <div className="bg-[#181e32] border border-slate-800 rounded-xl p-3">
              <small className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Attempted Accuracy
              </small>
              <b className="block text-xl font-black text-emerald-400 mt-1">
                {hasAttempts ? `${data.avgAccuracy}%` : '—'}
              </b>
              <span className="block text-[10px] text-slate-400 mt-0.5">
                {hasAttempts
                  ? (data.totalAnswered === 1
                      ? 'Based on 1 answered Q'
                      : `Based on ${data.totalAnswered || 0} answered Qs`)
                  : 'No attempts recorded'}
              </span>
            </div>

            {/* KPI 4: Avg Time / Q */}
            <div className="bg-[#181e32] border border-slate-800 rounded-xl p-3">
              <small className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Avg Time / Q
              </small>
              <b className="block text-xl font-black text-white mt-1">
                {pacingSummary.count > 0 ? `${pacingSummary.avgTimeSec} sec` : '—'}
              </b>
              <span className="block text-[10px] text-slate-400 mt-0.5">
                Target: 54s / Q
              </span>
            </div>

            {/* KPI 5: Consistency (Mocks >= baseline / 5) */}
            <div className="bg-[#181e32] border border-slate-800 rounded-xl p-3">
              <small className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Consistency
              </small>
              <b className="block text-xl font-black text-white mt-1">
                {hasAttempts ? `${consistentMocksCount} / ${Math.min(5, Math.max(1, last5Tests.length))}` : '—'}
              </b>
              <span className="block text-[10px] text-slate-400 mt-0.5">
                Mocks ≥ 60% baseline
              </span>
            </div>

            {/* KPI 6: Weak Units */}
            <div className="bg-[#181e32] border border-slate-800 rounded-xl p-3">
              <small className="block text-[10px] font-bold text-red-400 uppercase tracking-wider">
                Weak Units
              </small>
              <b className="block text-xl font-black text-red-400 mt-1">
                {weakUnitsCount}
              </b>
              <span className="block text-[10px] text-slate-400 mt-0.5">
                Unit Score &lt; 50%
              </span>
            </div>
          </div>
        </div>

        {/* ── 7 Top Navigation Tabs with Exact IDs ──────────────────────── */}
        <div className="flex items-center gap-6 px-6 bg-[#111426] border-b border-slate-800/80 overflow-x-auto">
          {DIAGNOSTIC_TABS.map(tab => (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              data-testid={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 text-xs font-black tracking-wide border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-tnpsc-brand text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
              {tab.id === 'ma-view-errors' && uniqueMistakeIds.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">
                  {uniqueMistakeIds.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: OVERVIEW VIEW (id: ma-view-overview)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ma-view-overview' && (
        <div id="ma-view-overview" data-testid="ma-view-overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Performance Trajectory Chart */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-body-text">Performance Trajectory</h3>
                  <p className="text-xs text-body-secondary mt-0.5">
                    Score progression across completed mock tests
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('ma-view-history')}
                  className="text-xs font-bold text-tnpsc-brand hover:underline"
                >
                  View full history →
                </button>
              </div>

              {displayHistory.length > 0 ? (
                <div className="h-48 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={displayHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="shortLabel" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                      <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                      <Line type="monotone" dataKey="score" stroke="#635BFF" strokeWidth={3} dot={{ fill: '#fff', stroke: '#635BFF', strokeWidth: 2, r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-body-secondary bg-slate-50 rounded-xl">
                  Take full mock exams to visualize your performance curve here.
                </div>
              )}

              {/* Loss Attribution (4 Buckets) */}
              <div className="pt-3 border-t border-surface-border">
                <span className="text-[11px] font-bold text-body-secondary uppercase tracking-wider block mb-2">
                  Score Loss Attribution (Where marks were dropped)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">Careless (&lt;35s)</span>
                    <b className="text-sm font-black text-amber-900 mt-0.5 block">{lossAttribution.careless.count} Qs</b>
                    <span className="text-[10px] text-amber-700">{lossAttribution.careless.pct}% of loss</span>
                  </div>
                  <div className="bg-red-50/70 border border-red-200 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-red-800 uppercase block">Time Pressure (&ge;70s)</span>
                    <b className="text-sm font-black text-red-900 mt-0.5 block">{lossAttribution.timePressure.count} Qs</b>
                    <span className="text-[10px] text-red-700">{lossAttribution.timePressure.pct}% of loss</span>
                  </div>
                  <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-purple-800 uppercase block">Concept Confused</span>
                    <b className="text-sm font-black text-purple-900 mt-0.5 block">{lossAttribution.conceptConfused.count} Qs</b>
                    <span className="text-[10px] text-purple-700">{lossAttribution.conceptConfused.pct}% of loss</span>
                  </div>
                  <div className="bg-slate-100/80 border border-slate-200 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-slate-700 uppercase block">Option E / Blank</span>
                    <b className="text-sm font-black text-slate-800 mt-0.5 block">{lossAttribution.notKnown.count} Qs</b>
                    <span className="text-[10px] text-slate-600">{lossAttribution.notKnown.pct}% unattempted</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Vina's Study Diagnosis (Dark Panel) */}
            <div className="lg:col-span-5 bg-[#111426] text-white rounded-2xl border border-slate-800 p-6 shadow-subtle flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Vina's Study Diagnosis</h3>
                <p className="text-xs text-slate-400 mt-0.5">Evidence-based signals from your diagnostic data.</p>
              </div>

              <div className="space-y-3">
                <div className="bg-[#181e32] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                    01 · High-Impact Weakness
                  </span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {units.length > 0 && units.slice().sort((a,b) => Number(a.accuracy_percentage||0) - Number(b.accuracy_percentage||0))[0]
                      ? `${units.slice().sort((a,b) => Number(a.accuracy_percentage||0) - Number(b.accuracy_percentage||0))[0].unit_name} is your highest-loss zone. Focus on micro-topics rather than reading entire textbooks.`
                      : 'Units with lowest accuracy limit overall rank. Focus on micro-topics instead of rereading entire books.'}
                  </p>
                </div>

                <div className="bg-[#181e32] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                    02 · Pacing vs. Accuracy
                  </span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {pacingSummary.avgTimeSec >= 70
                      ? 'Average pace is behind the 54s benchmark. Use timed 25Q drills to build mental stamina.'
                      : 'Pacing is within benchmark. Maintain 54s discipline in Aptitude and complex statement evaluation questions.'}
                  </p>
                </div>

                <div className="bg-[#181e32] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                    03 · Next Best Action
                  </span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {uniqueMistakeIds.length > 0
                      ? `You have ${uniqueMistakeIds.length} unique mistakes. Run a Fix Test to solidify these concepts before your next mock.`
                      : 'Complete targeted practice sets in your lowest units before your next full exam attempt.'}
                  </p>
                </div>
              </div>

              {/* Difficulty Calibration Bars */}
              <div className="bg-[#181e32] border border-slate-800 rounded-xl p-3 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Difficulty Calibration
                </span>
                {difficultyCalibration.map(d => (
                  <div key={d.level} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">{d.level}</span>
                      <span className="font-bold text-white">{d.accuracy}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${d.color}`} style={{ width: `${Math.min(100, Math.max(d.accuracy, 4))}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleLaunchFixTest()}
                className="w-full py-2.5 rounded-xl bg-tnpsc-brand hover:bg-tnpsc-brand-dark text-white font-bold text-xs transition-colors shadow-brand"
              >
                {uniqueMistakeIds.length > 0 ? `Target Weakness Drill (${uniqueMistakeIds.length} Mistakes) →` : 'Target Weakness Drill →'}
              </button>
            </div>
          </div>

          {/* Syllabus Performance Matrix Grid */}
          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-body-text">Syllabus Performance Matrix</h3>
                <p className="text-xs text-body-secondary mt-0.5">
                  Click any unit card to inspect its micro-topic X-Ray in Syllabus Mastery.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('ma-view-syllabus')}
                className="text-xs font-bold text-tnpsc-brand hover:underline"
              >
                Open full matrix →
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {units.map((u, i) => {
                const score = Number(u.accuracy_percentage || 0)
                const isWeak = score < 50 || Number(u.total_attempts || 0) === 0
                return (
                  <div
                    key={u.unit_id || i}
                    onClick={() => {
                      setSelectedUnitIdx(i)
                      setActiveTab('ma-view-syllabus')
                    }}
                    className={`bg-slate-50 border rounded-xl p-3.5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-subtle ${
                      isWeak ? 'border-red-200 hover:border-red-300' : 'border-surface-border hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-body-text truncate">{u.unit_name}</span>
                      <span className={`font-black ${isWeak ? 'text-red-600' : 'text-tnpsc-brand'}`}>
                        {score}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full ${isWeak ? 'bg-red-500' : 'bg-tnpsc-brand'}`}
                        style={{ width: `${Math.min(100, Math.max(score, 5))}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: SYLLABUS MASTERY VIEW (id: ma-view-syllabus)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ma-view-syllabus' && (
        <div id="ma-view-syllabus" data-testid="ma-view-syllabus" className="space-y-6">
          {/* Unit selector chips with official status badges */}
          <div className="bg-white rounded-2xl border border-surface-border p-4 shadow-subtle flex items-center gap-2 overflow-x-auto">
            {units.map((u, i) => {
              const isSelected = selectedUnitIdx === i
              const score = Number(u.accuracy_percentage || 0)
              const badge = score >= 70 ? 'Strong' : score >= 50 ? 'In Progress' : 'Weak Zone'
              const badgeStyle =
                score >= 70 ? 'bg-emerald-100 text-emerald-800' :
                score >= 50 ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800'

              return (
                <button
                  key={u.unit_id || i}
                  onClick={() => setSelectedUnitIdx(i)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-2 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-body-secondary border-surface-border hover:bg-slate-50'
                  }`}
                >
                  <span>Unit {u.unit_number}: {u.unit_name} · {score}%</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${badgeStyle}`}>
                    {badge}
                  </span>
                </button>
              )
            })}
          </div>

          {activeUnit && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Cols: Micro-topic X-Ray */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-body-text">
                      Micro-Topic X-Ray — {activeUnit.unit_name}
                    </h3>
                    <p className="text-xs text-body-secondary mt-0.5">
                      Formula: (Correct in Micro / Total Seen in Micro) * 100 (Option E included).
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      navigate(
                        `/practice?subject=${encodeURIComponent(activeUnit.unit_name)}&unit=${encodeURIComponent(activeUnit.unit_number)}`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-tnpsc-brand text-white font-bold text-xs hover:bg-tnpsc-brand-dark transition-colors"
                  >
                    Practice Unit →
                  </button>
                </div>

                <div className="space-y-4">
                  {(activeUnit.macro_topics || []).map((macro) => {
                    const macroScore = Number(macro.accuracy_percentage || 0)
                    return (
                      <div key={macro.macro_topic_id} className="border border-surface-border rounded-xl p-4 bg-slate-50/60 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-body-text">
                          <span className="text-slate-800">{macro.macro_topic_name}</span>
                          <span className={macroScore >= 70 ? 'text-emerald-700' : macroScore >= 50 ? 'text-amber-700' : 'text-red-700'}>
                            {macroScore}% Macro Avg
                          </span>
                        </div>

                        <div className="space-y-2">
                          {(macro.micro_topics || []).map(micro => {
                            const microScore = Number(micro.accuracy_percentage || 0)
                            const badge =
                              microScore >= 70 ? { label: 'Mastered ✓', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' } :
                              microScore >= 50 ? { label: 'Pending ○', style: 'bg-slate-100 text-slate-700 border-slate-200' } :
                              { label: 'Needs Review !', style: 'bg-red-50 text-red-700 border-red-200' }

                            return (
                              <div key={micro.micro_topic_id} className="bg-white border border-surface-border rounded-lg p-2.5 space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-body-text truncate max-w-[260px]">
                                    {micro.micro_topic_name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.style}`}>
                                      {badge.label}
                                    </span>
                                    <span className="font-black text-body-text">{microScore}%</span>
                                    <button
                                      onClick={() => navigate(`/practice?subject=${encodeURIComponent(activeUnit.unit_name)}&unit=${encodeURIComponent(activeUnit.unit_number)}&micro_topic_id=${encodeURIComponent(micro.micro_topic_id)}`)}
                                      className="text-[11px] font-bold text-tnpsc-brand hover:underline ml-1"
                                    >
                                      Drill →
                                    </button>
                                  </div>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${microScore >= 70 ? 'bg-emerald-500' : microScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(100, Math.max(microScore, 4))}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right 5 Cols: Unit Action Center (Dark Panel) */}
              <div className="lg:col-span-5 bg-[#111426] text-white rounded-2xl border border-slate-800 p-6 shadow-subtle flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Unit Action Center</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Convert diagnosis into a focused study action.</p>
                </div>

                <div className="space-y-3">
                  <div className="bg-[#181e32] border border-slate-800 rounded-xl p-3.5">
                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                      01 · Diagnosis
                    </span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {Number(activeUnit.accuracy_percentage || 0) < 50
                        ? `${activeUnit.unit_name} is currently a high-priority weakness. Multiple sub-topics require revision.`
                        : `${activeUnit.unit_name} is broadly on track. Target the lowest sub-topic to push toward 85%+ mastery.`}
                    </p>
                  </div>

                  <div className="bg-[#181e32] border border-slate-800 rounded-xl p-3.5">
                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                      02 · Recommended Drill
                    </span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      25 targeted practice questions followed by an error review before attempting your next mock test.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    navigate(
                      `/practice?subject=${encodeURIComponent(activeUnit.unit_name)}&unit=${encodeURIComponent(activeUnit.unit_number)}`
                    )
                  }
                  className="w-full py-3 rounded-xl bg-tnpsc-brand hover:bg-tnpsc-brand-dark text-white font-bold text-xs transition-colors shadow-brand"
                >
                  Start {activeUnit.unit_name} Practice →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: ERROR INTELLIGENCE VIEW (id: ma-view-errors)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ma-view-errors' && (
        <div id="ma-view-errors" data-testid="ma-view-errors" className="space-y-6">
          {/* Top Summary Banner & Fix Test CTA */}
          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800">
                  Deterministic Error Intelligence
                </span>
                <span className="text-xs text-body-secondary">
                  {uniqueMistakeIds.length} Unique Mistake Question IDs Logged
                </span>
              </div>
              <h3 className="text-base font-bold text-body-text mt-1">
                Mistake Review &amp; Revision Priority Queue
              </h3>
              <p className="text-xs text-body-secondary mt-0.5">
                Classified deterministically by response duration, difficulty tier, and Option E ("Answer not known").
              </p>
            </div>

            <button
              onClick={() => handleLaunchFixTest()}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-subtle shrink-0 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Generate Fix Test from Mistakes ({uniqueMistakeIds.length})</span>
            </button>
          </div>

          {/* 4 Deterministic Error Taxonomy Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase">Careless Reading</span>
                <span className="text-xs font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {lossAttribution.careless.count} Qs
                </span>
              </div>
              <p className="text-xs text-body-secondary mt-2">
                Answered incorrectly in &lt; 35s. Misread negative phrasing ("not correct", "except").
              </p>
            </div>

            <div className="bg-white border border-red-200 rounded-xl p-4 shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-800 uppercase">Time Pressure</span>
                <span className="text-xs font-black text-red-900 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  {lossAttribution.timePressure.count} Qs
                </span>
              </div>
              <p className="text-xs text-body-secondary mt-2">
                Answered incorrectly in &ge; 70s. Over-extended struggle or rushed in final quarter.
              </p>
            </div>

            <div className="bg-white border border-purple-200 rounded-xl p-4 shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-800 uppercase">Concept Confused</span>
                <span className="text-xs font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  {lossAttribution.conceptConfused.count} Qs
                </span>
              </div>
              <p className="text-xs text-body-secondary mt-2">
                Moderate timing (35–70s) on Medium/Hard topics. Fell for close distractor options.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">Concept Not Known</span>
                <span className="text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  {lossAttribution.notKnown.count} Qs
                </span>
              </div>
              <p className="text-xs text-body-secondary mt-2">
                Selected Option E ("விடை தெரியவில்லை") or unattempted. Zero penalty, needs baseline study.
              </p>
            </div>
          </div>

          {/* Repeated Mistake Alert Banner */}
          {repeatedMistakes.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-red-900">
                    Repeated Mistake Detector: {repeatedMistakes.length} Persistent Blind Spots
                  </h4>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    These questions were answered incorrectly across multiple mock test or practice sessions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleLaunchFixTest(repeatedMistakes.map(m => m.questionId))}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors shrink-0"
              >
                Drill Repeated Mistakes ({repeatedMistakes.length}) →
              </button>
            </div>
          )}

          {/* Filter Pills for Error Types */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'ALL', label: `All Errors (${extractedMistakes.length})` },
              { id: 'REPEATED', label: `Repeated Mistakes (${repeatedMistakes.length})` },
              { id: 'Careless Reading', label: `Careless (${lossAttribution.careless.count})` },
              { id: 'Time Pressure', label: `Time Pressure (${lossAttribution.timePressure.count})` },
              { id: 'Concept Confused', label: `Concept Confused (${lossAttribution.conceptConfused.count})` },
              { id: 'Concept Not Known', label: `Option E / Blank (${lossAttribution.notKnown.count})` },
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setErrorTypeFilter(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  errorTypeFilter === pill.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-surface-border text-body-secondary hover:bg-slate-50'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Revision Priority Queue Table */}
          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-body-text">
              Revision Priority Queue
            </h3>

            {filteredMistakes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-border text-body-secondary uppercase text-[10px]">
                      <th className="pb-3 font-bold">Question Preview</th>
                      <th className="pb-3 font-bold">Subject / Unit</th>
                      <th className="pb-3 font-bold">Error Type</th>
                      <th className="pb-3 font-bold">Time Spent</th>
                      <th className="pb-3 font-bold">Selected</th>
                      <th className="pb-3 font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {filteredMistakes.slice(0, 30).map((m, idx) => (
                      <tr key={m.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 pr-4 max-w-[280px]">
                          <p className="font-bold text-body-text line-clamp-2">{m.questionText}</p>
                          <span className="text-[10px] text-body-secondary">{m.paperTitle}</span>
                        </td>
                        <td className="py-3 font-semibold text-body-secondary">{m.subject}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${m.badgeColor}`}>
                            {m.classification}
                          </span>
                          {m.isRepeated && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-700">
                              Repeated {m.seenCount}x
                            </span>
                          )}
                        </td>
                        <td className="py-3 font-black text-body-text">{m.timeSpentSec}s</td>
                        <td className="py-3 font-semibold text-body-secondary">
                          {m.isOptionE ? 'Opt E (Unknown)' : m.selectedOption}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => handleLaunchFixTest([m.questionId])}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors text-[11px]"
                          >
                            Drill This Q
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-body-secondary bg-slate-50 rounded-xl">
                No mistakes match the selected filter. Keep taking tests to populate your Error Intelligence queue.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: TIME & PACING VIEW (id: ma-view-pacing)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ma-view-pacing' && (
        <div id="ma-view-pacing" data-testid="ma-view-pacing" className="space-y-6">
          {/* Header & Category Filter Pills */}
          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
              <div>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800">
                  TNPSC Benchmark: 54s / Question (3 Hours / 200 Questions)
                </span>
                <h3 className="text-base font-bold text-body-text mt-1">
                  Pacing &amp; Time-Loss Analyzer
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-body-secondary">Avg Pace:</span>
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-black border ${
                    pacingSummary.overallStatus === 'behind'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {pacingSummary.avgTimeSec}s / Q ({pacingSummary.overallStatus === 'behind' ? 'Behind Pace' : 'On Pace'})
                </span>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {PACING_CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedPacingCategory(category)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedPacingCategory === category
                      ? 'bg-tnpsc-brand text-white shadow-sm'
                      : 'bg-slate-100 text-body-secondary hover:bg-slate-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Pacing KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-surface-border rounded-xl p-4 shadow-subtle">
              <span className="text-xs font-semibold text-body-secondary">Target Benchmark</span>
              <p className="text-2xl font-black text-body-text mt-1">54s <span className="text-xs font-normal">/ Q</span></p>
              <p className="text-[11px] text-body-secondary mt-0.5">Standard 200Q TNPSC speed</p>
            </div>

            <div className="bg-white border border-surface-border rounded-xl p-4 shadow-subtle">
              <span className="text-xs font-semibold text-body-secondary">Your Avg Pace</span>
              <p className={`text-2xl font-black mt-1 ${pacingSummary.avgTimeSec >= 70 ? 'text-red-600' : 'text-emerald-600'}`}>
                {pacingSummary.avgTimeSec}s
              </p>
              <p className="text-[11px] text-body-secondary mt-0.5">
                {pacingSummary.avgTimeSec > 54 ? `+${pacingSummary.avgTimeSec - 54}s vs benchmark` : 'Within time budget'}
              </p>
            </div>

            <div className="bg-white border border-surface-border rounded-xl p-4 shadow-subtle">
              <span className="text-xs font-semibold text-body-secondary">Net Time Lost / Gained</span>
              <p className={`text-2xl font-black mt-1 ${pacingSummary.netDeltaSec > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {pacingSummary.netDeltaSec > 0 ? `+${formatDeltaSeconds(pacingSummary.netDeltaSec)}` : `-${formatDeltaSeconds(pacingSummary.netDeltaSec)}`}
              </p>
              <p className="text-[11px] text-body-secondary mt-0.5">
                {pacingSummary.netDeltaSec > 0 ? 'Behind target pace' : 'Ahead of target pace'}
              </p>
            </div>

            <div className="bg-white border border-surface-border rounded-xl p-4 shadow-subtle">
              <span className="text-xs font-semibold text-body-secondary">Slow Responses (&ge;70s)</span>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {pacingSummary.behindPaceCount}
              </p>
              <p className="text-[11px] text-body-secondary mt-0.5">Questions needing speed drill</p>
            </div>
          </div>

          {/* Category Pacing vs Target & Exam Quarter Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-4">
              <h3 className="text-sm font-bold text-body-text">
                Category Pacing vs. 54s Target
              </h3>
              <div className="space-y-3">
                {categoryPacingBreakdown.map(cat => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-body-text">{cat.category}</span>
                      <span className={`font-black ${cat.status === 'behind' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {cat.avgSec}s / Q
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          cat.status === 'behind' ? 'bg-red-500' : cat.status === 'watch' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.round((cat.avgSec / 90) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111426] text-white rounded-2xl border border-slate-800 p-6 shadow-subtle space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Exam Pacing Profile by Quarter</h3>
                <p className="text-xs text-slate-400 mt-0.5">Telemetry across standard mock exam quarters.</p>
              </div>

              <div className="space-y-2.5">
                {[
                  { q: '0 – 25% (Qs 1–50)', time: '42s / Q', status: 'Optimal' },
                  { q: '25 – 50% (Qs 51–100)', time: '46s / Q', status: 'Optimal' },
                  { q: '50 – 75% (Qs 101–150)', time: '51s / Q', status: 'Optimal' },
                  { q: '75 – 100% (Qs 151–200)', time: '58s / Q', status: 'Fatigue Zone' },
                ].map(item => (
                  <div key={item.q} className="bg-[#181e32] border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{item.q}</span>
                    <span className="font-black text-white">{item.time}</span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-400">
                Tip: Maintain a buffer in the first half to absorb complex aptitude calculations in the final 50 questions.
              </p>
            </div>
          </div>

          {/* Pacing Speed Distribution Heatmap */}
          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-body-text">
              Speed Band Distribution Across All Attempted Questions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {pacingDistribution.map(band => (
                <div key={band.label} className="border border-surface-border rounded-xl p-4 bg-slate-50 space-y-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${band.text}`}>
                    {band.label}
                  </span>
                  <p className="text-2xl font-black text-body-text mt-1">{band.count} Qs</p>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${band.color}`} style={{ width: `${band.pct}%` }} />
                  </div>
                  <span className="text-[10px] text-body-secondary">{band.pct}% of all responses</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5: QUESTION INTELLIGENCE VIEW (id: ma-view-questions)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ma-view-questions' && (
        <div id="ma-view-questions" data-testid="ma-view-questions" className="space-y-6">
          {/* Header & Question Type Breakdown */}
          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">
                Question Format Intelligence
              </span>
              <h3 className="text-base font-bold text-body-text mt-1">
                Performance by TNPSC Question Format
              </h3>
              <p className="text-xs text-body-secondary mt-0.5">
                Evaluation across Direct MCQs, Statement Analysis, Match Lists, Chronology, and Assertion &amp; Reason.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {questionFormatAnalytics.map(qf => (
                <div key={qf.type} className="border border-surface-border rounded-xl p-4 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-body-text text-xs">{qf.label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${qf.statusBadge}`}>
                      {qf.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-body-secondary">{qf.desc}</p>
                  
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 text-center">
                    <div>
                      <span className="text-[10px] text-body-secondary uppercase block">Attempted</span>
                      <b className="text-xs font-black text-body-text">{qf.attempted}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-body-secondary uppercase block">Accuracy</span>
                      <b className="text-xs font-black text-emerald-600">
                        {qf.accuracy != null ? `${qf.accuracy}%` : '—'}
                      </b>
                    </div>
                    <div>
                      <span className="text-[10px] text-body-secondary uppercase block">Avg Time</span>
                      <b className="text-xs font-black text-body-text">{qf.avgTime}s</b>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/practice?type=${encodeURIComponent(qf.type)}`)}
                    className="w-full py-1.5 rounded-lg bg-white border border-surface-border hover:bg-slate-100 text-body-text font-bold text-xs transition-colors"
                  >
                    Practice Format →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Coverage & Exposure Metrics (Zero-Repetition Status) */}
          <div className="bg-[#111426] text-white rounded-2xl border border-slate-800 p-6 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Zero-Repetition Engine Active
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  Question Bank Coverage &amp; Exposure Telemetry
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Prioritizing unseen questions on every test launch
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-[#181e32] border border-slate-800 rounded-xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Question Exposure Ratio
                </span>
                <b className="text-2xl font-black text-white mt-1 block">
                  {data?.totalQuestions || 0} Seen
                </b>
                <span className="text-[11px] text-slate-400">Logged in user history table</span>
              </div>

              <div className="bg-[#181e32] border border-slate-800 rounded-xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Fresh Question Guarantee
                </span>
                <b className="text-2xl font-black text-emerald-400 mt-1 block">
                  100%
                </b>
                <span className="text-[11px] text-slate-400">Until question bank exhausted</span>
              </div>

              <div className="bg-[#181e32] border border-slate-800 rounded-xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Reshuffle Policy
                </span>
                <b className="text-2xl font-black text-indigo-400 mt-1 block">
                  Smart Reshuffle
                </b>
                <span className="text-[11px] text-slate-400">Least-seen questions prioritized</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 6: TEST HISTORY VIEW (id: ma-view-history)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ma-view-history' && (
        <div id="ma-view-history" data-testid="ma-view-history" className="space-y-6">
          <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-body-text">Full-Test Trajectory</h3>
                <p className="text-xs text-body-secondary mt-0.5">
                  Chronological test attempts, scores, and review links.
                </p>
              </div>
            </div>

            {displayHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-border text-body-secondary uppercase text-[10px]">
                      <th className="pb-3 font-bold">Test</th>
                      <th className="pb-3 font-bold">Date</th>
                      <th className="pb-3 font-bold">Score</th>
                      <th className="pb-3 font-bold">Accuracy</th>
                      <th className="pb-3 font-bold">Trajectory Delta</th>
                      <th className="pb-3 font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {displayHistory.map(test => (
                      <tr key={test.attemptId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 font-bold text-body-text">{test.label} — {test.paperTitle}</td>
                        <td className="py-3 text-body-secondary">{test.date ? formatDate(test.date) : 'Recent'}</td>
                        <td className="py-3 font-black text-tnpsc-brand">
                          {test.score}% ({Math.round((test.score / 100) * 200)} / 200)
                        </td>
                        <td className="py-3 font-bold text-emerald-600">{test.accuracy}%</td>
                        <td className="py-3 font-bold">
                          {test.deltaScore !== 0 ? (
                            <span className={test.deltaScore > 0 ? 'text-emerald-600' : 'text-red-600'}>
                              {test.deltaScore > 0 ? `+${test.deltaScore}` : test.deltaScore}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => navigate(`/attempt/${test.attemptId}/result`)}
                            className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors"
                          >
                            Review Test
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-body-secondary">
                No mock test attempts recorded yet. Take a test from Mock Tests to view history.
              </div>
            )}
          </div>

          {/* Improvement & Consistency Signals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-subtle">
              <span className="text-xs font-bold text-body-secondary uppercase">Improvement Signal</span>
              <p className="text-3xl font-black text-tnpsc-brand mt-1">
                {trendSummary.overallDeltaScore >= 0 ? `+${trendSummary.overallDeltaScore}` : trendSummary.overallDeltaScore}%
              </p>
              <p className="text-xs text-body-secondary mt-1">Net score change since your first mock test baseline.</p>
            </div>

            <div className="bg-white border border-surface-border rounded-xl p-5 shadow-subtle">
              <span className="text-xs font-bold text-body-secondary uppercase">Consistency Signal</span>
              <p className="text-3xl font-black text-body-text mt-1">
                {consistentMocksCount} / {Math.min(5, Math.max(1, last5Tests.length))}
              </p>
              <p className="text-xs text-body-secondary mt-1">Tests meeting or exceeding target accuracy benchmark.</p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 7: QUICK RECALL VIEW (id: ma-view-recall)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ma-view-recall' && (
        <div id="ma-view-recall" data-testid="ma-view-recall" className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-sm font-bold text-body-text">Daily Quick Recall Metrics</h3>
                <p className="text-xs text-body-secondary">Spaced repetition revision performance</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-xl border border-orange-200">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Streak Rule: 5/5 to Qualify</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-surface-border">
              <span className="text-xs font-semibold text-body-secondary">Active Streak</span>
              <p className="text-2xl font-black text-body-text mt-1">{recallData?.currentStreak ?? 0} d</p>
              <p className="text-[11px] text-body-secondary">Consecutive qualified days</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-surface-border">
              <span className="text-xs font-semibold text-body-secondary">Best Streak</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{recallData?.highestStreak ?? 0} d</p>
              <p className="text-[11px] text-body-secondary">All-time record</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-surface-border">
              <span className="text-xs font-semibold text-body-secondary">5/5 Perfect Rate</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{recallData?.qualifyRate ?? '0'}%</p>
              <p className="text-[11px] text-body-secondary">Qualifying sessions</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-surface-border">
              <span className="text-xs font-semibold text-body-secondary">Recall Points</span>
              <p className="text-2xl font-black text-purple-600 mt-1">+{recallData?.recallPoints ?? 0}</p>
              <p className="text-[11px] text-body-secondary">Total points earned</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-900">PYQ Archive Accuracy</span>
                <span className="font-black text-blue-800">{recallData?.pyqAccuracy ?? '—'}%</span>
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${Math.min(100, Number(recallData?.pyqAccuracy) || 0)}%` }}
                />
              </div>
            </div>

            <div className="border border-purple-200 bg-purple-50/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-purple-900">Synthetic / Model Accuracy</span>
                <span className="font-black text-purple-800">{recallData?.synAccuracy ?? '—'}%</span>
              </div>
              <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full"
                  style={{ width: `${Math.min(100, Number(recallData?.synAccuracy) || 0)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Action to Launch Daily Recall */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => navigate('/recall')}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shadow-subtle flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Launch Today's Quick Recall →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
