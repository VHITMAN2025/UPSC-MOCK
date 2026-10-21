import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, Target, CheckCircle2, XCircle, Minus,
  TrendingUp, TrendingDown, Loader2, AlertCircle, AlertTriangle,
  BookOpen, Award, Flame, Trophy, Brain, Sparkles, Layers,
  ArrowRight, Clock, Timer, Filter, Zap, ChevronRight,
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

const PACING_CATEGORIES = [
  'All Categories',
  'Aptitude & Mental Ability',
  'General Knowledge / Recall',
  'Indian Polity & Governance',
  'History & TN Heritage',
  'Science, Geography & Economy',
  'Language (Tamil / English)',
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

  // Top navigation tab: 'overview' | 'syllabus' | 'pacing' | 'history' | 'recall'
  const [activeTab, setActiveTab] = useState('overview')

  // Time filter pill: 'all' | 'last5'
  const [timeFilter, setTimeFilter] = useState('last5')

  // Syllabus Mastery tab: selected unit index
  const [selectedUnitIdx, setSelectedUnitIdx] = useState(0)

  // Pacing tab: selected category filter
  const [selectedPacingCategory, setSelectedPacingCategory] = useState('All Categories')

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

  // ── Units & Syllabus Computations ──────────────────────────────────────────
  const units = syllabusData?.units ?? []
  const activeUnit = units[selectedUnitIdx] || units[0] || null
  const weakUnitsCount = units.filter(u => Number(u.accuracy_percentage || 0) < 50 || Number(u.total_attempts || 0) === 0).length

  // ── History & Trend Computations ───────────────────────────────────────────
  const mockTestHistory = data?.mockTestHistory ?? []
  const allCompletedHistory = (data?.allMockTestHistory && data.allMockTestHistory.length > 0)
    ? data.allMockTestHistory
    : mockTestHistory
  const displayHistory = timeFilter === 'last5'
    ? (mockTestHistory.length > 0 ? mockTestHistory.slice(-5) : allCompletedHistory.slice(-5))
    : allCompletedHistory
  const trendSummary = data?.trendSummary ?? {}

  // Readiness Index: strictly computed from user test accuracy and syllabus coverage
  const hasAttempts = Boolean(data?.hasData && (data?.totalAttempts > 0))
  const overallAcc = hasAttempts ? Number(data?.avgAccuracy || 0) : 0
  const overallCov = Number(syllabusData?.coverage_percentage || 0)
  const readinessIndex = hasAttempts
    ? Math.min(100, Math.round(overallAcc * 0.7 + overallCov * 0.3))
    : (overallCov > 0 ? Math.round(overallCov * 0.3) : 0)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-surface-border">
        <Loader2 className="w-8 h-8 animate-spin text-tnpsc-brand" />
        <p className="text-xs text-body-secondary font-medium">Loading Master Analytics Command Center…</p>
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
      {/* ── Top Bar & KPI Strip (Matching HTML Prototype) ───────────── */}
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

          {/* 6 High-Level KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5">
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
            </div>

            <div className="bg-[#181e32] border border-slate-800 rounded-xl p-3">
              <small className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Average Score
              </small>
              <b className="block text-xl font-black text-white mt-1">
                {hasAttempts ? `${data.avgScore}%` : '—'}
              </b>
            </div>

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
                      ? 'Based on only 1 answered question'
                      : `Based on ${data.totalAnswered || 0} answered questions`)
                  : 'No attempts recorded'}
              </span>
            </div>

            <div className="bg-[#181e32] border border-slate-800 rounded-xl p-3">
              <small className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Avg Time / Q
              </small>
              <b className="block text-xl font-black text-white mt-1">
                {pacingSummary.count > 0 ? `${pacingSummary.avgTimeSec} sec` : '—'}
              </b>
            </div>

            <div className="bg-[#181e32] border border-slate-800 rounded-xl p-3">
              <small className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Attempts
              </small>
              <b className="block text-xl font-black text-white mt-1">
                {allCompletedHistory.length || data?.totalAttempts || 0}
              </b>
              <span className="block text-[10px] text-slate-400 mt-0.5">
                Completed tests
              </span>
            </div>

            <div className="bg-[#181e32] border border-slate-800 rounded-xl p-3">
              <small className="block text-[10px] font-bold text-red-400 uppercase tracking-wider">
                Weak Units
              </small>
              <b className="block text-xl font-black text-red-400 mt-1">
                {weakUnitsCount}
              </b>
            </div>
          </div>
        </div>

        {/* ── Top Navigation Tabs (Matching HTML Prototype) ─────────── */}
        <div className="flex items-center gap-6 px-6 bg-[#111426] border-b border-slate-800/80 overflow-x-auto">
          {[
            { id: 'overview',  label: 'Overview' },
            { id: 'syllabus',  label: 'Syllabus Mastery' },
            { id: 'pacing',    label: 'Time & Pacing' },
            { id: 'history',   label: 'Test History' },
            { id: 'recall',    label: 'Quick Recall' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 text-xs font-black tracking-wide border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-tnpsc-brand text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: OVERVIEW VIEW
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Performance Trajectory Chart */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-body-text">Performance Trajectory</h3>
                  <p className="text-xs text-body-secondary mt-0.5">
                    Score progression across completed tests
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('history')}
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
                    Units with lowest accuracy limit overall rank. Focus on micro-topics instead of rereading entire books.
                  </p>
                </div>

                <div className="bg-[#181e32] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                    02 · Pacing vs. Accuracy
                  </span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Aptitude &amp; Mental Ability shows slower solving. Use short timed sets to build speed without sacrificing accuracy.
                  </p>
                </div>

                <div className="bg-[#181e32] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                    03 · Next Best Action
                  </span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Complete targeted practice sets in your lowest units before your next full exam attempt.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const sorted = units.slice().sort((a, b) => Number(a.accuracy_percentage || 0) - Number(b.accuracy_percentage || 0))
                  const target = sorted[0]
                  // Collect actual mistake question IDs from recent attempts if available
                  const mistakeIds = []
                  ;(data?.allAttempts || []).forEach(att => {
                    (att.attempt_answers || []).forEach(ans => {
                      if (ans.is_correct === false && ans.question_id) {
                        mistakeIds.push(ans.question_id)
                      }
                    })
                  })
                  const uniqueMistakes = Array.from(new Set(mistakeIds))

                  if (uniqueMistakes.length > 0) {
                    const idsParam = uniqueMistakes.slice(0, 25).join(',')
                    const subj = encodeURIComponent(target?.unit_name || 'Targeted Revision')
                    navigate(`/practice?mode=fix_test&mistakes=${idsParam}&subject=${subj}`)
                  } else if (target) {
                    navigate(`/practice?subject=${encodeURIComponent(target.unit_name)}&unit=${encodeURIComponent(target.unit_number)}`)
                  } else {
                    navigate('/practice')
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-tnpsc-brand hover:bg-tnpsc-brand-dark text-white font-bold text-xs transition-colors shadow-brand"
              >
                Target Weakness Drill →
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
                onClick={() => setActiveTab('syllabus')}
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
                      setActiveTab('syllabus')
                    }}
                    className={`bg-slate-50 border rounded-xl p-3.5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-subtle ${
                      isWeak ? 'border-red-200' : 'border-surface-border hover:border-indigo-300'
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
          TAB 2: SYLLABUS MASTERY VIEW
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'syllabus' && (
        <div className="space-y-6">
          {/* Unit selector chips */}
          <div className="bg-white rounded-2xl border border-surface-border p-4 shadow-subtle flex items-center gap-2 overflow-x-auto">
            {units.map((u, i) => {
              const isSelected = selectedUnitIdx === i
              const score = Number(u.accuracy_percentage || 0)
              const isWeak = score < 50
              return (
                <button
                  key={u.unit_id || i}
                  onClick={() => setSelectedUnitIdx(i)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : isWeak
                      ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      : 'bg-white text-body-secondary border-surface-border hover:bg-slate-50'
                  }`}
                >
                  Unit {u.unit_number}: {u.unit_name} · {score}%
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
                      Accuracy based on attempted questions in this syllabus unit.
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

                <div className="space-y-3">
                  {(activeUnit.macro_topics || []).map((macro) => {
                    const score = Number(macro.accuracy_percentage || 0)
                    const isWeak = score < 50
                    return (
                      <div key={macro.macro_topic_id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-body-text truncate">{macro.macro_topic_name}</span>
                          <span className={`font-black ${isWeak ? 'text-red-600' : 'text-body-text'}`}>
                            {score}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isWeak ? 'bg-red-500' : 'bg-tnpsc-brand'}`}
                            style={{ width: `${Math.min(100, Math.max(score, 4))}%` }}
                          />
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
          TAB 3: TIME & PACING VIEW (54s TNPSC Benchmark)
          * Raw question-by-question log is strictly hidden as requested *
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pacing' && (
        <div className="space-y-6">
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

          {/* Category Pacing Comparison & Pacing Profile (NO RAW TABLE) */}
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: TEST HISTORY VIEW
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-6">
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
                      <th className="pb-3 font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {displayHistory.map(test => (
                      <tr key={test.attemptId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 font-bold text-body-text">{test.label} — {test.paperTitle}</td>
                        <td className="py-3 text-body-secondary">{test.date ? formatDate(test.date) : 'Recent'}</td>
                        <td className="py-3 font-black text-tnpsc-brand">{test.score}%</td>
                        <td className="py-3 font-bold text-emerald-600">{test.accuracy}%</td>
                        <td className="py-3">
                          <button
                            onClick={() => navigate(`/attempt/${test.attemptId}/result`)}
                            className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors"
                          >
                            Review
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
                {Math.min(5, displayHistory.length || 4)} / 5
              </p>
              <p className="text-xs text-body-secondary mt-1">Tests meeting or exceeding target accuracy benchmark.</p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5: QUICK RECALL VIEW
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'recall' && (
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-6">
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
        </div>
      )}
    </div>
  )
}
