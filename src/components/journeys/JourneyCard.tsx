import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Route } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatMinutes } from '../../modules/journeys/estimate'
import type { JourneySummary } from '../../modules/journeys/types'

interface Props {
  journey: JourneySummary
  /** The Life World it belongs to, when its category tells. */
  world?: { name: string; icon: LucideIcon }
  /** Where the card leads; none = shown without a link. */
  to?: string
  index?: number
}

const CARD = 'group flex h-full flex-col overflow-hidden rounded-xl2 border border-navy/[0.06] bg-white shadow-softer transition-all duration-[250ms] ease-out'

// One published Journey in the list: cover, Life World, name, what it's
// about, how many stages it has and its estimated time.
export default function JourneyCard({ journey, world, to, index = 0 }: Props) {
  const WorldIcon = world?.icon
  const body = (
    <>
      <div className="relative aspect-[16/9] bg-primary/[0.06]">
        {journey.coverImageUrl ? (
          <img src={journey.coverImageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-primary/40">
            <Route size={40} strokeWidth={1.6} aria-hidden />
          </span>
        )}
        {journey.isFree && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-600 shadow-softer">Free</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {world && WorldIcon && (
          <p className="mb-2 inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-primary">
            <WorldIcon size={13} aria-hidden /> {world.name}
          </p>
        )}
        <p className="font-display text-[16px] font-semibold leading-snug text-navy">{journey.name}</p>
        {journey.shortDescription && <p className="mt-1.5 line-clamp-3 text-[13.5px] leading-relaxed text-navy/55">{journey.shortDescription}</p>}
        <div className="mt-auto flex items-center justify-between border-t border-navy/[0.06] pt-3 [&:not(:first-child)]:mt-5">
          <span className="text-[12px] font-medium text-navy/40">
            {journey.stageCount} {journey.stageCount === 1 ? 'stage' : 'stages'}
            {journey.estimatedMinutes > 0 && <> · about {formatMinutes(journey.estimatedMinutes)}</>}
          </span>
          {to && (
            <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary">
              View Journey <ArrowRight size={13} className="transition-transform duration-[250ms] group-hover:translate-x-1" />
            </span>
          )}
        </div>
      </div>
    </>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index, 6) * 0.06, duration: 0.5, ease: 'easeOut' }}
      className="h-full"
    >
      {to ? (
        <Link to={to} className={`${CARD} hover:-translate-y-1 hover:border-primary/20 hover:shadow-glow`}>
          {body}
        </Link>
      ) : (
        <div className={CARD}>{body}</div>
      )}
    </motion.div>
  )
}
