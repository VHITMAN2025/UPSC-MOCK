import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload, Loader2, Sparkles, CheckCircle2, Eye, Save, Trash2, Edit2, AlertTriangle
} from 'lucide-react'
import { questionService } from '../../services/questionService'
import { useApp } from '../../contexts/AppContext'
import { extractQuestionsWithAi, blobToBase64, fetchAvailableGeminiModels } from '../../services/aiPdfService'
import { apiKeyService } from '../../services/apiKeyService'

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
      setImportMsg('')
      setStatusMsg('')
    }
  }

  const handleExtract = async () => {
    if (!file) return

    const activeKey = geminiApiKey || apiKeyService.getUserApiKey()
    if (!activeKey) {
      toast.error('Google Gemini API Key is required. Please configure your key in Profile & Settings.')
      return
    }

    setLoading(true)
    setStatusMsg('Reading PDF file...')
    setResult(null)
    setQuestions([])

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
      toast.success(`Successfully extracted ${parsedQuestions.length} questions!`)
    } catch (err) {
      console.error(err)
      if (err.message === 'NO_API_KEY_CONFIGURED' || err.code === 'NO_API_KEY_CONFIGURED') {
        toast.error('Gemini API key is missing. Please configure your key in Profile & Settings.')
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
            to="/profile#api-key"
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
          <p className="text-sm font-bold text-blue-800">AI PDF Extraction (Handwritten/Tamil)</p>
          <p className="text-xs text-body-secondary mt-0.5">
            Uses Google Gemini AI to analyze scanned PDFs or handwritten notes in Tamil. 
            It automatically identifies and extracts questions and options (A, B, C, D).
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
              {statusMsg || 'AI is analyzing the PDF. This may take a moment...'}
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

      {/* Step 2: Review & Save */}
      {questions.length > 0 && !loading && (
        <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-body-text flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              Step 2 &mdash; Review &amp; Save ({questions.length} total)
            </h3>
            <button
              onClick={handleSave}
              disabled={saving || questions.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saving ? 'Saving...' : `Save ${questions.length} Questions`}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-border text-left text-body-secondary">
                  <th className="py-2 px-3 font-bold">#</th>
                  <th className="py-2 px-3 font-bold">Question</th>
                  <th className="py-2 px-3 font-bold">A</th>
                  <th className="py-2 px-3 font-bold">B</th>
                  <th className="py-2 px-3 font-bold">C</th>
                  <th className="py-2 px-3 font-bold">D</th>
                  <th className="py-2 px-3 font-bold">Correct</th>
                  <th className="py-2 px-3 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((row, idx) => (
                  <tr key={idx} className="border-b border-surface-border">
                    <td className="py-2 px-3">{idx + 1}</td>
                    <td className="py-2 px-3">{row.question_text.slice(0, 40)}...</td>
                    <td className="py-2 px-3">{row.option_a?.slice(0, 20)}</td>
                    <td className="py-2 px-3">{row.option_b?.slice(0, 20)}</td>
                    <td className="py-2 px-3">{row.option_c?.slice(0, 20)}</td>
                    <td className="py-2 px-3">{row.option_d?.slice(0, 20)}</td>
                    <td className="py-2 px-3 font-bold">{row.correct_option}</td>
                    <td className="py-2 px-3">
                      <button onClick={() => handleDelete(idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
