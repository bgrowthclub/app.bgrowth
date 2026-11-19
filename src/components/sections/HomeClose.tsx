import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { fadeUp, viewportOnce } from '../../lib/motion'
import { usePageTexts } from '../../lib/usePageTexts'

// The closing band (05/11/2026; restyled 19/11/2026 from the owner's
// design): a pill, the title with its last words in light blue, the two
// buttons and a few short facts — only true ones, edited in Admin → Site.
export default function HomeClose() {
  const t = usePageTexts()
  const title = t.text('home.close.title')
  const highlight = t.text('home.close.highlight')
  // The light-blue part is drawn only when the title really contains it, so
  // editing one field never shows words twice.
  const at = highlight ? title.lastIndexOf(highlight) : -1
  const checks = t.items('home.close.checks').filter((c) => c.trim())

  return (
    <section className="relative overflow-hidden bg-navy">
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30 blur-3xl"
      />
      <div className="container-px relative mx-auto max-w-page py-20 text-center sm:py-28">
        <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={fadeUp}>
          {t.text('home.close.eyebrow') && (
            <p className="mx-auto w-fit rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-white/80">
              {t.text('home.close.eyebrow')}
            </p>
          )}
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-[34px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[48px]">
            {at >= 0 ? (
              <>
                {title.slice(0, at)}
                <span className="bg-gradient-to-r from-sky-300 to-indigo-300 bg-clip-text text-transparent">{highlight}</span>
                {title.slice(at + highlight.length)}
              </>
            ) : (
              title
            )}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[16.5px] leading-relaxed text-white/70">{t.text('home.close.subtitle')}</p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register" className="btn-primary inline-flex items-center gap-2 !px-7">
              {t.text('home.close.cta')}
              <ArrowRight size={18} aria-hidden />
            </Link>
            <Link
              to="/systems"
              className="inline-flex items-center rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-white/15"
            >
              {t.text('home.close.secondary')}
            </Link>
          </div>

          {checks.length > 0 && (
            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13.5px] text-white/65">
              {checks.map((c) => (
                <li key={c} className="inline-flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-400" aria-hidden /> {c}
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </section>
  )
}
