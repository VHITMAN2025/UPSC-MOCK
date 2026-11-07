path = 'src/pages/admin/AdminExtractedQuestionsPage.jsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add languageColumnView state
state_target = """  // Top Three-Way Group Switcher: 'TNPSC_GROUP_1' | 'TNPSC_GROUP_2' | 'TNPSC_GROUP_4'
  const [selectedGroupTag, setSelectedGroupTag] = useState('TNPSC_GROUP_1')

  // Sub-filter pills: 'all' | 'vina' | 'pyq'
  const [sourceFilter, setSourceFilter] = useState('all')"""

state_replacement = """  // Top Three-Way Group Switcher: 'TNPSC_GROUP_1' | 'TNPSC_GROUP_2' | 'TNPSC_GROUP_4'
  const [selectedGroupTag, setSelectedGroupTag] = useState('TNPSC_GROUP_1')

  // Sub-filter pills: 'all' | 'vina' | 'pyq'
  const [sourceFilter, setSourceFilter] = useState('all')

  // Language columns view filter: 'all' | 'en' | 'ta'
  const [languageColumnView, setLanguageColumnView] = useState('all')"""

# 2. Add language filter buttons to spreadsheet header
header_target = """          <div className="text-xs text-body-secondary font-semibold">
            Page {currentPage} of {totalPages}
          </div>"""

