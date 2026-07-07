import SectionHeader from '../ui/SectionHeader'
import Grid from '../layout/Grid'
import BusinessSystemCard from '../systems/BusinessSystemCard'
import { getRelatedSystems } from '../../data/systems'
import type { BusinessSystem } from '../../types/system'

export default function RelatedSystemsPanel({ system }: { system: BusinessSystem }) {
  const related = getRelatedSystems(system)
  if (related.length === 0) return null
  return (
    <div>
      <SectionHeader eyebrow="Related Systems" title="You might also need" className="mb-8" />
      <Grid cols={3}>
        {related.map((r) => (
          <BusinessSystemCard key={r.slug} system={r} />
        ))}
      </Grid>
    </div>
  )
}
