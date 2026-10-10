import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadBundlePurchaseInfo, startBundleCheckout } from '../services/bundlePurchase'
import type { BundlePurchaseInfo } from '../services/bundlePurchase'
import type { Product } from '../../commerce/types/product'

const POLL_MS = 2500
const POLL_TRIES = 12
const MY_WORKSPACES = '/platform/my-systems'

// The bundle page's buy box: what this member already owns of it, and the
// one action (buy, or claim when there's nothing to pay).
export function useBundlePurchase(
  bundle: Product | null | undefined,
  items: Product[],
  userId: string | undefined,
  checkoutResult: string | null,
) {
  const navigate = useNavigate()
  const [info, setInfo] = useState<BundlePurchaseInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [confirming, setConfirming] = useState(false)

  const refresh = useCallback(async () => {
    if (!bundle) return null
    const next = await loadBundlePurchaseInfo(bundle, items, userId)
    setInfo(next)
    return next
  }, [bundle, items, userId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(undefined)
    refresh()
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Couldn’t load this bundle’s details.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [refresh])

  // Back from Stripe: wait for the webhook to unlock every Workspace.
  useEffect(() => {
    if (checkoutResult !== 'success' || !userId || !bundle || items.length === 0) return
    let cancelled = false
    let tries = 0
    setConfirming(true)
    const tick = async () => {
      if (cancelled) return
      tries += 1
      const next = await refresh().catch(() => null)
      if (cancelled) return
      if (next?.ownsAll || tries >= POLL_TRIES) {
        setConfirming(false)
        return
      }
      window.setTimeout(tick, POLL_MS)
    }
    void tick()
    return () => {
      cancelled = true
    }
  }, [checkoutResult, userId, bundle, items.length, refresh])

  const buy = useCallback(async () => {
    if (!bundle) return
    setBusy(true)
    setError(undefined)
    try {
      const { checkoutUrl, redirectUrl } = await startBundleCheckout(bundle.slug)
      if (checkoutUrl) {
        window.location.assign(checkoutUrl)
        return
      }
      navigate(redirectUrl ?? MY_WORKSPACES)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout isn’t available right now.')
    } finally {
      setBusy(false)
    }
  }, [bundle, navigate])

  return { info, loading, busy, error, confirming, buy, myWorkspacesTo: MY_WORKSPACES }
}
