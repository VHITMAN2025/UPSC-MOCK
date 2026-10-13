import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { apiKeyService } from './apiKeyService.js'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchAvailableGeminiModels(apiKey) {
  if (!apiKey || apiKey.includes('your_gemini')) return []
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    const data = await res.json()
    if (data.models) {
      return data.models
        .filter((m) => m.supportedGenerationMethods?.includes('generateContent') && m.name.includes('gemini'))
        .map((m) => ({ id: m.name.split('/')[1], name: m.displayName || m.name.split('/')[1] }))
    }
  } catch (e) {
    console.error('Failed to fetch Gemini models', e)
  }
  return [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-flash-latest', name: 'Gemini Flash Latest' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
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
 * Extracts structured questions from PDF using Gemini Vision with retry and fast model fallback.
 * Configured with anti-recitation prompt, non-zero temperature, and permissive safety settings.
 */
export async function extractQuestionsWithAi(base64Data, preferredModel = 'gemini-2.5-flash', onStatusUpdate, customApiKey = null) {
  const apiKey = (customApiKey && customApiKey.trim().length > 0)
    ? customApiKey.trim()
    : apiKeyService.getUserApiKey()

  if (!apiKey) {
    const err = new Error('NO_API_KEY_CONFIGURED')
    err.code = 'NO_API_KEY_CONFIGURED'
    throw err
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const availableModels = await fetchAvailableGeminiModels(apiKey)

  const candidateList = [
    preferredModel,
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
    'gemini-3.5-flash',
    ...availableModels.map((m) => m.id),
  ]

  // Deduplicate models to try
  const modelsToTry = Array.from(new Set(candidateList.filter(Boolean)))

  // Anti-recitation educational structuring prompt
  const prompt = `You are an educational assessment structuring engine. Read and analyze the questions and choices from the uploaded examination PDF (which may be in English or Tamil, printed or handwritten).
Extract the multiple-choice questions into a clean assessment quiz dataset.
To comply with content filtering and prevent recitation blocks:
- Transcribe and normalize the question stems and options into structured MCQ schema.
- Do not reproduce official gazette margins, watermarks, or government letterheads.
- Extract every question along with all options (A, B, C, D). Do not leave option fields empty.
Output strictly as a valid JSON array of objects. Do not wrap in markdown or include text outside the JSON.
Schema for each question object:
{
  "question_number": <integer>,
  "question_text": "<full question stem in Tamil or English>",
  "option_a": "<text for option A>",
  "option_b": "<text for option B>",
  "option_c": "<text for option C>",
  "option_d": "<text for option D>",
  "correct_option": "<'A', 'B', 'C', 'D' if indicated or known, else null>",
  "explanation": "<brief explanation or empty string>"
}`

  let lastError = null
  const MAX_MODELS = Math.min(4, modelsToTry.length)

  const notify = (msg) => {
    if (typeof onStatusUpdate === 'function') {
      try { onStatusUpdate(msg) } catch (e) { console.warn('Status callback error:', e) }
    }
  }

  for (let mIdx = 0; mIdx < MAX_MODELS; mIdx++) {
    const currentModelId = modelsToTry[mIdx]
    const nextModelId = mIdx + 1 < MAX_MODELS ? modelsToTry[mIdx + 1] : null

    // Configure model with temperature 0.25 (avoids recitation token matching) and permissive safety settings
    const model = genAI.getGenerativeModel({
      model: currentModelId,
      generationConfig: {
        temperature: 0.25,
        topP: 0.95,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    })

    const MAX_RETRIES = 1

    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        notify(`Analyzing PDF with AI (${currentModelId})...`)
        const response = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: 'application/pdf',
            },
          },
        ])

        const text = response.response.text()
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleanedText)

        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((q, idx) => ({
            question_number: q.question_number || idx + 1,
            question_text: q.question_text || '',
            tamil_question: q.question_text || '',
            english_question: '',
            option_a: q.option_a || '',
            option_b: q.option_b || '',
            option_c: q.option_c || '',
            option_d: q.option_d || '',
            correct_option: q.correct_option ? String(q.correct_option).toUpperCase().trim() : null,
            explanation: q.explanation || '',
            parser_status: 'ready',
            isValid: true,
            extraction_status: 'complete',
            source_page: 1,
          }))
        }
        throw new Error('AI returned an empty question list.')
      } catch (err) {
        lastError = err
        const is503 = err.message?.includes('503') || err.status === 503
        const is429 = err.message?.includes('429') || err.status === 429
        const isRecitation = err.message?.includes('RECITATION') || err.message?.includes('recitation') || err.message?.includes('copyrighted')

        // If recitation or 503 and next model available, try next model
        if ((is503 || isRecitation) && nextModelId) {
          console.warn(`[Gemini] ${currentModelId} error (${isRecitation ? 'Recitation' : '503'}). Auto-switching to ${nextModelId}...`)
          notify(`${currentModelId} (${isRecitation ? 'Recitation block' : 'Busy'}). Switching to ${nextModelId}...`)
          await delay(1000)
          break
        }

        if ((is503 || is429) && retry < MAX_RETRIES) {
          notify(`Model ${currentModelId} busy. Retrying in 2s...`)
          await delay(2000)
        } else {
          break
        }
      }
    }
  }

  throw new Error(lastError?.message || 'Failed to extract questions with AI.')
}
