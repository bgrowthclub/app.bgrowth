import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { ICONS_BY_CATEGORY } from './categoryIcons'
import type { Product } from '../../modules/commerce/types/product'

interface Props {
  product: Product
}

function formatPrice(product: Product) {
  if (product.basePrice === 0) return 'Free'
  const amount = Number.isInteger(product.basePrice) ? product.basePrice : product.basePrice.toFixed(2)
  return `$${amount}`
}

// A Workspace published from BGrowth Studio, as a catalog card — a sibling
// of WorkspaceCoverCard/BusinessSystemCard (CLAUDE.md §6), not a variant:
// it's built from Commerce's Product and leads with Studio's real cover
// image, showing only what Studio published (no invented difficulty or
// module list). Falls back to the category icon when there's no cover.
export default function StudioWorkspaceCard({ product }: Props) {
  const Icon = ICONS_BY_CATEGORY[product.industry ?? ''] ?? ICONS_BY_CATEGORY.Default
  const cover = product.assets.thumbnail

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl3 border border-navy/[0.06] bg-white shadow-softer transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-glow"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-bg-soft">
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-grad-primary text-white">
            <Icon size={40} strokeWidth={1.6} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        {product.industry && (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">{product.industry}</p>
        )}
        <h3 className="mt-2 font-display text-[17px] font-bold leading-snug text-navy line-clamp-2">{product.title}</h3>
        <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-navy/50 line-clamp-3">{product.description}</p>

        <div className="mt-5 flex items-center justify-between border-t border-navy/[0.06] pt-4">
          <span className="font-display text-[16px] font-bold text-navy">{formatPrice(product)}</span>
          <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary">
            View Workspace
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
