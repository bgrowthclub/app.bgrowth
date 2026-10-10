import { Link } from 'react-router-dom'
import { ArrowRight, Package } from 'lucide-react'
import { bundlePath } from '../../lib/publishedCatalog'
import { formatCents, savingsPercent, separatePriceCents, toCents } from '../../modules/workspace/lib/bundlePrice'
import type { Product } from '../../modules/commerce/types/product'

interface Props {
  bundle: Product
  items: Product[]
  className?: string
}

// On a Workspace's page: "this one also comes in a bundle" with the deal.
export default function BundleOfferNote({ bundle, items, className = '' }: Props) {
  const priceCents = toCents(bundle.basePrice)
  const saving = savingsPercent(priceCents, separatePriceCents(items.map((i) => ({ priceCents: toCents(i.basePrice) }))))

  return (
    <Link
      to={bundlePath(bundle.slug)}
      className={`group flex items-center gap-3 rounded-xl border border-primary/15 bg-bg-soft px-4 py-3 transition-colors hover:border-primary/30 ${className}`}
    >
      <Package size={18} className="shrink-0 text-primary" />
      <span className="min-w-0 flex-1 text-[13px] leading-snug text-navy/70">
        Also in the <strong className="text-navy">{bundle.title}</strong> bundle — {items.length} Workspaces for{' '}
        {priceCents === 0 ? 'free' : formatCents(priceCents)}
        {saving > 0 && <span className="font-semibold text-primary"> (save {saving}%)</span>}
      </span>
      <ArrowRight size={15} className="shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
