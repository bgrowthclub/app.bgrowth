import { Link } from 'react-router-dom'
import { ArrowRight, Star } from 'lucide-react'
import { ICONS_BY_CATEGORY } from './categoryIcons'
import { PRODUCT_FACTS } from './productFacts'
import type { Product } from '../../modules/commerce/types/product'
import { useReviewSummaries } from '../../modules/workspace/hooks/useReviewSummaries'
import { studioPortalId } from '../../modules/commerce/store/studioProductRepository'
import { studioProductNoun } from '../../modules/workspace/lib/productNoun'

// The catalog's card (19/11/2026, the owner's design): a dark top with the
// cover behind, the kind as a colored tag and the price (or "Free") on it,
// the category and the name; then the description, two facts true of every
// product of that kind (PRODUCT_FACTS — the same the product page shows),
// the real rating when there are reviews, and Price + "View …" in the kind's
// color. A sibling of StudioWorkspaceCard, which other pages keep.
const KIND_LOOK: Record<string, { tag: string; button: string; label: string }> = {
  Workspace: { tag: 'bg-primary', button: 'bg-primary hover:bg-primary/90', label: 'Workspace' },
  Course: { tag: 'bg-violet-600', button: 'bg-violet-600 hover:bg-violet-700', label: 'Course' },
  Calculator: { tag: 'bg-emerald-600', button: 'bg-emerald-600 hover:bg-emerald-700', label: 'Calculator' },
  Download: { tag: 'bg-rose-600', button: 'bg-rose-600 hover:bg-rose-700', label: 'Download' },
}

function money(value: number) {
  return `$${Number.isInteger(value) ? value : value.toFixed(2)}`
}

export default function CatalogProductCard({ product }: { product: Product }) {
  const Icon = ICONS_BY_CATEGORY[product.industry ?? ''] ?? ICONS_BY_CATEGORY.Default
  const noun = studioProductNoun(product)
  const kind = noun === 'PDF' || noun === 'Kit' ? 'Download' : noun
  const look = KIND_LOOK[kind] ?? KIND_LOOK.Workspace
  const facts = (PRODUCT_FACTS[kind] ?? PRODUCT_FACTS.Workspace).slice(0, 2)
  const rating = useReviewSummaries()[studioPortalId(product.id) ?? '']
  const free = product.basePrice === 0
  const cover = product.assets.thumbnail

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-navy/[0.07] bg-white shadow-softer transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
    >
      <div className="relative h-44 overflow-hidden bg-navy p-4 text-white">
        {cover ? (
          <img src={cover} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-45 transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <Icon size={96} className="absolute -bottom-5 -right-3 text-white/[0.07]" aria-hidden />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/55 to-transparent" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${look.tag}`}>{noun}</span>
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${free ? 'bg-emerald-500 text-white' : 'bg-white text-navy'}`}>
              {free ? 'Free' : money(product.basePrice)}
            </span>
          </div>
          <div>
            {product.industry && <p className="text-[11px] font-bold uppercase tracking-wide text-sky-300">{product.industry}</p>}
            <h3 className="line-clamp-2 font-display text-[17px] font-bold leading-snug">{product.title}</h3>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-2 text-[13.5px] leading-relaxed text-navy/55">{product.description}</p>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-navy/[0.06] pt-4">
          {facts.map((f) => (
            <span key={f.text} className="inline-flex items-center gap-1.5 rounded-md border border-navy/[0.08] bg-bg-soft px-2 py-1 text-[12px] font-medium text-navy/65">
              <f.icon size={13} aria-hidden /> {f.text}
            </span>
          ))}
          {rating && rating.reviewCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[12px] font-semibold text-amber-700">
              <Star size={12} className="fill-amber-400 text-amber-400" aria-hidden /> {rating.averageRating.toFixed(1)} ({rating.reviewCount})
            </span>
          )}
        </div>
      </div>
      <div className="mt-auto flex items-end justify-between border-t border-navy/[0.06] px-5 py-4">
        <span>
          <span className="block text-[11.5px] text-navy/45">Price</span>
          <span className={`font-display text-[18px] font-bold ${free ? 'text-emerald-600' : 'text-navy'}`}>{free ? 'Free' : money(product.basePrice)}</span>
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors ${look.button}`}>
          View {look.label} <ArrowRight size={15} aria-hidden />
        </span>
      </div>
    </Link>
  )
}
