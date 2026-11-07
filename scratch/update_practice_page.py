path = 'src/pages/user/PracticePage.jsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """  const questionText = activeLang === 'tamil' && (currentQ.question_text_tamil || currentQ.tamil_question)
    ? (currentQ.question_text_tamil || currentQ.tamil_question)
    : currentQ.question_text

  const secondaryText = activeLang === 'tamil' && currentQ.question_text
    ? currentQ.question_text
    : (activeLang === 'english' && (currentQ.question_text_tamil || currentQ.tamil_question) ? (currentQ.question_text_tamil || currentQ.tamil_question) : null)"""

replacement = """  const parseStem = (enRaw, taRaw) => {
    let en = String(enRaw || '').trim()
    let ta = String(taRaw || '').trim()
    if (en.includes('தமிழ்:')) {
      const parts = en.split('தமிழ்:')
      en = parts[0].trim()
      if (!ta) ta = parts[1].trim()
    } else if (en.includes('\\n') && /[a-zA-Z]/.test(en) && /[\\u0B80-\\u0BFF]/.test(en)) {
      const lines = en.split('\\n').map(l => l.trim()).filter(Boolean)
      const enLines = lines.filter(l => /[a-zA-Z]/.test(l) && !/[\\u0B80-\\u0BFF]/.test(l))
      const taLines = lines.filter(l => /[\\u0B80-\\u0BFF]/.test(l))
      if (enLines.length > 0) en = enLines.join(' ')
      if (!ta && taLines.length > 0) ta = taLines.join(' ')
    }
    return { en: en || ta, ta: ta || en }
  }

  const parseOpt = (rawEn, rawTa) => {
    let en = String(rawEn || '').replace(/^\\(?[A-Da-d]\\)?\\s*[-.:]?\\s*/, '').trim()
    let ta = String(rawTa || '').replace(/^\\(?[A-Da-d]\\)?\\s*[-.:]?\\s*/, '').trim()
    if (en.includes(' / ')) {
      const parts = en.split(' / ')
      if (/[a-zA-Z]/.test(parts[0]) && /[\\u0B80-\\u0BFF]/.test(parts[1])) {
        en = parts[0].trim()
        if (!ta) ta = parts[1].trim()
      } else if (/[\\u0B80-\\u0BFF]/.test(parts[0]) && /[a-zA-Z]/.test(parts[1])) {
        en = parts[1].trim()
        if (!ta) ta = parts[0].trim()
      }
    }
    return { en: en || ta, ta: ta || en }
  }

  const parsedStem = parseStem(
    currentQ.en_question_text || currentQ.question_text,
    currentQ.ta_question_text || currentQ.question_text_tamil || currentQ.tamil_question
  )
  const questionText = activeLang === 'tamil' ? parsedStem.ta : parsedStem.en
  const secondaryText = activeLang === 'tamil'
    ? (parsedStem.en !== parsedStem.ta ? parsedStem.en : null)
    : (parsedStem.ta !== parsedStem.en ? parsedStem.ta : null)"""

opt_target = """            const letter = opt.toLowerCase()
            const textEn = currentQ[`option_${letter}`]
            const textTa = currentQ[`option_${letter}_tamil`]
            const primaryOptionText = activeLang === 'tamil' && textTa ? textTa : textEn
            const secondaryOptionText = activeLang === 'tamil' && textTa ? textEn : (activeLang === 'english' && textTa ? textTa : null)"""

opt_replacement = """            const letter = opt.toLowerCase()
            const { en: optEn, ta: optTa } = parseOpt(
              currentQ[`option_${letter}`] || currentQ[`en_option_${letter}`],
              currentQ[`option_${letter}_tamil`] || currentQ[`ta_option_${letter}`]
            )
            const primaryOptionText = activeLang === 'tamil' ? optTa : optEn
            const secondaryOptionText = activeLang === 'tamil'
              ? (optEn !== optTa ? optEn : null)
              : (optTa !== optEn ? optTa : null)"""

code_lf = code.replace('\r\n', '\n')
if target in code_lf and opt_target in code_lf:
    code_lf = code_lf.replace(target, replacement, 1)
    code_lf = code_lf.replace(opt_target, opt_replacement, 1)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(code_lf)
    print("Updated PracticePage.jsx successfully!")
else:
    print("Could not match targets in PracticePage.jsx")
