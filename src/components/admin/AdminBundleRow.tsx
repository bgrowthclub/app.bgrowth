import { ExternalLink, Package } from 'lucide-react'
import { LINK_BUTTON, pillClass } from './styles'
import { formatCents, savingsPercent, separatePriceCents } from '../../modules/workspace/lib/bundlePrice'
import type { AdminBundle, AdminBundleWorkspace } from '../../modules/admin/types'

interface Props {
  bundle: AdminBundle
  workspaces: Map<string, AdminBundleWorkspace>
  onEdit: () => void
  onRemove: () => void
}

// One bundle in Admin → Bundles.
export default function AdminBundleRow({ bundle, workspaces, onEdit, onRemove }: Props) {
  const items = bundle.item_ids.flatMap((id) => (workspaces.has(id) ? [workspaces.get(id) as AdminBundleWorkspace] : []))
  const separate = separatePriceCents(items.map((w) => ({ priceCents: w.is_free ? 0 : w.price_cents ?? 0 })))
  const priceCents = bundle.is_free ? 0 : bundle.price_cents ?? 0
  const saving = savingsPercent(priceCents, separate)
  const cover = bundle.cover_image_url ?? items.find((w) => w.cover_image_url)?.cover_image_url ?? null
  const published = bundle.status === 'published'

  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-4">
      {cover ? (
        <img src={cover} alt="" className="h-12 w-20 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="grid h-12 w-20 shrink-0 place-items-center rounded-lg bg-bg-soft text-primary">
          <Package size={18} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-semibold text-navy">{bundle.name}</p>
        <p className="mt-0.5 truncate text-[12.5px] text-navy/45">
          {items.length} Workspaces: {items.map((w) => w.name).join(', ')}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[14px] font-semibold text-navy">{priceCents === 0 ? 'Free' : formatCents(priceCents)}</p>
        {separate > 0 && (
          <p className="text-[12px] text-navy/40">
            vs {formatCents(separate)}
            {saving > 0 ? ` · −${saving}%` : ''}
          </p>
        )}
      </div>
      <span className={pillClass(published ? 'green' : 'gray')}>{published ? 'Published' : 'Draft'}</span>
      <div className="flex items-center gap-1">
        {published && (
          <a href={`/bundle/${encodeURIComponent(bundle.slug)}`} target="_blank" rel="noreferrer" className={`${LINK_BUTTON} inline-flex items-center gap-1 text-navy/60 hover:bg-bg-soft`}>
            View <ExternalLink size={13} />
          </a>
        )}
        <button type="button" onClick={onEdit} className={`${LINK_BUTTON} text-primary hover:bg-bg-soft`}>
          Edit
        </button>
        <button type="button" onClick={onRemove} className={`${LINK_BUTTON} text-red-500 hover:bg-red-50`}>
          Remove
        </button>
      </div>
    </div>
  )
}
