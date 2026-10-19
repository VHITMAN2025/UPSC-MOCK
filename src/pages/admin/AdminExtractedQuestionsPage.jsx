import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  HelpCircle, FileText, Sparkles, Filter, Search, Layers,
  RefreshCw, Download, Plus, CheckCircle2, AlertCircle, ChevronDown,
  ChevronRight, Eye, Edit2, Trash2, BookOpen, ExternalLink,
  Loader2, X, Check, BookMarked, Upload, Database, Tag, ShieldCheck
} from 'lucide-react'
import { questionService } from '../../services/questionService'
import { paperService } from '../../services/paperService'
import { supabase } from '../../lib/supabase'
import { useApp } from '../../contexts/AppContext'
import { OFFICIAL_SYLLABUS_UNITS, normalizeUnitName } from '../../components/admin/TopicSeparationSummary'
import { CANONICAL_SYLLABUS_TAXONOMY } from '../../services/syllabusAnalyticsService'
import AiPdfTab from '../../components/admin/AiPdfTab'
import { TextPdfTab } from '../../components/admin/TextPdfTab'

export function AdminExtractedQuestionsPage() {
  const { toast } = useApp()

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState([])
  const [papers, setPapers] = useState([])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('all')
  const [selectedPaperId, setSelectedPaperId] = useState('all')
  const [selectedLanguage, setSelectedLanguage] = useState('all') // 'all' | 'tamil' | 'english'
  const [viewMode, setViewMode] = useState('table') // 'table' | 'separated'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Modals state
  const [viewingQuestion, setViewingQuestion] = useState(null)
  const [editingTopicQ, setEditingTopicQ] = useState(null)
  const [savingTopic, setSavingTopic] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadTab, setUploadTab] = useState('ai') // 'ai' | 'text'
  const [selectedTargetPaperId, setSelectedTargetPaperId] = useState('')
  const [isCreatingNewPaper, setIsCreatingNewPaper] = useState(false)
  const [newPaperTitle, setNewPaperTitle] = useState('')
  const [creatingPaper, setCreatingPaper] = useState(false)

  // Batch auto-categorize state
  const [batchSaving, setBatchSaving] = useState(false)
  const [batchProgress, setBatchProgress] = useState(null)

  // Load all questions from database
  useEffect(() => {
    loadData()

    // ── Supabase Realtime Listener ──────────────────────────────────────
    let channel = null
    try {
      channel = supabase
        .channel('admin-questions-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'questions' },
          (payload) => {
            console.log('[Realtime] Questions table updated:', payload.eventType)
            loadData()
          }
        )
        .subscribe()
    } catch (e) {
      console.warn('Realtime subscription note:', e)
    }

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await questionService.getAllExtractedQuestionsForAdmin({ limit: 4000 })
      setQuestions(res.questions || [])
      setPapers(res.papers || [])
      if (res.papers?.length > 0 && !selectedTargetPaperId) {
        setSelectedTargetPaperId(res.papers[0].id)
      }
    } catch (err) {
      console.error('[AdminExtractedQuestionsPage] Load error:', err)
      toast.error('Failed to load extracted questions: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Unit breakdown stats
  const unitStats = useMemo(() => {
    const map = {}
    OFFICIAL_SYLLABUS_UNITS.forEach(u => {
      map[u.unit_name] = { ...u, count: 0 }
    })

    questions.forEach(q => {
      const canonical = normalizeUnitName(q.unit_name)
      if (map[canonical]) {
        map[canonical].count++
      } else {
        if (!map['Other / General']) {
          map['Other / General'] = {
            id: 'other',
            unit_name: 'Other / General',
            shortName: 'Other',
            count: 0,
            badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
            dotColor: 'bg-slate-400',
          }
        }
        map['Other / General'].count++
      }
    })

    return Object.values(map)
  }, [questions])

  // Filtered Questions List
  const filteredQuestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    return questions.filter(item => {
      // Unit filter
      if (selectedUnit !== 'all') {
        const canonical = normalizeUnitName(item.unit_name)
        if (canonical !== selectedUnit) return false
      }

      // Paper filter
      if (selectedPaperId !== 'all') {
        if (item.paper_id !== selectedPaperId) return false
      }

      // Language filter
      if (selectedLanguage === 'tamil') {
        if (!item.question_text_tamil && !item.option_a_tamil) return false
      } else if (selectedLanguage === 'english') {
        if (!item.question_text) return false
      }

      // Search query
      if (q) {
        const textEn = (item.question_text || '').toLowerCase()
        const textTa = (item.question_text_tamil || '').toLowerCase()
        const optA = (item.option_a || '').toLowerCase()
        const optB = (item.option_b || '').toLowerCase()
        const optC = (item.option_c || '').toLowerCase()
        const optD = (item.option_d || '').toLowerCase()
        const expl = (item.explanation || '').toLowerCase()
        const unit = (item.unit_name || '').toLowerCase()
        const macro = (item.macro_topic_name || '').toLowerCase()
        const micro = (item.micro_topic_name || '').toLowerCase()
        const paper = (item.paper_title || '').toLowerCase()
        const sourcePdf = (item.source_pdf || '').toLowerCase()

        const match =
          textEn.includes(q) ||
          textTa.includes(q) ||
          optA.includes(q) ||
          optB.includes(q) ||
          optC.includes(q) ||
          optD.includes(q) ||
          expl.includes(q) ||
          unit.includes(q) ||
          macro.includes(q) ||
          micro.includes(q) ||
          paper.includes(q) ||
          sourcePdf.includes(q)

        if (!match) return false
      }

      return true
    })
  }, [questions, searchQuery, selectedUnit, selectedPaperId, selectedLanguage])

  // Paginated Questions
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredQuestions.slice(start, start + pageSize)
  }, [filteredQuestions, currentPage, pageSize])

  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1

  // Handle Page Change
  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p)
      window.scrollTo({ top: 300, behavior: 'smooth' })
    }
  }

  // Grouped questions by topic for the "Separated by Topic" view
  const groupedByTopic = useMemo(() => {
    const groups = {}
    filteredQuestions.forEach((q) => {
      const canonical = normalizeUnitName(q.unit_name)
      if (!groups[canonical]) groups[canonical] = []
      groups[canonical].push(q)
    })
    return groups
  }, [filteredQuestions])

  // Save updated topic
  async function handleSaveTopic(e) {
    e.preventDefault()
    if (!editingTopicQ) return
    setSavingTopic(true)
    try {
      await questionService.updateQuestionTopic(editingTopicQ.id, {
        unitName: editingTopicQ.unit_name,
        macroTopicName: editingTopicQ.macro_topic_name,
        microTopicName: editingTopicQ.micro_topic_name,
      })

      // Update local state
      setQuestions(prev =>
        prev.map(q =>
          q.id === editingTopicQ.id
            ? {
                ...q,
                unit_name: editingTopicQ.unit_name,
                macro_topic_name: editingTopicQ.macro_topic_name,
                micro_topic_name: editingTopicQ.micro_topic_name,
                has_db_taxonomy: true,
              }
            : q
        )
      )

      toast.success('Question topic updated and saved to database successfully!')
      setEditingTopicQ(null)
    } catch (err) {
      toast.error('Failed to update topic: ' + err.message)
    } finally {
      setSavingTopic(false)
    }
  }

  // Delete question
  async function handleDeleteQuestion(qId, paperId) {
    if (!confirm('Are you sure you want to delete this extracted question from the database?')) return
    try {
      await questionService.deleteQuestion(qId, paperId)
      setQuestions(prev => prev.filter(q => q.id !== qId))
      toast.success('Question deleted from database.')
    } catch (err) {
      toast.error('Failed to delete question: ' + err.message)
    }
  }

  // Batch auto-classify and save topics into Supabase
  async function handleBatchSaveTopics() {
    setBatchSaving(true)
    setBatchProgress('Analyzing questions & saving topics to database...')
    try {
      const res = await questionService.batchClassifyAndSaveTopics(p => {
        setBatchProgress(`Saved ${p.updatedCount} of ${p.total} questions to database...`)
      })
      toast.success(`Successfully saved syllabus topics for ${res.updatedCount} questions into database!`)
      await loadData()
    } catch (err) {
      toast.error('Batch save error: ' + err.message)
    } finally {
      setBatchSaving(false)
      setBatchProgress(null)
    }
  }

  // Export to CSV
  function handleExportCSV() {
    if (filteredQuestions.length === 0) {
      toast.error('No questions to export.')
      return
    }

    const headers = [
      'ID', 'Paper Title', 'Source PDF', 'Question Number',
      'Syllabus Unit', 'Macro Topic', 'Micro Topic',
      'Question Text (English)', 'Question Text (Tamil)',
      'Option A', 'Option B', 'Option C', 'Option D',
      'Correct Option', 'Explanation'
    ]

    const escapeCsv = (str) => {
      if (!str) return '""'
      const clean = String(str).replace(/"/g, '""')
      return `"${clean}"`
    }

    const rows = filteredQuestions.map(q => [
      q.id,
      escapeCsv(q.paper_title),
      escapeCsv(q.source_pdf_display),
      q.question_number,
      escapeCsv(q.unit_name),
      escapeCsv(q.macro_topic_name),
      escapeCsv(q.micro_topic_name),
      escapeCsv(q.question_text),
      escapeCsv(q.question_text_tamil),
      escapeCsv(q.option_a),
      escapeCsv(q.option_b),
      escapeCsv(q.option_c),
      escapeCsv(q.option_d),
      q.correct_option,
      escapeCsv(q.explanation)
    ].join(','))

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `extracted_questions_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${filteredQuestions.length} questions to CSV!`)
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-subtle shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-body-text">
                Extracted Questions Repository
              </h1>
              <p className="text-xs text-body-secondary mt-0.5">
                Total questions extracted across all uploaded PDFs &amp; papers, categorized by subject and syllabus topics
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-white hover:bg-slate-50 text-body-text border border-surface-border rounded-xl text-xs font-bold transition-colors shadow-subtle"
            title="Refresh question bank"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-tnpsc-brand' : ''}`} />
          </button>

          <button
            onClick={handleBatchSaveTopics}
            disabled={batchSaving || loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-subtle disabled:opacity-50"
            title="Auto-classifies untagged questions and writes syllabus taxonomy tags permanently into the database"
          >
            {batchSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>{batchSaving ? (batchProgress || 'Saving to DB…') : 'Save Topics in DB'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-body-text border border-surface-border rounded-xl text-xs font-bold transition-colors shadow-subtle"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-tnpsc-brand hover:bg-tnpsc-brand-hover text-white rounded-xl text-xs font-bold shadow-brand transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Extract New PDF</span>
          </button>
        </div>
      </div>

      {/* ── KPI Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-surface-border p-4 shadow-subtle">
          <p className="text-[11px] font-bold text-body-secondary uppercase tracking-wider">Total Questions Extracted</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-body-text">{questions.length}</span>
            <span className="text-[11px] font-semibold text-emerald-600">in database</span>
          </div>
          <p className="text-[10px] text-body-secondary mt-1">From all admin uploaded PDFs</p>
        </div>

        <div className="bg-white rounded-2xl border border-surface-border p-4 shadow-subtle">
          <p className="text-[11px] font-bold text-body-secondary uppercase tracking-wider">Source Papers / PDFs</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-body-text">{papers.length}</span>
            <span className="text-[11px] font-semibold text-indigo-600">papers linked</span>
          </div>
          <p className="text-[10px] text-body-secondary mt-1">Active question papers</p>
        </div>

        <div className="bg-white rounded-2xl border border-surface-border p-4 shadow-subtle">
          <p className="text-[11px] font-bold text-body-secondary uppercase tracking-wider">Syllabus Units Covered</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-body-text">
              {unitStats.filter(u => u.count > 0).length} / {OFFICIAL_SYLLABUS_UNITS.length}
            </span>
            <span className="text-[11px] font-semibold text-purple-600">units</span>
          </div>
          <p className="text-[10px] text-body-secondary mt-1">Separated by canonical subject</p>
        </div>

        <div className="bg-white rounded-2xl border border-surface-border p-4 shadow-subtle">
          <p className="text-[11px] font-bold text-body-secondary uppercase tracking-wider">Filtered View Count</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-tnpsc-brand">{filteredQuestions.length}</span>
            <span className="text-[11px] font-semibold text-body-secondary">questions</span>
          </div>
          <p className="text-[10px] text-body-secondary mt-1">
            {selectedUnit === 'all' ? 'All topics shown' : selectedUnit.split(':')[0]}
          </p>
        </div>
      </div>

      {/* ── Subject / Topic Separation Cards (Horizontal Grid) ─────────────── */}
      <div className="bg-white rounded-2xl border border-surface-border p-4 sm:p-5 shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-tnpsc-brand" />
            <h2 className="text-xs sm:text-sm font-bold text-body-text">
              Questions Separated by Subject &amp; Syllabus Topic
            </h2>
          </div>
          {selectedUnit !== 'all' && (
            <button
              onClick={() => setSelectedUnit('all')}
              className="text-[11px] font-bold text-tnpsc-brand hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Show All Subjects
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1">
          {unitStats.map((u) => {
            const isSelected = selectedUnit === u.unit_name
            const pct = questions.length > 0 ? Math.round((u.count / questions.length) * 100) : 0

            return (
              <button
                key={u.id}
                onClick={() => {
                  setSelectedUnit(isSelected ? 'all' : u.unit_name)
                  setCurrentPage(1)
                }}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-sm'
                    : 'border-surface-border hover:border-slate-300 bg-white hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className={`w-2 h-2 rounded-full ${u.dotColor || 'bg-slate-400'}`} />
                  <span className="text-[10px] font-black font-mono text-body-secondary">{pct}%</span>
                </div>
                <p className="text-xs font-bold text-body-text leading-tight truncate" title={u.unit_name}>
                  {u.shortName || u.unit_name}
                </p>
                <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-slate-100">
                  <span className="text-sm font-black text-body-text">{u.count}</span>
                  <span className="text-[10px] font-semibold text-body-secondary">Qs</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Filters & View Controls Bar ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-surface-border p-4 shadow-subtle space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search by question stem, option text, explanation, topic, or PDF name…"
              className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-surface-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-tnpsc-brand focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Subject Dropdown */}
            <select
              value={selectedUnit}
              onChange={e => {
                setSelectedUnit(e.target.value)
                setCurrentPage(1)
              }}
              className="text-xs bg-slate-50 border border-surface-border rounded-xl px-2.5 py-2 font-semibold text-body-text outline-none focus:ring-2 focus:ring-tnpsc-brand cursor-pointer"
            >
              <option value="all">All Subjects ({questions.length})</option>
              {OFFICIAL_SYLLABUS_UNITS.map(u => (
                <option key={u.id} value={u.unit_name}>
                  {u.shortName}
                </option>
              ))}
            </select>

            {/* Paper / PDF Dropdown */}
            <select
              value={selectedPaperId}
              onChange={e => {
                setSelectedPaperId(e.target.value)
                setCurrentPage(1)
              }}
              className="text-xs bg-slate-50 border border-surface-border rounded-xl px-2.5 py-2 font-semibold text-body-text outline-none focus:ring-2 focus:ring-tnpsc-brand cursor-pointer max-w-[180px] truncate"
            >
              <option value="all">All Uploaded Papers ({papers.length})</option>
              {papers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>

            {/* Language Toggle */}
            <select
              value={selectedLanguage}
              onChange={e => {
                setSelectedLanguage(e.target.value)
                setCurrentPage(1)
              }}
              className="text-xs bg-slate-50 border border-surface-border rounded-xl px-2.5 py-2 font-semibold text-body-text outline-none focus:ring-2 focus:ring-tnpsc-brand cursor-pointer"
            >
              <option value="all">All Languages</option>
              <option value="tamil">Tamil / Bilingual</option>
              <option value="english">English Only</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-body-text shadow-sm'
                    : 'text-body-secondary hover:text-body-text'
                }`}
              >
                Tabular
              </button>
              <button
                type="button"
                onClick={() => setViewMode('separated')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'separated'
                    ? 'bg-white text-body-text shadow-sm'
                    : 'text-body-secondary hover:text-body-text'
                }`}
              >
                By Topic
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main View Content ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-surface-border">
          <Loader2 className="w-8 h-8 text-tnpsc-brand animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-body-text">Loading extracted questions from database…</p>
          <p className="text-[11px] text-body-secondary mt-1">Querying question bank and joining syllabus taxonomy…</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-surface-border p-6 space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-body-text">No extracted questions match your filter</p>
          <p className="text-xs text-body-secondary max-w-md mx-auto">
            Try adjusting your search query, selecting another syllabus unit, or resetting filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedUnit('all')
              setSelectedPaperId('all')
              setSelectedLanguage('all')
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-body-text rounded-xl text-xs font-bold transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* ── Tabular Format (Main Feature) ─────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-surface-border shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-surface-border text-left text-body-secondary uppercase tracking-wider font-bold">
                  <th className="py-3 px-3.5 w-12 text-center">#</th>
                  <th className="py-3 px-3.5 min-w-[280px]">Question Text (EN / TA)</th>
                  <th className="py-3 px-3.5 min-w-[170px]">Syllabus Unit</th>
                  <th className="py-3 px-3.5 min-w-[140px]">Micro-Topic</th>
                  <th className="py-3 px-3.5 min-w-[220px]">Options &amp; Correct Answer</th>
                  <th className="py-3 px-3.5 min-w-[160px]">Source PDF / Paper</th>
                  <th className="py-3 px-3.5 w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {paginatedQuestions.map((q, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1
                  const canonicalUnit = normalizeUnitName(q.unit_name)
                  const unitConfig = OFFICIAL_SYLLABUS_UNITS.find(u => u.unit_name === canonicalUnit)

                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* # Index */}
                      <td className="py-3 px-3.5 text-center font-bold text-body-secondary">
                        {globalIdx}
                      </td>

                      {/* Question Text */}
                      <td className="py-3 px-3.5">
                        <div className="space-y-1">
                          <p className="font-semibold text-body-text leading-relaxed line-clamp-2">
                            {q.question_text || q.question_text_tamil || 'No question text provided'}
                          </p>
                          {q.question_text_tamil && q.question_text && (
                            <p className="text-[11px] text-body-secondary font-tamil line-clamp-1">
                              {q.question_text_tamil}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Syllabus Unit */}
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                            unitConfig?.badgeColor || 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {unitConfig?.shortName || canonicalUnit}
                        </span>
                      </td>

                      {/* Micro-Topic */}
                      <td className="py-3 px-3.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-indigo-900 text-[11px] truncate" title={q.micro_topic_name}>
                            {q.micro_topic_name || q.macro_topic_name || 'General Concept'}
                          </p>
                          {q.macro_topic_name && q.macro_topic_name !== q.micro_topic_name && (
                            <p className="text-[10px] text-body-secondary truncate" title={q.macro_topic_name}>
                              {q.macro_topic_name}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Options & Correct Answer */}
                      <td className="py-3 px-3.5">
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          {['A', 'B', 'C', 'D'].map(letter => {
                            const optKey = `option_${letter.toLowerCase()}`
                            const optText = q[optKey]
                            const isCorrect = String(q.correct_option).toUpperCase() === letter

                            return (
                              <div
                                key={letter}
                                className={`px-2 py-0.5 rounded border truncate ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-800'
                                    : 'bg-slate-50 border-slate-200 text-body-secondary'
                                }`}
                                title={`(${letter}) ${optText || '-'}`}
                              >
                                <span className={isCorrect ? 'text-emerald-700 font-black mr-1' : 'text-slate-400 mr-1'}>
                                  {letter}:
                                </span>
                                <span>{optText || '-'}</span>
                              </div>
                            )
                          })}
                        </div>
                      </td>

                      {/* Source PDF / Paper */}
                      <td className="py-3 px-3.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-body-text text-[11px] truncate" title={q.paper_title}>
                            {q.paper_title}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-body-secondary truncate">
                            <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{q.source_pdf_display}</span>
                            {q.page_number && (
                              <span className="bg-slate-100 text-slate-600 px-1 rounded font-mono">
                                p.{q.page_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingQuestion(q)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Question Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingTopicQ({ ...q })}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Subject / Topic"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id, q.paper_id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete from Database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination Bar ────────────────────────────────────────────── */}
          <div className="p-4 border-t border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs text-body-secondary">
              <span>Showing</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="bg-white border border-surface-border rounded-lg px-2 py-1 font-semibold text-body-text outline-none"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>of {filteredQuestions.length} questions</span>
            </div>

            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white border border-surface-border rounded-xl text-xs font-bold text-body-text hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-body-text px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white border border-surface-border rounded-xl text-xs font-bold text-body-text hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Separated by Topic (Accordion View) ───────────────────────────── */
        <div className="space-y-4">
          {Object.entries(groupedByTopic).map(([unitName, qList]) => {
            const unitConfig = OFFICIAL_SYLLABUS_UNITS.find(u => u.unit_name === unitName)

            return (
              <div
                key={unitName}
                className="bg-white rounded-2xl border border-surface-border overflow-hidden shadow-subtle"
              >
                {/* Topic Group Header */}
                <div className="p-4 bg-slate-50/80 border-b border-surface-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${unitConfig?.dotColor || 'bg-indigo-600'}`} />
                    <h3 className="text-sm font-bold text-body-text">
                      {unitConfig?.shortName || unitName}
                    </h3>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-full">
                      {qList.length} Questions
                    </span>
                  </div>
                </div>

                {/* Questions List */}
                <div className="divide-y divide-surface-border">
                  {qList.slice(0, 15).map((q, qIdx) => (
                    <div key={q.id} className="p-4 hover:bg-slate-50/50 transition-colors space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-bold text-[10px]">
                            {q.micro_topic_name || 'General Concept'}
                          </span>
                          <span className="text-[11px] text-body-secondary">
                            from {q.paper_title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingQuestion(q)}
                            className="text-[11px] text-indigo-600 hover:underline font-bold"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => setEditingTopicQ({ ...q })}
                            className="text-[11px] text-amber-600 hover:underline font-bold"
                          >
                            Edit Topic
                          </button>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-body-text">
                        {q.question_text || q.question_text_tamil}
                      </p>
                    </div>
                  ))}
                  {qList.length > 15 && (
                    <div className="p-3 text-center bg-slate-50 text-xs font-semibold text-body-secondary">
                      + {qList.length - 15} more questions in this topic. Switch to Tabular view to browse all.
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── View Question Modal ────────────────────────────────────────────── */}
      {viewingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-tnpsc-brand" />
                <h3 className="text-sm font-bold text-body-text">Question Details &amp; Taxonomy</h3>
              </div>
              <button
                onClick={() => setViewingQuestion(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Taxonomy Path */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1 text-xs">
              <p className="font-bold text-indigo-900 text-[10px] uppercase tracking-wider">Syllabus Taxonomy Path</p>
              <p className="font-semibold text-indigo-800">
                {viewingQuestion.unit_name} &rsaquo; {viewingQuestion.macro_topic_name || 'General'} &rsaquo; {viewingQuestion.micro_topic_name || 'Concepts'}
              </p>
            </div>

            {/* Question Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-body-secondary">Question Text (English)</label>
              <div className="p-3.5 bg-slate-50 border border-surface-border rounded-xl text-xs font-semibold text-body-text leading-relaxed whitespace-pre-line">
                {viewingQuestion.question_text || 'None'}
              </div>
            </div>

            {viewingQuestion.question_text_tamil && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-body-secondary">Question Text (Tamil)</label>
                <div className="p-3.5 bg-slate-50 border border-surface-border rounded-xl text-xs font-semibold text-body-text font-tamil leading-relaxed whitespace-pre-line">
                  {viewingQuestion.question_text_tamil}
                </div>
              </div>
            )}

            {/* Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-body-secondary">Answer Options</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {['A', 'B', 'C', 'D'].map(letter => {
                  const optKey = `option_${letter.toLowerCase()}`
                  const optText = viewingQuestion[optKey]
                  const isCorrect = String(viewingQuestion.correct_option).toUpperCase() === letter

                  return (
                    <div
                      key={letter}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                          : 'bg-white border-surface-border text-body-text'
                      }`}
                    >
                      <div>
                        <span className={`font-bold mr-2 ${isCorrect ? 'text-emerald-700' : 'text-slate-400'}`}>
                          ({letter})
                        </span>
                        <span>{optText || '-'}</span>
                      </div>
                      {isCorrect && (
                        <span className="text-[10px] font-black uppercase text-emerald-700 shrink-0">
                          ✓ Correct
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Explanation */}
            {viewingQuestion.explanation && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-body-secondary">Detailed Explanation</label>
                <div className="p-3.5 bg-slate-50 border border-surface-border rounded-xl text-xs text-body-secondary leading-relaxed whitespace-pre-line">
                  {viewingQuestion.explanation}
                </div>
              </div>
            )}

            {/* Source Meta */}
            <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-[11px] text-body-secondary">
              <span>Source: <strong>{viewingQuestion.paper_title}</strong></span>
              <span>PDF: <strong>{viewingQuestion.source_pdf_display}</strong></span>
              <span>ID: <code className="font-mono text-[10px]">{viewingQuestion.id.slice(0, 8)}</code></span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingQuestion(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-body-text rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Subject / Topic Modal ────────────────────────────────────── */}
      {editingTopicQ && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleSaveTopic}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-body-text">Assign Subject &amp; Topic to Question</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTopicQ(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-body-secondary line-clamp-2 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              "{editingTopicQ.question_text || editingTopicQ.question_text_tamil}"
            </p>

            {/* Unit Dropdown */}
            <div>
              <label className="block text-xs font-bold text-body-secondary mb-1">
                Level 1: Syllabus Unit (Broad Subject)
              </label>
              <select
                value={editingTopicQ.unit_name}
                onChange={e => setEditingTopicQ(prev => ({ ...prev, unit_name: e.target.value }))}
                className="w-full text-xs border border-surface-border rounded-xl px-3 py-2.5 font-semibold text-body-text outline-none focus:ring-2 focus:ring-tnpsc-brand bg-white"
              >
                {OFFICIAL_SYLLABUS_UNITS.map(u => (
                  <option key={u.id} value={u.unit_name}>
                    {u.unit_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Macro-Topic Input */}
            <div>
              <label className="block text-xs font-bold text-body-secondary mb-1">
                Level 2: Macro-Topic (Sub-Category)
              </label>
              <input
                type="text"
                value={editingTopicQ.macro_topic_name || ''}
                onChange={e => setEditingTopicQ(prev => ({ ...prev, macro_topic_name: e.target.value }))}
                placeholder="e.g. Physics, Indian Polity, Ancient History"
                className="w-full text-xs border border-surface-border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-tnpsc-brand"
              />
            </div>

            {/* Micro-Topic Input */}
            <div>
              <label className="block text-xs font-bold text-body-secondary mb-1">
                Level 3: Micro-Topic (Exact Chapter / Concept)
              </label>
              <input
                type="text"
                value={editingTopicQ.micro_topic_name || ''}
                onChange={e => setEditingTopicQ(prev => ({ ...prev, micro_topic_name: e.target.value }))}
                placeholder="e.g. Mechanics & Properties of Matter, Preamble & Rights"
                className="w-full text-xs border border-surface-border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-tnpsc-brand"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setEditingTopicQ(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-body-text rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingTopic}
                className="flex items-center gap-2 px-5 py-2 bg-tnpsc-brand hover:bg-tnpsc-brand-hover text-white rounded-xl text-xs font-bold transition-colors shadow-brand disabled:opacity-50"
              >
                {savingTopic ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{savingTopic ? 'Saving Topic to DB…' : 'Save Topic to Database'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Direct PDF Upload & Extract Modal ──────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-body-text">Extract Questions from Admin PDF</h3>
                  <p className="text-xs text-body-secondary mt-0.5">
                    Upload any question paper PDF to extract questions with AI/Text detection and save them with their related topics.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Paper Selection */}
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-surface-border">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-body-secondary">
                  Destination Question Paper:
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewPaper(!isCreatingNewPaper)}
                  className="text-[11px] font-bold text-tnpsc-brand hover:underline"
                >
                  {isCreatingNewPaper ? 'Choose Existing Paper' : '+ Create New Paper for this PDF'}
                </button>
              </div>

              {isCreatingNewPaper ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPaperTitle}
                    onChange={e => setNewPaperTitle(e.target.value)}
                    placeholder="Enter new paper title (e.g. TNPSC Group 4 2026 Sample Test)…"
                    className="flex-1 text-xs bg-white border border-surface-border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-tnpsc-brand"
                  />
                  <button
                    type="button"
                    disabled={creatingPaper || !newPaperTitle.trim()}
                    onClick={async () => {
                      if (!newPaperTitle.trim()) return
                      setCreatingPaper(true)
                      try {
                        const created = await paperService.createPaper({
                          title: newPaperTitle.trim(),
                          exam_type: 'prelims',
                          exam_name: 'TNPSC Group 4',
                          year: new Date().getFullYear(),
                          duration_minutes: 180,
                          maximum_marks: 200,
                          status: 'draft',
                        })
                        setPapers(prev => [created, ...prev])
                        setSelectedTargetPaperId(created.id)
                        setIsCreatingNewPaper(false)
                        setNewPaperTitle('')
                        toast.success(`Created paper "${created.title}". Ready to extract!`)
                      } catch (err) {
                        toast.error('Failed to create paper: ' + err.message)
                      } finally {
                        setCreatingPaper(false)
                      }
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {creatingPaper ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Create Paper
                  </button>
                </div>
              ) : (
                <select
                  value={selectedTargetPaperId}
                  onChange={e => setSelectedTargetPaperId(e.target.value)}
                  className="w-full text-xs bg-white border border-surface-border rounded-xl px-3 py-2 font-semibold text-body-text outline-none focus:ring-2 focus:ring-tnpsc-brand cursor-pointer"
                >
                  {papers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.total_questions || 0} questions currently)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Tab switch between AI and Local PDF */}
            <div className="flex items-center gap-2 border-b border-surface-border pb-2">
              <button
                onClick={() => setUploadTab('ai')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  uploadTab === 'ai'
                    ? 'bg-blue-600 text-white shadow-subtle'
                    : 'bg-slate-100 text-body-secondary hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Vision PDF (Tamil &amp; English)</span>
              </button>
              <button
                onClick={() => setUploadTab('text')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  uploadTab === 'text'
                    ? 'bg-purple-600 text-white shadow-subtle'
                    : 'bg-slate-100 text-body-secondary hover:bg-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Text PDF (Local Fast Parser)</span>
              </button>
            </div>

            {/* Extractor Tab Content */}
            {selectedTargetPaperId ? (
              uploadTab === 'ai' ? (
                <AiPdfTab
                  paperId={selectedTargetPaperId}
                  paperTitle={papers.find(p => p.id === selectedTargetPaperId)?.title}
                  onImportSuccess={() => {
                    toast.success('Questions successfully extracted and saved!')
                    setShowUploadModal(false)
                    loadData()
                  }}
                />
              ) : (
                <TextPdfTab
                  paperId={selectedTargetPaperId}
                  paperTitle={papers.find(p => p.id === selectedTargetPaperId)?.title}
                  onImportSuccess={() => {
                    toast.success('Questions successfully extracted and saved!')
                    setShowUploadModal(false)
                    loadData()
                  }}
                />
              )
            ) : (
              <p className="text-xs text-amber-600">Please select a destination paper first.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
