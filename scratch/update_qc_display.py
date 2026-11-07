path = 'src/components/QuestionCard.jsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """      {/* ── Question Statement ────────────────────────────────────────────── */}
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
      </div>"""

replacement = """      {/* ── Question Statement ────────────────────────────────────────────── */}
      <div className="space-y-2">
        {currentLang === 'tamil' && textTa ? (
          <div>
            <p className="text-base sm:text-lg text-body-text font-semibold leading-relaxed whitespace-pre-line font-tamil">
              {textTa}
            </p>
            {textEn && textEn !== textTa && (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed border-t border-slate-100 pt-1">
                {textEn}
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-base sm:text-lg text-body-text font-semibold leading-relaxed whitespace-pre-line">
              {textEn || textTa}
            </p>
            {textTa && textTa !== textEn && (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-tamil border-t border-slate-100 pt-1">
                {textTa}
              </p>
            )}
          </div>
        )}
      </div>"""

opt_target = """          const primaryText = currentLang === 'tamil' && opt.textTa ? opt.textTa : opt.textEn
          const secondaryText = currentLang === 'tamil' && opt.textTa && opt.textEn !== opt.textTa ? opt.textEn : null"""

opt_replacement = """          const primaryText = currentLang === 'tamil' && opt.textTa ? opt.textTa : (opt.textEn || opt.textTa)
          const secondaryText = currentLang === 'tamil'
            ? (opt.textTa && opt.textEn && opt.textEn !== opt.textTa ? opt.textEn : null)
            : (opt.textEn && opt.textTa && opt.textTa !== opt.textEn ? opt.textTa : null)"""

code_lf = code.replace('\r\n', '\n')
if target in code_lf and opt_target in code_lf:
    code_lf = code_lf.replace(target, replacement, 1)
    code_lf = code_lf.replace(opt_target, opt_replacement, 1)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(code_lf)
    print("Updated QuestionCard bilingual display successfully!")
else:
    print("Could not match target in QuestionCard.jsx")
