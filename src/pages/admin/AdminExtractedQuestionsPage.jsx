import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  HelpCircle, FileText, Sparkles, Filter, Search, Layers,
  RefreshCw, Download, Plus, CheckCircle2, AlertCircle, ChevronDown,
  ChevronRight, Eye, Edit2, Trash2, BookOpen, ExternalLink,
  Loader2, X, Check, BookMarked, Upload, Database, Tag, ShieldCheck,
  Table, AlertTriangle, ArrowRight, Save
} from 'lucide-react'
import Papa from 'papaparse'
import { questionService } from '../../services/questionService'
import { recallGridService } from '../../services/recallGridService'
import { detectFromFileName } from '../../lib/pdfNameDetect'
import { paperService, EXAM_NAME_BY_TAG as EXAM_NAME_BY_GROUP } from '../../services/paperService'
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
  mapToApprovedCatalog,
} from '../../services/masterTaxonomyService'
import AiPdfTab from '../../components/admin/AiPdfTab'
import { TextPdfTab } from '../../components/admin/TextPdfTab'

const GROUP_CONFIGS = [
  { id: 'TNPSC_GROUP_1', label: 'TNPSC Group 1', tag: 'Group 1', blueprintKey: 'TNPSC_GROUP_1', totalMocksQuota: 200 },
  { id: 'TNPSC_GROUP_2', label: 'TNPSC Group 2 & 2A', tag: 'Group 2', blueprintKey: 'TNPSC_GROUP_2_TAMIL', totalMocksQuota: 200 },
  { id: 'TNPSC_GROUP_4', label: 'TNPSC Group 4', tag: 'Group 4', blueprintKey: 'TNPSC_GROUP_4', totalMocksQuota: 200 },
]

// Column sort/filter configuration for the spreadsheet grid
const SORT_CONFIG = {
  source: { type: 'text', get: q => q.source_type || '' },
  year: { type: 'year', get: q => Number(q.year) || 0 },
  unit: { type: 'text', get: q => q.unit_code || '' },
  macro: { type: 'text', get: q => q.macro_topic || '' },
  micro: { type: 'text', get: q => q.micro_topic || '' },
  key: { type: 'text', get: q => q.answer_key || '' },
  difficulty: { type: 'text', get: q => q.difficulty_level || '' },
  ideal: { type: 'number', get: q => Number(q.ideal_time_seconds) || 0 },
  text: { type: 'text', get: q => q.en_question_text || '' },
}

const SORT_OPTIONS = {
  number: [['asc', 'Low to High'], ['desc', 'High to Low']],
  text: [['asc', 'A to Z'], ['desc', 'Z to A']],
  year: [['asc', 'Oldest to Newest'], ['desc', 'Newest to Oldest']],
}

const EMPTY_COLUMN_FILTERS = {
  source: 'all',
  years: [],
  yearFrom: '',
  yearTo: '',
  unit: [],
  macro: [],
  micro: [],
  key: [],
  difficulty: [],
  text: '',
}

const RESET_FIELDS_BY_COLUMN = {
  source: { source: 'all' },
  year: { years: [], yearFrom: '', yearTo: '' },
  unit: { unit: [] },
  macro: { macro: [] },
  micro: { micro: [] },
  key: { key: [] },
  difficulty: { difficulty: [] },
  text: { text: '' },
  ideal: {},
}

const rowKeyOf = (q) => q.id || q.question_id

// Plain-language result of filing questions into a Previous Year paper
function describePyqOutcome(title, count, outcome) {
  const added = `${count} question${count === 1 ? '' : 's'} added to "${title}".`
  if (outcome.published) return `${added} It is live for students under Previous Year Papers.`
  if (outcome.demoted) {
    return `${added} ${outcome.missing} of its ${outcome.total} questions have no answer key, so it was moved back to draft until they are filled in.`
  }
  if (outcome.missing > 0) {
    return `${added} It stays unpublished: ${outcome.missing} of ${outcome.total} questions have no answer key yet.`
  }
  return added
}

// A paper needs only a name. Its exam group comes from the group tab being viewed,
// and its year from the name (falling back to this year).

function paperPayloadFromName(name, examName) {
  const yearInName = String(name).match(/\b(20\d{2})\b/)
  return {
    title: name,
    exam_name: examName,
    year: yearInName ? Number(yearInName[1]) : new Date().getFullYear(),
    subject: 'General Studies',
    status: 'draft',
  }
}

// The grid opens on a small page of rows so it stays fast however many questions are
// stored; a search or filter queries the whole database.
const DEFAULT_ROW_LIMIT = 400
const SEARCH_RESULT_LIMIT = 5000

// The canonical 29 columns, in order. filterKey links a column to its sort and
// filter menu. readOnly columns cannot be edited inline (the id and hash are
// generated, and option E is the fixed "Answer not known" choice).
const GRID_COLUMNS = [
  { key: 'question_id', label: '1. question_id', width: 'min-w-[130px]', readOnly: true, mono: true, sticky: true },
  { key: 'content_hash', label: '2. content_hash', width: 'min-w-[110px]', readOnly: true },
  { key: 'exam_tag', label: '3. exam_tag', width: 'min-w-[130px]', readOnly: true },
  { key: 'source_type', label: '4. source_type', width: 'min-w-[100px]', type: 'select', options: ['VINA', 'PYQ'], filterKey: 'source' },
  { key: 'year', label: '5. year', width: 'min-w-[70px]', type: 'number', filterKey: 'year' },
  { key: 'subject_name', label: '6. subject_name', width: 'min-w-[140px]' },
  { key: 'unit_code', label: '7. unit_code', width: 'min-w-[110px]', type: 'select', filterKey: 'unit' },
  { key: 'macro_topic', label: '8. macro_topic', width: 'min-w-[160px]', filterKey: 'macro' },
  { key: 'micro_topic', label: '9. micro_topic', width: 'min-w-[180px]', filterKey: 'micro' },
  { key: 'sub_topic', label: '10. sub_topic', width: 'min-w-[160px]' },
  { key: 'difficulty_level', label: '11. difficulty_level', width: 'min-w-[120px]', type: 'select', options: ['EASY', 'MEDIUM', 'HARD'], filterKey: 'difficulty' },
  { key: 'question_type', label: '12. question_type', width: 'min-w-[140px]' },
  { key: 'cognitive_skill', label: '13. cognitive_skill', width: 'min-w-[140px]' },
  { key: 'ideal_time_seconds', label: '14. ideal_time_seconds', width: 'min-w-[130px]', type: 'number', filterKey: 'ideal' },
  { key: 'en_question_text', label: '15. en_question_text', lang: 'en', width: 'min-w-[280px]', long: true, maxWidth: 'max-w-xs', filterKey: 'text' },
  { key: 'en_option_a', label: '16. en_option_a', lang: 'en', width: 'min-w-[140px]', maxWidth: 'max-w-[140px]' },
  { key: 'en_option_b', label: '17. en_option_b', lang: 'en', width: 'min-w-[140px]', maxWidth: 'max-w-[140px]' },
  { key: 'en_option_c', label: '18. en_option_c', lang: 'en', width: 'min-w-[140px]', maxWidth: 'max-w-[140px]' },
  { key: 'en_option_d', label: '19. en_option_d', lang: 'en', width: 'min-w-[140px]', maxWidth: 'max-w-[140px]' },
  { key: 'en_option_e', label: '20. en_option_e', lang: 'en', width: 'min-w-[120px]', readOnly: true },
  { key: 'ta_question_text', label: '21. ta_question_text', lang: 'ta', width: 'min-w-[280px]', long: true, maxWidth: 'max-w-xs' },
  { key: 'ta_option_a', label: '22. ta_option_a', lang: 'ta', width: 'min-w-[140px]', maxWidth: 'max-w-[140px]' },
  { key: 'ta_option_b', label: '23. ta_option_b', lang: 'ta', width: 'min-w-[140px]', maxWidth: 'max-w-[140px]' },
  { key: 'ta_option_c', label: '24. ta_option_c', lang: 'ta', width: 'min-w-[140px]', maxWidth: 'max-w-[140px]' },
  { key: 'ta_option_d', label: '25. ta_option_d', lang: 'ta', width: 'min-w-[140px]', maxWidth: 'max-w-[140px]' },
  { key: 'ta_option_e', label: '26. ta_option_e', lang: 'ta', width: 'min-w-[120px]', readOnly: true },
  { key: 'answer_key', label: '27. answer_key', width: 'min-w-[100px]', type: 'select', options: ['A', 'B', 'C', 'D'], filterKey: 'key' },
  { key: 'en_explanation', label: '28. en_explanation', lang: 'en', width: 'min-w-[220px]', long: true, maxWidth: 'max-w-[220px]' },
  { key: 'ta_explanation', label: '29. ta_explanation', lang: 'ta', width: 'min-w-[220px]', long: true, maxWidth: 'max-w-[220px]' },
]

