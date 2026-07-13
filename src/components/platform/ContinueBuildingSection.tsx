import SectionHeader from '../ui/SectionHeader'
import ProductLibraryCard from '../systems/ProductLibraryCard'
import { getUserProducts } from '../../lib/productLibrary'
import { useIdentity } from '../../modules/identity/mock/MockIdentityProvider'

export default function ContinueBuildingSection() {
  const { user } = useIdentity()
  if (!user) return null

  // The first owned product stands in for "most recently opened" — there
  // is no real activity log yet (see modules/identity/mock/mockUser.ts).
  const product = getUserProducts(user)[0]
  if (!product) return null

  return (
    <div>
      <SectionHeader eyebrow="Pick up where you left off" title="Continue Your Workspace" className="mb-6" />
      <ProductLibraryCard product={product} size="featured" />
    </div>
  )
}
