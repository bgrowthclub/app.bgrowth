import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, CheckSquare, FileText, GraduationCap, Map, Search, Users } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import Grid from '../../components/layout/Grid'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import StudioWorkspaceCard from '../../components/systems/StudioWorkspaceCard'
import ContinueLearningCard from '../../components/academy/ContinueLearningCard'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { useOwnedProductsState } from '../../lib/productLibrary'
import { loadStudioWorkspaceProducts } from '../../lib/publishedCatalog'
import { coursePath } from '../../modules/workspace/config'
import { journeyService } from '../../modules/journeys/journeyService'
import type { JourneySummary } from '../../modules/journeys/types'
import type { Product } from '../../modules/commerce/types/product'
import type { UserProduct } from '../../types/productLibrary'

// BGrowth Academy™ inside the member area, built to the owner's design
// (07/11/2026). It replaces the two plain grids that were here: a search,
// the course to pick back up, the ones in progress, and the two side
// panels from the design.
//
// WHAT IS AND ISN'T REAL. The design shows six panels; four of them have
// something behind them today and two do not. "Learning Paths" is BGrowth
// Journeys™ — the same idea, already built, so it lists real Journeys
// rather than inventing a parallel concept. "Practical Resources" and
// "Expert-Led Lessons" have no content at all, so they carry the honest
// "Coming soon" the owner chose for the Home pillars instead of a picture
// of items that don't exist. When either ships, replace its panel; nothing
// else on this page changes.
export default function AcademyPage() {
  const { user } = useIdentity()
  const owned = useOwnedProductsState(user)
  const [query, setQuery] = useState('')

  const myCourses = useMemo(() => owned.products.filter((p) => p.type === 'Course'), [owned.products])

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

  // Journeys are only visible once the site opens (portal.journeys_visible()),
  // so before launch this comes back empty for everyone but the team — the
  // panel then says so rather than looking broken.
  const [journeys, setJourneys] = useState<JourneySummary[]>([])
  useEffect(() => {
    let cancelled = false
    journeyService
      .listJourneys()
      .then((list) => !cancelled && setJourneys(list))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  const mine = new Set(myCourses.map((c) => c.slug))
  const available = (catalog ?? []).filter((c) => !mine.has(c.slug))

  const term = query.trim().toLowerCase()
  const match = (title: string, description?: string) =>
    !term || title.toLowerCase().includes(term) || (description ?? '').toLowerCase().includes(term)
  const myShown = myCourses.filter((c) => match(c.title, c.description))
  const availableShown = available.filter((c) => match(c.title, c.description))

  const featured = pickFeatured(myCourses)
  const nothingFound = Boolean(term) && myShown.length === 0 && availableShown.length === 0

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

      <label className="relative block max-w-xl">
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy/30" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search courses, topics or skills…"
          aria-label="Search courses"
          className="w-full rounded-full border border-navy/[0.09] bg-white py-3 pl-11 pr-4 text-[15px] text-navy placeholder:text-navy/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
      </label>

      {featured && !term && <FeaturedCourse product={featured} />}

      {nothingFound && (
        <p className="text-[15px] text-navy/55">
          No course matches “{query.trim()}”.{' '}
          <button type="button" onClick={() => setQuery('')} className="font-semibold text-primary hover:text-navy">
            Clear the search
          </button>
        </p>
      )}

      {(myShown.length > 0 || owned.status === 'loading') && (
        <section>
          <h2 className="font-display text-xl font-bold text-navy">Continue Learning</h2>
          {owned.status === 'loading' ? (
            <p className="py-6 text-[14px] text-navy/40">Loading…</p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myShown.map((product) => (
                <ContinueLearningCard key={product.slug} product={product} />
              ))}
            </div>
          )}
        </section>
      )}

      {owned.status === 'ready' && myCourses.length === 0 && (
        <EmptyState
          icon={GraduationCap}
          title="No courses yet."
          description="Pick one below, or find it in the catalog."
          action={<Button to="/systems?type=course">Browse the courses</Button>}
        />
      )}

      {/* items-start: each panel keeps its own height. Stretched, the short
          Learning Paths list grew to match the two panels beside it and
          ended in a block of empty white. */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <LearningPaths journeys={journeys} />
        <div className="space-y-5">
          <SoonPanel
            title="Practical Resources"
            blurb="Templates, guides and checklists to use while you study."
            items={[
              { icon: FileText, label: 'Templates', note: 'Ready to use' },
              { icon: BookOpen, label: 'Guides', note: 'Step by step' },
              { icon: CheckSquare, label: 'Checklists', note: 'Stay organized' },
            ]}
          />
          <SoonPanel
            title="Expert-Led Lessons"
            blurb="Lessons recorded by people who do this work every day."
            items={[{ icon: Users, label: 'Real-world experience', note: 'In preparation' }]}
          />
        </div>
      </div>

      {availableShown.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold text-navy">Courses you can take</h2>
          <Grid className="mt-5">
            {availableShown.map((product) => (
              <StudioWorkspaceCard key={product.slug} product={product} />
            ))}
          </Grid>
        </section>
      )}
    </div>
  )
}

