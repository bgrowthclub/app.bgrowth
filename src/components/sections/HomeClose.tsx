import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { fadeUp, viewportOnce } from '../../lib/motion'
import { usePageTexts } from '../../lib/usePageTexts'

// The closing band (05/11/2026). The page used to end on "Why BGrowth
// exists" and drop straight into the footer, which left someone who had
// read the whole thing with nowhere to go. Every one of the owner's
// designs ends on an invitation; this is that invitation.
export default function HomeClose() {
  const t = usePageTexts()

  return (
    <section className="relative overflow-hidden bg-navy">
      {/* One soft light from the top, so the band isn't a flat block. */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-3xl"
      />
      <div className="container-px relative mx-auto max-w-page py-16 text-center sm:py-20">
        <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={fadeUp}>
          <h2 className="mx-auto max-w-2xl font-display text-[30px] font-extrabold leading-tight tracking-tight text-white sm:text-[38px]">
            {t.text('home.close.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-white/65">{t.text('home.close.subtitle')}</p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-bold text-navy transition-colors hover:bg-white/90"
            >
              {t.text('home.close.cta')}
              <ArrowRight size={18} aria-hidden />
            </Link>
            <Link to="/systems" className="text-[15px] font-semibold text-white/75 transition-colors hover:text-white">
              {t.text('home.close.secondary')}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
