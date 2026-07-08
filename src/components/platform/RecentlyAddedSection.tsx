import SectionHeader from '../ui/SectionHeader'
import Grid from '../layout/Grid'
import BusinessSystemCard from '../systems/BusinessSystemCard'
import { getRecentlyAddedSystems } from '../../data/systems'

export default function RecentlyAddedSection() {
  const recent = getRecentlyAddedSystems(4)
  if (recent.length === 0) return null

  return (
    <div>
      <SectionHeader eyebrow="Fresh in the catalog" title="Recently Added" className="mb-6" />
      <Grid cols={4}>
        {recent.map((system) => (
          <BusinessSystemCard key={system.slug} system={system} />
        ))}
      </Grid>
    </div>
  )
}
