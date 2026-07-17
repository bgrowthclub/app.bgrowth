import { useEffect, useState } from 'react'
import SectionHeader from '../ui/SectionHeader'
import Grid from '../layout/Grid'
import BusinessSystemCard from '../systems/BusinessSystemCard'
import { productCatalogService } from '../../modules/commerce/services/ProductCatalogService'
import { pairProductsWithSystems, systemForCard } from '../../lib/publishedCatalog'
import type { PublishedSystemProduct } from '../../lib/publishedCatalog'

interface Props {
  productSlugs: string[]
}

// The Article Page's "Related Products" section — resolves the article's
// own `relatedProductSlugs` (an editorial choice, set on the Knowledge
// content itself) into real Products via ProductService. A sibling to
// runtime/RelatedProductsPanel (which instead resolves a Product's own
// `relatedProductIds`) rather than a variant of it — the two start from a
// different relationship and shouldn't be forced into one component.
export default function RelatedProductsBySlug({ productSlugs }: Props) {
  const [related, setRelated] = useState<PublishedSystemProduct[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all(productSlugs.map((slug) => productCatalogService.getBySlug(slug))).then((products) => {
      if (!cancelled) {
        const found = products.filter((p): p is NonNullable<typeof p> => Boolean(p))
        setRelated(pairProductsWithSystems(found))
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSlugs.join(',')])

  if (related.length === 0) return null

  return (
    <div>
      <SectionHeader eyebrow="Related Products" title="Go deeper with a Business System™" className="mb-8" />
      <Grid cols={3}>
        {related.map((pair) => (
          <BusinessSystemCard key={pair.product.id} system={systemForCard(pair)} />
        ))}
      </Grid>
    </div>
  )
}
