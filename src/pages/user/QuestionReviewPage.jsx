import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { attemptService } from '../../services/attemptService'
import { questionService } from '../../services/questionService'
import { QuestionCard } from '../../components/QuestionCard'
import { Loader2, ArrowLeft, Filter, CheckCircle2, XCircle, AlertCircle, BookOpen, Zap, CheckSquare, Square } from 'lucide-react'

export function QuestionReviewPage() {
  const { attemptId } = useParams()
  const navigate = useNavigate()

  const [attemptDetails, setAttemptDetails] = useState(null)
  const [questions, setQuestions] = useState([])
  const [userAnswersMap, setUserAnswersMap] = useState({})
  const [filter, setFilter] = useState('all') // 'all' | 'correct' | 'incorrect' | 'unanswered'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedMistakes, setSelectedMistakes] = useState([])

  useEffect(() => {
    async function loadReviewData() {
      try {
        const details = await attemptService.getAttemptDetails(attemptId)
        setAttemptDetails(details)

        let qList = []
        if (details?.attempt?.paper_id) {
          // Fetch full questions including correct_option & explanation for REVIEW MODE
          qList = await questionService.getQuestionsByPaperId(details.attempt.paper_id, false)
          setQuestions(qList || [])
        }

        const map = {}
        const answersList = details?.answers || []
        answersList.forEach((a) => {
          map[a.question_id] = a.selected_option
        })
        setUserAnswersMap(map)

        // Pre-select all incorrect and unanswered questions for Fix Test
        const mistakes = (qList || []).filter(q => map[q.id] !== q.correct_option).map(q => q.id)
        setSelectedMistakes(mistakes)
      } catch (err) {
        console.error('Error loading question review:', err)
        setError(err.message || 'Failed to load question solutions.')
      } finally {
        setLoading(false)
      }
    }

    loadReviewData()
  }, [attemptId])

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
        <p className="text-xs text-body-secondary font-medium">Loading question solutions & explanations...</p>
      </div>
    )
  }

  if (error || !attemptDetails?.attempt) {
    return (
      <div className="bg-white rounded-xl border border-surface-border p-8 text-center max-w-lg mx-auto my-8">
        <AlertCircle className="w-10 h-10 text-status-error mx-auto mb-3" />
        <h2 className="text-lg font-bold text-body-text">Unable to Load Review</h2>
        <p className="text-xs text-body-secondary mt-1 mb-6">{error || 'Requested attempt does not exist.'}</p>
        <Link to="/my-attempts" className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold">
          Back to My Attempts
        </Link>
      </div>
    )
  }

  const { attempt } = attemptDetails
  const paper = attempt.papers

  // Filter logic
  const filteredQuestions = questions.filter((q) => {
    const userSel = userAnswersMap[q.id]
    if (filter === 'correct') return userSel === q.correct_option
    if (filter === 'incorrect') return userSel && userSel !== q.correct_option
    if (filter === 'unanswered') return !userSel
    return true
  })

  const toggleSelectMistake = (qId) => {
    setSelectedMistakes(prev =>
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    )
  }

  const selectAllMistakes = () => {
    const allMistakeIds = questions.filter(q => userAnswersMap[q.id] !== q.correct_option).map(q => q.id)
    setSelectedMistakes(allMistakeIds)
  }

  const deselectAll = () => {
    setSelectedMistakes([])
  }

  const handleLaunchFixTest = () => {
    if (selectedMistakes.length === 0) return
    const ids = selectedMistakes.join(',')
    const subject = encodeURIComponent(paper?.subject || 'Targeted Revision')
    navigate(`/practice?mode=fix_test&mistakes=${ids}&subject=${subject}`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to={`/attempt/${attempt.id}/result`} className="inline-flex items-center space-x-1 text-xs font-semibold text-body-secondary hover:text-primary transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Score Result</span>
          </Link>
          <h1 className="text-2xl font-bold text-body-text">Question-Wise Solution & Review</h1>
          <p className="text-xs text-body-secondary mt-0.5">
            {paper?.title} — Attempt #{attempt.attempt_number}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-surface-border shadow-subtle text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'all' ? 'bg-primary text-white' : 'text-body-secondary hover:bg-slate-50'
            }`}
          >
            All ({questions.length})
          </button>
          <button
            onClick={() => setFilter('correct')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'correct' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Correct ({attempt.correct_count})
          </button>
          <button
            onClick={() => setFilter('incorrect')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'incorrect' ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-50'
            }`}
          >
            Incorrect ({attempt.incorrect_count})
          </button>
          <button
            onClick={() => setFilter('unanswered')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'unanswered' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Unanswered ({attempt.unanswered_count})
          </button>
        </div>
      </div>

      {/* Fix Test Generation Action Banner */}
      <div className="bg-gradient-to-r from-[#1e1b4b] to-[#312e81] text-white rounded-2xl p-4 sm:p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-400/20 text-amber-300">
              <Zap className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold tracking-tight">Adaptive Error Targeter</h3>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              {selectedMistakes.length} Selected
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Generate an instant targeted Fix Test containing the exact questions you missed or skipped.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={selectAllMistakes}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
          >
            Select All Errors
          </button>
          {selectedMistakes.length > 0 && (
            <button
              onClick={deselectAll}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleLaunchFixTest}
            disabled={selectedMistakes.length === 0}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs transition-colors flex items-center gap-1.5 shadow-subtle"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Generate Fix Test ({selectedMistakes.length}) →</span>
          </button>
        </div>
      </div>

      {/* Filtered Question List */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-xl border border-surface-border p-12 text-center text-body-secondary text-xs">
          No questions found for the selected filter option.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredQuestions.map((q) => {
            const isSelectedForFix = selectedMistakes.includes(q.id)
            const isMistake = userAnswersMap[q.id] !== q.correct_option
            return (
              <div key={q.id} className="relative">
                {/* Checkbox badge to include in Fix Test */}
                <div className="mb-2 flex items-center justify-between px-2">
                  <label
                    onClick={() => toggleSelectMistake(q.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-body-secondary hover:text-body-text cursor-pointer select-none"
                  >
                    {isSelectedForFix ? (
                      <CheckSquare className="w-4 h-4 text-tnpsc-brand" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>
                      {isSelectedForFix ? 'Targeted in Fix Test' : 'Include in Fix Test Drill'}
                    </span>
                    {isMistake && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold ml-1">
                        Mistake
                      </span>
                    )}
                  </label>
                </div>

                <QuestionCard
                  question={q}
                  totalQuestions={questions.length}
                  selectedOption={userAnswersMap[q.id] || null}
                  mode="review"
                  correctOption={q.correct_option}
                  explanation={q.explanation}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
