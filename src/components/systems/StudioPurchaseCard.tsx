import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Download, Loader2, MonitorSmartphone, Save, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Button from '../ui/Button'
import type { Product } from '../../modules/commerce/types/product'
import { studioProductNoun } from '../../modules/workspace/lib/productNoun'

interface Props {
  product: Product
  // 'loading' while ownership is checked; 'owned' when the member can open it.
  status: 'loading' | 'owned' | 'available'
  signedIn: boolean
  trialDays?: number | null
  canStartTrial: boolean
  trialActive: boolean
  busy: 'buy' | 'trial' | null
  confirming: boolean
  error?: string
  openTo: string
  signInTo: string
  onBuy: (useCoupon?: boolean) => void
  onStartTrial: () => void
  // What this member actually pays, from the plan × product table
  // (02/11/2026, Portal migration 0075): a % off or a fixed price, applied
  // at checkout. `note` says where it came from, so a lower price never
  // looks like a glitch.
  planPrice?: { dollars: number; note: string } | null
  // The lowest plan that includes it (Sprint 126): "Included in Pro and above".
  includedInPlan?: string | null
  className?: string
}

// Three short facts shown as icons above the price (16/11/2026, the owner's
// design) — true of every product of that type; nothing is promised that the
// product doesn't do.
type Fact = { icon: LucideIcon; text: string }
const FACTS: Record<string, Fact[]> = {
  Workspace: [
    { icon: Zap, text: 'Ready to use' },
    { icon: Save, text: 'Saves your progress' },
    { icon: MonitorSmartphone, text: 'Phone & computer' },
  ],
  Calculator: [
    { icon: Zap, text: 'Results as you type' },
    { icon: Save, text: 'Saves your calculations' },
    { icon: MonitorSmartphone, text: 'Phone & computer' },
  ],
  Course: [
    { icon: Zap, text: 'At your own pace' },
    { icon: Save, text: 'Progress saved' },
    { icon: MonitorSmartphone, text: 'Phone & computer' },
  ],
  Download: [
    { icon: Download, text: 'Instant download' },
    { icon: Save, text: 'Yours to keep' },
    { icon: MonitorSmartphone, text: 'Print-ready PDF' },
  ],
}

function money(value: number) {
  return `$${Number.isInteger(value) ? value : value.toFixed(2)}`
}

function priceLabel(product: Product, percent = 0) {
  if (!percent) return money(product.basePrice)
  return money(Math.max(0.5, Math.round(product.basePrice * (100 - percent)) / 100))
}

