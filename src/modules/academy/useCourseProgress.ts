import { useCallback, useMemo, useRef, useState } from 'react'
import { studioWorkspaceService } from '../workspace/services/studioWorkspaceService'
import { emptyProgress, openLesson, readProgress, summarize, toggleDone } from './progress'
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

  if (rowId.current === null && existing) rowId.current = existing.id
  const data = local ?? (existing ? readProgress(existing.data) : emptyProgress())
  const summary = useMemo(() => (course ? summarize(course, data) : null), [course, data])

  const persist = useCallback(
    (next: CourseProgressData) => {
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
    [productId, userId, reloadRecords],
  )

  const toggle = useCallback((lessonId: string) => persist(toggleDone(data, lessonId)), [data, persist])
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

  return { data, summary, toggle, open, saving, saveError }
}
