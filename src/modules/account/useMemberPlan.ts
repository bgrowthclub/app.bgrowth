import { useCallback, useEffect, useState } from 'react'
import { useIdentity } from '../identity/IdentityContext'
import { planService } from './planService'
import type { MemberPlanState } from './planService'
import type { StoredPlan } from '../commerce/types/membership'

// The plans on offer and the signed-in member's plan (Sprint 122).
// `reload()` after subscribing, switching or cancelling.
export function useMemberPlan() {
  const { user } = useIdentity()
  const [plans, setPlans] = useState<StoredPlan[] | null>(null)
  const [state, setState] = useState<MemberPlanState>({ current: null, subscription: null, given: null })
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const all = await planService.listPlans()
    setPlans(all)
    setState(user ? await planService.getMemberPlan(user.id, all) : { current: null, subscription: null, given: null })
    setLoading(false)
  }, [user])

  useEffect(() => {
    void reload()
  }, [reload])

  return { plans: plans ?? [], ...state, loading, reload }
}
