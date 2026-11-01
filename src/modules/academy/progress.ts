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
  /**
   * lessonId → the student's own notes for that lesson (30/10/2026).
   * A passage they pick in the lesson is COPIED in here as a quote, rather
   * than marked where it sits: a note is the student's own text, so editing
   * the course later can't move it, break it or make it point at the wrong
   * sentence.
   */
  notes?: Record<string, string>
  /**
   * How many lessons the course had when this was last saved (01/11/2026).
   * Stamped here so a LIST of courses can show progress without loading
   * every course's content — which only its owner may read anyway. It is
   * refreshed on every save, so editing the course corrects it as soon as
   * the student touches it again.
   */
  total?: number
}

export function emptyProgress(): CourseProgressData {
  return { kind: 'course', version: 1, done: {}, lastLessonId: null, notes: {} }
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
  if (typeof r.total === 'number' && Number.isFinite(r.total) && r.total > 0) out.total = Math.floor(r.total)
  if (r.notes && typeof r.notes === 'object' && !Array.isArray(r.notes)) {
    for (const [id, text] of Object.entries(r.notes as Record<string, unknown>)) {
      if (id && typeof text === 'string') out.notes![id] = text
    }
  }
  return out
}

/** The student's notes for one lesson (never undefined). */
export function noteOf(data: CourseProgressData, lessonId: string): string {
  return data.notes?.[lessonId] ?? ''
}

/** Replaces the note of one lesson; an empty note is dropped, not stored. */
export function setNote(data: CourseProgressData, lessonId: string, text: string): CourseProgressData {
  const notes = { ...(data.notes ?? {}) }
  if (text.trim()) notes[lessonId] = text
  else delete notes[lessonId]
  return { ...data, notes }
}

/**
 * Adds a passage the student picked in the lesson to their note, as a quote.
 * Whitespace is collapsed so a selection spanning several lines reads as one
 * quote, and a passage already in the note isn't added twice.
 */
export function addQuoteToNote(data: CourseProgressData, lessonId: string, passage: string): CourseProgressData {
  const quote = passage.replace(/\s+/g, ' ').trim()
  if (!quote) return data
  const current = noteOf(data, lessonId)
  if (current.includes(quote)) return data
  const next = [current.trimEnd(), `"${quote}"`].filter(Boolean).join('\n\n')
  return setNote(data, lessonId, next)
}

/**
 * How far along a saved record is, as a percentage — read straight from a
 * workspace_instances row, with no course content needed (01/11/2026). Used
 * by the course cards in My Workspaces and in the Academy.
 *
 * null when it can't be said honestly: not a course record, or saved before
 * the lesson total was stamped on it. A card then shows no bar rather than a
 * made-up number.
 */
export function percentFromRecord(raw: unknown): number | null {
  if (!raw || typeof raw !== 'object' || (raw as { kind?: string }).kind !== 'course') return null
  const data = readProgress(raw)
  if (!data.total) return null
  const done = Object.keys(data.done).length
  return Math.max(0, Math.min(100, Math.round((done / data.total) * 100)))
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
