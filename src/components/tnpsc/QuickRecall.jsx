import React, { useState, useEffect, useCallback } from 'react'
import { Brain, CheckCircle2, XCircle, ArrowRight, Flame, Trophy, Loader2, X, RotateCcw, AlertTriangle, Calendar } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useApp } from '../../contexts/AppContext'
import { quickRecallService } from '../../services/tnpscService'

const TOTAL = 5
const OPTION_LABELS = ['A', 'B', 'C', 'D']

/**
 * Quick Recall — Daily 5-Question Revision Activity
 * - Mix of ~50% PYQ + ~50% Synthetic questions
 * - Personalized based on previous wrong answers (spaced repetition), long-unseen, weak topics
 * - Idempotent daily lifecycle: same day resumes or displays completed results (no duplicate sets)
 * - Deterministic scoring (no AI grading)
 * - Strict streak rule: 5/5 qualifies streak (+1 day); 4/5 or less breaks streak chain (resets to 0)
 * - Expiry handling for past uncompleted sessions
 */
export function QuickRecall({ onClose }) {
  const { user } = useAuth()
  const { selectedExam, toast } = useApp()

  const [phase, setPhase]             = useState('loading') // loading | question | reveal | result | error
  const [questions, setQs]            = useState([])
  const [sessionId, setSessionId]     = useState(null)
  const [index, setIndex]             = useState(0)
  const [selected, setSelected]       = useState(null)
  const [streak, setStreak]           = useState(0)
  const [correct, setCorrect]         = useState(0)
  const [answers, setAnswers]         = useState([]) // { selected, correct, isCorrect, explanation }[]
  const [result, setResult]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [isResume, setIsResume]       = useState(false)
  const [isCompletedToday, setIsCompletedToday] = useState(false)

  useEffect(() => {
    if (user?.id) initDailyRecall()
  }, [user?.id, selectedExam])

  async function initDailyRecall() {
    setPhase('loading')
    try {
      // 1. Check daily status for today's date
      const statusData = await quickRecallService.getDailyStatus(user.id, selectedExam)

      if (statusData.status === 'COMPLETED_TODAY') {
        // Already completed today — display today's result directly (no second set)
        setQs(statusData.questions || [])
        setAnswers(statusData.answers.map(a => ({
          selected: a.selected_answer,
          correct: a.correct_answer,
          isCorrect: a.is_correct,
        })))
        setCorrect(statusData.score ?? 0)
        setResult({
          score: statusData.score ?? 0,
          new_streak: statusData.streakAtEnd ?? 0,
          qualified: (statusData.score ?? 0) === TOTAL,
          recall_points: statusData.points ?? (statusData.score ?? 0) * 10,
        })
        setIsCompletedToday(true)
        setPhase('result')
        return
      }

      if (statusData.status === 'IN_PROGRESS' && statusData.questions?.length === TOTAL) {
        // Resume today's in-progress session
        const restoredAnswers = (statusData.answers || []).map(a => ({
          selected: a.selected_answer,
          correct: a.correct_answer,
          isCorrect: a.is_correct,
        }))
        const restoredCorrect = restoredAnswers.filter(a => a.isCorrect).length

        setQs(statusData.questions)
        setSessionId(statusData.session.id)
        setAnswers(restoredAnswers)
        setCorrect(restoredCorrect)
        setIndex(Math.min(statusData.resumeIndex || restoredAnswers.length, TOTAL - 1))
        setIsResume(true)
        setPhase('question')
        return
      }

      // Generate a new daily personalized 5-question set (~50% PYQ + ~50% Synthetic)
      const qs = await quickRecallService.fetchPersonalizedRecallQuestions(user.id, selectedExam)
      const session = await quickRecallService.createSession(
        user.id,
        selectedExam,
        qs.map(q => ({
          id: q.id,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          explanation: q.explanation,
          question_type: q.question_type || (q.is_pyq ? 'PYQ' : 'SYNTHETIC'),
          is_pyq: !!q.is_pyq,
          is_previous_wrong: !!q.is_previous_wrong,
          exam_source: q.exam_source,
          subject: q.subject,
        }))
      )

      setQs(qs)
      setSessionId(session.id)
      setAnswers([])
      setCorrect(0)
      setIndex(0)
      setPhase('question')
    } catch (err) {
      console.error('Quick Recall init error:', err)
      toast.error('Failed to prepare daily recall: ' + (err.message || 'Error'))
      setPhase('error')
    }
  }

  const currentQ = questions[index]

  const handleAnswer = useCallback(async (option) => {
    if (selected || phase !== 'question' || !currentQ) return
    setSelected(option)
    setPhase('reveal')

    // Deterministic exact comparison — no AI grading
    const isCorrect = String(option).trim().toUpperCase() === String(currentQ.correct_option).trim().toUpperCase()
    const newCorrect = correct + (isCorrect ? 1 : 0)

    setCorrect(newCorrect)
    const answerObj = {
      selected: option,
      correct: currentQ.correct_option,
      isCorrect,
      explanation: currentQ.explanation,
    }
    setAnswers(prev => [...prev, answerObj])

    // Real-time persistence to database and local cache
    if (sessionId) {
      await quickRecallService.saveAnswer(
        sessionId,
        index,
        currentQ.question_text,
        option,
        currentQ.correct_option,
        isCorrect,
        user.id
      )
    }
  }, [selected, phase, currentQ, correct, sessionId, index, user?.id])

  const handleNext = useCallback(async () => {
    if (index < TOTAL - 1) {
      setIndex(i => i + 1)
      setSelected(null)
      setPhase('question')
    } else {
      // Finalise daily session
      setLoading(true)
      try {
        const res = await quickRecallService.finaliseSession(user.id, correct, TOTAL, sessionId)
        setResult(res)
        setPhase('result')
      } catch (err) {
        console.error('Failed to finalise recall session:', err)
        toast.error('Could not save score: ' + err.message)
        const isQualified = (correct === TOTAL)
        setResult({
          score: correct,
          total: TOTAL,
          qualified: isQualified,
          new_streak: isQualified ? 1 : 0,
          recall_points: correct * 10,
        })
        setPhase('result')
      } finally {
        setLoading(false)
      }
    }
  }, [index, user?.id, correct, sessionId, toast])

  // Keyboard navigation (1=A, 2=B, 3=C, 4=D)
  useEffect(() => {
    if (phase !== 'question') return
    const handler = (e) => {
      if (e.key === '1' || e.key === 'a' || e.key === 'A') handleAnswer('A')
      else if (e.key === '2' || e.key === 'b' || e.key === 'B') handleAnswer('B')
      else if (e.key === '3' || e.key === 'c' || e.key === 'C') handleAnswer('C')
      else if (e.key === '4' || e.key === 'd' || e.key === 'D') handleAnswer('D')
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [phase, handleAnswer])

  // Progress indicator dots
  const ProgressDots = () => (
    <div className="flex items-center gap-2 justify-center mb-5">
      {Array.from({ length: TOTAL }).map((_, i) => {
        const ans = answers[i]
        let cls = 'w-3 h-3 rounded-full border-2 transition-all '
        if (ans?.isCorrect)  cls += 'bg-emerald-500 border-emerald-500 scale-110'
        else if (ans)        cls += 'bg-red-500 border-red-500'
        else if (i === index) cls += 'bg-tnpsc-brand border-tnpsc-brand ring-2 ring-tnpsc-brand/30 scale-125'
        else                  cls += 'bg-slate-200 border-slate-300'
        return <div key={i} className={cls} />
      })}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-modal overflow-hidden animate-scale-in flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-tnpsc-brand to-tnpsc-brand-dark text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Quick Recall</span>
                <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Daily 5
                </span>
              </div>
              <p className="text-[11px] text-white/80">50% PYQ + 50% Synthetic Revision</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs bg-white/10 px-2.5 py-1 rounded-full font-bold">
              <Calendar className="w-3.5 h-3.5 text-orange-200" />
              <span>{quickRecallService.getTodayDateStr()}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content container */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Loading */}
          {phase === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-14">
              <Loader2 className="w-9 h-9 animate-spin text-tnpsc-brand" />
              <p className="text-sm font-semibold text-body-text">Checking today's revision set…</p>
              <p className="text-xs text-body-secondary">Personalizing 5 questions from PYQ & Model pools</p>
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-sm text-status-error font-semibold mb-2">Could not load Quick Recall.</p>
              <p className="text-xs text-body-secondary mb-5">Please try again in a moment.</p>
              <button
                onClick={initDailyRecall}
                className="px-4 py-2 bg-tnpsc-brand text-white rounded-xl text-xs font-bold hover:bg-tnpsc-brand-hover transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Active Question or Reveal Phase */}
          {(phase === 'question' || phase === 'reveal') && currentQ && (
            <>
              {isResume && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-blue-800">
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Resumed today's in-progress session. Answering question {index + 1} of {TOTAL}.</span>
                </div>
              )}

              <ProgressDots />

              {/* Question metadata & category pill */}
              <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-body-secondary uppercase tracking-wider">
                    Question {index + 1} of {TOTAL}
                  </span>

                  {/* 50% PYQ + 50% Synthetic Badge */}
                  {currentQ.question_type === 'PYQ' || currentQ.is_pyq ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      PYQ Archive {currentQ.exam_source ? `· ${currentQ.exam_source}` : ''}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      Model Revision {currentQ.subject ? `· ${currentQ.subject}` : ''}
                    </span>
                  )}

                  {/* Spaced repetition tag if user previously answered wrong */}
                  {currentQ.is_previous_wrong && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                      ⚠️ Spaced Repetition (Past Mistake)
                    </span>
                  )}
                </div>

                <span className="text-xs font-bold text-body-secondary">
                  Score: {correct}/{answers.length}
                </span>
              </div>

              {/* Question Body */}
              <p className="text-sm font-semibold text-body-text leading-relaxed mb-5">
                {currentQ.question_text}
              </p>

              {/* Multiple Choice Options */}
              <div className="space-y-2.5">
                {OPTION_LABELS.map((label) => {
                  const optField = `option_${label.toLowerCase()}`
                  const text = currentQ[optField]
                  if (!text) return null

                  let btnCls = 'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left '

                  if (phase === 'reveal') {
                    if (label === currentQ.correct_option) {
                      btnCls += 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold'
                    } else if (label === selected) {
                      btnCls += 'border-red-400 bg-red-50 text-red-900'
                    } else {
                      btnCls += 'border-surface-border bg-slate-50 text-body-secondary opacity-50'
                    }
                  } else {
                    btnCls += 'border-surface-border bg-white hover:border-tnpsc-brand hover:bg-tnpsc-brand-light/40 hover:text-tnpsc-brand cursor-pointer'
                  }

                  return (
                    <button
                      key={label}
                      className={btnCls}
                      onClick={() => handleAnswer(label)}
                      disabled={phase === 'reveal'}
                    >
                      <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold shrink-0">
                        {label}
                      </span>
                      <span className="flex-1">{text}</span>
                      {phase === 'reveal' && label === currentQ.correct_option && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {phase === 'reveal' && label === selected && label !== currentQ.correct_option && (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Reveal Feedback & Next Button */}
              {phase === 'reveal' && (
                <div className={`mt-4 rounded-xl p-4 transition-all ${
                  selected === currentQ.correct_option
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border border-red-200 text-red-900'
                }`}>
                  <div className="flex items-start gap-2.5 mb-2">
                    {selected === currentQ.correct_option
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    }
                    <div className="flex-1">
                      <p className="text-sm font-bold">
                        {selected === currentQ.correct_option
                          ? 'Correct answer!'
                          : `Incorrect. Correct Option is ${currentQ.correct_option}.`
                        }
                      </p>
                      {currentQ.explanation && (
                        <p className="text-xs text-body-secondary mt-1 leading-relaxed">
                          {currentQ.explanation}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleNext}
                      disabled={loading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-tnpsc-brand hover:bg-tnpsc-brand-hover text-white text-xs font-bold rounded-xl transition-colors shadow-subtle"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : index < TOTAL - 1 ? (
                        <><span>Next Question</span><ArrowRight className="w-3.5 h-3.5" /></>
                      ) : (
                        <span>Complete Session →</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Result Phase */}
          {phase === 'result' && (
            <div className="py-2 animate-fade-in text-center">
              {/* Idempotency Notice */}
              {isCompletedToday && (
                <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-left">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Daily Revision Completed for Today!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    You have already finished today's 5 questions. To keep streak progression fair and deterministic, new questions generate tomorrow.
                  </p>
                </div>
              )}

              {/* Streak Qualification / Break Badge */}
              <div className="mb-5">
                {correct === TOTAL ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2 text-emerald-600">
                      <Trophy className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-black text-emerald-800">
                      🔥 Streak Qualified! (5/5 Perfect Score)
                    </h3>
                    <p className="text-xs text-emerald-700 mt-1">
                      Outstanding! You answered all 5 correctly. Your daily streak has advanced to <strong>{result?.new_streak ?? 1} days</strong>!
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2 text-amber-700">
                      <Flame className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-black text-amber-900">
                      💔 Streak Chain Broken ({correct}/{TOTAL})
                    </h3>
                    <p className="text-xs text-amber-800 mt-1">
                      Quick Recall requires a <strong>perfect 5/5 score</strong> to maintain your daily streak.
                      {correct === 4 ? ' Even 4/5 resets the active streak chain to 0.' : ' Streak reset to 0.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-50 border border-surface-border rounded-xl p-3">
                  <p className="text-xs text-body-secondary font-semibold">Today's Score</p>
                  <p className="text-xl font-black text-body-text mt-0.5">{correct}/{TOTAL}</p>
                </div>
                <div className="bg-slate-50 border border-surface-border rounded-xl p-3">
                  <p className="text-xs text-body-secondary font-semibold">Daily Streak</p>
                  <p className="text-xl font-black text-tnpsc-brand mt-0.5">
                    {result?.new_streak ?? (correct === TOTAL ? 1 : 0)} d
                  </p>
                </div>
                <div className="bg-slate-50 border border-surface-border rounded-xl p-3">
                  <p className="text-xs text-body-secondary font-semibold">Points Earned</p>
                  <p className="text-xl font-black text-emerald-600 mt-0.5">
                    +{result?.recall_points ?? correct * 10}
                  </p>
                </div>
              </div>

              {/* Question-by-Question Review */}
              <div className="text-left space-y-2.5 mb-6">
                <h4 className="text-xs font-bold text-body-secondary uppercase tracking-wider px-1">
                  Revision Review (50% PYQ + 50% Synthetic)
                </h4>
                {questions.map((q, idx) => {
                  const ans = answers[idx]
                  const isRight = ans?.isCorrect
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border p-3 text-xs ${
                        isRight ? 'border-emerald-200 bg-emerald-50/40' : 'border-red-200 bg-red-50/40'
                      }`}
                    >
                      <div className="flex items-start gap-2 justify-between">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {isRight ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-bold text-body-text">Q{idx + 1}: </span>
                            <span className="text-body-text">{q.question_text}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          q.question_type === 'PYQ' || q.is_pyq ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {q.question_type === 'PYQ' || q.is_pyq ? 'PYQ' : 'Model'}
                        </span>
                      </div>

                      <div className="mt-2 pl-6 flex items-center gap-3 text-[11px]">
                        <span className="text-body-secondary">
                          Your answer: <strong className={isRight ? 'text-emerald-700' : 'text-red-700'}>{ans?.selected || '—'}</strong>
                        </span>
                        {!isRight && (
                          <span className="text-emerald-700 font-semibold">
                            Correct: {q.correct_option}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Done Button */}
              <button
                onClick={onClose}
                className="w-full py-3 bg-tnpsc-brand hover:bg-tnpsc-brand-hover text-white text-sm font-bold rounded-xl transition-colors shadow-brand"
              >
                Close & Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
