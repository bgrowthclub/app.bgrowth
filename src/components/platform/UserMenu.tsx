import { Link, useNavigate } from 'react-router-dom'
import { User, Sparkles, Settings, LifeBuoy, LogOut } from 'lucide-react'
import Popover from './Popover'
import Avatar from '../ui/Avatar'
import { useIdentity } from '../../modules/identity/mock/MockIdentityProvider'

// Sign Out is wired to BGrowth Identity™'s mock session (see
// MockIdentityProvider) — it ends the mock session and returns to the
// Homepage, per Milestone 5.2's Workspace Integration requirement.
// Profile/Membership/Settings/Help all route to real (placeholder-content)
// pages.
export default function UserMenu() {
  const { user, logout } = useIdentity()
  const navigate = useNavigate()
  const displayName = user?.displayName ?? 'Guest Member'

  const handleSignOut = () => {
    logout()
    navigate('/')
  }

  return (
    <Popover
      panelClassName="w-52 p-1.5"
      trigger={({ open, toggle }) => (
        <button
          onClick={toggle}
          aria-label={`Account menu — ${displayName}`}
          aria-haspopup="true"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-bg-soft"
        >
          <Avatar size="sm" />
          <span className="hidden text-[13px] font-semibold text-navy/80 sm:inline">{displayName}</span>
        </button>
      )}
    >
      <Link
        to="/platform/profile"
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-navy/70 hover:bg-bg-soft"
      >
        <User size={15} />
        My Profile
      </Link>
      <Link
        to="/platform/membership"
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-navy/70 hover:bg-bg-soft"
      >
        <Sparkles size={15} />
        Membership
      </Link>
      <Link
        to="/platform/settings"
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-navy/70 hover:bg-bg-soft"
      >
        <Settings size={15} />
        Settings
      </Link>
      <Link
        to="/platform/support"
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-navy/70 hover:bg-bg-soft"
      >
        <LifeBuoy size={15} />
        Help
      </Link>
      <div className="my-1 border-t border-navy/[0.06]" />
      <button
        onClick={handleSignOut}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-navy/70 hover:bg-bg-soft"
      >
        <LogOut size={15} />
        Sign Out
      </button>
    </Popover>
  )
}
