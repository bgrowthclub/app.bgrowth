import { Link } from 'react-router-dom'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import Button from '../ui/Button'
import { REFUND_WINDOW_DAYS } from '../../data/legal'
import { formatCents } from '../../modules/workspace/lib/bundlePrice'

interface Props {
  priceCents: number
  // The Workspaces' separate prices added up (0 hides the comparison).
  separateCents: number
  savingPercent: number
  workspaceCount: number
  // 'loading' while ownership is checked.
  status: 'loading' | 'ready'
  signedIn: boolean
  ownedCount: number
  amountDueCents: number
  ownsAll: boolean
  busy: boolean
  confirming: boolean
  error?: string
  myWorkspacesTo: string
  signInTo: string
  onBuy: () => void
  className?: string
}

const QUICK_SUMMARY = [
  'Every Workspace™ in the bundle, yours to keep',
  'Each one also appears on its own in My Workspaces',
  'Save as many records as you need',
  'Print or download as PDF',
]

// The buy box for a bundle — a sibling of StudioPurchaseCard (CLAUDE.md §6).
// Presentational: the page (through useBundlePurchase) works out what the
// member already owns and what they'd pay, and wires the action.
export default function BundlePurchaseCard({
  priceCents,
  separateCents,
  savingPercent,
  workspaceCount,
  status,
  signedIn,
  ownedCount,
  amountDueCents,
  ownsAll,
  busy,
  confirming,
  error,
  myWorkspacesTo,
  signInTo,
  onBuy,
  className = '',
}: Props) {
  const free = priceCents === 0
  const partial = signedIn && ownedCount > 0 && !ownsAll
  const nothingToPay = amountDueCents === 0

  return (
    <div className={`rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-glow ${className}`}>
      {confirming ? (
        <div className="flex items-start gap-3 rounded-xl bg-bg-soft p-4">
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
          <p className="text-[13px] leading-relaxed text-navy/70">
            Payment received — unlocking your Workspaces. This usually takes a few seconds.
          </p>
        </div>
      ) : ownsAll ? (
        <>
          <p className="text-[13px] font-semibold text-primary">You own every Workspace in this bundle</p>
          <Button to={myWorkspacesTo} icon={<ArrowRight size={16} />} className="mt-4 w-full">
            Open My Workspaces
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-navy">
              {free ? 'Free' : formatCents(partial ? amountDueCents : priceCents)}
            </span>
            {!free && !partial && separateCents > priceCents && (
              <span className="text-[15px] text-navy/35 line-through">{formatCents(separateCents)}</span>
            )}
            {!free && <span className="text-[13px] text-navy/40">one-time</span>}
          </div>
          {partial ? (
            <p className="mt-2 text-[13px] leading-relaxed text-navy/60">
              You already own {ownedCount} of the {workspaceCount} Workspaces, so you pay only for the rest
              {!free && <> (full bundle {formatCents(priceCents)})</>}.
            </p>
          ) : (
            savingPercent > 0 && (
              <p className="mt-2 text-[13px] font-semibold text-primary">
                {workspaceCount} Workspaces — save {savingPercent}% versus buying them one by one
              </p>
            )
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
                disabled={status === 'loading' || busy}
                icon={<ArrowRight size={16} />}
                className="mt-5 w-full"
              >
                {busy ? (nothingToPay ? 'Adding…' : 'Opening checkout…') : nothingToPay ? 'Get It Free' : partial ? 'Complete the Bundle' : 'Buy Bundle'}
              </Button>
              {!nothingToPay && (
                <p className="mt-3 text-center text-[12px] text-navy/45">
                  Secure checkout by Stripe. Instant access.{' '}
                  <Link to="/refund-policy" className="underline hover:text-navy">
                    {REFUND_WINDOW_DAYS}-day refund
                  </Link>
                </p>
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
