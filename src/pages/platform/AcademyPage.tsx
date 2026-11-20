import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Award, BookOpen, CheckCircle2, ChevronRight, Download, FileText, GraduationCap, List, Map as MapIcon, Play, Search, Signpost } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import AcademyCourseCard from '../../components/academy/AcademyCourseCard'
import { ICONS_BY_CATEGORY } from '../../components/systems/categoryIcons'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { getProductActionRoute, useOwnedProductsState } from '../../lib/productLibrary'
import { loadStudioWorkspaceProducts } from '../../lib/publishedCatalog'
import { coursePath } from '../../modules/workspace/config'
import { studioPortalId } from '../../modules/commerce/store/studioProductRepository'
import { journeyService } from '../../modules/journeys/journeyService'
import { useAcademyOverview } from '../../modules/academy/useAcademyOverview'
import { formatMinutes } from '../../modules/academy/types'
import type { CourseOverview } from '../../modules/academy/useAcademyOverview'
import type { JourneySummary } from '../../modules/journeys/types'
import type { Product } from '../../modules/commerce/types/product'
import type { UserProduct } from '../../types/productLibrary'

const ALL_ID = 'all-courses'
const CARD = 'rounded-[24px] border border-navy/[0.07] bg-white shadow-softer'

// BGrowth Academy™ inside the member area (new look 20/11/2026, the owner's
// design): the member's real numbers (lessons marked done, certificates),
// the course to pick back up with its next lesson, their courses with real
// progress, Journeys (started or not) and the Downloads they have, then
// every course with area filters. Left out on purpose: day streaks and
// "hours studied" — neither is measured, and lesson minutes are estimates.
export default function AcademyPage() {
  const { user } = useIdentity()
  const owned = useOwnedProductsState(user)
  const myCourses = useMemo(() => owned.products.filter((p) => p.type === 'Course'), [owned.products])
  const myDownloads = useMemo(() => owned.products.filter((p) => p.type === 'Download' && !p.expired), [owned.products])
  const overview = useAcademyOverview(user?.id, myCourses)

  const [catalog, setCatalog] = useState<Product[] | null>(null)
  useEffect(() => {
    let cancelled = false
    loadStudioWorkspaceProducts()
      .then((products) => !cancelled && setCatalog(products.filter((p) => p.type === 'Course')))
      .catch(() => !cancelled && setCatalog([]))
    return () => {
      cancelled = true
    }
  }, [])

  // Journeys are visible only once the site opens (portal.journeys_visible()).
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

  const [query, setQuery] = useState('')
  const [area, setArea] = useState('All')
  const ownedBySlug = useMemo(() => new Map(myCourses.map((c) => [c.slug, c])), [myCourses])
  const areas = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of catalog ?? []) if (c.industry) counts.set(c.industry, (counts.get(c.industry) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [catalog])
  const term = query.trim().toLowerCase()
  const shown = (catalog ?? []).filter(
    (c) =>
      (area === 'All' || c.industry === area) &&
      (!term || c.title.toLowerCase().includes(term) || c.description.toLowerCase().includes(term)),
  )

  const featured = pickFeatured(myCourses, overview.courses)
  const inProgress = myCourses.filter((c) => {
    const o = overview.courses.get(c.productId)
    return o ? o.started && !o.complete : false
  }).length
  const ready = overview.status === 'ready'

  return (
    <div className="space-y-10">
      <SEO title="Academy" description="Courses that end in the tools that do the work — BGrowth Academy inside your member area." path="/platform/academy" />

      {/* Top */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="flex flex-wrap items-center gap-2 text-[13px] text-navy/50">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 font-semibold text-primary">
              <GraduationCap size={14} aria-hidden /> BGrowth Academy
            </span>
            Practical learning, built for doing
          </p>
          <h1 className="mt-3 font-display text-[30px] font-extrabold leading-tight tracking-tight text-navy md:text-[36px]">
            Learn the skills that get results.
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-navy/60">
            A course shows you what a goal really involves — and ends by handing you the tools and templates that do the work.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:w-[22rem]">
          <Stat icon={CheckCircle2} tone="text-primary bg-blue-50" label="Lessons completed" value={ready ? String(overview.lessonsDone) : '—'} />
          <Stat icon={Award} tone="text-emerald-600 bg-emerald-50" label="Certificates" value={ready ? String(overview.certificates) : '—'} />
        </div>
      </div>

      {/* The course to pick back up */}
      {featured ? (
        <FeaturedCourse product={featured} overview={overview.courses.get(featured.productId)} />
      ) : (
        owned.status === 'ready' && (
          <section className="flex flex-col items-start gap-5 rounded-[28px] bg-gradient-to-br from-navy to-[#1d2a6b] p-7 text-white sm:flex-row sm:items-center sm:p-9">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10">
              <GraduationCap size={26} aria-hidden />
            </span>
            <div className="flex-1">
              <h2 className="font-display text-[22px] font-bold">Start your first course</h2>
              <p className="mt-1 text-[14.5px] text-white/70">Pick a course below — your progress and next lesson will show up here.</p>
            </div>
            <a href={`#${ALL_ID}`} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-[14.5px] font-semibold text-white shadow-soft hover:opacity-95">
              See the courses <ArrowRight size={16} aria-hidden />
            </a>
          </section>
        )
      )}

      {/* Your courses */}
      {myCourses.length > 0 && (
        <section>
          <div className="flex items-end justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-[20px] font-bold text-navy">
              <BookOpen size={20} className="text-primary" aria-hidden /> Your courses
            </h2>
            {ready && (
              <p className="text-[13px] text-navy/50">
                {inProgress} of {myCourses.length} in progress
              </p>
            )}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {myCourses.map((course) => (
              <CourseRow key={course.productId} course={course} overview={overview.courses.get(course.productId)} />
            ))}
          </div>
        </section>
      )}

      {/* Journeys + Downloads */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section className={`${CARD} p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-display text-[18px] font-bold text-navy">
                <Signpost size={18} className="text-primary" aria-hidden /> Guided Journeys
              </h2>
              <p className="mt-1 text-[13.5px] text-navy/55">Step-by-step paths that bring lessons, tasks and Workspaces together.</p>
            </div>
            {journeys.length > 0 && (
              <Link to="/journeys" className="shrink-0 text-[13.5px] font-semibold text-primary hover:underline">
                See all
              </Link>
            )}
          </div>
          {journeys.length === 0 ? (
            <p className="mt-5 rounded-xl bg-bg-soft px-4 py-4 text-[14px] text-navy/55">The first Journeys open with the site. They’ll appear here.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {journeys.slice(0, 3).map((j) => {
                const started = overview.journeysStarted.has(studioPortalId(j.id) ?? j.id)
                return (
                  <li key={j.id}>
                    <Link
                      to={`/platform/journeys/${j.slug}`}
                      className="group flex items-center gap-3.5 rounded-2xl border border-navy/[0.07] px-4 py-3.5 transition-colors hover:border-primary/25"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary">
                        <MapIcon size={18} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-bold text-navy">{j.name}</span>
                        <span className="block truncate text-[12.5px] text-navy/55">
                          {j.stageCount} {j.stageCount === 1 ? 'stage' : 'stages'}
                          {j.shortDescription ? ` · ${j.shortDescription}` : ''}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          started ? 'bg-emerald-50 text-emerald-700' : 'bg-bg-soft text-navy/55'
                        }`}
                      >
                        {started ? 'Started' : 'Available'}
                      </span>
                      <ChevronRight size={16} className="shrink-0 text-navy/30" aria-hidden />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className={`${CARD} p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-display text-[18px] font-bold text-navy">
                <FileText size={18} className="text-emerald-600" aria-hidden /> Resources & Downloads
              </h2>
              <p className="mt-1 text-[13.5px] text-navy/55">The files and kits you have, ready to use in your projects.</p>
            </div>
          </div>
          {myDownloads.length === 0 ? (
            <div className="mt-5 rounded-xl bg-bg-soft px-4 py-4 text-[14px] text-navy/55">
              No downloads yet.{' '}
              <Link to="/systems?type=download" className="font-semibold text-primary hover:underline">
                Browse downloads
              </Link>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {myDownloads.slice(0, 3).map((d) => (
                <li key={d.productId}>
                  <Link
                    to={getProductActionRoute(d)}
                    className="group flex items-center gap-3.5 rounded-2xl border border-navy/[0.07] px-4 py-3 transition-colors hover:border-primary/25"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                      <FileText size={17} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold text-navy">{d.title}</span>
                      <span className="block truncate text-[12.5px] text-navy/50">{d.tag}</span>
                    </span>
                    <Download size={17} className="shrink-0 text-primary" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {myDownloads.length > 3 && (
            <Link
              to="/platform/my-systems"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-bg-soft px-4 py-3 text-[13.5px] font-semibold text-navy hover:bg-primary/[0.06]"
            >
              See all {myDownloads.length} downloads
            </Link>
          )}
        </section>
      </div>

      {/* Every course */}
      <section id={ALL_ID} className="scroll-mt-24">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-[22px] font-bold text-navy">All Academy courses</h2>
            <p className="mt-1 text-[14px] text-navy/55">Structured courses that end in the tools to put them to work.</p>
          </div>
          <label className="relative block lg:w-72">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/35" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses…"
              aria-label="Search courses"
              className="w-full rounded-xl border border-navy/10 bg-white py-2.5 pl-10 pr-4 text-[14px] text-navy placeholder:text-navy/35 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </label>
        </div>
        {areas.length > 1 && (
          <div className="-mx-1 mt-4 overflow-x-auto px-1 pb-1">
            <div className="flex min-w-max gap-2">
              {[['All', catalog?.length ?? 0] as [string, number], ...areas].map(([name, count]) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={area === name}
                  onClick={() => setArea(name)}
                  className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
                    area === name ? 'border-primary bg-primary text-white' : 'border-navy/10 bg-white text-navy/65 hover:text-navy'
                  }`}
                >
                  {name} ({count})
                </button>
              ))}
            </div>
          </div>
        )}
        {catalog === null ? (
          <p className="py-8 text-[14px] text-navy/40">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-bg-soft px-5 py-6 text-[14.5px] text-navy/55">
            {term ? `No course matches “${query.trim()}”.` : 'No courses here yet.'}
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((product) => {
              const mine = ownedBySlug.get(product.slug)
              return <AcademyCourseCard key={product.id} product={product} owned={mine} overview={mine ? overview.courses.get(mine.productId) : undefined} />
            })}
          </div>
        )}
      </section>
    </div>
  )
}

