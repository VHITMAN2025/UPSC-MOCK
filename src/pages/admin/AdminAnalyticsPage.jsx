import React, { useState, useEffect } from 'react'
import { IndianRupee, UserPlus, Activity, Database, Loader2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { executiveService } from '../../services/subscriptionService'

const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const percent = (part, whole) => (whole > 0 ? (100 * part) / whole : 0)

const RANGES = [
  { days: 7, label: 'Last 7 Days' },
  { days: 30, label: 'This Month' },
  { days: 180, label: 'Last 6 Months' },
]

// Targets the question bank is measured against. These are placeholders until
// the real per-group goals are confirmed.
const QUESTION_BANK_TARGETS = [
  { tag: 'TNPSC_GROUP_1', label: 'Group 1', target: 5000 },
  { tag: 'TNPSC_GROUP_2', label: 'Group 2 / 2A', target: 5000 },
  { tag: 'TNPSC_GROUP_4', label: 'Group 4 & VAO', target: 5000 },
]

function KpiCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-subtle p-5">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-body-secondary">{label}</p>
        <span className="w-8 h-8 rounded-lg bg-tnpsc-brand-light text-tnpsc-brand flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-black text-body-text">{value}</p>
      <p className="mt-1 text-xs text-body-secondary">{hint}</p>
    </div>
  )
}

export function AdminAnalyticsPage() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { load() }, [days])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setData(await executiveService.getOverview(days))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-5 rounded-2xl border border-amber-200 bg-amber-50 text-sm text-amber-900">
        <p className="font-bold mb-1">The overview could not be loaded</p>
        <p>{error}</p>
        <button onClick={load} className="mt-3 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold">Try again</button>
      </div>
    )
  }

  const d = data || {}
  const totalUsers = Number(d.total_users || 0)
  const paying = Number(d.paying_subscribers || 0)
  const withTest = Number(d.users_with_a_test || 0)
  const questionsTotal = Number(d.questions_total || 0)
  const bilingualPct = percent(Number(d.questions_bilingual || 0), questionsTotal)
  const byGroup = d.questions_by_group || {}
  const chartData = (d.series || []).map(row => ({
    month: row.label,
    'Free signups': Number(row.signups),
    'Paid upgrades': Number(row.upgrades),
    mrrAdded: Number(row.mrr_added),
  }))

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-body-text">Executive SaaS Overview</h1>
          <p className="text-xs text-body-secondary">Revenue, signups, conversion and question bank at a glance.</p>
        </div>
        <div className="inline-flex rounded-xl border border-surface-border bg-white p-0.5 text-xs font-bold">
          {RANGES.map(r => (
            <button key={r.days} onClick={() => setDays(r.days)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                days === r.days ? 'bg-tnpsc-brand text-white' : 'text-body-secondary hover:text-body-text'
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-tnpsc-brand" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard icon={IndianRupee} label="Monthly Recurring Rev"
              value={rupees(d.mrr)} hint={`${paying} paying subscriber${paying === 1 ? '' : 's'}`} />
            <KpiCard icon={UserPlus} label="New User Signups"
              value={Number(d.new_signups || 0).toLocaleString('en-IN')}
              hint={`${totalUsers.toLocaleString('en-IN')} total · ${Number(d.daily_active_users || 0)} active in the last 24 hours`} />
            <KpiCard icon={Activity} label="Free-to-Paid Conversion"
              value={`${percent(paying, totalUsers).toFixed(1)}%`}
              hint={`${Number(d.tests_completed || 0).toLocaleString('en-IN')} mock exam attempts completed`} />
            <KpiCard icon={Database} label="Master Question Bank"
              value={questionsTotal.toLocaleString('en-IN')}
              hint={`${bilingualPct.toFixed(1)}% bilingual (EN + TA)`} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Growth chart + funnel */}
            <div className="xl:col-span-2 bg-white rounded-2xl border border-surface-border shadow-subtle p-5 space-y-4">
              <div>
                <h2 className="text-sm font-black text-body-text">User Acquisition &amp; MRR Growth</h2>
                <p className="text-xs text-body-secondary">New free signups vs. paid upgrades, last 6 months.</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value, name, item) => (
                      name === 'Paid upgrades'
                        ? [`${value} (${rupees(item.payload.mrrAdded)} MRR added)`, name]
                        : [value, name]
                    )} />
                    <Legend />
                    <Bar dataKey="Free signups" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Paid upgrades" fill="#635bff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { step: '1. Registered Users', value: totalUsers, note: 'All accounts' },
                  { step: '2. Free Test Taken', value: withTest, note: `${percent(withTest, totalUsers).toFixed(1)}% of registered` },
                  { step: '3. Paid Subscribers', value: paying, note: `${percent(paying, withTest).toFixed(1)}% of test takers` },
                ].map(item => (
                  <div key={item.step} className="rounded-xl border border-surface-border bg-slate-50 p-3 text-center">
                    <p className="text-[11px] text-body-secondary font-semibold">{item.step}</p>
                    <p className="text-xl font-black text-body-text">{item.value.toLocaleString('en-IN')}</p>
                    <p className="text-[11px] text-body-secondary">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Question bank progress */}
            <div className="bg-white rounded-2xl border border-surface-border shadow-subtle p-5 space-y-4">
              <div>
                <h2 className="text-sm font-black text-body-text">Question Bank Targets</h2>
                <p className="text-xs text-body-secondary">Questions stored per exam group.</p>
              </div>
              {QUESTION_BANK_TARGETS.map(row => {
                const count = Number(byGroup[row.tag] || 0)
                const pct = Math.min(100, percent(count, row.target))
                return (
                  <div key={row.tag}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-body-text">{row.label}</span>
                      <span className="text-body-secondary">{count.toLocaleString('en-IN')} / {row.target.toLocaleString('en-IN')} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-tnpsc-brand" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              {Number(byGroup.UNTAGGED || 0) > 0 && (
                <p className="text-[11px] text-amber-700">{Number(byGroup.UNTAGGED)} questions have no exam group.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
