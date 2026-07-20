import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'
import AuthIllustration from './AuthIllustration'
import { fadeUp } from '../../lib/motion'

interface Props {
  headline: ReactNode
  subtitle: string
  illustration?: ReactNode
}

// /privacy and /terms don't exist as routes yet, and Footer.tsx's existing
// links to them are a separate, pre-existing gap out of scope here. Rendered
// inert rather than pointed at an unrelated page.
// TODO: link to /privacy and /terms once those pages ship.
const LEGAL_LINKS = ['Privacy Policy', 'Terms of Service']

export default function AuthBrandPanel({ headline, subtitle, illustration = <AuthIllustration /> }: Props) {
  return (
    <aside className="relative flex flex-col overflow-hidden bg-bg-soft px-8 py-10 lg:px-16 lg:py-12">
      {/* Depth: soft light, not a flat fill — two low-opacity glows plus a
          faint dot texture, all well under "noisy." */}
      <div className="pointer-events-none absolute inset-0 bg-grad-radial-soft" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-accent/[0.07] blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{ backgroundImage: 'radial-gradient(rgba(10,27,77,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show" className="relative z-10">
        <Link to="/" className="flex w-fit items-center gap-2.5">
          <img src={logo} alt="BGrowth" className="h-8 w-8 object-contain" />
          <span className="font-display text-[17px] font-bold tracking-tight text-navy">BGrowth</span>
        </Link>
      </motion.div>

      <motion.div
        variants={fadeUp}
        custom={1}
        initial="hidden"
        animate="show"
        className="relative z-10 mt-14 max-w-md lg:mt-20"
      >
        {/* Not a real heading — this is decorative brand copy in an aside,
            not part of the page's content outline. The page's one <h1>
            lives in AuthHeader, inside the actual Authentication Container. */}
        <p className="font-display text-[38px] font-bold leading-[1.08] tracking-tight text-navy sm:text-[44px] lg:text-[52px]">
          {headline}
        </p>
        <p className="mt-5 max-w-sm text-[16px] leading-relaxed text-navy/55">{subtitle}</p>
      </motion.div>

      {/* Illustration — the hero element of the panel: grows to fill the
          remaining space, but stays a bounded, centered square within it
          so it scales gracefully instead of overflowing. */}
      <motion.div
        variants={fadeUp}
        custom={2}
        initial="hidden"
        animate="show"
        className="relative z-10 mt-6 flex min-h-0 flex-1 items-center justify-center"
      >
        <div className="aspect-square w-full max-w-[440px]">{illustration}</div>
      </motion.div>

      <div className="relative z-10 flex gap-6 text-[12.5px] text-navy/35">
        {LEGAL_LINKS.map((label) => (
          <span key={label} className="cursor-default">
            {label}
          </span>
        ))}
      </div>
    </aside>
  )
}
