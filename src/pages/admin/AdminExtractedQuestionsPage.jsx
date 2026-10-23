import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  HelpCircle, FileText, Sparkles, Filter, Search, Layers,
  RefreshCw, Download, Plus, CheckCircle2, AlertCircle, ChevronDown,
  ChevronRight, Eye, Edit2, Trash2, BookOpen, ExternalLink,
  Loader2, X, Check, BookMarked, Upload, Database, Tag, ShieldCheck,
  Table, AlertTriangle, ArrowRight, Save
} from 'lucide-react'
import { questionService } from '../../services/questionService'
import { paperService } from '../../services/paperService'
import { supabase } from '../../lib/supabase'
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
import AiPdfTab from '../../components/admin/AiPdfTab'
import { TextPdfTab } from '../../components/admin/TextPdfTab'

const GROUP_CONFIGS = [
  { id: 'TNPSC_GROUP_1', label: 'TNPSC Group 1', tag: 'Group 1', blueprintKey: 'TNPSC_GROUP_1', totalMocksQuota: 200 },
  { id: 'TNPSC_GROUP_2', label: 'TNPSC Group 2 & 2A', tag: 'Group 2', blueprintKey: 'TNPSC_GROUP_2_TAMIL', totalMocksQuota: 200 },
  { id: 'TNPSC_GROUP_4', label: 'TNPSC Group 4', tag: 'Group 4', blueprintKey: 'TNPSC_GROUP_4', totalMocksQuota: 200 },
]

