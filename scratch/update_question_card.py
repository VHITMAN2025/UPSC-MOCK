path = 'src/components/QuestionCard.jsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """  // Determine available bilingual texts
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
  const textTa = question.question_text_tamil || question.tamil_question || ''"""

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
    return { en, ta }
  }

  const parseOption = (enRaw, taRaw) => {
    let en = String(enRaw || '').replace(/^\\(?[A-Da-d]\\)?\\s*[-.:]?\\s*/, '').trim()
    let ta = String(taRaw || '').replace(/^\\(?[A-Da-d]\\)?\\s*[-.:]?\\s*/, '').trim()
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
    question.en_question_text || question.question_text,
    question.ta_question_text || question.question_text_tamil || question.tamil_question
  )
  const textEn = parsedStem.en || parsedStem.ta || ''
  const textTa = parsedStem.ta || parsedStem.en || ''

  const optAPair = parseOption(question.en_option_a || question.option_a, question.ta_option_a || question.option_a_tamil)
  const optBPair = parseOption(question.en_option_b || question.option_b, question.ta_option_b || question.option_b_tamil)
  const optCPair = parseOption(question.en_option_c || question.option_c, question.ta_option_c || question.option_c_tamil)
  const optDPair = parseOption(question.en_option_d || question.option_d, question.ta_option_d || question.option_d_tamil)

  // Determine available bilingual texts
  const hasTamil = Boolean(textTa || optAPair.ta || question.question_text_tamil)
  const currentLang = hasTamil ? activeLang : 'english'

  const options = [
    { 
      key: 'A', 
      textEn: optAPair.en,
      textTa: optAPair.ta,
    },
    { 
      key: 'B', 
      textEn: optBPair.en,
      textTa: optBPair.ta,
    },
    { 
      key: 'C', 
      textEn: optCPair.en,
      textTa: optCPair.ta,
    },
    { 
      key: 'D', 
      textEn: optDPair.en,
      textTa: optDPair.ta,
    },
    {
      key: 'E',
      textEn: question.option_e || 'Answer not known',
      textTa: question.option_e_tamil || 'விடை தெரியவில்லை',
      isOptionE: true,
    }
  ]"""

code_lf = code.replace('\r\n', '\n')
if target in code_lf:
    code_lf = code_lf.replace(target, replacement, 1)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(code_lf)
    print("Updated QuestionCard.jsx successfully!")
else:
    print("Could not match target in QuestionCard.jsx")
