import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStudioPurchaseInfo, startStudioCheckout, startStudioTrial } from '../services/studioPurchase'
import type { StudioPurchaseInfo } from '../services/studioPurchase'
import { workspaceViewerPath } from '../config'

export interface StudioPurchaseState {
  info: StudioPurchaseInfo | null
  loading: boolean
  busy: 'buy' | 'trial' | null
  error?: string
  // Back from Stripe and the license isn't there yet — the Portal's webhook
  // usually grants it within seconds.
  confirming: boolean
  buy: () => void
  startTrial: () => void
}

const POLL_MS = 2500
const POLL_TRIES = 12

// The product page's buy box logic for a Studio Workspace: what this
// member already has, and the actions to buy / claim / start a trial.
export function useStudioPurchase(slug: string | undefined, userId: string | undefined, checkoutResult: string | null) {
  const navigate = useNavigate()
  const [info, setInfo] = useState<StudioPurchaseInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<StudioPurchaseState['busy']>(null)
  const [error, setError] = useState<string>()
  const [confirming, setConfirming] = useState(false)

  const refresh = useCallback(async () => {
    if (!slug) return null
    const next = await loadStudioPurchaseInfo(slug, userId)
    setInfo(next)
    return next
  }, [slug, userId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(undefined)
    refresh()
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Couldn’t load this Workspace’s details.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [refresh])

  // Returning from a successful Stripe payment: wait for the license.
  useEffect(() => {
    if (checkoutResult !== 'success' || !userId) return
    let cancelled = false
    let tries = 0
    setConfirming(true)
    const tick = async () => {
      if (cancelled) return
      tries += 1
      const next = await refresh().catch(() => null)
      if (cancelled) return
      if (next?.owned || tries >= POLL_TRIES) {
        setConfirming(false)
        return
      }
      window.setTimeout(tick, POLL_MS)
    }
    void tick()
    return () => {
      cancelled = true
    }
  }, [checkoutResult, userId, refresh])

  const buy = useCallback(async () => {
    if (!slug) return
    setBusy('buy')
    setError(undefined)
    try {
      const { checkoutUrl, redirectUrl } = await startStudioCheckout(slug)
      if (checkoutUrl) {
        window.location.assign(checkoutUrl)
        return
      }
      navigate(redirectUrl ?? workspaceViewerPath(slug))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout isn’t available right now.')
    } finally {
      setBusy(null)
    }
  }, [slug, navigate])

  const startTrial = useCallback(async () => {
    if (!slug || !userId || !info?.trialDays) return
    setBusy('trial')
    setError(undefined)
    try {
      await startStudioTrial(userId, info.productId, info.trialDays)
      navigate(workspaceViewerPath(slug))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t start your trial.')
    } finally {
      setBusy(null)
    }
  }, [slug, userId, info, navigate])

  return { info, loading, busy, error, confirming, buy, startTrial } satisfies StudioPurchaseState
}
