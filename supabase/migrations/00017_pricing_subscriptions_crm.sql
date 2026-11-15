-- Pricing & Plans, coupons, user subscriptions, and the admin CRM / executive
-- overview functions. Run this once in the Supabase SQL Editor.
-- Safe to re-run: every statement is idempotent.

-- ── 1. Subscription plans ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  badge TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price_monthly >= 0),
  price_annual NUMERIC(10,2) CHECK (price_annual >= 0),
  offer_price_monthly NUMERIC(10,2) CHECK (offer_price_monthly >= 0),
  offer_price_annual NUMERIC(10,2) CHECK (offer_price_annual >= 0),
  features TEXT[] NOT NULL DEFAULT '{}',
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Promotional coupon codes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'flat')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  usage_limit INTEGER CHECK (usage_limit > 0),
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT coupon_percent_max CHECK (discount_type <> 'percent' OR discount_value <= 100)
);

-- ── 3. One subscription row per user ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'churned')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan ON public.user_subscriptions(plan_id);

-- ── 4. Row level security ────────────────────────────────────────────────────
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads active plans" ON public.subscription_plans;
CREATE POLICY "Anyone reads active plans" ON public.subscription_plans
  FOR SELECT USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS "Admins manage plans" ON public.subscription_plans;
CREATE POLICY "Admins manage plans" ON public.subscription_plans
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Coupons are admin-only: they are never listed to students.
DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons" ON public.coupons
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users read own subscription" ON public.user_subscriptions;
CREATE POLICY "Users read own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Admins manage subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── 5. Starter plans (editable later from Admin > Pricing & Plans) ───────────
INSERT INTO public.subscription_plans
  (slug, name, badge, price_monthly, price_annual, features, is_popular, sort_order)
VALUES
  ('starter-free', 'Starter Free Tier', 'LEAD MAGNET', 0, NULL,
    ARRAY['2 Full-Length Mock Tests', '100 Daily Practice Questions', 'Basic Bilingual Interface (EN/TA)', 'Standard Syllabus Tracker'],
    false, 1),
  ('group4-vao-pass', 'Group 4 & VAO Pass', 'SSLC STANDARD (CODE 496)', 299, 1999,
    ARRAY['5,000+ Group 4 Bilingual Questions', 'Full Pothu Tamil (100 Qs) Mock Engine', 'Unit-wise SSLC Standard Tests', 'Detailed Step-by-Step Solutions'],
    false, 2),
  ('all-access-pro', 'TNPSC All-Access Pro', 'MOST POPULAR · GROUP 2 + 4', 499, 3499,
    ARRAY['All Group 2/2A (Code 495) & Group 4 Banks', '6,000+ Pure Aptitude & Mental Ability Qs', 'Unlimited AI Doubt Solver & Explanations', 'Weak-Topic Analytics & Rank Predictor', 'Downloadable Revision PDFs'],
    true, 3)
ON CONFLICT (slug) DO NOTHING;

-- ── 6. Admin CRM: one row per user with plan, activity and test telemetry ────
-- SECURITY DEFINER because it reads auth.users (last login, phone). The
-- is_admin() check makes it unusable by anyone else.
CREATE OR REPLACE FUNCTION public.admin_users_crm()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT,
  selected_exam TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  plan_id UUID,
  plan_name TEXT,
  plan_price NUMERIC,
  subscription_status TEXT,
  valid_until TIMESTAMPTZ,
  tests_taken BIGINT,
  avg_accuracy NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can view the user CRM' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.email,
    COALESCE(u.phone, u.raw_user_meta_data->>'phone'),
    p.role,
    to_jsonb(p)->>'selected_exam',
    p.created_at,
    u.last_sign_in_at,
    s.plan_id,
    pl.name,
    COALESCE(pl.offer_price_monthly, pl.price_monthly),
    s.status,
    s.valid_until,
    COALESCE(a.tests, 0),
    a.avg_acc
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.user_subscriptions s ON s.user_id = p.id
  LEFT JOIN public.subscription_plans pl ON pl.id = s.plan_id
  LEFT JOIN (
    SELECT at.user_id,
           count(*) FILTER (WHERE at.status = 'completed') AS tests,
           round(avg(at.accuracy) FILTER (WHERE at.status = 'completed'), 1) AS avg_acc
    FROM public.attempts at
    GROUP BY at.user_id
  ) a ON a.user_id = p.id
  ORDER BY u.last_sign_in_at DESC NULLS LAST, p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_users_crm() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_users_crm() TO authenticated;

