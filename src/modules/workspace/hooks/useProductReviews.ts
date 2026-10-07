import { useCallback, useEffect, useState } from 'react'
import { studioWorkspaceService, isStudioCatalogAvailable } from '../services/studioWorkspaceService'
import type { PortalAccessGrantRow, PortalLicenseRow, PortalReviewRow, PortalReviewSummary, ReviewInput } from '../types/portal'

export interface ProductReviews {
  loading: boolean
  summary: PortalReviewSummary
  reviews: PortalReviewRow[]
  // This member's own review, if they wrote one.
  mine: PortalReviewRow | null
  // Holds (or held) a license or access given by the team — the rule the
  // Portal's database enforces (migrations 0009 + 0037).
  canReview: boolean
  submit: (input: ReviewInput) => Promise<void>
}

const EMPTY: PortalReviewSummary = { averageRating: 0, reviewCount: 0 }

// Reviews of one Studio Workspace (Portal product id) — the same reviews
// the Portal shows, read and written through studioWorkspaceService.
// `withList` = false loads only what the Workspace viewer needs (the
// member's own review and whether they may write one).
export function useProductReviews(
  productId: string | undefined,
  member: { id: string; displayName: string } | null,
  withList = true,
): ProductReviews {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<PortalReviewSummary>(EMPTY)
  const [reviews, setReviews] = useState<PortalReviewRow[]>([])
  const [mine, setMine] = useState<PortalReviewRow | null>(null)
  const [license, setLicense] = useState<PortalLicenseRow | null>(null)
  const [granted, setGranted] = useState(false)
  const memberId = member?.id

  const load = useCallback(async () => {
    if (!productId || !isStudioCatalogAvailable) {
      setLoading(false)
      return
    }
    const [summaryResult, listResult, licenseResult, grantsResult] = await Promise.allSettled([
      withList ? studioWorkspaceService.getReviewSummary(productId) : Promise.resolve(EMPTY),
      studioWorkspaceService.listReviews(productId),
      memberId ? studioWorkspaceService.getLicense(memberId, productId) : Promise.resolve(null),
      memberId ? studioWorkspaceService.listAccessGrants(memberId) : Promise.resolve([] as PortalAccessGrantRow[]),
    ])
    const list = listResult.status === 'fulfilled' ? listResult.value : []
    setSummary(summaryResult.status === 'fulfilled' ? summaryResult.value : EMPTY)
    setReviews(withList ? list : [])
    setMine(memberId ? (list.find((r) => r.user_id === memberId) ?? null) : null)
    setLicense(licenseResult.status === 'fulfilled' ? licenseResult.value : null)
    const grants = grantsResult.status === 'fulfilled' ? grantsResult.value : []
    setGranted(grants.some((g) => g.scope === 'all' || g.product_id === productId))
    setLoading(false)
  }, [productId, memberId, withList])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  const submit = useCallback(
    async (input: ReviewInput) => {
      if (!productId || !member) throw new Error('Sign in to write a review.')
      if (mine) {
        await studioWorkspaceService.updateReview(mine.id, input)
      } else {
        const createdFrom = license ? (license.type === 'trial' ? 'trial' : 'purchase') : 'access'
        await studioWorkspaceService.createReview(member.id, productId, member.displayName || 'BGrowth member', createdFrom, input)
      }
      await load()
    },
    [productId, member, mine, license, load],
  )

  return { loading, summary, reviews, mine, canReview: Boolean(license) || granted, submit }
}