/** The course opened most recently that isn't finished, else the furthest along, else the first. */
function pickFeatured(courses: UserProduct[], overviews: Map<string, CourseOverview>): UserProduct | undefined {
  const live = courses.filter((c) => !c.expired)
  if (live.length === 0) return undefined
  const unfinished = live.filter((c) => !overviews.get(c.productId)?.complete)
  const pool = unfinished.length ? unfinished : live
  return [...pool].sort((a, b) => {
    const at = a.lastOpenedAt ? Date.parse(a.lastOpenedAt) : 0
    const bt = b.lastOpenedAt ? Date.parse(b.lastOpenedAt) : 0
    if (at !== bt) return bt - at
    return (overviews.get(b.productId)?.percent ?? 0) - (overviews.get(a.productId)?.percent ?? 0)
  })[0]
}

function Stat({ icon: Icon, tone, label, value }: { icon: typeof Award; tone: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-navy/[0.07] bg-white px-4 py-3 shadow-softer">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone}`}>
        <Icon size={18} aria-hidden />
      </span>
      <span>
        <span className="block text-[12px] text-navy/50">{label}</span>
        <span className="block font-display text-[18px] font-bold text-navy">{value}</span>
      </span>
    </div>
  )
}

function FeaturedCourse({ product, overview }: { product: UserProduct; overview?: CourseOverview }) {
  const percent = overview?.percent ?? (product.progress ? Math.round(product.progress.percentComplete) : 0)
  const next = overview?.nextLesson
  const started = overview?.started ?? percent > 0

  return (
    <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-navy via-[#14246b] to-[#1d2a6b] text-white shadow-glow">
      <div className="grid grid-cols-1 items-center gap-8 p-7 sm:p-9 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div>
          <p className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden /> {started ? 'Continue where you left off' : 'Start learning'}
            </span>
            {next && overview && overview.moduleCount > 1 && (
              <span className="text-[13px] text-white/70">
                Module {next.moduleNumber} of {overview.moduleCount}
              </span>
            )}
          </p>
          <h2 className="mt-4 font-display text-[26px] font-bold leading-tight sm:text-[32px]">{product.title}</h2>
          {next ? (
            <p className="mt-3 text-[15px] leading-relaxed text-white/75">
              {started ? 'Next lesson' : 'First lesson'}: <strong className="font-semibold text-white">“{next.title}”</strong>
              {next.moduleTitle && <span className="text-white/60"> · {next.moduleTitle}</span>}
            </p>
          ) : (
            product.description && <p className="mt-3 text-[15px] leading-relaxed text-white/75">{product.description}</p>
          )}
          <div className="mt-6 max-w-md">
            <p className="flex justify-between text-[13px] text-white/75">
              <span>Course progress</span>
              <span className="font-semibold text-white">{percent}% complete</span>
            </p>
            <span className="mt-2 block h-2 overflow-hidden rounded-full bg-white/15">
              <span className="block h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400" style={{ width: `${percent}%` }} />
            </span>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={coursePath(product.slug)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-[14.5px] font-semibold shadow-soft hover:opacity-95">
              <Play size={16} fill="currentColor" aria-hidden /> {started ? 'Continue lesson' : 'Start course'}
            </Link>
            <Link
              to={`/product/${product.slug}`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-[14.5px] font-semibold hover:bg-white/10"
            >
              <List size={16} aria-hidden /> Course details
            </Link>
          </div>
        </div>
        <Link to={coursePath(product.slug)} className="group relative block overflow-hidden rounded-[20px] border border-white/15 bg-white/5" aria-label={`Open ${product.title}`}>
          {product.coverImage ? (
            <img src={product.coverImage} alt="" className="aspect-video w-full object-cover opacity-80 transition-opacity group-hover:opacity-90" />
          ) : (
            <div className="grid aspect-video w-full place-items-center bg-gradient-to-br from-primary/40 to-violet-600/30">
              <GraduationCap size={56} className="text-white/40" aria-hidden />
            </div>
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent" />
          <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary shadow-glow transition-transform group-hover:scale-105">
            <Play size={26} fill="currentColor" aria-hidden />
          </span>
          {next && (
            <span className="absolute inset-x-4 bottom-3 flex items-center justify-between gap-3 text-[13px] font-semibold">
              <span className="truncate">{next.title}</span>
              {next.minutes > 0 && <span className="shrink-0 rounded-md bg-black/40 px-2 py-0.5 text-[11.5px]">{formatMinutes(next.minutes)}</span>}
            </span>
          )}
        </Link>
      </div>
    </section>
  )
}

function CourseRow({ course, overview }: { course: UserProduct; overview?: CourseOverview }) {
  const Icon = ICONS_BY_CATEGORY[course.tag] ?? GraduationCap
  const percent = overview?.percent ?? (course.progress ? Math.round(course.progress.percentComplete) : null)
  const to = course.expired ? `/product/${course.slug}` : coursePath(course.slug)

  return (
    <div className={`${CARD} flex items-center gap-4 p-4`}>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-navy">
        {course.coverImage ? (
          <img src={course.coverImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-white/50">
            <Icon size={28} aria-hidden />
          </span>
        )}
        {percent !== null && (
          <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 text-[10.5px] font-bold text-white">{percent}%</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="w-fit rounded bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-amber-700">{course.tag}</p>
        <p className="mt-1 truncate text-[15px] font-bold text-navy">{course.title}</p>
        <p className="truncate text-[12.5px] text-navy/55">
          {overview?.complete
            ? 'Completed'
            : overview?.nextLesson
              ? `Module ${overview.nextLesson.moduleNumber}: ${overview.nextLesson.moduleTitle}`
              : course.expired
                ? 'Access ended'
                : 'Not started'}
          {overview && overview.lessons > 0 ? ` · ${overview.lessons} lessons` : ''}
        </p>
        {percent !== null && (
          <span className="mt-2 block h-1.5 w-full max-w-[12rem] overflow-hidden rounded-full bg-bg-soft">
            <span className="block h-full rounded-full bg-amber-500" style={{ width: `${percent}%` }} />
          </span>
        )}
      </div>
      <Link
        to={to}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-bg-soft px-3.5 py-2 text-[13.5px] font-semibold text-navy hover:bg-primary/[0.08]"
      >
        {course.expired ? 'Buy' : overview?.started ? 'Continue' : 'Open'} <Play size={13} fill="currentColor" aria-hidden />
      </Link>
    </div>
  )
}
