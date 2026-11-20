import { useEffect, useState } from 'react'
import { KeyRound, Receipt } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import EmptyState from '../../components/ui/EmptyState'
import PurchaseHistory from '../../components/account/PurchaseHistory'
import { accountService } from '../../modules/account/accountService'
import type { AccountPurchases } from '../../modules/account/types'

// Account → Purchases & Access (Sprint 119; new look 19/11/2026): orders from
// the Website and the Portal, the plan's payments, and every access on the
// account, with where it came from.
export default function PurchasesPage() {
  const [data, setData] = useState<AccountPurchases | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    accountService
      .getPurchases()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load your purchases.'))
  }, [])

  return (
    <div className="mx-auto max-w-4xl">
      <SEO title="Purchases & Access" description="Your orders and access on BGrowth." path="/platform/purchases" />
      {/* Top (19/11/2026, the owner's design): the two numbers are counted. */}
      <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-navy/40">
            <span className="text-primary">Account</span> / Purchases &amp; Access
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">Purchases &amp; Access</h1>
          <p className="mt-2 text-[15px] text-navy/55">Your orders, receipts and everything you have access to.</p>
        </div>
        {data && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-navy/[0.07] bg-white px-4 py-3 shadow-softer">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-primary">
                <Receipt size={17} aria-hidden />
              </span>
              <span>
                <span className="block text-[11.5px] text-navy/45">Orders</span>
                <span className="block text-[14px] font-bold text-navy">
                  {data.orders.filter((o) => o.status === 'paid' || o.status === 'partly_refunded').length} paid
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-navy/[0.07] bg-white px-4 py-3 shadow-softer">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <KeyRound size={17} aria-hidden />
              </span>
              <span>
                <span className="block text-[11.5px] text-navy/45">Access</span>
                <span className="block text-[14px] font-bold text-emerald-700">{data.accesses.filter((a) => a.status === 'active').length} active</span>
              </span>
            </div>
          </div>
        )}
      </div>
      {data ? (
        <PurchaseHistory data={data} />
      ) : error ? (
        <EmptyState icon={Receipt} title="We couldn’t load your purchases." description={error} />
      ) : (
        <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
      )}
    </div>
  )
}
