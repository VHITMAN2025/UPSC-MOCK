import { createClient } from '@supabase/supabase-js'

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env ? process.env : {})
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co'
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder'

if (!env.VITE_SUPABASE_URL || String(env.VITE_SUPABASE_URL).includes('placeholder')) {
  console.warn('[Supabase] Running with default placeholder configuration. Set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY in your .env file to connect to live Supabase.')
}

if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class DummyWebSocket {}
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
