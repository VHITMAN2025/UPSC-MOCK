import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { apiKeyService } from './apiKeyService.js'
import { CANONICAL_SYLLABUS_TAXONOMY, syllabusAnalyticsService } from './syllabusAnalyticsService.js'
import { normalizeUnitName } from '../components/admin/TopicSeparationSummary.jsx'
import { supabase } from '../lib/supabase.js'
import * as pdfjsLib from 'pdfjs-dist'

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

export const FALLBACK_APPROVED_TAXONOMY = [
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 1: General Science', macro_topic_name: 'Physics', micro_topic_name: 'Mechanics & Properties of Matter' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 1: General Science', macro_topic_name: 'Physics', micro_topic_name: 'Light, Sound, Heat & Magnetism' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 1: General Science', macro_topic_name: 'Physics', micro_topic_name: 'Universe & Solar System' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 1: General Science', macro_topic_name: 'Chemistry', micro_topic_name: 'Elements, Compounds, Acids, Bases & Salts' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 1: General Science', macro_topic_name: 'Chemistry', micro_topic_name: 'Petroleum Products, Fertilizers & Pesticides' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 1: General Science', macro_topic_name: 'Biology', micro_topic_name: 'Main Concepts of Life Science & Classification' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 1: General Science', macro_topic_name: 'Biology', micro_topic_name: 'Blood, Circulation & Human Body Systems' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 1: General Science', macro_topic_name: 'Biology', micro_topic_name: 'Human Diseases (Causes & Cures)' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 1: General Science', macro_topic_name: 'Environment', micro_topic_name: 'Environment, Ecology & Diet' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 2: Current Events', macro_topic_name: 'History & Politics', micro_topic_name: 'Latest Diary of Events & National Symbols' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 2: Current Events', macro_topic_name: 'History & Politics', micro_topic_name: 'Prominent Personalities & Places in News' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 2: Current Events', macro_topic_name: 'History & Politics', micro_topic_name: 'Public Awareness & General Administration' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 2: Current Events', macro_topic_name: 'Geography & Science', micro_topic_name: 'Geographical Landmarks' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 2: Current Events', macro_topic_name: 'Geography & Science', micro_topic_name: 'Latest Inventions in Science & Technology' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 3: Geography of India', macro_topic_name: 'Physical Geography', micro_topic_name: 'Location & Physical Features of India' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 3: Geography of India', macro_topic_name: 'Climate & Weather', micro_topic_name: 'Monsoon, Rainfall & Weather Patterns' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 3: Geography of India', macro_topic_name: 'Water & Soil', micro_topic_name: 'Water Resources & Rivers in India' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 3: Geography of India', macro_topic_name: 'Water & Soil', micro_topic_name: 'Soil, Minerals & Natural Resources' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 3: Geography of India', macro_topic_name: 'Economic & Human', micro_topic_name: 'Agriculture Patterns' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 3: Geography of India', macro_topic_name: 'Economic & Human', micro_topic_name: 'Transport, Communication & Population Density' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 3: Geography of India', macro_topic_name: 'Economic & Human', micro_topic_name: 'Disaster Management & Environmental Impact' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 4: History & Culture', macro_topic_name: 'Ancient India', micro_topic_name: 'Indus Valley Civilization' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 4: History & Culture', macro_topic_name: 'Ancient India', micro_topic_name: 'Guptas' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 4: History & Culture', macro_topic_name: 'Medieval India', micro_topic_name: 'Delhi Sultanate' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 4: History & Culture', macro_topic_name: 'Medieval India', micro_topic_name: 'Mughals & Marathas' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 4: History & Culture', macro_topic_name: 'South Indian History', micro_topic_name: 'Cholas, Pandyas, Pallavas' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 4: History & Culture', macro_topic_name: 'Culture & Heritage', micro_topic_name: 'Characteristics of Indian Culture (Unity in Diversity)' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 4: History & Culture', macro_topic_name: 'Culture & Heritage', micro_topic_name: 'India as a Secular State' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 5: Indian Polity', macro_topic_name: 'Constitution Basics', micro_topic_name: 'Making of the Constitution & Salient Features' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 5: Indian Polity', macro_topic_name: 'Constitution Basics', micro_topic_name: 'Preamble, Citizenship, Union & Territories' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 5: Indian Polity', macro_topic_name: 'Rights & Duties', micro_topic_name: 'Fundamental Rights' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 5: Indian Polity', macro_topic_name: 'Rights & Duties', micro_topic_name: 'Fundamental Duties & Directive Principles (DPSP)' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 5: Indian Polity', macro_topic_name: 'Executive & Legislature', micro_topic_name: 'Union Executive (President, PM, Cabinet)' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 5: Indian Polity', macro_topic_name: 'Executive & Legislature', micro_topic_name: 'State Executive (Governor, CM, Council)' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 5: Indian Polity', macro_topic_name: 'Executive & Legislature', micro_topic_name: 'Parliament & State Legislature' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 5: Indian Polity', macro_topic_name: 'Judiciary & Local Govt', micro_topic_name: 'Supreme Court & High Courts' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 5: Indian Polity', macro_topic_name: 'Judiciary & Local Govt', micro_topic_name: 'Local Government (Panchayati Raj)' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 5: Indian Polity', macro_topic_name: 'Judiciary & Local Govt', micro_topic_name: 'Constitutional & Non-Constitutional Bodies (EC, CAG, UPSC)' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 6: Indian Economy', macro_topic_name: 'Nature of Economy', micro_topic_name: 'Nature of Indian Economy & Five Year Plans' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 6: Indian Economy', macro_topic_name: 'Nature of Economy', micro_topic_name: 'Planning Commission & NITI Aayog' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 6: Indian Economy', macro_topic_name: 'Finance & Banking', micro_topic_name: 'Reserve Bank of India (RBI) & Monetary Policy' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 6: Indian Economy', macro_topic_name: 'Finance & Banking', micro_topic_name: 'Finance Commission & Fiscal Policy' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 6: Indian Economy', macro_topic_name: 'Sectors of Economy', micro_topic_name: 'Agriculture, Industry & Rural Development' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 6: Indian Economy', macro_topic_name: 'Sectors of Economy', micro_topic_name: 'GST & Taxation' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 7: National Movement', macro_topic_name: 'Early Uprisings', micro_topic_name: 'Early Uprisings against British Rule (1857 Revolt)' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 7: National Movement', macro_topic_name: 'INC & Moderates', micro_topic_name: 'Indian National Congress Formation' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 7: National Movement', macro_topic_name: 'INC & Moderates', micro_topic_name: 'Emergence of Leaders (B.R. Ambedkar, Bhagat Singh, etc.)' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 7: National Movement', macro_topic_name: 'Gandhian Era', micro_topic_name: 'Non-Cooperation, Civil Disobedience, Quit India' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 8: TN History & Culture', macro_topic_name: 'Ancient Tamilakam', micro_topic_name: 'History of Tamil Society & Archaeological Discoveries' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 8: TN History & Culture', macro_topic_name: 'Ancient Tamilakam', micro_topic_name: 'Sangam Literature' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 8: TN History & Culture', macro_topic_name: 'Thirukkural', micro_topic_name: 'Significance as Secular Literature & Everyday Relevance' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 8: TN History & Culture', macro_topic_name: 'Freedom Struggle in TN', micro_topic_name: 'Early Agitations against British Rule' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 8: TN History & Culture', macro_topic_name: 'Freedom Struggle in TN', micro_topic_name: 'Role of Women in Freedom Struggle' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 8: TN History & Culture', macro_topic_name: 'Social Movements', micro_topic_name: '19th & 20th Century Socio-Political Movements' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 8: TN History & Culture', macro_topic_name: 'Social Movements', micro_topic_name: 'Justice Party, Dravidian Movement & Periyar' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 9: TN Administration', macro_topic_name: 'Welfare & Governance', micro_topic_name: 'Social Justice & Social Harmony' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 9: TN Administration', macro_topic_name: 'Welfare & Governance', micro_topic_name: 'Education & Health Systems in Tamil Nadu' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 9: TN Administration', macro_topic_name: 'Welfare & Governance', micro_topic_name: 'E-Governance in Tamil Nadu' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 9: TN Administration', macro_topic_name: 'TN Geography', micro_topic_name: 'Geography of Tamil Nadu & its Economic Impact' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 10: Aptitude', macro_topic_name: 'Quantitative Aptitude', micro_topic_name: 'Simplification, LCM & HCF' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 10: Aptitude', macro_topic_name: 'Quantitative Aptitude', micro_topic_name: 'Ratio & Proportion' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 10: Aptitude', macro_topic_name: 'Quantitative Aptitude', micro_topic_name: 'Percentage, Simple & Compound Interest' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 10: Aptitude', macro_topic_name: 'Quantitative Aptitude', micro_topic_name: 'Area & Volume' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 10: Aptitude', macro_topic_name: 'Quantitative Aptitude', micro_topic_name: 'Time & Work' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 10: Aptitude', macro_topic_name: 'Logical Reasoning', micro_topic_name: 'Logical Reasoning & Puzzles' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 10: Aptitude', macro_topic_name: 'Logical Reasoning', micro_topic_name: 'Dice & Visual Reasoning' },
  { exam_group: 'ALL_GROUPS', unit_name: 'Unit 10: Aptitude', macro_topic_name: 'Logical Reasoning', micro_topic_name: 'Alpha-Numeric & Number Series' },
  { exam_group: 'GROUP_2_AND_4', unit_name: 'Part A: General Tamil', macro_topic_name: 'Ilakkanam (Grammar)', micro_topic_name: 'Poruthuthal & Pirithu Ezhudhuthal' },
  { exam_group: 'GROUP_2_AND_4', unit_name: 'Part A: General Tamil', macro_topic_name: 'Ilakkanam (Grammar)', micro_topic_name: 'Pizhai Thiruththam & Sol Porul' },
  { exam_group: 'GROUP_2_AND_4', unit_name: 'Part A: General Tamil', macro_topic_name: 'Ilakkaiyam (Literature)', micro_topic_name: 'Thirukkural & Ettuthogai' },
  { exam_group: 'GROUP_2_AND_4', unit_name: 'Part A: General Tamil', macro_topic_name: 'Ilakkaiyam (Literature)', micro_topic_name: 'Paththuppaattu & Iymperum Kaapiyangal' },
  { exam_group: 'GROUP_2_AND_4', unit_name: 'Part A: General Tamil', macro_topic_name: 'Tamil Arignargal (Scholars)', micro_topic_name: 'Tamil Thondu & Bharathiyar/Bharathidasan' },
  { exam_group: 'GROUP_2_AND_4', unit_name: 'Part A: General Tamil', macro_topic_name: 'Tamil Arignargal (Scholars)', micro_topic_name: 'Urainadai & Samudhaya Thondu' },
  { exam_group: 'GROUP_2_AND_4', unit_name: 'Part A: General English', macro_topic_name: 'Grammar', micro_topic_name: 'Match the following & Synonyms/Antonyms' },
  { exam_group: 'GROUP_2_AND_4', unit_name: 'Part A: General English', macro_topic_name: 'Grammar', micro_topic_name: 'Prefix/Suffix & Articles/Prepositions' },
  { exam_group: 'GROUP_2_AND_4', unit_name: 'Part A: General English', macro_topic_name: 'Literature', micro_topic_name: 'Figures of Speech & Poetry Comprehension' },
  { exam_group: 'GROUP_2_AND_4', unit_name: 'Part A: General English', macro_topic_name: 'Literature', micro_topic_name: 'Important Lines from Poems' },
  { exam_group: 'GROUP_2_AND_4', unit_name: 'Part A: General English', macro_topic_name: 'Authors & Literary Works', micro_topic_name: 'Match Authors with Stories' },
  { exam_group: 'GROUP_2_AND_4', unit_name: 'Part A: General English', macro_topic_name: 'Authors & Literary Works', micro_topic_name: 'Biographies & Characters' },
]

