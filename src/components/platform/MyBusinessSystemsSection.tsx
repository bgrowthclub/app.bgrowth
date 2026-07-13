import { FolderOpen } from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'
import Grid from '../layout/Grid'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import ProductLibraryCard from '../systems/ProductLibraryCard'
import { useOwnedProducts } from '../../lib/productLibrary'
import { useIdentity } from '../../modules/identity/mock/MockIdentityProvider'

export default function MyBusinessSystemsSection() {
  const { user } = useIdentity()
  const owned = useOwnedProducts(user)

  return (
    <div>
      <SectionHeader
        eyebrow="Your Workspaces"
        title="My Workspaces"
        className="mb-6"
        action={
          <Button to="/platform/my-systems" variant="secondary" className="!px-4 !py-2.5 !text-[13px]">
            View All
          </Button>
        }
      />

      {owned.length > 0 ? (
        <Grid cols={3}>
          {owned.slice(0, 3).map((product) => (
            <ProductLibraryCard key={product.slug} product={product} />
          ))}
        </Grid>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="No Workspaces yet."
          description="Browse the catalog to find your first Workspace."
          action={<Button to="/systems">Browse Workspaces</Button>}
        />
      )}
    </div>
  )
}
