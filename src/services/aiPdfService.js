import { GoogleGenerativeAI } from '@google/generative-ai'

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
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' },
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview' },
    { id: 'gemini-flash-latest', name: 'Gemini Flash Latest' },
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
 */
export async function extractQuestionsWithAi(base64Data, preferredModel = 'gemini-3.8-flash', onStatusUpdate) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey || apiKey.includes('your_gemini')) {
    throw new Error('VITE_GEMINI_API_KEY is not configured in .env')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const availableModels = await fetchAvailableGeminiModels(apiKey)

  const candidateList = [
    preferredModel,
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3.1-pro-preview',
    'gemini-flash-latest',
    ...availableModels.map((m) => m.id),
  ]

  // Deduplicate models to try
  const modelsToTry = Array.from(new Set(candidateList.filter(Boolean)))

  const prompt = `You are an expert OCR and exam question parser. Analyze the uploaded PDF document (which may contain Tamil handwritten or scanned text).
Extract ALL multiple-choice questions (MCQs) and their options (A, B, C, D) accurately.
DO NOT leave options empty. Extract each option text carefully.
Format the output ONLY as a JSON array of objects. Do not include markdown code blocks or any explanation outside the JSON.
Each object must have the following keys:
- "question_number": integer
- "question_text": string (the full Tamil / English question body)
- "option_a": string (the text for option A)
- "option_b": string (the text for option B)
- "option_c": string (the text for option C)
- "option_d": string (the text for option D)
- "correct_option": string ("A", "B", "C", or "D" if marked or clearly identified, otherwise null)
- "explanation": string (any notes or empty string)
`

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
    const model = genAI.getGenerativeModel({ model: currentModelId })

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

        // If 503 (high demand) and next model is available, switch immediately!
        if (is503 && nextModelId) {
          console.warn(`[Gemini] ${currentModelId} 503 High Demand. Auto-switching to ${nextModelId}...`)
          notify(`${currentModelId} busy (503 High Demand). Switching to ${nextModelId}...`)
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

  throw new Error(lastError?.message || 'Failed to extract questions with AI. All candidate models busy.')
}
