import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Check, GitMerge, Pencil, Plus, Tag, Trash2, X } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import EmptyState from '../../../components/ui/EmptyState'
import Button from '../../../components/ui/Button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import ProductTagsEditor from '../../../components/admin/ProductTagsEditor'
import { CARD, INPUT, LINK_BUTTON, SMALL_BUTTON, pillClass } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminTag, AdminTagsOverview } from '../../../modules/admin/types'

const SOURCE: Record<string, { label: string; tone: 'blue' | 'gray' | 'amber' }> = {
  wix: { label: 'Wix', tone: 'amber' },
  studio: { label: 'Studio', tone: 'blue' },
  admin: { label: 'Admin', tone: 'gray' },
}
const KIND: Record<string, string> = { workspace: 'Workspace', calculator: 'Calculator', bundle: 'Bundle' }

const message = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong.')

// Admin → Catalog → Tags (Portal migration 0048): the one tag list shared
// with Studio's publish screens — create, rename, merge, delete — and each
// product's tags.
export default function AdminTagsPage() {
  const [data, setData] = useState<AdminTagsOverview | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)
  const [merging, setMerging] = useState<{ id: string; intoId: string } | null>(null)
  const [removing, setRemoving] = useState<AdminTag | null>(null)
  const [savingProduct, setSavingProduct] = useState<string | null>(null)

  useEffect(() => {
    adminService
      .listTags()
      .then(setData)
      .catch((err) => setLoadError(message(err)))
  }, [])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const l of data?.links ?? []) map.set(l.tag_id, (map.get(l.tag_id) ?? 0) + 1)
    return map
  }, [data])
  const byId = useMemo(() => new Map((data?.tags ?? []).map((t) => [t.id, t])), [data])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data?.tags ?? [])
      .filter((t) => !q || t.name.toLowerCase().includes(q))
      .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.name.localeCompare(b.name))
  }, [data, search, counts])

  async function run<T>(fn: () => Promise<T>) {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      return await fn()
    } catch (err) {
      setError(message(err))
      return null
    } finally {
      setBusy(false)
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault()
    const tag = await run(() => adminService.createTag(newName))
    if (tag) {
      setData((d) => d && { ...d, tags: [...d.tags, tag] })
      setNewName('')
      setNotice(`“${tag.name}” added.`)
    }
  }

  async function rename(e: FormEvent) {
    e.preventDefault()
    if (!editing) return
    const tag = await run(() => adminService.renameTag(editing.id, editing.name))
    if (tag) {
      setData((d) => d && { ...d, tags: d.tags.map((t) => (t.id === tag.id ? tag : t)) })
      setEditing(null)
    }
  }

  async function merge() {
    if (!merging?.intoId) return
    const result = await run(() => adminService.mergeTags(merging.id, merging.intoId))
    if (result) {
      const { fromId, intoId } = { fromId: merging.id, intoId: merging.intoId }
      setData((d) => {
        if (!d) return d
        const seen = new Set(d.links.filter((l) => l.tag_id === intoId).map((l) => l.product_id))
        const links = d.links.flatMap((l) => {
          if (l.tag_id !== fromId) return [l]
          if (seen.has(l.product_id)) return []
          seen.add(l.product_id)
          return [{ ...l, tag_id: intoId }]
        })
        return { ...d, tags: d.tags.filter((t) => t.id !== fromId), links }
      })
      setMerging(null)
      setNotice(`“${result.merged.from}” was merged into “${result.merged.into}”.`)
    }
  }

  async function confirmRemove() {
    if (!removing) return
    const id = removing.id
    const done = await run(() => adminService.deleteTag(id).then(() => true))
    if (done) {
      setData((d) => d && { ...d, tags: d.tags.filter((t) => t.id !== id), links: d.links.filter((l) => l.tag_id !== id) })
      setNotice(`“${removing.name}” deleted.`)
    }
    setRemoving(null)
  }

  async function setProductTags(productId: string, names: string[]) {
    setSavingProduct(productId)
    setError(null)
    try {
      const tags = await adminService.setProductTags(productId, names)
      setData((d) => {
        if (!d) return d
        const known = new Set(d.tags.map((t) => t.id))
        return {
          ...d,
          tags: [...d.tags, ...tags.filter((t) => !known.has(t.id))],
          links: [...d.links.filter((l) => l.product_id !== productId), ...tags.map((t) => ({ product_id: productId, tag_id: t.id }))],
        }
      })
    } catch (err) {
      setError(message(err))
    } finally {
      setSavingProduct(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <SEO title="Tags · Admin" description="The tag list shared with Studio." path="/platform/admin/tags" />
      <SectionHeader
        eyebrow="Admin"
        title="Tags"
        description="Short labels a product can have several of (the category is its one drawer). The same list Studio uses when publishing — and, later, the articles."
        className="mb-8"
      />

      {!data ? (
        loadError ? (
          <EmptyState icon={Tag} title="We couldn’t load the tags." description={loadError} />
        ) : (
          <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
        )
      ) : !data.ready ? (
        <EmptyState icon={Tag} title="Not ready yet." description="Run the database update (Portal migration 0048) to use tags." />
      ) : (
        <div className="space-y-10">
          {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</p>}

          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-navy">The list ({data.tags.length})</h2>
                <p className="mt-0.5 text-[13px] text-navy/50">Most used first. Merge joins two spellings of the same idea.</p>
              </div>
              <form onSubmit={(e) => void create(e)} className="flex gap-2">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} placeholder="New tag" className={`${INPUT} !py-2 sm:w-48`} />
                <Button type="submit" disabled={busy || !newName.trim()} icon={<Plus size={15} />} className={SMALL_BUTTON}>
                  Add
                </Button>
              </form>
            </div>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tags…" aria-label="Search tags" className={`${INPUT} mb-3`} />
            <div className={`${CARD} max-h-[32rem] divide-y divide-navy/[0.06] overflow-y-auto`}>
              {visible.length === 0 && <p className="px-5 py-6 text-[13.5px] text-navy/45">No tags match.</p>}
              {visible.map((t) => {
                const count = counts.get(t.id) ?? 0
                const src = SOURCE[t.source] ?? SOURCE.admin
                return (
                  <div key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-2.5">
                    {editing?.id === t.id ? (
                      <form onSubmit={(e) => void rename(e)} className="flex min-w-0 flex-1 items-center gap-2">
                        <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} maxLength={60} className={`${INPUT} !py-1.5`} autoFocus />
                        <button type="submit" disabled={busy} aria-label="Save" className={`${LINK_BUTTON} text-primary hover:bg-bg-soft`}>
                          <Check size={15} />
                        </button>
                        <button type="button" onClick={() => setEditing(null)} aria-label="Cancel" className={`${LINK_BUTTON} text-navy/50 hover:bg-bg-soft`}>
                          <X size={15} />
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className="min-w-0 flex-1 truncate text-[14px] text-navy">{t.name}</span>
                        <span className="text-[12px] text-navy/45">
                          {count} {count === 1 ? 'product' : 'products'}
                        </span>
                        <span className={pillClass(src.tone)}>{src.label}</span>
                        <button type="button" title="Rename" aria-label={`Rename ${t.name}`} onClick={() => setEditing({ id: t.id, name: t.name })} className={`${LINK_BUTTON} text-navy/50 hover:bg-bg-soft`}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" title="Merge into another tag" aria-label={`Merge ${t.name}`} onClick={() => setMerging({ id: t.id, intoId: '' })} className={`${LINK_BUTTON} text-navy/50 hover:bg-bg-soft`}>
                          <GitMerge size={14} />
                        </button>
                        <button type="button" title="Delete" aria-label={`Delete ${t.name}`} onClick={() => setRemoving(t)} className={`${LINK_BUTTON} text-red-500 hover:bg-red-50`}>
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                    {merging?.id === t.id && (
                      <div className="flex w-full flex-wrap items-center gap-2 rounded-xl bg-bg-soft p-3 text-[13px] text-navy">
                        Merge “{t.name}” into
                        <select value={merging.intoId} onChange={(e) => setMerging({ ...merging, intoId: e.target.value })} className={`${INPUT} !w-auto !py-1.5`}>
                          <option value="">choose a tag…</option>
                          {data.tags
                            .filter((o) => o.id !== t.id)
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.name}
                              </option>
                            ))}
                        </select>
                        <Button type="button" disabled={busy || !merging.intoId} onClick={() => void merge()} className={SMALL_BUTTON}>
                          Merge
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setMerging(null)} className={SMALL_BUTTON}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-navy">Products</h2>
            <p className="mb-4 mt-0.5 text-[13px] text-navy/50">
              Type to add a tag from the list (Enter adds a new one); × removes it. Saved right away. Studio shows the same tags when it publishes.
            </p>
            {data.products.length === 0 ? (
              <EmptyState icon={Tag} title="No products yet." description="Published Workspaces, calculators and bundles show up here." />
            ) : (
              <div className={`${CARD} divide-y divide-navy/[0.06]`}>
                {data.products.map((p) => {
                  const tags = data.links
                    .filter((l) => l.product_id === p.id)
                    .flatMap((l) => (byId.get(l.tag_id) ? [byId.get(l.tag_id) as AdminTag] : []))
                    .sort((a, b) => a.name.localeCompare(b.name))
                  return (
                    <div key={p.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 px-5 py-3">
                      <div className="w-full min-w-0 sm:w-64">
                        <p className="truncate text-[14px] font-semibold text-navy">{p.name}</p>
                        <p className="text-[12px] text-navy/45">
                          {KIND[p.content_type] ?? p.content_type}
                          {p.status !== 'published' ? ' · not published' : ''}
                          {savingProduct === p.id ? ' · saving…' : ''}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <ProductTagsEditor tags={tags} all={data.tags} busy={savingProduct === p.id} onChange={(names) => void setProductTags(p.id, names)} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      )}

      <ConfirmDialog
        open={removing !== null}
        title="Delete this tag?"
        description={removing ? `“${removing.name}” leaves the list and every product that has it. No product is deleted.` : undefined}
        confirmLabel="Delete"
        tone="danger"
        busy={busy}
        onConfirm={() => void confirmRemove()}
        onCancel={() => setRemoving(null)}
      />
    </div>
  )
}
