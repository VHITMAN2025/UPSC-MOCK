import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload, Loader2, Sparkles, CheckCircle2, Eye, Save, Trash2, Edit2
} from 'lucide-react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { questionService } from '../../services/questionService'
import { useApp } from '../../contexts/AppContext'

export default function AiPdfTab({ paperId, paperTitle, onImportSuccess }) {
  const { toast } = useApp()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [questions, setQuestions] = useState([])
  const [importMsg, setImportMsg] = useState('')
  const [modelsList, setModelsList] = useState([
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Recommended)' }
  ])
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash')
  const fileRef = useRef(null)

  useEffect(() => {
    const fetchModels = async () => {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey || apiKey.includes('your_gemini')) return
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
        const data = await res.json()
        if (data.models) {
          const validModels = data.models
            .filter(m => m.supportedGenerationMethods.includes('generateContent') && m.name.includes('gemini'))
            .map(m => ({ id: m.name.split('/')[1], name: m.displayName || m.name.split('/')[1] }))
          
          if (validModels.length > 0) {
            setModelsList(validModels)
            // Auto-select 3.8 flash if available, else first in list
            const has38 = validModels.find(m => m.id === 'gemini-3.8-flash')
            setSelectedModel(has38 ? 'gemini-3.8-flash' : validModels[0].id)
          }
        }
      } catch (e) {
        console.error("Failed to fetch models", e)
      }
    }
    fetchModels()
  }, [])
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
      setQuestions([])
      setImportMsg('')
    }
  }

  const handleExtract = async () => {
    if (!file) return

    setLoading(true)
    setResult(null)
    setQuestions([])

    try {
      // 1. Read file as base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const base64Data = e.target.result.split(',')[1]

          // 2. Initialize Gemini API
          const apiKey = import.meta.env.VITE_GEMINI_API_KEY
          if (!apiKey) {
            throw new Error("VITE_GEMINI_API_KEY is not set in .env")
          }

          const genAI = new GoogleGenerativeAI(apiKey)
          const model = genAI.getGenerativeModel({ model: selectedModel })

          // 3. Prompt for extraction
          const prompt = `You are a helpful assistant that extracts questions and multiple-choice options from handwritten or scanned Tamil PDFs. 
          Extract all the questions and their options (A, B, C, D) from this document.
          Format the output ONLY as a JSON array of objects. Do not include markdown code blocks or any other text.
          Each object must have the following keys:
          - "question_number": integer
          - "question_text": string (the Tamil text of the question)
          - "option_a": string
          - "option_b": string
          - "option_c": string
          - "option_d": string
          - "correct_option": string ("A", "B", "C", or "D") - if not marked, guess or leave null
          - "explanation": string (any explanation or leave empty)
          `

          // 4. Call API
          const response = await model.generateContent([
            prompt,
            {
              inlineData: {
                data: base64Data,
                mimeType: "application/pdf"
              }
            }
          ])

          const text = response.response.text()
          
          // 5. Parse JSON
          // Strip potential markdown code blocks if the model ignored instructions
          const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
          let parsedQuestions = []
          try {
            parsedQuestions = JSON.parse(cleanedText)
          } catch (err) {
            console.error("Failed to parse JSON from AI:", cleanedText)
            throw new Error("AI returned malformed JSON. Please try again.")
          }

          setQuestions(parsedQuestions)
          setResult({
            totalQuestions: parsedQuestions.length,
          })
          setLoading(false)
        } catch (err) {
          console.error(err)
          toast.error(err.message || "Failed to process PDF.")
          setLoading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error(err)
      toast.error(err.message || "Failed to read file.")
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
            <p className="text-sm font-bold text-blue-800">AI is analyzing the PDF. This may take a minute...</p>
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
