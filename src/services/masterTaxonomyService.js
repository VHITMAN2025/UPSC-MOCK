import questionTranslations from '../data/question_translations.js'
import { TAXONOMY_V2, BLUEPRINTS_V2 } from '../data/taxonomyV2.js'

/**
 * Master Taxonomy Service & 29-Column Schema Specification
 * 
 * Enforces:
 * 1. Locked Master Taxonomy CSV catalogs for:
 *    - TNPSC Group 1 (Part A Units I-VI + Part B Aptitude = 175 + 25 = 200 Qs)
 *    - TNPSC Group 2 & 2A (Part A Tamil/English 100 + Part B GS 75 + Part C Aptitude 25 = 200 Qs)
 *    - TNPSC Group 4 (Part A Tamil 100 + Part B GS 75 + Part C Aptitude 25 = 200 Qs)
 * 2. Strict Foreign-Key validation for uploaded questions against locked tags
 * 3. SHA-256 Deduplication Gate (blocks VINA questions matching PYQ question text)
 * 4. 29-Column Schema Normalization & Serialization
 */

// ─── Catalog: generated from supabase/data/taxonomy_v2.csv ─────────────────
// Source of truth for units, macro topics, micro topics and quotas. Do not edit by hand;
// change the CSV and regenerate src/data/taxonomyV2.js.
export const GROUP1_MASTER_TAXONOMY = TAXONOMY_V2.filter(e => e.exam_tag === 'TNPSC_GROUP_1')
export const GROUP2_MASTER_TAXONOMY = TAXONOMY_V2.filter(e => e.exam_tag === 'TNPSC_GROUP_2')
export const GROUP4_MASTER_TAXONOMY = TAXONOMY_V2.filter(e => e.exam_tag === 'TNPSC_GROUP_4')

// ─── Map by Exam Tag ────────────────────────────────────────────────────────
export const MASTER_TAXONOMIES = {
  TNPSC_GROUP_1: GROUP1_MASTER_TAXONOMY,
  TNPSC_GROUP_2: GROUP2_MASTER_TAXONOMY,
  TNPSC_GROUP_4: GROUP4_MASTER_TAXONOMY,
  'TNPSC Group 1': GROUP1_MASTER_TAXONOMY,
  'TNPSC Group 2/2A': GROUP2_MASTER_TAXONOMY,
  'TNPSC Group 4': GROUP4_MASTER_TAXONOMY,
}

// ─── 200-Question Official Blueprints (from taxonomy_v2.csv) ─────────────────
export const OFFICIAL_200Q_BLUEPRINTS = BLUEPRINTS_V2


// ─── 4. SHA-256 Deduplication Hash ───────────────────────────────────────────
export async function computeQuestionContentHash(enText = '', taText = '') {
  const norm = (str) =>
    String(str || '')
      .toLowerCase()
      .replace(/[^\w\u0B80-\u0BFF]/g, '')
      .trim()

  const combined = norm(enText) + '||' + norm(taText)
  if (!combined || combined === '||') {
    return 'empty_hash_' + Math.random().toString(36).substring(2, 10)
  }

  try {
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle?.digest) {
      const msgUint8 = new TextEncoder().encode(combined)
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgUint8)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }
  } catch {}

  // Fallback FNV-1a 64-bit hash
  let h1 = 0x811c9dc5
  let h2 = 0x48493021
  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 0x01000193)
    h2 = Math.imul(h2 ^ ch, 0x5bd1e995)
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0')
}

// ─── 5. Strict Foreign-Key & Master Taxonomy Validation ─────────────────────
export function normalizeExamTag(rawTag) {
  const s = String(rawTag || '').toUpperCase().trim()
  if (s.includes('1') || s.includes('ONE')) return 'TNPSC_GROUP_1'
  if (s.includes('2')) return 'TNPSC_GROUP_2'
  return 'TNPSC_GROUP_4'
}

