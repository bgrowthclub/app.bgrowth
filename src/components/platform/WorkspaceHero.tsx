import Avatar from '../ui/Avatar'
import MembershipBadge from './MembershipBadge'
import { getTimeOfDayGreeting } from '../../lib/greeting'
import { useIdentity } from '../../modules/identity/mock/MockIdentityProvider'
import { getMockMembershipPlanByTier } from '../../modules/commerce/mock/mockMembershipPlans'

export default function WorkspaceHero() {
  const { user } = useIdentity()
  const greeting = getTimeOfDayGreeting()

  // ProtectedRoute guarantees an authenticated member by the time this
  // renders, but stay defensive rather than assume it.
  if (!user) return null

  const firstName = user.firstName ?? user.displayName.split(' ')[0]
  const membershipName = getMockMembershipPlanByTier(user.membership)?.name ?? 'Free Plan'

  return (
    <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Avatar size="lg" />
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-navy md:text-3xl">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-[13px] text-navy/45">
            {user.rewards} reward points · Level {user.achievements.level}
          </p>
        </div>
      </div>
      <MembershipBadge tier={membershipName} />
    </div>
  )
}
