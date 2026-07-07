import Grid from '../layout/Grid'
import BusinessModuleCard from './BusinessModuleCard'
import type { BusinessSystem } from '../../types/system'

interface Props {
  system: BusinessSystem
  actionable?: boolean // false → preview cards with no "Open Module" link (used on the sales/product page)
}

export default function BusinessModuleGrid({ system, actionable = true }: Props) {
  return (
    <Grid cols={3}>
      {system.modules.map((m) => (
        <BusinessModuleCard key={m.id} module={m} to={actionable ? `/system/${system.slug}/module/${m.id}` : undefined} />
      ))}
    </Grid>
  )
}
