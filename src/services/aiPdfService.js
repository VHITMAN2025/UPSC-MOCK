import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { apiKeyService } from './apiKeyService.js'
import { CANONICAL_SYLLABUS_TAXONOMY, syllabusAnalyticsService } from './syllabusAnalyticsService.js'
import { normalizeUnitName } from '../components/admin/TopicSeparationSummary.jsx'
import { supabase } from '../lib/supabase.js'
import * as pdfjsLib from 'pdfjs-dist'
import questionTranslations from '../data/question_translations.js'
import { TAXONOMY_V2 } from '../data/taxonomyV2.js'

const CANONICAL_MICROS = CANONICAL_SYLLABUS_TAXONOMY.flatMap(u =>
  u.macro_topics.flatMap(mt =>
    mt.micro_topics.map(m => ({
      ...m,
      unit_name: u.unit_name,
      macro_topic_name: mt.macro_topic_name,
    }))
  )
)

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const PDF_BATCH_SIZE = 4

function ensurePdfWorker() {
  if (pdfjsLib?.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  }
}

function base64ToBytes(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function renderPdfPageAsJpeg(page) {
  const viewport = page.getViewport({ scale: 1.25 })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const context = canvas.getContext('2d', { alpha: false })
  await page.render({ canvasContext: context, viewport }).promise
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.82)
  canvas.width = 1
  canvas.height = 1
  return jpegDataUrl.split(',')[1]
}

async function extractLongPdfInBatches(base64Data, preferredModel, onStatusUpdate, customApiKey, options) {
  ensurePdfWorker()
  const pdf = await pdfjsLib.getDocument({ data: base64ToBytes(base64Data), stopAtErrors: false }).promise
  const totalBatches = Math.ceil(pdf.numPages / PDF_BATCH_SIZE)
  const allQuestions = []
  const seen = new Set()

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
    const firstPage = batchIndex * PDF_BATCH_SIZE + 1
    const lastPage = Math.min(pdf.numPages, firstPage + PDF_BATCH_SIZE - 1)
    onStatusUpdate?.(`Reading pages ${firstPage}-${lastPage} of ${pdf.numPages} (batch ${batchIndex + 1}/${totalBatches})…`)
    const pageParts = []
    for (let pageNo = firstPage; pageNo <= lastPage; pageNo += 1) {
      const page = await pdf.getPage(pageNo)
      pageParts.push({ inlineData: { data: await renderPdfPageAsJpeg(page), mimeType: 'image/jpeg' } })
      page.cleanup()
    }

    const extracted = await extractQuestionsWithAi('', preferredModel, onStatusUpdate, customApiKey, {
      ...options,
      pageParts,
      pageStart: firstPage,
      pageEnd: lastPage,
      skipPdfBatching: true,
    })

    for (const question of extracted) {
      // Bilingual papers can show the same question on adjoining pages. Keep it once.
      const key = String(question.question_number || '').trim() || String(question.question_text || '').trim().toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      allQuestions.push(question)
    }
    // Avoid Gemini rate-limit bursts while preserving predictable progress.
    if (batchIndex < totalBatches - 1) await delay(350)
  }

  await pdf.destroy()
  return allQuestions.sort((a, b) => Number(a.question_number) - Number(b.question_number))
}

// Built-in fallback: the v2 catalog (src/data/taxonomyV2.js), used when the database
// list cannot be loaded. Same shape as the question_taxonomy rows.
export const FALLBACK_APPROVED_TAXONOMY = TAXONOMY_V2.map(e => ({
  exam_group: e.exam_tag,
  unit_name: e.unit_name,
  macro_topic_name: e.macro_topic,
  micro_topic_name: e.micro_topic,
}))

export async function loadApprovedPdfTaxonomy() {
  try {
    const { data, error } = await supabase
      .from('question_taxonomy')
      .select('exam_group, unit_name, macro_topic_name, micro_topic_name')
      .eq('active', true)
      .in('exam_group', ['TNPSC_GROUP_1', 'TNPSC_GROUP_2', 'TNPSC_GROUP_4'])
      .order('unit_name')
    if (!error && data?.length) return data
  } catch (err) {
    console.warn('Could not query question_taxonomy from Supabase, using fallback list:', err.message)
  }
  return FALLBACK_APPROVED_TAXONOMY
}

/**
 * Deterministic classifier guaranteeing that EVERY extracted question
 * is accurately mapped to an approved syllabus topic row.
 */
