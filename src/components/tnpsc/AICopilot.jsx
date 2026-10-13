import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageCircle, X, Send, Loader2, Sparkles, ChevronDown,
  RotateCcw, Bot, Key, ExternalLink, ArrowRight, ShieldCheck
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useApp } from '../../contexts/AppContext'
import { aiMentorService } from '../../services/aiMentorService'
import { cn } from '../../lib/utils'

export function AICopilot() {
  const { profile } = useAuth()
  const { selectedExam, language, geminiApiKey, hasGeminiApiKey } = useApp()
  const navigate = useNavigate()

  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hi ${profile?.full_name?.split(' ')[0] ?? 'there'}! 👋 I'm your Vina AI Mentor, powered by Google Gemini. Ask me any conceptual question, math problem, or preparation strategy for **${selectedExam}**!`,
    },
  ])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [lastModel, setLastModel] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, open])

  // Context-aware suggestion pills based on selected exam
  const suggestions = useMemo(() => {
    if (selectedExam === 'TNPSC Group 1') {
      return [
        'Explain Article 32 and Writs with examples',
        'Key features of Chola local self-government',
        'Formula & shortcut for Compound Interest difference',
        'How should I divide my time across 200 questions?',
      ]
    }
    if (selectedExam === 'TNPSC Group 2/2A') {
      return [
        'Important topics in Unit 8 & 9 for Group 2',
        'Explain Swadeshi Steam Navigation Company & V.O.C',
        'Tips for General English vs General Tamil',
        'How to master Aptitude & Mental Ability?',
      ]
    }
    return [
      'Top repeated Indian Polity questions in TNPSC',
      'Important Tamil Nadu welfare schemes to remember',
      'Simplification and BODMAS tricks for Aptitude',
      'Daily 2-hour study routine for working aspirants',
    ]
  }, [selectedExam])

  async function handleSend(textToSend) {
    const query = (textToSend ?? input).trim()
    if (!query || loading) return

    setInput('')
    const updatedMessages = [...messages, { role: 'user', text: query }]
    setMessages(updatedMessages)

    // Check if user has configured their Gemini API key
    if (!hasGeminiApiKey) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `🔑 **Google Gemini API Key Required**\n\nTo ensure dedicated AI access without shared rate limits, please configure your personal Google Gemini API key in **Profile & Settings**.\n\nIt is 100% free from Google AI Studio and takes 30 seconds to set up.`,
          isApiKeyMissing: true,
        },
      ])
      return
    }

    setLoading(true)

    try {
      const response = await aiMentorService.sendMessage({
        message: query,
        history: messages,
        examContext: selectedExam,
        userName: profile?.full_name || 'Aspirant',
        language: language || 'en',
        userApiKey: geminiApiKey,
      })

      setLastModel(response.modelUsed)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: response.text,
          model: response.modelUsed,
        },
      ])
    } catch (err) {
      console.error('[AICopilot] Error communicating with AI mentor:', err)
      const isMissing = err.message?.includes('NO_API_KEY_CONFIGURED')
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: isMissing
            ? `🔑 **Google Gemini API Key Required**\n\nPlease add your personal Google Gemini API key in **Settings** to chat with Vina AI Mentor.`
            : `⚠️ **Vina Mentor Note:** ${err.message || 'I encountered a brief connection issue. Please check your network or try asking again.'}`,
          isError: !isMissing,
          isApiKeyMissing: isMissing,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleResetChat() {
    setMessages([
      {
        role: 'assistant',
        text: `Chat reset! 👋 How can I help you excel in **${selectedExam}** today? Ask me any syllabus topic, doubt, or question.`,
      },
    ])
  }

  // Render markdown formatting (bold, bullet points, headers)
  function renderFormattedMessage(text) {
    if (!text) return null
    const lines = text.split('\n')

    return lines.map((line, lineIdx) => {
      // Check for bullet list
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('- ') || line.trim().startsWith('* ')
      const cleanLine = isBullet ? line.trim().replace(/^([•\-\*]\s*)/, '') : line

      // Parse bold segments
      const parts = cleanLine.split(/\*\*(.*?)\*\*/g)
      const renderedParts = parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900 dark:text-white">{part}</strong> : part
      )

      if (isBullet) {
        return (
          <div key={lineIdx} className="flex items-start gap-1.5 my-0.5 ml-1">
            <span className="text-tnpsc-brand shrink-0 text-[11px] leading-tight">•</span>
            <span className="flex-1 text-[11px] leading-relaxed">{renderedParts}</span>
          </div>
        )
      }

      if (!line.trim()) {
        return <div key={lineIdx} className="h-1.5" />
      }

      return (
        <div key={lineIdx} className="my-0.5 leading-relaxed text-[11px]">
          {renderedParts}
        </div>
      )
    })
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'fixed bottom-6 right-6 z-[900] w-14 h-14 rounded-full shadow-brand flex items-center justify-center transition-all duration-300 transform',
          open
            ? 'bg-slate-800 rotate-0 shadow-lg'
            : 'bg-gradient-to-r from-[#635bff] to-[#7c3aed] hover:shadow-indigo-500/40 hover:scale-105 active:scale-95'
        )}
        aria-label="Vina AI Mentor"
      >
        {open ? (
          <ChevronDown className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <Sparkles className="w-6 h-6 text-white" />
            <span className={cn(
              'absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white',
              hasGeminiApiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            )} />
          </div>
        )}
      </button>

      {/* Floating Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-[900] w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-2xl border border-surface-border flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#111426] to-[#1c2242] text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#635bff] to-[#7c3aed] flex items-center justify-center text-xs font-bold shadow-sm">
                ◈
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-tight">Vina AI Mentor</span>
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.2 rounded font-bold border',
                    hasGeminiApiKey
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                  )}>
                    {hasGeminiApiKey ? 'Gemini Live' : 'Key Needed'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-none mt-0.5">{selectedExam}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reset conversation"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Missing Key Notification Banner */}
          {!hasGeminiApiKey && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 p-3 text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  Configure Your Free Gemini API Key
                </span>
              </div>
              <p className="text-[10px] text-amber-700 leading-tight">
                Add your personal Google Gemini API key to unlock unlimited AI mentor chats and PDF extraction.
              </p>
              <button
                onClick={() => {
                  setOpen(false)
                  navigate('/profile#api-key')
                }}
                className="mt-1 w-full py-1.5 px-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg font-bold text-[10px] text-center transition-all shadow-xs flex items-center justify-center gap-1"
              >
                Configure in Settings <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 max-h-80 min-h-[260px] bg-slate-50/50">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'flex flex-col',
                  m.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs shadow-subtle',
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-[#635bff] to-[#7c3aed] text-white rounded-br-xs'
                      : m.isApiKeyMissing
                      ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-xs'
                      : m.isError
                      ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  )}
                >
                  {m.role === 'user' ? (
                    <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  ) : (
                    <div>
                      {renderFormattedMessage(m.text)}
                      {m.isApiKeyMissing && (
                        <button
                          onClick={() => {
                            setOpen(false)
                            navigate('/profile#api-key')
                          }}
                          className="mt-2.5 w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] text-center transition-all flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <Key className="w-3 h-3" /> Open Settings to Add Key →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-2xl rounded-bl-xs px-3.5 py-2.5 shadow-subtle w-fit">
                <Loader2 className="w-4 h-4 animate-spin text-tnpsc-brand" />
                <span className="text-[11px] text-body-secondary font-medium">Vina is thinking…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Suggestion Chips */}
          {messages.length <= 3 && (
            <div className="px-3 py-2 bg-slate-100/60 border-t border-slate-200/60 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-[10px] text-left bg-white text-slate-700 hover:text-indigo-600 hover:border-indigo-300 border border-slate-200/80 rounded-lg px-2.5 py-1 transition-all shadow-2xs font-medium truncate max-w-full"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-surface-border">
            <div className="flex items-center gap-2 bg-slate-50 border border-surface-border rounded-xl px-3 py-2 focus-within:border-tnpsc-brand focus-within:ring-1 focus-within:ring-tnpsc-brand transition-all">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
                placeholder={hasGeminiApiKey ? `Ask Vina about ${selectedExam}…` : 'Configure Gemini API Key in Settings…'}
                className="flex-1 bg-transparent text-xs text-body-text outline-none placeholder-slate-400"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="w-7 h-7 rounded-lg bg-tnpsc-brand hover:bg-tnpsc-brand-hover text-white flex items-center justify-center disabled:opacity-30 transition-all shrink-0 shadow-sm"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
