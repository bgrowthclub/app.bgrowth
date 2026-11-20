import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Award, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, ListTree, Lock, PanelLeftClose, PanelLeftOpen, Quote, StickyNote } from 'lucide-react'
import CourseCertificate from './CourseCertificate'
import CourseLessonBody from './CourseLessonBody'
import { CARD } from '../workspace/styles'
import { courseLessons, courseMinutes, formatMinutes } from '../../modules/academy/types'
import { nextLessonId } from '../../modules/academy/progress'
import { useCourseProgress } from '../../modules/academy/useCourseProgress'
import type { CourseContent } from '../../modules/academy/types'
import type { WorkspaceInstanceRow } from '../../modules/workspace/types/portal'

// "Module 2 · Title", unless the title already says which module it is.
function moduleLabel(n: number, title: string) {
  return /^\s*(module|m[oó]dulo)\s*\d+/i.test(title) ? title : `Module ${n} · ${title}`
}

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
// student stopped. Since 02/11/2026 a lesson can also carry a quiz block —
// a self-check that teaches, never a gate (see CourseQuiz). There is no
// certificate yet, and no passing grade: a grade belongs with the
// certificate, which is what it would decide.
export default function CourseRunner({ course, productId, userId, records, reloadRecords }: Props) {
  const { data, summary, toggle, open, saveError, note, writeNote, flushNote, addQuote, answer, answerFor } = useCourseProgress(course, productId, userId, records, reloadRecords)
  const all = useMemo(() => courseLessons(course), [course])
  const [currentId, setCurrentId] = useState<string | null>(null)
  // The passage the student just picked, and where to float the button.
  const [picked, setPicked] = useState<{ text: string; top: number; left: number } | null>(null)
  const [notesOpen, setNotesOpen] = useState(false)
  // Which modules are open in the index, and — on a phone — whether the
  // index itself is open. Only the module being read starts open.
  const [openModules, setOpenModules] = useState<string[]>([])
  const [indexOpen, setIndexOpen] = useState(false)
  // "Collapse" (20/11/2026): hides the course index on a computer so the
  // lesson takes the width. Remembered on this browser only.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem('bgrowth.course.collapsed') === '1'
    } catch {
      return false
    }
  })
  const setCollapse = (value: boolean) => {
    setCollapsed(value)
    try {
      window.localStorage.setItem('bgrowth.course.collapsed', value ? '1' : '0')
    } catch {
      /* the preference just isn't kept */
    }
  }
  const lessonRef = useRef<HTMLDivElement | null>(null)
  const keepRef = useRef<HTMLButtonElement | null>(null)

  // First render lands on where they stopped; after that they steer.
  useEffect(() => {
    if (currentId === null && summary?.resumeLessonId) setCurrentId(summary.resumeLessonId)
  }, [currentId, summary])

  // The module being read is the one open in the index; the others stay
  // closed until the student opens them.
  useEffect(() => {
    const moduleId = course.modules.find((m) => m.lessons.some((l) => l.id === currentId))?.id
    if (moduleId) setOpenModules((list) => (list.includes(moduleId) ? list : [...list, moduleId]))
  }, [course, currentId])

  // A lesson that already has notes opens with them in view.
  useEffect(() => {
    if (currentId) setNotesOpen(Boolean(data.notes?.[currentId]?.trim()))
    // Only when the lesson changes — not on every keystroke in the note.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  // A click elsewhere drops the picked passage — but NOT a click on the
  // button itself, which sits outside the lesson. Without this the button
  // could never be pressed: pressing it dropped the passage first, the
  // button disappeared, and the click never landed (31/10/2026).
  const clearPick = useCallback(() => setPicked(null), [])
  useEffect(() => {
    if (!picked) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (lessonRef.current?.contains(target) || keepRef.current?.contains(target)) return
      clearPick()
    }
    window.addEventListener('scroll', clearPick, { passive: true })
    document.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('scroll', clearPick)
      document.removeEventListener('mousedown', onDown)
    }
  }, [picked, clearPick])

  // Modules open in order (20/11/2026, the owner's choice): a module opens
  // once every lesson of the ones before it is marked done. A module with
  // no lessons never holds the next one back.
  const firstLocked = (() => {
    for (let i = 0; i < course.modules.length; i += 1) {
      if (!course.modules[i].lessons.every((l) => data.done[l.id])) return i + 1
    }
    return course.modules.length
  })()
  const isLocked = (moduleId: string) => course.modules.findIndex((m) => m.id === moduleId) >= firstLocked
  const firstOpen = all.find((l) => !data.done[l.lesson.id] && !isLocked(l.module.id)) ?? all[0]
  const wanted = all.find((l) => l.lesson.id === currentId)
  // A lesson in a locked module (an old "last opened") falls back to where
  // the student can actually continue.
  const current = wanted && !isLocked(wanted.module.id) ? wanted : firstOpen
  if (!current) return <p className={`${CARD} p-8 text-center text-[14px] text-navy/50`}>This course has no lessons yet.</p>

  const go = (id: string) => {
    const target = all.find((l) => l.lesson.id === id)
    if (target && isLocked(target.module.id)) return
    flushNote()
    setPicked(null)
    setIndexOpen(false)
    setCurrentId(id)
    open(id)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isDone = Boolean(data.done[current.lesson.id])

  // Picking a passage copies it into the note, instead of marking it where
  // it sits: the note is the student's own text, so editing the course later
  // can't move it or make it point at the wrong sentence (idea: 30/10/2026).
  const read = () => {
    const selection = typeof window === 'undefined' ? null : window.getSelection()
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null
    const range = selection.getRangeAt(0)
    const text = selection.toString().trim()
    if (text.length < 3 || !lessonRef.current?.contains(range.commonAncestorContainer)) return null
    const box = range.getBoundingClientRect()
    if (!box.width && !box.height) return null
    return { text, top: box.top, left: box.left + box.width / 2 }
  }

  const onPick = () => setPicked(read())

  const keep = () => {
    // read() again as a fallback: if anything dropped `picked` between the
    // press and the click, the passage is still selected on the page.
    const passage = picked?.text ?? read()?.text
    if (!passage) return
    addQuote(current.lesson.id, passage)
    window.getSelection()?.removeAllRanges()
    setPicked(null)
    setNotesOpen(true)
  }
  const next = nextLessonId(course, current.lesson.id)
  const index = all.findIndex((l) => l.lesson.id === current.lesson.id)
  const previous = index > 0 ? all[index - 1].lesson.id : null
  const total = courseMinutes(all.map((l) => l.lesson))
  const nextLocked = next ? isLocked(all.find((l) => l.lesson.id === next)?.module.id ?? '') : false
  const moduleNumber = course.modules.findIndex((m) => m.id === current.module.id) + 1
  const moduleLessons = current.module.lessons
  const moduleDone = moduleLessons.filter((l) => data.done[l.id]).length

  return (
    <div>
      {/* How far along they are — the first thing someone returning wants:
          the course in numbers, and the module being read as one segment
          per lesson (20/11/2026, the owner's design). */}
      <div className={`${CARD} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}>
        <div>
          <p className="text-[13.5px] font-semibold text-navy">
            {summary?.done ?? 0} of {summary?.total ?? all.length} lessons ·{' '}
            {summary?.complete ? 'Course complete' : `${summary?.percent ?? 0}% done`}
          </p>
          {total > 0 && <p className="mt-0.5 text-[12.5px] text-navy/45">{formatMinutes(total)} in all</p>}
        </div>
        <div className="sm:w-[22rem]">
          <p className="text-[12.5px] text-navy/55 sm:text-right">
            Module {moduleNumber} · {moduleDone} of {moduleLessons.length} complete
          </p>
          <div className="mt-2 flex gap-1" aria-hidden>
            {moduleLessons.map((l) => (
              <span key={l.id} className={`h-1.5 flex-1 rounded-full ${data.done[l.id] ? 'bg-primary' : 'bg-navy/[0.08]'}`} />
            ))}
          </div>
        </div>
        {saveError && <p className="text-[12.5px] text-red-500">{saveError}</p>}
      </div>

      {course.intro && index === 0 && !isDone && (
        <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-navy/70">{course.intro}</p>
      )}

      <div className={`mt-6 grid gap-6 lg:items-start ${collapsed ? '' : 'lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]'}`}>
        {/* The map of the course. A long course was a wall of titles — and
            on a phone that wall came BEFORE the lesson. Now each module
            opens and closes (only the one being read is open), and on a
            phone the whole index hides behind a bar saying where you are
            (30/10/2026). */}
        <div className={`min-w-0 lg:sticky lg:top-24 ${collapsed ? 'lg:hidden' : ''}`}>
          <button
            type="button"
            onClick={() => setIndexOpen((v) => !v)}
            aria-expanded={indexOpen}
            className={`${CARD} flex w-full items-center gap-3 px-4 py-3 text-left lg:hidden`}
          >
            <ListTree size={17} className="shrink-0 text-primary" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-semibold text-navy">{current.module.title}</span>
              <span className="block text-[12px] text-navy/45">
                Lesson {index + 1} of {all.length}
              </span>
            </span>
            <ChevronDown size={17} className={`shrink-0 text-navy/40 transition-transform ${indexOpen ? 'rotate-180' : ''}`} aria-hidden />
          </button>

          <button
            type="button"
            onClick={() => setCollapse(true)}
            className={`${CARD} mb-3 hidden w-full items-center gap-2 px-4 py-2.5 text-left text-[13.5px] font-semibold text-navy/70 hover:text-navy lg:flex`}
          >
            <PanelLeftClose size={16} aria-hidden /> Collapse
          </button>
          <nav
            className={`${CARD} mt-3 max-h-[70vh] overflow-y-auto p-2 lg:mt-0 lg:block ${indexOpen ? 'block' : 'hidden'}`}
            aria-label="Course contents"
          >
            {course.modules.map((module, mi) => {
              const mp = summary?.modules.find((m) => m.moduleId === module.id)
              const here = module.id === current.module.id
              const locked = mi >= firstLocked
              const expanded = !locked && openModules.includes(module.id)
              return (
                <div key={module.id} className={mi > 0 ? 'mt-1 border-t border-navy/[0.06] pt-1' : undefined}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => setOpenModules((list) => (list.includes(module.id) ? list.filter((id) => id !== module.id) : [...list, module.id]))}
                    aria-expanded={expanded}
                    className="flex w-full items-start gap-2 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-bg-soft disabled:cursor-default disabled:hover:bg-transparent"
                  >
                    {locked && <Lock size={14} className="mt-0.5 shrink-0 text-navy/35" aria-label="Locked" />}
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[13px] font-bold leading-snug ${locked ? 'text-navy/45' : here ? 'text-navy' : 'text-navy/70'}`}>
                        {moduleLabel(mi + 1, module.title)}
                      </span>
                      {locked ? (
                        <span className="mt-0.5 block text-[11.5px] text-navy/40">Finish Module {mi} to unlock</span>
                      ) : mp && mp.total > 0 && (
                        <span className={`mt-0.5 block text-[11.5px] ${mp.complete ? 'font-semibold text-emerald-600' : 'text-navy/45'}`}>
                          {mp.complete ? 'Done' : `${mp.done}/${mp.total} lessons`}
                        </span>
                      )}
                    </span>
                    {!locked && <ChevronDown size={15} className={`mt-0.5 shrink-0 text-navy/35 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden />}
                  </button>
                  {expanded && (
                    <ul className="mb-1 space-y-0.5 pl-1">
                      {module.lessons.map((lesson) => {
                        const done = Boolean(data.done[lesson.id])
                        const reading = lesson.id === current.lesson.id
                        return (
                          <li key={lesson.id}>
                            <button
                              type="button"
                              onClick={() => go(lesson.id)}
                              aria-current={reading ? 'true' : undefined}
                              className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13.5px] transition-colors ${
                                reading ? 'bg-primary/[0.08] font-semibold text-navy' : 'text-navy/65 hover:bg-bg-soft'
                              }`}
                            >
                              <span
                                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                                  done ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-navy/20 text-transparent'
                                }`}
                              >
                                <Check size={12} strokeWidth={3} aria-hidden />
                              </span>
                              <span className="min-w-0 flex-1">{lesson.title}</span>
                              {lesson.minutes ? <span className="shrink-0 text-[11.5px] font-normal text-navy/40">{formatMinutes(lesson.minutes)}</span> : null}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        <article className={`${CARD} p-5 md:p-8`}>
          {collapsed && (
            <button
              type="button"
              onClick={() => setCollapse(false)}
              className="mb-4 hidden items-center gap-2 rounded-xl border border-navy/10 px-3 py-2 text-[13px] font-semibold text-navy/70 hover:text-navy lg:inline-flex"
            >
              <PanelLeftOpen size={16} aria-hidden /> Show lessons
            </button>
          )}
          <p className="text-[11.5px] font-bold uppercase tracking-wide text-primary/80">
            {moduleLabel(moduleNumber, current.module.title)}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="font-display text-2xl font-bold leading-tight text-navy">{current.lesson.title}</h2>
            {current.lesson.minutes ? (
              <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-navy/40">
                <Clock size={13} aria-hidden /> {formatMinutes(current.lesson.minutes)}
              </span>
            ) : null}
          </div>

          <div ref={lessonRef} className="mt-6" onMouseUp={onPick} onTouchEnd={onPick}>
            <CourseLessonBody blocks={current.lesson.blocks ?? []} answerFor={answerFor} onAnswer={answer} />
          </div>

          {/* The button follows the selection, so on a phone it lands next to
              what the student picked instead of at the end of the lesson. */}
          {picked && (
            <button
              type="button"
              ref={keepRef}
              // Keeps the selection alive while the button takes the press.
              onMouseDown={(e) => e.preventDefault()}
              onTouchEnd={(e) => {
                e.preventDefault()
                keep()
              }}
              onClick={keep}
              style={{ position: 'fixed', top: Math.max(8, picked.top - 46), left: picked.left, transform: 'translateX(-50%)', zIndex: 40 }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-3.5 py-2 text-[13px] font-semibold text-white shadow-soft"
            >
              <Quote size={14} aria-hidden /> Save to my notes
            </button>
          )}

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
            {next && nextLocked && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-navy/15 px-4 py-2.5 text-[13.5px] font-semibold text-navy/45">
                <Lock size={14} aria-hidden /> Finish this module to unlock the next
              </span>
            )}
            {next && !nextLocked && (
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
          {/* The student's own notes for this lesson, kept in the same
              record as their progress. */}
          <div className="mt-6 border-t border-navy/[0.06] pt-5">
            <button
              type="button"
              onClick={() => setNotesOpen((v) => !v)}
              aria-expanded={notesOpen}
              className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-navy/60 transition-colors hover:text-navy"
            >
              <StickyNote size={15} className="text-primary" aria-hidden />
              My notes
              {!notesOpen && note(current.lesson.id).trim() && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11.5px] font-semibold text-primary">written</span>
              )}
            </button>
            {notesOpen && (
              <>
                <textarea
                  value={note(current.lesson.id)}
                  onChange={(e) => writeNote(current.lesson.id, e.target.value)}
                  onBlur={flushNote}
                  rows={5}
                  maxLength={10000}
                  aria-label="My notes for this lesson"
                  placeholder="Write what you want to remember. Pick any passage in the lesson to bring it in here."
                  className="mt-3 w-full rounded-xl2 border border-navy/10 bg-white px-4 py-3 text-[14.5px] leading-relaxed text-navy placeholder:text-navy/30 focus:border-primary/30"
                />
                <p className="mt-1.5 text-[12px] text-navy/40">Saved to your account, for your eyes only.</p>
              </>
            )}
          </div>
        </article>
      </div>

      {!summary?.complete && (summary?.done ?? 0) > 0 && (
        <div className="no-print mt-6 flex items-center gap-4 rounded-2xl border border-primary/10 bg-blue-50/60 px-5 py-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-white">
            <Award size={22} aria-hidden />
          </span>
          <div>
            <p className="font-display text-[16px] font-bold text-navy">Keep it up!</p>
            <p className="text-[13.5px] text-navy/60">You’re building a strong foundation. Review the content if anything feels unclear, then finish strong.</p>
          </div>
        </div>
      )}

      {summary?.complete && (
        <p className="no-print mt-6 rounded-xl2 bg-emerald-50 px-5 py-4 text-center text-[14px] font-semibold text-emerald-700">
          You finished every lesson in this course.
        </p>
      )}

      {/* The certificate (02/11/2026). Shown once every lesson is ticked;
          whether it is actually earned — the quizzes too — is decided on the
          server, not here. */}
      {summary?.complete && <CourseCertificate productId={productId} />}
    </div>
  )
}
