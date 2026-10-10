import { useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, X } from 'lucide-react'
import Button from '../ui/Button'
import CategorySelect from './CategorySelect'
import { CARD, INPUT, LINK_BUTTON, SMALL_BUTTON } from './styles'
import { adminService } from '../../modules/admin/adminService'
import { shrinkImage } from '../../lib/shrinkImage'
import { formatCents, savingsPercent, separatePriceCents } from '../../modules/workspace/lib/bundlePrice'
import type { AdminBundle, AdminBundleDraft, AdminBundleWorkspace, AdminCategory } from '../../modules/admin/types'

interface Props {
  bundle: AdminBundle | null
  workspaces: AdminBundleWorkspace[]
  categories: AdminCategory[]
  onSave: (draft: AdminBundleDraft) => Promise<void>
  onCancel: () => void
}

const LABEL = 'mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-navy/40'

const itemCents = (w: AdminBundleWorkspace) => (w.is_free ? 0 : w.price_cents ?? 0)

// Create or edit a bundle: its Workspaces (in order), price against their
// separate prices, texts, category and cover. Saving as a draft keeps it
// off the site; publishing shows it in the catalog at /bundle/<address>.
export default function BundleEditor({ bundle, workspaces, categories, onSave, onCancel }: Props) {
  const [name, setName] = useState(bundle?.name ?? '')
  const [shortDescription, setShortDescription] = useState(bundle?.short_description ?? '')
  const [longDescription, setLongDescription] = useState(bundle?.long_description ?? '')
  const [itemIds, setItemIds] = useState<string[]>(bundle?.item_ids ?? [])
  const [isFree, setIsFree] = useState(bundle?.is_free ?? false)
  const [price, setPrice] = useState(bundle?.price_cents != null ? String(bundle.price_cents / 100) : '')
  const [categoryId, setCategoryId] = useState<string | null>(bundle?.category_id ?? null)
  const [cover, setCover] = useState<string | null>(bundle?.cover_image_url ?? null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState<'draft' | 'published' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const byId = useMemo(() => new Map(workspaces.map((w) => [w.id, w])), [workspaces])
  const chosen = itemIds.flatMap((id) => (byId.has(id) ? [byId.get(id) as AdminBundleWorkspace] : []))
  const available = workspaces.filter((w) => !itemIds.includes(w.id))
  const separate = separatePriceCents(chosen.map((w) => ({ priceCents: itemCents(w) })))
  const priceCents = isFree ? 0 : Math.round(Number(price) * 100) || 0
  const savePct = savingsPercent(priceCents, separate)
  const published = bundle?.status === 'published'

  function move(index: number, delta: number) {
    setItemIds((ids) => {
      const next = [...ids]
      const [item] = next.splice(index, 1)
      next.splice(index + delta, 0, item)
      return next
    })
  }

  async function upload(file: File) {
    setUploading(true)
    setError(null)
    try {
      setCover(await adminService.uploadBundleCover(await shrinkImage(file, 1600)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t upload the image.')
    } finally {
      setUploading(false)
    }
  }

  async function save(status: 'draft' | 'published') {
    setSaving(status)
    setError(null)
    try {
      await onSave({
        id: bundle?.id,
        name,
        shortDescription,
        longDescription,
        isFree,
        priceCents: isFree ? null : Math.round(Number(price) * 100),
        categoryId,
        coverImageUrl: cover,
        status,
        itemIds,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save the bundle.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className={`${CARD} space-y-6 p-6`}>
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-display text-lg font-bold text-navy">{bundle ? 'Edit bundle' : 'New bundle'}</h2>
        <button type="button" onClick={onCancel} aria-label="Close" className="rounded-lg p-1.5 text-navy/40 hover:bg-bg-soft hover:text-navy">
          <X size={18} />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className={LABEL}>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={INPUT} placeholder="e.g. Start Your Cleaning Business" />
        </label>
        <label className="block">
          <span className={LABEL}>Category</span>
          <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} />
        </label>
      </div>

      <label className="block">
        <span className={LABEL}>Short description (cards)</span>
        <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} maxLength={300} className={INPUT} />
      </label>

      <label className="block">
        <span className={LABEL}>Description on its page (optional)</span>
        <textarea value={longDescription} onChange={(e) => setLongDescription(e.target.value)} rows={4} maxLength={5000} className={INPUT} />
      </label>

      <div>
        <span className={LABEL}>Workspaces in this bundle ({chosen.length})</span>
        {chosen.length > 0 && (
          <ul className="mb-3 divide-y divide-navy/[0.06] overflow-hidden rounded-xl border border-navy/[0.08]">
            {chosen.map((w, i) => (
              <li key={w.id} className="flex items-center gap-3 px-3 py-2.5">
                {w.cover_image_url ? (
                  <img src={w.cover_image_url} alt="" className="h-9 w-14 shrink-0 rounded-md object-cover" />
                ) : (
                  <span className="h-9 w-14 shrink-0 rounded-md bg-bg-soft" />
                )}
                <span className="min-w-0 flex-1 truncate text-[14px] text-navy">
                  {w.name}
                  {w.status !== 'published' && <span className="ml-2 text-[12px] text-amber-600">(not published)</span>}
                </span>
                <span className="text-[13px] text-navy/50">{itemCents(w) === 0 ? 'Free' : formatCents(itemCents(w))}</span>
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up" className={`${LINK_BUTTON} text-navy/50 hover:bg-bg-soft`}>
                  <ArrowUp size={15} />
                </button>
                <button type="button" disabled={i === chosen.length - 1} onClick={() => move(i, 1)} aria-label="Move down" className={`${LINK_BUTTON} text-navy/50 hover:bg-bg-soft`}>
                  <ArrowDown size={15} />
                </button>
                <button type="button" onClick={() => setItemIds((ids) => ids.filter((id) => id !== w.id))} aria-label="Remove" className={`${LINK_BUTTON} text-red-500 hover:bg-red-50`}>
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <select
          value=""
          onChange={(e) => e.target.value && setItemIds((ids) => [...ids, e.target.value])}
          className={INPUT}
          disabled={available.length === 0}
        >
          <option value="">{available.length ? 'Add a Workspace…' : 'Every Workspace is already in this bundle'}</option>
          {available.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} — {itemCents(w) === 0 ? 'Free' : formatCents(itemCents(w))}
              {w.status !== 'published' ? ' (not published)' : ''}
            </option>
          ))}
        </select>
        {chosen.length < 2 && <p className="mt-1.5 text-[12.5px] text-navy/40">Choose at least 2.</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <span className={LABEL}>Price (USD)</span>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0.5}
              step={0.01}
              value={isFree ? '' : price}
              disabled={isFree}
              onChange={(e) => setPrice(e.target.value)}
              className={`${INPUT} !w-40`}
              placeholder="49"
            />
            <label className="flex items-center gap-2 text-[14px] text-navy/70">
              <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
              Free
            </label>
          </div>
          <p className="mt-1.5 text-[12.5px] text-navy/45">
            Bought one by one: {formatCents(separate)}
            {savePct > 0 && <span className="font-semibold text-primary"> — the bundle saves {savePct}%</span>}
            {!isFree && separate > 0 && priceCents >= separate && <span className="text-amber-600"> — the bundle isn’t cheaper</span>}
          </p>
          <p className="mt-1 text-[12.5px] text-navy/40">Someone who already bought some of them pays only for the rest.</p>
        </div>

        <div>
          <span className={LABEL}>Cover image (optional)</span>
          <div className="flex items-center gap-3">
            {cover ? (
              <img src={cover} alt="" className="h-16 w-28 rounded-lg object-cover" />
            ) : (
              <span className="grid h-16 w-28 place-items-center rounded-lg bg-bg-soft text-[11px] text-navy/35">Automatic</span>
            )}
            <div className="flex flex-col items-start gap-1">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className={`${LINK_BUTTON} inline-flex items-center gap-1.5 text-primary hover:bg-bg-soft`}>
                <ImagePlus size={15} /> {uploading ? 'Uploading…' : cover ? 'Change image' : 'Upload image'}
              </button>
              {cover && (
                <button type="button" onClick={() => setCover(null)} className={`${LINK_BUTTON} text-navy/50 hover:bg-bg-soft`}>
                  Use the Workspaces’ covers
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) void upload(file)
              }}
            />
          </div>
          {!cover && <p className="mt-1.5 text-[12.5px] text-navy/40">Without an image, the site shows the Workspaces’ covers together.</p>}
        </div>
      </div>

      {error && <p className="text-[14px] text-red-500">{error}</p>}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-navy/[0.06] pt-5">
        <Button type="button" variant="secondary" onClick={() => void save('draft')} disabled={saving !== null || uploading} className={SMALL_BUTTON}>
          {saving === 'draft' ? 'Saving…' : published ? 'Unpublish' : 'Save as draft'}
        </Button>
        <Button type="button" onClick={() => void save('published')} disabled={saving !== null || uploading} className={SMALL_BUTTON}>
          {saving === 'published' ? 'Publishing…' : published ? 'Save changes' : 'Publish'}
        </Button>
      </div>
    </div>
  )
}
