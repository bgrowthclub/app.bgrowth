import { Target, Compass, Layers, GitBranch, Telescope, GraduationCap, ArrowRight } from 'lucide-react'
import SEO from '../components/seo/SEO'
import SectionHeader from '../components/ui/SectionHeader'
import Button from '../components/ui/Button'

const METHOD_STEPS = [
  { icon: Compass, title: 'Choose', description: 'Pick the Business System built for your exact profession.' },
  { icon: GitBranch, title: 'Follow', description: 'Work through Planners™, Workflows™, and Toolkits™ in order.' },
  { icon: Layers, title: 'Repeat', description: 'Reuse the same system every time you need it — it never changes on you.' },
]

const WHY_SYSTEMS = [
  { title: 'Courses teach. Systems do.', description: 'A course explains a concept once. A system is something you open and work from every single time.' },
  { title: 'No 6 hours of video required', description: 'You don\u2019t have to watch anything to get started — you just start filling it out.' },
  { title: 'Built for repetition', description: 'Running a business is repetitive work. Our systems are built to be reused, not watched once and forgotten.' },
]

export default function AboutPage() {
  return (
    <div className="pb-24 pt-32 md:pt-40">
      <SEO
        title="About"
        description="BGrowth builds Business Systems — not courses — that guide service professionals through launching and operating their business."
        keywords={['about bgrowth', 'business systems method', 'bgrowth mission']}
        path="/about"
      />

      {/* Hero */}
      <section className="container-px mx-auto max-w-page text-center">
        <p className="eyebrow">About BGrowth</p>
        <h1 className="mx-auto mt-2 max-w-2xl font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
          We build systems, not courses.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-navy/55">
          BGrowth exists to help people build better service businesses — with tools they actually use, not lessons they watch once.
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
              <SectionHeader eyebrow="Our Mission" title="Make starting and running a business less overwhelming." className="mb-4" />
              <p className="max-w-2xl text-[15px] leading-relaxed text-navy/55">
                Most people who launch a service business aren\u2019t short on effort — they\u2019re short on structure.
                BGrowth exists to give them that structure: clear, guided Business Systems that replace guesswork
                with a repeatable process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why BGrowth Exists */}
      <section className="section-py bg-bg-soft">
        <div className="container-px mx-auto max-w-page">
          <SectionHeader
            eyebrow="Why BGrowth Exists"
            title="Advice is everywhere. Structure isn\u2019t."
            description="Anyone can find advice about starting a business. What's missing is a system that turns that advice into action — the actual steps, in order, ready to work through."
            className="max-w-2xl"
          />
        </div>
      </section>

      {/* The Business System Method */}
      <section className="section-py">
        <div className="container-px mx-auto max-w-page">
          <SectionHeader eyebrow="The Method" title="The Business System Method" className="mb-10" />
          <div className="grid gap-5 sm:grid-cols-3">
            {METHOD_STEPS.map((step, i) => (
              <div key={step.title} className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
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

      {/* How Our Business Systems Work */}
      <section className="section-py bg-bg-soft">
        <div className="container-px mx-auto max-w-page">
          <SectionHeader
            eyebrow="How It Works"
            title="Software you work from, not a document you read."
            description="Every Business System runs right in your browser. Complete it online, print it, or save a copy — nothing about it feels like a downloaded PDF."
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
              <SectionHeader eyebrow="Our Vision" title="Every service profession, systemized." className="mb-4" />
              <p className="max-w-2xl text-[15px] leading-relaxed text-navy/55">
                We\u2019re building toward a Business System for every service profession — notary, cleaning,
                bookkeeping, delivery, and everything after. Choose your profession, and the system built for it
                should already be waiting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Systems Instead of Courses */}
      <section className="section-py bg-bg-soft">
        <div className="container-px mx-auto max-w-page">
          <SectionHeader eyebrow="Systems, Not Courses" title="Why we don\u2019t build courses" className="mb-10" />
          <div className="grid gap-5 sm:grid-cols-3">
            {WHY_SYSTEMS.map((item) => (
              <div key={item.title} className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
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
          <h2 className="font-display text-2xl font-bold text-navy">Ready to build with structure?</h2>
          <p className="mt-3 text-[14.5px] text-navy/55">
            Browse Business Systems built for your profession.
          </p>
          <Button to="/systems" className="mt-6" icon={<ArrowRight size={15} />}>
            Browse Business Systems
          </Button>
        </div>
      </section>
    </div>
  )
}