/**
 * The course to pick back up: the one opened most recently that isn't
 * finished, else the one furthest along, else the first. Never a course the
 * member doesn't own — the design's big card is "where was I", not an advert.
 */
function pickFeatured(courses: UserProduct[]): UserProduct | undefined {
  if (courses.length === 0) return undefined
  const unfinished = courses.filter((c) => (c.progress?.percentComplete ?? 0) < 100)
  const pool = unfinished.length ? unfinished : courses
  return [...pool].sort((a, b) => {
    const at = a.lastOpenedAt ? Date.parse(a.lastOpenedAt) : 0
    const bt = b.lastOpenedAt ? Date.parse(b.lastOpenedAt) : 0
    if (at !== bt) return bt - at
    return (b.progress?.percentComplete ?? 0) - (a.progress?.percentComplete ?? 0)
  })[0]
}

function FeaturedCourse({ product }: { product: UserProduct }) {
  const percent = product.progress ? Math.round(product.progress.percentComplete) : null

  return (
    <section className="overflow-hidden rounded-xl2 border border-navy/[0.07] bg-gradient-to-br from-primary/[0.07] to-white">
      <div className="grid items-stretch gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <div className="px-7 py-7">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.18em] text-primary">
            {percent ? 'Pick up where you left off' : 'Start learning'}
          </p>
          <h2 className="mt-3 font-display text-[26px] font-extrabold leading-tight tracking-tight text-navy">{product.title}</h2>
          {product.description && <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-navy/60">{product.description}</p>}

          {percent !== null && (
            <p className="mt-5 flex items-center gap-3">
              <span className="h-1.5 w-40 overflow-hidden rounded-full bg-white">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
              </span>
              <span className="text-[12.5px] font-bold text-navy/55">{percent}% complete</span>
            </p>
          )}

          <Link to={coursePath(product.slug)} className="btn-primary mt-6 inline-flex items-center gap-2">
            Continue Learning
            <ArrowRight size={17} aria-hidden />
          </Link>
        </div>

        {product.coverImage && (
          <div className="relative hidden min-h-[220px] md:block">
            <img src={product.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        )}
      </div>
    </section>
  )
}

/**
 * "Learning Paths" in the design is what BGrowth Journeys™ already is: a
 * goal broken into stages you follow. It lists real Journeys rather than a
 * second, competing idea of the same thing (CLAUDE.md §8).
 */
function LearningPaths({ journeys }: { journeys: JourneySummary[] }) {
  return (
    <section className="rounded-xl2 border border-navy/[0.07] bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[19px] font-bold text-navy">Learning Paths</h2>
          <p className="mt-1 text-[13.5px] text-navy/55">A goal broken into steps you can follow — BGrowth Journeys™.</p>
        </div>
        {journeys.length > 0 && (
          <Link to="/journeys" className="shrink-0 text-[13.5px] font-semibold text-primary hover:text-navy">
            See all
          </Link>
        )}
      </div>

      {journeys.length === 0 ? (
        <p className="mt-5 text-[14px] text-navy/50">The first Journeys open with the site. They’ll appear here.</p>
      ) : (
        <ul className="mt-5 space-y-2.5">
          {journeys.slice(0, 4).map((journey) => (
            <li key={journey.id}>
              <Link
                to={`/platform/journeys/${journey.slug}`}
                className="group flex items-center gap-3.5 rounded-xl bg-bg-soft px-4 py-3 transition-colors hover:bg-primary/[0.06]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/[0.09]">
                  <Map size={17} className="text-primary" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-bold text-navy">{journey.name}</span>
                  <span className="block truncate text-[13px] text-navy/55">
                    {journey.shortDescription || `${journey.stageCount} stage${journey.stageCount === 1 ? '' : 's'}`}
                  </span>
                </span>
                <ArrowRight size={15} className="shrink-0 text-navy/25 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

interface SoonItem {
  icon: typeof FileText
  label: string
  note: string
}

/** A panel from the design whose content doesn't exist yet. It says so. */
function SoonPanel({ title, blurb, items }: { title: string; blurb: string; items: SoonItem[] }) {
  return (
    <section className="rounded-xl2 border border-navy/[0.07] bg-white p-6">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <h2 className="font-display text-[19px] font-bold text-navy">{title}</h2>
        <span className="rounded-full bg-navy/[0.06] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-navy/45">
          Coming soon
        </span>
      </div>
      <p className="mt-1 text-[13.5px] text-navy/55">{blurb}</p>

      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-3.5 rounded-xl bg-bg-soft px-4 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
              <item.icon size={16} className="text-navy/35" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-bold text-navy/70">{item.label}</span>
              <span className="block text-[12.5px] text-navy/45">{item.note}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
