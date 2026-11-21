import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight, Clock, GraduationCap, Rocket, Search } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import MyWorkspacesTabs from '../../components/platform/MyWorkspacesTabs'
import ViewToggle from '../../components/ui/ViewToggle'
import type { CardView } from '../../components/ui/ViewToggle'
import MyCourseCard from '../../components/academy/MyCourseCard'
import { myCourseStatus, type MyCourseStatus } from '../../components/academy/myCourseStatus'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { useOwnedProductsState } from '../../lib/productLibrary'
import { useAcademyOverview } from '../../modules/academy/useAcademyOverview'
import { formatMinutes } from '../../modules/academy/types'
import { coursePath } from '../../modules/workspace/config'

const FILTERS: { id: MyCourseStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'progress', label: 'In progress' },
  { id: 'new', label: 'Not started' },
  { id: 'done', label: 'Completed' },
]

// The "Courses" tab of My Workspaces (new look 21/11/2026, the owner's
// design): "Continue learning" — the course opened last that isn't finished,
// with its next lesson and the minutes left (only when lessons have times) —
// then every course the member has, searchable and filtered by its real
// status, and a way to the catalog's courses. Courses open in the Academy.
export default function MyCoursesPage() {
  const { user } = useIdentity()
  const state = useOwnedProductsState(user)
  const courses = useMemo(() => state.products.filter((p) => p.type === 'Course'), [state.products])
  const overview = useAcademyOverview(user?.id, courses)
  const [view, setView] = useState<CardView>('grid')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<MyCourseStatus | 'all'>('all')

  const shown = courses.filter((c) => {
    const q = query.trim().toLowerCase()
    if (q && !`${c.title} ${c.description} ${c.tag}`.toLowerCase().includes(q)) return false
    return filter === 'all' || myCourseStatus(overview.courses.get(c.productId)) === filter
  })

  // The one to pick back up: started, not finished, opened most recently.
  const current = [...courses]
    .filter((c) => myCourseStatus(overview.courses.get(c.productId)) === 'progress')
    .sort((a, b) => (b.lastOpenedAt ?? '').localeCompare(a.lastOpenedAt ?? ''))[0]
  const currentInfo = current ? overview.courses.get(current.productId) : undefined

  return (
    <div className="space-y-7">
      <SEO title="My courses" description="Every course you own, in one place — pick up where you left off." path="/platform/courses" />

      <div>
        <h1 className="font-display text-[30px] font-bold tracking-tight text-navy md:text-[38px]">My courses</h1>
        <p className="mt-2 text-[15px] text-navy/55">Track your progress and keep advancing your skills.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <MyWorkspacesTabs />
        {courses.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-w-0 items-center gap-2 rounded-xl border border-navy/10 bg-white px-3.5">
              <Search size={15} className="text-navy/35" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search my courses"
                aria-label="Search my courses"
                className="w-40 bg-transparent py-2.5 text-[13.5px] text-navy placeholder:text-navy/35 focus:outline-none sm:w-48"
              />
            </label>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  aria-pressed={filter === f.id}
                  className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                    filter === f.id ? 'bg-primary text-white' : 'border border-navy/10 bg-white text-navy/65 hover:text-navy'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <ViewToggle value={view} onChange={setView} className="hidden sm:flex" />
          </div>
        )}
      </div>

      {state.status === 'loading' ? (
        <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No courses yet."
          description="A course teaches you what a goal involves, and hands you the Growth System that does the work."
          action={<Button to="/systems?type=course">Browse courses</Button>}
        />
      ) : (
        <>
          {current && currentInfo && (
            <section className="grid overflow-hidden rounded-[24px] border border-navy/[0.07] bg-white shadow-softer md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <div className="aspect-[16/9] bg-navy md:aspect-auto">
                {current.coverImage ? (
                  <img src={current.coverImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full min-h-[180px] w-full place-items-center bg-gradient-to-br from-navy to-primary/70 text-white">
                    <GraduationCap size={44} strokeWidth={1.5} aria-hidden />
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center gap-5 p-6 sm:p-7 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <p className="w-fit rounded-md bg-blue-50 px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wide text-primary">Continue learning</p>
                  <h2 className="mt-3 font-display text-[22px] font-bold leading-snug text-navy sm:text-[24px]">{current.title}</h2>
                  {currentInfo.nextLesson && (
                    <Link to={coursePath(current.slug)} className="mt-3 block">
                      <span className="block text-[12.5px] text-navy/50">
                        Next lesson · Module {currentInfo.nextLesson.moduleNumber}
                      </span>
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[15px] font-semibold text-navy hover:text-primary">
                        {currentInfo.nextLesson.title} <ChevronRight size={16} aria-hidden />
                      </span>
                    </Link>
                  )}
                  <div className="mt-4 flex items-center gap-3">
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-navy/[0.07]">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${currentInfo.percent}%` }} />
                    </span>
                    <span className="text-[15px] font-bold text-navy">{currentInfo.percent}%</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-3 lg:w-52 lg:border-l lg:border-navy/[0.07] lg:pl-6">
                  {currentInfo.minutesLeft > 0 && (
                    <p className="flex items-center gap-2 text-[13.5px] text-navy/60">
                      <Clock size={18} className="text-navy/45" aria-hidden />
                      <span>
                        <span className="block font-bold text-navy">~{formatMinutes(currentInfo.minutesLeft)} left</span>
                        in this course
                      </span>
                    </p>
                  )}
                  <Link
                    to={coursePath(current.slug)}
                    className="inline-flex items-center justify-between gap-2 rounded-xl bg-primary px-5 py-3 text-[14.5px] font-semibold text-white shadow-softer hover:opacity-95"
                  >
                    Resume course <ArrowRight size={16} aria-hidden />
                  </Link>
                </div>
              </div>
            </section>
          )}

          <section>
            <h2 className="font-display text-[22px] font-bold text-navy">Your courses</h2>
            {shown.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-white px-5 py-8 text-center text-[14px] text-navy/50 shadow-softer">No course matches. Try another word or filter.</p>
            ) : view === 'grid' ? (
              <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {shown.map((c) => (
                  <MyCourseCard key={c.slug} product={c} overview={overview.courses.get(c.productId)} />
                ))}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {shown.map((c) => (
                  <MyCourseCard key={c.slug} product={c} overview={overview.courses.get(c.productId)} row />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4 rounded-[24px] border border-primary/15 bg-blue-50/50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-primary shadow-softer">
                <Rocket size={24} aria-hidden />
              </span>
              <div>
                <p className="font-display text-[18px] font-bold text-navy">Find more courses</p>
                <p className="text-[13.5px] text-navy/55">See every course in the catalog.</p>
              </div>
            </div>
            <Link
              to="/systems?type=course"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-white px-5 py-3 text-[14px] font-semibold text-primary hover:bg-blue-50"
            >
              Explore catalog <ArrowRight size={15} aria-hidden />
            </Link>
          </section>
        </>
      )}
    </div>
  )
}