// Maps one edited grid cell to the database columns to save (db) and to the
// values to show straight away (local).
function buildCellUpdates(field, value) {
  const db = {}
  const local = { [field]: value }
  switch (field) {
    case 'en_question_text': db.question_text = value; break
    case 'ta_question_text': db.question_text_tamil = value; break
    case 'en_option_a': db.option_a = value; break
    case 'en_option_b': db.option_b = value; break
    case 'en_option_c': db.option_c = value; break
    case 'en_option_d': db.option_d = value; break
    case 'ta_option_a': db.option_a_tamil = value; break
    case 'ta_option_b': db.option_b_tamil = value; break
    case 'ta_option_c': db.option_c_tamil = value; break
    case 'ta_option_d': db.option_d_tamil = value; break
    case 'answer_key': db.correct_option = value; break
    case 'en_explanation': db.explanation = value; break
    case 'ta_explanation': db.explanation_tamil = value; break
    case 'unit_code': db.unit_code = value; db.unit_tag = value; break
    case 'macro_topic': db.macro_topic = value; db.macro_topic_name = value; break
    case 'micro_topic': db.micro_topic = value; db.micro_topic_name = value; break
    case 'difficulty_level': db.difficulty_level = value; break
    case 'source_type': db.source_type = value; db.is_pyq = value === 'PYQ'; break
    case 'year': db.exam_year = String(value); db.year = value; break
    default: db[field] = value // subject_name, sub_topic, question_type, cognitive_skill, ideal_time_seconds
  }
  return { db, local }
}

