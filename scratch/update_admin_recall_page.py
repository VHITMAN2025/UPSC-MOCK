path = 'src/pages/admin/AdminRecallPage.jsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

state_target = """  const [selectedGroupTag, setSelectedGroupTag] = useState('TNPSC_GROUP_1')
  const [sourceFilter, setSourceFilter] = useState('all') // 'all' | 'vina' | 'pyq'"""

state_replacement = """  const [selectedGroupTag, setSelectedGroupTag] = useState('TNPSC_GROUP_1')
  const [sourceFilter, setSourceFilter] = useState('all') // 'all' | 'vina' | 'pyq'
  const [languageColumnView, setLanguageColumnView] = useState('all') // 'all' | 'en' | 'ta'"""

header_target = """            <div className="text-xs text-body-secondary font-semibold">
              Page {currentPage} of {totalPages}
            </div>"""

header_replacement = """            <div className="flex items-center gap-3">
              {/* Bilingual Column Focus Switcher */}
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setLanguageColumnView('all')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    languageColumnView === 'all'
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌐 Complete 29-Col Grid
                </button>
                <button
                  type="button"
                  onClick={() => setLanguageColumnView('en')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    languageColumnView === 'en'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-blue-700'
                  }`}
                >
                  🇬🇧 English Focus
                </button>
                <button
                  type="button"
                  onClick={() => setLanguageColumnView('ta')}
                  className={`px-2.5 py-1 rounded-md transition-all font-tamil ${
                    languageColumnView === 'ta'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  🇮🇳 தமிழ் Focus
                </button>
              </div>

              <div className="text-xs text-body-secondary font-semibold">
                Page {currentPage} of {totalPages}
              </div>
            </div>"""

td_target = """                      {/* 15. English Stem & Options */}
                      <td
                        className="py-2 px-3 border-r border-slate-200 max-w-xs truncate font-medium cursor-pointer"
                        title={q.en_question_text}
                        onDoubleClick={() => setEditingCell({ qId: q.question_id, field: 'en_question_text', value: q.en_question_text })}
                      >
                        {editingCell?.qId === q.question_id && editingCell.field === 'en_question_text' ? (
                          <input
                            type="text"
                            defaultValue={editingCell.value}
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleCellSave(q, 'en_question_text', e.target.value)
                              if (e.key === 'Escape') setEditingCell(null)
                            }}
                            className="w-full px-2 py-1 border border-indigo-400 rounded text-xs"
                          />
                        ) : (
                          q.en_question_text || '—'
                        )}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_a}>{q.en_option_a || '—'}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_b}>{q.en_option_b || '—'}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_c}>{q.en_option_c || '—'}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_d}>{q.en_option_d || '—'}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-400 text-[10px]">Answer not known</td>

                      {/* 21. Tamil Stem & Options */}
                      <td className="py-2 px-3 border-r border-slate-200 max-w-xs truncate font-tamil" title={q.ta_question_text}>
                        {q.ta_question_text || '—'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_a}>{q.ta_option_a || '—'}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_b}>{q.ta_option_b || '—'}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_c}>{q.ta_option_c || '—'}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_d}>{q.ta_option_d || '—'}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-400 font-tamil text-[10px]">விடை தெரியவில்லை</td>

                      {/* 27. answer_key */}
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-black bg-amber-50/50">
                        <span className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-amber-400 text-amber-950 text-xs">
                          {q.answer_key}
                        </span>
                      </td>

                      {/* 28-29. Explanations */}
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[220px] truncate" title={q.en_explanation}>
                        {q.en_explanation || '—'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[220px] truncate font-tamil" title={q.ta_explanation}>
                        {q.ta_explanation || '—'}
                      </td>"""

td_replacement = """                      {/* English Columns (15-20) */}
                      {(languageColumnView === 'all' || languageColumnView === 'en') && (
                        <>
                          <td
                            className="py-2 px-3 border-r border-slate-200 max-w-xs truncate font-medium cursor-pointer"
                            title={q.en_question_text}
                            onDoubleClick={() => setEditingCell({ qId: q.question_id, field: 'en_question_text', value: q.en_question_text })}
                          >
                            {editingCell?.qId === q.question_id && editingCell.field === 'en_question_text' ? (
                              <input
                                type="text"
                                defaultValue={editingCell.value}
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleCellSave(q, 'en_question_text', e.target.value)
                                  if (e.key === 'Escape') setEditingCell(null)
                                }}
                                className="w-full px-2 py-1 border border-indigo-400 rounded text-xs"
                              />
                            ) : (
                              q.en_question_text || '—'
                            )}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_a}>{q.en_option_a || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_b}>{q.en_option_b || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_c}>{q.en_option_c || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_d}>{q.en_option_d || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-400 text-[10px]">Answer not known</td>
                        </>
                      )}

                      {/* Tamil Columns (21-26) */}
                      {(languageColumnView === 'all' || languageColumnView === 'ta') && (
                        <>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-xs truncate font-tamil" title={q.ta_question_text}>
                            {q.ta_question_text || '—'}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_a}>{q.ta_option_a || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_b}>{q.ta_option_b || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_c}>{q.ta_option_c || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_d}>{q.ta_option_d || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-400 font-tamil text-[10px]">விடை தெரியவில்லை</td>
                        </>
                      )}

                      {/* 27. answer_key */}
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-black bg-amber-50/50">
                        <span className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-amber-400 text-amber-950 text-xs">
                          {q.answer_key}
                        </span>
                      </td>

                      {/* 28-29. Explanations */}
                      {(languageColumnView === 'all' || languageColumnView === 'en') && (
                        <td className="py-2 px-3 border-r border-slate-200 max-w-[220px] truncate" title={q.en_explanation}>
                          {q.en_explanation || '—'}
                        </td>
                      )}
                      {(languageColumnView === 'all' || languageColumnView === 'ta') && (
                        <td className="py-2 px-3 border-r border-slate-200 max-w-[220px] truncate font-tamil" title={q.ta_explanation}>
                          {q.ta_explanation || '—'}
                        </td>
                      )}"""

code_lf = code.replace('\r\n', '\n')
for t, r in [(state_target, state_replacement), (header_target, header_replacement), (td_target, td_replacement)]:
    if t in code_lf:
        code_lf = code_lf.replace(t, r, 1)
    else:
        print(f"Target not found: {t[:30]}...")

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(code_lf)
print("Updated AdminRecallPage.jsx!")
