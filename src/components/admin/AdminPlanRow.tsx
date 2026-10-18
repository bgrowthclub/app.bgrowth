import { Crown } from 'lucide-react'
import { LINK_BUTTON, pillClass } from './styles'
import type { Tone } from './styles'
import { formatCents } from '../../modules/workspace/lib/bundlePrice'
import type { AdminPlan } from '../../modules/admin/types'

interface Props {
  plan: AdminPlan
  onEdit: () => void
}

const STATUS: Record<AdminPlan['status'], { label: string; tone: Tone }> = {
  active: { label: 'Offered', tone: 'green' },
  hidden: { label: 'Hidden', tone: 'gray' },
  disabled: { label: 'Disabled', tone: 'red' },
}

function price(regular: number | null, sale: number | null, per: string) {
  if (regular === null) return null
  return (
    <span>
      {sale !== null && <span className="mr-1 text-navy/35 line-through">{formatCents(regular)}</span>}
      {formatCents(sale ?? regular)}
      <span className="text-navy/40">/{per}</span>
    </span>
  )
}

// What a plan unlocks, in a few words for the list.
export function planBenefits(plan: Pick<AdminPlan, 'entitlements'>): string[] {
  const e = plan.entitlements ?? {}
  const out: string[] = []
  if (e.memberPage) out.push(e.memberPage === 'full' ? 'Member page (all)' : 'Member page (part)')
  if (e.prioritySupport) out.push('Priority support')
  if (e.workspaceDiscountPercent) out.push(`${e.workspaceDiscountPercent}% off Workspaces`)
  if (e.academyDiscount) out.push(`${e.academyDiscount.percent}% off ${e.academyDiscount.scope === 'all' ? 'the Academy' : 'some courses'}`)
  return out
}

// One plan in Admin → Plans.
export default function AdminPlanRow({ plan, onEdit }: Props) {
  const status = STATUS[plan.status]
  const benefits = planBenefits(plan)
  const members = plan.members.paid + plan.members.given

  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-bg-soft text-primary">
        <Crown size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-semibold text-navy">
          {plan.name}
          <span className={pillClass(status.tone)}>{status.label}</span>
          {plan.highlighted && <span className={pillClass('blue')}>Highlighted</span>}
        </p>
        <p className="mt-0.5 text-[12.5px] text-navy/45">
          {benefits.length ? benefits.join(' · ') : plan.is_free ? 'Every member without a plan' : 'Nothing extra set yet'}
        </p>
      </div>
      <div className="text-right text-[13.5px] font-semibold text-navy">
        {plan.is_free ? (
          'Free'
        ) : plan.price_on_request ? (
          'On request'
        ) : (
          <div className="space-y-0.5">
            {price(plan.monthly_cents, plan.monthly_sale_cents, 'mo')}
            {plan.yearly_cents !== null && <div>{price(plan.yearly_cents, plan.yearly_sale_cents, 'yr')}</div>}
          </div>
        )}
        {!plan.is_free && (
          <p className="text-[12px] font-normal text-navy/40">
            {members === 0 ? 'No members' : `${plan.members.paid} paying · ${plan.members.given} given`}
          </p>
        )}
      </div>
      <button type="button" onClick={onEdit} className={`${LINK_BUTTON} text-primary hover:bg-bg-soft`}>
        Edit
      </button>
    </div>
  )
}
