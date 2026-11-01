import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { studioWorkspaceService } from '../workspace/services/studioWorkspaceService'
import { addQuoteToNote, emptyProgress, noteOf, openLesson, readProgress, setNote, summarize, toggleDone } from './progress'
import type { CourseProgressData } from './progress'
import type { CourseContent } from './types'
import type { WorkspaceInstanceRow } from '../workspace/types/portal'

// A student's progress in one course. Unlike a Workspace, a course has no
// named records: there is one row per student, created the first time they
// mark a lesson (so merely opening a course never writes anything). Each
// change saves right away, one save at a time, always sending the latest
// state — the same discipline the Journey progress uses.
export function useCourseProgress(
  course: CourseContent | null,
  productId: string | undefined,
  userId: string | undefined,
  records: WorkspaceInstanceRow[],
  reloadRecords: () => void,
) {
  // The student's own row, if they already have one.
  const existing = useMemo(
    () => records.find((r) => (r.data as { kind?: string } | null)?.kind === 'course') ?? records[0],
    [records],
  )
  const [local, setLocal] = useState<CourseProgressData | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const rowId = useRef<string | null>(null)
  const queue = useRef<Promise<void>>(Promise.resolve())
  // Typing a note shouldn't save on every key; it waits for a pause.
  const noteTimer = useRef<number | null>(null)
  const pendingNote = useRef<CourseProgressData | null>(null)

  if (rowId.current === null && existing) rowId.current = existing.id
  const data = local ?? (existing ? readProgress(existing.data) : emptyProgress())
  const summary = useMemo(() => (course ? summarize(course, data) : null), [course, data])

  // Every save stamps how many lessons the course has, so the course cards
  // can show progress without reading the course content (01/11/2026).
  const lessonCount = useMemo(
    () => (course ? course.modules.reduce((n, m) => n + m.lessons.length, 0) : 0),
    [course],
  )

  const persist = useCallback(
    (raw: CourseProgressData) => {
      const next = lessonCount > 0 ? { ...raw, total: lessonCount } : raw
      setLocal(next)
      if (!userId || !productId) return
      setSaveError(null)
      setSaving(true)
      queue.current = queue.current
        .then(async () => {
          if (!rowId.current) {
            const created = await studioWorkspaceService.createInstance(userId, productId, 'My progress')
            rowId.current = created.id
          }
          await studioWorkspaceService.saveInstanceData(rowId.current, next as unknown as Record<string, unknown>)
        })
        .then(
          () => {
            setSaving(false)
            reloadRecords()
          },
          (err: unknown) => {
            setSaving(false)
            setSaveError(err instanceof Error ? err.message : 'Your progress couldn’t be saved.')
          },
        )
    },
    [productId, userId, reloadRecords, lessonCount],
  )

  const toggle = useCallback((lessonId: string) => persist(toggleDone(data, lessonId)), [data, persist])

  // Notes: shown as the student types, saved once they stop. flushNote()
  // sends it right away — on leaving the lesson or closing the page, so a
  // note is never lost to the wait.
  const flushNote = useCallback(() => {
    if (noteTimer.current !== null) {
      window.clearTimeout(noteTimer.current)
      noteTimer.current = null
    }
    const next = pendingNote.current
    pendingNote.current = null
    if (next) persist(next)
  }, [persist])

  const writeNote = useCallback(
    (lessonId: string, text: string) => {
      const next = setNote(data, lessonId, text)
      setLocal(next)
      pendingNote.current = next
      if (noteTimer.current !== null) window.clearTimeout(noteTimer.current)
      noteTimer.current = window.setTimeout(() => {
        noteTimer.current = null
        const pending = pendingNote.current
        pendingNote.current = null
        if (pending) persist(pending)
      }, 900)
    },
    [data, persist],
  )

  // A passage the student picked in the lesson, copied into their note.
  const addQuote = useCallback(
    (lessonId: string, passage: string) => {
      const next = addQuoteToNote(data, lessonId, passage)
      if (next === data) return
      flushNote()
      persist(next)
    },
    [data, flushNote, persist],
  )

  // The page closing mustn't swallow a note still waiting.
  useEffect(() => {
    const onHide = () => flushNote()
    window.addEventListener('pagehide', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
      flushNote()
    }
  }, [flushNote])
  // Opening a lesson only moves the bookmark, and only once it exists —
  // reading a course the student never ticked writes nothing.
  const open = useCallback(
    (lessonId: string) => {
      const next = openLesson(data, lessonId)
      if (next === data) return
      if (rowId.current) persist(next)
      else setLocal(next)
    },
    [data, persist],
  )

  return { data, summary, toggle, open, saving, saveError, note: (id: string) => noteOf(data, id), writeNote, flushNote, addQuote }
}