-- ── 7. Executive overview numbers (admin only) ───────────────────────────────
-- p_days is the reporting window for "new signups" (7, 30 or 180).
CREATE OR REPLACE FUNCTION public.admin_executive_overview(p_days INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_since TIMESTAMPTZ := now() - make_interval(days => GREATEST(p_days, 1));
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can view the executive overview' USING ERRCODE = '42501';
  END IF;

  WITH paying AS (
    SELECT s.user_id, COALESCE(pl.offer_price_monthly, pl.price_monthly) AS monthly
    FROM public.user_subscriptions s
    JOIN public.subscription_plans pl ON pl.id = s.plan_id
    WHERE s.status = 'active'
      AND (s.valid_until IS NULL OR s.valid_until > now())
      AND COALESCE(pl.offer_price_monthly, pl.price_monthly) > 0
  ),
  months AS (
    SELECT date_trunc('month', now()) - (n || ' month')::interval AS month_start
    FROM generate_series(5, 0, -1) AS n
  ),
  series AS (
    SELECT
      to_char(m.month_start, 'Mon') AS label,
      (SELECT count(*) FROM public.profiles p
         WHERE date_trunc('month', p.created_at) = m.month_start) AS signups,
      (SELECT count(*) FROM public.user_subscriptions s
         JOIN public.subscription_plans pl ON pl.id = s.plan_id
         WHERE date_trunc('month', s.starts_at) = m.month_start
           AND COALESCE(pl.offer_price_monthly, pl.price_monthly) > 0) AS upgrades,
      (SELECT COALESCE(sum(COALESCE(pl.offer_price_monthly, pl.price_monthly)), 0)
         FROM public.user_subscriptions s
         JOIN public.subscription_plans pl ON pl.id = s.plan_id
         WHERE date_trunc('month', s.starts_at) = m.month_start
           AND COALESCE(pl.offer_price_monthly, pl.price_monthly) > 0) AS mrr_added
    FROM months m
  )
  SELECT jsonb_build_object(
    'total_users',        (SELECT count(*) FROM public.profiles),
    'new_signups',        (SELECT count(*) FROM public.profiles WHERE created_at >= v_since),
    'daily_active_users', (SELECT count(*) FROM auth.users WHERE last_sign_in_at >= now() - interval '24 hours'),
    'paying_subscribers', (SELECT count(*) FROM paying),
    'mrr',                (SELECT COALESCE(sum(monthly), 0) FROM paying),
    'tests_completed',    (SELECT count(*) FROM public.attempts WHERE status = 'completed'),
    'users_with_a_test',  (SELECT count(DISTINCT user_id) FROM public.attempts WHERE status = 'completed'),
    'questions_total',    (SELECT count(*) FROM public.questions),
    'questions_bilingual',(SELECT count(*) FROM public.questions
                             WHERE COALESCE(question_text, '') <> '' AND COALESCE(question_text_tamil, '') <> ''),
    'questions_by_group', (SELECT COALESCE(jsonb_object_agg(g, c), '{}'::jsonb)
                             FROM (SELECT COALESCE(exam_tag, 'UNTAGGED') AS g, count(*) AS c
                                   FROM public.questions GROUP BY 1) t),
    'series',             (SELECT jsonb_agg(jsonb_build_object(
                                    'label', label, 'signups', signups,
                                    'upgrades', upgrades, 'mrr_added', mrr_added)
                                  ORDER BY ord)
                             FROM (SELECT s.*, row_number() OVER () AS ord FROM series s) x)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_executive_overview(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_executive_overview(INTEGER) TO authenticated;
