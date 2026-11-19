import { NavLink } from 'react-router-dom'
import { FileText, FolderOpen, GraduationCap } from 'lucide-react'
import { useOwnedProductsState } from '../../lib/productLibrary'
import { useIdentity } from '../../modules/identity/IdentityContext'

// "Workspaces | Courses | Documents" — the three halves of the single My
// Workspaces sidebar entry (16/10/2026; Courses added 31/10/2026): the
// products the member can open, the courses they own, and what they filled
// in. A course is listed here, where someone looks for what they have, but
// opens in the Academy, where it is read. Since 19/11/2026 the first two
// show how many there are (counted from the member's own library).
const TABS = [
  { label: 'Workspaces', to: '/platform/my-systems', icon: FolderOpen, count: 'workspaces' as const },
  { label: 'Courses', to: '/platform/courses', icon: GraduationCap, count: 'courses' as const },
  { label: 'Documents', to: '/platform/documents', icon: FileText, count: null },
]

export default function MyWorkspacesTabs({ className = '' }: { className?: string }) {
  const { user } = useIdentity()
  const { products, status } = useOwnedProductsState(user)
  const counts = status === 'ready' ? { workspaces: products.filter((p) => p.type !== 'Course').length, courses: products.filter((p) => p.type === 'Course').length } : null

  return (
    <nav aria-label="My Workspaces" className={`no-print ${className}`}>
      <div className="inline-flex gap-1 rounded-xl border border-navy/10 bg-white p-1 shadow-softer">
        {TABS.map(({ label, to, icon: Icon, count }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-colors ${
                isActive ? 'bg-bg-soft text-primary' : 'text-navy/55 hover:text-navy'
              }`
            }
          >
            <Icon size={15} strokeWidth={2} />
            {label}
            {counts && count && <span className="text-navy/40">({counts[count]})</span>}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
