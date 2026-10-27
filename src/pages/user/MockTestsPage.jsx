import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Clock, FileText, Play, Loader2, BookOpen, Sparkles, CheckCircle2, Sliders, Layers, AlertCircle } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { paperService } from '../../services/paperService'
import { attemptService } from '../../services/attemptService'
import { testGeneratorService } from '../../services/testGeneratorService'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export function MockTestsPage() {
  const { selectedExam, group2LanguagePref, setGroup2LanguagePref, toast } = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [papers, setPapers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(null)

  // Test Generator State
  const [generating, setGenerating] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(group2LanguagePref || 'General Tamil')
  const [availableQuestionsCount, setAvailableQuestionsCount] = useState(0)
  const [checkingQuestions, setCheckingQuestions] = useState(true)

  useEffect(() => {
    if (group2LanguagePref) setSelectedLanguage(group2LanguagePref)
  }, [group2LanguagePref])

  useEffect(() => { 
    loadPapers()
    checkAvailableQuestions()
  }, [selectedExam])

  async function checkAvailableQuestions() {
    setCheckingQuestions(true)
    try {
      const { count, error } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .not('correct_option', 'is', null)
        .not('unit_code', 'is', null)
      
      if (!error) {
        setAvailableQuestionsCount(count || 0)
      }
    } catch (err) {
      console.error('[MockTestsPage] Check questions error:', err)
    } finally {
      setCheckingQuestions(false)
    }
  }

  async function loadPapers() {
    setLoading(true)
    try {
      const data = await paperService.getPublishedPapers({
        sort: 'year_desc',
        examName: selectedExam,
      })
      setPapers(data)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  async function startMock(paper) {
    if (!user) {
      toast.error('Please log in to start a mock test.')
      navigate('/login')
      return
    }
    setStarting(paper.id)
    try {
      const attempt = await attemptService.startOrGetAttempt(user.id, paper.id)
      navigate(`/exam/${paper.id}`)
    } catch (err) { toast.error(err.message) }
    finally { setStarting(null) }
  }

  async function handleGenerateIntelligentTest() {
    if (!user) {
      toast.error('Please log in to generate a mock test.')
      navigate('/login')
      return
    }

    if (availableQuestionsCount === 0) {
      toast.error('No questions available. Please contact admin to upload questions.')
      return
    }

    setGenerating(true)
    try {
      // Use flexible generator that works with any number of questions
      const generatedTest = await testGeneratorService.generateFlexibleMockTest({
        userId: user.id,
        examType: selectedExam,
        languageSpecialization: selectedLanguage,
        allowFallback: true,
      })

      if (!generatedTest || generatedTest.totalQuestions === 0) {
        throw new Error('No questions available for test generation')
      }

      toast.info(`Materializing ${generatedTest.totalQuestions} questions into test session…`)
      const result = await testGeneratorService.materializeGeneratedMockPaper(user.id, generatedTest)

      toast.success(`Generated ${generatedTest.totalQuestions}Q test! Launching exam…`)
      navigate(`/exam/${result.paperId}`)
    } catch (err) {
      console.error('[MockTestsPage] Generation error:', err)
      toast.error(`Generation failed: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const isGroup1 = selectedExam === 'TNPSC Group 1'
  const isGroup2 = selectedExam === 'TNPSC Group 2/2A'
  const isGroup4 = selectedExam === 'TNPSC Group 4'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Zap className="w-6 h-6 text-tnpsc-brand" />
        <div>
          <h1 className="text-xl font-bold text-body-text">Full Mock Tests</h1>
          <p className="text-xs text-body-secondary">Timed exam simulation with detailed result analysis</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-tnpsc-brand-light rounded-2xl border border-tnpsc-brand/20 p-4 flex items-start gap-3">
        <Clock className="w-5 h-5 text-tnpsc-brand shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-tnpsc-brand">Exam-Mode Simulation</p>
          <p className="text-xs text-body-secondary mt-0.5">
            Questions run in real exam conditions. Your progress is auto-saved — you can resume if you lose connection.
          </p>
        </div>
      </div>

      {/* ─── Intelligent Test Generator Card ─────────────────────────── */}
      {checkingQuestions ? (
        <div className="bg-white rounded-2xl p-6 text-center border border-surface-border">
          <Loader2 className="w-6 h-6 animate-spin text-tnpsc-brand mx-auto mb-2" />
          <p className="text-sm text-body-secondary">Checking available questions...</p>
        </div>
      ) : availableQuestionsCount === 0 ? (
        <div className="bg-amber-50 rounded-2xl p-6 text-center border border-amber-200">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-amber-900">No Questions Available</h3>
          <p className="text-sm text-amber-700 mt-2">
            The question bank is empty. Please contact the admin to upload questions, or check back later.
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-[#111426] via-[#1a1f3c] to-[#0f1123] rounded-2xl p-6 text-white shadow-card border border-indigo-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold tracking-wide uppercase mb-2 border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                Dynamic Test Generator
              </div>
              <h2 className="text-lg font-bold tracking-tight">
                {selectedExam} Mock Test
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                {availableQuestionsCount} questions available · Zero-repeat tracking · New questions on each attempt
              </p>
            </div>

            <button
              onClick={handleGenerateIntelligentTest}
              disabled={generating}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-500/25 transition-all transform active:scale-[0.98] disabled:opacity-60 shrink-0"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Test…
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Generate & Start Mock
                </>
              )}
            </button>
          </div>

          {/* Info about available questions */}
          <div className="mt-5 bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs text-slate-300">
                <p className="font-bold text-white mb-1">Smart Question Selection</p>
                <p>
                  This generator will use <b className="text-white">{availableQuestionsCount} available questions</b> from the database.
                  Questions you've already attempted will be shown last, ensuring you get fresh questions first.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Published Papers Grid ───────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-body-text mb-3">Published Exam Papers ({selectedExam})</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-tnpsc-brand" /></div>
        ) : papers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-surface-border">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-body-secondary font-semibold">No pre-published papers for {selectedExam} yet</p>
            <p className="text-xs text-body-secondary mt-1">Use the Intelligent Test Generator above to start a customized 200-question test anytime.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {papers.map(paper => (
              <div key={paper.id} className="bg-white rounded-2xl border border-surface-border shadow-subtle p-5 flex flex-col gap-3 hover:shadow-card transition-shadow">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-tnpsc-brand bg-tnpsc-brand-light rounded px-2 py-0.5">
                    {paper.exam_type}
                  </span>
                  <h3 className="text-sm font-bold text-body-text mt-2 leading-snug line-clamp-2">{paper.title}</h3>
                  <p className="text-xs text-body-secondary mt-1">{paper.year} · {paper.subject}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-body-secondary">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {paper.total_questions}Q</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {paper.duration_minutes}m</span>
                </div>
                <div className="flex gap-2 mt-auto pt-2">
                  <Link
                    to={`/papers/${paper.id}`}
                    className="flex-1 text-center py-2 border border-surface-border rounded-xl text-xs font-semibold text-body-secondary hover:bg-slate-50 transition-colors"
                  >
                    Details
                  </Link>
                  <button
                    onClick={() => startMock(paper)}
                    disabled={starting === paper.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-tnpsc-brand text-white rounded-xl text-xs font-bold hover:bg-tnpsc-brand-hover transition-colors disabled:opacity-60"
                  >
                    {starting === paper.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
