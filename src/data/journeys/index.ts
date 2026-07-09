import type { Journey } from '../../types/journey'
import { startACleaningBusinessJourney } from './startACleaningBusiness'

export const JOURNEYS: Journey[] = [startACleaningBusinessJourney]

export function getJourneyBySlug(slug: string) {
  return JOURNEYS.find((j) => j.slug === slug)
}
