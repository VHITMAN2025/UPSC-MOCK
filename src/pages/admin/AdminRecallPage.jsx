import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Brain, FileText, Sparkles, Filter, Search, Layers,
  RefreshCw, Download, Plus, CheckCircle2, AlertCircle, ChevronDown,
  ChevronRight, Eye, Edit2, Trash2, BookOpen, ExternalLink,
  Loader2, X, Check, BookMarked, Upload, Database, Tag, ShieldCheck,
  Table, AlertTriangle, ArrowRight, Save
} from 'lucide-react'
import { adminRecallService } from '../../services/adminService'
import { useAuth } from '../../hooks/useAuth'
import { useApp } from '../../contexts/AppContext'
import {
  GROUP1_MASTER_TAXONOMY,
  GROUP2_MASTER_TAXONOMY,
  GROUP4_MASTER_TAXONOMY,
  OFFICIAL_200Q_BLUEPRINTS,
  validateQuestionAgainstMasterTaxonomy,
  computeQuestionContentHash,
  normalizeTo29Columns,
  generateMasterTaxonomyCsv,
  generate29ColumnTemplateCsv,
  normalizeExamTag,
} from '../../services/masterTaxonomyService'

const GROUP_CONFIGS = [
  { id: 'TNPSC_GROUP_1', label: 'TNPSC Group 1', tag: 'Group 1', blueprintKey: 'TNPSC_GROUP_1', totalMocksQuota: 200 },
  { id: 'TNPSC_GROUP_2', label: 'TNPSC Group 2 & 2A', tag: 'Group 2', blueprintKey: 'TNPSC_GROUP_2_TAMIL', totalMocksQuota: 200 },
  { id: 'TNPSC_GROUP_4', label: 'TNPSC Group 4', tag: 'Group 4', blueprintKey: 'TNPSC_GROUP_4', totalMocksQuota: 200 },
]

