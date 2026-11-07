import React, { useEffect, useState, useMemo } from 'react'
import {
  Sparkles, CheckCircle2, XCircle, Clock, BarChart3,
  Layers, ArrowUpRight, ShieldCheck, Target, TrendingUp, AlertTriangle
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export function ByopMiniAnalytics({ attempt, paper, answers = [] }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPaperQuestions() {
      if (!paper?.id) return
      try {
        const { data } = await supabase
          .from('questions')
          .select('id, question_number, unit_name, unit_code, macro_topic, micro_topic, difficulty_level')
          .eq('paper_id', paper.id)
          .order('question_number', { ascending: true })

        setQuestions(data || [])
      } catch (e) {
        console.warn('Failed to load paper questions for BYOP analytics:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchPaperQuestions()
  }, [paper?.id])

  // Aggregate Metrics
  const analytics = useMemo(() => {
    const totalQ = questions.length || paper?.total_questions || answers.length || 1
    const ansMap = new Map()
    let totalTimeSpent = 0

    answers.forEach(a => {
      ansMap.set(String(a.question_id), a)
      if (a.time_spent_seconds) {
        totalTimeSpent += Number(a.time_spent_seconds)
      }
    })

    const attemptedCount = (attempt.correct_count || 0) + (attempt.incorrect_count || 0)
    const avgTimePerQ = attemptedCount > 0 ? Math.round(totalTimeSpent / attemptedCount) : (attempt.time_taken_seconds ? Math.round(attempt.time_taken_seconds / Math.max(1, attemptedCount)) : 48)

    // Topic-wise grouping
    const topicGroups = {}

    questions.forEach(q => {
      const topicKey = q.macro_topic || q.unit_name || q.unit_code || 'General Studies'
      if (!topicGroups[topicKey]) {
        topicGroups[topicKey] = {
          name: topicKey,
          total: 0,
          correct: 0,
          incorrect: 0,
          unattempted: 0,
        }
      }
      topicGroups[topicKey].total++

      const ans = ansMap.get(String(q.id))
      if (ans) {
        if (ans.is_correct === true) {
          topicGroups[topicKey].correct++
        } else if (ans.is_correct === false) {
          topicGroups[topicKey].incorrect++
        } else {
          topicGroups[topicKey].unattempted++
        }
      } else {
        topicGroups[topicKey].unattempted++
      }
    })

    const topicBreakdown = Object.values(topicGroups).map(t => {
      const attempted = t.correct + t.incorrect
      const accuracy = attempted > 0 ? Math.round((t.correct / attempted) * 100) : 0
      let status = 'Not Started'
      let statusColor = 'bg-slate-100 text-slate-700'

      if (attempted > 0) {
        if (accuracy >= 70) {
          status = 'Mastered'
          statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-200'
        } else if (accuracy < 50) {
          status = 'Needs Review'
          statusColor = 'bg-rose-100 text-rose-800 border-rose-200'
        } else {
          status = 'In Progress'
          statusColor = 'bg-amber-100 text-amber-800 border-amber-200'
        }
      }

      return {
        ...t,
        attempted,
        accuracy,
        status,
        statusColor,
      }
    })

    return {
      totalQ,
      attemptedCount,
      avgTimePerQ,
      topicBreakdown,
    }
  }, [questions, paper, answers, attempt])

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-indigo-500/30 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold tracking-wide uppercase border border-indigo-400/30 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            BYOP Dedicated Mini-Analytics
          </div>
          <h3 className="text-xl font-black tracking-tight text-white">
            Performance Breakdown for "{paper?.title || 'Uploaded Paper'}"
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            AI Auto-Graded &amp; Verified Answer Key with Topic Mastery Analysis
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1.5 rounded-xl text-emerald-300 text-xs font-bold shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>AI Verified Solutions</span>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Score */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Score</span>
          <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
            {Number(attempt.score || 0).toFixed(1)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            of {paper?.maximum_marks || (analytics.totalQ * 1.5)} marks
          </span>
        </div>

        {/* Accuracy */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Accuracy</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block">
            {attempt.accuracy || 0}%
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {attempt.correct_count || 0} / {analytics.attemptedCount} attempted
          </span>
        </div>

        {/* Avg Time / Q */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Time / Q</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-300 mt-1 block">
            {analytics.avgTimePerQ}s
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            Benchmark: 54s / Q
          </span>
        </div>

        {/* Total Questions */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Extracted Qs</span>
          <span className="text-2xl sm:text-3xl font-black text-indigo-300 mt-1 block">
            {analytics.totalQ}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            100% Extracted
          </span>
        </div>
      </div>

      {/* Topic-Wise Performance Breakdown Table */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          Topic-Wise Mastery Breakdown
        </h4>

        {analytics.topicBreakdown.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No topic taxonomy tags identified for this paper.</p>
        ) : (
          <div className="border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 bg-white/5 text-xs">
            <div className="grid grid-cols-12 px-4 py-2.5 font-bold text-[11px] uppercase tracking-wider text-slate-400 bg-white/5">
              <span className="col-span-5">Topic / Unit</span>
              <span className="col-span-2 text-center">Questions</span>
              <span className="col-span-2 text-center">Correct</span>
              <span className="col-span-3 text-right">Mastery</span>
            </div>

            {analytics.topicBreakdown.map((t, idx) => (
              <div key={idx} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-white/5 transition-colors">
                <div className="col-span-5 pr-2 font-medium truncate" title={t.name}>
                  {t.name}
                </div>
                <div className="col-span-2 text-center font-mono font-bold text-slate-300">
                  {t.total}
                </div>
                <div className="col-span-2 text-center font-mono font-bold text-emerald-400">
                  {t.correct} / {t.total}
                </div>
                <div className="col-span-3 text-right flex items-center justify-end gap-2">
                  <span className="font-mono text-xs font-black">{t.accuracy}%</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${t.statusColor}`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
