import { courseLessons } from './types'
import type { CourseContent } from './types'

// A student's progress in one course — kept in their own
// portal.workspace_instances row (data.kind = 'course'), the same record a
// Workspace, a calculator and a Journey already use. Pure functions only:
// no network, no React.

export interface CourseProgressData {
  kind: 'course'
  version: 1
  /** lessonId → when the student marked it done. Only they mark it. */
  done: Record<string, string>
  /** The lesson they last opened, so the course resumes there. */
  lastLessonId: string | null
}

export function emptyProgress(): CourseProgressData {
  return { kind: 'course', version: 1, done: {}, lastLessonId: null }
}

/** Reads saved data defensively (an older or tampered row still opens). */
export function readProgress(raw: unknown): CourseProgressData {
  const out = emptyProgress()
  if (!raw || typeof raw !== 'object') return out
  const r = raw as Record<string, unknown>
  if (r.done && typeof r.done === 'object' && !Array.isArray(r.done)) {
    for (const [id, at] of Object.entries(r.done as Record<string, unknown>)) {
      if (id && typeof at === 'string') out.done[id] = at
    }
  }
  if (typeof r.lastLessonId === 'string') out.lastLessonId = r.lastLessonId
  return out
}

export interface ModuleProgress {
  moduleId: string
  done: number
  total: number
  complete: boolean
}

export interface CourseProgressSummary {
  done: number
  total: number
  percent: number
  complete: boolean
  modules: ModuleProgress[]
  /** Where to pick up: the last lesson opened if unfinished, else the first unfinished one, else the first. */
  resumeLessonId: string | null
}

export function summarize(course: CourseContent, data: CourseProgressData): CourseProgressSummary {
  let done = 0
  let total = 0
  let firstOpen: string | null = null

  const modules: ModuleProgress[] = course.modules.map((module) => {
    let mDone = 0
    for (const lesson of module.lessons) {
      if (data.done[lesson.id]) mDone += 1
      else if (!firstOpen) firstOpen = lesson.id
    }
    done += mDone
    total += module.lessons.length
    return { moduleId: module.id, done: mDone, total: module.lessons.length, complete: module.lessons.length > 0 && mDone === module.lessons.length }
  })

  const all = courseLessons(course)
  const last = data.lastLessonId && all.some((l) => l.lesson.id === data.lastLessonId) ? data.lastLessonId : null
  const resume = (last && !data.done[last] ? last : null) ?? firstOpen ?? last ?? all[0]?.lesson.id ?? null

  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    complete: total > 0 && done === total,
    modules,
    resumeLessonId: resume,
  }
}

/** Marks or unmarks one lesson; returns the new data. */
export function toggleDone(data: CourseProgressData, lessonId: string, now = new Date().toISOString()): CourseProgressData {
  const next = { ...data.done }
  if (next[lessonId]) delete next[lessonId]
  else next[lessonId] = now
  return { ...data, done: next, lastLessonId: lessonId }
}

/** Remembers where the student is, without marking anything done. */
export function openLesson(data: CourseProgressData, lessonId: string): CourseProgressData {
  return data.lastLessonId === lessonId ? data : { ...data, lastLessonId: lessonId }
}

/** The lesson after this one, in reading order — null at the end. */
export function nextLessonId(course: CourseContent, lessonId: string): string | null {
  const all = courseLessons(course)
  const i = all.findIndex((l) => l.lesson.id === lessonId)
  return i >= 0 && i + 1 < all.length ? all[i + 1].lesson.id : null
}
