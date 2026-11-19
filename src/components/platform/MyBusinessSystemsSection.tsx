import { Link } from 'react-router-dom'
import { ArrowRight, Clock, FolderOpen } from 'lucide-react'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import DashboardSectionTitle from './DashboardSectionTitle'
import { getProductActionLabel, getProductActionRoute, useOwnedProducts } from '../../lib/productLibrary'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { timeAgo } from '../../lib/timeAgo'

// "My Workspaces" on the Dashboard (19/11/2026, the owner's design): up to
// three of the member's products as cards with a colored top — the type and
// the name over the color, then the description, what is known about use
// (real course progress, or when it was last opened) and the button.
const TOPS = ['from-emerald-500 to-teal-600', 'from-indigo-500 to-violet-600', 'from-orange-500 to-amber-600']

export default function MyBusinessSystemsSection() {
  const { user } = useIdentity()
  const owned = useOwnedProducts(user)

  return (
    <div>
      <DashboardSectionTitle
        title="My Workspaces"
        count={owned.length ? `${owned.length}` : undefined}
        action={
          <Link to="/platform/my-systems" className="inline-flex items-center gap-1 font-semibold text-primary">
            View all <ArrowRight size={14} aria-hidden />
          </Link>
        }
      />

      {owned.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {owned.slice(0, 3).map((product, i) => {
            const percent = product.progress?.percentComplete
            return (
              <div key={product.slug} className="flex flex-col overflow-hidden rounded-[20px] border border-navy/[0.07] bg-white shadow-softer">
                <div className={`relative h-36 bg-gradient-to-br ${TOPS[i % TOPS.length]} p-4 text-white`}>
                  {product.coverImage && <img src={product.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
                  <div className="relative flex h-full flex-col justify-between">
                    <span className="w-fit rounded-md bg-white/90 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-navy">{product.tag}</span>
                    <div>
                      {product.subTag && <p className="text-[12px] text-white/80">{product.subTag}</p>}
                      <p className="line-clamp-2 font-display text-[16px] font-bold leading-snug">{product.title}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {product.description && <p className="line-clamp-2 text-[13.5px] leading-relaxed text-navy/55">{product.description}</p>}
                  <p className="mt-4 flex items-center gap-1.5 border-t border-navy/[0.06] pt-3 text-[12.5px] text-navy/50">
                    <Clock size={13} aria-hidden />
                    {product.expired
                      ? 'Access ended'
                      : percent !== undefined
                        ? `${percent}% complete`
                        : product.lastOpenedAt
                          ? `Opened ${timeAgo(product.lastOpenedAt)}`
                          : 'Not opened yet'}
                  </p>
                  <Link to={getProductActionRoute(product)} className="btn-primary mt-4 inline-flex w-full justify-center !py-2.5 text-[14px]">
                    {product.expired ? 'See the product' : getProductActionLabel(product.type)}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="No Workspaces yet."
          description="Browse the catalog to find your first Workspace."
          action={<Button to="/systems">Browse Workspaces</Button>}
        />
      )}
    </div>
  )
}
