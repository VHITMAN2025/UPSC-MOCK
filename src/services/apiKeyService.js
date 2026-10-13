import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '../lib/supabase.js'

const LOCAL_STORAGE_KEY = 'vina_gemini_api_key'
let _cachedProfileKey = null

export const apiKeyService = {
  /**
   * Updates in-memory profile key cache (called by AppContext / AuthContext)
   */
  setCachedProfileKey(key) {
    _cachedProfileKey = key ? key.trim() : null
  },

  /**
   * Retrieves user's Gemini API key from local storage or cached profile.
   * Does NOT fall back to shared server key if user has not configured their own,
   * enforcing the requirement: "if user is not provided API key, tell him to provide it first".
   */
  getUserApiKey() {
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (local && local.trim().length > 0) {
        return local.trim()
      }
    } catch {}

    if (_cachedProfileKey && _cachedProfileKey.trim().length > 0) {
      return _cachedProfileKey.trim()
    }

    return null
  },

  /**
   * Checks whether the user has configured their Gemini API key.
   */
  hasUserApiKey() {
    const key = this.getUserApiKey()
    return Boolean(key && key.length > 5)
  },

  /**
   * Saves user's API key to local storage and optionally to Supabase profile.
   */
  async saveUserApiKey(key, userId = null) {
    const trimmed = (key || '').trim()
    if (!trimmed) {
      return this.removeUserApiKey(userId)
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, trimmed)
    } catch {}
    _cachedProfileKey = trimmed

    if (userId) {
      try {
        await supabase
          .from('profiles')
          .update({
            gemini_api_key: trimmed,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
      } catch (err) {
        console.warn('[apiKeyService] Could not persist API key to Supabase profile:', err.message)
      }
    }
  },

  /**
   * Removes user's API key.
   */
  async removeUserApiKey(userId = null) {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    } catch {}
    _cachedProfileKey = null

    if (userId) {
      try {
        await supabase
          .from('profiles')
          .update({
            gemini_api_key: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
      } catch (err) {
        console.warn('[apiKeyService] Could not remove API key from Supabase profile:', err.message)
      }
    }
  },

  /**
   * Validates an API key against Google Gemini API with a lightweight probe.
   * Returns { valid: true } or { valid: false, error: string }.
   */
  async validateApiKey(key) {
    const cleanKey = (key || '').trim()
    if (!cleanKey) {
      return { valid: false, error: 'API key cannot be empty.' }
    }
    if (!cleanKey.startsWith('AIzaSy')) {
      return {
        valid: false,
        error: 'Invalid Google Gemini API key format. Google API keys typically start with "AIzaSy...".',
      }
    }

    try {
      const genAI = new GoogleGenerativeAI(cleanKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        generationConfig: { maxOutputTokens: 5 },
      })
      const text = result?.response?.text()
      if (text !== undefined) {
        return { valid: true }
      }
      return { valid: false, error: 'Unexpected response format from Gemini API.' }
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('API_KEY_INVALID') || msg.includes('400')) {
        return { valid: false, error: 'Invalid API key. Please check that you copied it accurately from Google AI Studio.' }
      }
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
        return { valid: false, error: 'This API key has exceeded its quota or rate limit in Google AI Studio.' }
      }
      return { valid: false, error: `Validation failed: ${msg}` }
    }
  },

  /**
   * Returns a masked preview of the API key for safe UI rendering.
   * E.g. "AIzaSy...7x9Q"
   */
  maskKey(key) {
    if (!key || key.length < 10) return '••••••••'
    return `${key.slice(0, 6)}••••••••${key.slice(-4)}`
  },
}
