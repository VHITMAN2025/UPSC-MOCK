import { GoogleGenerativeAI } from '@google/generative-ai'
import { apiKeyService } from './apiKeyService.js'

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
]

function getApiKey(overrideKey = null) {
  if (overrideKey && overrideKey.trim().length > 0) return overrideKey.trim()
  const userKey = apiKeyService.getUserApiKey()
  if (userKey && userKey.trim().length > 0) return userKey.trim()
  return ''
}

/**
 * Sanitizes chat history to conform strictly to Gemini requirements:
 * 1. The first entry MUST have role: 'user' (strips leading greeting).
 * 2. Strictly alternates: user -> model -> user -> model.
 * 3. History ends on 'model' (or empty) so chat.sendMessage() supplies the next 'user' message.
 */
function cleanGeminiHistory(rawHistory = []) {
  const result = []
  let expectedRole = 'user'

  const recent = rawHistory.slice(-10)
  for (const msg of recent) {
    if (!msg || !msg.text) continue
    const role = (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user'

    // Skip any leading model greeting before the first user message
    if (result.length === 0 && role !== 'user') {
      continue
    }

    if (role === expectedRole) {
      result.push({
        role,
        parts: [{ text: msg.text }]
      })
      expectedRole = expectedRole === 'user' ? 'model' : 'user'
    }
  }

  // If history ends on a user turn, pop it so startChat history ends on model
  if (result.length > 0 && result[result.length - 1].role === 'user') {
    result.pop()
  }

  return result
}

export const aiMentorService = {
  /**
   * Sends a message to Vina AI Mentor using live Google Gemini API
   * with multi-turn conversation history and exam context.
   */
  async sendMessage({ message, history = [], examContext = 'TNPSC Group 1', userName = 'Candidate', language = 'en', userApiKey = null }) {
    const apiKey = getApiKey(userApiKey)
    if (!apiKey) {
      const err = new Error('NO_API_KEY_CONFIGURED')
      err.code = 'NO_API_KEY_CONFIGURED'
      throw err
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    const systemInstruction = `You are Vina AI Mentor, an expert, empathetic, and precision-driven AI tutor specifically for aspirants preparing for TNPSC (Tamil Nadu Public Service Commission — Groups 1, 2/2A, 4) and UPSC examinations in India.

Candidate Context:
- Target Exam: ${examContext}
- Candidate Name: ${userName}
- Preferred Interface Language: ${language === 'ta' ? 'Tamil' : 'English'}

Your Guidelines:
1. Accuracy & Depth: Deliver factually accurate, curriculum-aligned answers. Reference relevant Articles of the Indian Constitution, Amendments, historical dynasties (Chola, Pandya, Pallava, Nayaks), freedom movements, Tamil literature (Thirukkural, Sangam), and standard NCERT/Samacheer Kalvi syllabus.
2. Aptitude & Math: When asked aptitude questions, explain step-by-step with formula, shortcut, and the final answer.
3. Language Support: If the candidate asks in Tamil, Tanglish, or English, respond in the language that best assists them.
4. Formatting: Use concise bullet points, bold key terms, and numbered steps. Keep responses focused and readable.
5. Motivation: Be encouraging, disciplined, and practical.`

    const formattedHistory = cleanGeminiHistory(history)
    let lastError = null

    // Try candidate models in order
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: {
            role: 'system',
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1024,
            topP: 0.9,
          }
        })

        // Try conversational multi-turn chat first
        try {
          const chat = model.startChat({
            history: formattedHistory,
          })
          const result = await chat.sendMessage(message)
          const responseText = result.response.text()

          if (responseText && responseText.trim().length > 0) {
            return {
              text: responseText.trim(),
              modelUsed: modelName,
            }
          }
        } catch (chatErr) {
          console.warn(`[aiMentorService] startChat failed on '${modelName}', trying generateContent:`, chatErr.message)
          // Failsafe fallback: direct generateContent with context
          const result = await model.generateContent(message)
          const responseText = result.response.text()

          if (responseText && responseText.trim().length > 0) {
            return {
              text: responseText.trim(),
              modelUsed: modelName,
            }
          }
        }
      } catch (err) {
        console.warn(`[aiMentorService] Model '${modelName}' error:`, err.message)
        lastError = err
      }
    }

    // If all models failed, throw descriptive error
    throw new Error(
      lastError?.message || 'Failed to generate response from AI mentor. Please check your network connection and try again.'
    )
  }
}
