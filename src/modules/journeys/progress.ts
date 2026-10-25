import type { JourneyAction, JourneyOutline } from './types'

// A member's progress in one Journey — kept in their own portal.
// workspace_instances row (data.kind = 'journey', Portal migration 0068:
// one row per member and Journey, readable and writable only by them).
// Pure functions only: no network, no React.

export interface JourneyProgressData {
  kind: 'journey'
  version: 1
  /** actionId → when the member marked it done. Only the member marks it — opening a resource never does. */
  done: Record<string, string>
  /** The action the member last worked on (to resume there). */
  lastActionId: string | null
}

export function emptyProgress(): JourneyProgressData {
  return { kind: 'journey', version: 1, done: {}, lastActionId: null }
}

/** Reads saved data defensively (older or tampered rows still open). */
export function readProgress(raw: unknown): JourneyProgressData {
  const out = emptyProgress()
  if (!raw || typeof raw !== 'object') return out
  const r = raw as Record<string, unknown>
  if (r.done && typeof r.done === 'object' && !Array.isArray(r.done)) {
    for (const [id, at] of Object.entries(r.done as Record<string, unknown>)) {
      if (typeof id === 'string' && id && typeof at === 'string') out.done[id] = at
    }
  }
  if (typeof r.lastActionId === 'string') out.lastActionId = r.lastActionId
  return out
}

/**
 * An action counts toward completion when members can actually do it now
 * (its resource is published, or it's a task) and it isn't optional.
 * "Coming soon" and "Unavailable" actions never count.
 */
export function countsTowardCompletion(action: JourneyAction): boolean {
  return action.state === 'available' && !action.optional
}

/** Whether the member can tick it at all (optional ones too; never coming soon / unavailable). */
export function canMark(action: JourneyAction): boolean {
  return action.state === 'available'
}

export interface StageProgress {
  stageId: string
  done: number
  total: number
  complete: boolean
}

export interface JourneyProgressSummary {
  done: number
  total: number
  percent: number
  complete: boolean
  stages: StageProgress[]
  /** Where to pick up: the last action worked on if still open, else the first open one. */
  resumeActionId: string | null
  resumeStageId: string | null
}

export function summarize(outline: JourneyOutline, data: JourneyProgressData): JourneyProgressSummary {
  let done = 0
  let total = 0
  let firstOpen: { stageId: string; actionId: string } | null = null
  const stages: StageProgress[] = outline.stages.map((stage) => {
    let sDone = 0
    let sTotal = 0
    for (const action of stage.actions) {
      if (!countsTowardCompletion(action)) continue
      sTotal += 1
      if (data.done[action.id]) sDone += 1
      else if (!firstOpen) firstOpen = { stageId: stage.id, actionId: action.id }
    }
    done += sDone
    total += sTotal
    return { stageId: stage.id, done: sDone, total: sTotal, complete: sTotal > 0 && sDone === sTotal }
  })

  let resume: { stageId: string; actionId: string } | null = null
  if (data.lastActionId) {
    for (const stage of outline.stages) {
      const action = stage.actions.find((a) => a.id === data.lastActionId)
      if (action && canMark(action) && !data.done[action.id]) resume = { stageId: stage.id, actionId: action.id }
    }
  }
  resume = resume ?? firstOpen

  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    complete: total > 0 && done === total,
    stages,
    resumeActionId: resume?.actionId ?? null,
    resumeStageId: resume?.stageId ?? outline.stages[0]?.id ?? null,
  }
}

/** Marks or unmarks one action (only one the member can mark); returns new data. */
export function toggleDone(outline: JourneyOutline, data: JourneyProgressData, actionId: string, now = new Date().toISOString()): JourneyProgressData {
  const action = outline.stages.flatMap((s) => s.actions).find((a) => a.id === actionId)
  if (!action || !canMark(action)) return data
  const next = { ...data.done }
  if (next[actionId]) delete next[actionId]
  else next[actionId] = now
  return { ...data, done: next, lastActionId: actionId }
}