export function matchToApprovedTaxonomy(q, approvedList) {
  const list = (approvedList && approvedList.length > 0) ? approvedList : FALLBACK_APPROVED_TAXONOMY
  const cleanStr = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const reqUnit = cleanStr(q.unit_name)
  const reqMacro = cleanStr(q.macro_topic_name)
  const reqMicro = cleanStr(q.micro_topic_name)

  // 1. Direct exact 3-tuple match
  if (reqUnit && reqMacro && reqMicro) {
    const directExact = list.find(t =>
      cleanStr(t.unit_name) === reqUnit &&
      cleanStr(t.macro_topic_name) === reqMacro &&
      cleanStr(t.micro_topic_name) === reqMicro
    )
    if (directExact) return directExact
  }

  // 2. Direct micro_topic_name match
  if (reqMicro) {
    const microExact = list.find(t => cleanStr(t.micro_topic_name) === reqMicro)
    if (microExact) return microExact

    const genericWords = ['tamil', 'science', 'general', 'history', 'english', 'india', 'units']
    if (!genericWords.includes(reqMicro)) {
      const microSub = list.find(t => {
        const tm = cleanStr(t.micro_topic_name)
        return tm.length > 5 && (reqMicro.includes(tm) || (reqMicro.length > 6 && tm.includes(reqMicro)))
      })
      if (microSub) return microSub
    }
  }

  // 3. Direct macro_topic_name match
  if (reqMacro) {
    const macroMatches = list.filter(t => {
      const tm = cleanStr(t.macro_topic_name)
      return tm.length > 3 && (reqMacro.includes(tm) || tm.includes(reqMacro))
    })
    if (macroMatches.length > 0) {
      if (reqUnit) {
        const unitFiltered = macroMatches.find(t => cleanStr(t.unit_name).includes(reqUnit) || reqUnit.includes(cleanStr(t.unit_name)))
        if (unitFiltered) return unitFiltered
      }
      return macroMatches[0]
    }
  }

  // 4. Content / Question text heuristic matching
  const fullText = [
    q.question_text,
    q.question_text_english,
    q.question_text_tamil,
    q.english_question,
    q.tamil_question,
    q.option_a,
    q.option_b,
    q.option_c,
    q.option_d,
    q.unit_name,
    q.macro_topic_name,
    q.micro_topic_name,
    q.explanation,
  ].filter(Boolean).join(' ')

  const lowText = fullText.toLowerCase()
  const isTamil = /[஀-௿]/.test(fullText) || lowText.includes('general tamil') || lowText.includes('பொதுத்தமிழ்') || lowText.includes('thirukkural')

  if (isTamil) {
    const tamilRows = list.filter(t => t.unit_name.includes('General Tamil'))
    if (tamilRows.length > 0) {
      // Check Ilakkanam (Grammar)
      const isGrammar = /இலக்கண|பொருத்து|வேர்ச்சொல்|பிரி|சொல்லின் பொருள்|பிழை|எழுத்து|சொல்|விதி|வாக்கியம்|வினை|பெயர்ச்சொல்|எதிர்ச்சொல்|அகராதி|மரபு|வழு|grammar/i.test(lowText)
      if (isGrammar) {
        if (/பொருத்து|பிரி|வேர்ச்சொல்|எதிர்ச்சொல்|அகராதி/i.test(lowText)) {
          const match = tamilRows.find(x => x.micro_topic_name.includes('Poruthuthal'))
          if (match) return match
        }
        const match = tamilRows.find(x => x.micro_topic_name.includes('Pizhai Thiruththam'))
        if (match) return match
        const anyGrammar = tamilRows.find(x => x.macro_topic_name.includes('Grammar') || x.macro_topic_name.includes('Ilakkanam'))
        if (anyGrammar) return anyGrammar
      }

      // Check Tamil Arignargal (Scholars)
      const isScholars = /பாரதி|நாமக்கல்|கவிமணி|உ.வே.சா|போப்|வீரமாமுனி|பெரியா|அண்ணா|அம்பேத்க|உரைநடை|தொண்டு|நாடக|கவிஞ|அறிஞ|scholars|writer|author/i.test(lowText)
      if (isScholars) {
        if (/பாரதி|கவிஞ|கவிதை/i.test(lowText)) {
          const match = tamilRows.find(x => x.micro_topic_name.includes('Bharathiyar'))
          if (match) return match
        }
        const match = tamilRows.find(x => x.micro_topic_name.includes('Samudhaya'))
        if (match) return match
        const anyScholars = tamilRows.find(x => x.macro_topic_name.includes('Scholars') || x.macro_topic_name.includes('Arignargal'))
        if (anyScholars) return anyScholars
      }

      // Check Ilakkaiyam (Literature)
      if (/திருக்குறள்|குறள்|எட்டுத்தொகை|நற்றிணை|குறுந்தொகை|புறநானூறு|அகநானூறு|ஐங்குறுநூறு|கலித்தொகை|நாலடியார்|நான்மணிக்கடிகை/i.test(lowText)) {
        const match = tamilRows.find(x => x.micro_topic_name.includes('Thirukkural'))
        if (match) return match
      }
      if (/பத்துப்பாட்டு|காப்பியம்|சிலப்பதிகாரம்|மணிமேகலை|சீவகசிந்தாமணி|குண்டலகேசி|வளையாபதி|கம்பராமாயணம்|கம்ப/i.test(lowText)) {
        const match = tamilRows.find(x => x.micro_topic_name.includes('Kaapiyangal') || x.micro_topic_name.includes('Paththuppaattu'))
        if (match) return match
      }

      // Default Tamil match: Literature
      return tamilRows.find(x => x.micro_topic_name.includes('Thirukkural')) ||
             tamilRows.find(x => x.macro_topic_name.includes('Literature')) ||
             tamilRows[0]
    }
  }

  // General Studies matching:
  // Unit 10: Aptitude
  if (/hcf|lcm|ratio|proportion|percentage|interest|area|volume|time and work|aptitude|reasoning|simplification|puzzle|dice|series/i.test(lowText)) {
    const apt = list.find(x => x.unit_name.includes('Unit 10') && (x.micro_topic_name.includes('Simplification') || x.macro_topic_name.includes('Quantitative'))) ||
                list.find(x => x.unit_name.includes('Unit 10'))
    if (apt) return apt
  }

  // Unit 5: Polity
  if (/constitution|polity|article|amendment|fundamental right|fundamental duties|dpsp|president|governor|parliament|supreme court|high court|panchayat|lok sabha|rajya sabha/i.test(lowText)) {
    const pol = list.find(x => x.unit_name.includes('Unit 5') && x.micro_topic_name.includes('Fundamental')) ||
                list.find(x => x.unit_name.includes('Unit 5'))
    if (pol) return pol
  }

  // Unit 6: Economy
  if (/economy|economic|rbi|reserve bank|inflation|monetary|fiscal|tax|gst|niti aayog|five year plan|budget/i.test(lowText)) {
    const eco = list.find(x => x.unit_name.includes('Unit 6'))
    if (eco) return eco
  }

  // Unit 7: National Movement
  if (/national movement|1857|congress|gandhi|satyagraha|quit india|non-cooperation|civil disobedience|bhagat singh|tilak/i.test(lowText)) {
    const nat = list.find(x => x.unit_name.includes('Unit 7'))
    if (nat) return nat
  }

  // Unit 4: History & Culture
  if (/indus valley|harappa|gupta|delhi sultanate|mughal|maratha|chola|pandya|pallava/i.test(lowText)) {
    const his = list.find(x => x.unit_name.includes('Unit 4'))
    if (his) return his
  }

  // Unit 3: Geography
  if (/geography|river|monsoon|rainfall|soil|mineral|climate|agriculture|crop|plateau|western ghats/i.test(lowText)) {
    const geo = list.find(x => x.unit_name.includes('Unit 3'))
    if (geo) return geo
  }

  // Unit 8: TN History & Culture
  if (/sangam|tamil society|keeladi|archaeological|justice party|dravidian|periyar|self-respect/i.test(lowText)) {
    const tnh = list.find(x => x.unit_name.includes('Unit 8'))
    if (tnh) return tnh
  }

  // Unit 9: TN Administration
  if (/tamil nadu|e-governance|welfare scheme|social justice|reservation/i.test(lowText)) {
    const tna = list.find(x => x.unit_name.includes('Unit 9'))
    if (tna) return tna
  }

  // Unit 1: Science
  if (/physics|chemistry|biology|science|light|sound|motion|force|gravity|energy|acid|base|salt|element|cell|blood|disease|diet|ecology/i.test(lowText)) {
    const sci = list.find(x => x.unit_name.includes('Unit 1'))
    if (sci) return sci
  }

  // Unit 2: Current Events
  if (/current events|summit|award|personalities|places in news/i.test(lowText)) {
    const cur = list.find(x => x.unit_name.includes('Unit 2'))
    if (cur) return cur
  }

  if (reqUnit) {
    const unitMatch = list.find(x => cleanStr(x.unit_name).includes(reqUnit) || reqUnit.includes(cleanStr(x.unit_name)))
    if (unitMatch) return unitMatch
  }

  return list[0]
}

