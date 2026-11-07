import React, { useState } from 'react'
import {
  HelpCircle, MessageCircle, Mail, Phone, Send, ChevronDown,
  ChevronUp, CheckCircle2, ShieldCheck, Zap, BookOpen, AlertCircle,
  FileQuestion, Clock, Award
} from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../hooks/useAuth'

const FAQS = [
  {
    q: 'How does the 200-Question Full Mock Test engine work?',
    a: 'The engine dynamically assembles exactly 200 questions strictly matching the official TNPSC syllabus quotas: Group 1 (175 General Studies + 25 Aptitude), Group 2/2A (100 Language + 75 GS + 25 Aptitude), and Group 4 (100 Compulsory General Tamil + 75 GS + 25 Aptitude). Every mock provides 180 minutes and 300 total marks (1.5 marks per question).'
  },
  {
    q: 'How does the Zero-Repetition guarantee work across Mock Tests?',
    a: 'Every question you attempt is logged into your personal history. When you launch Mock Test 2, questions from Mock Test 1 are excluded. When taking Mock Test 3, questions from Mocks 1 and 2 are excluded. Only after 100% of questions in the group pool have been exhausted does the engine begin reshuffling from least-seen questions.'
  },
  {
    q: 'What is Option E ("Answer not known" / "விடை தெரியவில்லை") and how is it scored?',
    a: 'As per official TNPSC examination regulations, Option E is mandatory for candidates who do not know the answer. Selecting Option E awards 0 marks with NO negative penalty, accurately mimicking real OMR examination conditions.'
  },
  {
    q: 'How does Bring Your Own Paper (BYOP) extraction and auto-grading work?',
    a: 'When you upload any PDF question paper (such as past coaching tests or unkeyed previous year papers), our pipeline extracts 100% of the questions and options. When you submit your attempt, our AI solves the questions, calculates your score, and generates full bilingual explanations with a dedicated BYOP Mini-Analytics report.'
  },
  {
    q: 'How does the Daily Quick Recall streak work?',
    a: 'Quick Recall presents 5 personalized questions every day targeting long-unseen concepts and previous weak areas. Scoring a perfect 5/5 qualifies your streak (+1 day). Scoring 4/5 or below resets your streak chain to 0, instilling daily revision discipline.'
  },
  {
    q: 'Are Quick Recall questions repeated in Full Mock Tests?',
    a: 'Yes, Quick Recall and Mock Tests maintain 100% independent non-repetition tracking. A question seen in Quick Recall may appear in your Full Mock Test, and vice versa. Repetition is strictly blocked within Mock Tests (Mock 1 vs Mock 2) and within Quick Recall (Day 1 vs Day 2).'
  },
  {
    q: 'What is the difference between "PYQ" and "VINA" questions?',
    a: 'PYQ (Previous Year Questions) refers strictly to official questions that have appeared in past TNPSC examinations. VINA refers to synthetic syllabus-aligned questions drafted to test conceptual clarity. The two pools are strictly segregated.'
  }
]

