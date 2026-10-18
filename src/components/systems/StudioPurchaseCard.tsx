import { Link } from 'react-router-dom'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
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
  onBuy: () => void
  onStartTrial: () => void
  // The member's plan takes a % off (Sprint 125) — applied at checkout.
  planDiscount?: { percent: number; planName: string } | null
  // The lowest plan that includes it (Sprint 126): "Included in Pro and above".
  includedInPlan?: string | null
  className?: string
}

const QUICK_SUMMARY = [
  'Interactive Workspace™ you fill in online',
  'Save as many records as you need',
  'Print or download as PDF',
  'Works on desktop, tablet and mobile',
]

// A Studio calculator (Sprint 78) is sold the same way.
const CALCULATOR_SUMMARY = [
  'Interactive Calculator™ — results update as you type',
  'Save as many calculations as you need',
  'Print or download as PDF',
  'Works on desktop, tablet and mobile',
]

// A Download (Sprint 86): files the member keeps.
const DOWNLOAD_SUMMARY = [
  'Download your files right after purchase',
  'Yours to keep — download again any time from My Workspaces',
  'Print-ready PDF',
  'Instructions included when there are Canva links',
]

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
  planDiscount = null,
  includedInPlan = null,
  className = '',
}: Props) {
  const free = product.basePrice === 0
  const pct = !free && planDiscount ? planDiscount.percent : 0
  const noun = studioProductNoun(product)
  const summary = product.type === 'Calculator' ? CALCULATOR_SUMMARY : product.type === 'Download' ? DOWNLOAD_SUMMARY : QUICK_SUMMARY

  return (
    <div className={`rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-glow ${className}`}>
      {confirming ? (
        <div className="flex items-start gap-3 rounded-xl bg-bg-soft p-4">
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
          <p className="text-[13px] leading-relaxed text-navy/70">
            Payment received — unlocking your {noun}. This usually takes a few seconds.
          </p>
        </div>
      ) : status === 'owned' ? (
        <>
          <p className="text-[13px] font-semibold text-primary">
            {trialActive ? 'Your free trial is active' : `You own this ${noun}`}
          </p>
          <Button to={openTo} icon={<ArrowRight size={16} />} className="mt-4 w-full">
            Open {noun}
          </Button>
          {trialActive && !free && (
            <Button type="button" variant="secondary" onClick={onBuy} disabled={busy !== null} className="mt-3 w-full">
              {busy === 'buy' ? 'Opening checkout…' : `Buy Now — ${priceLabel(product, pct)}`}
            </Button>
          )}
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            {pct > 0 && <span className="text-lg font-semibold text-navy/35 line-through">{priceLabel(product)}</span>}
            <span className="font-display text-3xl font-bold text-navy">{free ? 'Free' : priceLabel(product, pct)}</span>
            {!free && <span className="text-[13px] text-navy/40">one-time</span>}
          </div>
          {!free && includedInPlan && (
            <p className="mt-1 text-[12.5px] text-navy/55">
              Included in the {includedInPlan} plan and above ·{' '}
              <Link to="/pricing" className="font-semibold text-primary hover:underline">
                See plans
              </Link>
            </p>
          )}
          {pct > 0 && planDiscount && (
            <p className="mt-1 text-[12.5px] font-semibold text-primary">
              {planDiscount.percent}% off with your {planDiscount.planName} plan
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
                onClick={onBuy}
                disabled={status === 'loading' || busy !== null}
                icon={<ArrowRight size={16} />}
                className="mt-5 w-full"
              >
                {busy === 'buy' ? (free ? 'Adding…' : 'Opening checkout…') : free ? 'Get It Free' : `Buy ${noun}`}
              </Button>
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

      <ul className="mt-6 space-y-2.5">
        {summary.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-[13px] text-navy/60">
            <Check size={14} className="shrink-0 text-primary" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
