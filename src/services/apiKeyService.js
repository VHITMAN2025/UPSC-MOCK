import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '../lib/supabase.js'

const LOCAL_STORAGE_KEY = 'vina_gemini_api_key'
const ADMIN_STORAGE_KEY = 'vina_admin_gemini_api_key'
let _cachedProfileKey = null
let _cachedAdminKey = null

export const apiKeyService = {
  /**
   * Updates in-memory profile key cache (called by AppContext / AuthContext)
   */
  setCachedProfileKey(key) {
    _cachedProfileKey = key ? key.trim() : null
  },

  /**
   * Updates in-memory admin/platform key cache
   */
  setCachedAdminKey(key) {
    _cachedAdminKey = key ? key.trim() : null
    if (key && key.trim()) {
      try {
        localStorage.setItem(ADMIN_STORAGE_KEY, key.trim())
      } catch {}
    }
  },

  /**
   * Retrieves active Gemini API key:
   * 1. User's local storage key
   * 2. User's cached profile key
   * 3. Admin / platform local storage key
   * 4. Admin / platform cached profile key
   *
   * This ensures that when an admin configures an API key in Admin Settings,
   * the entire project works on that key while still allowing individual users
   * to override with their own personal key if provided.
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

    try {
      const adminLocal = localStorage.getItem(ADMIN_STORAGE_KEY)
      if (adminLocal && adminLocal.trim().length > 0) {
        return adminLocal.trim()
      }
    } catch {}

    if (_cachedAdminKey && _cachedAdminKey.trim().length > 0) {
      return _cachedAdminKey.trim()
    }

    return null
  },

  /**
   * Checks whether an API key is configured.
   */
  hasUserApiKey() {
    const key = this.getUserApiKey()
    return Boolean(key && key.trim().length > 0)
  },

  /**
   * Saves API key to local storage and optionally to Supabase profile.
   * If isAdmin is true or userId belongs to an admin, also persists as platform admin key.
   */
  async saveUserApiKey(key, userId = null, isAdmin = false) {
    const trimmed = (key || '').trim()
    if (!trimmed) {
      return this.removeUserApiKey(userId, isAdmin)
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, trimmed)
      if (isAdmin) {
        localStorage.setItem(ADMIN_STORAGE_KEY, trimmed)
      }
    } catch {}

    _cachedProfileKey = trimmed
    if (isAdmin) {
      _cachedAdminKey = trimmed
    }

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
  async removeUserApiKey(userId = null, isAdmin = false) {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
      if (isAdmin) {
        localStorage.removeItem(ADMIN_STORAGE_KEY)
      }
    } catch {}

    _cachedProfileKey = null
    if (isAdmin) {
      _cachedAdminKey = null
    }

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
   * Syncs platform admin key from Supabase if active user does not have a personal key.
   */
  async syncPlatformAdminKey() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('gemini_api_key')
        .eq('role', 'admin')
        .not('gemini_api_key', 'is', null)
        .limit(1)

      if (!error && data && data.length > 0 && data[0].gemini_api_key) {
        const adminKey = data[0].gemini_api_key.trim()
        this.setCachedAdminKey(adminKey)
        return adminKey
      }
    } catch (err) {
      console.warn('[apiKeyService] Could not sync platform admin key:', err?.message)
    }
    return null
  },

  /**
   * Validates an API key against Google Gemini API with a lightweight probe.
   * Accepts all valid Google API key formats without hardcoded prefix checks.
   * Returns { valid: true } or { valid: false, error: string }.
   */
  async validateApiKey(key) {
    const cleanKey = (key || '').trim()
    if (!cleanKey) {
      return { valid: false, error: 'API key cannot be empty.' }
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
      return { valid: true }
    } catch (err) {
      const msg = err.message || ''
      // Fallback model attempt if specific model was not found
      if (msg.includes('404') || msg.includes('not found')) {
        try {
          const genAI = new GoogleGenerativeAI(cleanKey)
          const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
          await fallbackModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
            generationConfig: { maxOutputTokens: 5 },
          })
          return { valid: true }
        } catch {}
      }

      if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
        return { valid: false, error: 'Invalid API key. Please check that you copied it accurately.' }
      }
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
        return { valid: false, error: 'This API key has exceeded its quota or rate limit in Google AI Studio.' }
      }
      return { valid: false, error: `Validation failed: ${msg}` }
    }
  },

  /**
   * Runs an active test ping measuring latency and returning verified model info
   */
  async testConnection(key) {
    const cleanKey = (key || this.getUserApiKey() || '').trim()
    if (!cleanKey) {
      return { success: false, error: 'No API key configured.' }
    }

    const startTime = Date.now()
    try {
      const genAI = new GoogleGenerativeAI(cleanKey)
      const modelName = 'gemini-2.5-flash'
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Ping test. Reply with one word: OK' }] }],
        generationConfig: { maxOutputTokens: 5, temperature: 0.1 },
      })
      const text = result?.response?.text() || 'OK'
      const latencyMs = Date.now() - startTime
      return {
        success: true,
        latencyMs,
        modelName,
        response: text.trim(),
      }
    } catch (err) {
      return {
        success: false,
        error: err.message,
        latencyMs: Date.now() - startTime,
      }
    }
  },

  /**
   * Returns a masked preview of the API key for safe UI rendering.
   */
  maskKey(key) {
    if (!key || key.length < 8) return '••••••••'
    const start = key.slice(0, 4)
    const end = key.slice(-4)
    return `${start}••••••••${end}`
  },
}
