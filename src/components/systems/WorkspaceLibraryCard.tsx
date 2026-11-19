import { Link } from 'react-router-dom'
import { Clock, ExternalLink } from 'lucide-react'
import type { UserProduct } from '../../types/productLibrary'
import { getProductActionLabel, getProductActionRoute } from '../../lib/productLibrary'
import { timeAgo } from '../../lib/timeAgo'

// My Workspaces' grid card (19/11/2026, the owner's design): a dark top with
// the cover faded behind, the type as a colored tag, the category and the
// name; then the description, what is really known about use (course
// progress, or when it was last opened) and the Open button. A sibling of
// ProductLibraryCard, which the list view and other pages keep.
const TAGS = ['bg-primary', 'bg-violet-600', 'bg-emerald-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-orange-600', 'bg-rose-600']

export default function WorkspaceLibraryCard({ product, index }: { product: UserProduct; index: number }) {
  const Icon = product.icon
  const percent = product.progress ? Math.max(0, Math.min(100, Math.round(product.progress.percentComplete))) : null

  return (
    <div className="flex flex-col overflow-hidden rounded-[20px] border border-navy/[0.07] bg-white shadow-softer transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
      <div className="relative h-40 overflow-hidden bg-navy p-4 text-white">
        {product.coverImage ? (
          <img src={product.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        ) : (
          <Icon size={90} className="absolute -bottom-4 -right-3 text-white/[0.07]" aria-hidden />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
        <div className="relative flex h-full flex-col justify-between">
          <span className={`w-fit rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${TAGS[index % TAGS.length]}`}>
            {product.tag}
          </span>
          <div>
            {product.subTag && <p className="text-[11px] font-bold uppercase tracking-wide text-sky-300">{product.subTag}</p>}
            <p className="line-clamp-2 font-display text-[16.5px] font-bold leading-snug">{product.title}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        {product.description && <p className="line-clamp-2 text-[13.5px] leading-relaxed text-navy/55">{product.description}</p>}
        {percent !== null && (
          <div className="mt-4">
            <p className="flex justify-between text-[12px] text-navy/55">
              <span>Progress</span>
              <span className="font-semibold text-primary">{percent}%</span>
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-navy/[0.07]">
              <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
            </div>
          </div>
        )}
        <p className="mt-auto flex items-center gap-1.5 border-t border-navy/[0.06] pt-3 text-[12.5px] text-navy/50">
          <Clock size={13} aria-hidden />
          {product.expired ? 'Access ended' : product.lastOpenedAt ? `Opened ${timeAgo(product.lastOpenedAt)}` : 'Not opened yet'}
        </p>
        <Link
          to={getProductActionRoute(product)}
          className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2 !py-2.5 text-[14px]"
        >
          {product.expired ? 'Buy Workspace' : getProductActionLabel(product.type)}
          {!product.expired && <ExternalLink size={14} aria-hidden />}
        </Link>
      </div>
    </div>
  )
}
