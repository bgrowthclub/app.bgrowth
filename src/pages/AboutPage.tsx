import { Target, Compass, Layers, GitBranch, Telescope, GraduationCap, ArrowRight } from 'lucide-react'
import SEO from '../components/seo/SEO'
import { seoPage } from '../data/seoPages'
import SectionHeader from '../components/ui/SectionHeader'
import Button from '../components/ui/Button'
import { usePageTexts } from '../lib/usePageTexts'

// The texts are page texts (data/pageTexts.ts), editable in Admin → Site →
// Page texts; the icons stay here.
const METHOD_ICONS = [Compass, GitBranch, Layers]

export default function AboutPage() {
  const t = usePageTexts()
  const steps = METHOD_ICONS.map((icon, i) => ({
    icon,
    title: t.text(`about.method.step${i + 1}.title`),
    description: t.text(`about.method.step${i + 1}.text`),
  }))
  const cards = [1, 2, 3].map((n) => ({ title: t.text(`about.systems.card${n}.title`), description: t.text(`about.systems.card${n}.text`) }))
  return (
    <div className="pb-24 pt-32 md:pt-40">
      <SEO
        title={seoPage('/about').title}
        description={seoPage('/about').description}
        keywords={['about bgrowth', 'bgrowth workspace', 'bgrowth mission', 'growth systems']}
        path="/about"
      />

      {/* Hero */}
      <section className="container-px mx-auto max-w-page text-center">
        <p className="eyebrow">{t.text('about.hero.eyebrow')}</p>
        <h1 className="mx-auto mt-2 max-w-2xl font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
          {t.text('about.hero.title')}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-navy/55">
          {t.text('about.hero.text')}
        </p>
      </section>

      {/* Our Mission */}
      <section className="section-py">
        <div className="container-px mx-auto max-w-page">
          <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-start">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
              <Target size={21} strokeWidth={2} />
            </div>
            <div>
              <SectionHeader eyebrow={t.text('about.mission.eyebrow')} title={t.text('about.mission.title')} className="mb-4" />
              <p className="max-w-2xl text-[15px] leading-relaxed text-navy/55">
                {t.text('about.mission.text')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why BGrowth Exists */}
      <section className="section-py bg-bg-soft">
        <div className="container-px mx-auto max-w-page">
          <SectionHeader
            eyebrow={t.text('about.why.eyebrow')}
            title={t.text('about.why.title')}
            description={t.text('about.why.text')}
            className="max-w-2xl"
          />
        </div>
      </section>

      {/* The Growth System Method */}
      <section className="section-py">
        <div className="container-px mx-auto max-w-page">
          <SectionHeader eyebrow={t.text('about.method.eyebrow')} title={t.text('about.method.title')} className="mb-10" />
          <div className="grid gap-5 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={i} className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-white">
                    <step.icon size={17} strokeWidth={2} />
                  </div>
                  <span className="font-display text-lg font-bold text-navy/15">0{i + 1}</span>
                </div>
                <h3 className="mt-4 font-display text-[15px] font-bold text-navy">{step.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy/50">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Our Workspaces Work */}
      <section id="how-it-works" className="section-py bg-bg-soft">
        <div className="container-px mx-auto max-w-page">
          <SectionHeader
            eyebrow={t.text('about.how.eyebrow')}
            title={t.text('about.how.title')}
            description={t.text('about.how.text')}
            className="max-w-2xl"
          />
        </div>
      </section>

      {/* Our Vision */}
      <section className="section-py">
        <div className="container-px mx-auto max-w-page">
          <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-start">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
              <Telescope size={21} strokeWidth={2} />
            </div>
            <div>
              <SectionHeader eyebrow={t.text('about.vision.eyebrow')} title={t.text('about.vision.title')} className="mb-4" />
              <p className="max-w-2xl text-[15px] leading-relaxed text-navy/55">
                {t.text('about.vision.text')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Systems Instead of Courses */}
      <section className="section-py bg-bg-soft">
        <div className="container-px mx-auto max-w-page">
          <SectionHeader eyebrow={t.text('about.systems.eyebrow')} title={t.text('about.systems.title')} className="mb-10" />
          <div className="grid gap-5 sm:grid-cols-3">
            {cards.map((item, i) => (
              <div key={i} className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-bg-soft text-primary">
                  <GraduationCap size={16} strokeWidth={2} />
                </div>
                <h3 className="mt-4 font-display text-[15px] font-bold text-navy">{item.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy/50">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-py text-center">
        <div className="container-px mx-auto max-w-xl">
          <h2 className="font-display text-2xl font-bold text-navy">{t.text('about.cta.title')}</h2>
          <p className="mt-3 text-[14.5px] text-navy/55">
            {t.text('about.cta.text')}
          </p>
          <Button to="/systems" className="mt-6" icon={<ArrowRight size={15} />}>
            {t.text('about.cta.button')}
          </Button>
        </div>
      </section>
    </div>
  )
}
