import React, { useState, useEffect } from 'react'
import {
  Settings, Key, Sparkles, ShieldCheck, AlertTriangle,
  Eye, EyeOff, Save, Trash2, CheckCircle2, ExternalLink,
  Cpu, Activity, RefreshCw, Loader2, Info, Check, Copy
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useApp } from '../../contexts/AppContext'
import { apiKeyService } from '../../services/apiKeyService'
import { fetchAvailableGeminiModels } from '../../services/aiPdfService'

const DEFAULT_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Recommended: Best balance of speed, multimodal OCR, and syllabus accuracy.', tag: 'Recommended' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', desc: 'Optimized for high-volume text and question extraction.', tag: 'Fast' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', desc: 'Ultra low-latency candidate model for quick responses.', tag: 'Lightweight' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', desc: 'Next-gen reasoning for complex conceptual questions.', tag: 'Advanced' },
]

export function AdminSettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { geminiApiKey, saveGeminiApiKey, removeGeminiApiKey, hasGeminiApiKey, toast } = useApp()

  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [validating, setValidating] = useState(false)
  const [testingPing, setTestingPing] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [validationStatus, setValidationStatus] = useState(null)
  const [copied, setCopied] = useState(false)
  
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash')
  const [detectedModels, setDetectedModels] = useState(DEFAULT_MODELS)
  const [loadingModels, setLoadingModels] = useState(false)

  // Load available models whenever active key is present
  useEffect(() => {
    async function loadModels() {
      const activeKey = geminiApiKey || apiKeyService.getUserApiKey()
      if (!activeKey) return
      setLoadingModels(true)
      try {
        const liveList = await fetchAvailableGeminiModels(activeKey)
        if (liveList && liveList.length > 0) {
          const mapped = liveList.map(m => ({
            id: m.id,
            name: m.name,
            desc: m.id.includes('2.5') ? 'Latest Google Gemini 2.5 generation' : 'Google Gemini Flash model',
            tag: m.id === 'gemini-2.5-flash' ? 'Recommended' : 'Active'
          }))
          setDetectedModels(mapped)
        }
      } catch (err) {
        console.warn('[AdminSettings] Could not query live models:', err)
      } finally {
        setLoadingModels(false)
      }
    }
    loadModels()
  }, [geminiApiKey])

  // Validate and save API key
  async function handleValidateAndSave() {
    const raw = keyInput.trim()
    if (!raw) {
      toast.error('Please enter a Google Gemini API key.')
      return
    }

    setValidating(true)
    setValidationStatus(null)
    setTestResult(null)

    try {
      const res = await apiKeyService.validateApiKey(raw)
      if (res.valid) {
        setValidationStatus({ valid: true })
        // Save as admin platform key
        await saveGeminiApiKey(raw, true)
        setKeyInput('')
        toast.success('Google Gemini API Key verified and saved successfully! The entire project will now use this key.')
        await refreshProfile()
      } else {
        setValidationStatus({ valid: false, error: res.error })
        toast.error(`Key validation: ${res.error}`)
      }
    } catch (err) {
      setValidationStatus({ valid: false, error: err.message })
      toast.error(`Validation error: ${err.message}`)
    } finally {
      setValidating(false)
    }
  }

  // Fallback direct save if user insists
  async function handleDirectSave() {
    const raw = keyInput.trim()
    if (!raw) return
    try {
      await saveGeminiApiKey(raw, true)
      setKeyInput('')
      setValidationStatus({ valid: true })
      toast.success('Gemini API key saved directly.')
      await refreshProfile()
    } catch (err) {
      toast.error('Failed to save key: ' + err.message)
    }
  }

  // Remove key with confirmation
  async function handleRemoveKey() {
    if (!window.confirm('Are you sure you want to remove the platform Gemini API key? AI Question extraction and AI Mentor will be disabled until a key is provided.')) {
      return
    }
    try {
      await removeGeminiApiKey(true)
      setValidationStatus(null)
      setTestResult(null)
      toast.info('Google Gemini API key removed.')
      await refreshProfile()
    } catch (err) {
      toast.error('Failed to remove key: ' + err.message)
    }
  }

  // Run live diagnostic ping
  async function handleTestPing() {
    const activeKey = geminiApiKey || apiKeyService.getUserApiKey()
    if (!activeKey) {
      toast.error('No API key configured to test.')
      return
    }
    setTestingPing(true)
    setTestResult(null)
    try {
      const res = await apiKeyService.testConnection(activeKey)
      setTestResult(res)
      if (res.success) {
        toast.success(`Gemini API connection healthy! Latency: ${res.latencyMs}ms`)
      } else {
        toast.error(`Connection test failed: ${res.error}`)
      }
    } catch (err) {
      setTestResult({ success: false, error: err.message })
      toast.error('Test ping failed: ' + err.message)
    } finally {
      setTestingPing(false)
    }
  }

  const copyMaskedKey = () => {
    const activeKey = geminiApiKey || apiKeyService.getUserApiKey()
    if (!activeKey) return
    navigator.clipboard.writeText(activeKey)
    setCopied(true)
    toast.success('API key copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const isConfigured = Boolean(hasGeminiApiKey || apiKeyService.hasUserApiKey())

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-tnpsc-brand text-white flex items-center justify-center shadow-brand">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-body-text tracking-tight">Admin &amp; Platform Settings</h1>
              <p className="text-xs text-body-secondary mt-0.5">
                Manage your Google Gemini AI API key, model selection, and platform-wide configurations.
              </p>
            </div>
          </div>
        </div>

        {/* Global Key Status Pill */}
        <div>
          {isConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              API Key Active &amp; Ready
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 shadow-2xs animate-pulse">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Action Required: Key Missing
            </span>
          )}
        </div>
      </div>

      {/* ── Prominent Warning Message if Key is Missing ──────────────────────── */}
      {!isConfigured && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-subtle mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                Warning: Google Gemini API Key Not Configured Yet
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed mt-1">
                The entire project relies on your personal Google Gemini API key to operate AI features without hitting shared quota limits. 
                Currently, <strong>Admin AI Question Extraction</strong>, <strong>Automatic Syllabus Unit Categorization</strong>, 
                <strong>User BYOP Question Parsing</strong>, and <strong>Vina AI Mentor</strong> are paused until an API key is provided below.
              </p>
              <div className="flex items-center gap-3 mt-3 pt-2 border-t border-amber-200/80">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-200/70 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Get Free API Key from Google AI Studio <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <span className="text-[11px] text-amber-700">100% Free · No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Active API Key Overview & Diagnostic Card ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-subtle p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-tnpsc-brand" />
            <h2 className="text-sm font-bold text-body-text">Google Gemini API Key (Bring Your Own Key)</h2>
          </div>
          <span className="text-[11px] text-body-secondary font-medium">
            Powers entire platform AI
          </span>
        </div>

        {/* Status preview */}
        {isConfigured ? (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800">Active API Key Configured</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 font-mono text-xs text-slate-600">
                <span className="bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs font-semibold">
                  {apiKeyService.maskKey(geminiApiKey || apiKeyService.getUserApiKey())}
                </span>
                <button
                  onClick={copyMaskedKey}
                  title="Copy Key"
                  className="p-1 hover:text-slate-900 text-slate-400 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleTestPing}
                disabled={testingPing}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all shadow-2xs disabled:opacity-50"
              >
                {testingPing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-tnpsc-brand" /> : <Activity className="w-3.5 h-3.5 text-indigo-600" />}
                {testingPing ? 'Testing Ping…' : 'Test API Connection'}
              </button>

              <button
                type="button"
                onClick={handleRemoveKey}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-center">
            <Key className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-700">No API Key currently registered</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enter your Google Gemini key below to enable AI question extraction, syllabus unit tagging, and AI tutoring.
            </p>
          </div>
        )}

        {/* Live Test Diagnostic Result */}
        {testResult && (
          <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 transition-all ${
            testResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-bold">
                {testResult.success ? 'Google Gemini API Connection Healthy!' : 'Connection Probe Failed'}
              </p>
              {testResult.success ? (
                <p className="text-[11px] text-emerald-800">
                  Successfully reached model <strong>{testResult.modelName}</strong>. Round-trip latency: <strong>{testResult.latencyMs}ms</strong>. Server reply: &ldquo;{testResult.response}&rdquo;.
                </p>
              ) : (
                <p className="text-[11px] text-red-800">
                  {testResult.error || 'Unable to connect to Google Gemini. Please check your API key and network connection.'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Input form */}
        <div className="space-y-3 pt-1">
          <label className="block text-xs font-bold text-body-secondary uppercase tracking-wider">
            {isConfigured ? 'Update or Replace Google Gemini API Key' : 'Enter Google Gemini API Key'}
          </label>
          <div className="relative flex items-center">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyInput}
              onChange={e => {
                setKeyInput(e.target.value)
                setValidationStatus(null)
              }}
              placeholder={isConfigured ? 'Paste new key to update… (e.g. AIzaSy... or AQ.Ab...)' : 'Paste your Google Gemini API key here…'}
              className="w-full border border-surface-border rounded-xl pl-3 pr-10 py-3 text-xs font-mono outline-none focus:ring-2 focus:ring-tnpsc-brand bg-slate-50/60"
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

          {/* Validation Error Feedback */}
          {validationStatus && !validationStatus.valid && (
            <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Validation Issue</p>
                <p className="text-[11px] mt-0.5">{validationStatus.error}</p>
                {keyInput.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={handleDirectSave}
                    className="mt-2.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-colors shadow-2xs"
                  >
                    Save Key Anyway
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleValidateAndSave}
              disabled={validating || !keyInput.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-tnpsc-brand hover:bg-tnpsc-brand-hover text-white text-xs font-bold rounded-xl transition-all shadow-brand disabled:opacity-50"
            >
              {validating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Verifying with Gemini API…
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Verify &amp; Save API Key
                </>
              )}
            </button>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-body-text text-xs font-semibold rounded-xl transition-colors"
            >
              Get Free Key from Google AI Studio <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>
        </div>
      </div>

      {/* ── AI Model Configuration & Availability ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-subtle p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-body-text">Gemini AI Model Engine Selection</h2>
          </div>
          <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            Multimodal OCR &amp; Reasoning
          </span>
        </div>

        <p className="text-xs text-body-secondary">
          Choose the default model family used for PDF question extraction, OCR parsing of scanned exam papers, and syllabus categorization.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {detectedModels.map(model => {
            const isSelected = selectedModel === model.id
            return (
              <div
                key={model.id}
                onClick={() => {
                  setSelectedModel(model.id)
                  toast.success(`Preferred model set to ${model.name}`)
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-tnpsc-brand bg-tnpsc-brand/5 ring-1 ring-tnpsc-brand shadow-2xs'
                    : 'border-surface-border bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-body-text">{model.name}</span>
                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    model.tag === 'Recommended'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {model.tag}
                  </span>
                </div>
                <p className="text-[11px] text-body-secondary mt-1 leading-snug">
                  {model.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Google AI Studio Free Tier Quick Guide ────────────────────────────── */}
      <div className="bg-indigo-50/50 border border-indigo-100/80 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-black uppercase text-indigo-950 tracking-wider">
            How to get your free Gemini API Key in 30 seconds
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { step: '1', title: 'Open Google AI Studio', desc: 'Visit aistudio.google.com and sign in with any Google account.' },
            { step: '2', title: 'Create API Key', desc: 'Click "Create API Key" and choose "Create in new project".' },
            { step: '3', title: 'Copy Your Key', desc: 'Copy the generated key string (starts with AIzaSy... or AQ...).' },
            { step: '4', title: 'Save & Verify', desc: 'Paste the key above and click "Verify & Save API Key".' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-3.5 rounded-xl border border-indigo-100/70 shadow-2xs">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center mb-2">
                {item.step}
              </span>
              <p className="text-xs font-bold text-body-text">{item.title}</p>
              <p className="text-[11px] text-body-secondary mt-0.5 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-indigo-800 bg-white/80 p-3 rounded-xl border border-indigo-100">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Free Tier Benefits:</strong> Google provides 15 requests per minute and 1 million tokens/minute for free on Gemini 2.5 Flash, completely preventing server rate exhaustion.
          </span>
        </div>
      </div>

      {/* ── Platform-Wide Scope Banner ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-subtle flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-tnpsc-brand shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-body-text">Platform Scope &amp; Security</p>
          <p className="text-[11px] text-body-secondary leading-relaxed">
            Keys are validated directly against Google servers and stored securely in local browser storage and your authenticated Supabase profile.
            Once configured, this key automatically powers Admin AI PDF Question Extraction, Syllabus Classification, user BYOP question parsing, and the interactive Vina AI Mentor for all tests.
          </p>
        </div>
      </div>
    </div>
  )
}
