import { useEffect, useState } from 'react'
import { Crown, Plus } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import EmptyState from '../../../components/ui/EmptyState'
import Button from '../../../components/ui/Button'
import AdminPlanRow from '../../../components/admin/AdminPlanRow'
import PlanEditor from '../../../components/admin/PlanEditor'
import PlanSettingsForm from '../../../components/admin/PlanSettingsForm'
import PlanSubscribersPanel from '../../../components/admin/PlanSubscribersPanel'
import { CARD, SMALL_BUTTON } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminPlan, AdminPlanDraft, AdminPlansOverview } from '../../../modules/admin/types'

type Tab = 'plans' | 'subscribers' | 'settings'

// Admin → Plans (Portal migration 0057): the plans BGrowth offers, their
// prices and what each one unlocks, plus how subscriptions behave. A plan is
// given to a member in Admin → Members. Selling them comes next (step 2).
export default function AdminPlansPage() {
  const [data, setData] = useState<AdminPlansOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('plans')
  const [editing, setEditing] = useState<AdminPlan | 'new' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    adminService
      .listPlans()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the plans.'))
  }, [])

  async function save(draft: AdminPlanDraft) {
    const saved = await adminService.savePlan(draft)
    setData((d) => {
      if (!d) return d
      const old = d.plans.find((p) => p.id === saved.id)
      const plan = { ...saved, members: old?.members ?? { paid: 0, given: 0 } }
      const plans = old ? d.plans.map((p) => (p.id === saved.id ? plan : p)) : [...d.plans, plan]
      return { ...d, plans: plans.sort((a, b) => a.rank - b.rank) }
    })
    setEditing(null)
    setNotice(`“${saved.name}” saved.`)
  }

  const nextRank = data?.plans.length ? Math.max(...data.plans.map((p) => p.rank)) + 10 : 0

  return (
    <div className="mx-auto max-w-5xl">
      <SEO title="Plans · Admin" description="Plans and subscriptions." path="/platform/admin/plans" />
      <SectionHeader
        eyebrow="Admin"
        title="Plans"
        description="The plans BGrowth offers, their prices and what each one unlocks. A plan is sold on the Pricing page once its status is “Offered”; give one to a member in Admin → Members."
        className="mb-8"
      />

      {!data ? (
        error ? (
          <EmptyState icon={Crown} title="We couldn’t load the plans." description={error} />
        ) : (
          <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
        )
      ) : !data.ready ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-700">Run the database update (Portal migration 0057) to use this page.</p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {(
                [
                  ['plans', 'Plans'],
                  ['subscribers', 'Subscribers'],
                  ['settings', 'Settings'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setTab(id)
                    setEditing(null)
                    setNotice(null)
                  }}
                  className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                    tab === id ? 'bg-primary text-white' : 'bg-bg-soft text-navy/60 hover:text-navy'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === 'plans' && !editing && (
              <Button
                type="button"
                icon={<Plus size={16} />}
                onClick={() => {
                  setNotice(null)
                  setEditing('new')
                }}
                className={SMALL_BUTTON}
              >
                New plan
              </Button>
            )}
          </div>

          {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}

          {tab === 'subscribers' ? (
            <PlanSubscribersPanel />
          ) : tab === 'settings' ? (
            <PlanSettingsForm
              settings={data.settings}
              onSave={async (s) => {
                const settings = await adminService.savePlanSettings(s)
                setData((d) => (d ? { ...d, settings } : d))
              }}
            />
          ) : (
            <>
              {editing && (
                <PlanEditor
                  key={editing === 'new' ? 'new' : editing.id}
                  plan={editing === 'new' ? null : editing}
                  nextRank={nextRank}
                  yearlyDiscountPercent={data.settings.yearlyDiscountPercent}
                  onSave={save}
                  onCancel={() => setEditing(null)}
                />
              )}
              <div className={`${CARD} divide-y divide-navy/[0.06] overflow-hidden`}>
                {data.plans.map((p) => (
                  <AdminPlanRow
                    key={p.id}
                    plan={p}
                    onEdit={() => {
                      setNotice(null)
                      setEditing(p)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
