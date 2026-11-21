import type { CourseOverview } from '../../modules/academy/useAcademyOverview'

export type MyCourseStatus = 'progress' | 'new' | 'done'

/** In progress / Not started / Completed, from the course's real progress. */
export function myCourseStatus(o: CourseOverview | undefined): MyCourseStatus {
  if (o?.complete) return 'done'
  if (o?.started) return 'progress'
  return 'new'
}

export const MY_COURSE_STATUS: Record<MyCourseStatus, { label: string; pill: string; bar: string; action: string }> = {
  progress: { label: 'In progress', pill: 'bg-blue-50 text-primary', bar: 'bg-primary', action: 'Resume course' },
  new: { label: 'Not started', pill: 'bg-white text-navy', bar: 'bg-primary', action: 'Start learning' },
  done: { label: 'Completed', pill: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500', action: 'Review material' },
}
