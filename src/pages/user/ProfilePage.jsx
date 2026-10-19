import React, { useState, useEffect } from 'react'
import {
  User, Save, Loader2, CheckCircle2, Sparkles, Key,
  Eye, EyeOff, ShieldCheck, AlertTriangle, Trash2, ExternalLink, Activity
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useApp, EXAM_OPTIONS } from '../../contexts/AppContext'
import { profileService } from '../../services/tnpscService'
import { apiKeyService } from '../../services/apiKeyService'

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const {
    selectedExam, setSelectedExam,
    language, setLanguage,
    group2LanguagePref, setGroup2LanguagePref,
    geminiApiKey, saveGeminiApiKey, removeGeminiApiKey, hasGeminiApiKey,
    toast,
  } = useApp()

  const [form, setForm] = useState({
    full_name:   '',
    bio:         '',
    target_year: new Date().getFullYear() + 1,
  })
  const [saving, setSaving] = useState(false)

  // API Key BYOK state
  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey]   = useState(false)
  const [validatingKey, setValidatingKey] = useState(false)
  const [validationStatus, setValidationStatus] = useState(null)
  const [testingPing, setTestingPing] = useState(false)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    if (profile) {
      setForm({
        full_name:   profile.full_name   ?? '',
        bio:         profile.bio         ?? '',
        target_year: profile.target_year ?? new Date().getFullYear() + 1,
      })
    }
  }, [profile])

  useEffect(() => {
    if (window.location.hash === '#api-key') {
      setTimeout(() => {
        const el = document.getElementById('api-key')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      // Also ensure localStorage is synced directly
      if (group2LanguagePref) {
        localStorage.setItem('tnpsc_group2_language_pref', group2LanguagePref)
        if (user?.id) localStorage.setItem(`tnpsc_group2_language_pref_${user.id}`, group2LanguagePref)
      }
      await profileService.update(user.id, {
        ...form,
        selected_exam:        selectedExam,
        preferred_language:   language,
        group2_language_pref: group2LanguagePref,
      })
      await refreshProfile()
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error('Failed to update profile: ' + err.message)
    } finally { setSaving(false) }
  }

  async function handleValidateAndSaveKey() {
    const raw = keyInput.trim() || geminiApiKey
    if (!raw) {
      toast.error('Please enter an API key to validate.')
      return
    }

    setValidatingKey(true)
    setValidationStatus(null)
    setTestResult(null)

    try {
      const res = await apiKeyService.validateApiKey(raw)
      if (res.valid) {
        setValidationStatus({ valid: true })
        if (keyInput.trim()) {
          await saveGeminiApiKey(keyInput.trim())
          setKeyInput('')
          toast.success('Gemini API Key verified and saved successfully!')
        } else {
          toast.success('Saved Gemini API key is valid and active!')
        }
        await refreshProfile()
      } else {
        setValidationStatus({ valid: false, error: res.error })
        toast.error(`Key validation: ${res.error}`)
      }
    } catch (err) {
      setValidationStatus({ valid: false, error: err.message })
      toast.error(`Validation error: ${err.message}`)
    } finally {
      setValidatingKey(false)
    }
  }

  async function handleTestConnection() {
    const keyToTest = keyInput.trim() || geminiApiKey
    if (!keyToTest) {
      toast.error('No API key available to test. Please enter or save a Gemini key first.')
      return
    }
    setTestingPing(true)
    setTestResult(null)
    try {
      const start = Date.now()
      const res = await apiKeyService.validateApiKey(keyToTest)
      const latency = Date.now() - start
      if (res.valid) {
        setTestResult({ success: true, latency, message: `Connected to Google Gemini successfully in ${latency}ms!` })
        toast.success(`Google Gemini Connected (${latency}ms)`)
      } else {
        setTestResult({ success: false, latency, message: res.error || 'Connection failed' })
        toast.error(`Connection failed: ${res.error}`)
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message })
      toast.error(`Connection test error: ${err.message}`)
    } finally {
      setTestingPing(false)
    }
  }

  async function handleDirectSaveKey() {
    const raw = keyInput.trim()
    if (!raw) {
      toast.error('Please enter an API key to save.')
      return
    }
    await saveGeminiApiKey(raw)
    setKeyInput('')
    setValidationStatus({ valid: true, note: 'Saved directly.' })
    toast.success('Gemini API Key saved successfully!')
    await refreshProfile()
  }

  async function handleRemoveKey() {
    await removeGeminiApiKey()
    setKeyInput('')
    setValidationStatus(null)
    setTestResult(null)
    toast.info('Personal Gemini API Key removed.')
    await refreshProfile()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center gap-3">
        <User className="w-6 h-6 text-tnpsc-brand" />
        <div>
          <h1 className="text-xl font-bold text-body-text">Profile & Settings</h1>
          <p className="text-xs text-body-secondary">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* ── Personal Info ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-surface-border shadow-subtle p-6 space-y-4">
          <h2 className="text-sm font-bold text-body-text border-b border-surface-border pb-3">Personal Information</h2>

          <div>
            <label className="block text-xs font-bold text-body-secondary mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full border border-surface-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-tnpsc-brand"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-body-secondary mb-1.5">Email</label>
            <input
              type="email" value={user?.email ?? ''} disabled
              className="w-full border border-surface-border rounded-xl px-3 py-2.5 text-sm bg-slate-50 text-body-secondary cursor-not-allowed"
            />
            <p className="text-[10px] text-body-secondary mt-1">Email cannot be changed here.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-body-secondary mb-1.5">Bio / Notes</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              className="w-full border border-surface-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-tnpsc-brand resize-none"
              placeholder="Tell us about your preparation…"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-body-secondary mb-1.5">Target Exam Year</label>
            <input
              type="number"
              value={form.target_year}
              min={new Date().getFullYear()}
              max={new Date().getFullYear() + 5}
              onChange={e => setForm(f => ({ ...f, target_year: parseInt(e.target.value) }))}
              className="w-full border border-surface-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-tnpsc-brand"
            />
          </div>
        </div>

        {/* ── Examination Preferences ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-surface-border shadow-subtle p-6 space-y-4">
          <h2 className="text-sm font-bold text-body-text border-b border-surface-border pb-3">Preferences</h2>

          <div>
            <label className="block text-xs font-bold text-body-secondary mb-1.5">Target Exam</label>
            <select
              value={selectedExam}
              onChange={e => setSelectedExam(e.target.value)}
              className="w-full border border-surface-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-tnpsc-brand bg-white"
            >
              {EXAM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-body-secondary mb-2">Preferred UI Language</label>
            <div className="flex gap-3">
              {[
                { value: 'en', label: 'English' },
                { value: 'ta', label: 'தமிழ் (Tamil)' },
              ].map(l => (
                <button
                  type="button"
                  key={l.value}
                  onClick={() => setLanguage(l.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    language === l.value
                      ? 'bg-tnpsc-brand text-white border-tnpsc-brand'
                      : 'bg-white border-surface-border text-body-secondary hover:border-tnpsc-brand/40'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-body-secondary mb-1">TNPSC Group 2 Language Specialization</label>
            <p className="text-[11px] text-body-secondary mb-2">Controls Part 1 subject (100 questions) in Group 2 full mock tests.</p>
            <div className="flex gap-3">
              {[
                { value: 'General Tamil', label: 'General Tamil (பொதுத் தமிழ்)' },
                { value: 'General English', label: 'General English' },
              ].map(opt => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setGroup2LanguagePref(opt.value)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                    group2LanguagePref === opt.value
                      ? 'bg-tnpsc-brand text-white border-tnpsc-brand shadow-sm'
                      : 'bg-white border-surface-border text-body-secondary hover:border-tnpsc-brand/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Save Profile Button ──────────────────────────────────────── */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-tnpsc-brand hover:bg-tnpsc-brand-hover text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-brand disabled:opacity-60"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            : <><Save className="w-4 h-4" /> Save Profile Preferences</>
          }
        </button>
      </form>

      {/* ─── Gemini AI API Key (BYOK) Dedicated Settings Card ─────────── */}
      <div id="api-key" className="bg-white rounded-2xl border border-surface-border shadow-subtle p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-tnpsc-brand" />
              <h2 className="text-sm font-bold text-body-text">Google Gemini API Key (Bring Your Own Key)</h2>
            </div>
            <p className="text-xs text-body-secondary mt-1">
              Provide your personal free Gemini API key to power Vina AI Mentor and Vision PDF question extraction without rate limits.
            </p>
          </div>
          {hasGeminiApiKey ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 self-start sm:self-auto">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Active &amp; Ready
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0 self-start sm:self-auto">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              Required for AI Features
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-body-secondary mb-1.5">
            Your Google Gemini API Key{' '}
            {hasGeminiApiKey && (
              <span className="text-[11px] font-normal text-slate-500">
                (Saved: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">{apiKeyService.maskKey(geminiApiKey)}</code>)
              </span>
            )}
          </label>
          <div className="relative flex items-center">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyInput}
              onChange={e => {
                setKeyInput(e.target.value)
                setValidationStatus(null)
              }}
              placeholder={hasGeminiApiKey ? 'Paste a new key to replace existing…' : 'Paste your Google Gemini API key here…'}
              className="w-full border border-surface-border rounded-xl pl-3 pr-10 py-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-tnpsc-brand bg-slate-50/50"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Validation Feedback Banner */}
        {validationStatus && (
          <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
            validationStatus.valid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {validationStatus.valid ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">API Key Saved!</p>
                  <p className="text-[11px] mt-0.5">Connected to Google Gemini. You are ready to chat with Vina AI Mentor and extract PDF questions.</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Validation Notice</p>
                  <p className="text-[11px] mt-0.5">{validationStatus.error}</p>
                  {keyInput.trim().length > 0 && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={handleDirectSaveKey}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-colors"
                      >
                        Save Key Anyway
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Key Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleValidateAndSaveKey}
            disabled={validatingKey || (!keyInput.trim() && !hasGeminiApiKey)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-tnpsc-brand hover:bg-tnpsc-brand-hover text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {validatingKey ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Validating with Google…
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                {keyInput.trim() ? 'Verify & Save Key' : 'Test Saved Key'}
              </>
            )}
          </button>

          {hasGeminiApiKey && (
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingPing}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-all border border-emerald-200"
            >
              {testingPing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Testing Ping…
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  Test Connection
                </>
              )}
            </button>
          )}

          {keyInput.trim().length > 0 && (
            <button
              type="button"
              onClick={handleDirectSaveKey}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-body-text text-xs font-bold rounded-xl transition-all border border-slate-200"
            >
              <Save className="w-3.5 h-3.5" />
              Save Directly
            </button>
          )}

          {hasGeminiApiKey && (
            <button
              type="button"
              onClick={handleRemoveKey}
              className="flex items-center gap-1.5 px-3.5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Key
            </button>
          )}

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="sm:ml-auto inline-flex items-center gap-1 text-xs font-bold text-tnpsc-brand hover:underline pt-1 sm:pt-0"
          >
            Get Free Key from Google AI Studio
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Connection Test Result Banner */}
        {testResult && (
          <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
            testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <div className="flex-1">
              <span className="font-bold">{testResult.success ? 'Connection Healthy: ' : 'Connection Issue: '}</span>
              <span>{testResult.message}</span>
            </div>
          </div>
        )}

        {/* Help Guide Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-tnpsc-brand" />
            How to get your free Google Gemini API key:
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-600">
            <li>Open <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-tnpsc-brand underline font-semibold">Google AI Studio</a> and sign in with your Google Account.</li>
            <li>Click <strong>"Create API key"</strong>.</li>
            <li>Copy your API key and paste it into the box above.</li>
            <li>Click <strong>"Verify &amp; Save Key"</strong> or <strong>"Save Directly"</strong>.</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
