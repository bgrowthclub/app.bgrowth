import { motion } from 'framer-motion'
import { BarChart3, BookOpen, Compass, LayoutGrid, Users } from 'lucide-react'
import { fadeUp, viewportOnce } from '../../lib/motion'
import { usePageTexts } from '../../lib/usePageTexts'

// "From ideas to real progress" — the five steps under the hero
// (05/11/2026). Each step is a verb and what it leads to; the icons carry
// no meaning of their own, so they stay out of the accessibility tree.
const ICONS = [Compass, BookOpen, LayoutGrid, BarChart3, Users]

export default function HomeSteps() {
  const t = usePageTexts()
  // Each line is "Verb — what it leads to", so the two halves can be styled
  // differently while the person edits one plain line in Admin → Site.
  const steps = t.items('home.steps.items')

  return (
    <section className="bg-bg pb-20 pt-10 md:pb-28 md:pt-12">
      <div className="container-px mx-auto max-w-page">
        <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={fadeUp} className="text-center">
          <p className="eyebrow">{t.text('home.steps.eyebrow')}</p>
          <h2 className="mt-3 font-display text-[30px] font-extrabold tracking-tight text-navy sm:text-[36px]">
            {t.text('home.steps.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-navy/60">{t.text('home.steps.subtitle')}</p>
        </motion.div>

        {/* The thin line between the steps, as in the design: it turns five
            separate icons into one path. Decorative, so it is drawn behind
            and hidden where the steps stack. */}
        <ol className="relative mt-12 grid gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <span
            aria-hidden
            className="pointer-events-none absolute left-[10%] right-[10%] top-6 hidden h-px bg-gradient-to-r from-transparent via-navy/[0.12] to-transparent lg:block"
          />
          {steps.map((step, i) => {
            const [verb, rest] = splitStep(step)
            const Icon = ICONS[i % ICONS.length]
            return (
              <motion.li
                key={step}
                initial="hidden"
                whileInView="show"
                viewport={viewportOnce}
                variants={fadeUp}
                custom={i}
                className="relative text-center"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-primary/10 bg-bg bg-gradient-to-b from-primary/[0.10] to-primary/[0.04]">
                  <Icon size={20} className="text-primary" aria-hidden />
                </span>
                <p className="mt-3 text-[15px] font-bold text-navy">{verb}</p>
                {rest && <p className="mt-0.5 text-[14px] text-navy/55">{rest}</p>}
              </motion.li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

/** "Discover — new opportunities" → ["Discover", "new opportunities"]. */
function splitStep(step: string): [string, string] {
  const at = step.indexOf('—')
  if (at < 0) return [step.trim(), '']
  return [step.slice(0, at).trim(), step.slice(at + 1).trim()]
}
