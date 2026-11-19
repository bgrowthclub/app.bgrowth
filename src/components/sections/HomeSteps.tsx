import { motion } from 'framer-motion'
import { BarChart3, BookOpen, Compass, Users, Wrench } from 'lucide-react'
import { fadeUp, viewportOnce } from '../../lib/motion'
import { usePageTexts } from '../../lib/usePageTexts'

// "From ideas to real progress" — the five steps under the hero. Since
// 19/11/2026 (the owner's design) each step is a card: a colored icon, its
// number, the verb and a sentence. The icons and colors carry no meaning of
// their own, so they stay out of the accessibility tree.
const STEPS = [
  { icon: Compass, tone: 'bg-blue-50 text-blue-600' },
  { icon: BookOpen, tone: 'bg-violet-50 text-violet-600' },
  { icon: Wrench, tone: 'bg-indigo-50 text-indigo-600' },
  { icon: BarChart3, tone: 'bg-emerald-50 text-emerald-600' },
  { icon: Users, tone: 'bg-amber-50 text-amber-600' },
]

export default function HomeSteps() {
  const t = usePageTexts()
  // Each line is "Verb — what it leads to", so the two halves can be styled
  // differently while the person edits one plain line in Admin → Site.
  const steps = t.items('home.steps.items')

  return (
    <section className="border-y border-navy/[0.05] bg-bg-soft py-20 md:py-24">
      <div className="container-px mx-auto max-w-page">
        <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={fadeUp} className="text-center">
          <p className="mx-auto w-fit rounded-full border border-primary/15 bg-white px-3.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-primary">
            {t.text('home.steps.eyebrow')}
          </p>
          <h2 className="mt-4 font-display text-[30px] font-extrabold tracking-tight text-navy sm:text-[38px]">{t.text('home.steps.title')}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-navy/60">{t.text('home.steps.subtitle')}</p>
        </motion.div>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, i) => {
            const [verb, rest] = splitStep(step)
            const { icon: Icon, tone } = STEPS[i % STEPS.length]
            return (
              <motion.li
                key={step}
                initial="hidden"
                whileInView="show"
                viewport={viewportOnce}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl border border-navy/[0.07] bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft"
              >
                <div className="flex items-start justify-between">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
                    <Icon size={19} aria-hidden />
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-navy/25" aria-hidden>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <p className="mt-5 text-[15px] font-bold text-navy">{verb}</p>
                {rest && <p className="mt-1 text-[13.5px] leading-relaxed text-navy/55">{rest}</p>}
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
