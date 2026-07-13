import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import Button from '../../components/ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

// The exact pipeline from this milestone's spec — every step is simulated
// with a short delay, nothing here calls GitHub, Stripe, or any real
// deployment. "Ready to Publish" is the pipeline's own final state; the
// success confirmation is a separate screen shown once it's reached.
const STEPS = [
  'Validate Product',
  'Generate Product Record',
  'Prepare Website Data',
  'Prepare Search Data',
  'Prepare Category Index',
  'Prepare Payment Configuration',
  'Ready to Publish',
]

const STEP_DELAY_MS = 450

export default function PublishDialog({ open, onClose, onComplete }: Props) {
  const [stepIndex, setStepIndex] = useState(-1)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!open) {
      setStepIndex(-1)
      setDone(false)
      return
    }
    setStepIndex(0)
  }, [open])

  useEffect(() => {
    if (!open || done || stepIndex < 0 || stepIndex >= STEPS.length) return
    const timer = setTimeout(() => {
      if (stepIndex === STEPS.length - 1) {
        onComplete()
        setDone(true)
      } else {
        setStepIndex((i) => i + 1)
      }
    }, STEP_DELAY_MS)
    return () => clearTimeout(timer)
  }, [open, done, stepIndex, onComplete])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-xl3 border border-navy/[0.06] bg-white p-8 shadow-glow">
        {!done ? (
          <>
            <h2 className="font-display text-lg font-bold text-navy">Publishing…</h2>
            <ul className="mt-5 space-y-3">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-3">
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full">
                    {i < stepIndex ? (
                      <Check size={15} className="text-primary" />
                    ) : i === stepIndex ? (
                      <Loader2 size={15} className="animate-spin text-primary" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-navy/15" />
                    )}
                  </div>
                  <span className={`text-[13.5px] ${i <= stepIndex ? 'text-navy' : 'text-navy/35'}`}>{step}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
              <Check size={24} strokeWidth={2.5} />
            </div>
            <h2 className="mt-4 font-display text-lg font-bold text-navy">Product Published</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-navy/55">
              The product record, website data, search data, category index, and payment configuration are
              prepared. Nothing was deployed — see Publishing tab for what connects next.
            </p>
            <Button type="button" onClick={onClose} className="mt-6 w-full">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
