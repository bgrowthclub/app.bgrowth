import { Link } from 'react-router-dom'
import { Clock, Eye, Play } from 'lucide-react'
import DashboardSectionTitle from './DashboardSectionTitle'
import { getProductActionLabel, getProductActionRoute, useOwnedProducts } from '../../lib/productLibrary'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { timeAgo } from '../../lib/timeAgo'

// "Continue your Workspace" (19/11/2026, the owner's design): the product
// opened most recently (else the first one), as one wide card. Progress is
// shown only where it is real (a course's ticked lessons); otherwise the
// card says when it was last opened.
export default function ContinueBuildingSection() {
  const { user } = useIdentity()
  const owned = useOwnedProducts(user).filter((p) => !p.expired)
  const product =
    [...owned].filter((p) => p.lastOpenedAt).sort((a, b) => (b.lastOpenedAt ?? '').localeCompare(a.lastOpenedAt ?? ''))[0] ?? owned[0]
  if (!user || !product) return null
  const percent = product.progress?.percentComplete
  const Icon = product.icon

  return (
    <div>
      <DashboardSectionTitle
        title="Continue your Workspace"
        action={product.lastOpenedAt ? <span className="text-navy/45">Last opened {timeAgo(product.lastOpenedAt)}</span> : undefined}
      />
      <div className="flex flex-col gap-6 rounded-[22px] border border-primary/10 bg-gradient-to-br from-primary/[0.04] to-white p-5 shadow-softer sm:p-6 md:flex-row md:items-center">
        <div className="h-28 w-full shrink-0 overflow-hidden rounded-2xl bg-navy md:w-36">
          {product.coverImage ? (
            <img src={product.coverImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-grad-primary text-white">
              <Icon size={30} aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5 text-[12px]">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary">{product.tag}</span>
            {percent !== undefined ? (
              <span className="inline-flex items-center gap-1 text-navy/50">
                <Clock size={12} aria-hidden /> {percent}% complete
              </span>
            ) : (
              !product.lastOpenedAt && <span className="text-navy/45">Not opened yet</span>
            )}
          </div>
          <h3 className="mt-2 font-display text-[20px] font-bold leading-snug text-navy">{product.title}</h3>
          {product.description && <p className="mt-1.5 line-clamp-2 max-w-2xl text-[14px] leading-relaxed text-navy/55">{product.description}</p>}
          {percent !== undefined && (
            <div className="mt-4 h-1.5 max-w-md overflow-hidden rounded-full bg-navy/[0.07]">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500" style={{ width: `${Math.min(100, percent)}%` }} />
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2.5">
          <Link
            to={`/product/${product.slug}`}
            className="inline-flex items-center gap-2 rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-[14px] font-semibold text-navy transition-colors hover:border-primary/25"
          >
            <Eye size={15} className="text-navy/45" aria-hidden /> View details
          </Link>
          <Link to={getProductActionRoute(product)} className="btn-primary inline-flex items-center gap-2 !px-5 !py-2.5 text-[14px]">
            <Play size={14} aria-hidden /> {getProductActionLabel(product.type)}
          </Link>
        </div>
      </div>
    </div>
  )
}
