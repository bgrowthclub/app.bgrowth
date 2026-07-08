import { Link } from 'react-router-dom'
import { LayoutGrid, GraduationCap, Store, Compass, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'
import Grid from '../layout/Grid'

interface QuickAction {
  label: string
  description: string
  to: string
  icon: LucideIcon
}

// Static, page-specific config — small and only used here, so it stays
// inline rather than becoming its own data file (unlike platformNav.ts,
// which is shared across every route).
const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Browse Business Systems', description: 'Find your next system.', to: '/systems', icon: LayoutGrid },
  { label: 'Continue Learning', description: 'Pick up in the Academy.', to: '/platform/academy', icon: GraduationCap },
  { label: 'Explore Marketplace', description: 'Partner tools & offers.', to: '/platform/marketplace', icon: Store },
  { label: 'Find Professionals', description: 'Vetted pros by industry.', to: '/platform/find', icon: Compass },
  { label: 'Open BGrowth App', description: 'Run your systems.', to: '/systems', icon: Sparkles },
]

export default function QuickActionsSection() {
  return (
    <div>
      <SectionHeader eyebrow="Get moving" title="Quick Actions" className="mb-6" />
      <Grid cols={4}>
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="group flex flex-col rounded-xl3 border border-navy/[0.06] bg-white p-5 shadow-softer transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-glow"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-bg-soft text-primary transition-colors duration-300 group-hover:bg-grad-primary group-hover:text-white">
              <action.icon size={18} strokeWidth={2} />
            </div>
            <p className="mt-3.5 text-[13.5px] font-semibold text-navy">{action.label}</p>
            <p className="mt-1 text-[12px] text-navy/45">{action.description}</p>
          </Link>
        ))}
      </Grid>
    </div>
  )
}
