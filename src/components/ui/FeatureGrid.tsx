import Grid from '../layout/Grid'
import FeatureCard from '../systems/FeatureCard'
import type { SystemFeature } from '../../types/system'

export default function FeatureGrid({ features }: { features: SystemFeature[] }) {
  return (
    <Grid cols={3}>
      {features.map((f) => (
        <FeatureCard key={f.title} feature={f} />
      ))}
    </Grid>
  )
}
