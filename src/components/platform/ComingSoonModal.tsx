import { useEffect } from 'react'
import { Sparkles, X } from 'lucide-react'
import Button from '../ui/Button'

interface Props {
  open: boolean
  onClose: () => void
}

// Elegant, minimal confirmation that a locked section is intentional, not
// broken — triggered from any locked entry point (Sidebar nav items,
// Dashboard Quick Actions) via ComingSoonModalProvider.
export default function ComingSoonModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  function handleNotifyMe() {
    // Future:
    // Capture interest (email or account flag) once a real notify-me
    // service exists — no backend/persistence today.
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl3 border border-navy/[0.06] bg-white p-8 text-center shadow-glow">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-navy/30 transition-colors hover:bg-bg-soft hover:text-navy"
        >
          <X size={16} />
        </button>

        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
          <Sparkles size={24} strokeWidth={2} />
        </div>

        <h2 className="mt-5 font-display text-xl font-bold text-navy">Coming Soon</h2>
        <p className="mt-2.5 text-[14px] leading-relaxed text-navy/55">
          We&rsquo;re building something amazing. This experience is currently under development and will be
          available in a future BGrowth update.
        </p>

        <div className="mt-7 space-y-2.5">
          <Button type="button" onClick={handleNotifyMe} className="w-full">
            Notify Me
          </Button>
          <Button type="button" onClick={onClose} variant="secondary" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