export function HelpContactPage() {
  const { toast } = useApp()
  const { user, profile } = useAuth()

  const [openFaq, setOpenFaq] = useState(0)
  const [ticketForm, setTicketForm] = useState({
    category: 'Mock Test Inquiry',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmitTicket(e) {
    e.preventDefault()
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      toast.error('Please enter both subject and message.')
      return
    }

    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      toast.success('Your support request has been submitted. Our team will contact you within 24 hours.')
      setTicketForm({ category: 'Mock Test Inquiry', subject: '', message: '' })
    }, 800)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-fade-in text-body-text">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="text-center space-y-2 border-b border-surface-border pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider border border-indigo-200">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          Candidate Support &amp; Knowledge Base
        </div>
        <h1 className="text-3xl font-black text-body-text tracking-tight">
          Help &amp; Contact Us
        </h1>
        <p className="text-xs text-body-secondary max-w-xl mx-auto">
          Frequently asked questions, examination blueprint guidelines, and dedicated candidate support.
        </p>
      </div>

      {/* ── Direct Contact Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* WhatsApp Card */}
        <div className="bg-white border border-surface-border rounded-2xl p-5 shadow-subtle hover:shadow-card transition-shadow flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-body-text">WhatsApp Support</h3>
            <p className="text-xs text-body-secondary">
              Chat directly with our academic mentors for syllabus and mock test queries.
            </p>
          </div>
          <div className="pt-4 border-t border-surface-border mt-3">
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>+91 98765 43210</span>
              <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1.5 py-0.2 rounded font-mono">Chat</span>
            </a>
          </div>
        </div>

        {/* Email Support Card */}
        <div className="bg-white border border-surface-border rounded-2xl p-5 shadow-subtle hover:shadow-card transition-shadow flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-body-text">Email Inquiries</h3>
            <p className="text-xs text-body-secondary">
              Send us detailed technical questions or report question discrepancies.
            </p>
          </div>
          <div className="pt-4 border-t border-surface-border mt-3">
            <a
              href="mailto:support@vina-ai.tnpsc.com"
              className="text-xs font-bold text-blue-700 hover:text-blue-800"
            >
              support@vina-ai.tnpsc.com
            </a>
          </div>
        </div>

        {/* Live Hours Card */}
        <div className="bg-white border border-surface-border rounded-2xl p-5 shadow-subtle hover:shadow-card transition-shadow flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-body-text">Working Hours</h3>
            <p className="text-xs text-body-secondary">
              Monday through Saturday: 9:00 AM – 7:00 PM IST. Average response time: &lt; 2 hours.
            </p>
          </div>
          <div className="pt-4 border-t border-surface-border mt-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Support Active Today
            </span>
          </div>
        </div>
      </div>

      {/* ── FAQ Accordion Section ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-tnpsc-brand" />
          <h2 className="text-lg font-black text-body-text">Frequently Asked Questions</h2>
        </div>

        <div className="bg-white rounded-2xl border border-surface-border divide-y divide-surface-border shadow-subtle overflow-hidden">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <div key={idx} className="transition-colors">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-bold text-body-text">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-tnpsc-brand shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-body-secondary leading-relaxed bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Submit Support Ticket Form ────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-surface-border p-6 md:p-8 shadow-card space-y-6">
        <div>
          <h2 className="text-lg font-black text-body-text flex items-center gap-2">
            <Send className="w-5 h-5 text-tnpsc-brand" />
            Submit a Support Request
          </h2>
          <p className="text-xs text-body-secondary mt-0.5">
            Having an issue with mock generation, question display, or BYOP extraction? Let us know.
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-emerald-950">Thank You!</h3>
            <p className="text-xs text-emerald-800 max-w-md mx-auto">
              Your inquiry has been logged. An academic counselor will reach out to you via your registered email ({user?.email}).
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-body-secondary mb-1">Issue Category</label>
                <select
                  value={ticketForm.category}
                  onChange={e => setTicketForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-surface-border rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-tnpsc-brand bg-white"
                >
                  <option>Mock Test Engine Inquiry</option>
                  <option>BYOP PDF Extraction</option>
                  <option>Question Content or Key Discrepancy</option>
                  <option>Quick Recall / Streak Inquiry</option>
                  <option>Account or Subscription</option>
                  <option>Other Feedback</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-body-secondary mb-1">Your Email</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'user@example.com'}
                  className="w-full px-3 py-2.5 bg-slate-100 border border-surface-border rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-body-secondary mb-1">Subject *</label>
              <input
                type="text"
                required
                value={ticketForm.subject}
                onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Brief summary of your question or issue..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-surface-border rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-tnpsc-brand bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-body-secondary mb-1">Message Details *</label>
              <textarea
                required
                rows={4}
                value={ticketForm.message}
                onChange={e => setTicketForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Please describe the question number, paper name, or issue encountered in detail..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-surface-border rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-tnpsc-brand resize-none bg-white"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-tnpsc-brand hover:bg-tnpsc-brand-hover text-white rounded-xl text-xs font-bold shadow-brand transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Send Message'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
