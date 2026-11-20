import { useEffect, useMemo, useState } from 'react'
import { Package, Plus, Search } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import EmptyState from '../../../components/ui/EmptyState'
import Button from '../../../components/ui/Button'
import { downloadCsv } from '../../../lib/downloadCsv'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import AdminBundleRow from '../../../components/admin/AdminBundleRow'
import BundleEditor from '../../../components/admin/BundleEditor'
import { CARD, INPUT, SMALL_BUTTON } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminBundle, AdminBundleDraft, AdminBundlesOverview } from '../../../modules/admin/types'

// Admin → Bundles: several Workspaces sold together for one price (Portal
// migration 0041). The Workspaces keep selling on their own; buying a
// bundle unlocks each of them.
export default function AdminBundlesPage() {
  const [data, setData] = useState<AdminBundlesOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  // null = closed, 'new' = creating, a bundle = editing it.
  const [editing, setEditing] = useState<AdminBundle | 'new' | null>(null)
  const [removing, setRemoving] = useState<AdminBundle | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all')

  useEffect(() => {
    adminService
      .listBundles()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the bundles.'))
  }, [])

  const workspaces = useMemo(() => new Map((data?.workspaces ?? []).map((w) => [w.id, w])), [data])

  async function save(draft: AdminBundleDraft) {
    const saved = await adminService.saveBundle(draft)
    setData((d) =>
      d
        ? {
            ...d,
            bundles: draft.id ? d.bundles.map((b) => (b.id === saved.id ? saved : b)) : [saved, ...d.bundles],
          }
        : d,
    )
    setEditing(null)
    setNotice(saved.status === 'published' ? `“${saved.name}” is live on the site.` : `“${saved.name}” saved as a draft.`)
  }

  // A copy in draft (20/11/2026): same products, texts, price and cover; the
  // server gives it its own address. Nothing goes live until it's published.
  async function duplicate(b: AdminBundle) {
    setError(null)
    setNotice(null)
    try {
      const copy = await adminService.saveBundle({
        name: `${b.name} (copy)`,
        shortDescription: b.short_description,
        longDescription: b.long_description,
        isFree: b.is_free,
        priceCents: b.price_cents,
        categoryId: b.category_id,
        coverImageUrl: b.cover_image_url,
        status: 'draft',
        itemIds: b.item_ids,
      })
      setData((d) => (d ? { ...d, bundles: [copy, ...d.bundles] } : d))
      setNotice(`“${copy.name}” was created as a draft — edit it before publishing.`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t duplicate the bundle.')
    }
  }

  async function copyLink(b: AdminBundle) {
    const url = `https://bgrowth.app/bundle/${b.slug}`
    try {
      await navigator.clipboard.writeText(url)
      setNotice(`Link copied: ${url}`)
    } catch {
      setNotice(url)
    }
  }

  const counts = {
    all: data?.bundles.length ?? 0,
    published: data?.bundles.filter((b) => b.status === 'published').length ?? 0,
    draft: data?.bundles.filter((b) => b.status !== 'published').length ?? 0,
  }
  const q = query.trim().toLowerCase()
  const shown = (data?.bundles ?? []).filter(
    (b) =>
      (status === 'all' || (status === 'published' ? b.status === 'published' : b.status !== 'published')) &&
      (!q ||
        b.name.toLowerCase().includes(q) ||
        b.short_description.toLowerCase().includes(q) ||
        b.item_ids.some((id) => workspaces.get(id)?.name.toLowerCase().includes(q))),
  )

  async function confirmRemove() {
    if (!removing) return
    setBusy(true)
    setError(null)
    try {
      await adminService.removeBundle(removing.id)
      setData((d) => (d ? { ...d, bundles: d.bundles.filter((b) => b.id !== removing.id) } : d))
      setNotice(`“${removing.name}” was removed from the site.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t remove the bundle.')
    } finally {
      setBusy(false)
      setRemoving(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <SEO title="Bundles · Admin" description="Workspaces sold together." path="/platform/admin/bundles" />
      {/* Top (20/11/2026, the owner's design). No revenue/conversion cards:
          the owner chose to leave sales figures out of this screen. */}
      <div className="mb-8 flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-primary/15 bg-blue-50 text-primary">
          <Package size={24} />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-navy">Bundles</h1>
          <p className="mt-1.5 max-w-2xl text-[14.5px] leading-relaxed text-navy/55">
            Several products sold together for one price. Each keeps selling on its own; buying the bundle unlocks all of them.
          </p>
        </div>
      </div>

      {!data ? (
        error ? (
          <EmptyState icon={Package} title="We couldn’t load the bundles." description={error} />
        ) : (
          <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
        )
      ) : (
        <div className="space-y-6">
          {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}
          {error && <p className="text-[14px] text-red-500">{error}</p>}

          {editing ? (
            <BundleEditor
              key={editing === 'new' ? 'new' : editing.id}
              bundle={editing === 'new' ? null : editing}
              workspaces={data.workspaces}
              categories={data.categories}
              onSave={save}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div className={`${CARD} flex flex-wrap items-center gap-3 p-4`}>
              <div className="relative min-w-[14rem] flex-1">
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/35" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search bundles by name or product…"
                  aria-label="Search bundles"
                  className={`${INPUT} !pl-10`}
                />
              </div>
              <div className="flex gap-1 rounded-xl border border-navy/10 p-1">
                {(['all', 'published', 'draft'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold capitalize transition-colors ${
                      status === s ? 'bg-primary text-white' : 'text-navy/55 hover:text-navy'
                    }`}
                  >
                    {s} ({counts[s]})
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={data.bundles.length === 0}
                onClick={() => {
                  // Every bundle with its price and what's inside (16/11/2026).
                  const money = (c: number | null) => (typeof c === 'number' ? (c / 100).toFixed(2) : '')
                  downloadCsv('bgrowth-bundles', [
                    ['Bundle', 'Status', 'Free', 'Price (USD)', 'Sum of the products (USD)', 'Products inside', 'How many', 'Address'],
                    ...data.bundles.map((b) => {
                      const items = b.item_ids.map((id) => workspaces.get(id)).filter((w): w is NonNullable<typeof w> => Boolean(w))
                      const sum = items.reduce((t, w) => t + (w.is_free ? 0 : w.price_cents ?? 0), 0)
                      return [
                        b.name,
                        b.status,
                        b.is_free ? 'Yes' : 'No',
                        b.is_free ? '0.00' : money(b.price_cents),
                        money(sum),
                        items.map((w) => w.name).join(' | '),
                        b.item_ids.length,
                        `https://bgrowth.app/bundle/${b.slug}`,
                      ]
                    }),
                  ])
                }}
                className="rounded-lg border border-navy/10 px-3 py-1.5 text-[13px] font-semibold text-primary hover:bg-bg-soft disabled:opacity-40"
              >
                Download CSV
              </button>
              <Button
                type="button"
                icon={<Plus size={16} />}
                onClick={() => {
                  setNotice(null)
                  setEditing('new')
                }}
                disabled={data.workspaces.length < 2}
                className={SMALL_BUTTON}
              >
                New bundle
              </Button>
            </div>
          )}

          {data.bundles.length === 0 ? (
            !editing && (
              <EmptyState
                icon={Package}
                title="No bundles yet."
                description="Put 2 or more Workspaces together — for example everything someone needs to start one kind of business."
              />
            )
          ) : (
            <div className={`${CARD} overflow-hidden`}>
              <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_8rem_6.5rem_6rem] gap-4 border-b border-navy/[0.06] bg-bg-soft/60 px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-navy/40 lg:grid">
                <span>Bundle</span>
                <span>What&rsquo;s inside</span>
                <span>Price</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>
              {shown.length === 0 && <p className="px-5 py-10 text-center text-[13.5px] text-navy/45">No bundle matches.</p>}
              <div className="divide-y divide-navy/[0.06]">
              {shown.map((b) => (
                <AdminBundleRow
                  key={b.id}
                  bundle={b}
                  workspaces={workspaces}
                  onEdit={() => {
                    setNotice(null)
                    setEditing(b)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  onDuplicate={() => void duplicate(b)}
                  onCopyLink={() => void copyLink(b)}
                  onRemove={() => setRemoving(b)}
                />
              ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={removing !== null}
        title="Remove this bundle?"
        description="It leaves the site right away. Members who bought it keep every Workspace, and past sales keep its name."
        confirmLabel="Remove"
        tone="danger"
        busy={busy}
        onConfirm={() => void confirmRemove()}
        onCancel={() => setRemoving(null)}
      />
    </div>
  )
}
