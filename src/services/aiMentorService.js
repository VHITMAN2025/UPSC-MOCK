import { GoogleGenerativeAI } from '@google/generative-ai'

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
]

function getApiKey() {
  const env = (typeof import.meta !== 'undefined' && import.meta.env)
    ? import.meta.env
    : (typeof process !== 'undefined' && process.env ? process.env : {})
  return env.VITE_GEMINI_API_KEY || ''
}

export const aiMentorService = {
  /**
   * Sends a message to Vina AI Mentor using live Google Gemini API
   * with multi-turn conversation history and exam context.
   */
  async sendMessage({ message, history = [], examContext = 'TNPSC Group 1', userName = 'Candidate', language = 'en' }) {
    const apiKey = getApiKey()
    if (!apiKey || apiKey.includes('your_gemini')) {
      throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your environment.')
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

    // Format previous turns for Gemini SDK: { role: 'user' | 'model', parts: [{ text: ... }] }
    const formattedHistory = []
    // Take up to the last 10 messages for context
    const recentHistory = history.slice(-10)
    for (const msg of recentHistory) {
      if (!msg.text) continue
      const role = msg.role === 'assistant' ? 'model' : 'user'
      formattedHistory.push({
        role,
        parts: [{ text: msg.text }]
      })
    }

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
      } catch (err) {
        console.warn(`[aiMentorService] Model '${modelName}' failed:`, err.message)
        lastError = err
        // Continue to fallback model
      }
    }

    // If all models failed, throw descriptive error
    throw new Error(
      lastError?.message || 'Failed to generate response from AI mentor. Please check your network connection and try again.'
    )
  }
}