const taxonomyKey = (unit, macro, micro) => [unit, macro, micro].map(v => String(v || '').trim().toLowerCase()).join('|')

export async function fetchAvailableGeminiModels(apiKey) {
  if (!apiKey || apiKey.includes('your_gemini')) return []
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    const data = await res.json()
    if (data.models) {
      const paidOrRestricted = /tts|image|banana|clip|lyria|robotics|computer-use|argon|3\.8|gemini-4/i
      const approvedFree = data.models
        .filter((m) => m.supportedGenerationMethods?.includes('generateContent') && m.name.includes('gemini') && !paidOrRestricted.test(m.name))
        .map((m) => ({ id: m.name.split('/')[1], name: m.displayName || m.name.split('/')[1] }))
      if (approvedFree.length > 0) return approvedFree
    }
  } catch (e) {
    console.error('Failed to fetch Gemini models', e)
  }
  return [
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Free Tier - Recommended)' },
    { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite Latest (Free Tier)' },
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (Free Tier)' },
    { id: 'gemini-flash-latest', name: 'Gemini Flash Latest' },
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' },
  ]
}

/**
 * Converts Blob or File to base64 string
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target.result
      const base64 = typeof result === 'string' && result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(blob)
  })
}

/**
 * Helper to safely extract JSON array of questions from response text or candidate parts
 */
