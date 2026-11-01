import { useState } from 'react'
import Button from '../ui/Button'
import { CARD, INPUT, SMALL_BUTTON } from './styles'
import type { AdminPlan, AdminPlanDraft } from '../../modules/admin/types'
import type { PlanEntitlements } from '../../modules/commerce/types/membership'
import { MEMBER_PAGE_TEMPLATES } from '../../modules/find/memberPageTemplates'

interface Props {
  plan: AdminPlan | null
  nextRank: number
  yearlyDiscountPercent: number
  onSave: (draft: AdminPlanDraft) => Promise<void>
  onCancel: () => void
}

const LABEL = 'mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-navy/40'
const CHECK = 'flex items-start gap-2.5 text-[13.5px] text-navy'

const dollars = (cents: number | null | undefined) => (cents == null ? '' : String(cents / 100))
const toNumber = (value: string) => (value.trim() === '' ? null : Number(value))

// Create or edit a plan: name, order and status; prices (monthly, yearly,
// optional sale prices); the Pricing card texts; and what it unlocks.
export default function PlanEditor({ plan, nextRank, yearlyDiscountPercent, onSave, onCancel }: Props) {
  const isFreePlan = plan?.slug === 'free'
  const [name, setName] = useState(plan?.name ?? '')
  const [description, setDescription] = useState(plan?.description ?? '')
  const [rank, setRank] = useState(String(plan?.rank ?? nextRank))
  const [status, setStatus] = useState<AdminPlan['status']>(plan?.status ?? 'hidden')
  const [kind, setKind] = useState<'paid' | 'free' | 'request'>(plan?.is_free ? 'free' : plan?.price_on_request ? 'request' : 'paid')
  const [monthly, setMonthly] = useState(dollars(plan?.monthly_cents))
  const [yearly, setYearly] = useState(dollars(plan?.yearly_cents))
  const [monthlySale, setMonthlySale] = useState(dollars(plan?.monthly_sale_cents))
  const [yearlySale, setYearlySale] = useState(dollars(plan?.yearly_sale_cents))
  const [features, setFeatures] = useState((plan?.features ?? []).join('\n'))
  const [highlighted, setHighlighted] = useState(plan?.highlighted ?? false)
  const [ent, setEnt] = useState<PlanEntitlements>(plan?.entitlements ?? {})
  const [courses, setCourses] = useState((plan?.entitlements?.academyDiscount?.courses ?? []).join('\n'))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const suggestedYearly = monthly && Number(monthly) > 0 ? Math.round(Number(monthly) * 12 * (1 - yearlyDiscountPercent / 100)) : null
  const academy = ent.academyDiscount

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const entitlements: PlanEntitlements = {
        ...ent,
        academyDiscount: academy
          ? { ...academy, courses: academy.scope === 'selected' ? courses.split('\n').map((c) => c.trim()).filter(Boolean) : [] }
          : undefined,
      }
      await onSave({
        id: plan?.id,
        name,
        description,
        rank: Number(rank),
        status,
        isFree: kind === 'free',
        priceOnRequest: kind === 'request',
        monthly: kind === 'paid' ? toNumber(monthly) : null,
        yearly: kind === 'paid' ? toNumber(yearly) : null,
        monthlySale: kind === 'paid' ? toNumber(monthlySale) : null,
        yearlySale: kind === 'paid' ? toNumber(yearlySale) : null,
        features: features.split('\n').map((f) => f.trim()).filter(Boolean),
        highlighted,
        entitlements,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save the plan.')
      setSaving(false)
    }
  }

  return (
    <div className={`${CARD} space-y-7 p-6`}>
      <h2 className="font-display text-lg font-bold text-navy">{plan ? `Edit “${plan.name}”` : 'New plan'}</h2>

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={LABEL}>Name</span>
          <input className={INPUT} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block">
          <span className={LABEL}>Order</span>
          <input className={INPUT} type="number" min={0} max={1000} value={rank} onChange={(e) => setRank(e.target.value)} />
          <span className="mt-1 block text-[12px] text-navy/40">Lower first. A higher number = a higher plan (used for “Pro or above”).</span>
        </label>
        <label className="block sm:col-span-2">
          <span className={LABEL}>Short description</span>
          <input className={INPUT} value={description} maxLength={240} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="block">
          <span className={LABEL}>Status</span>
          <select className={INPUT} value={status} disabled={isFreePlan} onChange={(e) => setStatus(e.target.value as AdminPlan['status'])}>
            <option value="active">Offered — shown on the Pricing page</option>
            <option value="hidden">Hidden — not offered; can still be given</option>
            <option value="disabled">Disabled — no new members</option>
          </select>
          {isFreePlan && <span className="mt-1 block text-[12px] text-navy/40">Free is every member without a plan, so it stays offered.</span>}
        </label>
        <label className={`${CHECK} self-end pb-2.5`}>
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={highlighted} onChange={(e) => setHighlighted(e.target.checked)} />
          Highlight this plan on the Pricing page
        </label>
      </section>

      <section>
        <span className={LABEL}>Price</span>
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ['paid', 'Paid'],
              ['free', 'Free'],
              ['request', 'Price on request'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              disabled={isFreePlan && id !== 'free'}
              onClick={() => setKind(id)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-40 ${
                kind === id ? 'bg-primary text-white' : 'bg-bg-soft text-navy/60 hover:text-navy'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {kind === 'paid' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-[13px] font-semibold text-navy">Monthly (US$)</span>
              <input className={`${INPUT} mt-1`} type="number" min={0} step="0.01" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-[13px] font-semibold text-navy">Yearly (US$)</span>
              <input className={`${INPUT} mt-1`} type="number" min={0} step="0.01" value={yearly} placeholder="No yearly option" onChange={(e) => setYearly(e.target.value)} />
              {suggestedYearly !== null && (
                <button type="button" onClick={() => setYearly(String(suggestedYearly))} className="mt-1 text-[12px] font-semibold text-primary hover:underline">
                  Use ${suggestedYearly} (12 months − {yearlyDiscountPercent}%)
                </button>
              )}
            </label>
            <label className="block">
              <span className="text-[13px] font-semibold text-navy">Monthly sale price (optional)</span>
              <input className={`${INPUT} mt-1`} type="number" min={0} step="0.01" value={monthlySale} placeholder="No promotion" onChange={(e) => setMonthlySale(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-[13px] font-semibold text-navy">Yearly sale price (optional)</span>
              <input className={`${INPUT} mt-1`} type="number" min={0} step="0.01" value={yearlySale} placeholder="No promotion" onChange={(e) => setYearlySale(e.target.value)} />
            </label>
            <p className="text-[12px] text-navy/45 sm:col-span-2">
              A sale price shows the regular price struck through. Once plans are sold, a new price applies to new subscribers; current ones keep the
              price they signed up with.
            </p>
          </div>
        )}
      </section>

      <section>
        <span className={LABEL}>What this plan unlocks</span>
        <div className="space-y-4 rounded-xl bg-bg-soft/60 p-4">
          <label className="block">
            <span className="text-[13px] font-semibold text-navy">Member page (/p/…) — editing by the member</span>
            <select
              className={`${INPUT} mt-1`}
              value={ent.memberPage ?? ''}
              onChange={(e) => setEnt({ ...ent, memberPage: (e.target.value || undefined) as PlanEntitlements['memberPage'] })}
            >
              <option value="">No</option>
              <option value="partial">Part of the page</option>
              <option value="full">The whole page</option>
            </select>
            <span className="mt-1 block text-[12px] text-navy/40">Part: a ready-made model as it is, one featured item, no numbers. Whole: sections, look, address, numbers.</span>
          </label>
          {ent.memberPage && (
            <div>
              <span className="text-[13px] font-semibold text-navy">Page models this plan allows</span>
              <span className="mb-2 block text-[12px] text-navy/40">None ticked = all models.</span>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {MEMBER_PAGE_TEMPLATES.map((t) => {
                  const list = ent.pageTemplates ?? []
                  return (
                    <label key={t.id} className={CHECK}>
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 accent-primary"
                        checked={list.includes(t.id)}
                        onChange={(e) => {
                          const next = e.target.checked ? [...list, t.id] : list.filter((x) => x !== t.id)
                          setEnt({ ...ent, pageTemplates: next.length ? next : undefined })
                        }}
                      />
                      <span className="text-[13px] text-navy/75">{t.name.en}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
          <label className={CHECK}>
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-primary"
              checked={ent.prioritySupport === true}
              onChange={(e) => setEnt({ ...ent, prioritySupport: e.target.checked || undefined })}
            />
            Priority support (their conversations stand out in Admin → Support)
          </label>
          <label className={CHECK}>
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-primary"
              checked={ent.pageInsights === true}
              onChange={(e) => setEnt({ ...ent, pageInsights: e.target.checked || undefined })}
            />
            What visitors looked for on their page (searches, including the ones that found nothing)
          </label>
          <label className={CHECK}>
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-primary"
              checked={ent.includesAll === true}
              onChange={(e) => setEnt({ ...ent, includesAll: e.target.checked || undefined })}
            />
            Includes every Workspace, calculator and download (no purchase needed while subscribed)
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-navy">Discount on Workspaces bought one by one (%)</span>
            <input
              className={`${INPUT} mt-1 max-w-[160px]`}
              type="number"
              min={0}
              max={100}
              value={ent.workspaceDiscountPercent ?? ''}
              placeholder="None"
              onChange={(e) => setEnt({ ...ent, workspaceDiscountPercent: Number(e.target.value) || undefined })}
            />
          </label>
          <div>
            <label className={CHECK}>
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-primary"
                checked={Boolean(academy)}
                onChange={(e) => setEnt({ ...ent, academyDiscount: e.target.checked ? { percent: 10, scope: 'all', courses: [] } : undefined })}
              />
              Discount on Academy courses (applies once the Academy exists)
            </label>
            {academy && (
              <div className="mt-3 grid gap-3 pl-6 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[13px] font-semibold text-navy">Discount (%)</span>
                  <input
                    className={`${INPUT} mt-1`}
                    type="number"
                    min={1}
                    max={100}
                    value={academy.percent}
                    onChange={(e) => setEnt({ ...ent, academyDiscount: { ...academy, percent: Number(e.target.value) } })}
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-semibold text-navy">On</span>
                  <select
                    className={`${INPUT} mt-1`}
                    value={academy.scope}
                    onChange={(e) => setEnt({ ...ent, academyDiscount: { ...academy, scope: e.target.value as 'all' | 'selected' } })}
                  >
                    <option value="all">Every course</option>
                    <option value="selected">Only these courses</option>
                  </select>
                </label>
                {academy.scope === 'selected' && (
                  <label className="block sm:col-span-2">
                    <span className="text-[13px] font-semibold text-navy">Courses (one per line)</span>
                    <textarea className={`${INPUT} mt-1`} rows={3} value={courses} onChange={(e) => setCourses(e.target.value)} />
                  </label>
                )}
              </div>
            )}
          </div>
          <p className="text-[12px] text-navy/45">
            Which articles a plan reads is set on each article, in Studio → Knowledge Engine → “Who can read it” (that plan or above). Which products a plan opens is set in the “Included” tab.
          </p>
        </div>
      </section>

      <section>
        <label className="block">
          <span className={LABEL}>Pricing card — what's included (one per line)</span>
          <textarea className={INPUT} rows={6} value={features} onChange={(e) => setFeatures(e.target.value)} />
        </label>
      </section>

      {error && <p className="text-[13.5px] text-red-500">{error}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} className={SMALL_BUTTON}>
          Cancel
        </Button>
        <Button type="button" disabled={saving} onClick={() => void save()} className={SMALL_BUTTON}>
          {saving ? 'Saving…' : 'Save plan'}
        </Button>
      </div>
    </div>
  )
}
