import re

path = 'src/services/masterTaxonomyService.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """  const enText = rawQ.en_question_text || rawQ.question_text || ''
  const taText = rawQ.ta_question_text || rawQ.question_text_tamil || ''

  const expl = rawQ.explanation || ''
  let enExpl = rawQ.en_explanation || expl.replace(/\\[Metadata:[^\\]]+\\]\\s*/g, '').replace(/\\[Taxonomy:[^\\]]+\\]\\s*/g, '').trim()
  let taExpl = rawQ.ta_explanation || rawQ.explanation_tamil || ''"""

replacement = """  // Clean bilingual question separation
  let rawStemEn = String(rawQ.en_question_text || rawQ.question_text || '').trim()
  let rawStemTa = String(rawQ.ta_question_text || rawQ.question_text_tamil || '').trim()

  let enText = rawStemEn
  let taText = rawStemTa

  if (rawStemEn.includes('தமிழ்:')) {
    const parts = rawStemEn.split('தமிழ்:')
    enText = parts[0].trim()
    if (!taText) taText = parts[1].trim()
  } else if (rawStemEn.includes('\\n') && /[a-zA-Z]/.test(rawStemEn) && /[\\u0B80-\\u0BFF]/.test(rawStemEn)) {
    const lines = rawStemEn.split('\\n').map(l => l.trim()).filter(Boolean)
    const enLines = lines.filter(l => /[a-zA-Z]/.test(l) && !/[\\u0B80-\\u0BFF]/.test(l))
    const taLines = lines.filter(l => /[\\u0B80-\\u0BFF]/.test(l))
    if (enLines.length > 0) enText = enLines.join(' ')
    if (!taText && taLines.length > 0) taText = taLines.join(' ')
  } else if (/[\\u0B80-\\u0BFF]/.test(rawStemEn) && !/[a-zA-Z]/.test(rawStemEn)) {
    if (!taText) taText = rawStemEn
    enText = rawQ.en_question_text || `[General Tamil] ${rawStemEn}`
  }

  // Clean bilingual options separation
  const splitOpt = (optEnRaw, optTaRaw) => {
    let en = String(optEnRaw || '').replace(/^\\(?[A-Da-d]\\)?\\s*[-.:]?\\s*/, '').trim()
    let ta = String(optTaRaw || '').replace(/^\\(?[A-Da-d]\\)?\\s*[-.:]?\\s*/, '').trim()

    if (en.includes(' / ')) {
      const parts = en.split(' / ')
      const p1 = parts[0].trim()
      const p2 = parts[1].trim()
      if (/[a-zA-Z]/.test(p1) && /[\\u0B80-\\u0BFF]/.test(p2)) {
        en = p1
        if (!ta) ta = p2
      } else if (/[\\u0B80-\\u0BFF]/.test(p1) && /[a-zA-Z]/.test(p2)) {
        en = p2
        if (!ta) ta = p1
      }
    } else if (/[\\u0B80-\\u0BFF]/.test(en) && !/[a-zA-Z]/.test(en)) {
      if (!ta) ta = en
    }
    return { en: en || ta, ta: ta || en }
  }

  const optA = splitOpt(rawQ.en_option_a || rawQ.option_a, rawQ.ta_option_a || rawQ.option_a_tamil)
  const optB = splitOpt(rawQ.en_option_b || rawQ.option_b, rawQ.ta_option_b || rawQ.option_b_tamil)
  const optC = splitOpt(rawQ.en_option_c || rawQ.option_c, rawQ.ta_option_c || rawQ.option_c_tamil)
  const optD = splitOpt(rawQ.en_option_d || rawQ.option_d, rawQ.ta_option_d || rawQ.option_d_tamil)

  const expl = rawQ.explanation || ''
  let enExpl = rawQ.en_explanation || expl.replace(/\\[Metadata:[^\\]]+\\]\\s*/g, '').replace(/\\[Taxonomy:[^\\]]+\\]\\s*/g, '').trim()
  let taExpl = rawQ.ta_explanation || rawQ.explanation_tamil || ''"""

# Normalize code to \n for replacement
code_lf = code.replace('\r\n', '\n')
if target in code_lf:
    code_lf = code_lf.replace(target, replacement, 1)
    # also update the options mapping in return object
    old_opts = """    // 15-20 (English stem + options)
    en_question_text: enText,
    en_option_a: rawQ.en_option_a || rawQ.option_a || '',
    en_option_b: rawQ.en_option_b || rawQ.option_b || '',
    en_option_c: rawQ.en_option_c || rawQ.option_c || '',
    en_option_d: rawQ.en_option_d || rawQ.option_d || '',
    en_option_e: 'Answer not known',

    // 21-26 (Tamil stem + options)
    ta_question_text: taText,
    ta_option_a: rawQ.ta_option_a || rawQ.option_a_tamil || '',
    ta_option_b: rawQ.ta_option_b || rawQ.option_b_tamil || '',
    ta_option_c: rawQ.ta_option_c || rawQ.option_c_tamil || '',
    ta_option_d: rawQ.ta_option_d || rawQ.option_d_tamil || '',
    ta_option_e: 'விடை தெரியவில்லை',"""

    new_opts = """    // 15-20 (English stem + options)
    en_question_text: enText || taText,
    en_option_a: optA.en,
    en_option_b: optB.en,
    en_option_c: optC.en,
    en_option_d: optD.en,
    en_option_e: 'Answer not known',

    // 21-26 (Tamil stem + options)
    ta_question_text: taText || enText,
    ta_option_a: optA.ta,
    ta_option_b: optB.ta,
    ta_option_c: optC.ta,
    ta_option_d: optD.ta,
    ta_option_e: 'விடை தெரியவில்லை',"""

    if old_opts in code_lf:
        code_lf = code_lf.replace(old_opts, new_opts, 1)
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(code_lf)
        print("Updated masterTaxonomyService.js successfully!")
    else:
        print("old_opts not found")
else:
    print("target not found")
