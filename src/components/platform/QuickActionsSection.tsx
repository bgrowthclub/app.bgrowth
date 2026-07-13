import { Link } from 'react-router-dom'
import { LayoutGrid, GraduationCap, Store, Compass, Sparkles, Lock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'
import Grid from '../layout/Grid'
import { useComingSoonModal } from './ComingSoonModalProvider'

interface QuickAction {
  label: string
  description: string
  to: string
  icon: LucideIcon
  // Mirrors platformNav.ts's `locked` flag — these tiles link into the same
  // sections the Sidebar locks, so they stay consistent with it rather than
  // offering a bypass. See ComingSoonModalProvider.
  locked?: boolean
}

// Static, page-specific config — small and only used here, so it stays
// inline rather than becoming its own data file (unlike platformNav.ts,
// which is shared across every route).
const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Browse Workspaces', description: 'Find your next Workspace.', to: '/systems', icon: LayoutGrid },
  {
    label: 'Continue Learning',
    description: 'Pick up in the Academy.',
    to: '/platform/academy',
    icon: GraduationCap,
    locked: true,
  },
  {
    label: 'Explore Marketplace',
    description: 'Partner tools & offers.',
    to: '/platform/marketplace',
    icon: Store,
    locked: true,
  },
  {
    label: 'Find Professionals',
    description: 'Vetted pros by industry.',
    to: '/platform/find',
    icon: Compass,
    locked: true,
  },
  { label: 'Open BGrowth App', description: 'Run your Workspaces.', to: '/systems', icon: Sparkles, locked: true },
]

const cardClass =
  'group relative flex flex-col rounded-xl3 border border-navy/[0.06] bg-white p-5 shadow-softer transition-all duration-300'
const iconTileClass = 'grid h-10 w-10 place-items-center rounded-xl bg-bg-soft text-primary transition-colors duration-300'

export default function QuickActionsSection() {
  const { openComingSoon } = useComingSoonModal()

  return (
    <div>
      <SectionHeader eyebrow="Get moving" title="Quick Actions" className="mb-6" />
      <Grid cols={4}>
        {QUICK_ACTIONS.map((action) =>
          action.locked ? (
            <button
              key={action.label}
              type="button"
              onClick={openComingSoon}
              className={`${cardClass} text-left opacity-70 hover:border-primary/15 hover:opacity-100`}
            >
              <div className={iconTileClass}>
                <action.icon size={18} strokeWidth={2} />
              </div>
              <div className="mt-3.5 flex items-center gap-1.5">
                <p className="text-[13.5px] font-semibold text-navy">{action.label}</p>
                <Lock size={11} className="shrink-0 text-navy/30" />
              </div>
              <p className="mt-1 text-[12px] text-navy/45">{action.description}</p>
            </button>
          ) : (
            <Link
              key={action.label}
              to={action.to}
              className={`${cardClass} hover:-translate-y-1 hover:border-primary/15 hover:shadow-glow`}
            >
              <div className={`${iconTileClass} group-hover:bg-grad-primary group-hover:text-white`}>
                <action.icon size={18} strokeWidth={2} />
              </div>
              <p className="mt-3.5 text-[13.5px] font-semibold text-navy">{action.label}</p>
              <p className="mt-1 text-[12px] text-navy/45">{action.description}</p>
            </Link>
          ),
        )}
      </Grid>
    </div>
  )
}