// mode "bank": the exam question bank, split by exam group (Group 1 / 2 / 4).
// mode "recall": the Quick Recall pool, one common pool for every group.
export function AdminExtractedQuestionsPage({ mode = 'bank' } = {}) {
  const { toast } = useApp()
  const isRecall = mode === 'recall'

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState([])
  const [papers, setPapers] = useState([])

  // Top Three-Way Group Switcher: 'TNPSC_GROUP_1' | 'TNPSC_GROUP_2' | 'TNPSC_GROUP_4'
  const [selectedGroupTag, setSelectedGroupTag] = useState('TNPSC_GROUP_1')

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

  // Grid selection, column sort/filter, and bulk delete state
  const [selectedKeys, setSelectedKeys] = useState(() => new Set())
  const [columnFilters, setColumnFilters] = useState(EMPTY_COLUMN_FILTERS)
  const [sortState, setSortState] = useState({ key: null, dir: 'asc' })
  const [openColumnMenu, setOpenColumnMenu] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Database-side inventory for the selected group, and filter-menu options
  const [groupInventory, setGroupInventory] = useState({ total: 0, byUnit: {} })
  const [facets, setFacets] = useState({ unit: [], macro: [], micro: [], years: [] })

  // Papers panel (publish/unpublish lives inside this tab)
  const [showPapersPanel, setShowPapersPanel] = useState(false)
  const [togglingPaperId, setTogglingPaperId] = useState(null)
  const [deletingPaperId, setDeletingPaperId] = useState(null)
  // { mode: 'create' | 'rename', name, paper? } while the name dialog is open
  const [paperDialog, setPaperDialog] = useState(null)
  const [savingPaper, setSavingPaper] = useState(false)
  // PDF ingestion: where the extracted questions go. Choosing the PDF fills these in
  // from its file name, and the admin confirms them before saving.
  const [ingestGroup, setIngestGroup] = useState('TNPSC_GROUP_1')
  // 'PYQ' (official paper, filed by group and year) or 'VINA' (practice questions)
  const [ingestSource, setIngestSource] = useState('')
  const [ingestYear, setIngestYear] = useState('')
  const [ingestName, setIngestName] = useState('')
  const [ingestNote, setIngestNote] = useState('')
  const ingestTargetRef = useRef(null)

  // The dashboard's "+ Paper" shortcut opens this page with the name dialog ready
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    if (!isRecall && searchParams.get('newPaper')) {
      setShowPapersPanel(true)
      setPaperDialog({ mode: 'create', name: '' })
      setSearchParams({}, { replace: true })
    }
  }, [])

  // Guards against an older, slower request overwriting a newer one
  const loadRequestRef = useRef(0)
  // 'latest' = newest rows only, 'search' = database-wide query
  const [loadInfo, setLoadInfo] = useState({ mode: 'latest', capped: false })

  // Selection belongs to one group; clear it when the group tab changes
  useEffect(() => {
    setSelectedKeys(new Set())
  }, [selectedGroupTag])

  // Return to the first page whenever the visible rows change
  useEffect(() => {
    setCurrentPage(1)
  }, [columnFilters, sortState, searchQuery, selectedGroupTag])

  // By default the grid shows only the newest rows, so a fresh upload can be
  // checked without lag. A search or any column filter asks the database for
  // every matching row instead.
  async function loadData() {
    const requestId = ++loadRequestRef.current
    setLoading(true)
    try {
      const queryActive = hasActiveColumnFilters || Boolean(searchQuery.trim())
      const limit = queryActive ? SEARCH_RESULT_LIMIT : DEFAULT_ROW_LIMIT
      const res = isRecall
        ? await recallGridService.fetchGrid({ search: searchQuery, filters: columnFilters, limit })
        : await questionService.getAllExtractedQuestionsForAdmin({
          examTag: selectedGroupTag,
          search: searchQuery,
          filters: columnFilters,
          limit,
        })
      if (requestId !== loadRequestRef.current) return

      const rawList = res.questions || []
      // Keep the database id so inline edits and deletes can target the row
      const normalizedList = rawList.map((q, idx) => ({
        ...normalizeTo29Columns(q, idx + 1),
        id: q.id,
        paper_id: q.paper_id,
      }))
      setQuestions(normalizedList)
      setPapers(res.papers || [])
      setLoadInfo({
        mode: queryActive ? 'search' : 'latest',
        capped: queryActive && normalizedList.length >= SEARCH_RESULT_LIMIT,
      })
    } catch (err) {
      console.error('[AdminExtractedQuestionsPage] Load error:', err)
      toast.error('Failed to load questions: ' + err.message)
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false)
    }
  }

  // Group totals and filter-menu options come from the whole database
  async function refreshGroupMeta() {
    const unitCodes = Array.from(new Set(activeMasterTaxonomy.map(m => m.unit_code)))
    try {
      const [inventory, facetData] = await Promise.all(isRecall
        ? [recallGridService.getInventory(), recallGridService.getFacets()]
        : [
          questionService.getGroupInventory(selectedGroupTag, unitCodes),
          questionService.getGridFacets(selectedGroupTag),
        ])
      setGroupInventory(inventory)
      setFacets(facetData)
    } catch (err) {
      console.warn('[AdminExtractedQuestionsPage] Could not load group totals:', err)
    }
  }

  // Reload whenever the group, search text or a column filter changes.
  // Typing is debounced so each keystroke does not hit the database.
  useEffect(() => {
    const typing = Boolean(searchQuery.trim() || columnFilters.text.trim())
    const timer = setTimeout(() => { loadData() }, typing ? 350 : 0)
    return () => clearTimeout(timer)
  }, [selectedGroupTag, searchQuery, columnFilters])

  useEffect(() => {
    refreshGroupMeta()
  }, [selectedGroupTag])

  // Active Master Taxonomy for the currently selected group
  const activeMasterTaxonomy = useMemo(() => {
    // The Quick Recall pool is shared, so every group's units are valid there
    if (isRecall) return [...GROUP1_MASTER_TAXONOMY, ...GROUP2_MASTER_TAXONOMY, ...GROUP4_MASTER_TAXONOMY]
    if (selectedGroupTag === 'TNPSC_GROUP_1') return GROUP1_MASTER_TAXONOMY
    if (selectedGroupTag === 'TNPSC_GROUP_2') return GROUP2_MASTER_TAXONOMY
    return GROUP4_MASTER_TAXONOMY
  }, [selectedGroupTag])

  // Unit boxes for the selected group, taken from that group's taxonomy
  const unitCodesForGroup = useMemo(
    () => Array.from(new Set(activeMasterTaxonomy.map(m => m.unit_code))),
    [activeMasterTaxonomy]
  )

  // Questions belonging to the selected exam group (Quick Recall has no groups)
  const groupFilteredQuestions = useMemo(() => {
    if (isRecall) return questions
    return questions.filter(q => normalizeExamTag(q.exam_tag || q.group_tag) === selectedGroupTag)
  }, [questions, selectedGroupTag, isRecall])

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

  // Distinct values offered by the column filter menus (current group only)
  // Menu options come from the whole group in the database, plus anything
  // already on screen (so a just-edited value is offered straight away).
  const facetOptions = useMemo(() => {
    const merged = (fromDatabase, getter) => Array.from(new Set([
      ...fromDatabase,
      ...groupFilteredQuestions.map(getter).filter(Boolean),
    ])).sort()
    return {
      years: merged(facets.years, q => String(q.year)).sort((a, b) => Number(a) - Number(b)),
      unit: merged(facets.unit, q => q.unit_code),
      macro: merged(facets.macro, q => q.macro_topic),
      micro: merged(facets.micro, q => q.micro_topic),
      key: ['A', 'B', 'C', 'D', 'E'],
      difficulty: ['EASY', 'MEDIUM', 'HARD'],
    }
  }, [groupFilteredQuestions, facets])

  // Column filters (AND across columns) followed by the active column sort
  const tableQuestions = useMemo(() => {
    const f = columnFilters
    const text = f.text.trim().toLowerCase()
    let rows = searchFilteredQuestions.filter(q => {
      if (f.source !== 'all' && q.source_type !== f.source) return false
      if (f.years.length && !f.years.includes(String(q.year))) return false
      if (f.yearFrom && Number(q.year) < Number(f.yearFrom)) return false
      if (f.yearTo && Number(q.year) > Number(f.yearTo)) return false
      if (f.unit.length && !f.unit.includes(q.unit_code)) return false
      if (f.macro.length && !f.macro.includes(q.macro_topic)) return false
      if (f.micro.length && !f.micro.includes(q.micro_topic)) return false
      if (f.key.length && !f.key.includes(q.answer_key)) return false
      if (f.difficulty.length && !f.difficulty.includes(q.difficulty_level)) return false
      if (text) {
        const haystack = `${q.en_question_text || ''} ${q.ta_question_text || ''}`.toLowerCase()
        if (!haystack.includes(text)) return false
      }
      return true
    })

    if (sortState.key && SORT_CONFIG[sortState.key]) {
      const { get } = SORT_CONFIG[sortState.key]
      const sign = sortState.dir === 'desc' ? -1 : 1
      rows = [...rows].sort((a, b) => {
        const va = get(a)
        const vb = get(b)
        const cmp = typeof va === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb), undefined, { numeric: true })
        return cmp * sign
      })
    }
    return rows
  }, [searchFilteredQuestions, columnFilters, sortState])

  const hasActiveColumnFilters = useMemo(() => {
    const f = columnFilters
    return f.source !== 'all' || f.years.length > 0 || Boolean(f.yearFrom || f.yearTo) ||
      f.unit.length > 0 || f.macro.length > 0 || f.micro.length > 0 ||
      f.key.length > 0 || f.difficulty.length > 0 || Boolean(f.text.trim())
  }, [columnFilters])

  // Paginated questions for grid
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return tableQuestions.slice(start, start + pageSize)
  }, [tableQuestions, currentPage, pageSize])

  const totalPages = Math.ceil(tableQuestions.length / pageSize) || 1

  // Selection is stored by key so it survives pagination, filters and sorting
  const pageKeys = paginatedQuestions.map(rowKeyOf)
  const allPageSelected = pageKeys.length > 0 && pageKeys.every(k => selectedKeys.has(k))
  const selectedQuestions = useMemo(
    () => questions.filter(q => selectedKeys.has(rowKeyOf(q))),
    [questions, selectedKeys]
  )

  function togglePageSelection() {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      if (allPageSelected) pageKeys.forEach(k => next.delete(k))
      else pageKeys.forEach(k => next.add(k))
      return next
    })
  }

  function toggleRowSelection(key) {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function selectAllMatching() {
    setSelectedKeys(new Set(tableQuestions.map(rowKeyOf)))
  }

  function toggleFilterValue(field, value) {
    setColumnFilters(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }))
  }

  function isColumnFiltered(colKey) {
    const f = columnFilters
    if (colKey === 'source') return f.source !== 'all'
    if (colKey === 'year') return f.years.length > 0 || Boolean(f.yearFrom || f.yearTo)
    if (colKey === 'text') return Boolean(f.text)
    if (colKey === 'ideal') return false
    return f[colKey].length > 0
  }

  function clearColumn(colKey) {
    setColumnFilters(prev => ({ ...prev, ...RESET_FIELDS_BY_COLUMN[colKey] }))
  }

  function clearAllFilters() {
    setColumnFilters(EMPTY_COLUMN_FILTERS)
    setSortState({ key: null, dir: 'asc' })
  }

  // Header cell with a filter button that opens the sort and filter menu
  function renderSortFilterHeader(colKey, label, className = '') {
    const config = SORT_CONFIG[colKey]
    const isOpen = openColumnMenu === colKey
    const isSorted = sortState.key === colKey
    const isFiltered = isColumnFiltered(colKey)
    const sortOptions = SORT_OPTIONS[config.type]

    return (
      <th key={colKey} className={`py-2.5 px-3 border-r ${className}`}>
        <div className="relative flex items-center gap-1 whitespace-nowrap">
          <span>{label}</span>
          <button
            type="button"
            onClick={() => setOpenColumnMenu(isOpen ? null : colKey)}
            title="Sort and filter"
            className={`p-0.5 rounded hover:bg-black/5 transition-colors ${
              isFiltered || isSorted ? 'text-tnpsc-brand' : 'text-slate-400'
            }`}
          >
            <Filter className="w-3 h-3" />
          </button>

          {isOpen && (
            <div
              onClick={e => e.stopPropagation()}
              className="absolute top-full left-0 mt-1 z-40 w-60 max-h-80 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg p-2.5 space-y-2.5 normal-case tracking-normal text-[11px] font-medium text-slate-700 text-left"
            >
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase text-slate-500">Sort</div>
                <div className="grid grid-cols-2 gap-1">
                  {sortOptions.map(([dir, text]) => {
                    const active = isSorted && sortState.dir === dir
                    return (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => setSortState({ key: colKey, dir })}
                        className={`px-2 py-1 rounded border text-[11px] font-bold ${
                          active ? 'bg-tnpsc-brand text-white border-tnpsc-brand' : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {text}
                      </button>
                    )
                  })}
                </div>
              </div>

              {colKey !== 'ideal' && (
                <div className="space-y-1 border-t border-slate-100 pt-2">
                  <div className="text-[10px] font-black uppercase text-slate-500">Filter</div>

                  {colKey === 'source' && (
                    <div className="flex flex-col gap-1">
                      {[['all', 'All sources'], ['PYQ', 'PYQ'], ['VINA', 'VINA Synthetic']].map(([value, text]) => (
                        <label key={value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="filter-source"
                            checked={columnFilters.source === value}
                            onChange={() => setColumnFilters(prev => ({ ...prev, source: value }))}
                          />
                          {text}
                        </label>
                      ))}
                    </div>
                  )}

                  {colKey === 'year' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto">
                        {facetOptions.years.map(y => (
                          <label key={y} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={columnFilters.years.includes(y)}
                              onChange={() => toggleFilterValue('years', y)}
                            />
                            {y}
                          </label>
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="From"
                          value={columnFilters.yearFrom}
                          onChange={e => setColumnFilters(prev => ({ ...prev, yearFrom: e.target.value }))}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded text-[11px]"
                        />
                        <span>–</span>
                        <input
                          type="number"
                          placeholder="To"
                          value={columnFilters.yearTo}
                          onChange={e => setColumnFilters(prev => ({ ...prev, yearTo: e.target.value }))}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded text-[11px]"
                        />
                      </div>
                    </div>
                  )}

                  {(colKey === 'unit' || colKey === 'macro' || colKey === 'micro' || colKey === 'key' || colKey === 'difficulty') && (
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {facetOptions[colKey].map(value => (
                        <label key={value} className="flex items-start gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={columnFilters[colKey].includes(value)}
                            onChange={() => toggleFilterValue(colKey, value)}
                          />
                          <span className="break-words">{value}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {colKey === 'text' && (
                    <input
                      type="text"
                      placeholder="Search question text"
                      value={columnFilters.text}
                      onChange={e => setColumnFilters(prev => ({ ...prev, text: e.target.value }))}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] font-normal normal-case"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={() => clearColumn(colKey)}
                  disabled={!isFiltered && !isSorted}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 disabled:opacity-40"
                >
                  Clear column
                </button>
                <button
                  type="button"
                  onClick={() => setOpenColumnMenu(null)}
                  className="text-[11px] font-bold text-tnpsc-brand"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </th>
    )
  }

  async function handleBulkDelete() {
    const items = selectedQuestions
      .filter(q => q.id)
      .map(q => ({ id: q.id, paper_id: q.paper_id }))
    const skipped = selectedQuestions.length - items.length
    if (items.length === 0) {
      toast.error('The selected questions have no database id, so they cannot be deleted.')
      return
    }

    setBulkDeleting(true)
    try {
      const removed = isRecall
        ? await recallGridService.deleteBulk(items)
        : await questionService.deleteQuestionsBulk(items)
      toast.success(`Deleted ${removed} question(s)${skipped ? `; ${skipped} skipped` : ''}.`)
      setSelectedKeys(new Set())
      setShowDeleteConfirm(false)
      await loadData()
      await refreshGroupMeta()
    } catch (err) {
      console.error('Bulk delete error:', err)
      toast.error('Failed to delete questions: ' + err.message)
    } finally {
      setBulkDeleting(false)
    }
  }

  // ── Inventory & Blueprint Health Monitor Calculations ───────────────────────
  // Counts are calculated from the questions currently loaded in the grid
  const healthMonitor = useMemo(() => {
    const blueprintKey = GROUP_CONFIGS.find(g => g.id === selectedGroupTag)?.blueprintKey
    const blueprint = OFFICIAL_200Q_BLUEPRINTS[blueprintKey] || []

    // Count questions by unit_code from the loaded grid questions
    const unitCounts = {}
    groupFilteredQuestions.forEach(q => {
      const unitCode = q.unit_code || 'Unknown'
      unitCounts[unitCode] = (unitCounts[unitCode] || 0) + 1
    })

    let minFullMocksPossible = blueprint.length ? 9999 : 0
    blueprint.forEach(b => {
      const mocksPossible = Math.floor((unitCounts[b.unit_code] || 0) / (b.quota || 1))
      if (mocksPossible < minFullMocksPossible) minFullMocksPossible = mocksPossible
    })

    return {
      totalQuestions: groupFilteredQuestions.length,
      minFullMocksPossible,
      unitBreakdown: unitCodesForGroup.map(code => ({
        unit_code: code,
        available: unitCounts[code] || 0,
      })),
    }
  }, [groupFilteredQuestions, unitCodesForGroup, selectedGroupTag])

  // ── Inline Cell Editing ─────────────────────────────────────────────────────
  // Columns shown for the current language view
  const visibleColumns = GRID_COLUMNS

  // Official (PYQ) rows are filed by group and year automatically; only other rows need a paper
  const csvPyqCount = (csvValidationResults?.rows || []).filter(r => r.isValid && r.data.source_type === 'PYQ').length
  const csvNeedsPaper = !csvValidationResults
    || csvValidationResults.rows.some(r => r.isValid && r.data.source_type !== 'PYQ')

  function headerClassFor(col) {
    const tone = col.lang === 'en'
      ? 'border-blue-200 bg-blue-50/80 text-blue-950 font-bold'
      : col.lang === 'ta'
        ? 'border-emerald-200 bg-emerald-50/80 text-emerald-950 font-bold font-tamil'
        : 'border-slate-200'
    return `${tone} ${col.width || ''}`
  }

  // SHA-256 duplicate check against official PYQ questions in the right table
  function hasPyqDuplicate(hash, excludeId) {
    return isRecall
      ? recallGridService.hasPyqDuplicate(hash, excludeId)
      : questionService.hasPyqDuplicate(hash, excludeId)
  }

  // Double-click a cell to edit it. Read-only columns (the id, the hash and the
  // fixed "Answer not known" option) never enter edit mode.
  function startCellEdit(q, col) {
    if (col.readOnly) return
    setEditingCell({ rowKey: rowKeyOf(q), field: col.key, value: String(q[col.key] ?? '') })
  }

  async function handleCellSave(q, field, rawValue) {
    const col = GRID_COLUMNS.find(c => c.key === field)
    let value = typeof rawValue === 'string' ? rawValue.trim() : rawValue

    // Validate before touching the database
    if (col?.type === 'number') {
      const parsed = Number.parseInt(value, 10)
      if (!Number.isFinite(parsed) || parsed <= 0) {
        toast.error(`${col.label} must be a positive whole number.`)
        return
      }
      value = parsed
    }
    if (col?.options && !col.options.includes(value)) {
      toast.error(`${col.label} must be one of: ${col.options.join(', ')}.`)
      return
    }
    if (field === 'unit_code' && !unitCodesForGroup.includes(value)) {
      toast.error(`unit_code must be one of: ${unitCodesForGroup.join(', ')}.`)
      return
    }
    if (field === 'question_type' || field === 'cognitive_skill') value = String(value).toUpperCase()

    if (String(q[field] ?? '') === String(value)) {
      setEditingCell(null)
      return
    }
    if (!q.id) {
      toast.error('This row has no database id, so it cannot be edited.')
      setEditingCell(null)
      return
    }

    setCellSaving(true)
    try {
      const { db, local } = buildCellUpdates(field, value)

      // Editing the question text re-computes the SHA-256 hash, and a VINA
      // question may not duplicate an official PYQ question.
      if (field === 'en_question_text' || field === 'ta_question_text') {
        const en = field === 'en_question_text' ? value : q.en_question_text
        const ta = field === 'ta_question_text' ? value : q.ta_question_text
        const hash = await computeQuestionContentHash(en, ta)
        if (q.source_type === 'VINA' && await hasPyqDuplicate(hash, q.id)) {
          toast.error('Duplicate blocked: this text matches an official PYQ question.')
          return
        }
        db.content_hash = hash
        local.content_hash = hash
      }
      if (field === 'source_type' && value === 'VINA' && await hasPyqDuplicate(q.content_hash, q.id)) {
        toast.error('Duplicate blocked: this question matches an official PYQ question.')
        return
      }

      if (isRecall) await recallGridService.updateFields(q.id, db)
      else await questionService.updateQuestionFields(q.id, db)

      setQuestions(prev => prev.map(item => (
        rowKeyOf(item) === rowKeyOf(q) ? { ...item, ...local } : item
      )))
      toast.success(`Saved ${col?.label || field}`)

      if (['unit_code', 'macro_topic', 'micro_topic', 'year', 'source_type'].includes(field)) {
        await refreshGroupMeta()
      }
    } catch (err) {
      console.error('Cell save error:', err)
      toast.error('Failed to save update: ' + err.message)
    } finally {
      setCellSaving(false)
      setEditingCell(null)
    }
  }

  // Publish or unpublish a paper without leaving this tab. The paper service
  // refuses to publish a paper that has no questions or missing answers.
  async function handleTogglePaperPublish(paper) {
    const nextStatus = paper.status === 'published' ? 'draft' : 'published'
    setTogglingPaperId(paper.id)
    try {
      await paperService.togglePublishStatus(paper.id, nextStatus)
      toast.success(nextStatus === 'published' ? 'Paper published.' : 'Paper moved back to draft.')
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Could not change the paper status.')
    } finally {
      setTogglingPaperId(null)
    }
  }

  // ── Papers: create, rename and delete ──────────────────────────────────────
  async function handleSavePaperDialog() {
    const name = (paperDialog?.name || '').trim()
    if (name.length < 3) {
      toast.error('Enter a paper name (at least 3 characters).')
      return
    }
    setSavingPaper(true)
    try {
      if (paperDialog.mode === 'rename') {
        await paperService.updatePaper(paperDialog.paper.id, { title: name })
        toast.success('Paper renamed.')
      } else {
        await paperService.createPaper(paperPayloadFromName(name, EXAM_NAME_BY_GROUP[selectedGroupTag]))
        toast.success('Paper created.')
      }
      setPaperDialog(null)
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Could not save the paper.')
    } finally {
      setSavingPaper(false)
    }
  }

  async function handleDeletePaper(paper) {
    const count = paper.total_questions || 0
    const questionsNote = count ? ` and its ${count} question${count === 1 ? '' : 's'}` : ''
    const attemptsNote = paper.status === 'published' ? "\n\nStudents' attempts on this paper are removed too." : ''
    if (!window.confirm(`Delete "${paper.title}"${questionsNote}? This cannot be undone.${attemptsNote}`)) return

    setDeletingPaperId(paper.id)
    try {
      await paperService.deletePaper(paper.id)
      if (selectedTargetPaperId === paper.id) setSelectedTargetPaperId('')
      setSelectedKeys(new Set())
      toast.success('Paper deleted.')
      await loadData()
      await refreshGroupMeta()
    } catch (err) {
      toast.error(err.message || 'Could not delete the paper.')
    } finally {
      setDeletingPaperId(null)
    }
  }

  // ── PDF ingestion: confirm where the questions go, then extract into it ─────
  function openUploadModal() {
    setIngestGroup(selectedGroupTag)
    setIngestSource('')
    setIngestYear('')
    setIngestName('')
    setIngestNote('')
    ingestTargetRef.current = null
    setShowUploadModal(true)
  }

  function closeUploadModal() {
    setShowUploadModal(false)
  }

  // The pages of an exam paper rarely say which group or year they are from, but the
  // file name usually does. Fill in what it says; the admin confirms or corrects it.
  function handleIngestFileSelected(file) {
    const found = detectFromFileName(file?.name)
    const filled = []
    if (found.examTag) {
      setIngestGroup(found.examTag)
      filled.push(EXAM_NAME_BY_GROUP[found.examTag])
    }
    if (found.year) {
      setIngestYear(String(found.year))
      filled.push(String(found.year))
    }
    if (found.source) {
      setIngestSource(found.source)
      filled.push(found.source === 'PYQ' ? 'official previous year paper' : 'practice questions')
    }
    const baseName = String(file?.name || '').replace(/\.pdf$/i, '')
    if (found.source !== 'PYQ' && baseName) setIngestName(baseName)

    setIngestNote(filled.length > 0
      ? `Read from the file name "${file.name}": ${filled.join(', ')}. Please check this before saving.`
      : `The file name "${file?.name}" does not say which group, year or kind of paper it is. Choose them below.`)
  }

  // Called by the PDF tabs when Save is clicked. Checks the choices above, finds or
  // creates the paper, and tells the tab where and how to save.
  async function resolveIngestTarget() {
    if (!ingestSource) {
      toast.error('Choose whether this PDF is an official previous year paper or practice questions.')
      return null
    }
    const examName = EXAM_NAME_BY_GROUP[ingestGroup]
    try {
      let target
      if (ingestSource === 'PYQ') {
        const year = Number.parseInt(ingestYear, 10)
        const thisYear = new Date().getFullYear()
        if (!Number.isInteger(year) || year < 2000 || year > thisYear) {
          toast.error(`Enter the exam year (2000-${thisYear}).`)
          return null
        }
        // Official questions go to the Previous Year paper for this group and year
        const paper = await paperService.ensurePyqPaper({ examTag: ingestGroup, year })
        target = { paperId: paper.id, paperTitle: paper.title, examTag: ingestGroup, sourceType: 'PYQ', examYear: year }
      } else {
        const name = ingestName.trim()
        if (name.length < 3) {
          toast.error('Enter a paper name (at least 3 characters).')
          return null
        }
        // The same name in the same group adds to that paper instead of making a second one
        const existing = papers.find(p =>
          String(p.title || '').trim().toLowerCase() === name.toLowerCase() && (p.exam_name || '') === examName
        )
        const paper = existing || await paperService.createPaper(paperPayloadFromName(name, examName))
        target = { paperId: paper.id, paperTitle: paper.title, examTag: ingestGroup, sourceType: 'VINA' }
      }
      ingestTargetRef.current = target
      return target
    } catch (err) {
      toast.error(err.message || 'Could not prepare the paper.')
      return null
    }
  }

  async function handleIngestSuccess(count) {
    const target = ingestTargetRef.current
    closeUploadModal()

    let message = `${count} questions added.`
    if (target?.sourceType === 'PYQ') {
      // Official questions go live under Previous Year Papers once they can be scored
      try {
        const outcome = await paperService.publishIfReady(target.paperId)
        message = describePyqOutcome(target.paperTitle, count, outcome)
      } catch (err) {
        message += ` The paper could not be published: ${err.message}`
      }
    }
    toast.success(message)

    if (target && target.examTag !== selectedGroupTag) {
      // Show the group the questions went to; changing the tab reloads the grid
      setSelectedGroupTag(target.examTag)
    } else {
      await loadData()
      await refreshGroupMeta()
    }
  }

  function renderCellEditor(q, col) {
    const cancel = () => setEditingCell(null)
    const baseClass = 'w-full min-w-[110px] px-1.5 py-1 text-xs bg-white border border-tnpsc-brand rounded outline-none focus:ring-1 focus:ring-tnpsc-brand/40'

    if (col.type === 'select') {
      const options = col.key === 'unit_code' ? unitCodesForGroup : col.options
      return (
        <select
          autoFocus
          value={editingCell.value}
          disabled={cellSaving}
          onChange={e => handleCellSave(q, col.key, e.target.value)}
          onBlur={cancel}
          className={baseClass}
        >
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )
    }

    const shared = {
      autoFocus: true,
      value: editingCell.value,
      disabled: cellSaving,
      onChange: e => setEditingCell(prev => ({ ...prev, value: e.target.value })),
      onBlur: cancel,
      onKeyDown: e => {
        if (e.key === 'Enter' && !(col.long && e.shiftKey)) {
          e.preventDefault()
          handleCellSave(q, col.key, editingCell.value)
        } else if (e.key === 'Escape') {
          cancel()
        }
      },
    }

    return col.long
      ? <textarea rows={3} {...shared} className={`${baseClass} min-w-[240px] ${col.lang === 'ta' ? 'font-tamil' : ''}`} />
      : <input type={col.type === 'number' ? 'number' : 'text'} {...shared} className={`${baseClass} ${col.lang === 'ta' ? 'font-tamil' : ''}`} />
  }

  function renderGridCell(q, col) {
    const rowKey = rowKeyOf(q)
    const isEditing = editingCell?.rowKey === rowKey && editingCell?.field === col.key
    const raw = q[col.key]
    const text = raw === undefined || raw === null ? '' : String(raw)
    const cellClass = `py-2 px-3 border-r border-slate-200 ${col.lang === 'ta' ? 'font-tamil' : ''} ${col.sticky ? 'sticky left-[40px] z-10 bg-white' : ''}`

    if (isEditing) {
      return (
        <td key={col.key} className={`${cellClass} bg-amber-50`}>
          {renderCellEditor(q, col)}
        </td>
      )
    }

    let content
    if (col.key === 'source_type') {
      content = (
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
          text === 'PYQ' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
        }`}>
          {text}
        </span>
      )
    } else if (col.key === 'answer_key') {
      content = (
        <span className="inline-block w-6 text-center rounded font-black text-xs bg-emerald-100 text-emerald-800">{text}</span>
      )
    } else if (col.key === 'ideal_time_seconds') {
      content = <span className="font-bold text-slate-600">{text}s</span>
    } else if (col.key === 'content_hash') {
      content = <span className="font-mono text-[10px] text-slate-500">{text ? `${text.slice(0, 10)}…` : '—'}</span>
    } else if (col.mono) {
      content = <span className="font-mono font-bold text-[11px] text-slate-800">{text}</span>
    } else {
      content = <span className={`block truncate ${col.maxWidth || 'max-w-[180px]'} ${text ? 'text-slate-800' : 'text-slate-400'}`}>{text || '—'}</span>
    }

    return (
      <td
        key={col.key}
        title={col.readOnly ? text : `${text}\n(double-click to edit)`}
        onDoubleClick={() => startCellEdit(q, col)}
        className={`${cellClass} ${col.readOnly ? '' : 'cursor-text hover:bg-amber-50/50'}`}
      >
        {content}
      </td>
    )
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
      // PapaParse handles quoted commas, apostrophes, doubled quotes and multi-line cells
      // Spreadsheet exports often start with a byte-order mark; drop it so the first header matches
      const cleanText = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text
      const parsedCsv = Papa.parse(cleanText, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: header => header.trim().toLowerCase(),
      })
      const dataRows = parsedCsv.data
      if (dataRows.length === 0) throw new Error('CSV file is empty or missing data rows.')

      // Existing PYQ hashes to enforce Deduplication Gate
      const existingPyqHashes = new Set(
        questions.filter(q => q.source_type === 'PYQ' && q.content_hash).map(q => q.content_hash)
      )

      const parsedRows = []
      const validationErrors = []
      let validCount = 0
      let duplicateCount = 0

      for (let i = 1; i <= dataRows.length; i++) {
        const rowObj = {}
        Object.entries(dataRows[i - 1]).forEach(([header, value]) => {
          rowObj[header] = typeof value === 'string' ? value.trim() : (value ?? '')
        })

        const normalized = normalizeTo29Columns(rowObj, i)
        const hash = await computeQuestionContentHash(normalized.en_question_text, normalized.ta_question_text)
        normalized.content_hash = hash

        // 1. Strict Foreign-Key & Taxonomy Validation
        // (Quick Recall is one common pool, so each row is checked against its own group.)
        const valRes = validateQuestionAgainstMasterTaxonomy(normalized, isRecall ? normalized.exam_tag : selectedGroupTag)

        // 2. Deduplication Gate: VINA question cannot match PYQ hash
        let isDuplicate = false
        if (normalized.source_type === 'VINA' && existingPyqHashes.has(hash)) {
          isDuplicate = true
          duplicateCount++
          valRes.errors.push('Deduplication Gate: This VINA synthetic question matches an official PYQ question text.')
          valRes.isValid = false
        }

        // PYQ rows are filed under Previous Year Papers by year, so the year must be stated
        // (without this check a missing year would silently become 2024).
        if (!isRecall && normalized.source_type === 'PYQ') {
          const statedYear = Number.parseInt(rowObj.year || rowObj.exam_year, 10)
          const thisYear = new Date().getFullYear()
          if (!Number.isInteger(statedYear) || statedYear < 2000 || statedYear > thisYear) {
            valRes.errors.push(`A PYQ question needs the year of its exam (2000-${thisYear}); the year decides which Previous Year paper it joins.`)
            valRes.isValid = false
          }
        }

        // 3. Map to the approved question_taxonomy catalog the database enforces
        // (Only the exam question bank is guarded by that database rule.)
        if (!isRecall) {
          const approved = mapToApprovedCatalog(normalized, selectedGroupTag)
          if (!approved) {
            valRes.errors.push(`No approved catalog mapping for micro_topic '${normalized.micro_topic}'.`)
            valRes.isValid = false
          } else {
            normalized.unit_code = approved.unit_code
            normalized.unit_name = approved.unit_name
            normalized.unit_tag = approved.unit_name
            normalized.macro_topic = approved.macro_topic
            normalized.micro_topic = approved.micro_topic
          }
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
        totalRows: dataRows.length,
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
        .map(r => r.data)

      if (isRecall) {
        // The Quick Recall pool is common to every group and needs no paper.
        const { inserted, skipped } = await recallGridService.importRows(validQuestions)
        toast.success(`Imported ${inserted} questions${skipped ? `; skipped ${skipped} already in the pool` : ''}.`)
      } else {
        const pyqRows = validQuestions.filter(q => q.source_type === 'PYQ')
        const otherRows = validQuestions.filter(q => q.source_type !== 'PYQ')
        if (otherRows.length > 0 && !selectedTargetPaperId) {
          throw new Error('Choose a paper for the VINA questions in this file.')
        }

        const notes = []

        // Official questions are filed by exam group and year, so each year appears on the
        // student's Previous Year Papers page without any manual step.
        const pyqBuckets = new Map()
        pyqRows.forEach(q => {
          const key = `${q.exam_tag}|${q.year}`
          if (!pyqBuckets.has(key)) pyqBuckets.set(key, [])
          pyqBuckets.get(key).push(q)
        })
        for (const [key, rows] of pyqBuckets) {
          const [examTag, year] = key.split('|')
          const paper = await paperService.ensurePyqPaper({ examTag, year: Number(year) })
          await questionService.saveQuestionsToSupabase(paper.id, rows, false)
          const outcome = await paperService.publishIfReady(paper.id)
          notes.push(describePyqOutcome(paper.title, rows.length, outcome))
        }

        if (otherRows.length > 0) {
          await questionService.saveQuestionsToSupabase(selectedTargetPaperId, otherRows, false)
          notes.push(`${otherRows.length} VINA question${otherRows.length === 1 ? '' : 's'} added to the chosen paper.`)
        }
        toast.success(notes.join(' '))
      }
      setShowBulkCsvModal(false)
      setCsvFile(null)
      setCsvValidationResults(null)
      await loadData()
      await refreshGroupMeta()
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
              {isRecall ? 'Quick Recall Question Bank' : 'Admin Question Bank & Taxonomy Control'}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowBulkCsvModal(true)}
            className="px-3.5 py-2 bg-tnpsc-brand hover:bg-[#4f46e5] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-subtle transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Upload CSV (Strict Validation)</span>
          </button>

          {!isRecall && (
          <button
            onClick={openUploadModal}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-subtle transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI / PDF Text Ingestion</span>
          </button>
          )}

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
      {!isRecall && (
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
      </div>
      )}

      {/* ── Papers panel: create, publish and unpublish papers in this tab ──── */}
      {!isRecall && (
      <div className="bg-white rounded-2xl border border-surface-border shadow-subtle overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowPapersPanel(open => !open)}
            className="flex items-center gap-2 text-xs font-black text-body-text uppercase tracking-wider"
          >
            {showPapersPanel ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <FileText className="w-4 h-4 text-tnpsc-brand" />
            Papers ({papers.length})
          </button>
          <button
            type="button"
            onClick={() => { setShowPapersPanel(true); setPaperDialog({ mode: 'create', name: '' }) }}
            className="px-3 py-1.5 bg-tnpsc-brand hover:bg-[#4f46e5] text-white rounded-lg text-xs font-bold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Paper
          </button>
        </div>

        {showPapersPanel && (
          <div className="border-t border-surface-border overflow-x-auto max-h-72">
            {papers.length === 0 ? (
              <p className="p-4 text-xs text-body-secondary">No papers yet. Create one to attach questions to.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-body-secondary">
                  <tr>
                    <th className="py-2 px-4">Title</th>
                    <th className="py-2 px-3">Exam</th>
                    <th className="py-2 px-3">Year</th>
                    <th className="py-2 px-3 text-center">Questions</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {papers.map(paper => {
                    const isPublished = paper.status === 'published'
                    return (
                      <tr key={paper.id}>
                        <td className="py-2 px-4 font-semibold text-body-text">{paper.title}</td>
                        <td className="py-2 px-3 text-body-secondary">{paper.exam_name || '—'}</td>
                        <td className="py-2 px-3 text-body-secondary">{paper.year || '—'}</td>
                        <td className="py-2 px-3 text-center font-bold">{paper.total_questions || 0}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {paper.status || 'draft'}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setPaperDialog({ mode: 'rename', name: paper.title || '', paper })}
                            className="px-2 py-1 mr-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700"
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            disabled={togglingPaperId === paper.id}
                            onClick={() => handleTogglePaperPublish(paper)}
                            className={`px-2 py-1 rounded font-bold disabled:opacity-50 ${
                              isPublished
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {togglingPaperId === paper.id ? '…' : isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            type="button"
                            disabled={deletingPaperId === paper.id}
                            onClick={() => handleDeletePaper(paper)}
                            title="Delete paper"
                            className="ml-1.5 px-2 py-1 rounded border border-red-200 bg-white hover:bg-red-50 text-red-600 font-bold disabled:opacity-50"
                          >
                            {deletingPaperId === paper.id ? '…' : <Trash2 className="w-3.5 h-3.5 inline" />}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
      )}

      {/* ── 3. Inventory & Blueprint Health Monitor Bar ──────────────────────── */}
      {isRecall ? (
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-card border border-indigo-950/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-white/10 text-amber-300">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <h3 className="text-sm font-black tracking-wide text-white">
            Common Quick Recall Pool — shared by every exam group
          </h3>
        </div>
        <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-300 block">Total Pool</span>
          <b className="text-base font-black text-white">{groupInventory.total} Qs</b>
        </div>
      </div>
      ) : (
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
              className="p-2.5 rounded-xl border text-center bg-white/5 border-white/10 text-slate-200"
            >
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
                {item.unit_code}
              </span>
              <b className="block mt-1 text-sm font-black text-white">{item.available}</b>
            </div>
          ))}
        </div>
      </div>
      )}

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
          {!isRecall && (
          <button
            onClick={() => handleDownloadTaxonomyCsv(selectedGroupTag)}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-indigo-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {selectedGroupTag.replace(/_/g, ' ')} Master Taxonomy CSV</span>
          </button>
          )}

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
              29-Column Master Spreadsheet Grid ({tableQuestions.length} Questions)
            </span>
            <span className="text-[11px] text-body-secondary font-medium">
              Double-click any cell to edit inline · Press Enter to save automatically
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-body-secondary font-semibold">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>

        {/* ── Bulk action toolbar ─────────────────────────────────────────── */}
        <div className="px-4 py-2.5 border-b border-surface-border bg-slate-50/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-600">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              <strong className="text-body-text">{tableQuestions.length}</strong> of {groupFilteredQuestions.length} shown
            </span>
            <span className="text-slate-300">|</span>
            <span className={selectedKeys.size > 0 ? 'text-tnpsc-brand font-bold' : ''}>
              {selectedKeys.size} selected
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              {loadInfo.mode === 'latest'
                ? `Showing ${Math.min(DEFAULT_ROW_LIMIT, groupInventory.total || DEFAULT_ROW_LIMIT)} of ${groupInventory.total} questions. Use the column filters or search to find others.`
                : loadInfo.capped
                  ? `Showing the first ${SEARCH_RESULT_LIMIT} matches. Narrow the search to see the rest.`
                  : 'Showing every match in the database.'}
            </span>
            {tableQuestions.length > 0 && selectedKeys.size < tableQuestions.length && (
              <button
                type="button"
                onClick={selectAllMatching}
                className="px-2 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700"
              >
                Select all {tableQuestions.length} matching
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasActiveColumnFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700"
              >
                Clear All Filters
              </button>
            )}
            {selectedKeys.size > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedKeys(new Set())}
                  className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700"
                >
                  Clear selection
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Selected ({selectedKeys.size})
                </button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 text-tnpsc-brand animate-spin mx-auto mb-3" />
            <p className="text-xs text-body-secondary font-medium">Loading 29-column question spreadsheet...</p>
          </div>
        ) : tableQuestions.length === 0 ? (
          <div className="p-16 text-center text-body-secondary text-xs">
            No questions found matching your filter criteria. Click "Bulk Upload CSV" to import questions.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[640px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-100 text-body-secondary uppercase font-bold text-[10px] border-b border-surface-border shadow-2xs">
                <tr>
                  <th className="py-2.5 px-2 border-r border-slate-200 sticky left-0 z-30 bg-slate-100 w-[40px] text-center">
                    <input
                      type="checkbox"
                      aria-label="Select all on this page"
                      checked={allPageSelected}
                      onChange={togglePageSelection}
                      disabled={pageKeys.length === 0}
                      className="cursor-pointer"
                    />
                  </th>
                  {visibleColumns.map(col => (
                    col.filterKey
                      ? renderSortFilterHeader(col.filterKey, col.label, headerClassFor(col))
                      : (
                        <th key={col.key} className={`py-2.5 px-3 border-r ${headerClassFor(col)}`}>
                          {col.label}
                        </th>
                      )
                  ))}
                  <th className="py-2.5 px-3 text-center min-w-[80px]">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {paginatedQuestions.map((q, idx) => {
                  const key = rowKeyOf(q)
                  const isSelected = selectedKeys.has(key)
                  return (
                    <tr key={key || idx} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-indigo-50/60' : ''}`}>
                      <td className="py-2 px-2 border-r border-slate-200 sticky left-0 z-10 bg-white text-center">
                        <input
                          type="checkbox"
                          aria-label={`Select question ${q.question_id}`}
                          checked={isSelected}
                          onChange={() => toggleRowSelection(key)}
                          className="cursor-pointer"
                        />
                      </td>

                      {visibleColumns.map(col => renderGridCell(q, col))}

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
            <span>of {tableQuestions.length} questions</span>
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

      {/* ── Paper name dialog: create or rename ─────────────────────────────── */}
      {paperDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-body-text">
                {paperDialog.mode === 'rename' ? 'Rename paper' : 'Create paper'}
              </h3>
              {paperDialog.mode === 'create' && (
                <p className="text-xs text-body-secondary">
                  Added to {EXAM_NAME_BY_GROUP[selectedGroupTag]}. Put the group and year in the name,
                  such as "TNPSC Group 1 Previous Year Paper 2024", if students should find it under Previous Year Papers.
                </p>
              )}
            </div>
            <input
              autoFocus
              value={paperDialog.name}
              onChange={e => setPaperDialog(d => ({ ...d, name: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') handleSavePaperDialog() }}
              placeholder="Paper name"
              aria-label="Paper name"
              className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-tnpsc-brand"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaperDialog(null)}
                disabled={savingPaper}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-surface-border rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePaperDialog}
                disabled={savingPaper}
                className="px-3 py-1.5 text-xs font-bold bg-tnpsc-brand hover:bg-[#4f46e5] text-white rounded-lg disabled:opacity-50"
              >
                {savingPaper ? 'Saving…' : paperDialog.mode === 'rename' ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Delete Confirmation ─────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-body-text">
                Delete {selectedKeys.size} selected question{selectedKeys.size === 1 ? '' : 's'}?
              </h3>
              <p className="text-xs text-body-secondary">
                These questions will be permanently removed from the database. This cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={bulkDeleting}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-surface-border rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
              >
                {bulkDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {isRecall
                    ? 'Each row is checked against its own exam group'
                    : <>Target Exam Group: <b className="text-tnpsc-brand">{selectedGroupTag.replace(/_/g, ' ')}</b></>}
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

              {/* Official questions are filed automatically; other questions need a chosen paper */}
              {!isRecall && csvPyqCount > 0 && (
                <p className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  {csvPyqCount} official (PYQ) question{csvPyqCount === 1 ? '' : 's'} will be filed automatically under
                  Previous Year Papers by group and year, and added to the mock test bank.
                </p>
              )}
              {!isRecall && csvNeedsPaper && (
              <div className="space-y-2">
                <label htmlFor="bulk-csv-target-paper" className="block text-xs font-bold text-body-text">
                  Choose the paper for the VINA (practice) questions
                </label>
                <select
                  id="bulk-csv-target-paper"
                  value={selectedTargetPaperId}
                  onChange={e => setSelectedTargetPaperId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-xs"
                >
                  <option value="">Select a paper…</option>
                  {papers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} · {p.exam_name || 'No exam'} · {p.status || 'draft'} · {p.total_questions || 0} Qs
                    </option>
                  ))}
                </select>
                {selectedTargetPaperId ? (
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    Questions will be added to: {papers.find(p => p.id === selectedTargetPaperId)?.title}
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-700 font-semibold">
                    Choose a paper before importing. Use Create Paper in the Papers panel if it isn't listed.
                  </p>
                )}
              </div>
              )}

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
                disabled={!csvValidationResults || csvValidationResults.validCount === 0 || csvImporting || (!isRecall && csvNeedsPaper && !selectedTargetPaperId)}
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

              {/* Side-by-Side Bilingual Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* English Version Card */}
                <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 text-blue-900 border border-blue-300">
                      🇬🇧 English Version
                    </span>
                  </div>
                  <p className="text-body-text font-medium whitespace-pre-wrap text-sm leading-relaxed">
                    {viewingQuestion.en_question_text}
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {['a', 'b', 'c', 'd'].map(key => {
                      const isKey = viewingQuestion.answer_key === key.toUpperCase()
                      return (
                        <div key={key} className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                          isKey ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-950 ring-1 ring-emerald-500' : 'border-slate-200 bg-white text-slate-700'
                        }`}>
                          <span>({key.toUpperCase()}) {viewingQuestion[`en_option_${key}`]}</span>
                          {isKey && <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-black">CORRECT</span>}
                        </div>
                      )
                    })}
                  </div>
                  {viewingQuestion.en_explanation && (
                    <div className="p-2.5 bg-white rounded-lg border border-blue-100 text-xs text-slate-700">
                      <b className="text-blue-900 block mb-0.5 font-bold">Explanation (English):</b>
                      <p className="whitespace-pre-wrap">{viewingQuestion.en_explanation}</p>
                    </div>
                  )}
                </div>

                {/* Tamil Version Card */}
                <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200 space-y-3 font-tamil">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                      🇮🇳 தமிழ் வடிவம் (Tamil)
                    </span>
                  </div>
                  <p className="text-body-text font-medium whitespace-pre-wrap text-sm leading-relaxed">
                    {viewingQuestion.ta_question_text || viewingQuestion.en_question_text}
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {['a', 'b', 'c', 'd'].map(key => {
                      const isKey = viewingQuestion.answer_key === key.toUpperCase()
                      return (
                        <div key={key} className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                          isKey ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-950 ring-1 ring-emerald-500' : 'border-slate-200 bg-white text-slate-700'
                        }`}>
                          <span>({key.toUpperCase()}) {viewingQuestion[`ta_option_${key}`] || viewingQuestion[`en_option_${key}`]}</span>
                          {isKey && <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-black">விடை</span>}
                        </div>
                      )
                    })}
                  </div>
                  {viewingQuestion.ta_explanation && (
                    <div className="p-2.5 bg-white rounded-lg border border-emerald-100 text-xs text-slate-700">
                      <b className="text-emerald-900 block mb-0.5 font-bold">விளக்கம்:</b>
                      <p className="whitespace-pre-wrap">{viewingQuestion.ta_explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. AI/Text PDF Ingestion Modal ──────────────────────────────────── */}
      {showUploadModal && !isRecall && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-surface-border space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-base font-black text-body-text">
                Import Questions from PDF / Vision Pipeline
              </h3>
              <button
                onClick={closeUploadModal}
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

            <div className="space-y-3 rounded-2xl border border-surface-border bg-slate-50/60 p-4">
              <div>
                <p className="text-xs font-bold text-body-text">Where should these questions go?</p>
                <p className="text-[11px] text-body-secondary">
                  Choosing the PDF fills this in from its file name. Check it, then save.
                </p>
                {ingestNote && <p className="text-[11px] text-emerald-700 font-semibold mt-1">{ingestNote}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="ingest-group" className="block text-xs font-bold text-body-text">Exam group</label>
                  <select
                    id="ingest-group"
                    value={ingestGroup}
                    onChange={e => setIngestGroup(e.target.value)}
                    className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-tnpsc-brand"
                  >
                    {Object.entries(EXAM_NAME_BY_GROUP).map(([tag, label]) => (
                      <option key={tag} value={tag}>{label}</option>
                    ))}
                  </select>
                </div>

                <fieldset className="space-y-1.5">
                  <legend className="text-xs font-bold text-body-text">What is in this PDF?</legend>
                  <label className="flex items-start gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="ingest-source"
                      checked={ingestSource === 'PYQ'}
                      onChange={() => setIngestSource('PYQ')}
                      className="mt-0.5"
                    />
                    <span><b>Official previous year paper (PYQ)</b></span>
                  </label>
                  <label className="flex items-start gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="ingest-source"
                      checked={ingestSource === 'VINA'}
                      onChange={() => setIngestSource('VINA')}
                      className="mt-0.5"
                    />
                    <span><b>Practice questions (VINA)</b></span>
                  </label>
                </fieldset>
              </div>

              {ingestSource === 'PYQ' && (
                <div className="space-y-1">
                  <label htmlFor="ingest-year" className="block text-xs font-bold text-body-text">Exam year</label>
                  <input
                    id="ingest-year"
                    type="number"
                    min="2000"
                    max={new Date().getFullYear()}
                    value={ingestYear}
                    onChange={e => setIngestYear(e.target.value)}
                    placeholder="e.g. 2014"
                    className="w-40 px-3 py-2 border border-surface-border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-tnpsc-brand"
                  />
                  <p className="text-[11px] text-body-secondary">
                    {ingestYear
                      ? `Filed under: ${EXAM_NAME_BY_GROUP[ingestGroup]} Previous Year Paper ${ingestYear}, and added to the mock test bank.`
                      : 'Official papers are filed under Previous Year Papers by group and year, and added to the mock test bank.'}
                  </p>
                </div>
              )}

              {ingestSource === 'VINA' && (
                <div className="space-y-1">
                  <label htmlFor="ingest-paper-name" className="block text-xs font-bold text-body-text">Paper name</label>
                  <input
                    id="ingest-paper-name"
                    value={ingestName}
                    onChange={e => setIngestName(e.target.value)}
                    placeholder="e.g. Group 1 Practice Set 5"
                    className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-tnpsc-brand"
                  />
                  <p className="text-[11px] text-body-secondary">
                    Saved to this paper and added to the mock test bank. A name that already exists adds to that paper.
                  </p>
                </div>
              )}
            </div>

            {uploadTab === 'ai' ? (
              <AiPdfTab
                getTarget={resolveIngestTarget}
                onFileSelected={handleIngestFileSelected}
                onImportSuccess={handleIngestSuccess}
              />
            ) : (
              <TextPdfTab
                getTarget={resolveIngestTarget}
                onFileSelected={handleIngestFileSelected}
                onImportSuccess={handleIngestSuccess}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
