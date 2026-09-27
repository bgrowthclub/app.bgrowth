import { useEffect, useState } from 'react'
import SectionHeader from '../ui/SectionHeader'
import Carousel from '../ui/Carousel'
import BusinessSystemCard from '../systems/BusinessSystemCard'
import { loadRecommendedSystemProducts, systemForCard } from '../../lib/publishedCatalog'
import type { PublishedSystemProduct } from '../../lib/publishedCatalog'
import { useOwnedProducts } from '../../lib/productLibrary'
import { useIdentity } from '../../modules/identity/mock/MockIdentityProvider'

// Reads the Product Catalog Foundation (via ProductCatalogService, see
// lib/publishedCatalog.ts's loadRecommendedSystemProducts) instead of
// data/systems.ts's own relatedSystems/featured fields — and reads what the
// member owns through BGrowth Identity™ + AccessService (useOwnedProducts),
// never the legacy data/memberMock.ts list directly (see CLAUDE.md §17).
export default function RecommendedSection() {
  const { user } = useIdentity()
  const owned = useOwnedProducts(user)
  const [recommended, setRecommended] = useState<PublishedSystemProduct[]>([])

  useEffect(() => {
    let cancelled = false
    loadRecommendedSystemProducts(owned.map((p) => p.slug)).then((pairs) => {
      if (!cancelled) setRecommended(pairs)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owned.map((p) => p.slug).join(',')])

  if (recommended.length === 0) return null

  return (
    <div>
      <SectionHeader eyebrow="Based on what you own" title="Recommended For You" className="mb-6" />
      <Carousel>
        {recommended.map((pair) => (
          <div key={pair.product.id} className="w-72 shrink-0 snap-start sm:w-80">
            <BusinessSystemCard system={systemForCard(pair)} />
          </div>
        ))}
      </Carousel>
    </div>
  )
}
