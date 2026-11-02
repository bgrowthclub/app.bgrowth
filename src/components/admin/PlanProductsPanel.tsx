import { useEffect, useMemo, useState } from 'react'
import Button from '../ui/Button'
import { CARD, INPUT, SMALL_BUTTON, pillClass } from './styles'
import { adminService } from '../../modules/admin/adminService'
import type { AdminPlanOffer, AdminPlanProducts } from '../../modules/admin/types'

const KIND: Record<string, string> = { workspace: 'Workspace', calculator: 'Calculator', pdf: 'Download', course: 'Course' }

type Draft = { productId: string; planId: string; kind: 'percent' | 'fixed'; value: string }

// Admin → Plans → Included: for every product and every plan, what that plan
// does with it — includes it, takes a % off, charges a fixed price, or
// nothing (02/11/2026, Portal migration 0075; the table replaces the three
// discount fields that used to live apart and disagree).
//
// Two tables behind one screen, on purpose: "Included" is
// product_plan_access, because that is what the database checks before
// opening a product, and it flows upward (included in Starter = included in
// everything above). The paid offers are plan_product_pricing, one row per
// (plan, product). A cell that inherits inclusion from a lower plan is shown,
// not editable — you change it where it was set, so the two can never
// contradict each other.
export default function PlanProductsPanel() {
  const [data, setData] = useState<AdminPlanProducts | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [kind, setKind] = useState('all')
  const [picked, setPicked] = useState<string[]>([])
  const [bulkPlan, setBulkPlan] = useState('')
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)

  function load() {
    adminService
      .listPlanProducts()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the products.'))
  }
  useEffect(load, [])

  const planName = useMemo(() => new Map((data?.plans ?? []).map((p) => [p.id, p.name])), [data])
  const planRank = useMemo(() => new Map((data?.plans ?? []).map((p) => [p.id, p.rank])), [data])
  const visible = (data?.products ?? []).filter(
    (p) => (kind === 'all' || p.content_type === kind) && (!filter || p.name.toLowerCase().includes(filter.toLowerCase())),
  )

  async function apply(ids: string[], planId: string | null) {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await adminService.setPlanProducts(ids, planId)
      setData((d) => {
        if (!d) return d
        const included = { ...d.included }
        for (const id of ids) {
          if (planId) included[id] = planId
          else delete included[id]
        }
        return { ...d, included }
      })
      setPicked([])
      setNotice(planId ? `${ids.length} product(s) included in ${planName.get(planId)} and above.` : `${ids.length} product(s) taken out of the plans.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save.')
    } finally {
      setBusy(false)
    }
  }

  async function saveOffer(productId: string, planId: string, offer: { kind: 'percent' | 'fixed' | 'full' | 'none'; percent?: number; priceCents?: number }) {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await adminService.setPlanPricing(productId, planId, offer)
      setData((d) => {
        if (!d) return d
        const pricing = { ...(d.pricing ?? {}) }
        const row = { ...(pricing[productId] ?? {}) }
        if (offer.kind === 'none') delete row[planId]
        else
          row[planId] = {
            kind: offer.kind,
            percent: offer.kind === 'percent' ? offer.percent ?? null : null,
            priceCents: offer.kind === 'fixed' ? offer.priceCents ?? null : null,
          }
        pricing[productId] = row
        return { ...d, pricing }
      })
      setDraft(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save.')
    } finally {
      setBusy(false)
    }
  }

  function commitDraft() {
    if (!draft) return
    const n = Number(draft.value.replace(',', '.'))
    if (!Number.isFinite(n)) return setError(draft.kind === 'percent' ? 'Type a percentage.' : 'Type a price.')
    if (draft.kind === 'percent') return void saveOffer(draft.productId, draft.planId, { kind: 'percent', percent: Math.round(n) })
    return void saveOffer(draft.productId, draft.planId, { kind: 'fixed', priceCents: Math.round(n * 100) })
  }

  if (!data) return error ? <p className="text-[14px] text-red-500">{error}</p> : <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
  if (!data.ready) return <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-700">Run the database update (Portal migration 0061) to use this tab.</p>

  const allPlans = data.plans.filter((p) => p.includesAll)
  const pricingReady = data.pricingReady !== false

  // What this plan does with this product, worked out from both tables.
  function cellOf(productId: string, plan: { id: string; rank: number; includesAll: boolean }) {
    const includedAt = data?.included[productId]
    const includedRank = includedAt ? planRank.get(includedAt) ?? null : null
    if (plan.includesAll) return { state: 'all' as const }
    if (includedAt === plan.id) return { state: 'included' as const }
    if (includedRank !== null && plan.rank > includedRank) return { state: 'inherited' as const, from: planName.get(includedAt as string) ?? '' }
    const offer: AdminPlanOffer | undefined = data?.pricing?.[productId]?.[plan.id]
    return { state: 'offer' as const, offer }
  }

  return (
    <div className="space-y-5">
      <details className={`${CARD} px-5 py-3 text-[13.5px] text-navy/70`}>
        <summary className="cursor-pointer font-semibold text-navy">How it works</summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>Each cell says what that plan does with that product: includes it, takes a % off, charges a fixed price, or nothing.</li>
          <li>“Included” flows upward: included in Starter means included in every plan above it. A higher plan therefore shows “included via Starter” and is changed where it was set.</li>
          <li>Members open an included product while their plan is active. If they cancel they lose access; what they filled in is kept and comes back if they subscribe again.</li>
          <li>A discount or fixed price applies when they buy it one by one. If two live plans offer different prices, the member pays the lowest.</li>
          <li>Free products stay free for everyone. Anything already bought keeps its price — this never changes a past purchase.</li>
          {allPlans.length > 0 && <li>{allPlans.map((p) => p.name).join(', ')} includes every product (set in the plan).</li>}
        </ul>
      </details>

      {!pricingReady && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-700">
          Run the database update (Portal migration 0075) to set discounts and fixed prices. Inclusion already works.
        </p>
      )}
      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}
      {error && <p className="text-[13.5px] text-red-500">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <input className={`${INPUT} max-w-xs`} value={filter} placeholder="Search products…" onChange={(e) => setFilter(e.target.value)} />
        <select className={`${INPUT} max-w-[180px]`} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filter by type">
          <option value="all">All types</option>
          <option value="workspace">Workspaces</option>
          <option value="course">Courses</option>
          <option value="calculator">Calculators</option>
          <option value="pdf">Downloads</option>
        </select>
        <span className="text-[12.5px] text-navy/40">
          {visible.length} product(s) · {data.plans.length} plan(s)
        </span>
      </div>

      {picked.length > 0 && (
        <div className={`${CARD} flex flex-wrap items-center gap-3 px-5 py-3`}>
          <span className="text-[13px] font-semibold text-navy">{picked.length} ticked →</span>
          <select className={`${INPUT} max-w-[220px]`} value={bulkPlan} onChange={(e) => setBulkPlan(e.target.value)} aria-label="Include the ticked products in">
            <option value="">Not included in any plan</option>
            {data.plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} and above
              </option>
            ))}
          </select>
          <Button type="button" disabled={busy} onClick={() => void apply(picked, bulkPlan || null)} className={SMALL_BUTTON}>
            {busy ? 'Saving…' : 'Apply'}
          </Button>
        </div>
      )}

      <div className={`${CARD} overflow-x-auto`}>
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-navy/[0.07]">
              <th scope="col" className="px-5 py-3 text-[11.5px] font-bold uppercase tracking-wide text-navy/45">
                Product
              </th>
              {data.plans.map((p) => (
                <th key={p.id} scope="col" className="px-3 py-3 text-[11.5px] font-bold uppercase tracking-wide text-navy/45">
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={data.plans.length + 1} className="p-6 text-[13.5px] text-navy/40">
                  No products.
                </td>
              </tr>
            )}
            {visible.map((product) => (
              <tr key={product.id} className="border-b border-navy/[0.05] last:border-0">
                <th scope="row" className="px-5 py-3 align-top font-normal">
                  <label className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-primary"
                      disabled={product.is_free}
                      checked={picked.includes(product.id)}
                      onChange={(e) => setPicked((ids) => (e.target.checked ? [...ids, product.id] : ids.filter((x) => x !== product.id)))}
                      aria-label={`Tick ${product.name}`}
                    />
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-semibold text-navy">{product.name}</span>
                      <span className="block text-[12px] text-navy/45">
                        {KIND[product.content_type] ?? product.content_type}
                        {product.status !== 'published' ? ` · ${product.status}` : ''}
                      </span>
                    </span>
                  </label>
                </th>

                {product.is_free ? (
                  <td colSpan={data.plans.length} className="px-3 py-3 align-top">
                    <span className={pillClass('green')}>Free for everyone</span>
                  </td>
                ) : (
                  data.plans.map((plan) => {
                    const cell = cellOf(product.id, plan)
                    const editing = draft && draft.productId === product.id && draft.planId === plan.id
                    return (
                      <td key={plan.id} className="px-3 py-3 align-top">
                        {cell.state === 'all' ? (
                          <span className={pillClass('blue')}>Everything</span>
                        ) : cell.state === 'inherited' ? (
                          <span className="text-[12.5px] text-navy/45">Included via {cell.from}</span>
                        ) : (
                          <>
                            <select
                              className="w-full rounded-lg border border-navy/10 bg-white px-2 py-1.5 text-[12.5px] text-navy"
                              disabled={busy}
                              value={cell.state === 'included' ? 'included' : cell.offer?.kind ?? 'none'}
                              aria-label={`What ${plan.name} does with ${product.name}`}
                              onChange={(e) => {
                                const v = e.target.value
                                setError(null)
                                if (v === 'included') return void apply([product.id], plan.id)
                                if (cell.state === 'included') return void apply([product.id], null)
                                if (v === 'percent' || v === 'fixed') return setDraft({ productId: product.id, planId: plan.id, kind: v, value: '' })
                                return void saveOffer(product.id, plan.id, { kind: 'none' })
                              }}
                            >
                              <option value="included">Included</option>
                              <option value="percent">% off</option>
                              <option value="fixed">Fixed price</option>
                              <option value="none">Full price</option>
                            </select>

                            {editing ? (
                              <span className="mt-1.5 flex items-center gap-1.5">
                                <input
                                  autoFocus
                                  className="w-20 rounded-lg border border-navy/10 px-2 py-1 text-[12.5px] text-navy"
                                  value={draft.value}
                                  inputMode="decimal"
                                  placeholder={draft.kind === 'percent' ? '20' : '9.00'}
                                  aria-label={draft.kind === 'percent' ? 'Percentage off' : 'Fixed price in dollars'}
                                  onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') commitDraft()
                                    if (e.key === 'Escape') setDraft(null)
                                  }}
                                />
                                <span className="text-[12px] text-navy/45">{draft.kind === 'percent' ? '%' : 'USD'}</span>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={commitDraft}
                                  className="text-[12px] font-semibold text-primary disabled:opacity-40"
                                >
                                  Save
                                </button>
                              </span>
                            ) : cell.state === 'offer' && cell.offer ? (
                              <span className="mt-1.5 block text-[12px] text-navy/55">
                                {cell.offer.kind === 'percent'
                                  ? `${cell.offer.percent}% off`
                                  : cell.offer.kind === 'fixed'
                                    ? `$${((cell.offer.priceCents ?? 0) / 100).toFixed(2)}`
                                    : 'Full price'}
                              </span>
                            ) : null}
                          </>
                        )}
                      </td>
                    )
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
