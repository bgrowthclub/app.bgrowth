import { useEffect, useMemo, useState } from 'react'
import { studioWorkspaceService } from '../workspace/services/studioWorkspaceService'
import { studioPortalId } from '../commerce/store/studioProductRepository'
import { certificateService } from './certificateService'
import { courseLessons, courseMinutes, isCourseContent } from './types'
import { readProgress, summarize } from './progress'
import type { CourseContent } from './types'
import type { UserProduct } from '../../types/productLibrary'

/** What the Academy knows about one course the member has. */
export interface CourseOverview {
  lessons: number
  minutes: number
  done: number
  percent: number
  started: boolean
  complete: boolean
  /** The lesson the course opens on, its module and position. */
  nextLesson: { title: string; minutes: number; moduleTitle: string; moduleNumber: number } | null
  moduleCount: number
}

export interface AcademyOverview {
  status: 'loading' | 'ready'
  /** By the member's UserProduct.productId. */
  courses: Map<string, CourseOverview>
  /** Lessons the member marked done, across every course. */
  lessonsDone: number
  certificates: number
  /** Portal ids of the Journeys this member has started. */
  journeysStarted: Set<string>
}

function overviewOf(course: CourseContent, raw: unknown): CourseOverview {
  const data = readProgress(raw)
  const summary = summarize(course, data)
  const all = courseLessons(course)
  const at = all.find((l) => l.lesson.id === summary.resumeLessonId)
  return {
    lessons: summary.total,
    minutes: courseMinutes(all.map((l) => l.lesson)),
    done: summary.done,
    percent: summary.percent,
    started: summary.done > 0 || Boolean(data.lastLessonId),
    complete: summary.complete,
    moduleCount: course.modules.length,
    nextLesson: at
      ? {
          title: at.lesson.title,
          minutes: typeof at.lesson.minutes === 'number' && at.lesson.minutes > 0 ? at.lesson.minutes : 0,
          moduleTitle: at.module.title,
          moduleNumber: course.modules.indexOf(at.module) + 1,
        }
      : null,
  }
}

// The Academy's numbers (20/11/2026), all read from what is stored: the
// courses' own content (only their owner may read it), the member's
// workspace_instances rows (lessons marked done, Journeys started) and
// their certificates. Nothing estimated: no hours studied, no streaks.
// A failed read leaves that part empty — it must never break the page.
export function useAcademyOverview(userId: string | undefined, courses: UserProduct[]): AcademyOverview {
  const key = courses.map((c) => c.productId).join('|')
  const [state, setState] = useState<Omit<AcademyOverview, 'status'> & { status: AcademyOverview['status'] }>({
    status: 'loading',
    courses: new Map(),
    lessonsDone: 0,
    certificates: 0,
    journeysStarted: new Set(),
  })

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const portalIds = new Map<string, string>()
    for (const c of courses) {
      const id = studioPortalId(c.productId)
      if (id) portalIds.set(id, c.productId)
    }

    Promise.all([
      studioWorkspaceService.listAllInstances(userId).catch(() => []),
      portalIds.size
        ? studioWorkspaceService.getProductsByIds([...portalIds.keys()], { withContent: true }).catch(() => [])
        : Promise.resolve([]),
      certificateService.mine().catch(() => []),
    ]).then(([instances, rows, certificates]) => {
      if (cancelled) return
      const byCourse = new Map<string, CourseOverview>()
      const journeysStarted = new Set<string>()
      let lessonsDone = 0
      for (const row of instances) {
        if ((row.data as { kind?: unknown } | null)?.kind === 'journey') journeysStarted.add(row.product_id)
      }
      for (const row of rows) {
        if (!isCourseContent(row.content)) continue
        const instance = instances.find((i) => i.product_id === row.id && (i.data as { kind?: unknown } | null)?.kind === 'course')
        const overview = overviewOf(row.content, instance?.data)
        lessonsDone += overview.done
        const own = portalIds.get(row.id)
        if (own) byCourse.set(own, overview)
      }
      setState({ status: 'ready', courses: byCourse, lessonsDone, certificates: certificates.length, journeysStarted })
    })
    return () => {
      cancelled = true
    }
    // key stands for the courses list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, key])

  return useMemo(() => state, [state])
}
