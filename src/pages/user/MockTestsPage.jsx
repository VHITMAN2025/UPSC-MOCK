import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Zap, Clock, FileText, Play, Loader2, BookOpen, Sparkles,
  CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, ArrowRight,
  Award, Check, ChevronRight
} from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { paperService } from '../../services/paperService'
import { attemptService } from '../../services/attemptService'
import { testGeneratorService } from '../../services/testGeneratorService'
import { useAuth } from '../../hooks/useAuth'

const SYLLABUS_QUOTAS_DISPLAY = {
  'TNPSC Group 1': {
    standard: 'Degree Standard (Part A: 175 GS + Part B: 25 Aptitude)',
    parts: [
      {
        name: 'Part A — General Studies (175 Questions)',
        units: [
          { code: 'UNIT_I', title: 'General Science', count: 10 },
          { code: 'UNIT_II', title: 'Geography of India', count: 10 },
          { code: 'UNIT_III', title: 'History, Culture of India & INM', count: 25 },
          { code: 'UNIT_IV', title: 'Indian Polity', count: 40 },
          { code: 'UNIT_V', title: 'Indian Economy & Dev Admin in TN', count: 50 },
          { code: 'UNIT_VI', title: 'History, Culture, Heritage & Movements in TN', count: 40 },
        ]
      },
      {
        name: 'Part B — Aptitude & Mental Ability (25 Questions)',
        units: [
          { code: 'APT_UNIT_I', title: 'Aptitude & Arithmetic', count: 15 },
          { code: 'APT_UNIT_II', title: 'Mental Ability & Logical Reasoning', count: 10 },
        ]
      }
    ]
  },
  'TNPSC Group 2/2A': {
    standard: 'Degree GS + SSLC Standard Language',
    parts: [
      {
        name: 'Part A — Language (100 Questions: User Selected)',
        units: [
          { code: 'LANG_A', title: 'Part A (இலக்கணம் / Grammar)', count: 35 },
          { code: 'LANG_B', title: 'Part B (இலக்கியம் / Prescribed Poems)', count: 35 },
          { code: 'LANG_C', title: 'Part C (தமிழ் அறிஞர்கள் / Authors & Works)', count: 30 },
        ]
      },
      {
        name: 'Part B — General Studies (75 Questions)',
        units: [
          { code: 'UNIT_I', title: 'General Science', count: 5 },
          { code: 'UNIT_II', title: 'Current Events', count: 5 },
          { code: 'UNIT_III', title: 'Geography of India', count: 10 },
          { code: 'UNIT_IV', title: 'History and Culture of India', count: 15 },
          { code: 'UNIT_V', title: 'Indian Polity & Economy', count: 20 },
          { code: 'UNIT_VI', title: 'INM & Tamil Nadu Heritage / Dev Admin', count: 20 },
        ]
      },
      {
        name: 'Part C — Aptitude & Mental Ability (25 Questions)',
        units: [
          { code: 'APT_UNIT_I', title: 'Aptitude & Arithmetic', count: 15 },
          { code: 'APT_UNIT_II', title: 'Mental Ability & Logical Reasoning', count: 10 },
        ]
      }
    ]
  },
  'TNPSC Group 4': {
    standard: 'SSLC Standard (Part A: 100 General Tamil + Part B: 75 GS + Part C: 25 Aptitude)',
    parts: [
      {
        name: 'Part A — Compulsory General Tamil (100 Questions)',
        units: [
          { code: 'LANG_TA_A', title: 'பகுதி-அ (இலக்கணம்)', count: 35 },
          { code: 'LANG_TA_B', title: 'பகுதி-ஆ (இலக்கியம்)', count: 35 },
          { code: 'LANG_TA_C', title: 'பகுதி-இ (தமிழ் அறிஞர்களும் தமிழ்த் தொண்டும்)', count: 30 },
        ]
      },
      {
        name: 'Part B — General Studies (75 Questions)',
        units: [
          { code: 'UNIT_I', title: 'General Science (SSLC Standard)', count: 8 },
          { code: 'UNIT_II', title: 'Current Events', count: 7 },
          { code: 'UNIT_III', title: 'Geography of India', count: 12 },
          { code: 'UNIT_IV', title: 'History and Culture of India', count: 15 },
          { code: 'UNIT_V', title: 'Indian Polity & Economy', count: 18 },
          { code: 'UNIT_VI', title: 'INM & Tamil Nadu Culture / Heritage', count: 15 },
        ]
      },
      {
        name: 'Part C — Aptitude & Mental Ability (25 Questions)',
        units: [
          { code: 'APT_UNIT_I', title: 'Aptitude & Arithmetic', count: 15 },
          { code: 'APT_UNIT_II', title: 'Mental Ability & Logical Reasoning', count: 10 },
        ]
      }
    ]
  }
}

