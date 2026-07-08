import { FolderOpen } from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'
import Grid from '../layout/Grid'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import OwnedSystemCard from '../systems/OwnedSystemCard'
import { getOwnedSystems } from '../../data/systems'
import { useIdentity } from '../../modules/identity/mock/MockIdentityProvider'

export default function MyBusinessSystemsSection() {
  const { user } = useIdentity()
  const owned = user ? getOwnedSystems(user.ownedProducts) : []

  return (
    <div>
      <SectionHeader
        eyebrow="Your systems"
        title="My Business Systems"
        className="mb-6"
        action={
          <Button to="/platform/my-systems" variant="secondary" className="!px-4 !py-2.5 !text-[13px]">
            View All
          </Button>
        }
      />

      {owned.length > 0 ? (
        <Grid cols={3}>
          {owned.slice(0, 3).map((system) => (
            <OwnedSystemCard key={system.slug} system={system} />
          ))}
        </Grid>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="No Business Systems yet."
          description="Browse the catalog to find your first Business System."
          action={<Button to="/systems">Browse Business Systems</Button>}
        />
      )}
    </div>
  )
}
