import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, CreditCard, Crown } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PlanChooser from '../../components/account/PlanChooser'
import { formatCents } from '../../modules/workspace/lib/bundlePrice'
import { planService } from '../../modules/account/planService'
import { useMemberPlan } from '../../modules/account/useMemberPlan'
import type { BillingInterval, StoredPlan } from '../../modules/commerce/types/membership'

const day = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''

// Account → Membership (Sprint 122): the member's plan — paid or given by
// the team — its billing, cancelling or resuming it, and changing plan.
export default function MembershipPage() {
  const { plans, current, subscription, given, loading, reload } = useMemberPlan()
  const [params, setParams] = useSearchParams()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ kind: 'cancel' } | { kind: 'switch'; plan: StoredPlan; interval: BillingInterval } | null>(null)
  const offered = plans.filter((p) => p.status === 'active')
  const subPlan = subscription ? plans.find((p) => p.id === subscription.plan_id) : null

  // Back from the checkout: the payment provider tells us in a few seconds.
  useEffect(() => {
    if (params.get('subscribed') !== '1') return
    setNotice('Thank you! Your plan is being activated…')
    let tries = 0
    const timer = window.setInterval(async () => {
      tries += 1
      await reload()
      if (tries >= 6) window.clearInterval(timer)
    }, 2500)
    setParams({}, { replace: true })
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (notice?.startsWith('Thank you') && subscription) setNotice(`Welcome to ${subPlan?.name ?? 'your new plan'}! Your plan is active.`)
  }, [subscription, subPlan, notice])

  async function run(key: string, action: () => Promise<string | void>) {
    setBusy(key)
    setError(null)
    try {
      const message = await action()
      if (message) setNotice(message)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(null)
      setConfirm(null)
    }
  }

  async function openBilling() {
    setBusy('billing')
    setError(null)
    try {
      window.location.href = await planService.billingPage()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t open the billing page.')
      setBusy(null)
    }
  }

  function choose(plan: StoredPlan, interval: BillingInterval) {
    if (subscription) {
      setConfirm({ kind: 'switch', plan, interval })
      return
    }
    void run(plan.id, async () => {
      window.location.href = await planService.checkout(plan.id, interval)
    })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <SEO title="Membership" description="Your BGrowth plan and billing." path="/platform/membership" />
      <div>
        <p className="eyebrow">Account</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">Membership</h1>
      </div>

      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13.5px] text-red-600">{error}</p>}

      <section className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
        {loading ? (
          <p className="text-[14px] text-navy/40">Loading…</p>
        ) : (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-bg-soft text-primary">
              <Crown size={20} />
            </span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-navy/40">Your plan</p>
              <p className="font-display text-2xl font-bold text-navy">{current?.name ?? 'Free'}</p>

              {subscription && (
                <p className="text-[14px] text-navy/60">
                  {subPlan?.name ?? 'Plan'}
                  {subscription.amount_cents != null && ` · ${formatCents(subscription.amount_cents)} / ${subscription.billing_interval === 'year' ? 'year' : 'month'}`}
                  {subscription.status === 'past_due'
                    ? ''
                    : subscription.cancel_at_period_end
                      ? ` · ends on ${day(subscription.ends_at ?? subscription.current_period_end)} — you won’t be charged again`
                      : subscription.current_period_end
                        ? ` · renews on ${day(subscription.current_period_end)}`
                        : ''}
                </p>
              )}
              {subscription?.status === 'past_due' && (
                <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[13.5px] text-amber-700">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  Your last payment didn’t go through. Update your card to keep your plan
                  {subscription.ends_at ? ` (it stays active until ${day(subscription.ends_at)})` : ''}.
                </p>
              )}
              {given && (
                <p className="text-[14px] text-navy/60">
                  {plans.find((p) => p.id === given.plan_id)?.name ?? 'A plan'} given by the BGrowth team
                  {given.ends_at ? ` until ${day(given.ends_at)}` : ''}.
                </p>
              )}
              {!subscription && !given && <p className="text-[14px] text-navy/55">You’re on the free plan. Choose a plan below for more.</p>}
            </div>

            {subscription && (
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <Button type="button" variant="secondary" icon={<CreditCard size={15} />} disabled={busy !== null} onClick={() => void openBilling()} className="!rounded-xl !px-4 !py-2 !text-[13px]">
                  {busy === 'billing' ? 'Opening…' : 'Card & invoices'}
                </Button>
                {subscription.cancel_at_period_end ? (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void run('resume', async () => {
                      await planService.resume()
                      return 'Your plan will keep renewing.'
                    })}
                    className="text-[13px] font-semibold text-primary hover:underline disabled:opacity-40"
                  >
                    Keep my plan
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => setConfirm({ kind: 'cancel' })}
                    className="text-[13px] font-semibold text-navy/45 hover:text-red-500 disabled:opacity-40"
                  >
                    Cancel plan
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {offered.some((p) => !p.is_free) && (
        <section>
          <h2 className="mb-6 font-display text-xl font-bold text-navy">{subscription ? 'Change plan' : 'Choose a plan'}</h2>
          <PlanChooser
            plans={offered}
            currentPlanId={current?.id ?? null}
            busyPlanId={busy && offered.some((p) => p.id === busy) ? busy : null}
            actionLabel={subscription ? 'Switch to this plan' : 'Subscribe'}
            onChoose={choose}
            freeTo="/platform"
            requestTo="/platform/support"
            freeNote={
              subscription?.cancel_at_period_end
                ? `Starts on ${day(subscription.ends_at ?? subscription.current_period_end)}`
                : subscription
                  ? 'Cancel your plan to go back'
                  : 'Your plan when this one ends'
            }
          />
        </section>
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === 'switch' ? `Switch to ${confirm.plan.name}?` : 'Cancel your plan?'}
        description={
          confirm?.kind === 'switch'
            ? 'Your plan changes now. The price difference is adjusted on your next bill.'
            : 'You won’t be charged again. Workspaces and bundles you bought stay yours.'
        }
        confirmLabel={confirm?.kind === 'switch' ? 'Switch plan' : 'Cancel plan'}
        tone={confirm?.kind === 'switch' ? undefined : 'danger'}
        busy={busy !== null}
        onConfirm={() => {
          if (!confirm) return
          if (confirm.kind === 'switch') {
            const { plan, interval } = confirm
            void run('switch', async () => {
              await planService.switchPlan(plan.id, interval)
              return `You’re now on ${plan.name}.`
            })
          } else {
            void run('cancel', async () => {
              const r = await planService.cancel()
              return r.endsNow ? 'Your plan was cancelled.' : 'Your plan was cancelled. It stays active until the end of the period you already paid.'
            })
          }
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
