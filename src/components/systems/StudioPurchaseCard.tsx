import { ArrowRight, Check, Loader2 } from 'lucide-react'
import Button from '../ui/Button'
import type { Product } from '../../modules/commerce/types/product'

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
  className?: string
}

const QUICK_SUMMARY = [
  'Interactive Workspace™ you fill in online',
  'Save as many records as you need',
  'Print or download as PDF',
  'Works on desktop, tablet and mobile',
]

function priceLabel(product: Product) {
  const amount = Number.isInteger(product.basePrice) ? product.basePrice : product.basePrice.toFixed(2)
  return `$${amount}`
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
  className = '',
}: Props) {
  const free = product.basePrice === 0

  return (
    <div className={`rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-glow ${className}`}>
      {confirming ? (
        <div className="flex items-start gap-3 rounded-xl bg-bg-soft p-4">
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
          <p className="text-[13px] leading-relaxed text-navy/70">
            Payment received — unlocking your Workspace. This usually takes a few seconds.
          </p>
        </div>
      ) : status === 'owned' ? (
        <>
          <p className="text-[13px] font-semibold text-primary">
            {trialActive ? 'Your free trial is active' : 'You own this Workspace'}
          </p>
          <Button to={openTo} icon={<ArrowRight size={16} />} className="mt-4 w-full">
            Open Workspace
          </Button>
          {trialActive && !free && (
            <Button type="button" variant="secondary" onClick={onBuy} disabled={busy !== null} className="mt-3 w-full">
              {busy === 'buy' ? 'Opening checkout…' : `Buy Now — ${priceLabel(product)}`}
            </Button>
          )}
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-navy">{free ? 'Free' : priceLabel(product)}</span>
            {!free && <span className="text-[13px] text-navy/40">one-time</span>}
          </div>

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
                {busy === 'buy' ? (free ? 'Adding…' : 'Opening checkout…') : free ? 'Get It Free' : 'Buy Workspace'}
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
                <p className="mt-3 text-center text-[12px] text-navy/45">Secure checkout by Stripe. Instant access.</p>
              )}
            </>
          )}
        </>
      )}

      {error && <p className="mt-3 text-center text-[13px] text-red-500">{error}</p>}

      <ul className="mt-6 space-y-2.5">
        {QUICK_SUMMARY.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-[13px] text-navy/60">
            <Check size={14} className="shrink-0 text-primary" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