export function AdminExtractedQuestionsPage() {
  const { toast } = useApp()

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState([])
  const [papers, setPapers] = useState([])

  // Top Three-Way Group Switcher: 'TNPSC_GROUP_1' | 'TNPSC_GROUP_2' | 'TNPSC_GROUP_4'
  const [selectedGroupTag, setSelectedGroupTag] = useState('TNPSC_GROUP_1')

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
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showBulkCsvModal, setShowBulkCsvModal] = useState(false)
  const [uploadTab, setUploadTab] = useState('ai') // 'ai' | 'text'
  const [selectedTargetPaperId, setSelectedTargetPaperId] = useState('')

  // Bulk CSV Validation State
  const [csvFile, setCsvFile] = useState(null)
  const [csvParsing, setCsvParsing] = useState(false)
  const [csvValidationResults, setCsvValidationResults] = useState(null)
  const [csvImporting, setCsvImporting] = useState(false)

  // Load questions and papers
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await questionService.getAllExtractedQuestionsForAdmin({ limit: 4000 })
      const rawList = res.questions || []
      console.log('[AdminExtractedQuestionsPage] Loaded questions:', rawList.length)
      console.log('[AdminExtractedQuestionsPage] Sample questions:', rawList.slice(0, 3))
      const normalizedList = rawList.map((q, idx) => normalizeTo29Columns(q, idx + 1))
      console.log('[AdminExtractedQuestionsPage] Normalized questions:', normalizedList.length)
      console.log('[AdminExtractedQuestionsPage] Sample normalized:', normalizedList.slice(0, 3).map(q => ({
        id: q.question_id,
        exam_tag: q.exam_tag,
        source_type: q.source_type,
        text: q.en_question_text?.substring(0, 50)
      })))
      setQuestions(normalizedList)
      setPapers(res.papers || [])
      if (res.papers?.length > 0 && !selectedTargetPaperId) {
        setSelectedTargetPaperId(res.papers[0].id)
      }
    } catch (err) {
      console.error('[AdminExtractedQuestionsPage] Load error:', err)
      toast.error('Failed to load questions: ' + err.message)
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
    return OFFICIAL_200Q_BLUEPRINTS[selectedGroupTag] || OFFICIAL_200Q_BLUEPRINTS.TNPSC_GROUP_1
  }, [selectedGroupTag])

  // Filter questions belonging to selected exam group and source type
  const groupFilteredQuestions = useMemo(() => {
    // If no questions loaded, return empty
    if (questions.length === 0) return []
    
    // For now, show all questions regardless of taxonomy (since taxonomy columns don't exist in DB)
    // Apply only source filter
    const filtered = questions.filter(q => {
      if (sourceFilter === 'vina') {
        if (q.source_type !== 'VINA') return false
      } else if (sourceFilter === 'pyq') {
        if (q.source_type !== 'PYQ') return false
      }
      return true
    })
    
    console.log('[AdminExtractedQuestionsPage] Filter results (taxonomy filtering disabled):', {
      total: questions.length,
      selectedGroup: selectedGroupTag,
      sourceFilter,
      filtered: filtered.length,
      note: 'Showing all questions - taxonomy columns not in database'
    })
    
    return filtered
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

      // Also compute content_hash if question text changed
      if (field === 'en_question_text' || field === 'ta_question_text') {
        const en = field === 'en_question_text' ? newValue : q.en_question_text
        const ta = field === 'ta_question_text' ? newValue : q.ta_question_text
        updates.content_hash = await computeQuestionContentHash(en, ta)
      }

      // Map to DB column names
      const dbUpdates = {}
      if (field === 'en_question_text') dbUpdates.question_text = newValue
      else if (field === 'ta_question_text') dbUpdates.question_text_tamil = newValue
      else if (field === 'en_option_a') dbUpdates.option_a = newValue
      else if (field === 'en_option_b') dbUpdates.option_b = newValue
      else if (field === 'en_option_c') dbUpdates.option_c = newValue
      else if (field === 'en_option_d') dbUpdates.option_d = newValue
      else if (field === 'ta_option_a') dbUpdates.option_a_tamil = newValue
      else if (field === 'ta_option_b') dbUpdates.option_b_tamil = newValue
      else if (field === 'ta_option_c') dbUpdates.option_c_tamil = newValue
      else if (field === 'ta_option_d') dbUpdates.option_d_tamil = newValue
      else if (field === 'answer_key') dbUpdates.correct_option = newValue
      else if (field === 'en_explanation') dbUpdates.explanation = newValue
      else if (field === 'ta_explanation') dbUpdates.explanation_tamil = newValue
      else if (field === 'unit_code') {
        dbUpdates.unit_code = newValue
        dbUpdates.unit_tag = newValue
      } else if (field === 'macro_topic') {
        dbUpdates.macro_topic = newValue
        dbUpdates.macro_topic_name = newValue
      } else if (field === 'micro_topic') {
        dbUpdates.micro_topic = newValue
        dbUpdates.micro_topic_name = newValue
      } else if (field === 'difficulty_level') dbUpdates.difficulty_level = newValue
      else if (field === 'source_type') {
        dbUpdates.source_type = newValue
        dbUpdates.is_pyq = newValue === 'PYQ'
      }

      // Save to Supabase
      if (q.id) {
        await questionService.updateQuestion(q.id, dbUpdates)
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

      // Parse headers
      const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase())

      // Existing PYQ hashes to enforce Deduplication Gate
      const existingPyqHashes = new Set(
        questions.filter(q => q.source_type === 'PYQ' && q.content_hash).map(q => q.content_hash)
      )

      const parsedRows = []
      const validationErrors = []
      let validCount = 0
      let duplicateCount = 0

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        // Basic CSV split with quote handling
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

        // 1. Strict Foreign-Key & Taxonomy Validation
        const valRes = validateQuestionAgainstMasterTaxonomy(normalized, selectedGroupTag)

        // 2. Deduplication Gate: VINA question cannot match PYQ hash
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
        totalRows: lines.length - 1,
        validCount,
        errorCount: validationErrors.length,
        duplicateCount,
        rows: parsedRows,
        errors: validationErrors,
      })
    } catch (err) {
      console.error('CSV parse error:', err)
      toast.error('Failed to parse CSV: ' + err.message)
    } finally {
      setCsvParsing(false)
    }
  }

  async function handleConfirmImportValidRows() {
    if (!csvValidationResults || csvValidationResults.validCount === 0) {
      toast.error('No valid rows available to import.')
      return
    }

    setCsvImporting(true)
    try {
      const validQuestions = csvValidationResults.rows
        .filter(r => r.isValid)
        .map(r => {
          // Convert 29-column format to legacy format for saveQuestionsToSupabase
          const normalized = r.data
          return {
            question_number: normalized.question_number || r.rowNumber,
            question_text: normalized.en_question_text || '',
            question_text_tamil: normalized.ta_question_text || '',
            option_a: normalized.en_option_a || '',
            option_b: normalized.en_option_b || '',
            option_c: normalized.en_option_c || '',
            option_d: normalized.en_option_d || '',
            option_a_tamil: normalized.ta_option_a || '',
            option_b_tamil: normalized.ta_option_b || '',
            option_c_tamil: normalized.ta_option_c || '',
            option_d_tamil: normalized.ta_option_d || '',
            correct_option: normalized.answer_key || 'A',
            explanation: normalized.en_explanation || '',
            explanation_tamil: normalized.ta_explanation || '',
            group_tag: normalized.exam_tag?.replace('TNPSC_GROUP_', 'Group ') || selectedGroupTag?.replace('TNPSC_GROUP_', 'Group ') || 'Group 1',
            group_name: normalized.exam_tag || selectedGroupTag || 'TNPSC_GROUP_1',
            unit_tag: normalized.unit_code || 'UNIT_I',
            unit_name: normalized.subject_name || 'General Studies',
            macro_topic: normalized.macro_topic || 'General',
            macro_topic_name: normalized.macro_topic || 'General',
            micro_topic: normalized.micro_topic || 'General Concepts',
            micro_topic_name: normalized.micro_topic || 'General Concepts',
            exam_year: normalized.year || 2026,
            is_pyq: normalized.source_type === 'PYQ',
            difficulty_level: normalized.difficulty_level || 'MEDIUM',
            source_type: normalized.source_type || 'VINA',
            exam_tag: normalized.exam_tag || selectedGroupTag || 'TNPSC_GROUP_1',
          }
        })

      console.log('[CSV Import] Converted questions:', validQuestions.slice(0, 2))

      // Use target paper or create batch paper
      const targetPaper = selectedTargetPaperId || papers[0]?.id
      if (!targetPaper) {
        throw new Error('Please select or create a question paper to link these questions.')
      }

      await questionService.saveQuestionsToSupabase(targetPaper, validQuestions, false)

      toast.success(`Successfully imported ${validQuestions.length} verified questions into the database!`)
      setShowBulkCsvModal(false)
      setCsvFile(null)
      setCsvValidationResults(null)
      await loadData()
    } catch (err) {
      console.error('Import error:', err)
      toast.error('Failed to import questions: ' + err.message)
    } finally {
      setCsvImporting(false)
    }
  }

  // ── CSV Download Handlers ───────────────────────────────────────────────────
  function handleDownloadTaxonomyCsv(groupKey) {
    let list = GROUP4_MASTER_TAXONOMY
    let filename = 'Group4_Master_Taxonomy.csv'
    if (groupKey === 'TNPSC_GROUP_1') {
      list = GROUP1_MASTER_TAXONOMY
      filename = 'Group1_Master_Taxonomy.csv'
    } else if (groupKey === 'TNPSC_GROUP_2') {
      list = GROUP2_MASTER_TAXONOMY
      filename = 'Group2_Master_Taxonomy.csv'
    }

    const csvContent = generateMasterTaxonomyCsv(list)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${filename}`)
  }

  function handleDownloadTemplateCsv() {
    const csvContent = generate29ColumnTemplateCsv()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '29_Column_Question_Template.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded 29-Column CSV Template')
  }

  function handleExportQuestionsCsv() {
    if (searchFilteredQuestions.length === 0) {
      toast.error('No questions available to export.')
      return
    }

    const headers = [
      'question_id', 'content_hash', 'exam_tag', 'source_type', 'year',
      'subject_name', 'unit_code', 'macro_topic', 'micro_topic', 'sub_topic',
      'difficulty_level', 'question_type', 'cognitive_skill', 'ideal_time_seconds',
      'en_question_text', 'en_option_a', 'en_option_b', 'en_option_c', 'en_option_d', 'en_option_e',
      'ta_question_text', 'ta_option_a', 'ta_option_b', 'ta_option_c', 'ta_option_d', 'ta_option_e',
      'answer_key', 'en_explanation', 'ta_explanation'
    ]

    const escapeCell = (v) => `"${String(v || '').replace(/"/g, '""')}"`
    const rows = searchFilteredQuestions.map(q => headers.map(h => escapeCell(q[h])).join(','))
    const csv = [headers.join(','), ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedGroupTag}_Questions_Export.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${searchFilteredQuestions.length} questions to CSV`)
  }

  return (
    <div className="space-y-6">
      {/* ── 1. Header & Top Controls ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#635bff] to-[#8b5cf6] text-white flex items-center justify-center shadow-subtle">
              <Database className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-black text-body-text tracking-tight">
              Admin Question Bank &amp; Taxonomy Control
            </h1>
          </div>
          <p className="text-xs text-body-secondary mt-1 max-w-3xl">
            29-Column interactive spreadsheet with strict master taxonomy validation, SHA-256 deduplication gate, and live 200-question blueprint health monitor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowBulkCsvModal(true)}
            className="px-3.5 py-2 bg-tnpsc-brand hover:bg-[#4f46e5] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-subtle transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Upload CSV (Strict Validation)</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-subtle transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI / PDF Text Ingestion</span>
          </button>

          <button
            onClick={handleExportQuestionsCsv}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-surface-border text-body-text rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── 2. Top Three-Way Group Switcher Tabs ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-surface-border p-2 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-xl w-full sm:w-auto">
          {GROUP_CONFIGS.map(grp => {
            const isSelected = selectedGroupTag === grp.id
            return (
              <button
                key={grp.id}
                onClick={() => {
                  setSelectedGroupTag(grp.id)
                  setCurrentPage(1)
                }}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-xs font-black transition-all ${
                  isSelected
                    ? 'bg-white text-tnpsc-brand shadow-subtle'
                    : 'text-body-secondary hover:text-body-text'
                }`}
              >
                {grp.label}
              </button>
            )
          })}
        </div>

        {/* Sub-Filter Pills: All | VINA | PYQ */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-body-secondary uppercase tracking-wider mr-1">
            Source:
          </span>
          {[
            { id: 'all',  label: 'All Questions' },
            { id: 'vina', label: 'VINA Synthetic Only' },
            { id: 'pyq',  label: 'Official PYQs Only' },
          ].map(pill => (
            <button
              key={pill.id}
              onClick={() => {
                setSourceFilter(pill.id)
                setCurrentPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                sourceFilter === pill.id
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-body-secondary border-slate-200 hover:border-slate-300'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Inventory & Blueprint Health Monitor Bar ──────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-card border border-indigo-950/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-white/10 text-amber-300">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-black tracking-wide text-white">
                {selectedGroupTag.replace(/_/g, ' ')} — 200-Question Mock Test Blueprint Health Monitor
              </h3>
              <p className="text-[11px] text-slate-300">
                Verifies exact syllabus unit quotas and shows readiness for generating balanced, zero-repeat full mocks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Total Pool</span>
              <b className="text-base font-black text-white">{healthMonitor.totalQuestions} Qs</b>
            </div>
            <div className="bg-emerald-500/20 px-3.5 py-1.5 rounded-xl border border-emerald-400/30 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">Unique 200Q Mocks Ready</span>
              <b className="text-base font-black text-emerald-300">{healthMonitor.minFullMocksPossible} Full Mocks</b>
            </div>
          </div>
        </div>

        {/* Blueprint Unit Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
          {healthMonitor.unitBreakdown.map(item => (
            <div
              key={item.unit_code}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                item.isDeficit
                  ? 'bg-red-500/10 border-red-500/30 text-red-200'
                  : 'bg-white/5 border-white/10 text-slate-200'
              }`}
            >
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
                {item.unit_code}
              </span>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <b className={`text-sm font-black ${item.isDeficit ? 'text-red-400' : 'text-white'}`}>
                  {item.available}
                </b>
                <span className="text-[10px] text-slate-400">/ {item.quota} req</span>
              </div>
              <span className={`block text-[9px] font-semibold mt-0.5 ${item.isDeficit ? 'text-red-300' : 'text-emerald-400'}`}>
                {item.isDeficit ? `Deficit: -${item.quota - item.available}` : `Ready: ${item.mocksPossible}x`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Search & Controls Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-surface-border shadow-subtle">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search by question text, unit, macro or micro..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-surface-border rounded-xl outline-none focus:border-tnpsc-brand focus:ring-1 focus:ring-tnpsc-brand/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => handleDownloadTaxonomyCsv(selectedGroupTag)}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-indigo-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {selectedGroupTag.replace(/_/g, ' ')} Master Taxonomy CSV</span>
          </button>

          <button
            onClick={handleDownloadTemplateCsv}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download 29-Col Template</span>
          </button>
        </div>
      </div>

      {/* ── 5. The 29-Column Spreadsheet Grid ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-body-text uppercase tracking-wider">
              29-Column Master Spreadsheet Grid ({searchFilteredQuestions.length} Questions)
            </span>
            <span className="text-[11px] text-body-secondary font-medium">
              Double-click any cell to edit inline · Press Enter to save automatically
            </span>
          </div>

          <div className="text-xs text-body-secondary font-semibold">
            Page {currentPage} of {totalPages}
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 text-tnpsc-brand animate-spin mx-auto mb-3" />
            <p className="text-xs text-body-secondary font-medium">Loading 29-column question spreadsheet...</p>
          </div>
        ) : searchFilteredQuestions.length === 0 ? (
          <div className="p-16 text-center text-body-secondary text-xs">
            No questions found matching your filter criteria. Click "Bulk Upload CSV" to import questions.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[640px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-100 text-body-secondary uppercase font-bold text-[10px] border-b border-surface-border shadow-2xs">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-200 sticky left-0 z-30 bg-slate-100 min-w-[90px]"># / ID</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[70px]">Source</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[60px]">Year</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[90px]">Unit Code</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">Macro Topic</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[160px]">Micro Topic</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[60px]">Key</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[70px]">Diff</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[70px]">Ideal Sec</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[260px]">English Question Stem</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">En Option A</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">En Option B</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">En Option C</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">En Option D</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[120px]">En Option E</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[260px]">Tamil Question Stem</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">Ta Option A</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">Ta Option B</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">Ta Option C</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">Ta Option D</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[120px]">Ta Option E</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[220px]">English Explanation</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[220px]">Tamil Explanation</th>
                  <th className="py-2.5 px-3 text-center min-w-[80px]">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {paginatedQuestions.map((q, idx) => {
                  const isPyq = q.source_type === 'PYQ'
                  return (
                    <tr key={q.question_id || idx} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. ID (Sticky Left) */}
                      <td className="py-2 px-3 border-r border-slate-200 sticky left-0 z-10 bg-white font-mono font-bold text-[11px] text-slate-800">
                        {q.question_id}
                      </td>

                      {/* 2. Source Type */}
                      <td className="py-2 px-3 border-r border-slate-200">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          isPyq ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {q.source_type}
                        </span>
                      </td>

                      {/* 3. Year */}
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-700">
                        {q.year}
                      </td>

                      {/* 4. Unit Code (Dropdown Constraint) */}
                      <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-slate-800">
                        <select
                          value={q.unit_code}
                          onChange={e => handleCellSave(q, 'unit_code', e.target.value)}
                          className="bg-transparent border-0 text-[11px] font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-tnpsc-brand rounded"
                        >
                          {Array.from(new Set(activeMasterTaxonomy.map(m => m.unit_code))).map(uc => (
                            <option key={uc} value={uc}>{uc}</option>
                          ))}
                        </select>
                      </td>

                      {/* 5. Macro Topic */}
                      <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-800 truncate max-w-[160px]" title={q.macro_topic}>
                        {q.macro_topic}
                      </td>

                      {/* 6. Micro Topic */}
                      <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-800 truncate max-w-[180px]" title={q.micro_topic}>
                        {q.micro_topic}
                      </td>

                      {/* 7. Answer Key (Dropdown A/B/C/D) */}
                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                        <select
                          value={q.answer_key}
                          onChange={e => handleCellSave(q, 'answer_key', e.target.value)}
                          className="w-8 h-7 text-center rounded font-black text-xs bg-emerald-100 text-emerald-800 border-0 focus:ring-2 focus:ring-emerald-500"
                        >
                          {['A', 'B', 'C', 'D'].map(k => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                      </td>

                      {/* 8. Difficulty Level */}
                      <td className="py-2 px-3 border-r border-slate-200">
                        <select
                          value={q.difficulty_level}
                          onChange={e => handleCellSave(q, 'difficulty_level', e.target.value)}
                          className="bg-transparent border-0 text-[10px] font-bold text-slate-700 focus:bg-white rounded"
                        >
                          {['EASY', 'MEDIUM', 'HARD'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </td>

                      {/* 9. Ideal Time */}
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-bold text-slate-600">
                        {q.ideal_time_seconds}s
                      </td>

                      {/* 10. English Question Stem */}
                      <td className="py-2 px-3 border-r border-slate-200 max-w-xs truncate" title={q.en_question_text}>
                        {q.en_question_text}
                      </td>

                      {/* 11-14. Options A-D */}
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_a}>{q.en_option_a}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_b}>{q.en_option_b}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_c}>{q.en_option_c}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_d}>{q.en_option_d}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-400 font-italic text-[10px]">Answer not known</td>

                      {/* 15. Tamil Stem & Options */}
                      <td className="py-2 px-3 border-r border-slate-200 max-w-xs truncate font-tamil" title={q.ta_question_text}>
                        {q.ta_question_text || '—'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_a}>{q.ta_option_a || '—'}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_b}>{q.ta_option_b || '—'}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_c}>{q.ta_option_c || '—'}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_d}>{q.ta_option_d || '—'}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-400 font-tamil text-[10px]">விடை தெரியவில்லை</td>

                      {/* 16. Explanations */}
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[220px] truncate" title={q.en_explanation}>
                        {q.en_explanation || '—'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[220px] truncate font-tamil" title={q.ta_explanation}>
                        {q.ta_explanation || '—'}
                      </td>

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
            <span>of {searchFilteredQuestions.length} questions</span>
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
                  Bulk Upload CSV — Strict Foreign-Key &amp; Taxonomy Validation
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
                  id="bulk-csv-input"
                  accept=".csv,.txt"
                  onChange={handleCsvFileSelect}
                  className="hidden"
                />
                <label htmlFor="bulk-csv-input" className="cursor-pointer block space-y-2">
                  <Upload className="w-8 h-8 text-tnpsc-brand mx-auto" />
                  <span className="block text-xs font-bold text-body-text">
                    {csvFile ? csvFile.name : 'Click to select CSV file for validation'}
                  </span>
                  <span className="block text-[11px] text-body-secondary">
                    Supports 29-column schema with unit_code, macro_topic, micro_topic, and answer_key
                  </span>
                </label>
              </div>

              {csvParsing && (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 text-tnpsc-brand animate-spin mx-auto mb-2" />
                  <p className="text-xs text-body-secondary font-medium">Validating rows against locked master taxonomy...</p>
                </div>
              )}

              {/* Validation Summary Card */}
              {csvValidationResults && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Rows</span>
                      <b className="text-lg font-black text-slate-800">{csvValidationResults.totalRows}</b>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Valid Rows</span>
                      <b className="text-lg font-black text-emerald-700">{csvValidationResults.validCount}</b>
                    </div>
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-red-700 block">Errors / Rejections</span>
                      <b className="text-lg font-black text-red-700">{csvValidationResults.errorCount}</b>
                    </div>
                  </div>

                  {/* Errors Breakdown */}
                  {csvValidationResults.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                      <h4 className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span>Taxonomy Validation Violations Detected:</span>
                      </h4>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 text-xs text-red-800 pr-1">
                        {csvValidationResults.errors.map((err, i) => (
                          <div key={i} className="bg-white/80 p-2 rounded border border-red-200">
                            <b>Row {err.rowNumber}:</b> {err.errors.join('; ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-surface-border bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowBulkCsvModal(false)
                  setCsvValidationResults(null)
                  setCsvFile(null)
                }}
                className="px-4 py-2 bg-white border border-surface-border rounded-xl text-xs font-bold text-slate-700"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmImportValidRows}
                disabled={!csvValidationResults || csvValidationResults.validCount === 0 || csvImporting}
                className="px-5 py-2.5 bg-tnpsc-brand hover:bg-[#4f46e5] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-subtle disabled:opacity-40"
              >
                {csvImporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing to Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Import {csvValidationResults?.validCount || 0} Valid Rows</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Question Detail Modal ────────────────────────────────────────── */}
      {viewingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6 shadow-2xl border border-surface-border space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-base font-black text-body-text">
                Question Details — {viewingQuestion.question_id}
              </h3>
              <button
                onClick={() => setViewingQuestion(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  {viewingQuestion.exam_tag}
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {viewingQuestion.source_type} ({viewingQuestion.year})
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-purple-50 text-purple-800 border border-purple-200">
                  {viewingQuestion.unit_code}
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Key: {viewingQuestion.answer_key}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <b>English Question Stem:</b>
                <p className="text-body-text whitespace-pre-wrap">{viewingQuestion.en_question_text}</p>
              </div>

              {viewingQuestion.ta_question_text && (
                <div className="p-3 bg-slate-50 rounded-xl space-y-2 font-tamil">
                  <b>Tamil Question Stem:</b>
                  <p className="text-body-text whitespace-pre-wrap">{viewingQuestion.ta_question_text}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 border rounded-lg">A: {viewingQuestion.en_option_a}</div>
                <div className="p-2 border rounded-lg">B: {viewingQuestion.en_option_b}</div>
                <div className="p-2 border rounded-lg">C: {viewingQuestion.en_option_c}</div>
                <div className="p-2 border rounded-lg">D: {viewingQuestion.en_option_d}</div>
              </div>

              {viewingQuestion.en_explanation && (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <b className="text-blue-900 block mb-1">Explanation:</b>
                  <p className="text-body-text leading-relaxed whitespace-pre-wrap">{viewingQuestion.en_explanation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 8. AI/Text PDF Ingestion Modal ──────────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-surface-border space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-base font-black text-body-text">
                Import Questions from PDF / Vision Pipeline
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 border-b border-surface-border pb-2">
              <button
                onClick={() => setUploadTab('ai')}
                className={`px-4 py-2 text-xs font-bold rounded-lg ${uploadTab === 'ai' ? 'bg-tnpsc-brand text-white' : 'text-slate-600'}`}
              >
                AI Vision Ingestion
              </button>
              <button
                onClick={() => setUploadTab('text')}
                className={`px-4 py-2 text-xs font-bold rounded-lg ${uploadTab === 'text' ? 'bg-tnpsc-brand text-white' : 'text-slate-600'}`}
              >
                Direct Text Extraction
              </button>
            </div>

            {uploadTab === 'ai' ? (
              <AiPdfTab
                onQuestionsExtracted={async (qs) => {
                  toast.success(`Extracted ${qs.length} questions! Refreshing spreadsheet...`)
                  setShowUploadModal(false)
                  await loadData()
                }}
              />
            ) : (
              <TextPdfTab
                onQuestionsExtracted={async (qs) => {
                  toast.success(`Extracted ${qs.length} questions! Refreshing spreadsheet...`)
                  setShowUploadModal(false)
                  await loadData()
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
