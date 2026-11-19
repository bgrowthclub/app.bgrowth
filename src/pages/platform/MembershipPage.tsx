import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CalendarDays, CreditCard, Crown, Gift, LifeBuoy, Lock, ReceiptText, Sparkles } from 'lucide-react'
import SEO from '../../components/seo/SEO'
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
  const givenPlan = given ? plans.find((p) => p.id === given.plan_id) : null
  // The next plan up that is on offer — the top card's "Upgrade" button.
  const nextUp = offered
    .filter((p) => !p.is_free && !p.price_on_request && p.rank > (current?.rank ?? -1))
    .sort((a, b) => a.rank - b.rank)[0]
  const priority = Boolean(current?.entitlements?.prioritySupport)
  const tile = 'flex items-center gap-3 rounded-2xl border border-navy/[0.07] bg-white px-4 py-3.5'

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
    // 19/11/2026, the owner's design: breadcrumb and title, one card with the
    // plan (paid, given by the team, or Free — "the screen without a
    // subscription"), three tiles with what is real (billing, support, the
    // plan itself), the plans, and payment & invoices (kept by Stripe).
    <div className="mx-auto max-w-6xl space-y-10">
      <SEO title="Membership" description="Your BGrowth plan and billing." path="/platform/membership" />
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wide text-navy/45">
          <span className="text-primary">Account</span> / Membership &amp; billing
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">Membership</h1>
        <p className="mt-2 text-[15px] text-navy/55">Your plan, what it includes, and how you pay for it.</p>
      </div>

      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13.5px] text-red-600">{error}</p>}

      <section className="rounded-[24px] border border-primary/10 bg-gradient-to-br from-primary/[0.05] via-white to-white p-6 shadow-softer sm:p-7">
        {loading ? (
          <p className="text-[14px] text-navy/40">Loading…</p>
        ) : (
          <>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white ${subscription || given ? 'bg-gradient-to-br from-primary to-indigo-600' : 'bg-navy/30'}`}>
                {given && !subscription ? <Gift size={22} aria-hidden /> : <Crown size={22} aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-navy/55">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${
                      subscription?.status === 'past_due'
                        ? 'bg-amber-100 text-amber-700'
                        : subscription?.cancel_at_period_end
                          ? 'bg-navy/[0.06] text-navy/60'
                          : subscription || given
                            ? 'bg-primary/10 text-primary'
                            : 'bg-navy/[0.06] text-navy/60'
                    }`}
                  >
                    {subscription?.status === 'past_due'
                      ? 'Payment issue'
                      : subscription?.cancel_at_period_end
                        ? 'Ending'
                        : subscription
                          ? 'Active plan'
                          : given
                            ? 'Given by the BGrowth team'
                            : 'Free account'}
                  </span>
                  {subscription && !subscription.cancel_at_period_end && subscription.current_period_end && subscription.status !== 'past_due' && (
                    <span className="inline-flex items-center gap-1"><CalendarDays size={13} aria-hidden /> Renews on <strong className="text-navy">{day(subscription.current_period_end)}</strong></span>
                  )}
                  {subscription?.cancel_at_period_end && (
                    <span className="inline-flex items-center gap-1"><CalendarDays size={13} aria-hidden /> Ends on <strong className="text-navy">{day(subscription.ends_at ?? subscription.current_period_end)}</strong></span>
                  )}
                  {!subscription && given?.ends_at && (
                    <span className="inline-flex items-center gap-1"><CalendarDays size={13} aria-hidden /> Until <strong className="text-navy">{day(given.ends_at)}</strong></span>
                  )}
                </p>
                <p className="mt-2 font-display text-[26px] font-bold text-navy">
                  {current?.name ?? 'Free'}
                  {subscription?.amount_cents != null && (
                    <span className="ml-2 text-[15px] font-semibold text-navy/45">
                      {formatCents(subscription.amount_cents)} / {subscription.billing_interval === 'year' ? 'year' : 'month'}
                    </span>
                  )}
                </p>
                <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-navy/60">
                  {subscription
                    ? subscription.cancel_at_period_end
                      ? 'You won’t be charged again. Your plan stays active until the date above, then your account goes back to Free.'
                      : `Your plan renews automatically. Everything ${subPlan?.name ?? 'your plan'} includes is open to you.`
                    : given
                      ? `${givenPlan?.name ?? 'This plan'} was given to you by the BGrowth team — nothing to pay.`
                      : 'You’re on the free plan. Compare the plans below to see what each one adds.'}
                </p>
                {subscription?.status === 'past_due' && (
                  <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[13.5px] text-amber-700">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    Your last payment didn’t go through. Update your card to keep your plan
                    {subscription.ends_at ? ` (it stays active until ${day(subscription.ends_at)})` : ''}.
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2.5">
                {subscription && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void openBilling()}
                    className="inline-flex items-center gap-2 rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-[14px] font-semibold text-navy hover:border-primary/25 disabled:opacity-50"
                  >
                    <CreditCard size={15} aria-hidden /> {busy === 'billing' ? 'Opening…' : 'Card & invoices'}
                  </button>
                )}
                {nextUp && (
                  <a href="#plans" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 px-4 py-2.5 text-[14px] font-semibold text-white shadow-softer">
                    <Sparkles size={15} aria-hidden /> {subscription || given ? `Upgrade to ${nextUp.name}` : 'See the plans'}
                  </a>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 border-t border-navy/[0.07] pt-6 sm:grid-cols-3">
              <div className={tile}>
                <ReceiptText size={18} className="shrink-0 text-primary" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-[11.5px] text-navy/45">Billing</span>
                  <span className="block truncate text-[13.5px] font-semibold text-navy">
                    {subscription ? (subscription.billing_interval === 'year' ? 'Yearly' : 'Monthly') : given ? 'Nothing to pay' : 'No subscription'}
                  </span>
                </span>
                <Link to="/platform/purchases" className="ml-auto shrink-0 text-[12.5px] font-semibold text-primary">
                  Purchases
                </Link>
              </div>
              <div className={tile}>
                <LifeBuoy size={18} className="shrink-0 text-emerald-600" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-[11.5px] text-navy/45">Support</span>
                  <span className="block truncate text-[13.5px] font-semibold text-navy">{priority ? 'Priority support' : 'Standard support'}</span>
                </span>
                <Link to="/platform/support" className="ml-auto shrink-0 text-[12.5px] font-semibold text-primary">
                  Open a ticket
                </Link>
              </div>
              <div className={tile}>
                <Crown size={18} className="shrink-0 text-amber-500" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-[11.5px] text-navy/45">Plan</span>
                  <span className="block truncate text-[13.5px] font-semibold text-navy">{current?.name ?? 'Free'}</span>
                </span>
                {subscription &&
                  (subscription.cancel_at_period_end ? (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void run('resume', async () => {
                        await planService.resume()
                        return 'Your plan will keep renewing.'
                      })}
                      className="ml-auto shrink-0 text-[12.5px] font-semibold text-primary hover:underline disabled:opacity-40"
                    >
                      Keep my plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => setConfirm({ kind: 'cancel' })}
                      className="ml-auto shrink-0 text-[12.5px] font-semibold text-navy/45 hover:text-red-500 disabled:opacity-40"
                    >
                      Cancel plan
                    </button>
                  ))}
              </div>
            </div>
          </>
        )}
      </section>

      {offered.some((p) => !p.is_free) && (
        <section id="plans" className="scroll-mt-24">
          <h2 className="font-display text-[22px] font-bold text-navy">{subscription ? 'Change plan' : 'Choose a plan'}</h2>
          <p className="mb-6 mt-1 text-[14px] text-navy/55">Pick what fits where your business is right now.</p>
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

      {subscription && (
        <section className="flex flex-col gap-4 rounded-[22px] border border-navy/[0.07] bg-white p-6 shadow-softer sm:flex-row sm:items-center">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy text-white">
            <CreditCard size={19} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[16px] font-bold text-navy">Payment &amp; invoices</p>
            <p className="mt-0.5 text-[13.5px] text-navy/55">Your card and every invoice are kept by Stripe, our payment provider — change the card or download an invoice there.</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[12px] text-navy/45"><Lock size={12} aria-hidden /> Secure via Stripe</span>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void openBilling()}
              className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50"
            >
              {busy === 'billing' ? 'Opening…' : 'Open billing page'}
            </button>
          </div>
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
