import SectionHeader from '../ui/SectionHeader'
import OwnedSystemCard from '../systems/OwnedSystemCard'
import { getSystemBySlug } from '../../data/systems'
import { LAST_OPENED_SLUG } from '../../data/memberMock'

export default function ContinueBuildingSection() {
  const system = getSystemBySlug(LAST_OPENED_SLUG)
  if (!system) return null

  return (
    <div>
      <SectionHeader eyebrow="Pick up where you left off" title="Continue Building" className="mb-6" />
      <OwnedSystemCard system={system} size="featured" />
    </div>
  )
}
