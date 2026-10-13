import React, { useState, useEffect } from 'react'
import { User, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useApp, EXAM_OPTIONS } from '../../contexts/AppContext'
import { profileService } from '../../services/tnpscService'

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const { selectedExam, setSelectedExam, language, setLanguage, group2LanguagePref, setGroup2LanguagePref, toast } = useApp()

  const [form, setForm] = useState({
    full_name:  '',
    bio:        '',
    target_year: new Date().getFullYear() + 1,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        full_name:   profile.full_name   ?? '',
        bio:         profile.bio         ?? '',
        target_year: profile.target_year ?? new Date().getFullYear() + 1,
      })
    }
  }, [profile])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
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

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <User className="w-6 h-6 text-tnpsc-brand" />
        <div>
          <h1 className="text-xl font-bold text-body-text">Profile & Settings</h1>
          <p className="text-xs text-body-secondary">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
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

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-tnpsc-brand hover:bg-tnpsc-brand-hover text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-brand disabled:opacity-60"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            : <><Save className="w-4 h-4" /> Save Changes</>
          }
        </button>
      </form>
    </div>
  )
}
