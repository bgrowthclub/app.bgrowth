import { TrendingUp, Lightbulb, Rocket } from 'lucide-react'

// Abstract, text-free composition for the Auth Brand Panel — a growth-chart
// shape plus floating concept badges (growth, learning, progress). Shared
// as-is across every Authentication System page; purely decorative.
export default function AuthIllustration() {
  return (
    <div className="relative mt-10 h-48 w-full max-w-md sm:h-56 lg:h-64" aria-hidden="true">
      <div className="absolute inset-x-6 bottom-0 top-6 rounded-xl3 border border-navy/[0.06] bg-white shadow-glow" />

      <div className="absolute bottom-8 left-14 flex items-end gap-2.5 sm:gap-3">
        <div className="h-10 w-6 rounded-md bg-primary/15 sm:h-12 sm:w-7" />
        <div className="h-16 w-6 rounded-md bg-primary/30 sm:h-20 sm:w-7" />
        <div className="h-24 w-6 rounded-md bg-grad-primary sm:h-28 sm:w-7" />
        <div className="h-14 w-6 rounded-md bg-primary/25 sm:h-16 sm:w-7" />
      </div>

      <div className="absolute -top-2 right-6 grid h-14 w-14 place-items-center rounded-2xl bg-grad-primary text-white shadow-glow">
        <TrendingUp size={24} strokeWidth={2} />
      </div>
      <div className="absolute top-16 right-20 grid h-11 w-11 place-items-center rounded-2xl bg-white text-primary shadow-softer sm:top-20 sm:right-24">
        <Lightbulb size={18} strokeWidth={2} />
      </div>
      <div className="absolute bottom-16 left-0 grid h-11 w-11 place-items-center rounded-2xl bg-white text-primary shadow-softer">
        <Rocket size={18} strokeWidth={2} />
      </div>
    </div>
  )
}
