/**
 * TextPdfTab.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Text-based PDF import with tick-mark detection for Admin.
 * NO AI/OCR - uses PDF.js text extraction + deterministic parsing.
 * 
 * Features:
 * - Drag & drop PDF upload
 * - PDF.js text extraction
 * - MCQ parsing with tick detection
 * - Preview with edit/delete/add/reorder
 * - Validation and "Needs Review" system
 * - Save to existing questions table
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload, Loader2, FileCheck, AlertCircle, CheckCircle2, Eye, Save,
  ChevronDown, ChevronRight, Trash2, Plus, GripVertical, X, Sparkles
} from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { questionService } from '../../services/questionService'
import { extractPdfText } from '../../services/pdfTextExtractor'
import { parseMcqQuestions } from '../../services/mcqParser'
import { extractQuestionsWithAi, blobToBase64 } from '../../services/aiPdfService'
import { apiKeyService } from '../../services/apiKeyService'
import {
  TopicSeparationSummary,
  OFFICIAL_SYLLABUS_UNITS,
  normalizeUnitName
} from './TopicSeparationSummary'

// ─── Progress Display ──────────────────────────────────────────────────────────
function ExtractionProgress({ stage, currentPage, totalPages, statusText }) {
  const pct = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-purple-800">
          {statusText || (stage === 'extracting' ? 'Extracting text...' : 'Parsing questions...')}
        </span>
        <span className="text-purple-600 font-mono">{pct > 0 ? `${pct}%` : ''}</span>
      </div>
      <div className="w-full h-2.5 bg-purple-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-600 rounded-full transition-all duration-300"
          style={{ width: `${Math.max(pct, 15)}%` }}
        />
      </div>
      {totalPages > 1 && (
        <div className="text-center">
          <p className="text-sm font-bold text-purple-800">
            Page {currentPage} / {totalPages}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Question Preview Card ─────────────────────────────────────────────────────
function QuestionCard({ question, index, onEdit, onDelete, expanded, onToggle }) {
  const isOpen = expanded
  const needsReview = question.status === 'needs_review'
  const currentUnit = normalizeUnitName(question.unit_name)

  return (
    <div
      className={`rounded-xl border transition-colors ${
        needsReview
          ? 'border-amber-300 bg-amber-50/30'
          : 'border-surface-border bg-white'
      }`}
    >
      {/* Collapsed view */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="w-8 h-8 rounded-lg bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {question.question_number}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-body-text truncate">
              {question.question_text.slice(0, 80)}...
            </p>
            {needsReview && question.warnings.length > 0 && (
              <p className="text-[10px] text-amber-700 mt-0.5 truncate">
                ⚠️ {question.warnings[0]}
              </p>
            )}
            {(question.unit_name || question.micro_topic_name) && (
              <div className="flex items-center gap-1 text-[9px] text-purple-700 bg-purple-50 border border-purple-100 rounded px-1.5 py-0.5 mt-1 w-fit max-w-full truncate">
                <span className="font-bold text-purple-900">Unit:</span> {currentUnit.split(':')[0] || 'Unit'} ›
                <span className="font-bold text-purple-900">Topic:</span> {question.macro_topic_name || question.micro_topic_name || 'General'}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {needsReview ? (
            <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">
              Needs Review
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
              Valid
            </span>
          )}
          {question.correct_answer && (
            <span className="text-[10px] bg-purple-100 text-purple-700 rounded-full px-2 py-0.5 font-bold">
              Ans: {question.correct_answer}
            </span>
          )}
          <span className="text-[10px] text-body-secondary">p.{question.page_number}</span>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-body-secondary" />
          ) : (
            <ChevronRight className="w-4 h-4 text-body-secondary" />
          )}
        </div>
      </button>

      {/* Expanded edit view */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-surface-border pt-3">
          {/* Warnings */}
          {question.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
              {question.warnings.map((warning, idx) => (
                <p key={idx} className="text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {warning}
                </p>
              ))}
            </div>
          )}

          {/* Question text */}
          <div>
            <label className="block text-[10px] font-bold text-body-secondary uppercase mb-1">
              Question Text
            </label>
            <textarea
              rows={3}
              value={question.question_text}
              onChange={(e) => onEdit(index, 'question_text', e.target.value)}
              className="w-full border border-surface-border rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Options A-D */}
          <div className="grid grid-cols-2 gap-2">
            {['A', 'B', 'C', 'D'].map((opt) => (
              <div key={opt}>
                <label className="block text-[10px] font-bold text-body-secondary uppercase mb-1">
                  Option {opt}
                  {question.correct_answer === opt && ' ✓'}
                </label>
                <input
                  type="text"
                  value={question.options[opt] || ''}
                  onChange={(e) =>
                    onEdit(index, 'options', { ...question.options, [opt]: e.target.value })
                  }
                  className={`w-full border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-purple-500 ${
                    question.correct_answer === opt
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-surface-border'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Correct answer & Syllabus Unit selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-body-secondary uppercase">
                Correct Answer:
              </span>
              <div className="flex gap-1.5">
                {['A', 'B', 'C', 'D', null].map((opt) => (
                  <button
                    key={String(opt)}
                    onClick={() => onEdit(index, 'correct_answer', opt)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      question.correct_answer === opt
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-body-secondary hover:bg-slate-200'
                    }`}
                  >
                    {opt ?? '–'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-body-secondary uppercase">
                Unit:
              </span>
              <select
                value={currentUnit}
                onChange={(e) => onEdit(index, 'unit_name', e.target.value)}
                className="text-xs font-semibold text-purple-900 bg-purple-50 border border-purple-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {OFFICIAL_SYLLABUS_UNITS.map(u => (
                  <option key={u.id} value={u.unit_name}>
                    {u.shortName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Delete button */}
          <button
            onClick={() => onDelete(index)}
            className="flex items-center gap-2 text-xs text-red-600 hover:text-red-700 font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Question
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Text PDF Tab ─────────────────────────────────────────────────────────
export function TextPdfTab({ paperId, paperTitle, onImportSuccess }) {
  const { toast, hasGeminiApiKey, geminiApiKey } = useApp()
  const fileRef = useRef(null)

  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)
  const [questions, setQuestions] = useState([])
  const [expanded, setExpanded] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [importMsg, setImportMsg] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [viewMode, setViewMode] = useState('table') // 'table' | 'separated'
  const [collapsedTopics, setCollapsedTopics] = useState(new Set())

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    e.target.value = ''
    if (f.type !== 'application/pdf') {
      toast.error('Please select a PDF file.')
      return
    }
    if (f.size > 50 * 1024 * 1024) {
      toast.error('PDF must be under 50 MB.')
      return
    }
    setFile(f)
    setResult(null)
    setQuestions([])
    setSelectedTopic(null)
    setImportMsg(null)
    setProgress(null)
  }

  async function handleExtract(mode = 'ai') {
    if (!file) {
      toast.error('Select a PDF first.')
      return
    }

    if (mode === 'ai') {
      const activeKey = geminiApiKey || apiKeyService.getUserApiKey()
      if (!activeKey) {
        toast.error('Google Gemini API Key is required for AI extraction. Please configure your key in Admin Settings.')
        return
      }
    }

    setProcessing(true)
    setProgress({ stage: 'extracting', currentPage: 0, totalPages: 0, statusText: 'Initializing PDF extraction...' })
    setResult(null)
    setQuestions([])
    setImportMsg(null)

    try {
      if (mode === 'ai') {
        const activeKey = geminiApiKey || apiKeyService.getUserApiKey()
        setProgress({
          stage: 'ai',
          currentPage: 1,
          totalPages: 1,
          statusText: 'Analyzing PDF with Gemini AI...'
        })

        const base64Data = await blobToBase64(file)
        const aiQuestions = await extractQuestionsWithAi(
          base64Data,
          'gemini-2.5-flash',
          (msg) => setProgress({ stage: 'ai', currentPage: 1, totalPages: 1, statusText: msg }),
          activeKey
        )

        const formatted = aiQuestions.map((q, idx) => ({
          question_number: q.question_number || idx + 1,
          question_text: q.question_text || '',
          options: {
            A: q.option_a || q.options?.A || '',
            B: q.option_b || q.options?.B || '',
            C: q.option_c || q.options?.C || '',
            D: q.option_d || q.options?.D || '',
          },
          option_a: q.option_a || q.options?.A || '',
          option_b: q.option_b || q.options?.B || '',
          option_c: q.option_c || q.options?.C || '',
          option_d: q.option_d || q.options?.D || '',
          correct_answer: q.correct_option || null,
          unit_name: q.unit_name || null,
          macro_topic_name: q.macro_topic_name || null,
          micro_topic_name: q.micro_topic_name || null,
          explanation: q.explanation || null,
          status: 'valid',
          warnings: [],
          page_number: q.source_page || 1,
        }))

        setResult({
          totalQuestions: formatted.length,
          validQuestions: formatted.length,
          needsReview: 0,
          totalPages: 1,
          warnings: [],
        })
        setQuestions(formatted)

        toast.success(`Gemini AI successfully extracted ${formatted.length} question(s)!`)
        return
      }

      // Local extraction mode
      const extractResult = await extractPdfText(file, (page, total) => {
        setProgress({ stage: 'extracting', currentPage: page, totalPages: total, statusText: `Reading page ${page} of ${total}...` })
      })

      if (!extractResult.hasSelectableText) {
        const activeKey = geminiApiKey || apiKeyService.getUserApiKey()
        if (activeKey) {
          toast.error('PDF contains no selectable text. Switching to Gemini AI extraction...')
          return handleExtract('ai')
        } else {
          toast.error('PDF contains no selectable text. Configure your Gemini API key in Admin Settings to extract with AI.')
          return
        }
      }

      setProgress({ stage: 'parsing', currentPage: 0, totalPages: extractResult.totalPages, statusText: 'Parsing MCQ structure...' })

      const parseResult = await parseMcqQuestions(extractResult, (page, total) => {
        setProgress({ stage: 'parsing', currentPage: page, totalPages: total, statusText: `Parsing page ${page} of ${total}...` })
      })

      setResult(parseResult)
      setQuestions(parseResult.questions)

      if (parseResult.totalQuestions === 0) {
        toast.warning('No questions detected with local parser. You can try extracting with Gemini AI.')
      } else {
        toast.success(
          `${parseResult.totalQuestions} question(s) extracted! ` +
          `${parseResult.validQuestions} valid, ${parseResult.needsReview} need review.`
        )
      }
    } catch (err) {
      console.error('[TextPdfTab] Extraction failed:', err)
      toast.error('Extraction failed: ' + err.message)
    } finally {
      setProcessing(false)
      setProgress(null)
    }
  }

  function handleEdit(index, field, value) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== index) return q
        const updated = { ...q, [field]: value }

        // Revalidate
        const errors = []
        if (!updated.question_text || updated.question_text.trim().length < 3) {
          errors.push('Missing question text')
        }
        ['A', 'B', 'C', 'D'].forEach((opt) => {
          if (!updated.options?.[opt]?.trim()) errors.push(`Missing Option ${opt}`)
        })

        updated.status = errors.length === 0 ? 'valid' : 'needs_review'
        updated.warnings = errors

        return updated
      })
    )
  }

  function handleDelete(index) {
    if (!confirm(`Delete Question ${questions[index].question_number}?`)) return
    setQuestions((prev) => prev.filter((_, i) => i !== index))
    setExpanded((prev) => {
      const next = new Set(prev)
      next.delete(index)
      return next
    })
  }

  function handleToggleExpand(index) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  async function handleSave() {
    if (!paperId) {
      toast.error('No paper ID.')
      return
    }
    if (!questions.length) {
      toast.error('No questions to save.')
      return
    }

    const questionsToSave = questions.filter((q) => q.question_text?.trim())
    if (questionsToSave.length === 0) {
      toast.error('No questions with question text found.')
      return
    }

    const incomplete = questions.filter((q) => q.status === 'needs_review').length
    if (incomplete > 0) {
      const proceed = confirm(
        `${questionsToSave.length} total question(s) ready to save.\n` +
        `(${incomplete} question(s) flagged with review warnings).\n\n` +
        `Import all ${questionsToSave.length} questions?`
      )
      if (!proceed) return
    }

    setSaving(true)

    try {
      const toSave = questionsToSave.map((q, idx) => {
        const uName = q.unit_name ? normalizeUnitName(q.unit_name) : null
        const mName = q.macro_topic_name || null
        const miName = q.micro_topic_name || null
        let expl = q.explanation || ''
        if (uName && !expl.includes('[Taxonomy:')) {
          const taxPrefix = `[Taxonomy: ${uName} > ${mName || 'General Studies'} > ${miName || 'General Concepts'}]`
          expl = expl ? `${taxPrefix}\n\n${expl}` : taxPrefix
        }
        return {
          question_number: q.question_number || idx + 1,
          question_text: q.question_text,
          option_a: q.options?.A || q.option_a || '',
          option_b: q.options?.B || q.option_b || '',
          option_c: q.options?.C || q.option_c || '',
          option_d: q.options?.D || q.option_d || '',
          correct_option: q.correct_answer || q.correct_option || null,
          unit_name: uName,
          macro_topic_name: mName,
          micro_topic_name: miName,
          explanation: expl || null,
        }
      })

      const existing = await questionService.getExistingQuestionCount(paperId)
      if (existing > 0) {
        const replace = confirm(
          `This paper already has ${existing} question(s).\n\n` +
          `Click OK to REPLACE them, or Cancel to merge.`
        )
        const inserted = await questionService.saveQuestionsToSupabase(paperId, toSave, replace)
        setImportMsg(
          replace
            ? `Replaced with ${inserted.length} questions.`
            : `Merged ${inserted.length} questions into the paper.`
        )
        toast.success(`${inserted.length} questions saved to "${paperTitle}"`)
        onImportSuccess?.(inserted.length)
      } else {
        const inserted = await questionService.saveQuestionsToSupabase(paperId, toSave, false)
        setImportMsg(`Successfully saved ${inserted.length} questions!`)
        toast.success(`${inserted.length} questions saved to "${paperTitle}"`)
        onImportSuccess?.(inserted.length)
      }
    } catch (err) {
      console.error('[TextPdfTab] Save failed:', err)
      toast.error('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const validCount = questions.filter((q) => q.status === 'valid').length
  const reviewCount = questions.length - validCount

  const toggleTopicCollapse = (topicName) => {
    setCollapsedTopics(prev => {
      const next = new Set(prev)
      if (next.has(topicName)) next.delete(topicName)
      else next.add(topicName)
      return next
    })
  }

  // Questions grouped by topic for the "Separated by Topic" view
  const questionsByTopic = useMemo(() => {
    const groups = {}
    questions.forEach((q, originalIdx) => {
      const unit = normalizeUnitName(q.unit_name)
      if (!groups[unit]) groups[unit] = []
      groups[unit].push({ ...q, originalIdx })
    })
    return groups
  }, [questions])

  // Filtered list for table view
  const displayQuestions = useMemo(() => {
    return questions.map((q, originalIdx) => ({ ...q, originalIdx })).filter(q => {
      if (!selectedTopic) return true
      return normalizeUnitName(q.unit_name) === selectedTopic
    })
  }, [questions, selectedTopic])

  return (
    <div className="space-y-5">
      {/* Missing API key warning */}
      {!hasGeminiApiKey && !apiKeyService.hasUserApiKey() && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3 shadow-subtle">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">Google Gemini API Key Required for AI Extraction</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                To extract questions using Google Gemini AI, please configure your personal API key in Settings.
              </p>
            </div>
          </div>
          <Link
            to="/admin/settings"
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-subtle"
          >
            Configure Key →
          </Link>
        </div>
      )}

      {/* Info banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-purple-800">AI-Powered PDF Question Import &amp; Topic Separation</p>
          <p className="text-xs text-body-secondary mt-0.5">
            Extracts questions and options A/B/C/D accurately using Google Gemini AI with your personal API key. Categorizes questions into official TNPSC syllabus units. Also includes a local offline fallback option.
          </p>
        </div>
      </div>

      {/* File selector */}
      <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-body-text flex items-center gap-2">
          <Upload className="w-4 h-4 text-purple-600" />
          Step 1 — Select Selectable-Text PDF
        </h3>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-purple-600 hover:bg-purple-50/10 transition-all group"
        >
          <Upload className="w-8 h-8 text-slate-400 group-hover:text-purple-600 mx-auto mb-2 transition-colors" />
          {file ? (
            <p className="text-xs font-bold text-purple-600">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          ) : (
            <p className="text-xs text-body-secondary">
              Click to select a selectable-text MCQ PDF (max 50 MB)
            </p>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {file && !processing && (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => handleExtract('ai')}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-subtle transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {result ? 'Re-extract with Gemini AI' : 'Extract Questions with Gemini AI'}
            </button>
            <button
              onClick={() => handleExtract('local')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-body-secondary rounded-lg text-xs font-semibold transition-colors"
            >
              <FileCheck className="w-4 h-4" />
              Local Offline Parser
            </button>
          </div>
        )}
      </div>

      {/* Progress */}
      {processing && progress && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-purple-600 animate-spin shrink-0" />
            <p className="text-sm font-bold text-purple-800">Processing...</p>
          </div>
          <ExtractionProgress {...progress} />
        </div>
      )}

      {/* Extraction summary */}
      {result && !processing && (
        <div className="bg-white rounded-xl border border-surface-border p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="bg-purple-100 text-purple-800 rounded-full px-3 py-1 font-bold">
                {result.totalQuestions} questions
              </span>
              <span className="bg-emerald-100 text-emerald-800 rounded-full px-3 py-1 font-bold">
                {validCount} valid
              </span>
              {reviewCount > 0 && (
                <span className="bg-amber-100 text-amber-800 rounded-full px-3 py-1 font-bold">
                  {reviewCount} need review
                </span>
              )}
              <span className="bg-slate-100 text-slate-700 rounded-full px-3 py-1 font-semibold">
                {result.totalPages} pages
              </span>
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className="mt-3 space-y-1">
              {result.warnings.slice(0, 3).map((warning, idx) => (
                <p key={idx} className="text-xs text-amber-700">
                  ⚠️ {warning}
                </p>
              ))}
              {result.warnings.length > 3 && (
                <p className="text-xs text-body-secondary">
                  +{result.warnings.length - 3} more warning(s)
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Success message */}
      {importMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800">{importMsg}</p>
            <Link
              to={`/admin/papers/${paperId}/questions`}
              className="text-xs text-emerald-700 underline mt-0.5 inline-block"
            >
              View questions list →
            </Link>
          </div>
        </div>
      )}

      {/* Step 2: Review & Save with Visual Topic Separation */}
      {questions.length > 0 && !processing && (
        <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
            <div>
              <h3 className="text-sm font-bold text-body-text flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" />
                Step 2 — Review &amp; Save ({validCount} valid / {questions.length} total)
              </h3>
              <p className="text-xs text-body-secondary mt-0.5">
                Review questions and topic breakdown. Adjust units or edit question fields as needed before saving.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || validCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-subtle transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saving ? 'Saving...' : `Save ${validCount} Valid Questions`}
            </button>
          </div>

          {/* ── Visual Topic Separation Breakdown & Filter Bar ─────────────── */}
          <TopicSeparationSummary
            questions={questions}
            selectedTopic={selectedTopic}
            onSelectTopic={setSelectedTopic}
            viewMode={viewMode}
            onToggleViewMode={setViewMode}
            showSeparationToggle={true}
          />

          {/* ── Mode 1: Table / List View ──────────────────────────────────── */}
          {viewMode === 'table' && (
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {displayQuestions.map((q) => (
                <QuestionCard
                  key={q.originalIdx}
                  question={q}
                  index={q.originalIdx}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  expanded={expanded.has(q.originalIdx)}
                  onToggle={() => handleToggleExpand(q.originalIdx)}
                />
              ))}
            </div>
          )}

          {/* ── Mode 2: Separated by Topic View ────────────────────────────── */}
          {viewMode === 'separated' && (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {Object.entries(questionsByTopic).map(([topicName, topicQuestions]) => {
                if (selectedTopic && topicName !== selectedTopic) return null

                const isCollapsed = collapsedTopics.has(topicName)
                const unitConfig = OFFICIAL_SYLLABUS_UNITS.find(u => u.unit_name === topicName) || {
                  color: 'from-purple-600 to-indigo-700',
                  badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
                  shortName: topicName,
                }
                const pct = Math.round((topicQuestions.length / questions.length) * 100)

                return (
                  <div
                    key={topicName}
                    className="border border-surface-border rounded-2xl overflow-hidden bg-white shadow-2xs"
                  >
                    {/* Topic Section Header */}
                    <div
                      onClick={() => toggleTopicCollapse(topicName)}
                      className="px-4 py-3 bg-purple-50/60 hover:bg-purple-50 border-b border-surface-border flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-8 rounded-full bg-gradient-to-b ${unitConfig.color}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-body-text">
                              {topicName}
                            </span>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${unitConfig.badgeColor}`}>
                              {topicQuestions.length} Questions ({pct}%)
                            </span>
                          </div>
                          <p className="text-[11px] text-body-secondary mt-0.5">
                            Questions belonging to this unit
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-body-secondary" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-body-secondary" />
                        )}
                      </div>
                    </div>

                    {/* Questions inside this Topic */}
                    {!isCollapsed && (
                      <div className="p-3 space-y-2">
                        {topicQuestions.map((q) => (
                          <QuestionCard
                            key={q.originalIdx}
                            question={q}
                            index={q.originalIdx}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            expanded={expanded.has(q.originalIdx)}
                            onToggle={() => handleToggleExpand(q.originalIdx)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
