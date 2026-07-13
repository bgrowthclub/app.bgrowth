import { useEffect, useState, type ReactNode } from 'react'

interface Props {
  trigger: (state: { open: boolean; toggle: () => void }) => ReactNode
  children: ReactNode
  panelClassName?: string
  align?: 'left' | 'right'
}

// Shared primitive behind the TopBar's icon-triggered panels (Notifications,
// Quick Actions, Account) — one place for open state, Escape-to-close, and
// click-outside-to-close instead of three copies of the same scaffolding.
// Not promoted to ui/ yet since nothing outside the Platform Shell needs it —
// move it there if a second area of the app needs the same pattern.
export default function Popover({ trigger, children, panelClassName = '', align = 'right' }: Props) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const toggle = () => setOpen((v) => !v)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div className="relative">
      {trigger({ open, toggle })}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div
            onClick={close}
            className={`absolute z-50 mt-2 rounded-xl2 border border-navy/[0.06] bg-white shadow-glow ${
              align === 'right' ? 'right-0' : 'left-0'
            } ${panelClassName}`}
          >
            {children}
          </div>
        </>
      )}
    </div>
  )
}