export function validateQuestionAgainstMasterTaxonomy(question, targetExamTag) {
  const examTag = normalizeExamTag(targetExamTag || question.exam_tag)
  const masterList = MASTER_TAXONOMIES[examTag] || GROUP4_MASTER_TAXONOMY

  const qUnitCode = String(question.unit_code || '').trim().toUpperCase()
  const qMacro = String(question.macro_topic || '').trim().toLowerCase()
  const qMicro = String(question.micro_topic || '').trim().toLowerCase()

  const errors = []

  // Check unit_code
  const validUnitCodes = new Set(masterList.map(m => m.unit_code.toUpperCase()))
  if (!qUnitCode || !validUnitCodes.has(qUnitCode)) {
    errors.push(`Invalid unit_code '${qUnitCode}' for ${examTag}. Must be one of: ${Array.from(validUnitCodes).join(', ')}`)
  }

  // Check macro_topic
  const matchingUnits = masterList.filter(m => m.unit_code.toUpperCase() === qUnitCode)
  const validMacros = new Set(matchingUnits.map(m => m.macro_topic.toLowerCase()))
  if (matchingUnits.length > 0 && qMacro) {
    const isMacroValid = Array.from(validMacros).some(vm => vm === qMacro || qMacro.includes(vm) || vm.includes(qMacro))
    if (!isMacroValid) {
      errors.push(`Out-of-syllabus macro_topic '${question.macro_topic}' under unit '${qUnitCode}'.`)
    }
  }

  // Check micro_topic
  const validMicros = new Set(matchingUnits.map(m => m.micro_topic.toLowerCase()))
  if (matchingUnits.length > 0 && qMicro) {
    const isMicroValid = Array.from(validMicros).some(vm => vm === qMicro || qMicro.includes(vm) || vm.includes(qMicro))
    if (!isMicroValid) {
      errors.push(`Out-of-syllabus micro_topic '${question.micro_topic}' under unit '${qUnitCode}'.`)
    }
  }

  // Check source_type mutual exclusivity
  const source = String(question.source_type || 'VINA').toUpperCase().trim()
  if (source !== 'PYQ' && source !== 'VINA') {
    errors.push(`Invalid source_type '${source}'. Must be strictly 'PYQ' or 'VINA'.`)
  }

  // Check answer_key
  const key = String(question.answer_key || question.correct_option || '').toUpperCase().trim()
  if (!['A', 'B', 'C', 'D'].includes(key)) {
    errors.push(`Invalid answer_key '${key}'. Must be strictly A, B, C, or D (Option E is reserved for unattempted).`)
  }

  // Check question text
  if (!question.en_question_text && !question.question_text && !question.ta_question_text && !question.question_text_tamil) {
    errors.push('Question text is missing in both English and Tamil.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    examTag,
  }
}

// ─── Unit code from the approved catalog unit ────────────────────────────────
// The unit code comes from the v2 catalog for the exam group. A unit name that is not in
// the v2 catalog (for example a legacy "Unit 5: Indian Polity" name) returns null, so the
// question is not filed under a code the mock generator no longer uses.
export function isCatalogUnitName(unitName) {
  const name = String(unitName || '').trim()
  return TAXONOMY_V2.some(e => e.unit_name === name) || /^\s*(Unit\s*\d+\s*[:\u2014\u2013-]|Part A:)/i.test(name)
}

export function deriveUnitCode(examTag, unitName, macroTopic) {
  const tag = normalizeExamTag(examTag)
  const unit = String(unitName || '').trim()
  const hit = TAXONOMY_V2.find(e => e.exam_tag === tag && e.unit_name === unit)
  return hit ? hit.unit_code : null
}

// ─── 6. 29-Column Schema Normalization ───────────────────────────────────────
export function normalizeTo29Columns(rawQ, index = 1) {
  const examTag = normalizeExamTag(rawQ.exam_tag || rawQ.group_tag || rawQ.group_name)
  const source = (rawQ.source_type || (rawQ.is_pyq ? 'PYQ' : 'VINA')).toUpperCase().trim()
  const qId = rawQ.question_id || rawQ.id || `${examTag === 'TNPSC_GROUP_1' ? 'G1' : examTag === 'TNPSC_GROUP_2' ? 'G2' : 'G4'}_${source}_${String(index).padStart(4, '0')}`

  // Clean bilingual question separation
  let rawStemEn = String(rawQ.en_question_text || rawQ.question_text || '').trim()
  let rawStemTa = String(rawQ.ta_question_text || rawQ.question_text_tamil || '').trim()

  let enText = rawStemEn
  let taText = rawStemTa

  // Look up pre-translated English if this question was extracted from Tamil or lacks pure English
  const tr = questionTranslations[rawQ.id] ||
             questionTranslations[rawQ.question_id] ||
             (rawStemTa ? questionTranslations[rawStemTa.trim()] : null) ||
             (rawStemEn ? questionTranslations[rawStemEn.trim()] : null)

  const taCharCount = (rawStemEn.match(/[\u0B80-\u0BFF]/g) || []).length
  const cleanEnStem = rawStemEn.replace(/\[A\]|\[R\]|\[General Tamil\]|\[Tamil\]/gi, '')
  const latinWords = (cleanEnStem.match(/[a-zA-Z]{2,}/g) || [])
  const isPureTamilStem = taCharCount > 0 && latinWords.length < 3

  if (rawStemEn.includes('தமிழ்:')) {
    const parts = rawStemEn.split('தமிழ்:')
    enText = parts[0].trim()
    if (!taText) taText = parts[1].trim()
  } else if (rawStemEn.includes('\n') && /[a-zA-Z]/.test(rawStemEn) && /[\u0B80-\u0BFF]/.test(rawStemEn) && !isPureTamilStem) {
    const lines = rawStemEn.split('\n').map(l => l.trim()).filter(Boolean)
    const enLines = lines.filter(l => /[a-zA-Z]/.test(l) && !/[\u0B80-\u0BFF]/.test(l))
    const taLines = lines.filter(l => /[\u0B80-\u0BFF]/.test(l))
    if (enLines.length > 0) enText = enLines.join(' ')
    if (!taText && taLines.length > 0) taText = taLines.join(' ')
  } else if (isPureTamilStem) {
    if (!taText) taText = rawStemEn
    enText = tr?.en_question_text || rawQ.en_question_text || rawStemEn
  }

  // If translation exists in dictionary, apply it
  if (tr && tr.en_question_text) {
    enText = tr.en_question_text
  }

  // Clean bilingual options separation
  const splitOpt = (optEnRaw, optTaRaw, key) => {
    let en = String(optEnRaw || '').replace(/^\(?[A-Da-d]\)?\s*[-.:]?\s*/, '').trim()
    let ta = String(optTaRaw || '').replace(/^\(?[A-Da-d]\)?\s*[-.:]?\s*/, '').trim()

    if (en.includes(' / ')) {
      const parts = en.split(' / ')
      const p1 = parts[0].trim()
      const p2 = parts[1].trim()
      if (/[a-zA-Z]/.test(p1) && /[\u0B80-\u0BFF]/.test(p2)) {
        en = p1
        if (!ta) ta = p2
      } else if (/[\u0B80-\u0BFF]/.test(p1) && /[a-zA-Z]/.test(p2)) {
        en = p2
        if (!ta) ta = p1
      }
    } else if (/[\u0B80-\u0BFF]/.test(en) && !/[a-zA-Z]/.test(en)) {
      if (!ta) ta = en
    }

    if (tr && tr[`en_option_${key}`]) {
      en = tr[`en_option_${key}`]
    }

    return { en: en || ta, ta: ta || en }
  }

  const optA = splitOpt(rawQ.en_option_a || rawQ.option_a, rawQ.ta_option_a || rawQ.option_a_tamil, 'a')
  const optB = splitOpt(rawQ.en_option_b || rawQ.option_b, rawQ.ta_option_b || rawQ.option_b_tamil, 'b')
  const optC = splitOpt(rawQ.en_option_c || rawQ.option_c, rawQ.ta_option_c || rawQ.option_c_tamil, 'c')
  const optD = splitOpt(rawQ.en_option_d || rawQ.option_d, rawQ.ta_option_d || rawQ.option_d_tamil, 'd')

  const expl = rawQ.explanation || ''
  let enExpl = rawQ.en_explanation || expl.replace(/\[Metadata:[^\]]+\]\s*/g, '').replace(/\[Taxonomy:[^\]]+\]\s*/g, '').trim()
  let taExpl = rawQ.ta_explanation || rawQ.explanation_tamil || ''

  // Infer unit_code if not explicitly set
  const catalogUnitName = rawQ.unit_name || rawQ.unit_tag || ''
  let uCode = rawQ.unit_code
    || deriveUnitCode(examTag, catalogUnitName, rawQ.macro_topic_name || rawQ.macro_topic)
    || ''
  // Catalog-style names are decided above; the loose guesses below are only for other formats
  if (!uCode && !isCatalogUnitName(catalogUnitName)) {
    const uName = (rawQ.unit_name || rawQ.unit_tag || '').toUpperCase()
    if (uName.includes('SCIENCE') || uName.includes('UNIT 1') || uName === '1') uCode = 'UNIT_I'
    else if (uName.includes('GEOGRAPHY') || uName.includes('UNIT 2') || uName === '2') uCode = 'UNIT_II'
    else if (uName.includes('HISTORY') || uName.includes('UNIT 3') || uName === '3') uCode = 'UNIT_III'
    else if (uName.includes('POLITY') || uName.includes('UNIT 4') || uName === '4') uCode = 'UNIT_IV'
    else if (uName.includes('ECONOMY') || uName.includes('UNIT 5') || uName === '5') uCode = 'UNIT_V'
    else if (uName.includes('HERITAGE') || uName.includes('UNIT 6') || uName === '6') uCode = 'UNIT_VI'
    else if (uName.includes('APTITUDE') || uName.includes('UNIT 10') || uName === '10') uCode = 'APT_UNIT_I'
    else if (uName.includes('TAMIL') || uName.includes('UNIT 11') || uName === '11') uCode = 'LANG_TA_A'
    else if (uName.includes('ENGLISH')) uCode = 'LANG_EN_A'
    else uCode = ''
  }

  const answerKey = String(rawQ.answer_key || rawQ.correct_option || 'A').toUpperCase().trim()

  return {
    // 1-5
    question_id: qId,
    content_hash: rawQ.content_hash || '',
    exam_tag: examTag,
    source_type: source === 'PYQ' ? 'PYQ' : 'VINA',
    year: parseInt(rawQ.year || rawQ.exam_year, 10) || (source === 'PYQ' ? 2024 : 2026),

    // 6-10
    subject_name: rawQ.subject_name || rawQ.subject || (uCode.startsWith('LANG_TA') ? 'General Tamil' : uCode.startsWith('LANG_EN') ? 'General English' : uCode.startsWith('APT') ? 'Aptitude & Mental Ability' : 'General Studies'),
    unit_code: uCode,
    macro_topic: rawQ.macro_topic || rawQ.macro_topic_name || 'General',
    micro_topic: rawQ.micro_topic || rawQ.micro_topic_name || 'General Concepts',
    sub_topic: rawQ.sub_topic || rawQ.topic_name || '',

    // 11-14
    difficulty_level: (rawQ.difficulty_level || 'MEDIUM').toUpperCase(),
    question_type: (rawQ.question_type || 'MULTIPLE_CHOICE').toUpperCase(),
    cognitive_skill: (rawQ.cognitive_skill || 'FACTUAL_RECALL').toUpperCase(),
    ideal_time_seconds: parseInt(rawQ.ideal_time_seconds, 10) || 54,

    // 15-20 (English stem + options)
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
    ta_option_e: 'விடை தெரியவில்லை',

    // 27-29 (Answer key & bilingual explanations)
    answer_key: ['A', 'B', 'C', 'D'].includes(answerKey) ? answerKey : 'A',
    en_explanation: enExpl,
    ta_explanation: taExpl,
  }
}