export function AdminRecallPage() {
  const { toast } = useApp()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState([])

  // Top Three-Way Group Switcher: 'TNPSC_GROUP_1' | 'TNPSC_GROUP_2' | 'TNPSC_GROUP_4'
  const [selectedGroupTag, setSelectedGroupTag] = useState('TNPSC_GROUP_4')

  // Sub-filter pills: 'all' | 'vina' | 'pyq'
  const [sourceFilter, setSourceFilter] = useState('all')

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Layout view mode: 'grid29' | 'hierarchy'
  const [layoutView, setLayoutView] = useState('grid29')

  // Inline Cell Editing State: { qId, field, value }
  const [editingCell, setEditingCell] = useState(null)
  const [cellSaving, setCellSaving] = useState(false)

  // Modals state
  const [viewingQuestion, setViewingQuestion] = useState(null)
  const [showBulkCsvModal, setShowBulkCsvModal] = useState(false)

  // Bulk CSV Validation State
  const [csvFile, setCsvFile] = useState(null)
  const [csvParsing, setCsvParsing] = useState(false)
  const [csvValidationResults, setCsvValidationResults] = useState(null)
  const [csvImporting, setCsvImporting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const rawList = await adminRecallService.getAll({ limit: 4000 })
      const normalizedList = (rawList || []).map((q, idx) => {
        // Parse any tags formatted like unit_code:XXX, macro:XXX, micro:XXX
        const tagMap = {}
        if (Array.isArray(q.tags)) {
          q.tags.forEach(t => {
            if (typeof t === 'string' && t.includes(':')) {
              const [k, ...v] = t.split(':')
              tagMap[k.trim()] = v.join(':').trim()
            }
          })
        }

        const syntheticRaw = {
          ...q,
          exam_tag: q.exam_tag || tagMap.exam_tag || q.exam_context || 'TNPSC_GROUP_4',
          unit_code: q.unit_code || tagMap.unit_code || 'UNIT_I',
          macro_topic: q.macro_topic || tagMap.macro || q.topic || 'General',
          micro_topic: q.micro_topic || tagMap.micro || 'General Concepts',
          sub_topic: q.sub_topic || tagMap.sub || '',
          source_type: q.source_type || tagMap.source || (q.is_pyq ? 'PYQ' : 'VINA'),
          year: q.year || parseInt(tagMap.year, 10) || 2024,
          cognitive_skill: q.cognitive_skill || tagMap.cog || 'FACTUAL_RECALL',
          question_text: q.question_text || '',
          question_text_tamil: q.question_ta || q.question_text_tamil || '',
          explanation: q.explanation || '',
          correct_option: q.correct_option || 'A',
        }

        return normalizeTo29Columns(syntheticRaw, idx + 1)
      })
      setQuestions(normalizedList)
    } catch (err) {
      console.error('[AdminRecallPage] Load error:', err)
      toast.error('Failed to load Quick Recall questions: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Active Master Taxonomy for the currently selected group
  const activeMasterTaxonomy = useMemo(() => {
    if (selectedGroupTag === 'TNPSC_GROUP_1') return GROUP1_MASTER_TAXONOMY
    if (selectedGroupTag === 'TNPSC_GROUP_2') return GROUP2_MASTER_TAXONOMY
    return GROUP4_MASTER_TAXONOMY
  }, [selectedGroupTag])

  // Active Blueprint for the health monitor
  const activeBlueprint = useMemo(() => {
    return OFFICIAL_200Q_BLUEPRINTS[selectedGroupTag] || OFFICIAL_200Q_BLUEPRINTS.TNPSC_GROUP_4
  }, [selectedGroupTag])

  // Filter questions belonging to selected exam group and source type
  const groupFilteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const qTag = normalizeExamTag(q.exam_tag || q.group_tag)
      if (qTag !== selectedGroupTag) return false

      if (sourceFilter === 'vina') {
        if (q.source_type !== 'VINA') return false
      } else if (sourceFilter === 'pyq') {
        if (q.source_type !== 'PYQ') return false
      }
      return true
    })
  }, [questions, selectedGroupTag, sourceFilter])

  // Filter by search query
  const searchFilteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return groupFilteredQuestions
    const q = searchQuery.toLowerCase().trim()

    return groupFilteredQuestions.filter(item => {
      const textEn = (item.en_question_text || '').toLowerCase()
      const textTa = (item.ta_question_text || '').toLowerCase()
      const qId = (item.question_id || '').toLowerCase()
      const uCode = (item.unit_code || '').toLowerCase()
      const macro = (item.macro_topic || '').toLowerCase()
      const micro = (item.micro_topic || '').toLowerCase()

      return (
        textEn.includes(q) ||
        textTa.includes(q) ||
        qId.includes(q) ||
        uCode.includes(q) ||
        macro.includes(q) ||
        micro.includes(q)
      )
    })
  }, [groupFilteredQuestions, searchQuery])

  // Paginated questions for grid
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return searchFilteredQuestions.slice(start, start + pageSize)
  }, [searchFilteredQuestions, currentPage, pageSize])

  const totalPages = Math.ceil(searchFilteredQuestions.length / pageSize) || 1

  // ── Inventory & Blueprint Health Monitor Calculations ───────────────────────
  const healthMonitor = useMemo(() => {
    const pool = groupFilteredQuestions
    const unitCounts = {}
    activeBlueprint.forEach(b => {
      unitCounts[b.unit_code] = 0
    })

    pool.forEach(q => {
      const uc = (q.unit_code || '').toUpperCase()
      if (unitCounts[uc] !== undefined) {
        unitCounts[uc]++
      }
    })

    let minFullMocksPossible = 9999
    const unitBreakdown = activeBlueprint.map(b => {
      const available = unitCounts[b.unit_code] || 0
      const quota = b.quota || 1
      const mocksPossible = Math.floor(available / quota)
      if (mocksPossible < minFullMocksPossible) {
        minFullMocksPossible = mocksPossible
      }
      return {
        unit_code: b.unit_code,
        title: b.title,
        quota,
        available,
        mocksPossible,
        isDeficit: available < quota,
      }
    })

    if (minFullMocksPossible === 9999) minFullMocksPossible = 0

    return {
      totalQuestions: pool.length,
      vinaCount: pool.filter(q => q.source_type === 'VINA').length,
      pyqCount: pool.filter(q => q.source_type === 'PYQ').length,
      minFullMocksPossible,
      unitBreakdown,
    }
  }, [groupFilteredQuestions, activeBlueprint])

  // ── Inline Cell Editing Handler ─────────────────────────────────────────────
  async function handleCellSave(q, field, newValue) {
    if (q[field] === newValue) {
      setEditingCell(null)
      return
    }

    setCellSaving(true)
    try {
      const updates = { [field]: newValue }

      // Map to DB column names for recall_questions
      const dbUpdates = {}
      if (field === 'en_question_text') dbUpdates.question_text = newValue
      else if (field === 'ta_question_text') dbUpdates.question_ta = newValue
      else if (field === 'en_option_a') dbUpdates.option_a = newValue
      else if (field === 'en_option_b') dbUpdates.option_b = newValue
      else if (field === 'en_option_c') dbUpdates.option_c = newValue
      else if (field === 'en_option_d') dbUpdates.option_d = newValue
      else if (field === 'answer_key') dbUpdates.correct_option = newValue
      else if (field === 'en_explanation') dbUpdates.explanation = newValue
      else if (field === 'macro_topic') dbUpdates.topic = newValue
      else if (field === 'difficulty_level') dbUpdates.difficulty = String(newValue).toLowerCase()
      else if (field === 'exam_tag') dbUpdates.exam_context = newValue

      // Save to Supabase
      if (q.id) {
        await adminRecallService.updateQuestion(q.id, dbUpdates)
      }

      // Update local state
      setQuestions(prev => prev.map(item => {
        if (item.question_id === q.question_id) {
          return { ...item, ...updates }
        }
        return item
      }))

      toast.success(`Saved ${field} successfully!`)
    } catch (err) {
      console.error('Cell save error:', err)
      toast.error('Failed to save update: ' + err.message)
    } finally {
      setCellSaving(false)
      setEditingCell(null)
    }
  }

  // ── Delete Question ─────────────────────────────────────────────────────────
  async function handleDeleteQuestion(q) {
    if (!window.confirm(`Are you sure you want to delete question "${q.en_question_text.slice(0, 50)}..."?`)) {
      return
    }

    try {
      if (q.id) {
        await adminRecallService.remove(q.id)
      }
      setQuestions(prev => prev.filter(item => item.question_id !== q.question_id))
      toast.success('Recall question deleted successfully.')
    } catch (err) {
      toast.error('Failed to delete question: ' + err.message)
    }
  }

  // ── Bulk CSV Upload with Strict Taxonomy Validation & Deduplication ─────────
  async function handleCsvFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFile(file)
    setCsvParsing(true)
    setCsvValidationResults(null)

    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
      if (lines.length <= 1) throw new Error('CSV file is empty or missing data rows.')

      const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase())

      const existingPyqHashes = new Set(
        questions.filter(q => q.source_type === 'PYQ' && q.content_hash).map(q => q.content_hash)
      )

      const parsedRows = []
      const validationErrors = []
      let validCount = 0
      let duplicateCount = 0

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        const cells = []
        let current = ''
        let inQuotes = false
        for (let c = 0; c < line.length; c++) {
          const char = line[c]
          if (char === '"' || char === "'") inQuotes = !inQuotes
          else if (char === ',' && !inQuotes) {
            cells.push(current.trim().replace(/^["']|["']$/g, ''))
            current = ''
          } else {
            current += char
          }
        }
        cells.push(current.trim().replace(/^["']|["']$/g, ''))

        const rowObj = {}
        rawHeaders.forEach((h, idx) => {
          rowObj[h] = cells[idx] || ''
        })

        const normalized = normalizeTo29Columns(rowObj, i)
        const hash = await computeQuestionContentHash(normalized.en_question_text, normalized.ta_question_text)
        normalized.content_hash = hash

        const valRes = validateQuestionAgainstMasterTaxonomy(normalized, selectedGroupTag)

        let isDuplicate = false
        if (normalized.source_type === 'VINA' && existingPyqHashes.has(hash)) {
          isDuplicate = true
          duplicateCount++
          valRes.errors.push('Deduplication Gate: This VINA synthetic question matches an official PYQ question text.')
          valRes.isValid = false
        }

        if (valRes.isValid) {
          validCount++
        } else {
          validationErrors.push({ rowNumber: i + 1, errors: valRes.errors, row: normalized })
        }

        parsedRows.push({
          rowNumber: i + 1,
          data: normalized,
          isValid: valRes.isValid,
          errors: valRes.errors,
          isDuplicate,
        })
      }

      setCsvValidationResults({
        total: parsedRows.length,
        validCount,
        errorCount: parsedRows.length - validCount,
        duplicateCount,
        rows: parsedRows,
        validationErrors,
      })
    } catch (err) {
      console.error('CSV parse error:', err)
      toast.error('Failed to parse CSV: ' + err.message)
    } finally {
      setCsvParsing(false)
    }
  }

  // ── Import Validated CSV Rows into recall_questions ─────────────────────────
  async function handleImportValidatedCsv() {
    if (!csvValidationResults || csvValidationResults.validCount === 0) {
      toast.error('No valid rows available to import.')
      return
    }

    setCsvImporting(true)
    try {
      const validItems = csvValidationResults.rows
        .filter(r => r.isValid)
        .map(r => r.data)

      const res = await adminRecallService.bulkInsert(validItems)
      toast.success(`Successfully imported ${res.count || validItems.length} Quick Recall questions!`)

      setShowBulkCsvModal(false)
      setCsvFile(null)
      setCsvValidationResults(null)
      await loadData()
    } catch (err) {
      console.error('Bulk import error:', err)
      toast.error('Failed to import questions: ' + err.message)
    } finally {
      setCsvImporting(false)
    }
  }

  // ── Download Helpers ────────────────────────────────────────────────────────
  function handleDownloadTaxonomyCsv() {
    const csvContent = generateMasterTaxonomyCsv(activeMasterTaxonomy)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Vina_${selectedGroupTag}_Locked_Master_Taxonomy.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${selectedGroupTag} Master Taxonomy CSV.`)
  }

  function handleDownloadTemplateCsv() {
    const csvContent = generate29ColumnTemplateCsv()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `TNPSC_QuickRecall_29Col_Master_Template.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded 29-Column Master Template CSV.')
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in text-body-text">
      {/* ── 1. Page Header & Actions Bar ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-brand">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-body-text tracking-tight flex items-center gap-2">
                Quick Recall Question Bank
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  Daily 5Q Revision Pool
                </span>
              </h1>
              <p className="text-xs text-body-secondary mt-0.5">
                Exact 29-Column Master Spreadsheet Grid · Non-Repetition Tracking · Bulk CSV Import
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDownloadTemplateCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-surface-border hover:bg-slate-50 text-body-text rounded-xl text-xs font-bold transition-all shadow-subtle"
            title="Download blank 29-column CSV template"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            29-Col Template
          </button>

          <button
            onClick={handleDownloadTaxonomyCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-surface-border hover:bg-slate-50 text-body-text rounded-xl text-xs font-bold transition-all shadow-subtle"
            title="Download Locked Syllabus Taxonomy CSV for active group"
          >
            <BookMarked className="w-3.5 h-3.5 text-indigo-600" />
            Download Taxonomy
          </button>

          <button
            onClick={() => setShowBulkCsvModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-brand"
          >
            <Upload className="w-3.5 h-3.5" />
            Bulk Upload CSV
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-white border border-surface-border hover:bg-slate-50 text-slate-600 rounded-xl text-xs transition-colors"
            title="Reload questions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-tnpsc-brand' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── 2. Top Group Switcher ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-surface-border shadow-subtle">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {GROUP_CONFIGS.map(group => {
            const isSelected = selectedGroupTag === group.id
            const count = questions.filter(q => normalizeExamTag(q.exam_tag || q.group_tag) === group.id).length
            return (
              <button
                key={group.id}
                onClick={() => {
                  setSelectedGroupTag(group.id)
                  setCurrentPage(1)
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-tnpsc-brand text-white shadow-brand scale-[1.01]'
                    : 'text-body-secondary hover:text-body-text hover:bg-slate-100'
                }`}
              >
                <span>{group.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count} Qs
                </span>
              </button>
            )
          })}
        </div>

        {/* Source Filter Pills: All / VINA / PYQ */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Sources' },
            { id: 'vina', label: 'VINA Synthetic' },
            { id: 'pyq', label: 'PYQ Previous' },
          ].map(sf => (
            <button
              key={sf.id}
              onClick={() => {
                setSourceFilter(sf.id)
                setCurrentPage(1)
              }}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sourceFilter === sf.id
                  ? 'bg-white text-body-text shadow-subtle'
                  : 'text-body-secondary hover:text-body-text'
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Quick Recall Inventory & Blueprint Monitor ────────────────────── */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold uppercase tracking-wider mb-2 border border-indigo-400/20">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Quick Recall Syllabus Pool Monitor
            </div>
            <h2 className="text-lg font-black tracking-tight">
              {GROUP_CONFIGS.find(g => g.id === selectedGroupTag)?.label} · Daily Revision Quota Health
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Zero-repetition pool tracked via <span className="font-mono text-indigo-300">user_quick_recall_history</span>. Completely independent from Mock Test history.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Total in Pool</span>
              <span className="text-lg font-black text-white">{healthMonitor.totalQuestions}</span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <span className="block text-[10px] uppercase font-bold text-teal-400">VINA Synthetic</span>
              <span className="text-lg font-black text-white">{healthMonitor.vinaCount}</span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <span className="block text-[10px] uppercase font-bold text-amber-400">Official PYQ</span>
              <span className="text-lg font-black text-white">{healthMonitor.pyqCount}</span>
            </div>
          </div>
        </div>

        {/* Blueprint Units Bar Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {healthMonitor.unitBreakdown.map(ub => (
            <div
              key={ub.unit_code}
              className={`p-3 rounded-xl border text-xs transition-all ${
                ub.isDeficit
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : 'bg-slate-800/60 border-slate-700/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-[11px] text-indigo-300">{ub.unit_code}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  ub.isDeficit ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {ub.isDeficit ? 'Deficit' : 'Optimal'}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-200 truncate" title={ub.title}>{ub.title}</p>
              <div className="flex items-baseline justify-between mt-2 text-[11px]">
                <span className="text-slate-400">Available:</span>
                <span className="font-mono font-bold text-white">{ub.available} / {ub.quota}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Search & Controls Bar ────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search by Question ID, Unit, Macro, Micro, or Text..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-surface-border rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-tnpsc-brand bg-white"
          />
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs text-body-secondary font-medium mr-1">
            <b>{searchFilteredQuestions.length}</b> questions matching
          </span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setLayoutView('grid29')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                layoutView === 'grid29'
                  ? 'bg-white text-body-text shadow-subtle'
                  : 'text-body-secondary hover:text-body-text'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              29-Col Grid
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. Exact 29-Column Spreadsheet Grid ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-subtle overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-tnpsc-brand animate-spin mx-auto mb-3" />
            <p className="text-xs text-body-secondary font-medium">Loading Quick Recall question bank...</p>
          </div>
        ) : searchFilteredQuestions.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Database className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-body-text">No Quick Recall questions found</p>
            <p className="text-xs text-body-secondary max-w-sm mx-auto">
              Use "Bulk Upload CSV" to upload questions following the 29-column template for {selectedGroupTag}.
            </p>
            <button
              onClick={() => setShowBulkCsvModal(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-tnpsc-brand text-white rounded-xl text-xs font-bold shadow-brand"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload 29-Column CSV
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[680px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 text-slate-700 sticky top-0 z-20 select-none shadow-sm text-[11px] font-bold">
                <tr className="border-b border-surface-border divide-x divide-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center bg-slate-100 sticky left-0 z-30">#</th>
                  <th className="py-2.5 px-3 min-w-[140px] sticky left-12 z-30 bg-slate-100">1. question_id</th>
                  <th className="py-2.5 px-3 min-w-[100px]">2. content_hash</th>
                  <th className="py-2.5 px-3 min-w-[120px]">3. exam_tag</th>
                  <th className="py-2.5 px-3 min-w-[110px]">4. source_type</th>
                  <th className="py-2.5 px-3 min-w-[70px]">5. year</th>
                  <th className="py-2.5 px-3 min-w-[130px]">6. subject_name</th>
                  <th className="py-2.5 px-3 min-w-[100px]">7. unit_code</th>
                  <th className="py-2.5 px-3 min-w-[160px]">8. macro_topic</th>
                  <th className="py-2.5 px-3 min-w-[180px]">9. micro_topic</th>
                  <th className="py-2.5 px-3 min-w-[150px]">10. sub_topic</th>
                  <th className="py-2.5 px-3 min-w-[90px]">11. difficulty</th>
                  <th className="py-2.5 px-3 min-w-[130px]">12. question_type</th>
                  <th className="py-2.5 px-3 min-w-[130px]">13. cognitive_skill</th>
                  <th className="py-2.5 px-3 min-w-[80px]">14. ideal_time</th>
                  {(languageColumnView === 'all' || languageColumnView === 'en') && (
                    <>
                      <th className="py-2.5 px-3 min-w-[260px] bg-blue-50/70 text-blue-950 font-bold">🇬🇧 15. en_question_text</th>
                      <th className="py-2.5 px-3 min-w-[140px] bg-blue-50/70 text-blue-950 font-bold">🇬🇧 16. en_option_a</th>
                      <th className="py-2.5 px-3 min-w-[140px] bg-blue-50/70 text-blue-950 font-bold">🇬🇧 17. en_option_b</th>
                      <th className="py-2.5 px-3 min-w-[140px] bg-blue-50/70 text-blue-950 font-bold">🇬🇧 18. en_option_c</th>
                      <th className="py-2.5 px-3 min-w-[140px] bg-blue-50/70 text-blue-950 font-bold">🇬🇧 19. en_option_d</th>
                      <th className="py-2.5 px-3 min-w-[120px] bg-blue-50/70 text-blue-950 font-bold">🇬🇧 20. en_option_e</th>
                    </>
                  )}
                  {(languageColumnView === 'all' || languageColumnView === 'ta') && (
                    <>
                      <th className="py-2.5 px-3 min-w-[260px] bg-emerald-50/70 text-emerald-950 font-bold font-tamil">🇮🇳 21. ta_question_text</th>
                      <th className="py-2.5 px-3 min-w-[140px] bg-emerald-50/70 text-emerald-950 font-bold font-tamil">🇮🇳 22. ta_option_a</th>
                      <th className="py-2.5 px-3 min-w-[140px] bg-emerald-50/70 text-emerald-950 font-bold font-tamil">🇮🇳 23. ta_option_b</th>
                      <th className="py-2.5 px-3 min-w-[140px] bg-emerald-50/70 text-emerald-950 font-bold font-tamil">🇮🇳 24. ta_option_c</th>
                      <th className="py-2.5 px-3 min-w-[140px] bg-emerald-50/70 text-emerald-950 font-bold font-tamil">🇮🇳 25. ta_option_d</th>
                      <th className="py-2.5 px-3 min-w-[120px] bg-emerald-50/70 text-emerald-950 font-bold font-tamil">🇮🇳 26. ta_option_e</th>
                    </>
                  )}
                  <th className="py-2.5 px-3 min-w-[90px] bg-amber-50/80 font-black text-amber-900">27. answer_key</th>
                  {(languageColumnView === 'all' || languageColumnView === 'en') && (
                    <th className="py-2.5 px-3 min-w-[220px] bg-blue-50/50">🇬🇧 28. en_explanation</th>
                  )}
                  {(languageColumnView === 'all' || languageColumnView === 'ta') && (
                    <th className="py-2.5 px-3 min-w-[220px] bg-emerald-50/50 font-tamil">🇮🇳 29. ta_explanation</th>
                  )}
                  <th className="py-2.5 px-3 min-w-[90px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedQuestions.map((q, idx) => {
                  const absoluteIndex = (currentPage - 1) * pageSize + idx + 1
                  return (
                    <tr key={q.question_id || q.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Row Index */}
                      <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px] sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200">
                        {absoluteIndex}
                      </td>

                      {/* 1. question_id */}
                      <td className="py-2 px-3 font-mono text-[11px] text-body-text font-bold sticky left-12 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200">
                        <span className="truncate block max-w-[130px]" title={q.question_id}>
                          {q.question_id}
                        </span>
                      </td>

                      {/* 2. content_hash */}
                      <td className="py-2 px-3 font-mono text-[10px] text-slate-400 border-r border-slate-200 max-w-[90px] truncate" title={q.content_hash}>
                        {q.content_hash ? q.content_hash.slice(0, 8) + '…' : '—'}
                      </td>

                      {/* 3. exam_tag */}
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {q.exam_tag}
                        </span>
                      </td>

                      {/* 4. source_type (strictly VINA vs PYQ) */}
                      <td className="py-2 px-3 border-r border-slate-200">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          q.source_type === 'PYQ'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-teal-100 text-teal-800 border border-teal-200'
                        }`}>
                          {q.source_type}
                        </span>
                      </td>

                      {/* 5. year */}
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-600">
                        {q.year || 2024}
                      </td>

                      {/* 6. subject_name */}
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold truncate max-w-[130px]" title={q.subject_name}>
                        {q.subject_name}
                      </td>

                      {/* 7. unit_code */}
                      <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-indigo-700">
                        {q.unit_code}
                      </td>

                      {/* 8. macro_topic */}
                      <td className="py-2 px-3 border-r border-slate-200 truncate max-w-[160px]" title={q.macro_topic}>
                        {q.macro_topic}
                      </td>

                      {/* 9. micro_topic */}
                      <td className="py-2 px-3 border-r border-slate-200 truncate max-w-[180px]" title={q.micro_topic}>
                        {q.micro_topic}
                      </td>

                      {/* 10. sub_topic */}
                      <td className="py-2 px-3 border-r border-slate-200 truncate max-w-[150px] text-slate-500" title={q.sub_topic}>
                        {q.sub_topic || '—'}
                      </td>

                      {/* 11. difficulty_level */}
                      <td className="py-2 px-3 border-r border-slate-200">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          q.difficulty_level === 'EASY'
                            ? 'bg-emerald-50 text-emerald-700'
                            : q.difficulty_level === 'HARD'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {q.difficulty_level}
                        </span>
                      </td>

                      {/* 12. question_type */}
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-[10px] text-slate-600">
                        {q.question_type}
                      </td>

                      {/* 13. cognitive_skill */}
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-[10px] text-slate-600">
                        {q.cognitive_skill}
                      </td>

                      {/* 14. ideal_time_seconds */}
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-center text-slate-600">
                        {q.ideal_time_seconds || 45}s
                      </td>

                      {/* 15. English Stem & Options */}
                      {(languageColumnView === 'all' || languageColumnView === 'en') && (
                        <>
                          <td
                            className="py-2 px-3 border-r border-slate-200 max-w-xs truncate font-medium cursor-pointer"
                            title={q.en_question_text}
                            onDoubleClick={() => setEditingCell({ qId: q.question_id, field: 'en_question_text', value: q.en_question_text })}
                          >
                            {editingCell?.qId === q.question_id && editingCell.field === 'en_question_text' ? (
                              <input
                                type="text"
                                defaultValue={editingCell.value}
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleCellSave(q, 'en_question_text', e.target.value)
                                  if (e.key === 'Escape') setEditingCell(null)
                                }}
                                className="w-full px-2 py-1 border border-indigo-400 rounded text-xs"
                              />
                            ) : (
                              q.en_question_text || '—'
                            )}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_a}>{q.en_option_a || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_b}>{q.en_option_b || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_c}>{q.en_option_c || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_d}>{q.en_option_d || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-400 text-[10px]">Answer not known</td>
                        </>
                      )}

                      {/* 21. Tamil Stem & Options */}
                      {(languageColumnView === 'all' || languageColumnView === 'ta') && (
                        <>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-xs truncate font-tamil" title={q.ta_question_text}>
                            {q.ta_question_text || '—'}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_a}>{q.ta_option_a || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_b}>{q.ta_option_b || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_c}>{q.ta_option_c || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_d}>{q.ta_option_d || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-400 font-tamil text-[10px]">விடை தெரியவில்லை</td>
                        </>
                      )}

                      {/* 27. answer_key */}
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-black bg-amber-50/50">
                        <span className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-amber-400 text-amber-950 text-xs">
                          {q.answer_key}
                        </span>
                      </td>

                      {/* 28-29. Explanations */}
                      {(languageColumnView === 'all' || languageColumnView === 'en') && (
                        <td className="py-2 px-3 border-r border-slate-200 max-w-[220px] truncate" title={q.en_explanation}>
                          {q.en_explanation || '—'}
                        </td>
                      )}
                      {(languageColumnView === 'all' || languageColumnView === 'ta') && (
                        <td className="py-2 px-3 border-r border-slate-200 max-w-[220px] truncate font-tamil" title={q.ta_explanation}>
                          {q.ta_explanation || '—'}
                        </td>
                      )}

                      {/* Actions */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingQuestion(q)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                            title="Inspect Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q)}
                            className="p-1 hover:bg-rose-100 rounded text-rose-600 transition-colors"
                            title="Delete"
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
        )}

        {/* ── Pagination Footer ────────────────────────────────────────────── */}
        <div className="p-4 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs text-body-secondary font-medium">
            <span>Showing</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-2 py-1 bg-white border border-surface-border rounded-lg text-xs font-bold"
            >
              {[20, 50, 100].map(s => (
                <option key={s} value={s}>{s} rows</option>
              ))}
            </select>
            <span>of {searchFilteredQuestions.length} Quick Recall questions</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 bg-white border border-surface-border rounded-lg text-xs font-bold disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs font-bold px-2 text-body-text">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 bg-white border border-surface-border rounded-lg text-xs font-bold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── 6. Bulk CSV Upload & Validation Modal ────────────────────────────── */}
      {showBulkCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-surface-border overflow-hidden">
            <div className="p-6 border-b border-surface-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-body-text">
                  Bulk Upload CSV into Quick Recall Pool
                </h3>
                <p className="text-xs text-body-secondary mt-0.5">
                  Target Exam Group: <b className="text-tnpsc-brand">{selectedGroupTag.replace(/_/g, ' ')}</b>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBulkCsvModal(false)
                  setCsvValidationResults(null)
                  setCsvFile(null)
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* File Input */}
              <div className="border-2 border-dashed border-slate-300 hover:border-tnpsc-brand rounded-2xl p-6 text-center transition-colors">
                <input
                  type="file"
                  id="bulk-recall-csv-input"
                  accept=".csv,.txt"
                  onChange={handleCsvFileSelect}
                  className="hidden"
                />
                <label htmlFor="bulk-recall-csv-input" className="cursor-pointer block space-y-2">
                  <Upload className="w-8 h-8 text-tnpsc-brand mx-auto" />
                  <span className="block text-xs font-bold text-body-text">
                    {csvFile ? csvFile.name : 'Click to select 29-Column CSV file'}
                  </span>
                  <span className="block text-[11px] text-body-secondary">
                    Supports 29-column schema (matching TNPSC_Group4_15000_29Col_Master_Ready.csv)
                  </span>
                </label>
              </div>

              {csvParsing && (
                <div className="py-8 text-center text-xs text-body-secondary flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-tnpsc-brand" />
                  <span>Validating foreign keys and syllabus topics against master taxonomy…</span>
                </div>
              )}

              {/* Validation Summary */}
              {csvValidationResults && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-100">
                      <span className="block text-[10px] uppercase font-bold text-slate-500">Total Rows</span>
                      <span className="text-base font-black text-body-text">{csvValidationResults.total}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="block text-[10px] uppercase font-bold text-emerald-700">Valid Rows</span>
                      <span className="text-base font-black text-emerald-800">{csvValidationResults.validCount}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                      <span className="block text-[10px] uppercase font-bold text-rose-700">Invalid Rows</span>
                      <span className="text-base font-black text-rose-800">{csvValidationResults.errorCount}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="block text-[10px] uppercase font-bold text-amber-700">Duplicates Blocked</span>
                      <span className="text-base font-black text-amber-800">{csvValidationResults.duplicateCount}</span>
                    </div>
                  </div>

                  {/* Errors display */}
                  {csvValidationResults.validationErrors.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs space-y-2">
                      <p className="font-bold text-rose-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Taxonomy Validation Issues Detected ({csvValidationResults.validationErrors.length} rows):
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                        {csvValidationResults.validationErrors.slice(0, 15).map((err, idx) => (
                          <div key={idx} className="bg-white p-2 rounded-lg border border-rose-200 text-[11px] text-rose-800">
                            <b>Row {err.rowNumber}:</b> {err.errors.join('; ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-surface-border flex items-center justify-between bg-slate-50">
              <button
                onClick={() => {
                  setShowBulkCsvModal(false)
                  setCsvValidationResults(null)
                  setCsvFile(null)
                }}
                className="px-4 py-2 bg-white border border-surface-border hover:bg-slate-100 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>

              <button
                onClick={handleImportValidatedCsv}
                disabled={csvImporting || !csvValidationResults || csvValidationResults.validCount === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-tnpsc-brand hover:bg-tnpsc-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-brand disabled:opacity-50"
              >
                {csvImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing to Quick Recall...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Import {csvValidationResults?.validCount || 0} Valid Questions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Question Details Inspector Modal ────────────────────────────── */}
      {viewingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-surface-border overflow-hidden">
            <div className="p-6 border-b border-surface-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {viewingQuestion.question_id}
                </span>
                <h3 className="text-base font-black text-body-text mt-1">
                  Quick Recall Question Details
                </h3>
              </div>
              <button
                onClick={() => setViewingQuestion(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-surface-border">
                <div>
                  <span className="text-[10px] text-body-secondary block font-bold">Exam Tag</span>
                  <span className="font-bold text-body-text">{viewingQuestion.exam_tag}</span>
                </div>
                <div>
                  <span className="text-[10px] text-body-secondary block font-bold">Source</span>
                  <span className="font-bold text-body-text">{viewingQuestion.source_type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-body-secondary block font-bold">Unit Code</span>
                  <span className="font-bold text-indigo-600 font-mono">{viewingQuestion.unit_code}</span>
                </div>
              </div>

              {/* English Question */}
              <div className="space-y-2">
                <p className="font-bold text-body-text text-sm">{viewingQuestion.en_question_text}</p>
                <div className="grid grid-cols-2 gap-2">
                  {['a', 'b', 'c', 'd'].map(opt => {
                    const isKey = viewingQuestion.answer_key === opt.toUpperCase()
                    return (
                      <div
                        key={opt}
                        className={`p-2 rounded-xl border font-medium ${
                          isKey
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                            : 'bg-white border-surface-border text-body-secondary'
                        }`}
                      >
                        <span className="font-bold mr-1.5">{opt.toUpperCase()})</span>
                        {viewingQuestion[`en_option_${opt}`]}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Tamil Question */}
              {viewingQuestion.ta_question_text && (
                <div className="space-y-2 pt-3 border-t border-surface-border font-tamil">
                  <p className="font-bold text-body-text text-sm">{viewingQuestion.ta_question_text}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['a', 'b', 'c', 'd'].map(opt => {
                      const isKey = viewingQuestion.answer_key === opt.toUpperCase()
                      return (
                        <div
                          key={opt}
                          className={`p-2 rounded-xl border font-medium ${
                            isKey
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                              : 'bg-white border-surface-border text-body-secondary'
                          }`}
                        >
                          <span className="font-bold mr-1.5">{opt.toUpperCase()})</span>
                          {viewingQuestion[`ta_option_${opt}`]}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Explanations */}
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-2">
                <p className="font-bold text-indigo-900 text-xs">Explanation:</p>
                <p className="text-slate-700 leading-relaxed">{viewingQuestion.en_explanation || 'No English explanation recorded.'}</p>
                {viewingQuestion.ta_explanation && (
                  <p className="text-slate-700 leading-relaxed font-tamil pt-1 border-t border-indigo-200/50">
                    {viewingQuestion.ta_explanation}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-surface-border flex justify-end bg-slate-50">
              <button
                onClick={() => setViewingQuestion(null)}
                className="px-4 py-2 bg-white border border-surface-border hover:bg-slate-100 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
