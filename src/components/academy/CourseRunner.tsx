import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import CourseLessonBody from './CourseLessonBody'
import { CARD } from '../workspace/styles'
import { courseLessons, courseMinutes, formatMinutes } from '../../modules/academy/types'
import { nextLessonId } from '../../modules/academy/progress'
import { useCourseProgress } from '../../modules/academy/useCourseProgress'
import type { CourseContent } from '../../modules/academy/types'
import type { WorkspaceInstanceRow } from '../../modules/workspace/types/portal'

interface Props {
  course: CourseContent
  productId: string
  userId: string | undefined
  records: WorkspaceInstanceRow[]
  reloadRecords: () => void
}

// BGrowth Academy™ — the student's reading experience (Etapa A, 28/10/2026):
// the modules and lessons on the left, the lesson on the right, a progress
// bar, "mark as done" and "next lesson". The course resumes where the
// student stopped. There is no quiz and no certificate yet, by decision —
// both can be added without changing what is saved here.
export default function CourseRunner({ course, productId, userId, records, reloadRecords }: Props) {
  const { data, summary, toggle, open, saveError } = useCourseProgress(course, productId, userId, records, reloadRecords)
  const all = useMemo(() => courseLessons(course), [course])
  const [currentId, setCurrentId] = useState<string | null>(null)

  // First render lands on where they stopped; after that they steer.
  useEffect(() => {
    if (currentId === null && summary?.resumeLessonId) setCurrentId(summary.resumeLessonId)
  }, [currentId, summary])

  const current = all.find((l) => l.lesson.id === currentId) ?? all[0]
  if (!current) return <p className={`${CARD} p-8 text-center text-[14px] text-navy/50`}>This course has no lessons yet.</p>

  const go = (id: string) => {
    setCurrentId(id)
    open(id)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isDone = Boolean(data.done[current.lesson.id])
  const next = nextLessonId(course, current.lesson.id)
  const index = all.findIndex((l) => l.lesson.id === current.lesson.id)
  const previous = index > 0 ? all[index - 1].lesson.id : null
  const total = courseMinutes(all.map((l) => l.lesson))

  return (
    <div>
      {/* How far along they are — the first thing someone returning wants. */}
      <div className={`${CARD} p-5`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[13.5px] font-semibold text-navy">
            {summary?.done ?? 0} of {summary?.total ?? all.length} lessons
          </p>
          <p className="text-[12.5px] text-navy/45">
            {summary?.complete ? 'Course complete' : `${summary?.percent ?? 0}% done`}
            {total > 0 && ` · ${formatMinutes(total)} in all`}
          </p>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-navy/[0.07]">
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${summary?.percent ?? 0}%` }} />
        </div>
        {saveError && <p className="mt-2.5 text-[12.5px] text-red-500">{saveError}</p>}
      </div>

      {course.intro && index === 0 && !isDone && (
        <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-navy/70">{course.intro}</p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:items-start">
        {/* The map of the course. On a phone it sits above the lesson. */}
        <nav className={`${CARD} max-h-[70vh] overflow-y-auto p-3 lg:sticky lg:top-24`} aria-label="Course contents">
          {course.modules.map((module, mi) => {
            const mp = summary?.modules.find((m) => m.moduleId === module.id)
            return (
              <div key={module.id} className={mi > 0 ? 'mt-4' : undefined}>
                <p className="px-2 text-[11.5px] font-bold uppercase tracking-wide text-navy/40">
                  {module.title}
                  {mp && mp.total > 0 && <span className="ml-1.5 font-semibold normal-case tracking-normal text-navy/30">{mp.done}/{mp.total}</span>}
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {module.lessons.map((lesson) => {
                    const done = Boolean(data.done[lesson.id])
                    const here = lesson.id === current.lesson.id
                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => go(lesson.id)}
                          aria-current={here ? 'true' : undefined}
                          className={`flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-[13.5px] transition-colors ${
                            here ? 'bg-primary/[0.08] font-semibold text-navy' : 'text-navy/65 hover:bg-bg-soft'
                          }`}
                        >
                          <span
                            className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                              done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-navy/20 text-transparent'
                            }`}
                          >
                            <Check size={11} strokeWidth={3} aria-hidden />
                          </span>
                          <span className="min-w-0">{lesson.title}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>

        <article className={`${CARD} p-5 md:p-8`}>
          <p className="text-[11.5px] font-bold uppercase tracking-wide text-primary/80">{current.module.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="font-display text-2xl font-bold leading-tight text-navy">{current.lesson.title}</h2>
            {current.lesson.minutes ? (
              <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-navy/40">
                <Clock size={13} aria-hidden /> {formatMinutes(current.lesson.minutes)}
              </span>
            ) : null}
          </div>

          <div className="mt-6">
            <CourseLessonBody blocks={current.lesson.blocks ?? []} />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-navy/[0.06] pt-6">
            <button
              type="button"
              onClick={() => toggle(current.lesson.id)}
              aria-pressed={isDone}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-semibold transition-colors ${
                isDone ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              <Check size={16} strokeWidth={3} aria-hidden /> {isDone ? 'Done' : 'Mark as done'}
            </button>
            {next && (
              <button
                type="button"
                onClick={() => go(next)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-[14px] font-semibold text-navy transition-colors hover:border-primary/30"
              >
                Next lesson <ChevronRight size={16} aria-hidden />
              </button>
            )}
            {previous && (
              <button
                type="button"
                onClick={() => go(previous)}
                className="ml-auto inline-flex items-center gap-1 text-[13.5px] font-semibold text-navy/50 transition-colors hover:text-navy"
              >
                <ChevronLeft size={15} aria-hidden /> Previous
              </button>
            )}
          </div>
        </article>
      </div>

      {summary?.complete && (
        <p className="mt-6 rounded-xl2 bg-emerald-50 px-5 py-4 text-center text-[14px] font-semibold text-emerald-700">
          You finished every lesson in this course.
        </p>
      )}
    </div>
  )
}
