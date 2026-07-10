import type { Journey } from '../../types/journey'
import { startACleaningBusinessJourney } from './cleaning-business'

export const JOURNEYS: Journey[] = [startACleaningBusinessJourney]

export function getJourneyBySlug(slug: string) {
  return JOURNEYS.find((j) => j.slug === slug)
}
