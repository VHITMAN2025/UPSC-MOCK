import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Brain, Play, Clock, Zap, BookOpen, Loader2, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, AlertCircle, BarChart3, Timer, Sparkles, Globe
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useApp } from '../../contexts/AppContext'
import { supabase } from '../../lib/supabase'
import { practiceService } from '../../services/tnpscService'
import { formatTimeRemaining } from '../../lib/utils'
import { useCountdown } from '../../hooks/useCountdown'

const Q_COUNTS    = [10, 25, 50, 100]
const TIMER_MODES = ['strict', 'untimed']
const DIFFICULTIES = ['adaptive', 'easy', 'moderate', 'hard']

// ─── Practice Builder ─────────────────────────────────────────────────────────
function PracticeBuilder({ onStart }) {
  const { selectedExam } = useApp()
  const { toast } = useApp()
  const { user }  = useAuth()
  const [searchParams] = useSearchParams()
  const urlSubject      = searchParams.get('subject')
  const urlTopic        = searchParams.get('topic')
  const urlUnit         = searchParams.get('unit')
  const urlMode         = searchParams.get('mode')
  const urlMistakes     = searchParams.get('mistakes')
  const urlMicroTopicId = searchParams.get('micro_topic_id')

  const mistakeIds = React.useMemo(() => {
    return urlMistakes ? urlMistakes.split(',').map(s => s.trim()).filter(Boolean) : []
  }, [urlMistakes])

  const isFixTest = urlMode === 'fix_test' && mistakeIds.length > 0

  const [subjects, setSubjects]   = useState(['All Subjects'])
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const [availableCount, setAvailableCount] = useState(null)
  const [checkingCount, setCheckingCount] = useState(false)

  const [config, setConfig] = useState({
    subject: urlSubject || 'All Subjects',
    topic: urlTopic || null,
    unit: urlUnit || null,
    micro_topic_id: urlMicroTopicId || null,
    question_count: isFixTest ? mistakeIds.length : 25,
    timer_mode: 'strict',
    difficulty: 'adaptive',
    exam_context: selectedExam,
    mode: urlMode || 'standard',
    mistakes: mistakeIds,
    mistake_ids: mistakeIds,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // Fetch subjects from syllabus_units for the selected exam
  useEffect(() => {
    setConfig(c => ({
      ...c,
      subject: urlSubject || 'All Subjects',
      topic: urlTopic || null,
      unit: urlUnit || null,
      micro_topic_id: urlMicroTopicId || null,
      exam_context: selectedExam,
      mode: urlMode || 'standard',
      mistakes: mistakeIds,
      mistake_ids: mistakeIds,
      question_count: isFixTest ? mistakeIds.length : (c.question_count || 25),
    }))
    setError(null)
    loadSubjects(urlSubject)
  }, [selectedExam, urlSubject, urlTopic, urlUnit, urlMicroTopicId, urlMode, mistakeIds, isFixTest])

  // Real-time available question count check for targeted micro-topics
  useEffect(() => {
    let active = true
    async function checkCount() {
      if (isFixTest) {
        setAvailableCount(mistakeIds.length)
        return
      }
      setCheckingCount(true)
      try {
        const count = await practiceService.getAvailableQuestionCount({
          exam_context: selectedExam,
          subject: config.subject,
          unit: config.unit,
          topic: config.topic,
          micro_topic_id: config.micro_topic_id,
        })
        if (active) setAvailableCount(count)
      } catch (e) {
        if (active) setAvailableCount(null)
      } finally {
        if (active) setCheckingCount(false)
      }
    }
    checkCount()
    return () => { active = false }
  }, [selectedExam, config.subject, config.unit, config.topic, config.micro_topic_id, isFixTest, mistakeIds.length])

  async function loadSubjects(preferredSubject) {
    setSubjectsLoading(true)
    try {
      // Get exam ID first
      const { data: examRow } = await supabase
        .from('syllabus_exams')
        .select('id')
        .eq('exam_name', selectedExam)
        .maybeSingle()

      if (examRow?.id) {
        const { data: units } = await supabase
          .from('syllabus_units')
          .select('unit_name, subject')
          .eq('exam_id', examRow.id)
          .order('unit_number')

        if (units && units.length > 0) {
          // Build unique subject list from unit names
          const names = ['All Subjects', ...new Set(units.map(u => u.subject || u.unit_name).filter(Boolean))]
          if (preferredSubject && !names.includes(preferredSubject)) {
            names.push(preferredSubject)
          }
          setSubjects(names)
          return
        }
      }
      // No syllabus data — fall back to subjects derived from published papers
      const { data: papers } = await supabase
        .from('papers')
        .select('subject')
        .eq('status', 'published')
        .eq('exam_name', selectedExam)
      
      if (papers && papers.length > 0) {
        const names = ['All Subjects', ...new Set(papers.map(p => p.subject).filter(Boolean))]
        if (preferredSubject && !names.includes(preferredSubject)) {
          names.push(preferredSubject)
        }
        setSubjects(names)
      } else {
        setSubjects(preferredSubject ? ['All Subjects', preferredSubject] : ['All Subjects'])
      }
    } catch {
      setSubjects(preferredSubject ? ['All Subjects', preferredSubject] : ['All Subjects'])
    } finally {
      setSubjectsLoading(false)
    }
  }

  async function handleGenerate() {
    setLoading(true); setError(null)
    try {
      const result = await practiceService.createSession(user.id, config)
      if (result.isInventoryLimited && result.inventoryNotice) {
        toast.info(result.inventoryNotice)
      } else {
        toast.success('Practice session created!')
      }
      onStart({
        ...result,
        session: {
          ...result.session,
          inventoryNotice: result.inventoryNotice
        }
      })
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-tnpsc-brand" />
        <div>
          <h1 className="text-xl font-bold text-body-text">Custom Practice Builder</h1>
          <p className="text-xs text-body-secondary">{selectedExam}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-border shadow-subtle p-6 space-y-6">
        {isFixTest && (
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 font-black text-base shadow-sm">
              🎯
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-purple-950">Adaptive Fix Test Mode Active</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-200 text-purple-800">
                  Targeted Error Drill
                </span>
              </div>
              <p className="text-xs text-purple-800 mt-1 leading-relaxed">
                Targeting <strong>{mistakeIds.length} checked questions</strong> from your recent exam attempt.
                This custom set re-drills the exact questions you marked for revision.
              </p>
            </div>
          </div>
        )}

        {urlTopic && !isFixTest && (
          <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-200 rounded-xl px-4 py-2.5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-indigo-800 font-semibold">
                Targeted Micro-Topic Focus: <strong className="font-bold">{urlTopic}</strong>
              </span>
              {availableCount !== null && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                  {checkingCount ? 'Checking pool…' : `${availableCount} Questions Ready`}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 shrink-0">
              Strict Topic Filter
            </span>
          </div>
        )}

        {/* Subject */}
        <div>
          <label className="block text-sm font-bold text-body-text mb-2">Target Subject</label>
          {isFixTest ? (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 font-semibold">
              🎯 Locked to {mistakeIds.length} Checked Exam Mistakes ({config.subject || 'All Exam Topics'})
            </div>
          ) : subjectsLoading ? (
            <div className="flex items-center gap-2 text-xs text-body-secondary">
              <Loader2 className="w-4 h-4 animate-spin text-tnpsc-brand" />
              Loading subjects…
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subjects.map(s => (
                <button key={s} onClick={() => setConfig(c => ({ ...c, subject: s }))}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${config.subject === s ? 'bg-tnpsc-brand text-white' : 'bg-slate-100 text-body-secondary hover:text-body-text'}`}
                >{s}</button>
              ))}
            </div>
          )}
        </div>

        {/* Question count */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-body-text">Number of Questions</label>
            {isFixTest && (
              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-lg">
                Fix Test Size: {mistakeIds.length} Qs
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {isFixTest ? (
              <button
                type="button"
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-purple-600 text-white shadow-sm"
              >
                {mistakeIds.length} Questions (from Checked Mistakes)
              </button>
            ) : (
              Q_COUNTS.map(n => (
                <button key={n} onClick={() => setConfig(c => ({ ...c, question_count: n }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${config.question_count === n ? 'bg-tnpsc-brand text-white' : 'bg-slate-100 text-body-secondary hover:text-body-text'}`}
                >{n}</button>
              ))
            )}
          </div>
        </div>

        {/* Timer mode */}
        <div>
          <label className="block text-sm font-bold text-body-text mb-2">Timer Mode</label>
          <div className="grid grid-cols-2 gap-3">
            {TIMER_MODES.map(m => (
              <button key={m} onClick={() => setConfig(c => ({ ...c, timer_mode: m }))}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${config.timer_mode === m ? 'border-tnpsc-brand bg-tnpsc-brand-light text-tnpsc-brand' : 'border-surface-border text-body-secondary hover:border-tnpsc-brand/40'}`}
              >
                {m === 'strict' ? <><Timer className="w-4 h-4" /> Strict Countdown</> : <><Clock className="w-4 h-4" /> Untimed Practice</>}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-bold text-body-text mb-2">AI Difficulty</label>
          <div className="grid grid-cols-4 gap-2">
            {DIFFICULTIES.map(d => (
              <button key={d} onClick={() => setConfig(c => ({ ...c, difficulty: d }))}
                className={`py-2 rounded-xl text-xs font-bold capitalize transition-colors ${config.difficulty === d ? 'bg-tnpsc-brand text-white' : 'bg-slate-100 text-body-secondary hover:text-body-text'}`}
              >{d}</button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`w-full py-3.5 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-brand disabled:opacity-60 ${
            isFixTest ? 'bg-purple-600 hover:bg-purple-700' : 'bg-tnpsc-brand hover:bg-tnpsc-brand-hover'
          }`}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Preparing Practice Set…</>
          ) : isFixTest ? (
            <><Play className="w-4 h-4" /> Start Fix Test ({mistakeIds.length} Questions)</>
          ) : (
            <><Play className="w-4 h-4" /> Generate Practice Set</>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Practice Session ─────────────────────────────────────────────────────────
function PracticeSession({ session, questions, onComplete }) {
  const { toast } = useApp()
  const [index, setIndex]         = useState(0)
  const [answers, setAnswers]     = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [lang, setLang]           = useState('english') // 'english' | 'tamil'

  const totalSec = session.timer_mode === 'strict'
    ? session.question_count * 72  // ~72s per question
    : null

  const { seconds, isRunning } = useCountdown(totalSec, session.timer_mode === 'strict')

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (session.timer_mode === 'strict' && isRunning === false && seconds === 0 && !submitted) {
      handleSubmit()
    }
  }, [seconds, isRunning])

  const currentQ = questions[index] || {}
  const OPTS = ['A', 'B', 'C', 'D']

  // Determine available bilingual texts
  const hasTamil = Boolean(
    currentQ.question_text_tamil ||
    currentQ.option_a_tamil ||
    currentQ.option_b_tamil ||
    currentQ.tamil_question
  )

  const activeLang = hasTamil ? lang : 'english'

  // Question metadata
  const groupLabel = currentQ.group_tag
    ? `TNPSC ${currentQ.group_tag}`
    : (session.exam_context || 'TNPSC Exam')
  const unitLabel = currentQ.unit_tag || currentQ.unit_name || currentQ.subject || session.subject || null
  const microLabel = currentQ.micro_topic || currentQ.micro_topic_name || currentQ.topic || null
  const isPyq = Boolean(currentQ.is_pyq || currentQ.question_type === 'PYQ')
  const examYear = currentQ.exam_year || (isPyq ? 'Official PYQ' : null)

  const questionText = activeLang === 'tamil' && (currentQ.question_text_tamil || currentQ.tamil_question)
    ? (currentQ.question_text_tamil || currentQ.tamil_question)
    : currentQ.question_text

  const secondaryText = activeLang === 'tamil' && currentQ.question_text
    ? currentQ.question_text
    : (activeLang === 'english' && (currentQ.question_text_tamil || currentQ.tamil_question) ? (currentQ.question_text_tamil || currentQ.tamil_question) : null)

  async function handleSubmit() {
    setSaving(true)
    try {
      // Calculate score
      let correct = 0
      questions.forEach(q => {
        if (answers[q.id] === q.correct_option) correct++
      })
      const accuracy = ((correct / questions.length) * 100).toFixed(1)
      const score = ((correct / questions.length) * 100).toFixed(2)

      const answersJson = {}
      Object.entries(answers).forEach(([qId, opt]) => { answersJson[qId] = opt })

      await practiceService.updateSession(session.id, {
        status: 'completed',
        score: parseFloat(score),
        accuracy: parseFloat(accuracy),
        answers_json: answersJson,
        time_taken_sec: totalSec ? (totalSec - seconds) : null,
        completed_at: new Date().toISOString(),
      })

      setSubmitted(true)
      onComplete({
        correct, total: questions.length,
        accuracy, score,
        answers, questions,
      })
    } catch (err) {
      toast.error('Failed to save results: ' + err.message)
    } finally { setSaving(false) }
  }

  if (submitted) return null

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-4">
      {session.inventoryNotice && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-amber-900 font-semibold shadow-2xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{session.inventoryNotice}</span>
        </div>
      )}

      {/* Top bar with progress and countdown timer */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-surface-border px-4 py-3 shadow-subtle">
        <span className="text-sm font-bold text-body-text">{index + 1} / {questions.length}</span>
        {session.timer_mode === 'strict' && (
          <span className={`flex items-center gap-1.5 text-sm font-mono font-bold ${seconds < 300 ? 'text-red-600' : 'text-body-text'}`}>
            <Clock className="w-4 h-4" /> {formatTimeRemaining(seconds)}
          </span>
        )}
        <span className="text-xs text-body-secondary">{Object.keys(answers).length} answered</span>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-subtle p-6 space-y-5">
        {/* Metadata Badges & Bilingual Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {groupLabel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                {groupLabel}
              </span>
            )}
            {unitLabel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200 max-w-[200px] truncate" title={unitLabel}>
                {unitLabel}
              </span>
            )}
            {microLabel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 max-w-[180px] truncate" title={microLabel}>
                {microLabel}
              </span>
            )}
            {isPyq && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>PYQ {examYear && examYear !== 'Official PYQ' ? examYear : ''}</span>
              </span>
            )}
          </div>

          {/* Bilingual Switch */}
          {hasTamil && (
            <div className="inline-flex items-center rounded-lg border border-surface-border bg-slate-50 p-0.5 text-[11px] font-bold shrink-0">
              <button
                type="button"
                onClick={() => setLang('english')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  activeLang === 'english'
                    ? 'bg-white text-body-text shadow-xs'
                    : 'text-body-secondary hover:text-body-text'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang('tamil')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  activeLang === 'tamil'
                    ? 'bg-tnpsc-brand text-white shadow-xs'
                    : 'text-body-secondary hover:text-body-text'
                }`}
              >
                தமிழ்
              </button>
            </div>
          )}
        </div>

        {/* Question Text */}
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-body-text leading-relaxed">
            {questionText}
          </p>
          {secondaryText && (
            <p className="text-xs text-body-secondary leading-relaxed font-tamil">
              {secondaryText}
            </p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {OPTS.map(opt => {
            const letter = opt.toLowerCase()
            const textEn = currentQ[`option_${letter}`]
            const textTa = currentQ[`option_${letter}_tamil`]
            const primaryOptionText = activeLang === 'tamil' && textTa ? textTa : textEn
            const secondaryOptionText = activeLang === 'tamil' && textTa ? textEn : (activeLang === 'english' && textTa ? textTa : null)

            if (!textEn && !textTa) return null
            const isSelected = answers[currentQ.id] === opt
            return (
              <button
                key={opt}
                onClick={() => setAnswers(a => ({ ...a, [currentQ.id]: opt }))}
                className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${
                  isSelected
                    ? 'border-tnpsc-brand bg-tnpsc-brand-light text-tnpsc-brand'
                    : 'border-surface-border hover:border-tnpsc-brand/40 hover:bg-slate-50'
                }`}
              >
                <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                  isSelected ? 'border-tnpsc-brand bg-tnpsc-brand text-white' : 'border-slate-300'
                }`}>
                  {opt}
                </span>
                <div className="min-w-0">
                  <span className="block leading-relaxed">{primaryOptionText}</span>
                  {secondaryOptionText && (
                    <span className="block text-xs text-body-secondary font-tamil leading-relaxed mt-0.5">
                      {secondaryOptionText}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIndex(i => Math.max(0, i - 1))}
          disabled={index === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-surface-border rounded-xl text-sm font-semibold text-body-secondary hover:text-body-text disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        {index < questions.length - 1 ? (
          <button
            onClick={() => setIndex(i => i + 1)}
            className="flex items-center gap-2 px-4 py-2.5 bg-tnpsc-brand text-white rounded-xl text-sm font-bold hover:bg-tnpsc-brand-hover transition-colors shadow-brand"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60 shadow-subtle"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Submit Practice Set
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Practice Result ──────────────────────────────────────────────────────────
function PracticeResult({ result, onRetry }) {
  const { correct, total, accuracy, questions, answers } = result
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl border border-surface-border shadow-subtle p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-tnpsc-brand-light flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-tnpsc-brand" />
        </div>
        <h2 className="text-xl font-bold text-body-text mb-1">Practice Complete!</h2>
        <div className="grid grid-cols-3 gap-4 my-6">
          {[
            { label: 'Score',    value: `${correct}/${total}` },
            { label: 'Accuracy', value: `${accuracy}%` },
            { label: 'Correct',  value: correct },
          ].map(({ label, value }) => (
            <div key={label} className="bg-tnpsc-brand-light rounded-xl py-3">
              <p className="text-2xl font-black text-tnpsc-brand">{value}</p>
              <p className="text-xs text-body-secondary">{label}</p>
            </div>
          ))}
        </div>

        {/* Detailed Question Review with Micro-Topics & Explanations */}
        <div className="space-y-3 text-left max-h-80 overflow-y-auto mb-6 pr-1">
          {questions.map((q, i) => {
            const sel = answers[q.id]
            const isCorrect = sel === q.correct_option
            const microName = q.micro_topic || q.micro_topic_name || q.topic || null
            return (
              <div key={q.id} className={`p-3.5 rounded-xl border space-y-1.5 ${isCorrect ? 'bg-emerald-50/70 border-emerald-200' : sel ? 'bg-red-50/70 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start gap-2">
                  {isCorrect
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  }
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-xs font-bold text-body-text">Q{i + 1}</span>
                      {microName && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 text-indigo-900">
                          {microName}
                        </span>
                      )}
                      {(q.is_pyq || q.exam_year) && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          PYQ {q.exam_year || ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-body-text">{q.question_text}</p>
                    {q.question_text_tamil && (
                      <p className="text-[11px] text-body-secondary font-tamil">{q.question_text_tamil}</p>
                    )}
                    <p className="text-xs text-body-secondary mt-1">
                      Your answer: <strong className={isCorrect ? 'text-emerald-700' : 'text-red-700'}>{sel ?? 'Unanswered'}</strong> | Correct: <strong className="text-emerald-800">{q.correct_option}</strong>
                    </p>
                    {q.explanation && (
                      <div className="text-[11px] text-slate-600 bg-white/90 p-2 rounded-lg border border-slate-200/80 mt-1.5 space-y-0.5">
                        <p><strong>Rationale:</strong> {q.explanation}</p>
                        {q.explanation_tamil && <p className="font-tamil text-slate-500">{q.explanation_tamil}</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={onRetry} className="flex-1 py-3 bg-tnpsc-brand text-white rounded-xl font-bold text-sm hover:bg-tnpsc-brand-hover transition-colors shadow-brand">
            New Practice Set
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page orchestrator ────────────────────────────────────────────────────────
export function PracticePage() {
  const [phase, setPhase]   = useState('builder')  // builder | session | result
  const [sessionData, setSessionData] = useState(null)
  const [resultData, setResultData]   = useState(null)

  return (
    <div className="py-2 animate-fade-in">
      {phase === 'builder' && (
        <PracticeBuilder onStart={data => { setSessionData(data); setPhase('session') }} />
      )}
      {phase === 'session' && sessionData && (
        <PracticeSession
          session={sessionData.session}
          questions={sessionData.questions}
          onComplete={result => { setResultData(result); setPhase('result') }}
        />
      )}
      {phase === 'result' && resultData && (
        <PracticeResult
          result={resultData}
          onRetry={() => { setSessionData(null); setPhase('builder') }}
        />
      )}
    </div>
  )
}
