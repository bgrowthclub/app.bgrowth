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
      <div className="container-px mx-auto max-w-wide pb-10 pt-14 sm:pb-12 sm:pt-16 lg:pb-16 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-primary">{t.text('home.lead.kicker')}</p>
            <h1 className="mt-5 font-display text-[40px] font-extrabold leading-[1.05] tracking-tight text-navy sm:text-[52px] lg:text-[60px]">
              {t.text('home.lead.line1')}{' '}
              <span className="text-primary">{t.text('home.lead.word')}</span>{' '}
              {t.text('home.lead.line2')}
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-navy/60">{t.text('home.lead.text')}</p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/register" className="btn-primary inline-flex items-center gap-2">
                {t.text('home.lead.cta')}
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link to="/about" className="inline-flex items-center gap-2 text-[15px] font-semibold text-navy/70 transition-colors hover:text-navy">
                {t.text('home.lead.secondary')}
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
    <div // On a phone only the middle panel is shown: three of them side by side
      // at that width are too small to read as anything.
      className="relative mx-auto grid w-full max-w-[560px] grid-cols-1 items-center gap-2.5 px-6 sm:grid-cols-[0.82fr_1fr_0.82fr] sm:gap-3.5 sm:px-0">
      <Panel className="hidden translate-y-7 opacity-85 sm:block" rows={[60, 90, 75, 45, 65]} label="Find" />
      <Panel className="z-10 shadow-2xl" rows={[80, 100, 55, 85, 40, 70]} label="Home" tall />
      <Panel className="hidden translate-y-7 opacity-85 sm:block" rows={[70, 50, 95, 60, 80]} label="Academy" />
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
        <span className="block h-7 rounded-lg bg-primary/10" />
        {rows.map((w, i) => (
          <span key={i} className="block h-2.5 rounded-full bg-navy/[0.08]" style={{ width: `${w}%` }} />
        ))}
        {tall && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <span className="block h-12 rounded-lg bg-primary/[0.08]" />
            <span className="block h-12 rounded-lg bg-navy/[0.05]" />
          </div>
        )}
      </div>
    </div>
  )
}
