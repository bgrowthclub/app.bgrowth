import { useEffect, useMemo, useState } from 'react'
import Button from '../ui/Button'
import { CARD, INPUT, SMALL_BUTTON, pillClass } from './styles'
import { adminService } from '../../modules/admin/adminService'
import type { AdminPlanProducts } from '../../modules/admin/types'

const KIND: Record<string, string> = { workspace: 'Workspace', calculator: 'Calculator', pdf: 'Download' }

// Admin → Plans → Included (Portal migration 0061): which products each plan
// opens without buying. A product included in a plan is also included in
// every higher plan; a plan with "Includes every product" opens all of them.
export default function PlanProductsPanel() {
  const [data, setData] = useState<AdminPlanProducts | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [kind, setKind] = useState('all')
  const [picked, setPicked] = useState<string[]>([])
  const [bulkPlan, setBulkPlan] = useState('')
  const [busy, setBusy] = useState(false)

  function load() {
    adminService
      .listPlanProducts()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the products.'))
  }
  useEffect(load, [])

  const planName = useMemo(() => new Map((data?.plans ?? []).map((p) => [p.id, p.name])), [data])
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

  if (!data) return error ? <p className="text-[14px] text-red-500">{error}</p> : <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
  if (!data.ready) return <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-700">Run the database update (Portal migration 0061) to use this tab.</p>

  const allPlans = data.plans.filter((p) => p.includesAll)

  return (
    <div className="space-y-5">
      <details className={`${CARD} px-5 py-3 text-[13.5px] text-navy/70`}>
        <summary className="cursor-pointer font-semibold text-navy">How it works</summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>Choose, for each product, the first plan that includes it. Higher plans include it too (e.g. “Starter” = Starter, Pro and Enterprise).</li>
          <li>Members on that plan open it without buying, while their plan is active. If they cancel, they lose access; what they filled in is kept and comes back if they subscribe again.</li>
          <li>Free products stay free for everyone. Products a member bought or was given keep working as before.</li>
          {allPlans.length > 0 && <li>{allPlans.map((p) => p.name).join(', ')} includes every product (set in the plan).</li>}
        </ul>
      </details>

      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}
      {error && <p className="text-[13.5px] text-red-500">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <input className={`${INPUT} max-w-xs`} value={filter} placeholder="Search products…" onChange={(e) => setFilter(e.target.value)} />
        <select className={`${INPUT} max-w-[180px]`} value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="all">All types</option>
          <option value="workspace">Workspaces</option>
          <option value="calculator">Calculators</option>
          <option value="pdf">Downloads</option>
        </select>
      </div>

      {picked.length > 0 && (
        <div className={`${CARD} flex flex-wrap items-center gap-3 px-5 py-3`}>
          <span className="text-[13px] font-semibold text-navy">{picked.length} ticked →</span>
          <select className={`${INPUT} max-w-[220px]`} value={bulkPlan} onChange={(e) => setBulkPlan(e.target.value)}>
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

      <div className={`${CARD} divide-y divide-navy/[0.06] overflow-hidden`}>
        {visible.length === 0 && <p className="p-6 text-[13.5px] text-navy/40">No products.</p>}
        {visible.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              disabled={p.is_free}
              checked={picked.includes(p.id)}
              onChange={(e) => setPicked((ids) => (e.target.checked ? [...ids, p.id] : ids.filter((x) => x !== p.id)))}
              aria-label={`Tick ${p.name}`}
            />
            <div className="min-w-[200px] flex-1">
              <p className="text-[13.5px] font-semibold text-navy">{p.name}</p>
              <p className="text-[12px] text-navy/45">
                {KIND[p.content_type] ?? p.content_type}
                {p.status !== 'published' ? ` · ${p.status}` : ''}
              </p>
            </div>
            {p.is_free ? (
              <span className={pillClass('green')}>Free for everyone</span>
            ) : (
              <select
                className="rounded-lg border border-navy/10 bg-white px-2 py-1.5 text-[12.5px] text-navy"
                value={data.included[p.id] ?? ''}
                disabled={busy}
                onChange={(e) => void apply([p.id], e.target.value || null)}
                aria-label={`Plan for ${p.name}`}
              >
                <option value="">Buy only</option>
                {data.plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    Included in {plan.name}+
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
