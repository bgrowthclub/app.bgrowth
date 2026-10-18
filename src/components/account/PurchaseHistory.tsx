import { Link } from 'react-router-dom'
import { Receipt, KeyRound } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import { workspaceViewerPath } from '../../modules/workspace/config'
import type { AccountAccess, AccountOrder, AccountPurchases } from '../../modules/account/types'

const CARD = 'rounded-xl3 border border-navy/[0.06] bg-white shadow-softer'
const PILL = 'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold'
const TONE = {
  green: 'bg-emerald-50 text-emerald-700',
  gray: 'bg-navy/[0.05] text-navy/50',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-600',
}

function day(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100)
}

const ORDER_STATUS: Record<AccountOrder['status'], { label: string; tone: keyof typeof TONE }> = {
  paid: { label: 'Paid', tone: 'green' },
  pending: { label: 'Pending', tone: 'amber' },
  refunded: { label: 'Refunded', tone: 'gray' },
  partly_refunded: { label: 'Partly refunded', tone: 'gray' },
}

const ACCESS_STATUS: Record<AccountAccess['status'], { label: string; tone: keyof typeof TONE }> = {
  active: { label: 'Active', tone: 'green' },
  expired: { label: 'Expired', tone: 'gray' },
  cancelled: { label: 'Cancelled', tone: 'red' },
}

const GROUPS: { kind: AccountAccess['kind'][]; title: string }[] = [
  { kind: ['purchase'], title: 'Purchased' },
  { kind: ['free'], title: 'Free products' },
  { kind: ['trial'], title: 'Free trials' },
  { kind: ['team'], title: 'Given by the BGrowth team' },
  { kind: ['other'], title: 'Other access' },
]

function productPath(slug: string | null, bundle: boolean) {
  if (!slug) return null
  return bundle ? `/bundle/${slug}` : `/product/${slug}`
}

// Account → Purchases: the member's paid orders (from Stripe, with the
// receipt when there is one) and every access on the account, grouped by
// where it came from.
export default function PurchaseHistory({ data }: { data: AccountPurchases }) {
  const { orders, accesses, ordersAvailable } = data
  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-navy">Orders</h2>
        {!ordersAvailable ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-700">
            We couldn’t load your orders right now. Your access below is up to date — please try again later.
          </p>
        ) : orders.length === 0 ? (
          <EmptyState icon={Receipt} title="No paid orders yet." description="Products you buy show here with their receipt." />
        ) : (
          <ul className={`${CARD} divide-y divide-navy/[0.06]`}>
            {orders.map((o) => {
              const st = ORDER_STATUS[o.status]
              const path = productPath(o.productSlug, o.isBundle)
              return (
                <li key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-[200px] flex-1">
                    <p className="text-[14px] font-semibold text-navy">
                      {path ? (
                        <Link to={path} className="hover:text-primary">
                          {o.productName ?? 'Product'}
                        </Link>
                      ) : (
                        o.productName ?? 'Product'
                      )}
                      {o.isBundle && <span className="ml-2 text-[12px] font-normal text-navy/45">Bundle</span>}
                    </p>
                    <p className="text-[12.5px] text-navy/45">{day(o.createdAt)}</p>
                  </div>
                  <span className="text-[14px] font-semibold tabular-nums text-navy">{money(o.amount, o.currency)}</span>
                  <span className={`${PILL} ${TONE[st.tone]}`}>{st.label}</span>
                  {o.receiptUrl ? (
                    <a href={o.receiptUrl} target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-primary hover:underline">
                      Receipt
                    </a>
                  ) : (
                    <span className="text-[12.5px] text-navy/35">No receipt</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-1 font-display text-lg font-bold text-navy">Your access</h2>
        <p className="mb-4 text-[13px] text-navy/50">Everything on your account and where it came from.</p>
        {accesses.length === 0 ? (
          <EmptyState icon={KeyRound} title="Nothing on your account yet." description="Free products, trials and purchases show here." />
        ) : (
          <div className="space-y-6">
            {GROUPS.map((g) => {
              const list = accesses.filter((a) => g.kind.includes(a.kind))
              if (!list.length) return null
              return (
                <div key={g.title}>
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-navy/40">{g.title}</p>
                  <ul className={`${CARD} divide-y divide-navy/[0.06]`}>
                    {list.map((a) => {
                      const st = ACCESS_STATUS[a.status]
                      return (
                        <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                          <div className="min-w-[200px] flex-1">
                            <p className="text-[14px] font-semibold text-navy">{a.productName}</p>
                            <p className="text-[12.5px] text-navy/45">
                              {a.origin} · since {day(a.startedAt)}
                              {a.endsAt ? ` · ${a.status === 'active' ? 'until' : 'ended'} ${day(a.endsAt)}` : a.status === 'active' ? ' · no end date' : ''}
                            </p>
                          </div>
                          <span className={`${PILL} ${TONE[st.tone]}`}>{st.label}</span>
                          {a.status === 'active' && a.productSlug && (
                            <Link to={workspaceViewerPath(a.productSlug)} className="text-[13px] font-semibold text-primary hover:underline">
                              Open
                            </Link>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