function parseJsonQuestions(rawText) {
  if (!rawText || typeof rawText !== 'string') return null
  const cleaned = rawText.replace(/```(?:json)?/gi, '').trim()

  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch {}

  const startIdx = cleaned.indexOf('[')
  const lastIdx = cleaned.lastIndexOf(']')
  if (startIdx !== -1 && lastIdx !== -1 && lastIdx > startIdx) {
    try {
      const slice = cleaned.slice(startIdx, lastIdx + 1)
      const parsed = JSON.parse(slice)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {}
  }

  // Attempt to repair trailing truncated JSON array by walking backwards across braces
  if (startIdx !== -1) {
    let curEnd = cleaned.length
    while (curEnd > startIdx) {
      const lastBrace = cleaned.lastIndexOf('}', curEnd)
      if (lastBrace === -1 || lastBrace <= startIdx) break
      try {
        const repaired = cleaned.slice(startIdx, lastBrace + 1) + ']'
        const parsed = JSON.parse(repaired)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch {}
      curEnd = lastBrace - 1
    }
  }

  return null
}

const SYSTEM_INSTRUCTION = `You are an expert educational assessment parser and quiz generator specialized in TNPSC and UPSC exams.
Your role is to analyze examination papers and convert the questions into structured interactive bilingual practice quiz items for students.
CRITICAL MANDATORY BILINGUAL REQUIREMENTS (Both English AND Tamil MUST be provided for EVERY question):
1. For every question:
   - "question_text" / "question_text_english": Pure, clear English question stem. If paper is bilingual or English, extract the English stem. If the paper is only in Tamil (e.g. General Tamil), provide an accurate, high-quality English translation/meaning of the question stem here.
   - "question_text_tamil": Authentic Tamil question stem. If paper is bilingual or Tamil, extract the Tamil text. If the paper is only in English, provide an accurate Tamil translation here.
2. For Options (A, B, C, D):
   - "option_a", "option_b", "option_c", "option_d": Pure English text for each option. Do NOT include Tamil text, slashes, or option labels like (A). If original options are in Tamil, translate each option to English.
   - "option_a_tamil", "option_b_tamil", "option_c_tamil", "option_d_tamil": Pure Tamil text for each option. Do NOT include English text, slashes, or option labels. If original options are in English, translate each option to Tamil.
3. Formulate clear, self-contained question stems. Do not reproduce document borders, page numbers, instructions to candidates, or official headers.
4. Accurately capture all 4 options (A, B, C, D) and identify the correct option if indicated by tick marks, keys, or standard knowledge.
5. Provide explanations in both languages: "explanation" (in English) and "explanation_tamil" (in Tamil).
6. Provide the output strictly as a JSON array of question objects.
7. Categorize each question into the official TNPSC revised syllabus taxonomy provided in the APPROVED TAXONOMY (closed list):
   - Analyze the question topic and concept carefully.
   - For every question, select the EXACT "unit_name", "macro_topic_name", and "micro_topic_name" from the APPROVED TAXONOMY list.
   - Never invent, paraphrase, or create new unit, macro-topic, or micro-topic names. Pick the single closest matching entry from the list.`

const PRIMARY_PROMPT = `You are an exhaustive, high-precision TNPSC and competitive exam question paper extractor.
CRITICAL MANDATORY INSTRUCTIONS:
1. Scan and read EVERY SINGLE PAGE of this entire PDF from the first page through to the very last page.
2. Extract ALL questions present across all pages (from Question 1 to the final question, e.g. Questions 1 through 100).
3. DO NOT stop early or truncate after the first page! You MUST extract every single question in sequential order.
4. BILINGUAL EXTRACTION (CRITICAL): Provide BOTH English AND Tamil for EVERY question:
   - "question_text": Clear English question stem (translate if original was Tamil-only).
   - "question_text_tamil": Authentic Tamil question stem (translate if original was English-only).
   - "option_a", "option_b", "option_c", "option_d": Pure English option texts (without leading (A)).
   - "option_a_tamil", "option_b_tamil", "option_c_tamil", "option_d_tamil": Pure Tamil option texts.
5. Identify the correct answer: Examine the document for hand-drawn pen tick marks, marks, or keys next to options (A, B, C, D). If indicated by a tick mark, set correct_option to 'A', 'B', 'C', or 'D'.
6. Match each question to the closest unit_name, macro_topic_name, and micro_topic_name from the APPROVED TAXONOMY.

Return strictly a JSON array of objects with this schema:
[
  {
    "question_number": 1,
    "question_text": "<clear English question stem>",
    "question_text_tamil": "<authentic Tamil question stem>",
    "option_a": "<option A text in English>",
    "option_a_tamil": "<option A text in Tamil>",
    "option_b": "<option B text in English>",
    "option_b_tamil": "<option B text in Tamil>",
    "option_c": "<option C text in English>",
    "option_c_tamil": "<option C text in Tamil>",
    "option_d": "<option D text in English>",
    "option_d_tamil": "<option D text in Tamil>",
    "correct_option": "<'A', 'B', 'C', 'D' from tick mark/key or null>",
    "explanation": "<concept explanation in English>",
    "explanation_tamil": "<explanation in Tamil>",
    "unit_name": "<matching unit_name or null>",
    "macro_topic_name": "<matching macro_topic_name or null>",
    "micro_topic_name": "<matching micro_topic_name or null>"
  }
]
Output valid JSON only.`

const ANTI_RECITATION_PROMPT = `The previous extraction was flagged by automated recitation filters.
Please re-generate the practice quiz items from this document with educational paraphrasing:
1. Rephrase the question stems using your own clear, concise wording so it does not match copyrighted published texts verbatim, while strictly preserving the technical concepts, factual meaning, and correct answer.
2. If bilingual, provide both English and Tamil: "<English Question>\\nதமிழ்: <Tamil Question>".
3. Capture options A, B, C, D clearly (e.g. "<English> / <Tamil>").
4. Output strictly as a valid JSON array of objects matching the schema.`

/**
 * Extracts structured questions from PDF using Gemini Vision with multi-pass anti-recitation defense.
 * Overcomes RECITATION blocks via educational paraphrasing, higher sampling temperature, and model cascade.
 */
export async function extractQuestionsWithAi(base64Data, preferredModel = 'gemini-3.1-flash-lite', onStatusUpdate, customApiKey = null, options = {}) {
  const envKey = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_GEMINI_API_KEY) ||
                 (typeof process !== 'undefined' && (process.env?.GEMINI_API_KEY || process.env?.VITE_GEMINI_API_KEY)) || ''

  // Priority:
  // 1. Explicit customApiKey passed into function
  // 2. User settings / Admin settings key stored in localStorage (apiKeyService.getUserApiKey())
  // 3. Project envKey (.env VITE_GEMINI_API_KEY)
  let activeKey = (customApiKey && customApiKey.trim().length > 0)
    ? customApiKey.trim()
    : (apiKeyService.getUserApiKey() || envKey).trim()

  if (!activeKey) {
    const err = new Error('NO_API_KEY_CONFIGURED')
    err.code = 'NO_API_KEY_CONFIGURED'
    throw err
  }

  const approvedTaxonomy = options.approvedTaxonomy || await loadApprovedPdfTaxonomy()

  // Full undivided PDF sent directly to model (no batching/division)
  let genAI = new GoogleGenerativeAI(activeKey)
  const cleanStr = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const approvedByKey = new Map(approvedTaxonomy.map(t => [taxonomyKey(t.unit_name, t.macro_topic_name, t.micro_topic_name), t]))
  const approvedByCleanKey = new Map(approvedTaxonomy.map(t => [`${cleanStr(t.unit_name)}|${cleanStr(t.macro_topic_name)}|${cleanStr(t.micro_topic_name)}`, t]))
  const approvedByMicro = new Map(approvedTaxonomy.map(t => [cleanStr(t.micro_topic_name), t]))
  const taxonomyPrompt = approvedTaxonomy.map((t, i) => `${i + 1}. ${t.unit_name} > ${t.macro_topic_name} > ${t.micro_topic_name}`).join('\n')
  const availableModels = await fetchAvailableGeminiModels(activeKey)

  const candidateList = [
    preferredModel,
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash',
    ...availableModels.map((m) => m.id),
  ].filter(m => m && !/tts|image|banana|clip|lyria|robotics|computer-use|argon|3\.5-flash$|3\.6|3\.7|gemini-4|pro/i.test(m))

  const modelsToTry = Array.from(new Set(candidateList.filter(Boolean)))
  let lastError = null
  const MAX_MODELS = Math.min(4, modelsToTry.length)

  const notify = (msg) => {
    if (typeof onStatusUpdate === 'function') {
      try { onStatusUpdate(msg) } catch (e) { console.warn('Status callback error:', e) }
    }
  }

  // Papers are not all 100 questions long, and they do not all start at question 1: a
  // General Studies booklet may run 101-200. So instead of fixed number ranges, ask for
  // the next batch of questions in the order they appear, continuing after the last one
  // captured, until a batch brings nothing new. Batches stay at 35 questions to fit
  // Gemini's output limit for one turn.
  const BATCH_SIZE = 35
  const MAX_BATCHES = 12
  const rawExtractedQuestions = []
  const seenNumbers = new Set()
  let lastCapturedNumber = null
  let stoppedEarly = false

  for (let rIdx = 0; rIdx < MAX_BATCHES; rIdx++) {
    const startAfter = lastCapturedNumber
    notify(startAfter === null
      ? 'Extracting the first questions...'
      : `Extracting the questions after number ${startAfter}...`)

    let batchParsed = null

    for (let mIdx = 0; mIdx < MAX_MODELS; mIdx++) {
      const currentModelId = modelsToTry[mIdx]
      const nextModelId = mIdx + 1 < MAX_MODELS ? modelsToTry[mIdx + 1] : null

      try {
        const model = genAI.getGenerativeModel({
          model: currentModelId,
          generationConfig: {
            temperature: 0.1,
            topP: 0.95,
            responseMimeType: 'application/json',
          },
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
        })

        const scopeLine = startAfter === null
          ? `the first ${BATCH_SIZE} questions of the paper, in the order they appear`
          : `the next ${BATCH_SIZE} questions of the paper, in the order they appear, starting with the question that comes immediately after question number ${startAfter}`

        const rangePrompt = `You are a high-precision TNPSC and competitive exam question paper extractor.
From the attached PDF exam document, extract ${scopeLine}, with their options (A, B, C, D) and correct_option detected from pen tick marks as a JSON array.
Use the question number printed in the paper for "question_number". The paper may start at a number other than 1, so do not renumber the questions.
If the paper has no further questions, return [].

CRITICAL MANDATORY BILINGUAL EXTRACTION:
Every single question MUST have BOTH English and authentic Tamil:
1. "question_text": Clear English question stem. If original was Tamil-only, translate it accurately to clear English here.
2. "question_text_tamil": Authentic Tamil question stem. If original was English-only, translate it accurately to Tamil here.
3. "option_a", "option_b", "option_c", "option_d": Pure English text for each option without (A) prefix or Tamil characters.
4. "option_a_tamil", "option_b_tamil", "option_c_tamil", "option_d_tamil": Pure Tamil text for each option without (A) prefix or English letters.
5. "explanation": English concept explanation.
6. "explanation_tamil": Tamil concept explanation.

MANDATORY TAXONOMY CLASSIFICATION:
For each question, classify it into the approved syllabus units. Set "unit_name", "macro_topic_name", and "micro_topic_name" EXACTLY from the approved list below:
${taxonomyPrompt}

Schema:
[
  {
    "question_number": <the number printed next to the question in the paper>,
    "question_text": "<clear English question stem>",
    "question_text_tamil": "<authentic Tamil question stem>",
    "option_a": "<option A text in English>",
    "option_a_tamil": "<option A text in Tamil>",
    "option_b": "<option B text in English>",
    "option_b_tamil": "<option B text in Tamil>",
    "option_c": "<option C text in English>",
    "option_c_tamil": "<option C text in Tamil>",
    "option_d": "<option D text in English>",
    "option_d_tamil": "<option D text in Tamil>",
    "correct_option": "<'A', 'B', 'C', 'D' from tick mark/key or null>",
    "explanation": "<concept explanation in English>",
    "explanation_tamil": "<explanation in Tamil>",
    "unit_name": "<EXACT matching unit_name from approved list above>",
    "macro_topic_name": "<EXACT matching macro_topic_name from approved list above>",
    "micro_topic_name": "<EXACT matching micro_topic_name from approved list above>"
  }
]
Output valid JSON only.`

        let response
        try {
          response = await model.generateContent([
            rangePrompt,
            { inlineData: { data: base64Data, mimeType: 'application/pdf' } },
          ])
        } catch (callErr) {
          const isAuthError = callErr.message?.includes('401') ||
                              callErr.message?.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
                              callErr.message?.includes('API key not valid')
          if (isAuthError && envKey && envKey.trim() !== activeKey) {
            console.warn('[Gemini] Active key failed 401 authentication. Purging stale key and falling back to project key...')
            try {
              localStorage.removeItem('vina_gemini_api_key')
              localStorage.removeItem('vina_admin_gemini_api_key')
            } catch {}
            activeKey = envKey.trim()
            genAI = new GoogleGenerativeAI(activeKey)
            const fallbackModel = genAI.getGenerativeModel({
              model: currentModelId,
              generationConfig: {
                temperature: 0.1,
                topP: 0.95,
                responseMimeType: 'application/json',
              },
              safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              ],
            })
            response = await fallbackModel.generateContent([
              rangePrompt,
              { inlineData: { data: base64Data, mimeType: 'application/pdf' } },
            ])
          } else {
            throw callErr
          }
        }

        let rawText = ''
        const candidate = response?.response?.candidates?.[0]
        if (candidate?.content?.parts?.length > 0) {
          rawText = candidate.content.parts.map(p => p.text || '').join('').trim()
        }

        if (!rawText) {
          try {
            rawText = response.response.text()
          } catch (textErr) {
            if (candidate?.finishReason === 'RECITATION' || textErr.message?.includes('RECITATION')) {
              throw new Error('Candidate was blocked due to RECITATION')
            }
            throw textErr
          }
        }

        const parsed = parseJsonQuestions(rawText)
        if (Array.isArray(parsed)) {
          batchParsed = parsed
          break
        }
        // After the first batch, an explicit empty list is the model saying the paper has
        // ended. Accept it instead of retrying other models, which would resend the whole PDF.
        if (rIdx > 0 && /^\s*(?:```(?:json)?)?\s*\[\s*\]\s*(?:```)?\s*$/i.test(rawText || '')) {
          batchParsed = []
          break
        }
      } catch (err) {
        lastError = err
        console.warn(`[Gemini] Batch ${rIdx + 1} attempt failed on ${currentModelId}:`, err.message)
        if (nextModelId) {
          await delay(1000)
        }
      }
    }

    let addedThisBatch = 0
    if (Array.isArray(batchParsed)) {
      for (const q of batchParsed) {
        const printed = Number(q.question_number)
        const qNum = Number.isFinite(printed) && printed > 0 ? printed : (rawExtractedQuestions.length + 1)
        if (!seenNumbers.has(qNum)) {
          seenNumbers.add(qNum)
          rawExtractedQuestions.push(q)
          addedThisBatch++
          if (lastCapturedNumber === null || qNum > lastCapturedNumber) lastCapturedNumber = qNum
        }
      }
    } else if (rIdx > 0) {
      // Every model failed on a later batch: keep what was captured, but say so below
      stoppedEarly = true
    }

    if (addedThisBatch > 0) {
      notify(`Captured ${rawExtractedQuestions.length} questions so far...`)
    } else {
      // Nothing new: the paper has ended (or the batch failed, handled above)
      break
    }
  }

  // Tell the admin what was captured and whether any question numbers are missing
  if (rawExtractedQuestions.length > 0) {
    const numbers = Array.from(seenNumbers).sort((x, y) => x - y)
    const low = numbers[0]
    const high = numbers[numbers.length - 1]
    const missing = []
    for (let n = low; n <= high; n++) if (!seenNumbers.has(n)) missing.push(n)
    const missingNote = missing.length > 0
      ? ` Not found: ${missing.slice(0, 25).join(', ')}${missing.length > 25 ? ', ...' : ''}.`
      : ''
    const earlyNote = stoppedEarly ? ' Extraction stopped early because a batch failed; run it again to continue.' : ''
    notify(`Captured ${rawExtractedQuestions.length} questions (numbers ${low}-${high}).${missingNote}${earlyNote}`)
  }

  if (rawExtractedQuestions.length === 0) {
    throw new Error(lastError?.message || 'Failed to extract questions from PDF.')
  }

  // Helper to cleanly separate English and Tamil text
  const splitBilingualStem = (rawEn, rawTa) => {
    let en = String(rawEn || '').trim()
    let ta = String(rawTa || '').trim()

    if (en.includes('தமிழ்:')) {
      const parts = en.split('தமிழ்:')
      en = parts[0].trim()
      if (!ta) ta = parts[1].trim()
    } else if (en.includes('\n') && /[a-zA-Z]/.test(en) && /[\u0B80-\u0BFF]/.test(en)) {
      const lines = en.split('\n').map(l => l.trim()).filter(Boolean)
      const enLines = lines.filter(l => /[a-zA-Z]/.test(l) && !/[\u0B80-\u0BFF]/.test(l))
      const taLines = lines.filter(l => /[\u0B80-\u0BFF]/.test(l))
      if (enLines.length > 0) en = enLines.join(' ')
      if (!ta && taLines.length > 0) ta = taLines.join(' ')
    } else if (/[\u0B80-\u0BFF]/.test(en) && !/[a-zA-Z]/.test(en)) {
      // Input en was pure Tamil
      if (!ta) ta = en
    }

    return { en, ta }
  }

  const splitBilingualOption = (rawEn, rawTa) => {
    let en = String(rawEn || '').replace(/^\(?[A-Da-d]\)?\s*[-.:]?\s*/, '').trim()
    let ta = String(rawTa || '').replace(/^\(?[A-Da-d]\)?\s*[-.:]?\s*/, '').trim()

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

    return { en, ta }
  }

  // Map all extracted questions into the unified application schema
  return rawExtractedQuestions.map((q, idx) => {
    const rawStemEn = q.question_text || q.en_question_text || q.question_text_english || q.english_question || ''
    const rawStemTa = q.question_text_tamil || q.ta_question_text || q.tamil_question || ''
    const { en: stemEn, ta: stemTa } = splitBilingualStem(rawStemEn, rawStemTa)

    const optA = splitBilingualOption(q.option_a || q.options?.A || (Array.isArray(q.options) ? q.options[0] : ''), q.option_a_tamil || q.ta_option_a)
    const optB = splitBilingualOption(q.option_b || q.options?.B || (Array.isArray(q.options) ? q.options[1] : ''), q.option_b_tamil || q.ta_option_b)
    const optC = splitBilingualOption(q.option_c || q.options?.C || (Array.isArray(q.options) ? q.options[2] : ''), q.option_c_tamil || q.ta_option_c)
    const optD = splitBilingualOption(q.option_d || q.options?.D || (Array.isArray(q.options) ? q.options[3] : ''), q.option_d_tamil || q.ta_option_d)

    const cleanCorrect = (key) => {
      if (!key) return null
      const m = String(key).toUpperCase().match(/[A-D]/)
      return m ? m[0] : null
    }

    const approved = matchToApprovedTaxonomy(q, approvedTaxonomy)
    const unitName = approved.unit_name
    const macroName = approved.macro_topic_name
    const microName = approved.micro_topic_name

    let baseExplanation = (q.explanation || q.en_explanation || '').trim()
    if (approved && !baseExplanation.includes('[Taxonomy:')) {
      const taxPrefix = `[Taxonomy: ${unitName} > ${macroName} > ${microName}]`
      baseExplanation = baseExplanation ? `${taxPrefix}\n\n${baseExplanation}` : taxPrefix
    }

    // Check if this question exists in the pre-translated dictionary
    const tr = (stemTa ? questionTranslations[stemTa.trim()] : null) ||
               (stemEn ? questionTranslations[stemEn.trim()] : null) ||
               (q.id ? questionTranslations[q.id] : null)

    const finalEn = tr?.en_question_text || stemEn || (stemTa ? `[Tamil] ${stemTa}` : `Question ${idx + 1}`)
    const finalTa = stemTa || stemEn || ''

    return {
      question_number: Number(q.question_number) || idx + 1,
      question_text: finalEn,
      question_text_english: finalEn,
      en_question_text: finalEn,
      english_question: finalEn,
      question_text_tamil: finalTa,
      ta_question_text: finalTa,
      tamil_question: finalTa,
      option_a: tr?.en_option_a || optA.en || optA.ta,
      option_b: tr?.en_option_b || optB.en || optB.ta,
      option_c: tr?.en_option_c || optC.en || optC.ta,
      option_d: tr?.en_option_d || optD.en || optD.ta,
      en_option_a: tr?.en_option_a || optA.en || optA.ta,
      en_option_b: tr?.en_option_b || optB.en || optB.ta,
      en_option_c: tr?.en_option_c || optC.en || optC.ta,
      en_option_d: tr?.en_option_d || optD.en || optD.ta,
      option_a_tamil: optA.ta || optA.en,
      option_b_tamil: optB.ta || optB.en,
      option_c_tamil: optC.ta || optC.en,
      option_d_tamil: optD.ta || optD.en,
      ta_option_a: optA.ta || optA.en,
      ta_option_b: optB.ta || optB.en,
      ta_option_c: optC.ta || optC.en,
      ta_option_d: optD.ta || optD.en,
      correct_option: cleanCorrect(q.correct_option),
      explanation: baseExplanation,
      en_explanation: baseExplanation,
      explanation_tamil: q.explanation_tamil || q.ta_explanation || '',
      ta_explanation: q.explanation_tamil || q.ta_explanation || '',
      unit_name: unitName,
      macro_topic_name: macroName,
      micro_topic_name: microName,
      tags: Array.from(new Set([...(q.tags || []), microName, macroName, unitName])),
      macro_topic: macroName,
      micro_topic: microName,
      parser_status: 'ready',
      status: 'ready',
      taxonomy_confidence: 1,
      taxonomy_warning: null,
      isValid: true,
      extraction_status: 'complete',
      source_page: q.source_page || options.pageStart || 1,
    }
  })
}
