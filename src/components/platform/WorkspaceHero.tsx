import { Link } from 'react-router-dom'
import { Crown, FolderOpen } from 'lucide-react'
import { getTimeOfDayGreeting } from '../../lib/greeting'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { useMemberPlan } from '../../modules/account/useMemberPlan'
import { useOwnedProducts } from '../../lib/productLibrary'

// The top of the member Dashboard (19/11/2026, the owner's design): a pill,
// the greeting with the member's first name in blue, and two cards with real
// numbers — their plan and how many products they have. Nothing invented.
export default function WorkspaceHero() {
  const { user } = useIdentity()
  const { current, loading } = useMemberPlan()
  const owned = useOwnedProducts(user).filter((p) => !p.expired)

  // ProtectedRoute guarantees an authenticated member by the time this
  // renders, but stay defensive rather than assume it.
  if (!user) return null
  const firstName = user.firstName ?? user.displayName.split(' ')[0]

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/[0.05] px-3 py-1 text-[12px] font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden /> Members area
        </p>
        <h1 className="mt-3 font-display text-[28px] font-bold tracking-tight text-navy md:text-[34px]">
          {getTimeOfDayGreeting()}, <span className="text-primary">{firstName}</span> 👋
        </h1>
        <p className="mt-1.5 text-[14.5px] text-navy/55">Pick up where you left off or explore what your account opens.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:w-auto">
        <Link
          to="/platform/membership"
          className="flex items-center gap-3 rounded-2xl border border-navy/[0.07] bg-white px-4 py-3 shadow-softer transition-colors hover:border-primary/20"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <Crown size={17} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-[11.5px] text-navy/45">Your plan</span>
            <span className="block truncate text-[14px] font-bold text-navy">{loading ? '…' : current?.name ?? 'Free'}</span>
          </span>
        </Link>
        <Link
          to="/platform/my-systems"
          className="flex items-center gap-3 rounded-2xl border border-navy/[0.07] bg-white px-4 py-3 shadow-softer transition-colors hover:border-primary/20"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary">
            <FolderOpen size={17} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-[11.5px] text-navy/45">Your products</span>
            <span className="block text-[14px] font-bold text-navy">{owned.length}</span>
          </span>
        </Link>
      </div>
    </div>
  )
}
