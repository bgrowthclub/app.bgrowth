import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import Button from './Button'

interface Props {
  eyebrow: string
  title: string
  description: string
  primaryLabel: string
  primaryTo: string
  secondaryLabel: string
  secondaryTo: string
}

// The bold navy-gradient closing section used at the end of longer content
// pages — deliberately distinct from the Newsletter section's light
// glass-card (see MemberBanner), reserved for a page's single biggest
// closing moment rather than every "join" prompt.
export default function PremiumCTA({
  eyebrow,
  title,
  description,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-xl3 bg-grad-navy px-8 py-16 text-center md:px-16 md:py-20"
    >
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[560px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(47,128,255,0.35), rgba(255,255,255,0) 70%)' }}
      />

      <div className="relative mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-white/90">
        <Sparkles size={14} strokeWidth={2.5} aria-hidden="true" />
        {eyebrow}
      </div>

      <h2 className="relative mx-auto mt-5 max-w-xl font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
        {title}
      </h2>
      <p className="relative mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/70">{description}</p>

      <div className="relative mx-auto mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button to={primaryTo} variant="secondary" className="!border-transparent !shadow-none">
          {primaryLabel}
        </Button>
        <Button to={secondaryTo} variant="ghost" className="!border !border-white/20 !text-white hover:!bg-white/10 hover:!text-white">
          {secondaryLabel}
        </Button>
      </div>
    </motion.div>
  )
}
