import re

path = 'src/services/questionService.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """      const englishQuestion = sanitizeDatabaseText(q.question_text || q.en_question_text || '')
      const tamilQuestion = sanitizeDatabaseText(q.question_text_tamil || q.tamil_question || '')"""

replacement = """      let englishQuestion = sanitizeDatabaseText(q.question_text || q.en_question_text || '')
      let tamilQuestion = sanitizeDatabaseText(q.question_text_tamil || q.ta_question_text || q.tamil_question || '')

      if (englishQuestion.includes('தமிழ்:')) {
        const parts = englishQuestion.split('தமிழ்:')
        englishQuestion = parts[0].trim()
        if (!tamilQuestion) tamilQuestion = parts[1].trim()
      } else if (englishQuestion.includes('\\n') && /[a-zA-Z]/.test(englishQuestion) && /[\\u0B80-\\u0BFF]/.test(englishQuestion)) {
        const lines = englishQuestion.split('\\n').map(l => l.trim()).filter(Boolean)
        const enLines = lines.filter(l => /[a-zA-Z]/.test(l) && !/[\\u0B80-\\u0BFF]/.test(l))
        const taLines = lines.filter(l => /[\\u0B80-\\u0BFF]/.test(l))
        if (enLines.length > 0) englishQuestion = enLines.join(' ')
        if (!tamilQuestion && taLines.length > 0) tamilQuestion = taLines.join(' ')
      }

      const splitOptionPair = (enVal, taVal) => {
        let e = String(enVal || '').replace(/^\\(?[A-Da-d]\\)?\\s*[-.:]?\\s*/, '').trim()
        let t = String(taVal || '').replace(/^\\(?[A-Da-d]\\)?\\s*[-.:]?\\s*/, '').trim()
        if (e.includes(' / ')) {
          const parts = e.split(' / ')
          if (/[a-zA-Z]/.test(parts[0]) && /[\\u0B80-\\u0BFF]/.test(parts[1])) {
            e = parts[0].trim()
            if (!t) t = parts[1].trim()
          } else if (/[\\u0B80-\\u0BFF]/.test(parts[0]) && /[a-zA-Z]/.test(parts[1])) {
            e = parts[1].trim()
            if (!t) t = parts[0].trim()
          }
        }
        return { en: e || t, ta: t || e }
      }

      const optAPair = splitOptionPair(optA, q.option_a_tamil || q.ta_option_a)
      const optBPair = splitOptionPair(optB, q.option_b_tamil || q.ta_option_b)
      const optCPair = splitOptionPair(optC, q.option_c_tamil || q.ta_option_c)
      const optDPair = splitOptionPair(optD, q.option_d_tamil || q.ta_option_d)"""

target_sanitized = """        question_text: englishQuestion,
        option_a: sanitizeDatabaseText(optA),
        option_b: sanitizeDatabaseText(optB),
        option_c: sanitizeDatabaseText(optC),
        option_d: sanitizeDatabaseText(optD),
        correct_option: validOpt,
        explanation: baseExplanation,
        source_pdf: sanitizeDatabaseText(q.source_pdf || null),
        page_number: q.page_number || 1,
        question_text_tamil: sanitizeDatabaseText(q.question_text_tamil || q.tamil_question || null),
        option_a_tamil: sanitizeDatabaseText(q.option_a_tamil || null),
        option_b_tamil: sanitizeDatabaseText(q.option_b_tamil || null),
        option_c_tamil: sanitizeDatabaseText(q.option_c_tamil || null),
        option_d_tamil: sanitizeDatabaseText(q.option_d_tamil || null),"""

replacement_sanitized = """        question_text: sanitizeDatabaseText(englishQuestion),
        option_a: sanitizeDatabaseText(optAPair.en),
        option_b: sanitizeDatabaseText(optBPair.en),
        option_c: sanitizeDatabaseText(optCPair.en),
        option_d: sanitizeDatabaseText(optDPair.en),
        correct_option: validOpt,
        explanation: baseExplanation,
        source_pdf: sanitizeDatabaseText(q.source_pdf || null),
        page_number: q.page_number || 1,
        question_text_tamil: sanitizeDatabaseText(tamilQuestion || null),
        option_a_tamil: sanitizeDatabaseText(optAPair.ta || null),
        option_b_tamil: sanitizeDatabaseText(optBPair.ta || null),
        option_c_tamil: sanitizeDatabaseText(optCPair.ta || null),
        option_d_tamil: sanitizeDatabaseText(optDPair.ta || null),"""

code_lf = code.replace('\r\n', '\n')
if target in code_lf and target_sanitized in code_lf:
    code_lf = code_lf.replace(target, replacement, 1)
    code_lf = code_lf.replace(target_sanitized, replacement_sanitized, 1)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(code_lf)
    print("Updated questionService.js successfully!")
else:
    print("Could not match target in questionService.js")
