import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { questionSchema } from '../../lib/validations'
import { questionService } from '../../services/questionService'
import { paperService } from '../../services/paperService'
import { ArrowLeft, PlusCircle, Edit, Trash2, Search, CheckCircle2, AlertCircle, Loader2, Save, X } from 'lucide-react'

export function QuestionManagementPage() {
  const { paperId } = useParams()

  const [paper, setPaper] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)

  const [serverError, setServerError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question_number: 1,
      question_text: '',
      question_text_tamil: '',
      option_a: '',
      option_a_tamil: '',
      option_b: '',
      option_b_tamil: '',
      option_c: '',
      option_c_tamil: '',
      option_d: '',
      option_d_tamil: '',
      correct_option: 'A',
      explanation: '',
      explanation_tamil: '',
      group_tag: 'Group 4',
      unit_tag: 'Unit 1',
      macro_topic: '',
      micro_topic: '',
      exam_year: '2024',
      is_pyq: false,
    }
  })

  const watchFormValues = watch()

  const loadQuestions = async () => {
    try {
      const [paperData, qList] = await Promise.all([
        paperService.getPaperById(paperId),
        questionService.getQuestionsByPaperId(paperId, false)
      ])
      setPaper(paperData)
      setQuestions(qList || [])
    } catch (err) {
      console.error('Error fetching questions:', err)
      setServerError(err.message || 'Failed to load paper questions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [paperId])

  const openAddModal = () => {
    setEditingQuestion(null)
    const nextQNum = questions.length > 0
      ? Math.max(...questions.map(q => q.question_number)) + 1
      : 1

    reset({
      question_number: nextQNum,
      question_text: '',
      question_text_tamil: '',
      option_a: '',
      option_a_tamil: '',
      option_b: '',
      option_b_tamil: '',
      option_c: '',
      option_c_tamil: '',
      option_d: '',
      option_d_tamil: '',
      correct_option: 'A',
      explanation: '',
      explanation_tamil: '',
      group_tag: paper?.exam_name?.includes('Group 1') ? 'Group 1' : paper?.exam_name?.includes('Group 2') ? 'Group 2/2A' : 'Group 4',
      unit_tag: 'Unit 1',
      macro_topic: '',
      micro_topic: '',
      exam_year: paper?.year ? String(paper.year) : '2024',
      is_pyq: false,
    })
    setShowModal(true)
  }

  const openEditModal = (q) => {
    setEditingQuestion(q)
    reset({
      question_number: q.question_number,
      question_text: q.question_text || '',
      question_text_tamil: q.question_text_tamil || '',
      option_a: q.option_a || '',
      option_a_tamil: q.option_a_tamil || '',
      option_b: q.option_b || '',
      option_b_tamil: q.option_b_tamil || '',
      option_c: q.option_c || '',
      option_c_tamil: q.option_c_tamil || '',
      option_d: q.option_d || '',
      option_d_tamil: q.option_d_tamil || '',
      correct_option: q.correct_option || 'A',
      explanation: q.explanation || '',
      explanation_tamil: q.explanation_tamil || '',
      group_tag: q.group_tag || q.group_name || 'Group 4',
      unit_tag: q.unit_tag || (q.unit_name ? q.unit_name.split('—')[0].trim() : 'Unit 1'),
      macro_topic: q.macro_topic || q.macro_topic_name || '',
      micro_topic: q.micro_topic || q.micro_topic_name || '',
      exam_year: q.exam_year ? String(q.exam_year) : (q.year ? String(q.year) : '2024'),
      is_pyq: Boolean(q.is_pyq),
    })
    setShowModal(true)
  }

  const handleDelete = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return
    try {
      await questionService.deleteQuestion(questionId, paperId)
      setSuccessMsg('Question deleted.')
      await loadQuestions()
    } catch (err) {
      console.error('Delete error:', err)
      setServerError(err.message || 'Failed to delete question.')
    }
  }

  const onSubmit = async (formData) => {
    setServerError(null)
    setSubmitting(true)

    try {
      if (editingQuestion) {
        await questionService.updateQuestion(editingQuestion.id, {
          ...formData,
          paper_id: paperId
        })
        setSuccessMsg('Question updated successfully.')
      } else {
        await questionService.createQuestion({
          ...formData,
          paper_id: paperId
        })
        setSuccessMsg('Question added successfully.')
      }

      setShowModal(false)
      await loadQuestions()
    } catch (err) {
      console.error('Save question error:', err)
      setServerError(err.message || 'Failed to save question.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredQuestions = questions.filter(
    q => q.question_text.toLowerCase().includes(search.toLowerCase()) ||
         String(q.question_number).includes(search)
  )

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
        <p className="text-xs text-body-secondary font-medium">Loading questions list...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/admin/papers" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-body-secondary hover:text-primary transition-colors mb-1">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Papers List</span>
          </Link>
          <h1 className="text-2xl font-bold text-body-text">{paper?.title} — Question Manager</h1>
          <p className="text-xs text-body-secondary mt-0.5">
            Total Questions Indexed: <strong>{questions.length}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to={`/admin/papers/${paperId}/import`}
            className="px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg text-xs transition-colors"
          >
            Import JSON/CSV
          </Link>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold shadow-subtle flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Single Question</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {serverError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-status-error text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-status-success text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white p-3 rounded-xl border border-surface-border shadow-card flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search question text or question number..."
          className="w-full text-xs text-body-text outline-none bg-transparent"
        />
      </div>

      {/* Questions List Table / Accordion */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-xl border border-surface-border p-12 text-center text-body-secondary text-xs">
          No questions added to this paper yet. Click "Add Single Question" or "Import JSON/CSV".
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => (
            <div key={q.id} className="bg-white rounded-xl border border-surface-border p-5 shadow-card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-7 h-7 bg-primary text-white font-bold text-xs rounded-lg flex items-center justify-center">
                    Q{q.question_number}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Key: {q.correct_option || 'None'}
                  </span>
                  {(q.group_tag || q.group_name) && (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {q.group_tag || q.group_name}
                    </span>
                  )}
                  {(q.unit_tag || q.unit_name) && (
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 max-w-[220px] truncate" title={q.unit_tag || q.unit_name}>
                      {q.unit_tag || q.unit_name}
                    </span>
                  )}
                  {(q.micro_topic || q.micro_topic_name) && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 max-w-[200px] truncate" title={q.micro_topic || q.micro_topic_name}>
                      {q.micro_topic || q.micro_topic_name}
                    </span>
                  )}
                  {(q.is_pyq || q.exam_year) && (
                    <span className="text-[11px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                      PYQ {q.exam_year || ''}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(q)}
                    className="p-1.5 text-body-secondary hover:text-primary hover:bg-slate-100 rounded"
                    title="Edit Question & Metadata"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-1.5 text-body-secondary hover:text-status-error hover:bg-red-50 rounded"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium text-body-text leading-relaxed whitespace-pre-line">
                  {q.question_text}
                </p>
                {q.question_text_tamil && (
                  <p className="text-xs font-medium text-body-secondary leading-relaxed font-tamil">
                    {q.question_text_tamil}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-body-secondary pt-1">
                <div className={`p-2.5 rounded-lg border ${q.correct_option === 'A' ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold' : 'border-surface-border'}`}>
                  <div>(A) {q.option_a}</div>
                  {q.option_a_tamil && <div className="text-[11px] text-body-secondary font-tamil mt-0.5">{q.option_a_tamil}</div>}
                </div>
                <div className={`p-2.5 rounded-lg border ${q.correct_option === 'B' ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold' : 'border-surface-border'}`}>
                  <div>(B) {q.option_b}</div>
                  {q.option_b_tamil && <div className="text-[11px] text-body-secondary font-tamil mt-0.5">{q.option_b_tamil}</div>}
                </div>
                <div className={`p-2.5 rounded-lg border ${q.correct_option === 'C' ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold' : 'border-surface-border'}`}>
                  <div>(C) {q.option_c}</div>
                  {q.option_c_tamil && <div className="text-[11px] text-body-secondary font-tamil mt-0.5">{q.option_c_tamil}</div>}
                </div>
                <div className={`p-2.5 rounded-lg border ${q.correct_option === 'D' ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold' : 'border-surface-border'}`}>
                  <div>(D) {q.option_d}</div>
                  {q.option_d_tamil && <div className="text-[11px] text-body-secondary font-tamil mt-0.5">{q.option_d_tamil}</div>}
                </div>
              </div>

              {q.explanation && (
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2 space-y-1">
                  <p><strong>Explanation:</strong> {q.explanation}</p>
                  {q.explanation_tamil && <p className="font-tamil text-slate-500">{q.explanation_tamil}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Question Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-modal border border-surface-border max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-body-text">
                  {editingQuestion ? `Edit Question #${editingQuestion.question_number}` : 'Add New Structured TNPSC Question'}
                </h3>
                <p className="text-xs text-body-secondary">
                  Configure strict syllabus hierarchy metadata, bilingual text, and verified answer keys.
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-500 hover:text-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* ── Metadata Identifiers & Syllabus Hierarchy ────────────────── */}
              <div className="bg-slate-50 p-4 rounded-xl border border-surface-border space-y-3">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📌 5 Required Metadata Identifiers</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-body-text mb-1">
                      1. Exam Group
                    </label>
                    <select
                      {...register('group_tag')}
                      className="w-full px-3 py-2 rounded-lg border border-surface-border text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Group 4">TNPSC Group 4</option>
                      <option value="Group 1">TNPSC Group 1</option>
                      <option value="Group 2/2A">TNPSC Group 2/2A</option>
                      <option value="General">General TNPSC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-body-text mb-1">
                      2. Syllabus Unit
                    </label>
                    <select
                      {...register('unit_tag')}
                      className="w-full px-3 py-2 rounded-lg border border-surface-border text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Unit 1">Unit 1 — General Science</option>
                      <option value="Unit 2">Unit 2 — Current Events</option>
                      <option value="Unit 3">Unit 3 — Geography of India</option>
                      <option value="Unit 4">Unit 4 — History and Culture of India</option>
                      <option value="Unit 5">Unit 5 — Indian Polity</option>
                      <option value="Unit 6">Unit 6 — Indian Economy</option>
                      <option value="Unit 7">Unit 7 — Indian National Movement</option>
                      <option value="Unit 8">Unit 8 — History & Heritage of TN</option>
                      <option value="Unit 9">Unit 9 — Development Admin in TN</option>
                      <option value="Unit 10">Unit 10 — Aptitude & Mental Ability</option>
                      <option value="Unit 11">Unit 11 — General Tamil / English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-body-text mb-1">
                      Exam Year &amp; PYQ
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        {...register('exam_year')}
                        placeholder="e.g. 2024"
                        className="w-20 px-3 py-2 rounded-lg border border-surface-border text-xs bg-white outline-none focus:ring-2 focus:ring-primary font-bold"
                      />
                      <label className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('is_pyq')}
                          className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                        />
                        <span>Official PYQ</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-body-text mb-1">
                      3. Macro-Topic (Sub-Category)
                    </label>
                    <input
                      type="text"
                      {...register('macro_topic')}
                      placeholder="e.g. Water Resources & Rivers, Indian Polity"
                      className="w-full px-3 py-2 rounded-lg border border-surface-border text-xs bg-white outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-body-text mb-1">
                      4. Micro-Topic (Exact Chapter / Concept)
                    </label>
                    <input
                      type="text"
                      {...register('micro_topic')}
                      placeholder="e.g. Tamil Nadu Rivers (Cauvery, Vaigai)"
                      className="w-full px-3 py-2 rounded-lg border border-surface-border text-xs bg-white outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* ── Question Number & Stem ──────────────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-xs font-bold text-body-text uppercase tracking-wider mb-1">
                      Question Number
                    </label>
                    <input
                      type="number"
                      {...register('question_number')}
                      className="w-24 px-3 py-2 rounded-lg border border-surface-border text-xs focus:ring-2 focus:ring-primary outline-none font-bold"
                    />
                    {errors.question_number && <p className="text-xs text-status-error">{errors.question_number.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-body-text uppercase tracking-wider mb-1">
                    Question Text (English)
                  </label>
                  <textarea
                    rows={3}
                    {...register('question_text')}
                    placeholder="Enter full English question description..."
                    className="w-full px-3 py-2 rounded-xl border border-surface-border text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                  {errors.question_text && <p className="text-xs text-status-error">{errors.question_text.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-body-text uppercase tracking-wider mb-1 font-tamil">
                    Question Text (தமிழ் / Tamil Translation)
                  </label>
                  <textarea
                    rows={3}
                    {...register('question_text_tamil')}
                    placeholder="கேள்வி விளக்கம் தமிழிலும் உள்ளிடவும்..."
                    className="w-full px-3 py-2 rounded-xl border border-surface-border text-xs focus:ring-2 focus:ring-primary outline-none font-tamil"
                  />
                </div>
              </div>

              {/* ── Options A, B, C, D (English & Tamil) ────────────────────── */}
              <div className="space-y-3 border-t border-surface-border pt-3">
                <h4 className="text-xs font-bold text-body-text uppercase tracking-wider">
                  Options (English &amp; தமிழ்)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-surface-border space-y-1.5">
                    <label className="block text-xs font-bold text-body-text">Option A (English)</label>
                    <input
                      type="text"
                      {...register('option_a')}
                      className="w-full px-3 py-1.5 rounded-lg border border-surface-border text-xs bg-white outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.option_a && <p className="text-xs text-status-error">{errors.option_a.message}</p>}
                    <label className="block text-[11px] font-semibold text-body-secondary font-tamil">Option A (தமிழ்)</label>
                    <input
                      type="text"
                      {...register('option_a_tamil')}
                      placeholder="விருப்பம் A"
                      className="w-full px-3 py-1.5 rounded-lg border border-surface-border text-xs bg-white outline-none focus:ring-2 focus:ring-primary font-tamil"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-surface-border space-y-1.5">
                    <label className="block text-xs font-bold text-body-text">Option B (English)</label>
                    <input
                      type="text"
                      {...register('option_b')}
                      className="w-full px-3 py-1.5 rounded-lg border border-surface-border text-xs bg-white outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.option_b && <p className="text-xs text-status-error">{errors.option_b.message}</p>}
                    <label className="block text-[11px] font-semibold text-body-secondary font-tamil">Option B (தமிழ்)</label>
                    <input
                      type="text"
                      {...register('option_b_tamil')}
                      placeholder="விருப்பம் B"
                      className="w-full px-3 py-1.5 rounded-lg border border-surface-border text-xs bg-white outline-none focus:ring-2 focus:ring-primary font-tamil"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-surface-border space-y-1.5">
                    <label className="block text-xs font-bold text-body-text">Option C (English)</label>
                    <input
                      type="text"
                      {...register('option_c')}
                      className="w-full px-3 py-1.5 rounded-lg border border-surface-border text-xs bg-white outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.option_c && <p className="text-xs text-status-error">{errors.option_c.message}</p>}
                    <label className="block text-[11px] font-semibold text-body-secondary font-tamil">Option C (தமிழ்)</label>
                    <input
                      type="text"
                      {...register('option_c_tamil')}
                      placeholder="விருப்பம் C"
                      className="w-full px-3 py-1.5 rounded-lg border border-surface-border text-xs bg-white outline-none focus:ring-2 focus:ring-primary font-tamil"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-surface-border space-y-1.5">
                    <label className="block text-xs font-bold text-body-text">Option D (English)</label>
                    <input
                      type="text"
                      {...register('option_d')}
                      className="w-full px-3 py-1.5 rounded-lg border border-surface-border text-xs bg-white outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.option_d && <p className="text-xs text-status-error">{errors.option_d.message}</p>}
                    <label className="block text-[11px] font-semibold text-body-secondary font-tamil">Option D (தமிழ்)</label>
                    <input
                      type="text"
                      {...register('option_d_tamil')}
                      placeholder="விருப்பம் D"
                      className="w-full px-3 py-1.5 rounded-lg border border-surface-border text-xs bg-white outline-none focus:ring-2 focus:ring-primary font-tamil"
                    />
                  </div>
                </div>
              </div>

              {/* ── Correct Answer Key ───────────────────────────────────────── */}
              <div className="border-t border-surface-border pt-3">
                <label className="block text-xs font-bold text-body-text uppercase tracking-wider mb-1">
                  Select Correct Answer Key
                </label>
                <select
                  {...register('correct_option')}
                  className="w-full sm:w-56 px-3 py-2 rounded-lg border border-emerald-300 text-xs font-bold text-emerald-900 bg-emerald-50 outline-none"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              {/* ── Explanation ──────────────────────────────────────────────── */}
              <div className="space-y-3 border-t border-surface-border pt-3">
                <div>
                  <label className="block text-xs font-bold text-body-text uppercase tracking-wider mb-1">
                    Solution Rationale &amp; Reference (English)
                  </label>
                  <textarea
                    rows={2}
                    {...register('explanation')}
                    placeholder="Provide reference rationale and facts..."
                    className="w-full px-3 py-2 rounded-xl border border-surface-border text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-body-text uppercase tracking-wider mb-1 font-tamil">
                    Solution Rationale (தமிழ் / Tamil)
                  </label>
                  <textarea
                    rows={2}
                    {...register('explanation_tamil')}
                    placeholder="தமிழ் விடை விளக்கம்..."
                    className="w-full px-3 py-2 rounded-xl border border-surface-border text-xs focus:ring-2 focus:ring-primary outline-none font-tamil"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-surface-border flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-surface-border rounded-lg text-xs font-semibold text-body-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold shadow-subtle flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Question to Database</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

