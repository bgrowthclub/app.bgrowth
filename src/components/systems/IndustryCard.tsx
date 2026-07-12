import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const MotionLink = motion(Link)

interface Props {
  icon: LucideIcon
  name: string
  description: string
  to: string
  index?: number
  count?: number // when provided, shows "N Business Systems" + a CTA row (used on the Workspace page)
  ctaLabel?: string
  // When count is 0, skip the "Coming soon" status text and show only the
  // CTA (used by LifeWorlds, where every card gets a uniform right-aligned
  // "Explore →"/"Preview →" instead of a two-sided status+CTA row).
  // Defaults to false so WorkspacesPage's existing cards are unaffected.
  hideEmptyStatus?: boolean
}

export default function IndustryCard({
  icon: Icon,
  name,
  description,
  to,
  index = 0,
  count,
  ctaLabel,
  hideEmptyStatus = false,
}: Props) {
  const showStatus = count !== undefined && !(count === 0 && hideEmptyStatus)
  return (
    <MotionLink
      to={to}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="group flex flex-col gap-4 rounded-xl2 border border-navy/[0.06] bg-white p-5 shadow-softer transition-all duration-300 hover:border-primary/20 hover:shadow-soft"
    >
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-bg-soft text-primary transition-colors duration-300 group-hover:bg-grad-primary group-hover:text-white">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div>
        <p className="font-display text-[15px] font-semibold text-navy">{name}</p>
        <p className="mt-1 text-[13px] text-navy/45">{description}</p>
      </div>

      {(showStatus || ctaLabel) && (
        <div
          className={`mt-1 flex items-center border-t border-navy/[0.06] pt-3 ${
            showStatus ? 'justify-between' : 'justify-end'
          }`}
        >
          {showStatus && (
            <span className="text-[11.5px] font-medium text-navy/35">
              {count! > 0 ? `${count} Business System${count === 1 ? '' : 's'}` : 'Coming soon'}
            </span>
          )}
          {ctaLabel && (
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
              {ctaLabel}
              <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      )}
    </MotionLink>
  )
}