// ─── 7. Master Taxonomy CSV Exporter ─────────────────────────────────────────
export function generateMasterTaxonomyCsv(taxonomyList) {
  const headers = ['exam_tag', 'subject_name', 'unit_code', 'macro_topic', 'micro_topic', 'sub_topic']
  const escapeCell = (val) => `"${String(val || '').replace(/"/g, '""')}"`

  const rows = taxonomyList.map(item =>
    headers.map(h => escapeCell(item[h])).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

// ─── 8. Approved Catalog Mapping (question_taxonomy) ────────────────────────
// Looks up the micro topic in the v2 catalog for the exam group. The approved unit,
// macro and micro names come from that entry, so the database trigger (migration 00013,
// extended by 00020) accepts them. Returns null when the micro topic is not in the catalog.
export function mapToApprovedCatalog(row, examTag) {
  const tag = normalizeExamTag(examTag || row.exam_tag)
  const micro = String(row.micro_topic || '').trim()
  const macro = String(row.macro_topic || '').trim()
  const candidates = TAXONOMY_V2.filter(e => e.exam_tag === tag && e.micro_topic === micro)
  if (candidates.length === 0) return null
  const hit = candidates.find(e => e.macro_topic === macro) || candidates[0]
  return {
    unit_code: hit.unit_code,
    unit_name: hit.unit_name,
    macro_topic: hit.macro_topic,
    micro_topic: hit.micro_topic,
  }
}

export function generate29ColumnTemplateCsv() {
  const headers = [
    'question_id', 'content_hash', 'exam_tag', 'source_type', 'year',
    'subject_name', 'unit_code', 'macro_topic', 'micro_topic', 'sub_topic',
    'difficulty_level', 'question_type', 'cognitive_skill', 'ideal_time_seconds',
    'en_question_text', 'en_option_a', 'en_option_b', 'en_option_c', 'en_option_d', 'en_option_e',
    'ta_question_text', 'ta_option_a', 'ta_option_b', 'ta_option_c', 'ta_option_d', 'ta_option_e',
    'answer_key', 'en_explanation', 'ta_explanation'
  ]
  return headers.join(',') + '\n'
}
