import React, { useState } from 'react'
import { Bookmark, CheckCircle2, XCircle, AlertCircle, Sparkles, Globe, Calendar, Layers } from 'lucide-react'

export function QuestionCard({
  question,
  totalQuestions,
  selectedOption,
  onSelectOption,
  onClearOption,
  isMarkedForReview,
  onToggleMarkForReview,
  mode = 'exam', // 'exam' | 'review'
  correctOption = null,
  explanation = null,
  language: initialLanguage = 'english' // 'english' | 'tamil'
}) {
  const [activeLang, setActiveLang] = useState(initialLanguage)

  // Determine available bilingual texts
  const hasTamil = Boolean(
    question.question_text_tamil ||
    question.option_a_tamil ||
    question.option_b_tamil ||
    question.tamil_question
  )

  const currentLang = hasTamil ? activeLang : 'english'

  const options = [
    { 
      key: 'A', 
      textEn: question.option_a || '',
      textTa: question.option_a_tamil || question.option_a || '',
    },
    { 
      key: 'B', 
      textEn: question.option_b || '',
      textTa: question.option_b_tamil || question.option_b || '',
    },
    { 
      key: 'C', 
      textEn: question.option_c || '',
      textTa: question.option_c_tamil || question.option_c || '',
    },
    { 
      key: 'D', 
      textEn: question.option_d || '',
      textTa: question.option_d_tamil || question.option_d || '',
    },
    {
      key: 'E',
      textEn: question.option_e || 'Answer not known',
      textTa: question.option_e_tamil || 'விடை தெரியவில்லை',
      isOptionE: true,
    }
  ]

  const textEn = question.question_text || ''
  const textTa = question.question_text_tamil || question.tamil_question || ''

  const isReviewMode = mode === 'review'
  const isCorrect = isReviewMode && selectedOption === correctOption
  const isUnanswered = isReviewMode && !selectedOption

  // Metadata labels
  const groupLabel = question.group_name || (question.group_tag ? `TNPSC ${question.group_tag}` : 'TNPSC Exam')
  const unitLabel = question.unit_name || question.unit_tag || null
  const microLabel = question.micro_topic_name || question.micro_topic || question.topic_name || null
  const isPyq = Boolean(question.is_pyq || question.question_type === 'PYQ' || question.exam_source?.includes('TNPSC'))
  const examYear = question.exam_year || question.year || (isPyq ? 'Official PYQ' : null)

  return (
    <div className="bg-white rounded-2xl border border-surface-border p-5 sm:p-7 shadow-card space-y-5">
      {/* ── Metadata Chips Bar ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border pb-3.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Question Index Badge */}
          <span className="w-8 h-8 rounded-xl bg-tnpsc-brand text-white font-black text-xs flex items-center justify-center shadow-subtle shrink-0">
            Q{question.question_number}
          </span>
          <span className="text-xs text-body-secondary font-semibold mr-1">
            Question {question.question_number} of {totalQuestions}
          </span>

          {/* Group Tag */}
          {groupLabel && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
              {groupLabel}
            </span>
          )}

          {/* Unit Tag */}
          {unitLabel && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
              {unitLabel.length > 32 ? unitLabel.slice(0, 30) + '…' : unitLabel}
            </span>
          )}

          {/* Micro-Topic Tag */}
          {microLabel && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {microLabel}
            </span>
          )}

          {/* Previous Year Question (PYQ) Badge */}
          {isPyq && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-sm animate-pulse">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>PYQ {examYear && examYear !== 'Official PYQ' ? examYear : ''}</span>
            </span>
          )}
        </div>

        {/* Right Action: Language Switcher & Review/Bookmark Controls */}
        <div className="flex items-center gap-2">
          {/* Card-level Bilingual Switcher */}
          {hasTamil && (
            <div className="inline-flex items-center rounded-lg border border-surface-border bg-slate-50 p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveLang('english')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  currentLang === 'english'
                    ? 'bg-white text-body-text shadow-sm'
                    : 'text-body-secondary hover:text-body-text'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setActiveLang('tamil')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  currentLang === 'tamil'
                    ? 'bg-tnpsc-brand text-white shadow-sm'
                    : 'text-body-secondary hover:text-body-text'
                }`}
              >
                தமிழ்
              </button>
            </div>
          )}

          {/* Review mode status pill OR Exam mode flag button */}
          {isReviewMode ? (
            <div>
              {isUnanswered ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  Unanswered
                </span>
              ) : isCorrect ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-status-success border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Correct (+2.0)
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-status-error border border-red-200">
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Incorrect (-0.66)
                </span>
              )}
            </div>
          ) : (
            <button
              onClick={onToggleMarkForReview}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                isMarkedForReview
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-body-secondary hover:bg-slate-200'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isMarkedForReview ? 'fill-amber-600 text-amber-600' : ''}`} />
              <span>{isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Question Statement ────────────────────────────────────────────── */}
      <div className="space-y-2">
        {currentLang === 'tamil' && textTa ? (
          <div>
            <p className="text-base sm:text-lg text-body-text font-semibold leading-relaxed whitespace-pre-line font-tamil">
              {textTa}
            </p>
            {textEn && (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed border-t border-slate-100 pt-1">
                {textEn}
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-base sm:text-lg text-body-text font-semibold leading-relaxed whitespace-pre-line">
              {textEn}
            </p>
            {textTa && (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-tamil border-t border-slate-100 pt-1">
                {textTa}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Options List ──────────────────────────────────────────────────── */}
      <div className="space-y-3 pt-1">
        {options.map((opt) => {
          const isSelected = selectedOption === opt.key
          const isThisCorrect = isReviewMode && correctOption === opt.key
          const isThisWrongSelection = isReviewMode && isSelected && !isThisCorrect

          let optionStyle = 'border-surface-border bg-white text-body-text hover:border-slate-300'

          if (isReviewMode) {
            if (isThisCorrect) {
              optionStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold ring-1 ring-emerald-500'
            } else if (isThisWrongSelection) {
              optionStyle = 'border-red-400 bg-red-50/70 text-red-950 font-medium ring-1 ring-red-400'
            } else {
              optionStyle = 'border-slate-200 bg-slate-50/50 text-slate-500 opacity-75'
            }
          } else if (isSelected) {
            optionStyle = 'border-tnpsc-brand bg-tnpsc-brand-light/40 text-tnpsc-brand font-semibold ring-2 ring-tnpsc-brand'
          }

          const primaryText = currentLang === 'tamil' && opt.textTa ? opt.textTa : opt.textEn
          const secondaryText = currentLang === 'tamil' && opt.textTa && opt.textEn !== opt.textTa ? opt.textEn : null

          return (
            <label
              key={opt.key}
              onClick={() => !isReviewMode && onSelectOption(opt.key)}
              className={`flex items-start space-x-3.5 p-4 rounded-xl border transition-all ${
                isReviewMode ? 'cursor-default' : 'cursor-pointer hover:shadow-subtle'
              } ${optionStyle}`}
            >
              <span className={`w-7 h-7 rounded-full border text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isReviewMode
                  ? isThisCorrect
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : isThisWrongSelection
                    ? 'border-red-500 bg-red-500 text-white'
                    : 'border-slate-300 text-slate-500'
                  : isSelected
                  ? 'border-tnpsc-brand bg-tnpsc-brand text-white'
                  : 'border-slate-300 text-slate-600 bg-white'
              }`}>
                {opt.key}
              </span>

              <div className="flex-1 pt-0.5">
                <span className="text-sm leading-relaxed block">
                  {primaryText}
                </span>
                {secondaryText && (
                  <span className="text-xs text-slate-400 mt-0.5 block leading-normal">
                    {secondaryText}
                  </span>
                )}
              </div>

              {isReviewMode && isThisCorrect && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full shrink-0">
                  Correct Answer
                </span>
              )}
              {isReviewMode && isThisWrongSelection && (
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                  opt.key === 'E'
                    ? 'text-slate-700 bg-slate-200'
                    : 'text-red-700 bg-red-100'
                }`}>
                  {opt.key === 'E' ? 'Answer Not Known (Option E · Unattempted)' : 'Your Answer'}
                </span>
              )}
            </label>
          )
        })}
      </div>

      {/* ── Clear Option Button in Exam Mode ──────────────────────────────── */}
      {!isReviewMode && selectedOption && (
        <div className="pt-1 flex justify-end">
          <button
            onClick={onClearOption}
            className="text-xs font-semibold text-body-secondary hover:text-status-error hover:underline transition-colors"
          >
            Clear Selected Answer
          </button>
        </div>
      )}

      {/* ── Detailed Solution Box in Review Mode ──────────────────────────── */}
      {isReviewMode && (
        <div className="mt-6 pt-4 border-t border-surface-border bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-tnpsc-brand flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-tnpsc-brand" />
              <span>Official Solution & Curriculum Rationale</span>
            </h4>
            {unitLabel && (
              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                {unitLabel}
              </span>
            )}
          </div>

          <p className="text-xs text-body-text leading-relaxed whitespace-pre-line font-medium">
            {(() => {
              const rawExp = (explanation || question?.explanation || '').trim()
              if (rawExp && !rawExp.toLowerCase().includes('no detailed explanation')) {
                return rawExp
              }
              const optKey = correctOption || question?.correct_option || 'Correct Option'
              const optText = question?.[`option_${String(optKey).toLowerCase()}`] || ''
              const subject = question?.subject || question?.macro_topic_name || question?.unit_name || 'General Studies'
              return `The correct answer is Option ${optKey}${optText ? `: "${optText}"` : ''}.\n\n• Concept Breakdown: Under TNPSC curriculum standards for ${subject}, Option ${optKey} represents the verified accurate response in accordance with standard Tamil Nadu State Board textbooks and authoritative syllabus guidelines.\n• Strategic Exam Tip: Review the core terminology and eliminate contradictory options when solving ${subject} questions to ensure maximum accuracy.`
            })()}
          </p>

          {question.explanation_tamil && (
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase">விளக்கம் (Tamil):</span>
              <p className="text-xs text-body-text leading-relaxed whitespace-pre-line font-tamil mt-1">
                {question.explanation_tamil}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
