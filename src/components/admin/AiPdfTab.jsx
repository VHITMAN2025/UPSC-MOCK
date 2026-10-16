import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload, Loader2, Sparkles, CheckCircle2, Eye, Save, Trash2, Edit2, AlertTriangle,
  Layers, ChevronDown, ChevronRight, Hash, BookmarkCheck, Check
} from 'lucide-react'
import { questionService } from '../../services/questionService'
import { useApp } from '../../contexts/AppContext'
import { extractQuestionsWithAi, blobToBase64, fetchAvailableGeminiModels } from '../../services/aiPdfService'
import { apiKeyService } from '../../services/apiKeyService'
import {
  TopicSeparationSummary,
  OFFICIAL_SYLLABUS_UNITS,
  normalizeUnitName
} from './TopicSeparationSummary'

export default function AiPdfTab({ paperId, paperTitle, onImportSuccess }) {
  const { toast, hasGeminiApiKey, geminiApiKey } = useApp()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [result, setResult] = useState(null)
  const [questions, setQuestions] = useState([])
  const [importMsg, setImportMsg] = useState('')
  const [modelsList, setModelsList] = useState([
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended)' },
    { id: 'gemini-flash-latest', name: 'Gemini Flash Latest' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
  ])
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [viewMode, setViewMode] = useState('table') // 'table' | 'separated'
  const [collapsedTopics, setCollapsedTopics] = useState(new Set())
  const fileRef = useRef(null)

  useEffect(() => {
    const fetchModels = async () => {
      const apiKey = geminiApiKey || apiKeyService.getUserApiKey()
      if (!apiKey) return
      try {
        const validModels = await fetchAvailableGeminiModels(apiKey)
        if (validModels && validModels.length > 0) {
          setModelsList(validModels)
          if (!validModels.some(m => m.id === selectedModel)) {
            setSelectedModel(validModels[0].id)
          }
        }
      } catch (e) {
        console.error("Failed to fetch models", e)
      }
    }
    fetchModels()
  }, [geminiApiKey])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
      setQuestions([])
      setSelectedTopic(null)
      setImportMsg('')
      setStatusMsg('')
    }
  }

  const handleExtract = async () => {
    if (!file) return

    const activeKey = geminiApiKey || apiKeyService.getUserApiKey()
    if (!activeKey) {
      toast.error('Google Gemini API Key is required. Please configure your key in Admin Settings.')
      return
    }

    setLoading(true)
    setStatusMsg('Reading PDF file...')
    setResult(null)
    setQuestions([])
    setSelectedTopic(null)

    try {
      const base64Data = await blobToBase64(file)
      const parsedQuestions = await extractQuestionsWithAi(
        base64Data,
        selectedModel,
        (msg) => {
          setStatusMsg(msg)
          if (typeof toast === 'function') toast(msg)
          else if (toast?.info) toast.info(msg)
        },
        activeKey
      )

      setQuestions(parsedQuestions)
      setResult({
        totalQuestions: parsedQuestions.length,
      })
      toast.success(`Successfully extracted ${parsedQuestions.length} questions categorized into syllabus units!`)
    } catch (err) {
      console.error(err)
      if (err.message === 'NO_API_KEY_CONFIGURED' || err.code === 'NO_API_KEY_CONFIGURED') {
        toast.error('Gemini API key is missing. Please configure your key in Admin Settings.')
      } else {
        toast.error(err.message || 'Failed to process PDF.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (index) => {
    if (confirm('Are you sure you want to remove this question?')) {
      const updated = [...questions]
      updated.splice(index, 1)
      setQuestions(updated)
      setResult(prev => ({ ...prev, totalQuestions: updated.length }))
    }
  }

  const handleUnitChange = (qIndex, newUnit) => {
    setQuestions(prev => {
      const updated = [...prev]
      const canonical = normalizeUnitName(newUnit)
      const target = updated[qIndex]
      const oldExpl = target.explanation || ''
      const cleanedExpl = oldExpl.replace(/\[Taxonomy:[^\]]+\]\n*/gi, '').trim()
      const newTaxPrefix = `[Taxonomy: ${canonical} > ${target.macro_topic_name || 'General Studies'} > ${target.micro_topic_name || 'General Concepts'}]`
      
      updated[qIndex] = {
        ...target,
        unit_name: canonical,
        explanation: `${newTaxPrefix}\n\n${cleanedExpl}`.trim(),
        tags: Array.from(new Set([...(target.tags || []), canonical])),
      }
      return updated
    })
    toast?.success?.(`Question ${qIndex + 1} updated to ${normalizeUnitName(newUnit)}`)
  }

  const toggleTopicCollapse = (topicName) => {
    setCollapsedTopics(prev => {
      const next = new Set(prev)
      if (next.has(topicName)) next.delete(topicName)
      else next.add(topicName)
      return next
    })
  }

  const handleSave = async () => {
    if (questions.length === 0) return
    setSaving(true)
    setImportMsg('')

    try {
      const existing = await questionService.getExistingQuestionCount(paperId)
      
      const toSave = questions.map((q, idx) => ({
        ...q,
        question_number: idx + 1
      }))

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
      console.error(err)
      toast.error('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
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
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">Google Gemini API Key Required</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                You must configure your personal Gemini API key in Settings before using AI Vision extraction.
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
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-800">AI PDF Extraction &amp; Topic Separation</p>
          <p className="text-xs text-body-secondary mt-0.5">
            Uses Google Gemini AI to analyze scanned PDFs or handwritten notes in Tamil &amp; English. 
            AI automatically extracts questions and categorizes each into its official TNPSC syllabus unit.
          </p>
        </div>
      </div>

      {/* File selector */}
      <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-body-text flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-600" />
            Step 1 &mdash; Upload Handwritten/Scanned PDF
          </div>
          <select 
            value={selectedModel} 
            onChange={e => setSelectedModel(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2 py-1 outline-none focus:border-blue-500 bg-slate-50 max-w-[200px] truncate"
          >
            {modelsList.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </h3>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-600 hover:bg-blue-50/10 transition-all group"
        >
          <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mx-auto mb-2 transition-colors" />
          {file ? (
            <p className="text-xs font-bold text-blue-600">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          ) : (
            <p className="text-xs text-body-secondary">
              Click to select a PDF file (max 20 MB)
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

        {file && !loading && (
          <button
            onClick={handleExtract}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-subtle transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {result ? 'Re-extract Questions' : 'Extract Questions with AI'}
          </button>
        )}
      </div>

      {/* Progress */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
            <p className="text-sm font-bold text-blue-800">
              {statusMsg || 'AI is analyzing the PDF and categorizing questions into syllabus units...'}
            </p>
          </div>
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
              View questions list &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Step 2: Review & Save with Visual Topic Separation */}
      {questions.length > 0 && !loading && (
        <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card space-y-5">
          {/* Top Bar: Review heading & Save button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
            <div>
              <h3 className="text-sm font-bold text-body-text flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                Step 2 &mdash; Review &amp; Save ({questions.length} Questions Extracted)
              </h3>
              <p className="text-xs text-body-secondary mt-0.5">
                Review question breakdown by syllabus unit. You can change any question's unit before saving.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || questions.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-subtle transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : `Save ${questions.length} Questions to Paper`}
            </button>
          </div>

          {/* ── Topic Separation Summary & Filtering ─────────────────────── */}
          <TopicSeparationSummary
            questions={questions}
            selectedTopic={selectedTopic}
            onSelectTopic={setSelectedTopic}
            viewMode={viewMode}
            onToggleViewMode={setViewMode}
            showSeparationToggle={true}
          />

          {/* ── Mode 1: Table View ─────────────────────────────────────────── */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-border text-left text-body-secondary bg-slate-50/50">
                    <th className="py-2.5 px-3 font-bold w-12">#</th>
                    <th className="py-2.5 px-3 font-bold min-w-[240px]">Question</th>
                    <th className="py-2.5 px-3 font-bold min-w-[190px]">Syllabus Unit (Changeable)</th>
                    <th className="py-2.5 px-3 font-bold min-w-[140px]">Micro-Topic</th>
                    <th className="py-2.5 px-3 font-bold">Options (A, B, C, D)</th>
                    <th className="py-2.5 px-3 font-bold w-16 text-center">Correct</th>
                    <th className="py-2.5 px-3 font-bold w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayQuestions.map((row) => {
                    const originalIdx = row.originalIdx
                    const currentUnit = normalizeUnitName(row.unit_name)

                    return (
                      <tr key={originalIdx} className="border-b border-surface-border hover:bg-slate-50/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-body-secondary">{originalIdx + 1}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-body-text line-clamp-2">
                            {row.question_text || row.english_question}
                          </p>
                        </td>
                        <td className="py-2.5 px-3">
                          {/* Unit Dropdown for on-the-fly reclassification */}
                          <select
                            value={currentUnit}
                            onChange={(e) => handleUnitChange(originalIdx, e.target.value)}
                            className="w-full text-[11px] font-semibold text-indigo-900 bg-indigo-50/80 border border-indigo-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                            {OFFICIAL_SYLLABUS_UNITS.map(u => (
                              <option key={u.id} value={u.unit_name}>
                                {u.shortName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] text-body-secondary bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate inline-block max-w-[150px]">
                            {row.micro_topic_name || row.macro_topic_name || 'General'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-body-secondary space-y-0.5">
                          <div className={`truncate max-w-[180px] ${row.correct_option === 'A' ? 'font-bold text-emerald-700' : ''}`}>
                            <span className="font-bold text-slate-400">A:</span> {row.option_a?.slice(0, 30)}
                          </div>
                          <div className={`truncate max-w-[180px] ${row.correct_option === 'B' ? 'font-bold text-emerald-700' : ''}`}>
                            <span className="font-bold text-slate-400">B:</span> {row.option_b?.slice(0, 30)}
                          </div>
                          <div className={`truncate max-w-[180px] ${row.correct_option === 'C' ? 'font-bold text-emerald-700' : ''}`}>
                            <span className="font-bold text-slate-400">C:</span> {row.option_c?.slice(0, 30)}
                          </div>
                          <div className={`truncate max-w-[180px] ${row.correct_option === 'D' ? 'font-bold text-emerald-700' : ''}`}>
                            <span className="font-bold text-slate-400">D:</span> {row.option_d?.slice(0, 30)}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-black inline-flex items-center justify-center text-xs">
                            {row.correct_option || '-'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleDelete(originalIdx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Remove question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Mode 2: Separated by Topic View ────────────────────────────── */}
          {viewMode === 'separated' && (
            <div className="space-y-4">
              {Object.entries(questionsByTopic).map(([topicName, topicQuestions]) => {
                // If a topic is actively filtered, skip others
                if (selectedTopic && topicName !== selectedTopic) return null

                const isCollapsed = collapsedTopics.has(topicName)
                const unitConfig = OFFICIAL_SYLLABUS_UNITS.find(u => u.unit_name === topicName) || {
                  color: 'from-slate-600 to-gray-700',
                  badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
                  shortName: topicName,
                }
                const pct = Math.round((topicQuestions.length / questions.length) * 100)

                return (
                  <div
                    key={topicName}
                    className="border border-surface-border rounded-2xl overflow-hidden bg-white shadow-2xs transition-all"
                  >
                    {/* Topic Section Header */}
                    <div
                      onClick={() => toggleTopicCollapse(topicName)}
                      className="px-4 py-3 bg-slate-50/80 hover:bg-slate-100/70 border-b border-surface-border flex items-center justify-between cursor-pointer transition-colors"
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
                            Questions belonging to this unit in the current paper
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
                      <div className="p-4 space-y-3">
                        {topicQuestions.map((q) => {
                          const originalIdx = q.originalIdx
                          const currentUnit = normalizeUnitName(q.unit_name)

                          return (
                            <div
                              key={originalIdx}
                              className="border border-surface-border/80 rounded-xl p-3.5 bg-slate-50/30 hover:bg-slate-50 hover:border-indigo-200 transition-all space-y-2.5"
                            >
                              {/* Card Top: Number, Micro-Topic, Reassign dropdown, Delete */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                                    Q{originalIdx + 1}
                                  </span>
                                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5">
                                    {q.micro_topic_name || q.macro_topic_name || 'General Concept'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                  <span className="text-[10px] font-bold text-body-secondary">Move unit:</span>
                                  <select
                                    value={currentUnit}
                                    onChange={(e) => handleUnitChange(originalIdx, e.target.value)}
                                    className="text-[10px] font-semibold text-body-text bg-white border border-surface-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                  >
                                    {OFFICIAL_SYLLABUS_UNITS.map(u => (
                                      <option key={u.id} value={u.unit_name}>
                                        {u.shortName}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleDelete(originalIdx)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                    title="Delete question"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Question Stem */}
                              <p className="text-xs font-semibold text-body-text leading-relaxed whitespace-pre-line">
                                {q.question_text || q.english_question}
                              </p>

                              {/* Options Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs pt-1">
                                {['A', 'B', 'C', 'D'].map(letter => {
                                  const optKey = `option_${letter.toLowerCase()}`
                                  const optText = q[optKey]
                                  const isCorrect = q.correct_option === letter

                                  return (
                                    <div
                                      key={letter}
                                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center justify-between ${
                                        isCorrect
                                          ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                                          : 'bg-white border-surface-border text-body-secondary'
                                      }`}
                                    >
                                      <div className="truncate pr-2">
                                        <span className={`font-bold mr-1.5 ${isCorrect ? 'text-emerald-700' : 'text-slate-400'}`}>
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
                          )
                        })}
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

