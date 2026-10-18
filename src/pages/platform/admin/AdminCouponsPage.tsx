import { useEffect, useState } from 'react'
import { Plus, TicketPercent } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import EmptyState from '../../../components/ui/EmptyState'
import Button from '../../../components/ui/Button'
import CouponForm from '../../../components/admin/CouponForm'
import { CARD, LINK_BUTTON, SMALL_BUTTON, formatDate, pillClass } from '../../../components/admin/styles'
import { formatCents } from '../../../modules/workspace/lib/bundlePrice'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminCoupon, AdminCouponDraft, AdminCouponsOverview } from '../../../modules/admin/types'

function discount(c: AdminCoupon) {
  const off = c.percentOff != null ? `${c.percentOff}% off` : c.amountOffCents != null ? `${formatCents(c.amountOffCents)} off` : 'Discount'
  const lasts = c.duration === 'forever' ? 'every payment' : c.duration === 'repeating' ? `${c.durationInMonths} months` : 'once'
  return `${off} · ${lasts}`
}

// Admin → Coupons (Sprint 123): discount codes accepted at the checkout of
// plans, Workspaces and bundles. Kept in Stripe; created and switched on/off
// here (api/admin.ts resource `coupons`).
export default function AdminCouponsPage() {
  const [data, setData] = useState<AdminCouponsOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  function load() {
    adminService
      .listCoupons()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the coupons.'))
  }

  useEffect(load, [])

  async function create(draft: AdminCouponDraft) {
    await adminService.createCoupon(draft)
    setCreating(false)
    setNotice(`Coupon ${draft.code.toUpperCase()} created. People can use it at checkout now.`)
    load()
  }

  async function toggle(c: AdminCoupon) {
    setBusy(c.id)
    setError(null)
    try {
      await adminService.setCouponActive(c.id, !c.active)
      setNotice(`${c.code} ${c.active ? 'turned off' : 'turned on'}.`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t change it.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <SEO title="Coupons · Admin" description="Discount codes." path="/platform/admin/coupons" />
      <SectionHeader
        eyebrow="Admin"
        title="Coupons"
        description="Discount codes people type at checkout — for plans, Workspaces and bundles. They live in Stripe; you can also see them there."
        className="mb-8"
      />

      {!data ? (
        error ? (
          <EmptyState icon={TicketPercent} title="We couldn’t load the coupons." description={error} />
        ) : (
          <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
        )
      ) : (
        <div className="space-y-6">
          {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}
          {error && <p className="text-[14px] text-red-500">{error}</p>}

          {creating ? (
            <CouponForm plans={data.plans} onSave={create} onCancel={() => setCreating(false)} />
          ) : (
            <div className="flex justify-end">
              <Button
                type="button"
                icon={<Plus size={16} />}
                onClick={() => {
                  setNotice(null)
                  setCreating(true)
                }}
                className={SMALL_BUTTON}
              >
                New coupon
              </Button>
            </div>
          )}

          {data.coupons.length === 0 ? (
            !creating && <EmptyState icon={TicketPercent} title="No coupons yet." description="Create one for a promotion, a giveaway or a partner." />
          ) : (
            <div className={`${CARD} divide-y divide-navy/[0.06] overflow-hidden`}>
              {data.coupons.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-[220px] flex-1">
                    <p className="font-mono text-[14.5px] font-bold tracking-wide text-navy">{c.code}</p>
                    <p className="mt-0.5 text-[12.5px] text-navy/45">
                      {discount(c)}
                      {c.appliesTo ? ` · only ${c.appliesTo.join(', ')}` : ' · everything'}
                      {c.firstTimeOnly ? ' · first purchase only' : ''}
                      {c.name && c.name !== c.code ? ` · ${c.name}` : ''}
                    </p>
                  </div>
                  <div className="text-right text-[12.5px] text-navy/55">
                    <p>
                      Used {c.timesRedeemed}
                      {c.maxRedemptions ? ` of ${c.maxRedemptions}` : ''}
                    </p>
                    <p className="text-navy/40">{c.expiresAt ? `Until ${formatDate(c.expiresAt)}` : 'No end date'}</p>
                  </div>
                  <span className={pillClass(c.active ? 'green' : 'gray')}>{c.active ? 'On' : 'Off'}</span>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void toggle(c)}
                    className={`${LINK_BUTTON} ${c.active ? 'text-red-500 hover:bg-red-50' : 'text-primary hover:bg-bg-soft'}`}
                  >
                    {c.active ? 'Turn off' : 'Turn on'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