export function MockTestsPage() {
  const { selectedExam, setSelectedExam, group2LanguagePref, setGroup2LanguagePref, toast } = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(null)
  const [generating, setGenerating] = useState(false)

  // Language choice for Group 2
  const [selectedLanguage, setSelectedLanguage] = useState(group2LanguagePref || 'General Tamil')

  useEffect(() => {
    if (group2LanguagePref) setSelectedLanguage(group2LanguagePref)
  }, [group2LanguagePref])

  useEffect(() => {
    loadPapers()
  }, [selectedExam])

  async function loadPapers() {
    setLoading(true)
    try {
      const data = await paperService.getPublishedPapers({
        sort: 'year_desc',
        examName: selectedExam,
      })
      setPapers(data || [])
    } catch (err) {
      toast.error('Failed to load papers: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function startExistingMock(paper) {
    if (!user) {
      toast.error('Please log in to start a mock test.')
      navigate('/login')
      return
    }
    setStarting(paper.id)
    try {
      await attemptService.startOrGetAttempt(user.id, paper.id)
      navigate(`/exam/${paper.id}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setStarting(null)
    }
  }

  async function handleLaunchOfficialMock() {
    if (!user) {
      toast.error('Please log in to launch a mock test.')
      navigate('/login')
      return
    }

    setGenerating(true)
    try {
      let generatedTest = null

      if (selectedExam === 'TNPSC Group 1') {
        generatedTest = await testGeneratorService.generateGroup1Test({
          quotaResolutionMode: 'normalize_to_200',
          userId: user.id,
          strict: true,
          allowFallback: false,
        })
      } else if (selectedExam === 'TNPSC Group 2/2A') {
        generatedTest = await testGeneratorService.generateGroup2Test({
          languageSpecialization: selectedLanguage,
          userId: user.id,
          strict: true,
          allowFallback: false,
        })
      } else {
        // Group 4 (default)
        generatedTest = await testGeneratorService.generateGroup4Test({
          languageSpecialization: 'General Tamil',
          userId: user.id,
          strict: true,
          allowFallback: false,
        })
      }

      toast.info('Preparing official 200-question test session…')
      const result = await testGeneratorService.materializeGeneratedMockPaper(user.id, generatedTest)

      toast.success('Exam session ready! Launching fullscreen exam…')
      navigate(`/exam/${result.paperId}`)
    } catch (err) {
      console.error('[MockTestsPage] Launch error:', err)
      toast.error(`Mock launch error: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const isGroup1 = selectedExam === 'TNPSC Group 1'
  const isGroup2 = selectedExam === 'TNPSC Group 2/2A'
  const isGroup4 = selectedExam === 'TNPSC Group 4'

  const syllabusBlueprint = SYLLABUS_QUOTAS_DISPLAY[selectedExam] || SYLLABUS_QUOTAS_DISPLAY['TNPSC Group 4']

  return (
    <div className="space-y-8 pb-16 animate-fade-in text-body-text max-w-6xl mx-auto">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-tnpsc-brand flex items-center justify-center text-white shadow-brand">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-body-text">
              Official 200-Question Full Mock Tests
            </h1>
            <p className="text-xs text-body-secondary mt-0.5">
              Exact TNPSC Syllabus Quotas · 300 Marks · 180 Minutes · Mandatory Option E · Zero Repetition
            </p>
          </div>
        </div>

        {/* Exam Group Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
          {['TNPSC Group 4', 'TNPSC Group 2/2A', 'TNPSC Group 1'].map(g => (
            <button
              key={g}
              onClick={() => setSelectedExam(g)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedExam === g
                  ? 'bg-white text-body-text shadow-subtle'
                  : 'text-body-secondary hover:text-body-text'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pre-Exam Instruction Card ────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-surface-border shadow-card overflow-hidden">
        {/* Banner with Official Mark Allotment */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold tracking-wide uppercase border border-indigo-400/30">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Official Examination Rules &amp; Allotment
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">
                {selectedExam} Examination Simulation
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {syllabusBlueprint.standard}. Dynamically assembled from verified database questions matching official syllabus unit weightages.
              </p>
            </div>

            {/* Metrics Chips */}
            <div className="grid grid-cols-3 gap-3 bg-white/10 p-4 rounded-2xl border border-white/10 text-center shrink-0">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-300">Total Questions</span>
                <span className="text-xl font-black text-white">200 Qs</span>
              </div>
              <div className="border-x border-white/10 px-2">
                <span className="block text-[10px] uppercase font-bold text-amber-300">Total Marks</span>
                <span className="text-xl font-black text-white">300 M</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-indigo-300">Duration</span>
                <span className="text-xl font-black text-white">180 Mins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rules & Option E Information */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-surface-border rounded-2xl p-4 space-y-1.5">
              <span className="text-xs font-bold text-body-text flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                1.5 Marks per Correct Question
              </span>
              <p className="text-[11px] text-body-secondary leading-relaxed">
                Every correctly answered question is awarded 1.5 marks. Total maximum attainable score is 300 marks.
              </p>
            </div>

            <div className="bg-slate-50 border border-surface-border rounded-2xl p-4 space-y-1.5">
              <span className="text-xs font-bold text-body-text flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Mandatory Option E (No Penalty)
              </span>
              <p className="text-[11px] text-body-secondary leading-relaxed">
                Option E ("Answer not known" / "விடை தெரியவில்லை") is provided for every question. Selecting Option E scores 0 marks without any penalty.
              </p>
            </div>

            <div className="bg-slate-50 border border-surface-border rounded-2xl p-4 space-y-1.5">
              <span className="text-xs font-bold text-body-text flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                180 Minutes (3.0 Hours)
              </span>
              <p className="text-[11px] text-body-secondary leading-relaxed">
                54 seconds ideal pacing per question. Real-time timer auto-submits on completion. Answers autosave continuously.
              </p>
            </div>
          </div>

          {/* Group 2 Language Preference Selector */}
          {isGroup2 && (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-indigo-950">Select Language Preference for Part A (Questions 1–100)</h3>
                  <p className="text-xs text-indigo-700">Choose between General Tamil or General English for your 100 language questions.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLanguage('General Tamil')
                    setGroup2LanguagePref('General Tamil')
                  }}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                    selectedLanguage === 'General Tamil'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-white text-body-text border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  <span>பொதுத் தமிழ் (General Tamil) — 100 Qs</span>
                  {selectedLanguage === 'General Tamil' && <Check className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedLanguage('General English')
                    setGroup2LanguagePref('General English')
                  }}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                    selectedLanguage === 'General English'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-white text-body-text border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  <span>General English — 100 Qs</span>
                  {selectedLanguage === 'General English' && <Check className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Syllabus Unit Breakdown & Question Quota Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-body-secondary flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-tnpsc-brand" />
              Official Syllabus Breakdown &amp; Question Quota Distribution
            </h3>

            <div className="border border-surface-border rounded-2xl overflow-hidden divide-y divide-surface-border text-xs">
              {syllabusBlueprint.parts.map((part, pIdx) => (
                <div key={pIdx} className="p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-body-text">{part.name}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                      {part.units.reduce((acc, u) => acc + u.count, 0)} Questions
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {part.units.map(unit => (
                      <div
                        key={unit.code}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-surface-border"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] font-mono font-bold text-indigo-600 block">{unit.code}</span>
                          <span className="text-[11px] font-medium text-body-text truncate block" title={unit.title}>
                            {unit.title}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-extrabold text-body-text bg-white px-2 py-1 rounded-lg border border-surface-border shrink-0">
                          {unit.count} Qs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Launch Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-border">
            <div className="flex items-center gap-2 text-xs text-body-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Zero-repetition active: guarantees never-seen questions for this attempt.</span>
            </div>

            <button
              onClick={handleLaunchOfficialMock}
              disabled={generating}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-tnpsc-brand to-indigo-700 hover:from-tnpsc-brand-hover hover:to-indigo-800 text-white font-black text-sm rounded-xl shadow-brand transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Assembling 200 Questions…</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Launch Official 200-Question Mock Test</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Published Question Papers ────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-body-text">
              Published Practice Papers ({selectedExam})
            </h2>
            <p className="text-xs text-body-secondary">
              Pre-published official exam papers available for direct reattempt
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-tnpsc-brand mx-auto mb-2" />
            <p className="text-xs text-body-secondary">Loading published papers…</p>
          </div>
        ) : papers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-surface-border p-8 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-body-text">No pre-published papers for {selectedExam}</p>
            <p className="text-[11px] text-body-secondary">
              Launch the 200-question full mock test above anytime to generate a complete exam paper.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {papers.map(paper => (
              <div
                key={paper.id}
                className="bg-white rounded-2xl border border-surface-border p-5 flex flex-col justify-between hover:shadow-card transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {paper.exam_type || 'Full Mock'}
                    </span>
                    <span className="text-xs text-body-secondary font-mono">{paper.year || 2024}</span>
                  </div>
                  <h3 className="text-sm font-bold text-body-text leading-snug line-clamp-2" title={paper.title}>
                    {paper.title}
                  </h3>
                  <p className="text-xs text-body-secondary">{paper.subject || 'General Studies'}</p>
                </div>

                <div className="pt-4 border-t border-surface-border mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-body-secondary">
                    <span>{paper.total_questions || 200} Qs</span>
                    <span>·</span>
                    <span>{paper.duration_minutes || 180} mins</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/papers/${paper.id}`}
                      className="px-3 py-1.5 rounded-lg border border-surface-border text-xs font-bold hover:bg-slate-50 transition-colors"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => startExistingMock(paper)}
                      disabled={starting === paper.id}
                      className="px-3 py-1.5 bg-tnpsc-brand hover:bg-tnpsc-brand-hover text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-subtle disabled:opacity-60"
                    >
                      {starting === paper.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-white" />
                      )}
                      <span>Start</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
