import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { paperService } from '../../services/paperService'
import { attemptService } from '../../services/attemptService'
import { testGeneratorService } from '../../services/testGeneratorService'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../hooks/useAuth'
import {
  Calendar, ArrowRight, Loader2, BookOpen, Sparkles,
  CheckCircle2, Play, AlertCircle, Layers
} from 'lucide-react'

// Standard historical exam years per TNPSC exam group
const CANONICAL_YEARS_BY_GROUP = {
  'TNPSC Group 4': [2024, 2022, 2019, 2018, 2016, 2014, 2013, 2012, 2011],
  'TNPSC Group 1': [2025, 2024, 2022, 2021, 2019, 2017, 2015, 2014, 2011],
  'TNPSC Group 2/2A': [2025, 2024, 2022, 2018, 2015, 2013, 2012],
}

export function PaperListPage() {
  const { selectedExam, group2LanguagePref, toast } = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [papers, setPapers] = useState([])
  const [startingYear, setStartingYear] = useState(null)

  // Load published papers matching current selected exam group from sidebar
  useEffect(() => {
    async function loadPapers() {
      setLoading(true)
      try {
        const data = await paperService.getAllPapersForAdmin()
        setPapers(data || [])
      } catch (err) {
        console.error('Failed to load question papers:', err)
        toast.error('Failed to load papers: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    loadPapers()
  }, [selectedExam])

  // Extract effective year from paper title or year column
  const getPaperEffectiveYear = (paper) => {
    const titleMatch = paper.title?.match(/\b(20\d{2}|19\d{2})\b/)
    if (titleMatch) return parseInt(titleMatch[1], 10)
    if (paper.year && paper.year !== 2026) return paper.year
    return paper.year || 2024
  }

  // Filter and map papers to years based on the active exam group in the sidebar
  const { yearCards, papersByYear } = useMemo(() => {
    const groupLower = (selectedExam || 'TNPSC Group 4').toLowerCase()
    let keywords = ['group 4', 'group-4', 'grp_4']
    if (groupLower.includes('group 1')) {
      keywords = ['group 1', 'group-1', 'grp_1', 'group1']
    } else if (groupLower.includes('group 2')) {
      keywords = ['group 2', 'group-2', 'grp_2', 'grp_ii', 'group 2/2a', 'group 2a']
    }

    // Match only published papers belonging to the selected group
    const matchedPapers = papers.filter(p => {
      if (p.status !== 'published') return false
      const title = (p.title || '').toLowerCase()
      const examName = (p.exam_name || '').toLowerCase()
      return keywords.some(k => title.includes(k) || examName.includes(k))
    })

    // Map each year to the best available paper
    const map = {}
    matchedPapers.forEach(p => {
      const yr = getPaperEffectiveYear(p)
      if (
        !map[yr] ||
        (p.status === 'published' && map[yr].status !== 'published') ||
        ((p.total_questions || 0) > (map[yr].total_questions || 0))
      ) {
        map[yr] = p
      }
    })

    // Get canonical standard years for this group and merge with any database years found
    const canonical = CANONICAL_YEARS_BY_GROUP[selectedExam] || CANONICAL_YEARS_BY_GROUP['TNPSC Group 4']
    const allYears = Array.from(new Set([...canonical, ...Object.keys(map).map(Number)])).sort((a, b) => b - a)

    const cards = allYears.map(yr => ({
      year: yr,
      paper: map[yr] || null,
      hasDirectPaper: Boolean(map[yr]),
      questionCount: map[yr]?.total_questions || (selectedExam === 'TNPSC Group 1' ? 200 : 200),
    }))

    return { yearCards: cards, papersByYear: map }
  }, [papers, selectedExam])

  // Handle clicking a specific year
  const handleYearClick = async (yearItem) => {
    const { year, paper } = yearItem
    setStartingYear(year)

    try {
      let targetPaperId = paper?.id

      // If no paper exists in DB for this exact year, generate or fallback
      if (!targetPaperId) {
        toast.info(`Preparing ${year} ${selectedExam} examination paper…`)
        
        let genRes = null
        if (selectedExam === 'TNPSC Group 1') {
          genRes = await testGeneratorService.generateGroup1Test({ strict: false, allowFallback: true })
        } else if (selectedExam === 'TNPSC Group 2/2A') {
          genRes = await testGeneratorService.generateGroup2Test({
            languageSpecialization: group2LanguagePref || 'General Tamil',
            strict: false,
            allowFallback: true,
          })
        } else {
          genRes = await testGeneratorService.generateGroup4Test({
            languageSpecialization: group2LanguagePref || 'General Tamil',
            strict: false,
            allowFallback: true,
          })
        }

        if (genRes?.paper?.id) {
          targetPaperId = genRes.paper.id
        } else {
          // Fallback to any available paper in this group
          const anyPaper = Object.values(papersByYear)[0]
          if (anyPaper) targetPaperId = anyPaper.id
        }
      }

      if (!targetPaperId) {
        toast.error(`Could not locate paper for ${year}. Please try another year.`)
        return
      }

      // Check authentication
      if (!user) {
        toast.info('Please log in to attempt the exam.')
        navigate('/login', { state: { from: { pathname: `/exam/${targetPaperId}` } } })
        return
      }

      // Initialize or retrieve user attempt and navigate directly to live exam room
      await attemptService.startOrGetAttempt(user.id, targetPaperId)
      navigate(`/exam/${targetPaperId}`)
    } catch (err) {
      console.error('Error starting year exam:', err)
      toast.error('Could not start exam: ' + err.message)
    } finally {
      setStartingYear(null)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-5xl mx-auto">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tnpsc-brand/10 border border-tnpsc-brand/20 text-tnpsc-brand text-xs font-bold">
          <Calendar className="w-3.5 h-3.5" />
          <span>{selectedExam} Previous Year Papers</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-body-text tracking-tight">
          Select Exam Year
        </h1>

        <p className="text-xs sm:text-sm text-body-secondary max-w-xl mx-auto">
          Choose a year below to begin the official previous year question paper for{' '}
          <strong className="text-body-text">{selectedExam}</strong>.
          The exam room will launch immediately.
        </p>

        <p className="text-[11px] text-slate-400">
          (Exam group syncs with your sidebar selection: <strong>{selectedExam}</strong>)
        </p>
      </div>

      {/* ── Loading State ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-10 h-10 text-tnpsc-brand animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-body-secondary">
            Loading {selectedExam} exam years…
          </p>
        </div>
      ) : (
        /* ── Clean Years Grid ────────────────────────────────────────────────── */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {yearCards.map((item) => {
            const isStarting = startingYear === item.year

            return (
              <button
                key={item.year}
                type="button"
                onClick={() => handleYearClick(item)}
                disabled={Boolean(startingYear)}
                className={`group relative p-6 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-between min-h-[140px] ${
                  isStarting
                    ? 'bg-tnpsc-brand text-white border-tnpsc-brand shadow-brand scale-95'
                    : 'bg-white hover:bg-slate-50 border-surface-border hover:border-tnpsc-brand hover:shadow-card shadow-subtle'
                } disabled:cursor-not-allowed`}
              >
                {/* Year Number (Big & Bold) */}
                <div className="space-y-1 my-auto">
                  <span
                    className={`text-3xl sm:text-4xl font-black tracking-tight transition-colors ${
                      isStarting
                        ? 'text-white'
                        : 'text-body-text group-hover:text-tnpsc-brand'
                    }`}
                  >
                    {item.year}
                  </span>
                  <p
                    className={`text-[10px] uppercase font-bold tracking-wider ${
                      isStarting ? 'text-white/80' : 'text-body-secondary'
                    }`}
                  >
                    {selectedExam.replace('TNPSC ', '')}
                  </p>
                </div>

                {/* Bottom Action Label */}
                <div className="pt-3 w-full border-t border-slate-100 flex items-center justify-center gap-1">
                  {isStarting ? (
                    <span className="text-[11px] font-bold flex items-center gap-1.5 text-white">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Opening…
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-tnpsc-brand group-hover:underline flex items-center gap-1">
                      <span>Start Exam</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
