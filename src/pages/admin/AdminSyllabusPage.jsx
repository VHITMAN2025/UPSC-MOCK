import React, { useState, useEffect, useMemo } from 'react'
import {
  BookMarked, Plus, Edit2, Trash2, ChevronRight, ChevronDown,
  Loader2, X, Save, AlertCircle, Sparkles, Search, Layers,
  CheckCircle2, Tag, Database, RefreshCw
} from 'lucide-react'
import { adminSyllabusService } from '../../services/adminService'
import { useApp, EXAM_OPTIONS } from '../../contexts/AppContext'

export function AdminSyllabusPage() {
  const { toast, selectedExam: globalExam } = useApp()
  const [selectedExam, setSelectedExam] = useState(globalExam || 'TNPSC Group 4')
  const [taxonomyData, setTaxonomyData] = useState(null)
  const [activeUnitIdx, setActiveUnitIdx] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [autoCategorizing, setAutoCategorizing] = useState(false)

  // Modal State for Add / Edit
  const [modalState, setModalState] = useState(null) 
  // { type: 'unit' | 'macro' | 'micro', mode: 'add' | 'edit', data: {}, parentId: null }
  const [savingItem, setSavingItem] = useState(false)

  useEffect(() => {
    loadTaxonomy(selectedExam)
  }, [selectedExam])

  async function loadTaxonomy(exam) {
    setLoading(true)
    try {
      const data = await adminSyllabusService.getFullTaxonomy(exam)
      setTaxonomyData(data)
      setActiveUnitIdx(0)
    } catch (err) {
      console.error('Error loading syllabus taxonomy:', err)
      toast.error('Failed to load syllabus taxonomy: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Auto-Categorize All Uploaded Questions ──────────────────────────────────
  async function handleAutoCategorize() {
    setAutoCategorizing(true)
    try {
      const res = await adminSyllabusService.autoCategorizeAllUploadedQuestions(selectedExam)
      toast.success(
        `Auto-categorized ${res.totalCategorized} questions across uploaded papers and question bank into Level 1, 2, and 3 taxonomy!`
      )
      // Refresh taxonomy question counts
      await loadTaxonomy(selectedExam)
    } catch (err) {
      console.error('Auto-categorize error:', err)
      toast.error('Auto-categorize failed: ' + err.message)
    } finally {
      setAutoCategorizing(false)
    }
  }

  // ── Modal Save Handler ──────────────────────────────────────────────────────
  async function handleSaveModal(formData) {
    if (!modalState) return
    setSavingItem(true)
    try {
      const { type, mode, data: initialData, parentId } = modalState

      if (type === 'unit') {
        if (!formData.unit_name?.trim()) throw new Error('Unit name is required')
        await adminSyllabusService.upsertUnit({
          unit_name: formData.unit_name.trim(),
          unit_number: parseInt(formData.unit_number, 10) || 1,
          subject: formData.subject?.trim() || formData.unit_name.trim(),
          description: formData.description?.trim() || '',
        }, mode === 'edit' ? initialData.unit_id : null)
        toast.success(mode === 'edit' ? 'Unit updated' : 'Unit created')
      } else if (type === 'macro') {
        if (!formData.macro_topic_name?.trim()) throw new Error('Macro-topic name is required')
        await adminSyllabusService.upsertTopic({
          topic_name: formData.macro_topic_name.trim(),
          topic_number: parseInt(formData.topic_number, 10) || 1,
          description: formData.description?.trim() || '',
          unit_id: parentId,
        }, mode === 'edit' ? initialData.macro_topic_id : null)
        toast.success(mode === 'edit' ? 'Macro-Topic updated' : 'Macro-Topic created')
      } else if (type === 'micro') {
        if (!formData.micro_topic_name?.trim()) throw new Error('Micro-topic name is required')
        const rawKeywords = formData.keywords
        const kwArray = Array.isArray(rawKeywords)
          ? rawKeywords
          : (typeof rawKeywords === 'string' ? rawKeywords.split(',').map(s => s.trim()).filter(Boolean) : [])

        await adminSyllabusService.upsertMicroTopic({
          micro_topic_name: formData.micro_topic_name.trim(),
          micro_topic_number: parseInt(formData.micro_topic_number, 10) || 1,
          keywords: kwArray,
          description: formData.description?.trim() || '',
          macro_topic_id: parentId,
        }, mode === 'edit' ? initialData.micro_topic_id : null)
        toast.success(mode === 'edit' ? 'Micro-Topic updated' : 'Micro-Topic created')
      }

      setModalState(null)
      await loadTaxonomy(selectedExam)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingItem(false)
    }
  }

  // ── Delete Handlers ────────────────────────────────────────────────────────
  async function handleDeleteUnit(unit) {
    if (!window.confirm(`Delete unit "${unit.unit_name}" and its subtopics?`)) return
    try {
      await adminSyllabusService.deleteUnit(unit.unit_id)
      await loadTaxonomy(selectedExam)
      toast.success('Unit deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDeleteMacro(macro) {
    if (!window.confirm(`Delete macro-topic "${macro.macro_topic_name}"?`)) return
    try {
      await adminSyllabusService.deleteTopic(macro.macro_topic_id)
      await loadTaxonomy(selectedExam)
      toast.success('Macro-Topic deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDeleteMicro(micro) {
    if (!window.confirm(`Delete micro-topic "${micro.micro_topic_name}"?`)) return
    try {
      await adminSyllabusService.deleteMicroTopic(micro.micro_topic_id)
      await loadTaxonomy(selectedExam)
      toast.success('Micro-Topic deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  // ── Search & Filter ────────────────────────────────────────────────────────
  const units = taxonomyData?.units || []
  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim()) return units
    const q = searchQuery.toLowerCase().trim()
    return units.filter(u => {
      const uMatch = u.unit_name?.toLowerCase().includes(q) || u.subject?.toLowerCase().includes(q)
      const mMatch = u.macro_topics?.some(mt =>
        mt.macro_topic_name?.toLowerCase().includes(q) ||
        mt.micro_topics?.some(mct =>
          mct.micro_topic_name?.toLowerCase().includes(q) ||
          mct.keywords?.some(kw => kw.toLowerCase().includes(q))
        )
      )
      return uMatch || mMatch
    })
  }, [units, searchQuery])

  const activeUnit = filteredUnits[activeUnitIdx] || filteredUnits[0] || units[0]

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ── 1. Top Header & Actions ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-surface-border rounded-2xl p-5 shadow-subtle">
        <div className="flex items-center gap-3.5">
          <div className="relative w-10 h-10 shrink-0">
            <div className="absolute inset-0 bg-[#06b6d4] rounded-xl -rotate-6 opacity-75" />
            <div className="absolute inset-0 bg-[#ec4899] rounded-xl rotate-6 opacity-75" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#635bff] to-[#8b5cf6] rounded-xl flex items-center justify-center shadow-xs">
              <BookMarked className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-body-text tracking-tight">
                Syllabus & Question Taxonomy Manager
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Admin Panel
              </span>
            </div>
            <p className="text-xs text-body-secondary mt-0.5">
              3-Level Hierarchy: <strong>Level 1 (Unit)</strong> › <strong>Level 2 (Macro-Topic)</strong> › <strong>Level 3 (Micro-Topic)</strong>
            </p>
          </div>
        </div>

        {/* Group Selector Pills & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Exam Switcher */}
          <div className="flex items-center gap-1 bg-slate-100/90 border border-slate-200 p-1 rounded-xl">
            {EXAM_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSelectedExam(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedExam === opt.value
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Auto-Categorize Questions Action */}
          <button
            onClick={handleAutoCategorize}
            disabled={autoCategorizing || loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black shadow-subtle transition-all disabled:opacity-50"
            title="Scan and classify all uploaded questions into Level 1, 2, and 3 taxonomy"
          >
            {autoCategorizing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {autoCategorizing ? 'Categorizing Questions…' : 'Auto-Categorize Questions'}
          </button>

          {/* Add Unit Button */}
          <button
            onClick={() => setModalState({
              type: 'unit',
              mode: 'add',
              data: { unit_number: (units.length || 0) + 1, unit_name: '', subject: '', description: '' },
              parentId: null
            })}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-body-text rounded-xl text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Unit
          </button>
        </div>
      </div>

      {/* ── 2. Top Summary KPI Cards (Matching User POV) ───────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#f5f2ff] to-[#f0eeff] border border-[#ddd7ff] rounded-2xl p-4 shadow-subtle">
          <span className="block text-[10px] font-bold text-[#69758a] uppercase tracking-wider">
            TOTAL SYLLABUS UNITS
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <b className="text-2xl sm:text-3xl font-black text-[#635bff]">
              {taxonomyData?.totalUnits ?? 10}
            </b>
            <span className="text-xs font-bold text-indigo-500">Units</span>
          </div>
        </div>

        <div className="bg-white border border-[#e5e8ef] rounded-2xl p-4 shadow-subtle">
          <span className="block text-[10px] font-bold text-[#69758a] uppercase tracking-wider">
            LEVEL 2: MACRO-TOPICS
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <b className="text-2xl sm:text-3xl font-black text-[#172033]">
              {taxonomyData?.totalMacros ?? 40}
            </b>
            <span className="text-xs text-body-secondary font-semibold">Sub-categories</span>
          </div>
        </div>

        <div className="bg-white border border-[#e5e8ef] rounded-2xl p-4 shadow-subtle">
          <span className="block text-[10px] font-bold text-[#69758a] uppercase tracking-wider">
            LEVEL 3: MICRO-TOPICS
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <b className="text-2xl sm:text-3xl font-black text-[#172033]">
              {taxonomyData?.totalMicros ?? 44}
            </b>
            <span className="text-xs text-body-secondary font-semibold">Exact Chapters</span>
          </div>
        </div>

        <div className="bg-white border border-[#e5e8ef] rounded-2xl p-4 shadow-subtle">
          <span className="block text-[10px] font-bold text-[#69758a] uppercase tracking-wider">
            QUESTIONS MAPPED IN BANK
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <b className="text-2xl sm:text-3xl font-black text-emerald-600">
              {taxonomyData?.totalQuestions ?? 0}
            </b>
            <span className="text-xs text-emerald-700 font-semibold">Categorized</span>
          </div>
        </div>
      </div>

      {/* ── 3. Split-Pane Layout (Left: Units List, Right: 3-Level Detail) ─── */}
      <div className="bg-white border border-surface-border rounded-2xl shadow-subtle overflow-hidden flex flex-col md:flex-row min-h-[720px]">
        {/* Left column: 10 Syllabus Units */}
        <div className="w-full md:w-[40%] lg:w-[36%] p-5 border-r border-surface-border bg-slate-50/50 flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-black text-body-text uppercase tracking-wider">
              {filteredUnits.length} Syllabus Units
            </span>
            <span className="text-[11px] text-body-secondary">
              Select unit to inspect hierarchy
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative mb-3.5">
            <Search className="w-3.5 h-3.5 text-body-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search units, topics, or keywords..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-surface-border rounded-xl outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all placeholder:text-body-secondary"
            />
          </div>

          {/* Units list */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-[600px]">
              {filteredUnits.map((unit, idx) => {
                const isSelected = activeUnit?.unit_id === unit.unit_id
                const macroCount = unit.macro_topics?.length || 0
                const microCount = unit.macro_topics?.reduce((s, m) => s + (m.micro_topics?.length || 0), 0) || 0
                const qCount = unit.question_count || 0

                return (
                  <div
                    key={unit.unit_id || idx}
                    onClick={() => setActiveUnitIdx(idx)}
                    className={`border rounded-2xl p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-2 border-indigo-600 bg-indigo-50/50 shadow-sm'
                        : 'border-surface-border bg-white hover:border-indigo-200 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {unit.unit_number ?? (idx + 1)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-black truncate leading-snug ${
                            isSelected ? 'text-indigo-950' : 'text-body-text'
                          }`}>
                            {unit.unit_name}
                          </p>
                          <p className="text-[10px] text-body-secondary truncate mt-0.5">
                            {unit.subject || 'General Studies'}
                          </p>
                        </div>
                      </div>

                      {/* Question count badge */}
                      <span className={`text-[10px] font-black rounded-full px-2 py-0.5 shrink-0 border ${
                        qCount > 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {qCount} Qs
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px] text-body-secondary">
                      <span>{macroCount} Macro-Topics</span>
                      <span>·</span>
                      <span>{microCount} Micro-Topics</span>
                    </div>
                  </div>
                )
              })}

              {filteredUnits.length === 0 && (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-surface-border">
                  <p className="text-xs text-body-secondary">No matching units found.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: Unit Detail & Level 2 / Level 3 Taxonomy Tree */}
        <div className="w-full md:w-[60%] lg:w-[64%] p-6 overflow-y-auto flex flex-col space-y-6">
          {activeUnit ? (
            <>
              {/* Unit Level 1 Card */}
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border border-surface-border rounded-2xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {activeUnit.unit_number ?? '1'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                          Level 1: Unit
                        </span>
                        <span className="text-xs font-semibold text-body-secondary">
                          {activeUnit.subject}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-body-text mt-0.5">
                        {activeUnit.unit_name}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => setModalState({
                        type: 'unit',
                        mode: 'edit',
                        data: activeUnit,
                        parentId: null
                      })}
                      className="p-1.5 hover:bg-white rounded-lg text-body-secondary hover:text-indigo-600 border border-transparent hover:border-surface-border transition-all"
                      title="Edit Unit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUnit(activeUnit)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-body-secondary hover:text-red-600 border border-transparent hover:border-red-100 transition-all"
                      title="Delete Unit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {activeUnit.description && (
                  <p className="text-xs text-body-secondary leading-relaxed bg-white/70 p-3 rounded-xl border border-slate-100">
                    {activeUnit.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs font-semibold text-body-secondary pt-1">
                  <span>Macro-Topics: <b className="text-body-text">{activeUnit.macro_topics?.length || 0}</b></span>
                  <span>·</span>
                  <span>
                    Micro-Topics: <b className="text-body-text">
                      {activeUnit.macro_topics?.reduce((s, m) => s + (m.micro_topics?.length || 0), 0) || 0}
                    </b>
                  </span>
                  <span>·</span>
                  <span>
                    Question Bank: <b className="text-emerald-600">{activeUnit.question_count || 0} questions</b>
                  </span>
                </div>
              </div>

              {/* Level 2 & Level 3 Taxonomy Tree */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-black text-body-text uppercase tracking-wider">
                      Taxonomy Breakdown — Level 2 (Macro-Topic) &amp; Level 3 (Micro-Topic)
                    </h3>
                  </div>

                  <button
                    onClick={() => setModalState({
                      type: 'macro',
                      mode: 'add',
                      data: {
                        topic_number: (activeUnit.macro_topics?.length || 0) + 1,
                        macro_topic_name: '',
                        description: ''
                      },
                      parentId: activeUnit.unit_id
                    })}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Macro-Topic
                  </button>
                </div>

                {/* Macro-topics list */}
                {(activeUnit.macro_topics || []).map((macro, mIdx) => (
                  <div
                    key={macro.macro_topic_id || mIdx}
                    className="bg-white border border-surface-border rounded-2xl overflow-hidden shadow-xs hover:border-indigo-100 transition-all"
                  >
                    {/* Level 2 Header */}
                    <div className="bg-slate-50/80 px-4 py-3 border-b border-surface-border flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 shrink-0">
                          Level 2: Macro
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          #{macro.macro_topic_number ?? (mIdx + 1)}
                        </span>
                        <h4 className="text-sm font-black text-body-text truncate">
                          {macro.macro_topic_name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                          {macro.question_count || 0} Qs
                        </span>
                        <button
                          onClick={() => setModalState({
                            type: 'micro',
                            mode: 'add',
                            data: {
                              micro_topic_number: (macro.micro_topics?.length || 0) + 1,
                              micro_topic_name: '',
                              keywords: '',
                              description: ''
                            },
                            parentId: macro.macro_topic_id
                          })}
                          className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline px-2 py-1 bg-white rounded-lg border border-surface-border hover:border-indigo-200"
                        >
                          <Plus className="w-3 h-3" /> Micro-Topic
                        </button>
                        <button
                          onClick={() => setModalState({
                            type: 'macro',
                            mode: 'edit',
                            data: macro,
                            parentId: activeUnit.unit_id
                          })}
                          className="p-1 hover:bg-white rounded text-body-secondary hover:text-body-text"
                          title="Edit Macro-Topic"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteMacro(macro)}
                          className="p-1 hover:bg-red-50 rounded text-body-secondary hover:text-red-600"
                          title="Delete Macro-Topic"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Level 3 Micro-Topics List */}
                    <div className="p-4 space-y-2.5 bg-white">
                      {(macro.micro_topics || []).map((micro, mcIdx) => (
                        <div
                          key={micro.micro_topic_id || mcIdx}
                          className="border border-slate-100 rounded-xl p-3 bg-slate-50/40 hover:bg-slate-50 hover:border-indigo-100 transition-all space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                                Level 3: Micro
                              </span>
                              <span className="text-xs font-bold text-slate-400">
                                {micro.micro_topic_number ?? (mcIdx + 1)}.
                              </span>
                              <span className="text-xs font-bold text-body-text truncate">
                                {micro.micro_topic_name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-bold text-slate-500">
                                {micro.question_count || 0} Qs mapped
                              </span>
                              <button
                                onClick={() => setModalState({
                                  type: 'micro',
                                  mode: 'edit',
                                  data: micro,
                                  parentId: macro.macro_topic_id
                                })}
                                className="p-1 hover:bg-white rounded text-body-secondary hover:text-body-text"
                                title="Edit Micro-Topic & Keywords"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteMicro(micro)}
                                className="p-1 hover:bg-red-50 rounded text-body-secondary hover:text-red-600"
                                title="Delete Micro-Topic"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Classification Keywords Pills */}
                          {micro.keywords && micro.keywords.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[10px] text-body-secondary font-medium flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5 text-indigo-400" /> Keywords:
                              </span>
                              {micro.keywords.slice(0, 10).map((kw, kIdx) => (
                                <span
                                  key={kIdx}
                                  className="text-[10px] bg-white border border-slate-200 text-slate-600 rounded px-1.5 py-0.5 font-medium"
                                >
                                  {kw}
                                </span>
                              ))}
                              {micro.keywords.length > 10 && (
                                <span className="text-[9px] text-slate-400">
                                  +{micro.keywords.length - 10} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {(!macro.micro_topics || macro.micro_topics.length === 0) && (
                        <p className="text-xs text-body-secondary italic text-center py-2">
                          No micro-topics defined yet. Click "+ Micro-Topic" above.
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {(!activeUnit.macro_topics || activeUnit.macro_topics.length === 0) && (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-surface-border">
                    <p className="text-xs text-body-secondary">
                      No macro-topics for this unit. Click "+ Add Macro-Topic" to start.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center flex-1 text-center py-20 text-body-secondary">
              <p className="text-sm">Select a syllabus unit from the left to view details.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Unified Modal Editor for Unit / Macro / Micro ───────────────── */}
      {modalState && (
        <TaxonomyModal
          state={modalState}
          saving={savingItem}
          onSave={handleSaveModal}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  )
}

function TaxonomyModal({ state, saving, onSave, onClose }) {
  const { type, mode, data: initial = {} } = state
  const [form, setForm] = useState({
    unit_number: initial.unit_number || 1,
    unit_name: initial.unit_name || '',
    subject: initial.subject || '',
    topic_number: initial.macro_topic_number || initial.topic_number || 1,
    macro_topic_name: initial.macro_topic_name || initial.topic_name || '',
    micro_topic_number: initial.micro_topic_number || 1,
    micro_topic_name: initial.micro_topic_name || '',
    keywords: Array.isArray(initial.keywords) ? initial.keywords.join(', ') : (initial.keywords || ''),
    description: initial.description || '',
  })

  function handleSubmit(e) {
    e.preventDefault()
    onSave(form)
  }

  const title = (() => {
    const act = mode === 'add' ? 'Add New' : 'Edit'
    if (type === 'unit') return `${act} Level 1: Unit`
    if (type === 'macro') return `${act} Level 2: Macro-Topic`
    return `${act} Level 3: Micro-Topic`
  })()

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-surface-border shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-slate-50">
          <h3 className="text-sm font-black text-body-text">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {type === 'unit' && (
            <>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-body-secondary uppercase mb-1">
                    Number *
                  </label>
                  <input
                    type="number"
                    value={form.unit_number}
                    onChange={e => setForm(f => ({ ...f, unit_number: e.target.value }))}
                    className="w-full border border-surface-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-600"
                    required
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] font-bold text-body-secondary uppercase mb-1">
                    Unit Name *
                  </label>
                  <input
                    type="text"
                    value={form.unit_name}
                    onChange={e => setForm(f => ({ ...f, unit_name: e.target.value }))}
                    placeholder="e.g. Unit 1 — General Science"
                    className="w-full border border-surface-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-600"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-body-secondary uppercase mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="e.g. General Science"
                  className="w-full border border-surface-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </>
          )}

          {type === 'macro' && (
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-body-secondary uppercase mb-1">
                  Topic #
                </label>
                <input
                  type="number"
                  value={form.topic_number}
                  onChange={e => setForm(f => ({ ...f, topic_number: e.target.value }))}
                  className="w-full border border-surface-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-[10px] font-bold text-body-secondary uppercase mb-1">
                  Macro-Topic Name (Level 2) *
                </label>
                <input
                  type="text"
                  value={form.macro_topic_name}
                  onChange={e => setForm(f => ({ ...f, macro_topic_name: e.target.value }))}
                  placeholder="e.g. Physics"
                  className="w-full border border-surface-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-600"
                  required
                />
              </div>
            </div>
          )}

          {type === 'micro' && (
            <>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-body-secondary uppercase mb-1">
                    Micro #
                  </label>
                  <input
                    type="number"
                    value={form.micro_topic_number}
                    onChange={e => setForm(f => ({ ...f, micro_topic_number: e.target.value }))}
                    className="w-full border border-surface-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] font-bold text-body-secondary uppercase mb-1">
                    Micro-Topic Name (Level 3 Chapter) *
                  </label>
                  <input
                    type="text"
                    value={form.micro_topic_name}
                    onChange={e => setForm(f => ({ ...f, micro_topic_name: e.target.value }))}
                    placeholder="e.g. Mechanics, Force, Motion & Properties of Matter"
                    className="w-full border border-surface-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-600"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-body-secondary uppercase mb-1">
                  Classification Keywords (comma separated)
                </label>
                <input
                  type="text"
                  value={form.keywords}
                  onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                  placeholder="e.g. force, motion, newton, gravity, விசை, இயக்கம்"
                  className="w-full border border-surface-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-600"
                />
                <p className="text-[10px] text-body-secondary mt-1">
                  Used by the auto-categorization engine to match uploaded questions to this micro-topic.
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-bold text-body-secondary uppercase mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Scope, topics covered, reference notes..."
              className="w-full border border-surface-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-600 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-surface-border rounded-xl text-xs font-semibold text-body-secondary hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow-subtle disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
