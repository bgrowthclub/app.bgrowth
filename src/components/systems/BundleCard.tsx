import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import BundleCover from './BundleCover'
import { bundlePath } from '../../lib/publishedCatalog'
import { formatCents, savingsPercent, separatePriceCents, toCents } from '../../modules/workspace/lib/bundlePrice'
import type { Product } from '../../modules/commerce/types/product'

interface Props {
  bundle: Product
  items: Product[]
}

// A bundle in the catalog — a sibling of StudioWorkspaceCard (CLAUDE.md §6):
// how many Workspaces it includes, its price against buying them one by one.
export default function BundleCard({ bundle, items }: Props) {
  const priceCents = toCents(bundle.basePrice)
  const separate = separatePriceCents(items.map((i) => ({ priceCents: toCents(i.basePrice) })))
  const saving = savingsPercent(priceCents, separate)

  return (
    <Link
      to={bundlePath(bundle.slug)}
      className="group flex h-full flex-col overflow-hidden rounded-xl3 border border-navy/[0.06] bg-white shadow-softer transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-glow"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <BundleCover
          bundle={bundle}
          items={items}
          className="h-full w-full"
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />
        {saving > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-primary shadow-softer">
            Save {saving}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
          Bundle · {items.length} {items.length === 1 ? 'Workspace' : 'Workspaces'}
        </p>
        <h3 className="mt-2 font-display text-[17px] font-bold leading-snug text-navy line-clamp-2">{bundle.title}</h3>
        <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-navy/50 line-clamp-3">{bundle.description}</p>

        <div className="mt-5 flex items-center justify-between border-t border-navy/[0.06] pt-4">
          <span className="flex items-baseline gap-2">
            <span className="font-display text-[16px] font-bold text-navy">{priceCents === 0 ? 'Free' : formatCents(priceCents)}</span>
            {saving > 0 && <span className="text-[13px] text-navy/35 line-through">{formatCents(separate)}</span>}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary">
            View Bundle
            <ArrowUpRight
              size={15}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
  )
}
