// BGrowth Academy™ — what a course is, in data.
//
// A course is a `portal.products` row with content_type 'course' (already an
// accepted type since Portal migration 0068), authored in BGrowth Studio and
// published through the same release flow as every other product. It
// therefore inherits price, free/paid, bundles, plan inclusion, plan
// discounts, coupons, reviews, tags, gallery, SEO and link previews, and the
// access rule that serves `content` only to a member who owns it — see
// ARCHITECTURE.md §10 and VISION.md's "Growth Systems, not courses".
//
// The shape follows the Journey's (stages → actions): modules → lessons.
// A lesson composes what the ecosystem already has and never copies a Growth
// System's content into itself (CLAUDE.md §8) — it references it.

export type CourseBlock =
  | { type: 'text'; body: string }
  | { type: 'image'; url: string; alt?: string; caption?: string }
  /** A YouTube, TikTok or Instagram address. Nothing is hosted by BGrowth. */
  | { type: 'video'; url: string; title?: string }
  /** A file from the Studio's File Library, by its address. */
  | { type: 'file'; url: string; label?: string; note?: string }
  | { type: 'link'; url: string; label?: string; note?: string }
  /**
   * A Growth System, Journey, calculator, download or article this lesson
   * hands the student. `slug` is the product's own address on this site; the
   * label is what the author wrote. Resolving names and prices on the server
   * (as a Journey action does) comes with the Studio editor — until then a
   * block only ever shows what the author typed.
   */
  | { type: 'product'; slug: string; label?: string; note?: string }

export interface CourseLesson {
  id: string
  title: string
  /** How long it takes, in minutes (1–1440). Added up per module and course. */
  minutes?: number
  blocks: CourseBlock[]
}

export interface CourseModule {
  id: string
  title: string
  summary?: string
  lessons: CourseLesson[]
}

export interface CourseContent {
  kind: 'course'
  version: 1
  /** A few lines before the first module. */
  intro?: string
  /** What the student will be able to do by the end (up to 10). */
  outcomes?: string[]
  modules: CourseModule[]
}

/** A published row's content really is a course — read defensively. */
export function isCourseContent(value: unknown): value is CourseContent {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (v.kind !== 'course' || !Array.isArray(v.modules)) return false
  return v.modules.every((m) => {
    if (!m || typeof m !== 'object') return false
    const mod = m as Record<string, unknown>
    return typeof mod.id === 'string' && typeof mod.title === 'string' && Array.isArray(mod.lessons)
  })
}

/** Every lesson, in reading order. */
export function courseLessons(course: CourseContent): { module: CourseModule; lesson: CourseLesson }[] {
  return course.modules.flatMap((module) => module.lessons.map((lesson) => ({ module, lesson })))
}

/** Minutes of a module, or of the whole course; 0 when nobody filled them in. */
export function courseMinutes(lessons: CourseLesson[]): number {
  return lessons.reduce((sum, l) => sum + (typeof l.minutes === 'number' && l.minutes > 0 ? Math.min(l.minutes, 1440) : 0), 0)
}

/** "25 min", "1 h 30 min", "2 h" — same wording the Journeys use. */
export function formatMinutes(total: number): string {
  if (total <= 0) return ''
  if (total < 60) return `${total} min`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}
