import { NavLink } from 'react-router-dom'
import { FileText, FolderOpen } from 'lucide-react'

// "Workspaces | Documents" — the two halves of the single My Workspaces
// sidebar entry (decided 16/10/2026): the products the member can open
// (/platform/my-systems) and what they filled in (/platform/documents).
// Both routes and pages stay as they were; this only links them.
const TABS = [
  { label: 'Workspaces', to: '/platform/my-systems', icon: FolderOpen },
  { label: 'Documents', to: '/platform/documents', icon: FileText },
]

export default function MyWorkspacesTabs({ className = '' }: { className?: string }) {
  return (
    <nav aria-label="My Workspaces" className={`no-print ${className}`}>
      <div className="inline-flex gap-1 rounded-xl border border-navy/10 bg-white p-1 shadow-softer">
        {TABS.map(({ label, to, icon: Icon }) => (
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
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
