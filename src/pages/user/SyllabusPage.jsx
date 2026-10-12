import React from 'react'
import { BookMarked } from 'lucide-react'
import { useApp, EXAM_OPTIONS } from '../../contexts/AppContext'
import { InteractiveSyllabusTree } from '../../components/tnpsc/InteractiveSyllabus'

export function SyllabusPage() {
  const { selectedExam, setSelectedExam } = useApp()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header + Group Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tnpsc-brand-light text-tnpsc-brand flex items-center justify-center shrink-0">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-body-text">Interactive Syllabus & Topic Analytics</h1>
            <p className="text-xs text-body-secondary">
              {selectedExam} — Real-time Coverage (%) & Accuracy (%) across Unit → Macro-Topic → Micro-Topic
            </p>
          </div>
        </div>

        {/* Group / Exam Selector Pills */}
        <div className="flex items-center gap-1.5 bg-white border border-surface-border rounded-xl p-1 shadow-subtle self-start sm:self-auto">
          {EXAM_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSelectedExam(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedExam === opt.value
                  ? 'bg-tnpsc-brand text-white shadow-sm'
                  : 'text-body-secondary hover:text-body-text hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive 3-Level Syllabus Tree & Analytics */}
      <InteractiveSyllabusTree key={selectedExam} />
    </div>
  )
}
