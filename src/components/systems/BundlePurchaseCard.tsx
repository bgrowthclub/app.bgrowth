import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Gift, Loader2 } from 'lucide-react'
import Button from '../ui/Button'
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
    <div className={`rounded-[28px] border border-navy/[0.06] bg-white p-6 shadow-glow sm:p-7 ${className}`}>
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
          <span className="grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-primary">
            <Gift size={24} aria-hidden />
          </span>
          <p className="mt-4 font-display text-[40px] font-bold leading-none text-navy">
            {free ? 'Free' : formatCents(partial ? amountDueCents : priceCents)}
            {!free && <span className="ml-2 text-[13px] font-medium text-navy/40">one-time</span>}
          </p>
          <ul className="mt-5 space-y-2.5">
            <li className="flex items-center gap-2.5 text-[14px] text-navy/75">
              <CheckCircle2 size={17} className="shrink-0 text-primary" aria-hidden /> Includes {workspaceCount}{' '}
              {workspaceCount === 1 ? 'product' : 'products'}
            </li>
            {!partial && savingPercent > 0 && (
              <li className="flex items-center gap-2.5 text-[14px] text-navy/75">
                <CheckCircle2 size={17} className="shrink-0 text-primary" aria-hidden /> Save {savingPercent}%
              </li>
            )}
            <li className="flex items-center gap-2.5 text-[14px] text-navy/75">
              <CheckCircle2 size={17} className="shrink-0 text-primary" aria-hidden /> Each one opens in My Workspaces
            </li>
          </ul>
          {partial ? (
            <p className="mt-5 border-t border-navy/[0.07] pt-4 text-[13px] leading-relaxed text-navy/60">
              You already own {ownedCount} of the {workspaceCount}, so you pay only for the rest
              {!free && <> (full bundle {formatCents(priceCents)})</>}.
            </p>
          ) : (
            separateCents > priceCents && (
              <dl className="mt-5 space-y-1.5 border-t border-navy/[0.07] pt-4 text-[14px]">
                <div className="flex items-center justify-between">
                  <dt className="text-navy/55">Bought one by one</dt>
                  <dd className="text-navy/40 line-through">{formatCents(separateCents)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-semibold text-primary">Bundle price</dt>
                  <dd className="font-display text-[22px] font-bold text-primary">{free ? '$0' : formatCents(priceCents)}</dd>
                </div>
              </dl>
            )
          )}

          {!signedIn ? (
            <>
              <Button to={signInTo} icon={<ArrowRight size={16} />} className="mt-5 w-full">
                {free ? 'Get the bundle free' : 'Sign in to buy'}
              </Button>
              <p className="mt-3 text-center text-[12px] text-navy/45">
                {free ? 'No credit card required. ' : ''}New here? Create your free account in less than a minute.
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
