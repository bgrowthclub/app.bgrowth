import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Route, Sparkles, Users } from 'lucide-react'
import { formatMinutes } from '../../modules/journeys/estimate'
import type { JourneySummary } from '../../modules/journeys/types'

// A Journey on /journeys (19/11/2026, the owner's design): a dark top with
// the cover, "Free" and the number of stages on it, the Life World and the
// name; the description; the path drawn as one segment per stage; the time
// estimate when the Journey has one; who it is for; "View Journey". Only what
// list_journeys() returns — no invented progress, levels or tools. A sibling
// of JourneyCard.
export default function JourneyCatalogCard({ journey, worldName }: { journey: JourneySummary; worldName?: string }) {
  const stages = Math.max(0, journey.stageCount)
  return (
    <Link
      to={`/journeys/${journey.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-navy/[0.07] bg-white shadow-softer transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
    >
      <div className="relative h-44 overflow-hidden bg-navy p-4 text-white">
        {journey.coverImageUrl ? (
          <img src={journey.coverImageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-45 transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <Route size={96} className="absolute -bottom-5 -right-3 text-white/[0.07]" aria-hidden />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/55 to-transparent" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            {journey.isFree ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide">
                <Sparkles size={11} aria-hidden /> Free
              </span>
            ) : (
              <span />
            )}
            {stages > 0 && (
              <span className="rounded-md bg-navy/70 px-2 py-0.5 text-[11px] font-bold backdrop-blur">
                {stages} {stages === 1 ? 'stage' : 'stages'}
              </span>
            )}
          </div>
          <div>
            {worldName && <p className="text-[11px] font-bold uppercase tracking-wide text-sky-300">{worldName}</p>}
            <h3 className="line-clamp-2 font-display text-[17px] font-bold leading-snug">{journey.name}</h3>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        {journey.shortDescription && <p className="line-clamp-2 text-[13.5px] leading-relaxed text-navy/55">{journey.shortDescription}</p>}
        {stages > 0 && (
          <div className="mt-4 rounded-xl border border-navy/[0.06] bg-bg-soft p-3.5">
            <p className="text-[12.5px] font-semibold text-navy/70">
              {stages}-stage path
            </p>
            <div className="mt-2.5 flex gap-1" aria-hidden>
              {Array.from({ length: Math.min(stages, 12) }, (_, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i === 0 ? 'bg-primary' : 'bg-navy/10'}`} />
              ))}
            </div>
          </div>
        )}
        {journey.estimatedMinutes > 0 && (
          <p className="mt-4 flex">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-navy/[0.08] bg-white px-2 py-1 text-[12px] font-medium text-navy/65">
              <Clock size={13} aria-hidden /> ~{formatMinutes(journey.estimatedMinutes)}
            </span>
          </p>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-navy/[0.06] px-5 py-4">
        <span className="line-clamp-1 inline-flex min-w-0 items-center gap-1.5 text-[12.5px] text-navy/50">
          {journey.audience && (
            <>
              <Users size={13} className="shrink-0" aria-hidden /> <span className="truncate">{journey.audience}</span>
            </>
          )}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-white">
          View Journey <ArrowRight size={15} aria-hidden />
        </span>
      </div>
    </Link>
  )
}
