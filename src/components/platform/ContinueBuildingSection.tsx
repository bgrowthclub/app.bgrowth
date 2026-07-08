import SectionHeader from '../ui/SectionHeader'
import OwnedSystemCard from '../systems/OwnedSystemCard'
import { getSystemBySlug } from '../../data/systems'
import { useIdentity } from '../../modules/identity/mock/MockIdentityProvider'

export default function ContinueBuildingSection() {
  const { user } = useIdentity()
  if (!user) return null

  // The first owned product stands in for "most recently opened" — there
  // is no real activity log yet (see modules/identity/mock/mockUser.ts).
  const lastOpenedSlug = user.ownedProducts[0]
  const system = lastOpenedSlug ? getSystemBySlug(lastOpenedSlug) : undefined
  if (!system) return null

  return (
    <div>
      <SectionHeader eyebrow="Pick up where you left off" title="Continue Building" className="mb-6" />
      <OwnedSystemCard system={system} size="featured" />
    </div>
  )
}
