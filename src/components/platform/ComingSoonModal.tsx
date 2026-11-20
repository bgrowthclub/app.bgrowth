import { useEffect, useState } from 'react'
import { ArrowRight, Bell, Check, X } from 'lucide-react'
import cube from '../../assets/coming-soon-cube.webp'
import { newsletterService } from '../../modules/newsletter/newsletterService'

interface Props {
  open: boolean
  /** What is coming — a menu item's label ("Club", "Marketplace"…); absent = generic. */
  feature?: string
  onClose: () => void
}

// Menu labels → the product's own name.
const PRODUCT_NAMES: Record<string, string> = {
  Club: 'BGrowth Club™',
  Community: 'BGrowth Club™',
  Marketplace: 'BGrowth Marketplace™',
  'Find Professionals': 'BGrowth Find™',
  Find: 'BGrowth Find™',
  'BGrowth App': 'BGrowth App™',
  Resources: 'BGrowth Resources™',
}

type NotifyState = 'idle' | 'sending' | 'done' | 'already' | 'error'

// "Coming soon" for every locked surface of the member area (20/11/2026, the
// owner's design, light version — the dark one comes with dark mode, the
// rocket image is kept for it in assets). Says WHAT is coming, no date and no
// progress figure (we don't promise either), and "Notify me" really does
// something: it puts the signed-in member on the newsletter, where every
// launch is announced. Which feature they asked about is not stored yet.
export default function ComingSoonModal({ open, feature, onClose }: Props) {
  const [state, setState] = useState<NotifyState>('idle')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setState('idle')
    setMessage(null)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const name = feature ? PRODUCT_NAMES[feature] ?? feature : null

  async function notifyMe() {
    setState('sending')
    setMessage(null)
    try {
      const mine = await newsletterService.getMine()
      if (mine.status === 'subscribed') {
        setState('already')
        return
      }
      await newsletterService.saveMine(true, mine.interests ?? [])
      setState('done')
    } catch (err) {
      setState('error')
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-md" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coming-soon-title"
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/70 bg-white p-7 text-center shadow-glow sm:p-9"
      >
        <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 -right-16 h-48 w-48 rounded-full bg-violet-400/15 blur-3xl" aria-hidden />
        <button
          type="button"
          onClick={onClose}
          title="Close"
          aria-label="Close"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-navy/35 transition-colors hover:bg-bg-soft hover:text-navy"
        >
          <X size={17} />
        </button>

        <img src={cube} alt="" width={180} height={180} className="relative mx-auto h-36 w-36 object-contain mix-blend-multiply sm:h-40 sm:w-40" />

        <p className="relative mx-auto mt-3 w-fit rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
          In development
        </p>
        <h2 id="coming-soon-title" className="relative mt-4 font-display text-[26px] font-bold leading-tight text-navy">
          {name ? (
            <>
              {name} <span className="block text-primary">is coming soon</span>
            </>
          ) : (
            'Coming soon'
          )}
        </h2>
        <p className="relative mx-auto mt-3 max-w-sm text-[14.5px] leading-relaxed text-navy/60">
          We’re building this part of BGrowth right now. Want to know the day it opens? We announce every launch in our
          newsletter.
        </p>

        <div className="relative mt-7 space-y-2.5">
          {state === 'done' || state === 'already' ? (
            <p role="status" className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-[14px] font-semibold text-emerald-700">
              <Check size={17} aria-hidden />
              {state === 'done' ? 'Done — we’ll let you know in the newsletter.' : 'You’re already on our newsletter — you’ll hear it there.'}
            </p>
          ) : (
            <button
              type="button"
              onClick={notifyMe}
              disabled={state === 'sending'}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-grad-primary px-5 py-3.5 text-[15px] font-semibold text-white shadow-soft transition-opacity hover:opacity-95 disabled:opacity-60"
            >
              <Bell size={17} aria-hidden /> {state === 'sending' ? 'One moment…' : 'Notify me when it opens'}
            </button>
          )}
          {message && <p className="text-[13px] text-red-500">{message}</p>}
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-navy/10 bg-white px-5 py-3 text-[14.5px] font-semibold text-navy/70 transition-colors hover:border-primary/25 hover:text-navy"
          >
            Back <ArrowRight size={15} aria-hidden />
          </button>
        </div>
        <p className="relative mt-4 text-[12px] text-navy/40">No spam. Unsubscribe anytime with one click.</p>
      </div>
    </div>
  )
}
