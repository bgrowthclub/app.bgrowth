import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import heroImage from '../../assets/home-hero.webp'
import { fadeUp } from '../../lib/motion'
import { usePageTexts } from '../../lib/usePageTexts'

// The top of the Home page (05/11/2026), from the design the owner approved.
//
// The visual is the render from the owner's own design (she asked for it
// on 05/11/2026, after I had drawn placeholder panels in CSS). It is
// cropped out of that composition and saved as a webp.
//
// It illustrates the platform, including parts still being built — the
// three pillars further down carry the honest "coming soon" badges, which
// is where that is stated. It is decorative: alt="" keeps a screen reader
// from reading out a picture of a screen, and width/height are set so the
// page doesn't jump while it loads.
export default function HomeHero() {
  const t = usePageTexts()

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/[0.06] via-bg to-bg">
      <div className="container-px mx-auto max-w-page pb-6 pt-24 sm:pb-8 sm:pt-28 lg:pb-10 lg:pt-32">
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
            className="relative -mx-4 sm:mx-0 lg:-mr-16 xl:-mr-28 2xl:-mr-40"
          >
            {/* The render is a rectangle with straight edges. A mask fades
                its left and bottom into the page, the way it does in the
                design, so it reads as part of the page and not as a
                picture pasted on top. */}
            <img
              src={heroImage}
              alt=""
              width={1152}
              height={582}
              fetchPriority="high"
              className="w-full max-w-none [mask-image:linear-gradient(to_right,transparent,black_14%),linear-gradient(to_top,transparent,black_18%)] [mask-composite:intersect] [-webkit-mask-composite:source-in]"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
