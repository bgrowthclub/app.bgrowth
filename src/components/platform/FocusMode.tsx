import { createContext, useContext } from 'react'

// Focus mode (20/11/2026, the owner's choice): a page inside the member area
// can ask PlatformLayout to hide its side menu and top bar, so only the page
// is left — today the course lesson. Not a third layout: the same one with
// its chrome hidden. Outside PlatformLayout the hook answers "not available".
export interface FocusModeValue {
  available: boolean
  focus: boolean
  setFocus: (on: boolean) => void
}

export const FocusModeContext = createContext<FocusModeValue>({ available: false, focus: false, setFocus: () => undefined })

export function useFocusMode(): FocusModeValue {
  return useContext(FocusModeContext)
}
