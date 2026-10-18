import { useEffect, useState } from 'react'
import { Receipt } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import SectionHeader from '../../components/ui/SectionHeader'
import EmptyState from '../../components/ui/EmptyState'
import PurchaseHistory from '../../components/account/PurchaseHistory'
import { accountService } from '../../modules/account/accountService'
import type { AccountPurchases } from '../../modules/account/types'

// Account → Purchases (Sprint 119): orders from the Website and the Portal
// and every access on the account, with where it came from.
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
      <SEO title="Purchases" description="Your orders and access on BGrowth." path="/platform/purchases" />
      <SectionHeader eyebrow="Account" title="Purchases" description="Your orders, receipts and everything you have access to." className="mb-8" />
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
