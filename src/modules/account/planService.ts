import { supabase } from '../identity/supabase/supabaseClient'
import type { BillingInterval, MemberPlanRecord, StoredPlan } from '../commerce/types/membership'

// Plans (Sprint 122, Portal migrations 0057–0058). Reading is straight from
// Supabase (RLS: plans that aren't disabled are public; a member reads only
// their own member_plans rows). Subscribing, switching, cancelling and the
// billing page go through api/account.ts with the member's token, which
// talks to the payment provider.

const PLAN_COLUMNS =
  'id, slug, name, description, rank, status, is_free, price_on_request, currency, monthly_cents, yearly_cents, monthly_sale_cents, yearly_sale_cents, features, highlighted, entitlements, updated_at'

export interface MemberPlanState {
  // The plan the member has now: the highest-ranked live one, else Free.
  current: StoredPlan | null
  // The paid subscription behind it, when there is one.
  subscription: MemberPlanRecord | null
  // A live plan given by the team (promotion, giveaway…), when there is one.
  given: MemberPlanRecord | null
}

const isLive = (r: MemberPlanRecord, now = Date.now()) =>
  ['active', 'trialing', 'past_due'].includes(r.status) && Date.parse(r.starts_at) <= now && (!r.ends_at || Date.parse(r.ends_at) > now)

async function call<T>(resource: string, body?: unknown): Promise<T> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null
  if (!session) throw new Error('Sign in to continue.')
  const response = await fetch(`/api/account?resource=${resource}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  const json = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string } & T
  if (!response.ok || !json.ok) throw new Error(json.error ?? `Request failed (${response.status}).`)
  return json
}

export const planService = {
  // Every plan that isn't disabled, in order (the Pricing page shows the
  // 'active' ones; a hidden one still names a member's current plan).
  async listPlans(): Promise<StoredPlan[]> {
    if (!supabase) return []
    const { data, error } = await supabase.from('membership_plans').select(PLAN_COLUMNS).order('rank')
    if (error) {
      console.warn('[plans] not available:', error.message)
      return []
    }
    return (data ?? []) as StoredPlan[]
  },

  async getMemberPlan(userId: string, plans?: StoredPlan[]): Promise<MemberPlanState> {
    const empty: MemberPlanState = { current: null, subscription: null, given: null }
    if (!supabase) return empty
    const [rowsRes, all] = await Promise.all([
      supabase
        .from('member_plans')
        .select('id, plan_id, source, status, billing_interval, starts_at, ends_at, current_period_end, cancel_at_period_end, amount_cents, currency')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      plans ? Promise.resolve(plans) : this.listPlans(),
    ])
    if (rowsRes.error) return empty
    const byId = new Map(all.map((p) => [p.id, p]))
    const live = ((rowsRes.data ?? []) as MemberPlanRecord[]).filter((r) => isLive(r))
    const rank = (r: MemberPlanRecord) => byId.get(r.plan_id)?.rank ?? 0
    live.sort((a, b) => rank(b) - rank(a))
    const top = live[0]
    return {
      current: top ? byId.get(top.plan_id) ?? null : null,
      subscription: live.find((r) => r.source === 'subscription') ?? null,
      given: live.find((r) => r.source === 'team') ?? null,
    }
  },

  async checkout(planId: string, interval: BillingInterval) {
    return (await call<{ url: string }>('plan-checkout', { planId, interval })).url
  },
  async switchPlan(planId: string, interval: BillingInterval) {
    await call('plan-switch', { planId, interval })
  },
  async cancel() {
    return call<{ endsNow: boolean }>('plan-cancel')
  },
  async resume() {
    await call('plan-resume')
  },
  async billingPage() {
    return (await call<{ url: string }>('plan-portal')).url
  },
}

// What a plan costs per interval, in cents: { regular, charged } (charged =
// the sale price when there is one). null = no price for that interval.
export function planPrice(plan: StoredPlan, interval: BillingInterval) {
  const regular = interval === 'year' ? plan.yearly_cents : plan.monthly_cents
  if (regular == null) return null
  const sale = interval === 'year' ? plan.yearly_sale_cents : plan.monthly_sale_cents
  return { regular, charged: sale ?? regular }
}
