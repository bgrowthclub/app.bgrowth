import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { journeyService } from './journeyService'
import type { JourneyProgressRecord } from './journeyService'
import { readProgress, summarize, toggleDone } from './progress'
import type { JourneyProgressData } from './progress'
import type { JourneyOutline } from './types'

type State =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'not_started' }
  | { phase: 'ready'; record: JourneyProgressRecord; progress: JourneyProgressData }

// The signed-in member's progress in one Journey: load it, start it once,
// tick/untick actions. Each change is saved right away, one save at a time,
// always sending the latest state.
export function useJourneyProgress(journey: JourneyOutline | null, userId: string | undefined) {
  const [state, setState] = useState<State>({ phase: 'loading' })
  const [starting, setStarting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const queue = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    if (!journey || !userId) return
    let cancelled = false
    setState({ phase: 'loading' })
    journeyService
      .getProgress(userId, journey.id)
      .then((record) => {
        if (cancelled) return
        setState(record ? { phase: 'ready', record, progress: readProgress(record.data) } : { phase: 'not_started' })
      })
      .catch(() => !cancelled && setState({ phase: 'error', message: 'Your progress couldn’t load.' }))
    return () => {
      cancelled = true
    }
  }, [journey, userId])

  const start = useCallback(async () => {
    if (!journey || !userId) return
    setStarting(true)
    try {
      const record = await journeyService.startJourney(userId, journey)
      setState({ phase: 'ready', record, progress: readProgress(record.data) })
    } catch {
      setState({ phase: 'error', message: 'The Journey couldn’t start. Please try again.' })
    } finally {
      setStarting(false)
    }
  }, [journey, userId])

  const toggle = useCallback(
    (actionId: string) => {
      if (!journey || state.phase !== 'ready') return
      const next = toggleDone(journey, state.progress, actionId)
      if (next === state.progress) return
      const record = state.record
      setState({ phase: 'ready', record, progress: next })
      setSaveError(null)
      setSaving(true)
      const complete = summarize(journey, next).complete
      queue.current = queue.current
        .then(() => journeyService.saveProgress(record.id, next, complete))
        .then(() => setSaving(false))
        .catch(() => {
          setSaving(false)
          setSaveError('Your last change wasn’t saved. Please check your connection and try again.')
        })
    },
    [journey, state],
  )

  const summary = useMemo(() => (journey && state.phase === 'ready' ? summarize(journey, state.progress) : null), [journey, state])

  return { state, summary, start, starting, toggle, saving, saveError }
}
