import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import ComingSoonModal from './ComingSoonModal'

interface ComingSoonModalContextValue {
  openComingSoon: () => void
}

const ComingSoonModalContext = createContext<ComingSoonModalContextValue | undefined>(undefined)

// Shared "Coming Soon" trigger for every locked surface in the Workspace
// shell (Sidebar nav items, Dashboard Quick Actions, ...) — one modal
// instance, rendered once here, so clicking any locked entry point opens
// the exact same premium modal regardless of where it was clicked from.
export function ComingSoonModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <ComingSoonModalContext.Provider value={{ openComingSoon: () => setOpen(true) }}>
      {children}
      <ComingSoonModal open={open} onClose={() => setOpen(false)} />
    </ComingSoonModalContext.Provider>
  )
}

export function useComingSoonModal() {
  const ctx = useContext(ComingSoonModalContext)
  if (!ctx) throw new Error('useComingSoonModal must be used within a ComingSoonModalProvider')
  return ctx
}
