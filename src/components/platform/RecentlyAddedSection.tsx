import { useEffect, useState } from 'react'
import SectionHeader from '../ui/SectionHeader'
import Grid from '../layout/Grid'
import BusinessSystemCard from '../systems/BusinessSystemCard'
import { loadRecentlyAddedSystemProducts, systemForCard } from '../../lib/publishedCatalog'
import type { PublishedSystemProduct } from '../../lib/publishedCatalog'

// Reads the Product Catalog Foundation (via ProductCatalogService.getAll(),
// see lib/publishedCatalog.ts's loadRecentlyAddedSystemProducts) instead of
// data/systems.ts's own catalog order — keeps price/featured on this card
// from ever drifting from the one Product Catalog.
export default function RecentlyAddedSection() {
  const [recent, setRecent] = useState<PublishedSystemProduct[]>([])

  useEffect(() => {
    let cancelled = false
    loadRecentlyAddedSystemProducts(4).then((pairs) => {
      if (!cancelled) setRecent(pairs)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (recent.length === 0) return null

  return (
    <div>
      <SectionHeader eyebrow="Fresh in the catalog" title="Recently Added" className="mb-6" />
      <Grid cols={4}>
        {recent.map((pair) => (
          <BusinessSystemCard key={pair.product.id} system={systemForCard(pair)} />
        ))}
      </Grid>
    </div>
  )
}
