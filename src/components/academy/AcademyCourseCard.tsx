import { Link } from 'react-router-dom'
import { ArrowRight, Award, Clock, PlayCircle } from 'lucide-react'
import { ICONS_BY_CATEGORY } from '../systems/categoryIcons'
import { coursePath } from '../../modules/workspace/config'
import { formatMinutes } from '../../modules/academy/types'
import type { CourseOverview } from '../../modules/academy/useAcademyOverview'
import type { Product } from '../../modules/commerce/types/product'
import type { UserProduct } from '../../types/productLibrary'

interface Props {
  product: Product
  /** The member's own copy, when they have it. */
  owned?: UserProduct
  overview?: CourseOverview
}

function money(value: number) {
  return `$${Number.isInteger(value) ? value : value.toFixed(2)}`
}

// One course in the Academy's "All courses" grid (20/11/2026, the owner's
// design): a dark top with the cover, "Course" and — on the right — "Included
// in your plan" when the member's plan opens it, "Yours" when they have it
// another way, else the price; the area and name; the text; the facts we
// know (lessons and time only from a course the member can read, so only
// theirs; every course issues a certificate); and Open / View. A sibling of
// CatalogProductCard, which the catalog keeps.
export default function AcademyCourseCard({ product, owned, overview }: Props) {
  const Icon = ICONS_BY_CATEGORY[product.industry ?? ''] ?? ICONS_BY_CATEGORY.Default
  const cover = product.assets.thumbnail
  const viaPlan = owned?.access.source === 'membership'
  const badge = owned && !owned.expired ? (viaPlan ? 'Included in your plan' : 'Yours') : product.basePrice === 0 ? 'Free' : money(product.basePrice)
  const minutes = overview ? formatMinutes(overview.minutes) : ''

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[22px] border border-navy/[0.07] bg-white shadow-softer">
      <div className="relative h-40 overflow-hidden bg-navy p-4 text-white">
        {cover ? (
          <img src={cover} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        ) : (
          <Icon size={96} className="absolute -bottom-5 -right-3 text-white/[0.07]" aria-hidden />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/55 to-transparent" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="rounded-md bg-violet-600 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide">Course</span>
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                viaPlan || badge === 'Free' ? 'bg-emerald-500 text-white' : badge === 'Yours' ? 'bg-primary text-white' : 'bg-white text-navy'
              }`}
            >
              {badge}
            </span>
          </div>
          <div>
            {product.industry && <p className="text-[11px] font-bold uppercase tracking-wide text-sky-300">{product.industry}</p>}
            <h3 className="line-clamp-2 font-display text-[17px] font-bold leading-snug">{product.title}</h3>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-3 text-[13.5px] leading-relaxed text-navy/60">{product.description}</p>
        <p className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-navy/[0.06] pt-3 text-[12.5px] text-navy/55">
          {overview && overview.lessons > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <PlayCircle size={14} className="text-violet-600" aria-hidden /> {overview.lessons} {overview.lessons === 1 ? 'lesson' : 'lessons'}
            </span>
          )}
          {minutes && (
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} className="text-violet-600" aria-hidden /> {minutes}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Award size={14} className="text-emerald-600" aria-hidden /> Certificate
          </span>
        </p>
        <Link
          to={owned && !owned.expired ? coursePath(product.slug) : `/product/${product.slug}`}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-95"
        >
          {owned && !owned.expired ? (overview?.started ? 'Continue course' : 'Open course') : 'View course'} <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    </article>
  )
}
