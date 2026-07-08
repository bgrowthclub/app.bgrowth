import Avatar from '../ui/Avatar'
import MembershipBadge from './MembershipBadge'
import { getTimeOfDayGreeting } from '../../lib/greeting'
import { MOCK_MEMBER_NAME } from '../../data/memberMock'

export default function WorkspaceHero() {
  const greeting = getTimeOfDayGreeting()
  const firstName = MOCK_MEMBER_NAME.split(' ')[0]

  return (
    <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Avatar size="lg" />
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-navy md:text-3xl">
            {greeting}, {firstName}
          </h1>
        </div>
      </div>
      <MembershipBadge />
    </div>
  )
}