header_replacement = """          <div className="flex items-center gap-3">
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

# 3. Update the table headers
th_target = """                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[260px]">English Question Stem</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">En Option A</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">En Option B</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">En Option C</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">En Option D</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[120px]">En Option E</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[260px]">Tamil Question Stem</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">Ta Option A</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">Ta Option B</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">Ta Option C</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">Ta Option D</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[120px]">Ta Option E</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[220px]">English Explanation</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[220px]">Tamil Explanation</th>"""

th_replacement = """                  {/* English Columns (15-20) */}
                  {(languageColumnView === 'all' || languageColumnView === 'en') && (
                    <>
                      <th className="py-2.5 px-3 border-r border-blue-200 bg-blue-50/80 text-blue-950 font-bold min-w-[280px]">🇬🇧 15. en_question_text</th>
                      <th className="py-2.5 px-3 border-r border-blue-200 bg-blue-50/80 text-blue-950 font-bold min-w-[140px]">🇬🇧 16. en_option_a</th>
                      <th className="py-2.5 px-3 border-r border-blue-200 bg-blue-50/80 text-blue-950 font-bold min-w-[140px]">🇬🇧 17. en_option_b</th>
                      <th className="py-2.5 px-3 border-r border-blue-200 bg-blue-50/80 text-blue-950 font-bold min-w-[140px]">🇬🇧 18. en_option_c</th>
                      <th className="py-2.5 px-3 border-r border-blue-200 bg-blue-50/80 text-blue-950 font-bold min-w-[140px]">🇬🇧 19. en_option_d</th>
                      <th className="py-2.5 px-3 border-r border-blue-200 bg-blue-50/80 text-blue-950 font-bold min-w-[120px]">🇬🇧 20. en_option_e</th>
                    </>
                  )}

                  {/* Tamil Columns (21-26) */}
                  {(languageColumnView === 'all' || languageColumnView === 'ta') && (
                    <>
                      <th className="py-2.5 px-3 border-r border-emerald-200 bg-emerald-50/80 text-emerald-950 font-bold min-w-[280px] font-tamil">🇮🇳 21. ta_question_text</th>
                      <th className="py-2.5 px-3 border-r border-emerald-200 bg-emerald-50/80 text-emerald-950 font-bold min-w-[140px] font-tamil">🇮🇳 22. ta_option_a</th>
                      <th className="py-2.5 px-3 border-r border-emerald-200 bg-emerald-50/80 text-emerald-950 font-bold min-w-[140px] font-tamil">🇮🇳 23. ta_option_b</th>
                      <th className="py-2.5 px-3 border-r border-emerald-200 bg-emerald-50/80 text-emerald-950 font-bold min-w-[140px] font-tamil">🇮🇳 24. ta_option_c</th>
                      <th className="py-2.5 px-3 border-r border-emerald-200 bg-emerald-50/80 text-emerald-950 font-bold min-w-[140px] font-tamil">🇮🇳 25. ta_option_d</th>
                      <th className="py-2.5 px-3 border-r border-emerald-200 bg-emerald-50/80 text-emerald-950 font-bold min-w-[120px] font-tamil">🇮🇳 26. ta_option_e</th>
                    </>
                  )}

                  {(languageColumnView === 'all' || languageColumnView === 'en') && (
                    <th className="py-2.5 px-3 border-r border-blue-200 bg-blue-50/80 text-blue-950 font-bold min-w-[220px]">🇬🇧 28. en_explanation</th>
                  )}
                  {(languageColumnView === 'all' || languageColumnView === 'ta') && (
                    <th className="py-2.5 px-3 border-r border-emerald-200 bg-emerald-50/80 text-emerald-950 font-bold min-w-[220px] font-tamil">🇮🇳 29. ta_explanation</th>
                  )}"""

# 4. Update the tbody cells
td_target = """                      {/* 10. English Question Stem */}
                      <td className="py-2 px-3 border-r border-slate-200 max-w-xs truncate" title={q.en_question_text}>
                        {q.en_question_text}
                      </td>

                      {/* 11-14. Options A-D */}
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_a}>{q.en_option_a}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_b}>{q.en_option_b}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_c}>{q.en_option_c}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate" title={q.en_option_d}>{q.en_option_d}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-400 font-italic text-[10px]">Answer not known</td>

                      {/* 15. Tamil Stem & Options */}
                      <td className="py-2 px-3 border-r border-slate-200 max-w-xs truncate font-tamil" title={q.ta_question_text}>
                        {q.ta_question_text || '—'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_a}>{q.ta_option_a || '—'}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_b}>{q.ta_option_b || '—'}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_c}>{q.ta_option_c || '—'}</td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil" title={q.ta_option_d}>{q.ta_option_d || '—'}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-400 font-tamil text-[10px]">விடை தெரியவில்லை</td>

                      {/* 16. Explanations */}
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[220px] truncate" title={q.en_explanation}>
                        {q.en_explanation || '—'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 max-w-[220px] truncate font-tamil" title={q.ta_explanation}>
                        {q.ta_explanation || '—'}
                      </td>"""

td_replacement = """                      {/* English Columns (15-20) */}
                      {(languageColumnView === 'all' || languageColumnView === 'en') && (
                        <>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-xs truncate font-medium text-slate-800" title={q.en_question_text}>
                            {q.en_question_text}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate text-slate-700" title={q.en_option_a}>{q.en_option_a}</td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate text-slate-700" title={q.en_option_b}>{q.en_option_b}</td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate text-slate-700" title={q.en_option_c}>{q.en_option_c}</td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate text-slate-700" title={q.en_option_d}>{q.en_option_d}</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-400 font-italic text-[10px]">Answer not known</td>
                        </>
                      )}

                      {/* Tamil Columns (21-26) */}
                      {(languageColumnView === 'all' || languageColumnView === 'ta') && (
                        <>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-xs truncate font-tamil text-slate-800" title={q.ta_question_text}>
                            {q.ta_question_text || '—'}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil text-slate-700" title={q.ta_option_a}>{q.ta_option_a || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil text-slate-700" title={q.ta_option_b}>{q.ta_option_b || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil text-slate-700" title={q.ta_option_c}>{q.ta_option_c || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 max-w-[140px] truncate font-tamil text-slate-700" title={q.ta_option_d}>{q.ta_option_d || '—'}</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-400 font-tamil text-[10px]">விடை தெரியவில்லை</td>
                        </>
                      )}

                      {/* Explanations (28-29) */}
                      {(languageColumnView === 'all' || languageColumnView === 'en') && (
                        <td className="py-2 px-3 border-r border-slate-200 max-w-[220px] truncate text-slate-700" title={q.en_explanation}>
                          {q.en_explanation || '—'}
                        </td>
                      )}
                      {(languageColumnView === 'all' || languageColumnView === 'ta') && (
                        <td className="py-2 px-3 border-r border-slate-200 max-w-[220px] truncate font-tamil text-slate-700" title={q.ta_explanation}>
                          {q.ta_explanation || '—'}
                        </td>
                      )}"""

# 5. Update Modal inspection
modal_target = """              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <b>English Question Stem:</b>
                <p className="text-body-text whitespace-pre-wrap">{viewingQuestion.en_question_text}</p>
              </div>

              {viewingQuestion.ta_question_text && (
                <div className="p-3 bg-slate-50 rounded-xl space-y-2 font-tamil">
                  <b>Tamil Question Stem:</b>
                  <p className="text-body-text whitespace-pre-wrap">{viewingQuestion.ta_question_text}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 border rounded-lg">A: {viewingQuestion.en_option_a}</div>
                <div className="p-2 border rounded-lg">B: {viewingQuestion.en_option_b}</div>
                <div className="p-2 border rounded-lg">C: {viewingQuestion.en_option_c}</div>
                <div className="p-2 border rounded-lg">D: {viewingQuestion.en_option_d}</div>
              </div>

              {viewingQuestion.en_explanation && (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <b className="text-blue-900 block mb-1">Explanation:</b>
                  <p className="text-body-text leading-relaxed whitespace-pre-wrap">{viewingQuestion.en_explanation}</p>
                </div>
              )}"""

modal_replacement = """              {/* Side-by-Side Bilingual Cards */}
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
              </div>"""

code_lf = code.replace('\r\n', '\n')
for t, r in [(state_target, state_replacement), (header_target, header_replacement), (th_target, th_replacement), (td_target, td_replacement), (modal_target, modal_replacement)]:
    if t in code_lf:
        code_lf = code_lf.replace(t, r, 1)
    else:
        print(f"Target not found: {t[:40]}...")

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(code_lf)
print("Updated AdminExtractedQuestionsPage.jsx!")
