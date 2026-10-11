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
  return []
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
 * Extracts structured questions from PDF using Gemini Vision with retry and model fallback.
 */
export async function extractQuestionsWithAi(base64Data, preferredModel = 'gemini-3.8-flash', onStatusUpdate) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey || apiKey.includes('your_gemini')) {
    throw new Error('VITE_GEMINI_API_KEY is not configured in .env')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const availableModels = await fetchAvailableGeminiModels(apiKey)

  const modelsToTry = []
  if (preferredModel) modelsToTry.push(preferredModel)
  availableModels.forEach((m) => {
    if (!modelsToTry.includes(m.id)) modelsToTry.push(m.id)
  })
  if (modelsToTry.length === 0) {
    modelsToTry.push('gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-pro-preview', 'gemini-flash-latest')
  }

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

  const MAX_MODELS = Math.min(3, modelsToTry.length)
  let lastError = null

  for (let mIdx = 0; mIdx < MAX_MODELS; mIdx++) {
    const currentModelId = modelsToTry[mIdx]
    const model = genAI.getGenerativeModel({ model: currentModelId })
    const MAX_RETRIES = 3

    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        onStatusUpdate?.(`Analyzing PDF with AI (${currentModelId})...`)
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
        if ((is503 || is429) && retry < MAX_RETRIES) {
          const waitMs = Math.pow(2, retry + 1) * 1000
          onStatusUpdate?.(`Model busy (${currentModelId}). Retrying in ${waitMs / 1000}s...`)
          await delay(waitMs)
        } else {
          break
        }
      }
    }
    onStatusUpdate?.(`Model ${currentModelId} unavailable. Switching to fallback...`)
  }

  throw new Error(lastError?.message || 'Failed to extract questions with AI.')
}
