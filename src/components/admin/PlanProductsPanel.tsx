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
  // Which cell is open for editing. A cell is a quiet label until it is
  // opened: 600 identical dropdowns saying "Full price" buried the handful
  // of cells that actually say something (02/11/2026).
  const [open, setOpen] = useState<{ productId: string; planId: string } | null>(null)
  const [onlySet, setOnlySet] = useState(false)

  function load() {
    adminService
      .listPlanProducts()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the products.'))
  }
  useEffect(load, [])

  const planName = useMemo(() => new Map((data?.plans ?? []).map((p) => [p.id, p.name])), [data])
  const planRank = useMemo(() => new Map((data?.plans ?? []).map((p) => [p.id, p.rank])), [data])
  // "Has something set" reads both tables, the same two the cells read.
  const configured = (productId: string) =>
    Boolean(data?.included[productId]) || Object.keys(data?.pricing?.[productId] ?? {}).length > 0
  const visible = (data?.products ?? []).filter(
    (p) =>
      (kind === 'all' || p.content_type === kind) &&
      (!filter || p.name.toLowerCase().includes(filter.toLowerCase())) &&
      // Free products have nothing to set, so the filter hides them too.
      (!onlySet || configured(p.id)),
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
      setOpen(null)
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
      setOpen(null)
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

  // What a plan column adds up to, so the header answers "what does this
  // plan actually open?" without reading 100 rows.
  function summaryOf(plan: { id: string; rank: number; includesAll: boolean }) {
    if (plan.includesAll) return 'everything'
    let included = 0
    let offers = 0
    for (const product of data?.products ?? []) {
      if (product.is_free) continue
      const cell = cellOf(product.id, plan)
      if (cell.state === 'included' || cell.state === 'inherited') included += 1
      else if (cell.state === 'offer' && cell.offer && cell.offer.kind !== 'full') offers += 1
    }
    return [included ? `${included} included` : '', offers ? `${offers} priced` : ''].filter(Boolean).join(' · ')
  }

  return (
    <div className="space-y-5">
      <details className={`${CARD} px-5 py-3 text-[13.5px] text-navy/70`}>
        <summary className="cursor-pointer font-semibold text-navy">How it works</summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>Each cell says what that plan does with that product: includes it, takes a % off, charges a fixed price, or nothing.</li>
          <li>A dash means full price — nothing special. Click any cell to change it.</li>
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
        <label className="flex items-center gap-2 text-[13px] text-navy/70">
          <input type="checkbox" className="h-4 w-4 accent-primary" checked={onlySet} onChange={(e) => setOnlySet(e.target.checked)} />
          Only products with something set
        </label>
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
        <table className="w-full table-fixed text-left" style={{ minWidth: 300 + data.plans.length * 130 }}>
          <thead>
            <tr className="border-b border-navy/[0.07]">
              <th scope="col" className="w-[300px] px-5 py-3 text-[11.5px] font-bold uppercase tracking-wide text-navy/45">
                Product
              </th>
              {data.plans.map((p) => {
                const sum = summaryOf(p)
                return (
                  <th key={p.id} scope="col" className="px-3 py-3 align-top">
                    <span className="block text-[11.5px] font-bold uppercase tracking-wide text-navy/45">{p.name}</span>
                    <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal text-navy/35">
                      {sum || 'nothing set'}
                    </span>
                  </th>
                )
              })}
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
                    const isOpen = open?.productId === product.id && open?.planId === plan.id
                    const editing = draft && draft.productId === product.id && draft.planId === plan.id

                    if (cell.state === 'all')
                      return (
                        <td key={plan.id} className="px-3 py-3 align-top">
                          <span className={pillClass('blue')}>Everything</span>
                        </td>
                      )

                    if (cell.state === 'inherited')
                      return (
                        <td key={plan.id} className="px-3 py-3 align-top">
                          <span className="text-[12px] text-navy/40">via {cell.from}</span>
                        </td>
                      )

                    // Closed: a quiet label. Full price is the default, so it
                    // shows as a dash and lets the cells that mean something
                    // be the only thing you see.
                    if (!isOpen) {
                      const offer = cell.state === 'offer' ? cell.offer : undefined
                      const label =
                        cell.state === 'included' ? (
                          <span className={pillClass('green')}>Included</span>
                        ) : offer?.kind === 'percent' ? (
                          <span className={pillClass('amber')}>{offer.percent}% off</span>
                        ) : offer?.kind === 'fixed' ? (
                          <span className={pillClass('amber')}>${((offer.priceCents ?? 0) / 100).toFixed(2)}</span>
                        ) : (
                          <span className="text-navy/25">—</span>
                        )
                      return (
                        <td key={plan.id} className="px-3 py-2 align-top">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setError(null)
                              setDraft(null)
                              setOpen({ productId: product.id, planId: plan.id })
                            }}
                            className="w-full rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-navy/10 hover:bg-bg-soft disabled:opacity-40"
                            aria-label={`What ${plan.name} does with ${product.name}`}
                          >
                            {label}
                          </button>
                        </td>
                      )
                    }

                    return (
                      <td key={plan.id} className="px-3 py-2 align-top">
                        <select
                          autoFocus
                          className="w-full rounded-lg border border-primary/40 bg-white px-2 py-1.5 text-[12.5px] text-navy"
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
                              className="w-16 rounded-lg border border-navy/10 px-2 py-1 text-[12.5px] text-navy"
                              value={draft.value}
                              inputMode="decimal"
                              placeholder={draft.kind === 'percent' ? '20' : '9.00'}
                              aria-label={draft.kind === 'percent' ? 'Percentage off' : 'Fixed price in dollars'}
                              onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitDraft()
                                if (e.key === 'Escape') {
                                  setDraft(null)
                                  setOpen(null)
                                }
                              }}
                            />
                            <span className="text-[12px] text-navy/45">{draft.kind === 'percent' ? '%' : 'USD'}</span>
                            <button type="button" disabled={busy} onClick={commitDraft} className="text-[12px] font-semibold text-primary disabled:opacity-40">
                              Save
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setOpen(null)}
                            className="mt-1 text-[11.5px] font-semibold text-navy/40 hover:text-navy"
                          >
                            Close
                          </button>
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
