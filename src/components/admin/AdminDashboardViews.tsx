import { Link } from 'react-router-dom'

const TAB = 'rounded-full px-4 py-2 text-[13px] font-semibold transition-colors'

// The views of Admin → Dashboard. Members lives on the Dashboard itself;
// Sales is still its own page — both show this row so either can be reached
// from the other.
const VIEWS = [
  { id: 'members', label: 'Members', to: '/platform/admin/dashboard' },
  { id: 'sales', label: 'Sales', to: '/platform/admin/sales' },
  { id: 'engagement', label: 'Engagement', soon: true },
] as const

export default function AdminDashboardViews({ active }: { active: 'members' | 'sales' }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Dashboard view">
      {VIEWS.map((v) =>
        v.id === active ? (
          <span key={v.id} role="tab" aria-selected className={`${TAB} bg-grad-primary text-white shadow-softer`}>
            {v.label}
          </span>
        ) : 'to' in v ? (
          <Link key={v.id} to={v.to} role="tab" aria-selected={false} className={`${TAB} border border-navy/10 bg-white text-navy/60 hover:border-primary/20`}>
            {v.label}
          </Link>
        ) : (
          <span key={v.id} className={`${TAB} cursor-default border border-dashed border-navy/10 text-navy/35`} title="Coming soon">
            {v.label} · soon
          </span>
        ),
      )}
    </div>
  )
}
