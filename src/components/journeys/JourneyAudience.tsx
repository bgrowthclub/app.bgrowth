import { CheckCircle2, Users } from 'lucide-react'

interface Props {
  audience: string
  outcomes: string[]
}

// "Who it's for" and "What you'll have at the end" on a Journey's public
// page — both written in Studio → Journeys, each shown only when set.
export default function JourneyAudience({ audience, outcomes }: Props) {
  if (!audience && outcomes.length === 0) return null
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {audience && (
        <div className="rounded-xl2 border border-navy/[0.06] bg-white p-5 shadow-softer">
          <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-primary">
            <Users size={14} aria-hidden /> Who it’s for
          </p>
          <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed text-navy/70">{audience}</p>
        </div>
      )}
      {outcomes.length > 0 && (
        <div className={`rounded-xl2 border border-navy/[0.06] bg-white p-5 shadow-softer ${audience ? '' : 'md:col-span-2'}`}>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-primary">What you’ll have at the end</p>
          <ul className="mt-2.5 space-y-2">
            {outcomes.map((outcome, i) => (
              <li key={i} className="flex gap-2 text-[14.5px] leading-relaxed text-navy/70">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden /> {outcome}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