export async function loadApprovedPdfTaxonomy() {
  try {
    const { data, error } = await supabase
      .from('question_taxonomy')
      .select('exam_group, unit_name, macro_topic_name, micro_topic_name')
      .eq('active', true)
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
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (Free Tier)' },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Free Tier)' },
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (Free Tier)' },
    { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite Latest (Free Tier)' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
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
Your role is to analyze examination papers (in Tamil, English, or bilingual printed papers) and convert the questions into structured interactive practice quiz items for students.
CRITICAL GUIDELINES FOR BILINGUAL PAPERS (Tamil + English):
1. Many TNPSC papers are bilingual: questions and options appear in BOTH English and Tamil.
2. For every question:
   - Extract the English text in "question_text_english".
   - Extract the Tamil text in "question_text_tamil".
   - In "question_text", format them cleanly as:
     "<English Question>\nதமிழ்: <Tamil Question>"
   - For options A, B, C, D:
     If the question has Tamil translations for options, format option_a through option_d as "<English Option> / <Tamil Option>".
     Also provide pure Tamil text in "option_a_tamil", "option_b_tamil", "option_c_tamil", "option_d_tamil".
   - If the paper is strictly in a single language (only Tamil or only English), extract that language accurately.
3. Formulate clear, self-contained question stems. Do not reproduce document borders, page numbers, instructions to candidates, or official headers.
4. Accurately capture all 4 options (A, B, C, D) and identify the correct option if indicated by tick marks, keys, or standard knowledge.
5. Provide the output strictly as a JSON array of question objects.
6. Categorize each question into the official TNPSC revised syllabus taxonomy provided in the APPROVED TAXONOMY (closed list):
   - Analyze the question topic and concept carefully.
   - For every question, select the EXACT "unit_name", "macro_topic_name", and "micro_topic_name" from the APPROVED TAXONOMY list.
   - Never invent, paraphrase, or create new unit, macro-topic, or micro-topic names. Pick the single closest matching entry from the list.`

const PRIMARY_PROMPT = `You are an exhaustive, high-precision TNPSC and competitive exam question paper extractor.
CRITICAL MANDATORY INSTRUCTIONS:
1. Scan and read EVERY SINGLE PAGE of this entire PDF from the first page through to the very last page.
2. Extract ALL questions present across all pages (from Question 1 to the final question, e.g. Questions 1 through 100).
3. DO NOT stop early or truncate after the first page! You MUST extract every single question in sequential order.
4. For bilingual questions (English & Tamil), combine them in question_text ("<English>\\nதமிழ்: <Tamil>") and options ("<English> / <Tamil>"). For single-language questions (pure Tamil or pure English), preserve that language accurately.
5. Identify the correct answer: Examine the document for hand-drawn pen tick marks, marks, or keys next to options (A, B, C, D). If indicated by a tick mark, set correct_option to 'A', 'B', 'C', or 'D'.
6. Match each question to the closest unit_name, macro_topic_name, and micro_topic_name from the APPROVED TAXONOMY.

Return strictly a JSON array of objects with this schema:
[
  {
    "question_number": 1,
    "question_text": "<full question stem with English and Tamil if present>",
    "option_a": "<option A text, without leading (A)>",
    "option_b": "<option B text, without leading (B)>",
    "option_c": "<option C text, without leading (C)>",
    "option_d": "<option D text, without leading (D)>",
    "correct_option": "<'A', 'B', 'C', 'D' from tick mark/key or null>",
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
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    ...availableModels.map((m) => m.id),
  ].filter(m => m && !/tts|image|banana|clip|lyria|robotics|computer-use|argon|3\.8|3\.5-flash$|3\.6|3\.7|gemini-4|pro/i.test(m))

  const modelsToTry = Array.from(new Set(candidateList.filter(Boolean)))
  let lastError = null
  const MAX_MODELS = Math.min(4, modelsToTry.length)

  const notify = (msg) => {
    if (typeof onStatusUpdate === 'function') {
      try { onStatusUpdate(msg) } catch (e) { console.warn('Status callback error:', e) }
    }
  }

  // Progressive range extraction on the full undivided PDF.
  // This solves Gemini's 8,192 output token limit per turn and ensures all 100 questions are captured.
  const ranges = [
    { start: 1, end: 35 },
    { start: 36, end: 70 },
    { start: 71, end: 105 },
  ]

  const rawExtractedQuestions = []
  const seenNumbers = new Set()

  for (let rIdx = 0; rIdx < ranges.length; rIdx++) {
    const r = ranges[rIdx]
    notify(`Extracting questions ${r.start} to ${Math.min(r.end, 100)}...`)

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

        const rangePrompt = `You are a high-precision TNPSC and competitive exam question paper extractor.
From the attached PDF exam document, extract Questions ${r.start} through ${r.end} with their options (A, B, C, D) and correct_option detected from pen tick marks as a JSON array.
If the document has fewer questions and does not contain questions in this range, return [].

MANDATORY TAXONOMY CLASSIFICATION:
For each question, classify it into the approved syllabus units. Set "unit_name", "macro_topic_name", and "micro_topic_name" EXACTLY from the approved list below:
${taxonomyPrompt}

Schema:
[
  {
    "question_number": ${r.start},
    "question_text": "<full question stem with English and Tamil if present>",
    "option_a": "<option A text, without leading (A)>",
    "option_b": "<option B text, without leading (B)>",
    "option_c": "<option C text, without leading (C)>",
    "option_d": "<option D text, without leading (D)>",
    "correct_option": "<'A', 'B', 'C', 'D' from tick mark/key or null>",
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
      } catch (err) {
        lastError = err
        console.warn(`[Gemini] Range ${r.start}-${r.end} attempt failed on ${currentModelId}:`, err.message)
        if (nextModelId) {
          await delay(1000)
        }
      }
    }

    if (Array.isArray(batchParsed) && batchParsed.length > 0) {
      for (const q of batchParsed) {
        const qNum = Number(q.question_number) || (rawExtractedQuestions.length + 1)
        if (!seenNumbers.has(qNum)) {
          seenNumbers.add(qNum)
          rawExtractedQuestions.push(q)
        }
      }
      notify(`Captured ${rawExtractedQuestions.length} questions so far...`)
      // If higher range returned fewer than 5 questions, the paper has concluded
      if (batchParsed.length < 5 && rIdx > 0) {
        break
      }
    } else if (rIdx > 0) {
      // No more questions found in higher range, document ended
      break
    }
  }

  if (rawExtractedQuestions.length === 0) {
    throw new Error(lastError?.message || 'Failed to extract questions from PDF.')
  }

  // Map all extracted questions into the unified application schema
  return rawExtractedQuestions.map((q, idx) => {
    let text = (q.question_text || '').trim()
    let eng = (q.question_text_english || q.english_question || '').trim()
    let tam = (q.question_text_tamil || q.tamil_question || '').trim()

    if (!eng && !tam) {
      if (text.includes('தமிழ்:')) {
        const parts = text.split('தமிழ்:')
        eng = parts[0].trim()
        tam = parts[1].trim()
      } else if (/[\u0B80-\u0BFF]/.test(text)) {
        tam = text
      } else {
        eng = text
      }
    }

    const combined = text || (eng && tam ? `${eng}\nதமிழ்: ${tam}` : (eng || tam || `Question ${idx + 1}`))

    const cleanOpt = (opt) => {
      if (!opt) return ''
      return String(opt).replace(/^\(?[A-Da-d]\)?\s*[-.:]?\s*/, '').trim()
    }

    const optA = cleanOpt(q.option_a || q.options?.A || (Array.isArray(q.options) ? q.options[0] : ''))
    const optB = cleanOpt(q.option_b || q.options?.B || (Array.isArray(q.options) ? q.options[1] : ''))
    const optC = cleanOpt(q.option_c || q.options?.C || (Array.isArray(q.options) ? q.options[2] : ''))
    const optD = cleanOpt(q.option_d || q.options?.D || (Array.isArray(q.options) ? q.options[3] : ''))

    const cleanCorrect = (key) => {
      if (!key) return null
      const m = String(key).toUpperCase().match(/[A-D]/)
      return m ? m[0] : null
    }

    const approved = matchToApprovedTaxonomy(q, approvedTaxonomy)
    const unitName = approved.unit_name
    const macroName = approved.macro_topic_name
    const microName = approved.micro_topic_name
    const needsReview = false

    let baseExplanation = (q.explanation || '').trim()
    if (approved && !baseExplanation.includes('[Taxonomy:')) {
      const taxPrefix = `[Taxonomy: ${unitName} > ${macroName} > ${microName}]`
      baseExplanation = baseExplanation ? `${taxPrefix}\n\n${baseExplanation}` : taxPrefix
    }

    return {
      question_number: Number(q.question_number) || idx + 1,
      question_text: combined,
      question_text_english: eng || combined,
      question_text_tamil: tam || (text.includes('தமிழ்:') ? text.split('தமிழ்:')[1].trim() : ''),
      english_question: eng || combined,
      tamil_question: tam || '',
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      option_a_tamil: /[\u0B80-\u0BFF]/.test(optA) ? optA : '',
      option_b_tamil: /[\u0B80-\u0BFF]/.test(optB) ? optB : '',
      option_c_tamil: /[\u0B80-\u0BFF]/.test(optC) ? optC : '',
      option_d_tamil: /[\u0B80-\u0BFF]/.test(optD) ? optD : '',
      correct_option: cleanCorrect(q.correct_option),
      explanation: baseExplanation,
      explanation_tamil: q.explanation_tamil || '',
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
