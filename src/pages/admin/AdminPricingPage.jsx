import React, { useEffect, useState } from 'react'
import { Tag, Loader2, Check, Pencil, X, Plus, Trash2 } from 'lucide-react'
import { planService, couponService, effectivePrice } from '../../services/subscriptionService'
import { useApp } from '../../contexts/AppContext'

const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const EMPTY_COUPON = { code: '', discount_type: 'percent', discount_value: '', usage_limit: '', expires_at: '' }

// Number input value <-> database value ('' means "not set")
const toNumberOrNull = (value) => (value === '' || value === null || value === undefined ? null : Number(value))

function PlanEditor({ plan, onClose, onSaved }) {
  const { toast } = useApp()
  const [form, setForm] = useState({
    name: plan.name,
    badge: plan.badge || '',
    price_monthly: String(plan.price_monthly ?? 0),
    price_annual: plan.price_annual ?? '',
    offer_price_monthly: plan.offer_price_monthly ?? '',
    offer_price_annual: plan.offer_price_annual ?? '',
    features: (plan.features || []).join('\n'),
    is_popular: Boolean(plan.is_popular),
    is_active: plan.is_active !== false,
  })
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function handleSave() {
    const monthly = Number(form.price_monthly)
    const annual = toNumberOrNull(form.price_annual)
    const offerMonthly = toNumberOrNull(form.offer_price_monthly)
    const offerAnnual = toNumberOrNull(form.offer_price_annual)

    if (!form.name.trim()) return toast.error('Plan name is required.')
    if (!Number.isFinite(monthly) || monthly < 0) return toast.error('Monthly price must be zero or more.')
    if ([annual, offerMonthly, offerAnnual].some(v => v !== null && (!Number.isFinite(v) || v < 0))) {
      return toast.error('Prices must be zero or more.')
    }
    if (offerMonthly !== null && offerMonthly >= monthly) return toast.error('The monthly offer price must be lower than the monthly price.')
    if (offerAnnual !== null && annual !== null && offerAnnual >= annual) return toast.error('The annual offer price must be lower than the annual price.')

    setSaving(true)
    try {
      const saved = await planService.save({
        ...plan,
        name: form.name.trim(),
        badge: form.badge.trim(),
        price_monthly: monthly,
        price_annual: annual,
        offer_price_monthly: offerMonthly,
        offer_price_annual: offerAnnual,
        features: form.features.split('\n').map(s => s.trim()).filter(Boolean),
        is_popular: form.is_popular,
        is_active: form.is_active,
      })
      toast.success(`${saved.name} updated.`)
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
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-modal">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-bold text-body-text">Edit Price &amp; Features</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-body-secondary" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={label}>Plan name</label>
            <input className={field} value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className={label}>Badge</label>
            <input className={field} value={form.badge} onChange={set('badge')} placeholder="e.g. MOST POPULAR" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Monthly price (₹)</label>
              <input type="number" min="0" className={field} value={form.price_monthly} onChange={set('price_monthly')} />
            </div>
            <div>
              <label className={label}>Annual price (₹)</label>
              <input type="number" min="0" className={field} value={form.price_annual} onChange={set('price_annual')} />
            </div>
            <div>
              <label className={label}>Monthly offer price (₹)</label>
              <input type="number" min="0" className={field} value={form.offer_price_monthly} onChange={set('offer_price_monthly')} placeholder="Optional" />
            </div>
            <div>
              <label className={label}>Annual offer price (₹)</label>
              <input type="number" min="0" className={field} value={form.offer_price_annual} onChange={set('offer_price_annual')} placeholder="Optional" />
            </div>
          </div>

          <div>
            <label className={label}>Plan bullet points (one per line)</label>
            <textarea rows={6} className={field} value={form.features} onChange={set('features')} />
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm text-body-text cursor-pointer">
              <input type="checkbox" checked={form.is_popular} onChange={set('is_popular')} />
              Mark as most popular
            </label>
            <label className="flex items-center gap-2 text-sm text-body-text cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={set('is_active')} />
              Visible to students
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-surface-border">
          <button onClick={onClose} disabled={saving}
            className="px-4 py-2 text-sm font-bold bg-white border border-surface-border rounded-xl disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm font-bold bg-tnpsc-brand hover:bg-[#4f46e5] text-white rounded-xl disabled:opacity-50 flex items-center gap-1.5">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminPricingPage() {
  const { toast } = useApp()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [plans, setPlans] = useState([])
  const [userCounts, setUserCounts] = useState({})
  const [coupons, setCoupons] = useState([])
  const [editingPlan, setEditingPlan] = useState(null)
  const [couponForm, setCouponForm] = useState(EMPTY_COUPON)
  const [creating, setCreating] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const planList = await planService.getAll()
      const [counts, couponList] = await Promise.all([
        planService.getUserCounts(planList),
        couponService.getAll(),
      ])
      setPlans(planList)
      setUserCounts(counts)
      setCoupons(couponList)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCoupon(e) {
    e.preventDefault()
    const value = Number(couponForm.discount_value)
    if (!couponForm.code.trim()) return toast.error('Enter a coupon code.')
    if (!Number.isFinite(value) || value <= 0) return toast.error('Enter a discount greater than zero.')
    if (couponForm.discount_type === 'percent' && value > 100) return toast.error('A percentage discount cannot exceed 100.')

    setCreating(true)
    try {
      await couponService.create({
        ...couponForm,
        discount_value: value,
        usage_limit: couponForm.usage_limit ? Number(couponForm.usage_limit) : null,
        expires_at: couponForm.expires_at ? new Date(`${couponForm.expires_at}T23:59:59`).toISOString() : null,
      })
      toast.success('Coupon created.')
      setCouponForm(EMPTY_COUPON)
      setCoupons(await couponService.getAll())
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleToggleCoupon(coupon) {
    try {
      await couponService.setActive(coupon.id, !coupon.is_active)
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDeleteCoupon(coupon) {
    if (!window.confirm(`Delete coupon ${coupon.code}? This cannot be undone.`)) return
    try {
      await couponService.remove(coupon.id)
      setCoupons(prev => prev.filter(c => c.id !== coupon.id))
      toast.success('Coupon deleted.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const couponStatus = (c) => {
    if (!c.is_active) return { text: 'Paused', cls: 'bg-slate-100 text-slate-600' }
    if (c.expires_at && new Date(c.expires_at) < new Date()) return { text: 'Expired', cls: 'bg-red-100 text-red-700' }
    if (c.usage_limit && c.used_count >= c.usage_limit) return { text: 'Used up', cls: 'bg-amber-100 text-amber-800' }
    return { text: 'Active', cls: 'bg-emerald-100 text-emerald-700' }
  }

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-tnpsc-brand" /></div>
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-5 rounded-2xl border border-amber-200 bg-amber-50 text-sm text-amber-900">
        <p className="font-bold mb-1">Pricing could not be loaded</p>
        <p>{error}</p>
        <button onClick={load} className="mt-3 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold">Try again</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Tag className="w-6 h-6 text-tnpsc-brand" />
        <div>
          <h1 className="text-xl font-bold text-body-text">Pricing Tiers, Billing &amp; Coupons</h1>
          <p className="text-xs text-body-secondary">Plan prices, offers and promotional codes.</p>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {plans.map(plan => {
          const monthly = effectivePrice(plan, 'monthly')
          const annual = effectivePrice(plan, 'annual')
          const hasOffer = plan.offer_price_monthly !== null && plan.offer_price_monthly !== undefined
          return (
            <div key={plan.id} className={`bg-white rounded-2xl border p-5 flex flex-col shadow-subtle ${
              plan.is_popular ? 'border-tnpsc-brand ring-1 ring-tnpsc-brand/30' : 'border-surface-border'
            } ${plan.is_active ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                {plan.badge
                  ? <span className="px-2 py-0.5 rounded bg-tnpsc-brand-light text-tnpsc-brand text-[10px] font-black uppercase">{plan.badge}</span>
                  : <span />}
                <span className="text-[11px] text-body-secondary whitespace-nowrap">{userCounts[plan.id] || 0} active users</span>
              </div>

              <h3 className="text-lg font-black text-body-text">{plan.name}</h3>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-body-text">{rupees(monthly)}</span>
                <span className="text-xs text-body-secondary">/ month</span>
                {hasOffer && <span className="text-xs text-slate-400 line-through">{rupees(plan.price_monthly)}</span>}
              </div>
              {plan.price_annual !== null && plan.price_annual !== undefined && (
                <p className="text-xs text-body-secondary mt-0.5">{rupees(annual)} / year</p>
              )}

              <ul className="mt-4 space-y-1.5 flex-1">
                {(plan.features || []).map(feature => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-body-text">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button onClick={() => setEditingPlan(plan)}
                className="mt-5 flex items-center gap-1.5 text-xs font-bold text-tnpsc-brand hover:underline self-start">
                <Pencil className="w-3.5 h-3.5" /> Edit Price &amp; Features
              </button>
            </div>
          )
        })}
      </div>

      {/* Coupons */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-subtle p-5 space-y-4">
        <div>
          <h2 className="text-sm font-black text-body-text uppercase tracking-wider">Promotional Discount Codes</h2>
          <p className="text-xs text-body-secondary">Create codes for marketing campaigns.</p>
        </div>

        <form onSubmit={handleCreateCoupon} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
          <input value={couponForm.code}
            onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="CODE, e.g. GROUP4WIN" aria-label="Coupon code"
            className="col-span-2 px-3 py-2 border border-surface-border rounded-lg text-sm uppercase outline-none focus:ring-2 focus:ring-tnpsc-brand" />
          <div className="flex gap-1">
            <select value={couponForm.discount_type}
              onChange={e => setCouponForm(f => ({ ...f, discount_type: e.target.value }))}
              aria-label="Discount type"
              className="px-2 py-2 border border-surface-border rounded-lg text-sm bg-white outline-none">
              <option value="percent">% OFF</option>
              <option value="flat">Flat ₹</option>
            </select>
            <input type="number" min="1" value={couponForm.discount_value}
              onChange={e => setCouponForm(f => ({ ...f, discount_value: e.target.value }))}
              placeholder="Value" aria-label="Discount value"
              className="w-full px-2 py-2 border border-surface-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-tnpsc-brand" />
          </div>
          <input type="number" min="1" value={couponForm.usage_limit}
            onChange={e => setCouponForm(f => ({ ...f, usage_limit: e.target.value }))}
            placeholder="Usage limit" aria-label="Usage limit"
            className="px-3 py-2 border border-surface-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-tnpsc-brand" />
          <input type="date" value={couponForm.expires_at}
            onChange={e => setCouponForm(f => ({ ...f, expires_at: e.target.value }))}
            aria-label="Expiry date"
            className="px-3 py-2 border border-surface-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-tnpsc-brand" />
          <button type="submit" disabled={creating}
            className="px-3 py-2 bg-tnpsc-brand hover:bg-[#4f46e5] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1 disabled:opacity-50">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Code
          </button>
        </form>

        {coupons.length === 0 ? (
          <p className="text-xs text-body-secondary py-4 text-center">No coupon codes yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {coupons.map(coupon => {
              const status = couponStatus(coupon)
              return (
                <div key={coupon.id} className="border border-surface-border rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-body-text">
                      {coupon.code}{' '}
                      <span className="text-tnpsc-brand">
                        {coupon.discount_type === 'percent' ? `${Number(coupon.discount_value)}% OFF` : `${rupees(coupon.discount_value)} FLAT`}
                      </span>
                    </p>
                    <p className="text-[11px] text-body-secondary">
                      Used {coupon.used_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                      {coupon.expires_at ? ` · Expires ${new Date(coupon.expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => handleToggleCoupon(coupon)} title={coupon.is_active ? 'Pause' : 'Resume'}
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${status.cls}`}>
                      {status.text}
                    </button>
                    <button onClick={() => handleDeleteCoupon(coupon)} title="Delete coupon"
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {editingPlan && (
        <PlanEditor
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSaved={() => { setEditingPlan(null); load() }}
        />
      )}
    </div>
  )
}
