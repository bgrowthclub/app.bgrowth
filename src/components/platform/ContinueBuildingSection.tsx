import SectionHeader from '../ui/SectionHeader'
import ProductLibraryCard from '../systems/ProductLibraryCard'
import { useOwnedProducts } from '../../lib/productLibrary'
import { useIdentity } from '../../modules/identity/mock/MockIdentityProvider'

export default function ContinueBuildingSection() {
  const { user } = useIdentity()
  // The first owned product stands in for "most recently opened" — there
  // is no real activity log yet (see modules/identity/mock/mockUser.ts).
  const product = useOwnedProducts(user)[0]
  if (!user || !product) return null

  return (
    <div>
      <SectionHeader eyebrow="Pick up where you left off" title="Continue Your Workspace" className="mb-6" />
      <ProductLibraryCard product={product} size="featured" />
    </div>
  )
}
