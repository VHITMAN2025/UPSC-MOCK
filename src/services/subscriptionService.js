import { supabase } from '../lib/supabase'

// Plans, coupons, per-user subscriptions, the admin CRM and the executive
// overview. Tables and functions come from migration 00017.

const MIGRATION_HINT = 'Run migration 00017_pricing_subscriptions_crm.sql in the Supabase SQL Editor first.'

function explain(error) {
  const message = String(error?.message || '')
  if (error?.code === '42P01' || error?.code === '42883' || /does not exist|schema cache/i.test(message)) {
    return new Error(MIGRATION_HINT)
  }
  return error
}

// The price a customer actually pays: the offer price when one is set.
export function effectivePrice(plan, period = 'monthly') {
  if (!plan) return 0
  const offer = period === 'annual' ? plan.offer_price_annual : plan.offer_price_monthly
  const base = period === 'annual' ? plan.price_annual : plan.price_monthly
  return Number(offer ?? base ?? 0)
}

export const planService = {
  async getAll() {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) throw explain(error)
    return data || []
  },

  // Active (non-expired) and trial users per plan. Users with no subscription
  // row count towards the free plan (the plan priced at zero).
  async getUserCounts(plans) {
    const [subsRes, usersRes] = await Promise.all([
      supabase.from('user_subscriptions').select('plan_id, status'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ])
    if (subsRes.error) throw explain(subsRes.error)
    if (usersRes.error) throw usersRes.error

    const counts = {}
    ;(subsRes.data || []).forEach(row => {
      if (row.plan_id && row.status !== 'churned') counts[row.plan_id] = (counts[row.plan_id] || 0) + 1
    })
    const subscribed = Object.values(counts).reduce((sum, n) => sum + n, 0)
    const freePlan = (plans || []).find(p => Number(p.price_monthly) === 0)
    if (freePlan) {
      counts[freePlan.id] = (counts[freePlan.id] || 0) + Math.max((usersRes.count || 0) - subscribed, 0)
    }
    return counts
  },

  async save(plan) {
    const payload = {
      name: plan.name,
      badge: plan.badge || null,
      price_monthly: plan.price_monthly,
      price_annual: plan.price_annual,
      offer_price_monthly: plan.offer_price_monthly,
      offer_price_annual: plan.offer_price_annual,
      features: plan.features,
      is_popular: Boolean(plan.is_popular),
      is_active: plan.is_active !== false,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('subscription_plans')
      .update(payload)
      .eq('id', plan.id)
      .select()
      .single()
    if (error) throw explain(error)
    return data
  },
}

export const couponService = {
  async getAll() {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw explain(error)
    return data || []
  },

  async create({ code, discount_type, discount_value, usage_limit, expires_at }) {
    const { data, error } = await supabase
      .from('coupons')
      .insert([{
        code: String(code || '').trim().toUpperCase(),
        discount_type,
        discount_value,
        usage_limit: usage_limit || null,
        expires_at: expires_at || null,
      }])
      .select()
      .single()
    if (error) {
      if (error.code === '23505') throw new Error('That coupon code already exists.')
      throw explain(error)
    }
    return data
  },

  async setActive(id, isActive) {
    const { error } = await supabase.from('coupons').update({ is_active: isActive }).eq('id', id)
    if (error) throw explain(error)
  },

  async remove(id) {
    const { error } = await supabase.from('coupons').delete().eq('id', id)
    if (error) throw explain(error)
  },
}

export const crmService = {
  async getUsers() {
    const { data, error } = await supabase.rpc('admin_users_crm')
    if (error) throw explain(error)
    return data || []
  },

  // Creates or replaces the user's single subscription row.
  async setSubscription(userId, { planId, status, validUntil }) {
    const payload = {
      user_id: userId,
      plan_id: planId || null,
      status,
      valid_until: validUntil || null,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert(payload, { onConflict: 'user_id' })
    if (error) throw explain(error)
  },
}

export const executiveService = {
  async getOverview(days = 30) {
    const { data, error } = await supabase.rpc('admin_executive_overview', { p_days: days })
    if (error) throw explain(error)
    return data
  },
}
