import React, { useState, useEffect } from 'react'
import { Users, Search, Loader2, X, Download } from 'lucide-react'
import { adminUserService } from '../../services/adminService'
import { crmService, planService } from '../../services/subscriptionService'
import { useApp } from '../../contexts/AppContext'
import { formatDate, formatScore } from '../../lib/utils'

const ROLE_COLOR = { admin: 'bg-amber-100 text-amber-800', user: 'bg-blue-100 text-blue-700' }

function UserDrawer({ userId, profile, onClose }) {
  const { toast } = useApp()
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [changing, setChanging] = useState(false)

  useEffect(() => { load() }, [userId])

  async function load() {
    setLoading(true)
    try { setStats(await adminUserService.getUserStats(userId)) }
    catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  async function handleRoleChange(newRole) {
    if (!window.confirm(`Change ${profile.full_name}'s role to ${newRole}?`)) return
    setChanging(true)
    try {
      await adminUserService.setRole(userId, newRole)
      toast.success('Role updated — page will reflect on next load')
      onClose()
    } catch (err) { toast.error(err.message) }
    finally { setChanging(false) }
  }

  const completed = stats?.attempts?.filter(a => a.status === 'completed') ?? []
  const avgAcc = completed.length
    ? (completed.reduce((s, a) => s + Number(a.accuracy ?? 0), 0) / completed.length).toFixed(1)
    : '—'

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-modal overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-bold text-body-text">User Profile</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-body-secondary" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-tnpsc-brand-light flex items-center justify-center text-tnpsc-brand font-bold text-xl">
              {profile.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <p className="text-base font-bold text-body-text">{profile.full_name ?? '—'}</p>
              <p className="text-sm text-body-secondary">{profile.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ${ROLE_COLOR[profile.role] ?? ROLE_COLOR.user}`}>{profile.role}</span>
                {profile.selected_exam && <span className="text-[10px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">{profile.selected_exam}</span>}
              </div>
            </div>
          </div>

          {/* Stats */}
          {loading ? <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-tnpsc-brand" /></div> : (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Attempts',     value: stats?.attempts?.length ?? 0 },
                { label: 'Avg Accuracy', value: `${avgAcc}%` },
                { label: 'Recall Pts',   value: stats?.streak?.recall_points ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-body-text">{value}</p>
                  <p className="text-[10px] text-body-secondary">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recent attempts */}
          {stats?.attempts?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-body-secondary uppercase tracking-wider mb-2">Recent Attempts</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {stats.attempts.slice(0,5).map(a => (
                  <div key={a.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-body-secondary">{formatDate(a.submitted_at).split(',')[0]}</span>
                    <span className={`text-xs font-bold ${a.status === 'completed' ? 'text-tnpsc-brand' : 'text-amber-600'}`}>
                      {a.status === 'completed' ? `${formatScore(a.score)}` : a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Role management */}
          <div className="pt-2 border-t border-surface-border">
            <p className="text-xs font-bold text-body-secondary uppercase tracking-wider mb-2">Change Role</p>
            <div className="flex gap-2">
              {['user','admin'].map(r => (
                <button key={r} onClick={() => handleRoleChange(r)} disabled={changing || profile.role === r}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors capitalize ${profile.role === r ? 'bg-tnpsc-brand text-white border-tnpsc-brand' : 'bg-white border-surface-border text-body-secondary hover:border-tnpsc-brand/40 disabled:opacity-40'}`}>
                  {r}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-body-secondary mt-1.5">⚠ Role changes take effect immediately. Admin users have full platform access.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Target exam as shown in the CRM table
function examLabel(value) {
  const v = String(value || '').toLowerCase()
  if (v.includes('group 1')) return 'Group 1'
  if (v.includes('group 2')) return 'Group 2 / 2A'
  if (v.includes('group 4')) return 'Group 4 & VAO'
  return value || '—'
}

// "2 mins ago", "3 hrs ago", "Yesterday", "14 days ago"
function relativeTime(iso) {
  if (!iso) return 'Never'
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 60) return `${days} days ago`
  return `${Math.floor(days / 30)} months ago`
}

// A stored status wins. A paid plan whose validity date has passed counts as churned.
function subscriptionState(u) {
  const paid = Number(u.plan_price || 0) > 0
  const expired = u.valid_until && new Date(u.valid_until) < new Date()
  if (u.subscription_status === 'churned' || (paid && expired)) return 'churned'
  if (u.subscription_status === 'trial') return 'trial'
  return 'active'
}

const STATE_STYLE = {
  active:  { text: 'Active',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  trial:   { text: 'Trial',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  churned: { text: 'Churned', cls: 'bg-red-50 text-red-700 border-red-200' },
}

function ManagePlanModal({ user, plans, onClose, onSaved }) {
  const { toast } = useApp()
  const [planId, setPlanId] = useState(user.plan_id || '')
  const [status, setStatus] = useState(user.subscription_status || 'active')
  const [validUntil, setValidUntil] = useState(user.valid_until ? user.valid_until.slice(0, 10) : '')
  const [role, setRole] = useState(user.role)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (role !== user.role) {
      const verb = role === 'admin' ? 'grant admin access to' : 'revoke admin access from'
      if (!window.confirm(`Really ${verb} ${user.full_name || user.email}?`)) return
    }
    setSaving(true)
    try {
      await crmService.setSubscription(user.user_id, {
        planId: planId || null,
        status,
        validUntil: validUntil ? new Date(`${validUntil}T23:59:59`).toISOString() : null,
      })
      if (role !== user.role) await adminUserService.setRole(user.user_id, role)
      toast.success('Subscription updated.')
      onSaved()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const field = 'w-full px-3 py-2 border border-surface-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-tnpsc-brand bg-white'
  const label = 'block text-[11px] font-bold uppercase tracking-wider text-body-secondary mb-1'

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-modal">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <div>
            <h2 className="text-base font-bold text-body-text">Manage Plan</h2>
            <p className="text-xs text-body-secondary">{user.full_name || user.email}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-body-secondary" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={label}>Subscription plan</label>
            <select className={field} value={planId} onChange={e => setPlanId(e.target.value)}>
              <option value="">No plan (free)</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Status</label>
              <select className={field} value={status} onChange={e => setStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="churned">Churned</option>
              </select>
            </div>
            <div>
              <label className={label}>Valid until</label>
              <input type="date" className={field} value={validUntil} onChange={e => setValidUntil(e.target.value)} />
            </div>
          </div>

          <div className="pt-3 border-t border-surface-border">
            <label className={label}>Admin access</label>
            <div className="flex gap-2">
              {['user', 'admin'].map(r => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border capitalize transition-colors ${
                    role === r ? 'bg-tnpsc-brand text-white border-tnpsc-brand' : 'bg-white border-surface-border text-body-secondary'
                  }`}>
                  {r === 'admin' ? 'Admin' : 'Student'}
                </button>
              ))}
            </div>
            {role !== user.role && (
              <p className="text-[11px] text-amber-700 mt-1.5">Admin access changes apply as soon as you save.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-surface-border">
          <button onClick={onClose} disabled={saving}
            className="px-4 py-2 text-sm font-bold bg-white border border-surface-border rounded-xl disabled:opacity-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm font-bold bg-tnpsc-brand hover:bg-[#4f46e5] text-white rounded-xl disabled:opacity-50 flex items-center gap-1.5">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminUsersPage() {
  const { toast } = useApp()
  const [users, setUsers]     = useState([])
  const [plans, setPlans]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [search, setSearch]   = useState('')
  const [planFilter, setPlanFilter]     = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [managing, setManaging] = useState(null)
  const [viewing, setViewing]   = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [crmRows, planRows] = await Promise.all([crmService.getUsers(), planService.getAll()])
      setUsers(crmRows)
      setPlans(planRows)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filtered = users.filter(u => {
    const term = search.trim().toLowerCase()
    if (term) {
      const haystack = `${u.full_name || ''} ${u.email || ''} ${u.phone || ''}`.toLowerCase()
      if (!haystack.includes(term)) return false
    }
    if (planFilter === 'none' && u.plan_id) return false
    if (planFilter !== 'all' && planFilter !== 'none' && u.plan_id !== planFilter) return false
    if (statusFilter !== 'all' && subscriptionState(u) !== statusFilter) return false
    return true
  })

  function handleExportCsv() {
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const header = ['Name', 'Email', 'Phone', 'Target exam', 'Plan', 'Status', 'Tests taken', 'Avg accuracy %', 'Last login']
    const rows = filtered.map(u => [
      u.full_name, u.email, u.phone, examLabel(u.selected_exam), u.plan_name || 'Free Tier',
      STATE_STYLE[subscriptionState(u)].text, u.tests_taken, u.avg_accuracy ?? '',
      u.last_sign_in_at ? new Date(u.last_sign_in_at).toISOString() : '',
    ])
    const csv = [header, ...rows].map(r => r.map(cell).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'users_subscriptions.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filtered.length} users.`)
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-5 rounded-2xl border border-amber-200 bg-amber-50 text-sm text-amber-900">
        <p className="font-bold mb-1">Users could not be loaded</p>
        <p>{error}</p>
        <button onClick={load} className="mt-3 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold">Try again</button>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-tnpsc-brand" />
        <div>
          <h1 className="text-xl font-bold text-body-text">Users, Subscriptions &amp; CRM</h1>
          <p className="text-xs text-body-secondary">{users.length} users · {filtered.length} shown</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-secondary" />
          <input type="text" placeholder="Search by name, email or mobile number…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-surface-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-tnpsc-brand bg-white" />
        </div>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} aria-label="Filter by plan"
          className="border border-surface-border rounded-xl px-3 py-2 text-sm outline-none bg-white">
          <option value="all">All Subscription Plans</option>
          <option value="none">No plan</option>
          {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status"
          className="border border-surface-border rounded-xl px-3 py-2 text-sm outline-none bg-white">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="churned">Churned</option>
        </select>
        <button onClick={handleExportCsv} disabled={filtered.length === 0}
          className="px-3 py-2 border border-surface-border rounded-xl text-sm font-bold bg-white hover:bg-slate-50 flex items-center gap-1.5 disabled:opacity-40">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-surface-border shadow-subtle overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-tnpsc-brand" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-body-secondary">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-surface-border text-body-secondary uppercase font-semibold text-[10px]">
                  <th className="py-3 px-4">Student &amp; Contact</th>
                  <th className="py-3 px-4">Target Exam</th>
                  <th className="py-3 px-4">Subscription Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tests &amp; Accuracy</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map(u => {
                  const state = STATE_STYLE[subscriptionState(u)]
                  return (
                    <tr key={u.user_id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <button onClick={() => setViewing(u)} className="text-left">
                          <p className="font-semibold text-body-text hover:text-tnpsc-brand">
                            {u.full_name ?? '—'}
                            {u.role === 'admin' && (
                              <span className="ml-1.5 text-[9px] font-bold uppercase rounded-full px-1.5 py-0.5 bg-amber-100 text-amber-800">Admin</span>
                            )}
                          </p>
                          <p className="text-body-secondary text-[11px]">{u.email}</p>
                          {u.phone && <p className="text-body-secondary text-[11px]">{u.phone.startsWith('+') ? u.phone : `+${u.phone}`}</p>}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">{examLabel(u.selected_exam)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-body-text">{u.plan_name || 'Free Tier'}</p>
                        <p className="text-body-secondary text-[11px]">
                          {Number(u.plan_price || 0) > 0 ? `₹${Number(u.plan_price).toLocaleString('en-IN')}/mo` : '₹0'}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${state.cls}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />{state.text}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-body-text">
                        <span className="font-semibold">{u.tests_taken} test{Number(u.tests_taken) === 1 ? '' : 's'}</span>
                        {u.avg_accuracy !== null && u.avg_accuracy !== undefined && (
                          <span className="text-body-secondary"> · {Number(u.avg_accuracy).toFixed(0)}% avg</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-body-secondary whitespace-nowrap">{relativeTime(u.last_sign_in_at)}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => setManaging(u)}
                          className="px-3 py-1.5 bg-tnpsc-brand-light text-tnpsc-brand text-[11px] font-bold rounded-lg hover:bg-tnpsc-brand hover:text-white transition-colors">
                          Manage Plan
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {managing && (
        <ManagePlanModal user={managing} plans={plans}
          onClose={() => setManaging(null)}
          onSaved={() => { setManaging(null); load() }} />
      )}
      {viewing && (
        <UserDrawer userId={viewing.user_id}
          profile={{ ...viewing, id: viewing.user_id }}
          onClose={() => { setViewing(null); load() }} />
      )}
    </div>
  )
}
