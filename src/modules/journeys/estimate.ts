import type { JourneyStageLevel } from './types'

// How a Journey's estimated time and stage levels read on the site. The
// minutes are set per action in Studio → Journeys and added up by the
// database (Portal migration 0068); 0 means no time was given.

/** "45 min", "2 h", "3 h 20 min" — rounded to 5 minutes above an hour. */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const rounded = Math.round(minutes / 5) * 5
  const h = Math.floor(rounded / 60)
  const m = rounded % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export const STAGE_LEVEL_LABEL: Record<JourneyStageLevel, string> = {
  beginner: 'Getting started',
  best_practices: 'Good practices',
  expansion: 'Growing',
}
