import { useEffect, useMemo, useState } from 'react'
import { KeyRound } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import EmptyState from '../../../components/ui/EmptyState'
import SearchBar from '../../../components/ui/SearchBar'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminProduct, AdminProductMember, AdminProductMembers } from '../../../modules/admin/types'

// Admin → Catalog → Access (01/11/2026): who has one product. The Admin area
// could only answer the opposite question — one member's products — so
// "who is in this course" had no screen at all.
//
// Works for every type, not only courses: the progress column is the one
// course-specific part. Read-only; giving or ending access stays in
// Admin → Members, where it is logged per member.
const CARD = 'rounded-xl3 border border-navy/[0.06] bg-white shadow-softer'

const SOURCE_LABEL: Record<AdminProductMember['source'], string> = {
  purchase: 'Bought it',
  free: 'Free',
  trial: 'Trial',
  team: 'Given by the team',
  plan: 'Through a plan',
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminProductAccessPage() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null)
  const [productId, setProductId] = useState('')
  const [data, setData] = useState<AdminProductMembers | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    adminService
      .listProducts()
      .then((list) => {
        setProducts(list)
        if (list.length) setProductId((current) => current || list[0].id)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the products.'))
  }, [])

  useEffect(() => {
    if (!productId) return
    let cancelled = false
    setData(null)
    setError(null)
    adminService
      .getProductMembers(productId)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Couldn’t load the list.'))
    return () => {
      cancelled = true
    }
  }, [productId])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !data) return data?.members ?? []
    return data.members.filter((m) => (m.fullName ?? '').toLowerCase().includes(q) || (m.email ?? '').toLowerCase().includes(q))
  }, [data, query])

  const tiles = data
    ? [
        { label: 'People', value: data.totals.people },
        { label: 'With access now', value: data.totals.active },
        { label: 'Never opened it', value: data.totals.neverOpened },
        ...(data.product.isCourse
          ? [
              { label: 'Started', value: data.totals.started ?? 0 },
              { label: 'Finished', value: data.totals.finished ?? 0 },
            ]
          : [{ label: 'Access ended', value: data.totals.expired }]),
      ]
    : []

  return (
    <div className="space-y-6">
      <SEO title="Access" description="Who has each product." path="/platform/admin/access" />

      <div>
        <p className="eyebrow">Catalog</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy">Access</h1>
        <p className="mt-3 max-w-xl text-[15px] text-navy/55">
          Who has a product, how they got in, and — for a course — how far along they are. To give or end someone’s access, use Members.
        </p>
      </div>

      <div className={`${CARD} p-5`}>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-navy/40">Product</span>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full rounded-xl border border-navy/10 bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:border-primary/40"
          >
            {(products ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.content_type === 'course' ? ' — Course' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <p className="text-[14px] text-red-500">{error}</p>
      ) : products && products.length === 0 ? (
        <EmptyState icon={KeyRound} title="No published products" description="Publish a product first and its people show up here." />
      ) : !data ? (
        <p className="py-10 text-center text-[14px] text-navy/40">…</p>
      ) : (
        <>
          <div className={`grid gap-3 grid-cols-2 ${tiles.length > 4 ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
            {tiles.map((tile) => (
              <div key={tile.label} className={`${CARD} p-4`}>
                <p className="text-[12.5px] font-semibold text-navy/50">{tile.label}</p>
                <p className="mt-1 font-display text-3xl font-bold text-navy">{tile.value.toLocaleString('en-US')}</p>
              </div>
            ))}
          </div>

          {data.members.length === 0 ? (
            <EmptyState icon={KeyRound} title="Nobody yet" description="No member has this product." />
          ) : (
            <>
              <SearchBar value={query} onChange={setQuery} placeholder="Search by name or e-mail" />

              <div className={`${CARD} overflow-x-auto`}>
                <table className="w-full min-w-[720px] text-left text-[13.5px]">
                  <thead className="border-b border-navy/[0.06] text-[12px] font-semibold uppercase tracking-wide text-navy/40">
                    <tr>
                      <th className="px-5 py-3">Member</th>
                      <th className="px-5 py-3">How they got in</th>
                      <th className="px-5 py-3">Since</th>
                      <th className="px-5 py-3">Last opened</th>
                      {data.product.isCourse && <th className="px-5 py-3">Progress</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((m) => (
                      <tr key={`${m.userId}-${m.source}`} className="border-b border-navy/[0.04] last:border-0">
                        <td className="px-5 py-3">
                          <span className="block font-semibold text-navy">{m.fullName || '—'}</span>
                          <span className="block text-[12.5px] text-navy/45">{m.email ?? '—'}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={m.expired ? 'text-navy/40' : 'text-navy/70'}>
                            {SOURCE_LABEL[m.source]}
                            {m.expired ? ' (ended)' : ''}
                          </span>
                          {m.detail && <span className="block text-[12.5px] text-navy/45">{m.detail}</span>}
                          {m.endsAt && <span className="block text-[12.5px] text-navy/45">Until {formatDate(m.endsAt)}</span>}
                        </td>
                        <td className="px-5 py-3 text-navy/60">{formatDate(m.since)}</td>
                        <td className="px-5 py-3 text-navy/60">
                          {m.lastOpenedAt ? formatDate(m.lastOpenedAt) : m.records > 0 ? 'Opened' : 'Never'}
                        </td>
                        {data.product.isCourse && (
                          <td className="px-5 py-3">
                            {m.percent === null ? (
                              <span className="text-navy/40">—</span>
                            ) : (
                              <span className="inline-flex items-center gap-2">
                                <span className="h-1.5 w-20 overflow-hidden rounded-full bg-bg-soft">
                                  <span className="block h-full rounded-full bg-primary" style={{ width: `${m.percent}%` }} />
                                </span>
                                <span className="font-semibold text-navy">{m.percent}%</span>
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <p className="text-[12.5px] text-navy/40">
            “Through a plan” isn’t a record per person — it’s the rule that everyone on that plan or above opens this product, so those
            people leave the list when their plan ends. A purchase, a trial and access given by the team are real records, one per person.
            {data.product.isCourse && ' Progress is blank for a student who never ticked a lesson.'}
          </p>
        </>
      )}
    </div>
  )
}
