import Grid from '../layout/Grid'
import FeatureCard from '../systems/FeatureCard'
import type { SystemBenefit } from '../../types/system'

export default function FeatureGrid({ features }: { features: SystemBenefit[] }) {
  return (
    <Grid cols={3}>
      {features.map((f) => (
        <FeatureCard key={f.title} feature={f} />
      ))}
    </Grid>
  )
}
