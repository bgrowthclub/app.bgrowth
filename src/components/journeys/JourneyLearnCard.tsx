import { Compass, GraduationCap, Star, Target } from 'lucide-react'

const ICONS = [Target, Compass, Star]

// "What you'll learn" (20/11/2026, the owner's design): the Journey's own
// expected outcomes, written in Studio. Nothing shows when there are none.
export default function JourneyLearnCard({ outcomes, goal }: { outcomes: string[]; goal?: string }) {
  const items = outcomes.filter((o) => o.trim())
  if (items.length === 0) return null
  return (
    <section className="flex flex-col gap-5 rounded-[24px] border border-navy/[0.07] bg-white p-5 shadow-softer sm:flex-row sm:p-6">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-blue-50 text-primary">
        <GraduationCap size={26} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-[18px] font-bold text-navy">What you’ll learn</h2>
        {goal && <p className="mt-0.5 text-[13.5px] text-navy/55">Your goal: {goal}</p>}
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <li key={`${i}-${item}`} className="flex items-start gap-3 text-[14px] leading-snug text-navy/75">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 text-primary">
                  <Icon size={18} aria-hidden />
                </span>
                <span className="pt-1">{item}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
