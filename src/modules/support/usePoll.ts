import { useEffect, useRef } from 'react'

// Calls `task` every `ms` while `enabled` and the tab is visible — how the
// support pages stay live without a realtime socket.
export function usePoll(task: () => void, ms: number, enabled = true) {
  const saved = useRef(task)
  saved.current = task

  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') saved.current()
    }, ms)
    return () => window.clearInterval(id)
  }, [ms, enabled])
}
