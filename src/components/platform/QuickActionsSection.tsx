import { Link } from 'react-router-dom'
import { LayoutGrid, GraduationCap, Store, Newspaper, Lock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import DashboardSectionTitle from './DashboardSectionTitle'
import { useComingSoonModal } from './ComingSoonModalProvider'

interface QuickAction {
  label: string
  description: string
  to: string
  icon: LucideIcon
  tone: string
  // Mirrors platformNav.ts's `locked` flag — these tiles link into the same
  // sections the Sidebar locks, so they stay consistent with it rather than
  // offering a bypass. See ComingSoonModalProvider.
  locked?: boolean
}

// Static, page-specific config — small and only used here, so it stays
// inline rather than becoming its own data file (unlike platformNav.ts,
// which is shared across every route).
const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Browse the catalog', description: 'Find your next Workspace.', to: '/systems', icon: LayoutGrid, tone: 'bg-blue-50 text-primary' },
  // Unlocked since 31/10/2026 (the Academy has real courses) — this tile
  // had stayed locked by mistake until 19/11/2026.
  { label: 'Continue learning', description: 'Your courses in the Academy.', to: '/platform/academy', icon: GraduationCap, tone: 'bg-violet-50 text-violet-600' },
  { label: 'Knowledge', description: 'Free guides and articles.', to: '/knowledge', icon: Newspaper, tone: 'bg-emerald-50 text-emerald-600' },
  { label: 'Marketplace', description: 'Templates and add-ons.', to: '/platform/marketplace', icon: Store, tone: 'bg-amber-50 text-amber-600', locked: true },
]

// 19/11/2026, the owner's design: four tiles in a row, a colored icon on the
// left and two lines of text.
const cardClass = 'group flex items-center gap-3.5 rounded-2xl border border-navy/[0.07] bg-white p-4 text-left shadow-softer transition-all duration-300'

export default function QuickActionsSection() {
  const { openComingSoon } = useComingSoonModal()

  return (
    <div>
      <DashboardSectionTitle title="Quick actions" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((action) => {
          const inner = (
            <>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${action.locked ? 'bg-navy/[0.04] text-navy/40' : action.tone}`}>
                <action.icon size={18} strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[14px] font-semibold text-navy">
                  {action.label}
                  {action.locked && <Lock size={11} className="shrink-0 text-navy/30" aria-label="Coming soon" />}
                </span>
                <span className="block text-[12.5px] text-navy/45">{action.locked ? 'Coming soon' : action.description}</span>
              </span>
            </>
          )
          return action.locked ? (
            <button key={action.label} type="button" onClick={() => openComingSoon(action.label)} className={`${cardClass} opacity-80 hover:opacity-100`}>
              {inner}
            </button>
          ) : (
            <Link key={action.label} to={action.to} className={`${cardClass} hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-soft`}>
              {inner}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
