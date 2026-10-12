import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, Target, CheckCircle2, XCircle, Minus,
  TrendingUp, Loader2, AlertCircle, BookOpen, Award,
  Flame, Trophy, Brain, Sparkles, Layers, ArrowRight,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAuth } from '../../hooks/useAuth'
import { useApp } from '../../contexts/AppContext'
import { analyticsService } from '../../services/tnpscService'
import { syllabusAnalyticsService } from '../../services/syllabusAnalyticsService'

export function AnalyticsPage() {
  const { user } = useAuth()
  const { selectedExam } = useApp()
  const navigate = useNavigate()
  const [data, setData]                 = useState(null)
  const [recallData, setRecallData]     = useState(null)
  const [syllabusData, setSyllabusData] = useState(null)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  useEffect(() => { if (user?.id) load() }, [user?.id, selectedExam])

  async function load() {
    setLoading(true); setError(null)
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

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-7 h-7 animate-spin text-tnpsc-brand" />
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

  const hasAnyData = data?.hasData || recallData?.hasData || (syllabusData?.units?.length > 0)

  if (!hasAnyData) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-surface-border">
        <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-body-text mb-2">No analytics data yet</h2>
        <p className="text-sm text-body-secondary max-w-md mx-auto">
          Complete at least one mock exam attempt or today's Quick Recall revision to see your performance metrics here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-tnpsc-brand" />
          <div>
            <h1 className="text-xl font-bold text-body-text">Master Analytics</h1>
            <p className="text-xs text-body-secondary">
              Comprehensive performance breakdown for {selectedExam}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/syllabus')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-tnpsc-brand text-white hover:bg-tnpsc-brand-dark transition-colors shadow-sm"
        >
          <Layers className="w-3.5 h-3.5" />
          Open Interactive Syllabus Tree
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── SECTION: Syllabus Unit Coverage & Accuracy Roll-Up ─────── */}
      {syllabusData?.units?.length > 0 && (
        <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-100 text-indigo-800 tracking-wider">
                SYLLABUS TAXONOMY
              </span>
              <div>
                <h2 className="text-sm font-bold text-body-text">
                  Unit-Level Coverage & Accuracy Roll-Up
                </h2>
                <p className="text-xs text-body-secondary">
                  Overall Coverage: <strong>{syllabusData.overall?.coverage_percentage ?? 0}%</strong> ({syllabusData.overall?.attempted_questions ?? 0}/{syllabusData.overall?.total_questions ?? 0} unique Qs) · Overall Accuracy: <strong>{syllabusData.overall?.accuracy_percentage ?? 0}%</strong>
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/syllabus')}
              className="text-xs font-bold text-tnpsc-brand hover:underline flex items-center gap-1"
            >
              Drill down into Macro & Micro Topics <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {syllabusData.units.map((u) => {
              const cov = Number(u.coverage_percentage || 0)
              const acc = Number(u.accuracy_percentage || 0)
              const hasAtt = Number(u.total_attempts || 0) > 0
              return (
                <div
                  key={u.id}
                  onClick={() => navigate('/syllabus')}
                  className="border border-surface-border rounded-xl p-3.5 hover:border-tnpsc-brand/40 hover:bg-slate-50/60 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 mr-1.5">
                        Unit {u.unit_number}
                      </span>
                      <span className="text-xs font-bold text-body-text truncate">
                        {u.unit_name}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        !hasAtt
                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                          : acc >= 70
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : acc >= 50
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {hasAtt ? `${acc}% Acc` : '0% Acc'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-body-secondary mb-1">
                    <span>Coverage ({u.attempted_questions}/{u.total_questions} Qs)</span>
                    <span className="font-bold text-body-text">{cov}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, cov)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── SECTION: Dedicated QUICK_RECALL Category ───────────────── */}
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

        {/* Quick Recall Stat Cards */}
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

        {/* 50% PYQ vs 50% Synthetic Accuracy Comparison */}
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

      {/* ── SECTION: Mock Tests & Exam Attempts ─────────────────────── */}
      {data?.hasData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-body-text">Full Mock Exam Analytics</h2>
              <p className="text-xs text-body-secondary">
                Calculated from your {data.totalAttempts} completed mock test papers (isolated from Quick Recall)
              </p>
            </div>
          </div>

          {/* Overview cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Attempts',  value: data.totalAttempts,  icon: BookOpen,  color: 'text-tnpsc-brand bg-tnpsc-brand-light' },
              { label: 'Avg Score',       value: `${data.avgScore}%`, icon: Award,     color: 'text-emerald-700 bg-emerald-50' },
              { label: 'Avg Accuracy',    value: `${data.avgAccuracy}%`, icon: Target, color: 'text-blue-700 bg-blue-50' },
              { label: 'Total Questions', value: data.totalQuestions, icon: BarChart3, color: 'text-purple-700 bg-purple-50' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-surface-border p-4 shadow-subtle">
                <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mb-3`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-body-text">{value}</p>
                <p className="text-xs text-body-secondary mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Error analysis */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Correct',  value: data.totalCorrect,  icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
              { label: 'Wrong',    value: data.totalWrong,    icon: XCircle,      color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
              { label: 'Skipped',  value: data.totalSkipped,  icon: Minus,        color: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`rounded-xl border p-4 text-center ${bg}`}>
                <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
                <p className="text-xl font-bold text-body-text">{value}</p>
                <p className="text-xs text-body-secondary">{label}</p>
              </div>
            ))}
          </div>

          {/* Accuracy trend */}
          {data.trend?.length > 1 && (
            <div className="bg-white rounded-2xl border border-surface-border shadow-subtle p-5">
              <h3 className="text-sm font-bold text-body-text mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-tnpsc-brand" /> Accuracy Trend
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="attempt" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Accuracy']} />
                  <Line type="monotone" dataKey="accuracy" stroke="#635BFF" strokeWidth={2} dot={{ fill: '#635BFF', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Subject breakdown */}
          {data.subjectBreakdown?.length > 0 && (
            <div className="bg-white rounded-2xl border border-surface-border shadow-subtle p-5">
              <h3 className="text-sm font-bold text-body-text mb-4">Subject Breakdown</h3>
              <div className="space-y-3">
                {data.subjectBreakdown.map(s => (
                  <div key={s.subject}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-body-text">{s.subject}</span>
                      <span className="text-body-secondary">{s.accuracy}% accuracy · {s.attempted} qs</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${s.accuracy}%`,
                          background: Number(s.accuracy) >= 70 ? '#16a34a' : Number(s.accuracy) >= 50 ? '#635BFF' : '#dc2626',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Study Recommendations */}
          <div className="bg-tnpsc-brand-light rounded-2xl border border-tnpsc-brand/20 p-5">
            <h3 className="text-sm font-bold text-tnpsc-brand mb-3">AI Study Recommendations</h3>
            <ul className="space-y-2">
              {data.subjectBreakdown
                ?.filter(s => Number(s.accuracy) < 60)
                .slice(0, 3)
                .map(s => (
                  <li key={s.subject} className="flex items-start gap-2 text-xs text-body-text">
                    <span className="w-1.5 h-1.5 rounded-full bg-tnpsc-brand mt-1.5 shrink-0" />
                    Revise <strong>{s.subject}</strong> — accuracy is {s.accuracy}%. Focus on fundamentals and attempt targeted practice.
                  </li>
                ))
              }
              {data.avgAccuracy < 60 && (
                <li className="flex items-start gap-2 text-xs text-body-text">
                  <span className="w-1.5 h-1.5 rounded-full bg-tnpsc-brand mt-1.5 shrink-0" />
                  Your overall accuracy ({data.avgAccuracy}%) is below 60%. Take 1 timed mock test per week to build test stamina.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
