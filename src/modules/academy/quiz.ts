import type { CourseQuestion } from './types'

// BGrowth Academy™ — marking a quiz answer (02/11/2026).
//
// Pure functions, no React and no network: the same rules are needed by the
// reader, and one day by a report, so they don't live inside a component.
//
// Nothing here grades a student. A quiz is a self-check: this only decides
// what the page tells them about the answer they just gave.

/** What the student gave: an option id, a set of option ids, or typed text. */
export type GivenAnswer = string | string[]

export interface Marked {
  /** Did they get it right? */
  right: boolean
  /** The option ids that are right (single and multi questions). */
  rightOptionIds: string[]
  /** For a typed question, the wording to show as expected. */
  expected: string | null
}

/** Case, surrounding spaces and repeated spaces never decide an answer. */
export function normalizeTyped(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase()
}

/**
 * Can this question be marked at all? A typed question imported from Wix
 * arrives with no accepted answer, because Wix stores none — it is kept so
 * the author can fill it in, and skipped here until they do. A student is
 * never shown a question that has no right answer behind it.
 */
export function isAnswerable(question: CourseQuestion): boolean {
  if (question.kind === 'typed') return question.accept.some((a) => a.trim())
  if (question.kind === 'multi') return question.answers.length > 0
  return Boolean(question.answer)
}

export function isAnswered(given: GivenAnswer | null | undefined): boolean {
  if (given === null || given === undefined) return false
  return Array.isArray(given) ? given.length > 0 : given.trim().length > 0
}

export function mark(question: CourseQuestion, given: GivenAnswer): Marked {
  if (question.kind === 'typed') {
    const typed = normalizeTyped(Array.isArray(given) ? given.join(' ') : given)
    const right = question.accept.some((a) => normalizeTyped(a) === typed)
    return { right, rightOptionIds: [], expected: question.accept[0] ?? null }
  }

  if (question.kind === 'multi') {
    const picked = new Set(Array.isArray(given) ? given : [given])
    const answers = new Set(question.answers)
    // Right only as a whole set: missing one right option, or adding a wrong
    // one, is not "nearly right" — the question asked for all of them.
    const right = picked.size === answers.size && [...answers].every((a) => picked.has(a))
    return { right, rightOptionIds: [...answers], expected: null }
  }

  const picked = Array.isArray(given) ? given[0] : given
  return { right: picked === question.answer, rightOptionIds: [question.answer], expected: null }
}

/** How many of the answered questions are right — never counts the unanswered. */
export function score(
  questions: CourseQuestion[],
  answerFor: (questionId: string) => GivenAnswer | null,
): { answered: number; right: number } {
  let answered = 0
  let right = 0
  for (const question of questions) {
    const given = answerFor(question.id)
    if (!isAnswered(given)) continue
    answered += 1
    if (mark(question, given as GivenAnswer).right) right += 1
  }
  return { answered, right }
}
