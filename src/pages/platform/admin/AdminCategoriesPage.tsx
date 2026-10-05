import { useEffect, useMemo, useState } from 'react'
import { Tags } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import SearchBar from '../../../components/ui/SearchBar'
import EmptyState from '../../../components/ui/EmptyState'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import CategoryAreaCard from '../../../components/admin/CategoryAreaCard'
import AdminProductCategoryRow from '../../../components/admin/AdminProductCategoryRow'
import { CARD } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminCatalogCategories, AdminCategory } from '../../../modules/admin/types'

function message(err: unknown) {
  return err instanceof Error ? err.message : String(err)
}

// Admin → Categories: the Areas (Growth Categories) and the categories
// inside them. Studio's Category field and the site's catalog filters read
// this same list; a Workspace's category can also be changed here directly.
export default function AdminCategoriesPage() {
  const [data, setData] = useState<AdminCatalogCategories | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingProduct, setSavingProduct] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [onlyMissing, setOnlyMissing] = useState(false)
  const [toDelete, setToDelete] = useState<AdminCategory | null>(null)

  useEffect(() => {
    adminService
      .listCategories()
      .then((next) => {
        setData(next)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        setLoadError(message(err))
        setStatus('error')
      })
  }, [])

  const categories = data?.categories ?? []
  const areas = categories.filter((c) => !c.parent_id)
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of data?.products ?? []) if (p.category_id) map.set(p.category_id, (map.get(p.category_id) ?? 0) + 1)
    return map
  }, [data])

  const products = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data?.products ?? []).filter(
      (p) => (!onlyMissing || !p.category_id) && (!q || p.name.toLowerCase().includes(q) || p.slug.includes(q)),
    )
  }, [data, query, onlyMissing])
  const missing = (data?.products ?? []).filter((p) => !p.category_id).length

  async function run<T>(task: () => Promise<T>): Promise<T | null> {
    setBusy(true)
    setError(null)
    try {
      return await task()
    } catch (err) {
      setError(message(err))
      return null
    } finally {
      setBusy(false)
    }
  }

  function replaceCategory(category: AdminCategory) {
    setData((d) => d && { ...d, categories: d.categories.map((c) => (c.id === category.id ? category : c)) })
  }

  async function create(name: string, areaId: string) {
    const category = await run(() => adminService.createCategory(name, areaId))
    if (category) setData((d) => d && { ...d, categories: [...d.categories, category] })
    return Boolean(category)
  }

  async function rename(category: AdminCategory, name: string) {
    const updated = await run(() => adminService.updateCategory(category.id, { name }))
    if (updated) replaceCategory(updated)
    return Boolean(updated)
  }

  async function move(category: AdminCategory, areaId: string) {
    const updated = await run(() => adminService.updateCategory(category.id, { parentId: areaId }))
    if (updated) replaceCategory(updated)
  }

  async function confirmDelete() {
    if (!toDelete) return
    const id = toDelete.id
    const done = await run(() => adminService.deleteCategory(id).then(() => true))
    setToDelete(null)
    if (done) setData((d) => d && { ...d, categories: d.categories.filter((c) => c.id !== id) })
  }

  async function setProductCategory(productId: string, categoryId: string | null) {
    setSavingProduct(productId)
    setError(null)
    try {
      await adminService.setProductCategory(productId, categoryId)
      setData((d) => d && { ...d, products: d.products.map((p) => (p.id === productId ? { ...p, category_id: categoryId } : p)) })
    } catch (err) {
      setError(message(err))
    } finally {
      setSavingProduct(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <SEO title="Categories · Admin" description="Workspace categories." path="/platform/admin/categories" />
      <SectionHeader
        eyebrow="Admin"
        title="Categories"
        description="The areas and categories used by Studio and by the site’s catalog filters."
        className="mb-8"
      />

      {status === 'loading' ? (
        <p className="py-16 text-center text-[14px] text-navy/40">Loading categories…</p>
      ) : status === 'error' || !data ? (
        <EmptyState icon={Tags} title="We couldn’t load the categories." description={loadError} />
      ) : (
        <div className="space-y-10">
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</p>}

          <section>
            <h2 className="mb-1 font-display text-lg font-bold text-navy">Areas and categories</h2>
            <p className="mb-4 text-[13px] text-navy/50">
              Each Workspace goes in one category, or in an area by itself when it’s general.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {areas.map((area) => (
                <CategoryAreaCard
                  key={area.id}
                  area={area}
                  areas={areas}
                  items={categories.filter((c) => c.parent_id === area.id)}
                  counts={counts}
                  busy={busy}
                  onCreate={create}
                  onRename={rename}
                  onMove={move}
                  onDelete={setToDelete}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-1 font-display text-lg font-bold text-navy">Workspaces</h2>
            <p className="mb-4 text-[13px] text-navy/50">
              Changes apply on the site right away. Studio shows the same category the next time the Workspace is opened there.
            </p>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex-1">
                <SearchBar value={query} onChange={setQuery} placeholder="Search Workspaces…" />
              </div>
              <label className="flex items-center gap-2 text-[13px] text-navy/60">
                <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
                Without a category ({missing})
              </label>
            </div>
            {products.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-navy/40">No Workspaces match.</p>
            ) : (
              <div className={`${CARD} divide-y divide-navy/[0.06] overflow-hidden`}>
                {products.map((p) => (
                  <AdminProductCategoryRow
                    key={p.id}
                    product={p}
                    categories={categories}
                    saving={savingProduct === p.id}
                    onChange={(categoryId) => setProductCategory(p.id, categoryId)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete “${toDelete?.name ?? ''}”?`}
        description="Only empty categories can be deleted. Workspaces are never deleted here."
        confirmLabel="Delete category"
        tone="danger"
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
