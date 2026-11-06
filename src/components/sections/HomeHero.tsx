import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { fadeUp } from '../../lib/motion'
import { usePageTexts } from '../../lib/usePageTexts'

// The top of the Home page (05/11/2026), from the design the owner approved.
//
// The visual is BUILT, not a screenshot: three tilted panels drawn in CSS
// with the real product's shapes. The design's renders carried invented
// data — ratings, revenue figures, named people posting — and a marketing
// page should not show made-up numbers as if they were someone's. These
// panels show structure, which is what the picture is actually there to
// say, and they stay sharp on any screen.
export default function HomeHero() {
  const t = usePageTexts()

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/[0.06] via-bg to-bg">
      <div className="container-px mx-auto max-w-wide py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-primary">{t.text('home.hero.eyebrow')}</p>
            <h1 className="mt-5 font-display text-[40px] font-extrabold leading-[1.05] tracking-tight text-navy sm:text-[52px] lg:text-[60px]">
              {t.text('home.hero.title1')}{' '}
              <span className="text-primary">{t.text('home.hero.title2')}</span>{' '}
              {t.text('home.hero.title3')}
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-navy/60">{t.text('home.hero.subtitle')}</p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/register" className="btn-primary inline-flex items-center gap-2">
                {t.text('home.hero.cta')}
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link to="/about" className="inline-flex items-center gap-2 text-[15px] font-semibold text-navy/70 transition-colors hover:text-navy">
                {t.text('home.hero.secondary')}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
            aria-hidden
          >
            <ProductPanels />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/** Three tilted panels suggesting the member's area. Decorative only. */
function ProductPanels() {
  return (
    <div className="relative mx-auto grid max-w-xl grid-cols-[0.8fr_1fr_0.8fr] items-center gap-2 sm:gap-3">
      <Panel className="translate-y-6 opacity-80" rows={[60, 90, 75, 45]} label="Find" />
      <Panel className="z-10 shadow-xl" rows={[80, 100, 55, 85, 40]} label="Home" tall />
      <Panel className="translate-y-6 opacity-80" rows={[70, 50, 95, 60]} label="Academy" />
    </div>
  )
}

function Panel({ className = '', rows, label, tall }: { className?: string; rows: number[]; label: string; tall?: boolean }) {
  return (
    <div className={`rounded-xl2 border border-navy/[0.08] bg-white/90 p-3 backdrop-blur ${className}`}>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-navy/15" />
        <span className="h-1.5 w-1.5 rounded-full bg-navy/15" />
        <span className="h-1.5 w-1.5 rounded-full bg-navy/15" />
        <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider text-navy/35">{label}</span>
      </div>
      <div className={`mt-3 space-y-2 ${tall ? 'pb-3' : ''}`}>
        <span className="block h-6 rounded-lg bg-primary/10" />
        {rows.map((w, i) => (
          <span key={i} className="block h-2.5 rounded-full bg-navy/[0.07]" style={{ width: `${w}%` }} />
        ))}
        {tall && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <span className="block h-10 rounded-lg bg-primary/[0.07]" />
            <span className="block h-10 rounded-lg bg-navy/[0.05]" />
          </div>
        )}
      </div>
    </div>
  )
}
