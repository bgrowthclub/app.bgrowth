import { useState } from 'react'
import { GraduationCap } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import Grid from '../../components/layout/Grid'
import ProductLibraryCard from '../../components/systems/ProductLibraryCard'
import MyWorkspacesTabs from '../../components/platform/MyWorkspacesTabs'
import ViewToggle from '../../components/ui/ViewToggle'
import type { CardView } from '../../components/ui/ViewToggle'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { useOwnedProductsState } from '../../lib/productLibrary'

// The "Courses" tab of My Workspaces (decided 31/10/2026): a course shows up
// where the member looks for what they own, and opening one takes them to
// the Academy, where it is read. Same cards as the other tabs — this is the
// list of what they have, not the place they study.
export default function MyCoursesPage() {
  const { user } = useIdentity()
  const state = useOwnedProductsState(user)
  const courses = state.products.filter((p) => p.type === 'Course')
  const [view, setView] = useState<CardView>('grid')

  return (
    <div className="space-y-8">
      <SEO title="My courses" description="Every course you own, in one place — pick up where you left off." path="/platform/courses" />

      <MyWorkspacesTabs />

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your courses</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">My courses</h1>
          <p className="mt-3 max-w-lg text-[15px] text-navy/55">Open any course to pick up where you left off. They open in the Academy.</p>
        </div>
        {courses.length > 0 && <ViewToggle value={view} onChange={setView} className="hidden sm:flex" />}
      </div>

      {state.status === 'loading' ? (
        <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
      ) : courses.length > 0 ? (
        view === 'grid' ? (
          <Grid>
            {courses.map((product) => (
              <ProductLibraryCard key={product.slug} product={product} size="library" />
            ))}
          </Grid>
        ) : (
          <div className="max-w-2xl space-y-4">
            {courses.map((product) => (
              <ProductLibraryCard key={product.slug} product={product} size="library" />
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="No courses yet."
          description="A course teaches you what a goal involves, and hands you the Growth System that does the work."
          action={<Button to="/systems">Browse the catalog</Button>}
        />
      )}
    </div>
  )
}
