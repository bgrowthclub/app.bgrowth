import { useEffect, useState } from 'react'
import { studioWorkspaceService, isStudioCatalogAvailable } from '../services/studioWorkspaceService'
import type { PortalReviewSummary } from '../types/portal'

type Summaries = Record<string, PortalReviewSummary>

// Loaded once per page visit and shared by every catalog card, so a grid of
// cards makes one query, not one per card. Empty on any error — the cards
// simply show no stars.
let cache: Promise<Summaries> | null = null

function loadSummaries(): Promise<Summaries> {
  if (!cache) {
    cache = isStudioCatalogAvailable
      ? studioWorkspaceService.listReviewSummaries().catch(() => ({}))
      : Promise.resolve({})
  }
  return cache
}

// Star averages of all products, keyed by Portal product id.
export function useReviewSummaries(): Summaries {
  const [summaries, setSummaries] = useState<Summaries>({})
  useEffect(() => {
    let active = true
    loadSummaries().then((s) => {
      if (active) setSummaries(s)
    })
    return () => {
      active = false
    }
  }, [])
  return summaries
}