// The buy box for a Workspace published from BGrowth Studio — a sibling of
// PurchaseCard (CLAUDE.md §6). Presentational: the page (through
// useStudioPurchase) decides what the member has and wires the actions —
// buy / claim free (secure Stripe checkout), start the one free trial, or
// open what they already own.
export default function StudioPurchaseCard({
  product,
  status,
  signedIn,
  trialDays,
  canStartTrial,
  trialActive,
  busy,
  confirming,
  error,
  openTo,
  signInTo,
  onBuy,
  onStartTrial,
  planPrice = null,
  includedInPlan = null,
  className = '',
}: Props) {
  const free = product.basePrice === 0
  // Never show a "discount" that isn't one.
  const member = !free && planPrice && planPrice.dollars < product.basePrice ? planPrice : null
  const memberLabel = member ? money(Math.max(0.5, member.dollars)) : null
  // The member asked to use a coupon instead of their plan's price
  // (02/11/2026). They never stack — Stripe takes either an amount we set
  // or its own coupon field — so this picks which checkout we open. Only
  // ever shown to someone who actually has a plan price to give up.
  const [couponPath, setCouponPath] = useState(false)
  const showCouponPath = Boolean(member) && couponPath
  const noun = studioProductNoun(product)
  const facts = FACTS[product.type] ?? FACTS.Workspace
  const priceText = free ? 'Free' : showCouponPath ? priceLabel(product) : memberLabel ?? priceLabel(product)

  return (
    <div className={className}>
      <ul className="mb-5 grid grid-cols-3 divide-x divide-navy/[0.08]">
        {facts.map(({ icon: Icon, text }) => (
          <li key={text} className="flex flex-col items-center gap-1.5 px-2 text-center text-[13px] font-medium leading-snug text-navy/75">
            <Icon size={20} className="text-primary" aria-hidden />
            {text}
          </li>
        ))}
      </ul>
      {confirming ? (
        <div className="flex items-start gap-3 rounded-xl bg-bg-soft p-4">
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
          <p className="text-[13px] leading-relaxed text-navy/70">
            Payment received — unlocking your {noun}. This usually takes a few seconds.
          </p>
        </div>
      ) : status === 'owned' ? (
        <>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[20px] font-bold text-navy">{free ? 'Free' : priceLabel(product)}</span>
            <span className="text-[13px] font-semibold text-primary">{trialActive ? 'Your free trial is active' : `You own this ${noun}`}</span>
          </div>
          <Button to={openTo} icon={<ArrowRight size={16} />} className="mt-4 w-full">
            Open {noun}
          </Button>
          {trialActive && !free && (
            <Button type="button" variant="secondary" onClick={() => onBuy()} disabled={busy !== null} className="mt-3 w-full">
              {busy === 'buy' ? 'Opening checkout…' : `Buy Now — ${memberLabel ?? priceLabel(product)}`}
            </Button>
          )}
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            {member && !showCouponPath && <span className="text-[15px] font-semibold text-navy/35 line-through">{priceLabel(product)}</span>}
            <span className="text-[20px] font-bold text-navy">{priceText}</span>
            {!free && <span className="text-[13px] text-navy/40">one-time</span>}
          </div>
          {!free && includedInPlan && (
            <p className="mt-1 text-[12.5px] text-navy/55">
              Included in the {includedInPlan} plan and above ·{' '}
              <Link to="/platform/membership" className="font-semibold text-primary hover:underline">
                See plans
              </Link>
            </p>
          )}
          {member && !showCouponPath && <p className="mt-1 text-[12.5px] font-semibold text-primary">{member.note}</p>}
          {showCouponPath && member && (
            <p className="mt-1 text-[12.5px] leading-relaxed text-navy/60">
              You’ll type the coupon on the next screen. With a coupon, the {member.note.toLowerCase()} doesn’t apply — it’s one or the
              other.
            </p>
          )}

          {!signedIn ? (
            <>
              <Button to={signInTo} icon={<ArrowRight size={16} />} className="mt-5 w-full">
                {free ? 'Sign In to Get It Free' : 'Sign In to Buy'}
              </Button>
              <p className="mt-3 text-center text-[12px] text-navy/45">
                New here? Create your free account in less than a minute.
              </p>
            </>
          ) : (
            <>
              <Button
                type="button"
                onClick={() => onBuy(showCouponPath)}
                disabled={status === 'loading' || busy !== null}
                icon={<ArrowRight size={16} />}
                className="mt-5 w-full"
              >
                {busy === 'buy'
                  ? free
                    ? 'Adding…'
                    : 'Opening checkout…'
                  : free
                    ? 'Get It Free'
                    : showCouponPath
                      ? 'Continue with a coupon'
                      : member
                        ? `Buy — ${memberLabel}`
                        : `Buy ${noun}`}
              </Button>
              {member && (
                <p className="mt-3 text-center">
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => setCouponPath((v) => !v)}
                    className="text-[13px] font-semibold text-primary hover:underline disabled:opacity-40"
                  >
                    {showCouponPath ? `Go back and use ${member.note.toLowerCase()}` : 'I have a coupon'}
                  </button>
                </p>
              )}
              {canStartTrial && trialDays && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onStartTrial}
                  disabled={busy !== null}
                  className="mt-3 w-full"
                >
                  {busy === 'trial' ? 'Starting trial…' : `Start ${trialDays}-Day Free Trial`}
                </Button>
              )}
              {!free && (
                <p className="mt-3 text-center text-[12px] text-navy/45">
                  Secure checkout by Stripe. Instant access.{' '}
                  {/* No refunds — all sales final (decided 18/10/2026). */}
                  Digital product —{' '}
                  <Link to="/refund-policy" className="underline hover:text-navy">
                    all sales are final
                  </Link>
                  .
                </p>
              )}
            </>
          )}
        </>
      )}

      {error && <p className="mt-3 text-center text-[13px] text-red-500">{error}</p>}

    </div>
  )
}
