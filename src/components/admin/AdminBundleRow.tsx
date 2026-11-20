import { Copy, ExternalLink, Link2, MoreHorizontal, Package, Pencil, Trash2 } from 'lucide-react'
import Popover from '../platform/Popover'
import { pillClass } from './styles'
import { formatCents, savingsPercent, separatePriceCents } from '../../modules/workspace/lib/bundlePrice'
import type { AdminBundle, AdminBundleWorkspace } from '../../modules/admin/types'

interface Props {
  bundle: AdminBundle
  workspaces: Map<string, AdminBundleWorkspace>
  onEdit: () => void
  onDuplicate: () => void
  onCopyLink: () => void
  onRemove: () => void
}

const MENU_ITEM = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-navy/75 hover:bg-bg-soft hover:text-navy'

// One bundle in Admin → Bundles (new look 20/11/2026, the owner's design):
// cover, name and short text, what's inside, the price against the sum of
// the products, status, Edit and a "…" menu. No sales or conversion figures
// — the site doesn't count bundle visits, so a rate would be made up.
export default function AdminBundleRow({ bundle, workspaces, onEdit, onDuplicate, onCopyLink, onRemove }: Props) {
  const items = bundle.item_ids.flatMap((id) => (workspaces.has(id) ? [workspaces.get(id) as AdminBundleWorkspace] : []))
  const separate = separatePriceCents(items.map((w) => ({ priceCents: w.is_free ? 0 : w.price_cents ?? 0 })))
  const priceCents = bundle.is_free ? 0 : bundle.price_cents ?? 0
  const saving = savingsPercent(priceCents, separate)
  const cover = bundle.cover_image_url ?? items.find((w) => w.cover_image_url)?.cover_image_url ?? null
  const published = bundle.status === 'published'

  return (
    <div className="grid grid-cols-1 items-center gap-4 px-5 py-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_8rem_6.5rem_6rem]">
      <div className="flex min-w-0 items-center gap-4">
        {cover ? (
          <img src={cover} alt="" className="h-16 w-20 shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="grid h-16 w-20 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary">
            <Package size={22} />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-navy">{bundle.name}</p>
          {bundle.short_description && <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-navy/50">{bundle.short_description}</p>}
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-navy/70">
          {items.length} {items.length === 1 ? 'product' : 'products'}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {items.slice(0, 2).map((w) => (
            <span key={w.id} className="max-w-[11rem] truncate rounded-md border border-navy/10 px-2 py-0.5 text-[11.5px] text-navy/60" title={w.name}>
              {w.name}
            </span>
          ))}
          {items.length > 2 && (
            <span className="rounded-md border border-navy/10 px-2 py-0.5 text-[11.5px] text-navy/50" title={items.slice(2).map((w) => w.name).join(', ')}>
              +{items.length - 2}
            </span>
          )}
        </div>
      </div>

      <div>
        {separate > priceCents && <p className="text-[12px] text-navy/35 line-through">{formatCents(separate)}</p>}
        <p className="text-[15px] font-bold text-navy">{priceCents === 0 ? 'Free' : formatCents(priceCents)}</p>
        {saving > 0 && <p className="text-[11.5px] font-bold text-emerald-600">{saving}% OFF</p>}
      </div>

      <span className={`${pillClass(published ? 'green' : 'gray')} w-fit`}>{published ? 'Published' : 'Draft'}</span>

      <div className="flex items-center gap-1.5 lg:justify-end">
        <button type="button" onClick={onEdit} className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-primary hover:bg-bg-soft">
          Edit
        </button>
        <Popover
          panelClassName="w-48 p-1.5"
          trigger={({ toggle }) => (
            <button type="button" onClick={toggle} aria-label={`More actions for ${bundle.name}`} className="grid h-9 w-9 place-items-center rounded-xl border border-navy/10 text-navy/60 hover:bg-bg-soft hover:text-navy">
              <MoreHorizontal size={17} />
            </button>
          )}
        >
          {published && (
            <a href={`/bundle/${encodeURIComponent(bundle.slug)}`} target="_blank" rel="noreferrer" className={MENU_ITEM}>
              <ExternalLink size={15} /> View page
            </a>
          )}
          {published && (
            <button type="button" onClick={onCopyLink} className={MENU_ITEM}>
              <Link2 size={15} /> Copy link
            </button>
          )}
          <button type="button" onClick={onDuplicate} className={MENU_ITEM}>
            <Copy size={15} /> Duplicate
          </button>
          <button type="button" onClick={onEdit} className={MENU_ITEM}>
            <Pencil size={15} /> Edit
          </button>
          <button type="button" onClick={onRemove} className={`${MENU_ITEM} !text-red-500 hover:!bg-red-50`}>
            <Trash2 size={15} /> Remove
          </button>
        </Popover>
      </div>
    </div>
  )
}
