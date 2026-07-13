import { useEffect, useState } from 'react'
import SectionHeader from '../ui/SectionHeader'
import Grid from '../layout/Grid'
import BusinessSystemCard from '../systems/BusinessSystemCard'
import { productService } from '../../modules/commerce/services/ProductService'
import { pairProductsWithSystems, systemForCard } from '../../lib/publishedCatalog'
import type { PublishedSystemProduct } from '../../lib/publishedCatalog'

// A sibling to RelatedSystemsPanel (BusinessSystem-based, still used
// nowhere a Product exists), not a variant of it — this one resolves
// relationships Studio's Website tab actually set on the Product
// (`relatedProductIds`) via ProductService.getRelated(), never a hardcoded
// list. Reuses BusinessSystemCard for any related product that resolves to
// a real BusinessSystem, same adapter pattern as ProductPage itself.
export default function RelatedProductsPanel({ productId }: { productId: string }) {
  const [related, setRelated] = useState<PublishedSystemProduct[]>([])

  useEffect(() => {
    let cancelled = false
    productService.getRelated(productId).then((products) => {
      if (!cancelled) setRelated(pairProductsWithSystems(products))
    })
    return () => {
      cancelled = true
    }
  }, [productId])

  if (related.length === 0) return null

  return (
    <div>
      <SectionHeader eyebrow="Related Products" title="You might also need" className="mb-8" />
      <Grid cols={3}>
        {related.map((pair) => (
          <BusinessSystemCard key={pair.product.id} system={systemForCard(pair)} />
        ))}
      </Grid>
    </div>
  )
}
