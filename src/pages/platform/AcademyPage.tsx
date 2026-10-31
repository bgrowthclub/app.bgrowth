import { useEffect, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import Grid from '../../components/layout/Grid'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import ProductLibraryCard from '../../components/systems/ProductLibraryCard'
import StudioWorkspaceCard from '../../components/systems/StudioWorkspaceCard'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { useOwnedProductsState } from '../../lib/productLibrary'
import { loadStudioWorkspaceProducts } from '../../lib/publishedCatalog'
import type { Product } from '../../modules/commerce/types/product'

// BGrowth Academy™ inside the member area (31/10/2026) — until now a
// placeholder. Two things, in the order someone studying needs them: the
// courses they own, and the ones they could take next.
//
// Academy teaches the decision and hands over the Growth System that does
// the work (VISION.md, "Growth Systems, not courses") — so a course that is
// finished points the student at a product, never the other way round.
export default function AcademyPage() {
  const { user } = useIdentity()
  const owned = useOwnedProductsState(user)
  const myCourses = owned.products.filter((p) => p.type === 'Course')

  const [catalog, setCatalog] = useState<Product[] | null>(null)
  useEffect(() => {
    let cancelled = false
    loadStudioWorkspaceProducts()
      .then((products: Product[]) => !cancelled && setCatalog(products.filter((p) => p.type === 'Course')))
      .catch(() => !cancelled && setCatalog([]))
    return () => {
      cancelled = true
    }
  }, [])

  const mine = new Set(myCourses.map((c) => c.slug))
  const available = (catalog ?? []).filter((c) => !mine.has(c.slug))

  return (
    <div className="space-y-10">
      <SEO
        title="Academy"
        description="Learn what a goal actually involves before you commit — BGrowth Academy inside your member area."
        path="/platform/academy"
      />

      <div>
        <p className="eyebrow">Academy</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">Learn</h1>
        <p className="mt-3 max-w-xl text-[15px] text-navy/55">
          A course shows you what a goal really involves — and ends by handing you the tools that do the work.
        </p>
      </div>

      <section>
        <h2 className="font-display text-xl font-bold text-navy">Your courses</h2>
        {owned.status === 'loading' ? (
          <p className="py-10 text-[14px] text-navy/40">Loading…</p>
        ) : myCourses.length > 0 ? (
          <Grid className="mt-5">
            {myCourses.map((product) => (
              <ProductLibraryCard key={product.slug} product={product} size="library" />
            ))}
          </Grid>
        ) : (
          <div className="mt-5">
            <EmptyState
              icon={GraduationCap}
              title="No courses yet."
              description="Pick one below, or find it in the catalog."
              action={<Button to="/systems">Browse the catalog</Button>}
            />
          </div>
        )}
      </section>

      {available.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold text-navy">Courses you can take</h2>
          <Grid className="mt-5">
            {available.map((product) => (
              <StudioWorkspaceCard key={product.slug} product={product} />
            ))}
          </Grid>
        </section>
      )}
    </div>
  )
}
