import { Target, Compass, Layers, GitBranch, Telescope, GraduationCap, ArrowRight } from 'lucide-react'
import SEO from '../components/seo/SEO'
import SectionHeader from '../components/ui/SectionHeader'
import Button from '../components/ui/Button'

const METHOD_STEPS = [
  { icon: Compass, title: 'Choose', description: 'Pick the Workspace built for what you actually want to achieve.' },
  { icon: GitBranch, title: 'Follow', description: 'Work through Planners™, Workflows™, and Toolkits™ in order.' },
  { icon: Layers, title: 'Repeat', description: 'Reuse the same system every time you need it — it never changes on you.' },
]

const WHY_SYSTEMS = [
  { title: 'Courses teach. Systems do.', description: 'A course explains a concept once. A system is something you open and work from every single time.' },
  { title: 'No 6 hours of video required', description: 'You don’t have to watch anything to get started — you just start filling it out.' },
  { title: 'Built for repetition', description: 'Meaningful progress is repetitive work. Our systems are built to be reused, not watched once and forgotten.' },
]

export default function AboutPage() {
  return (
    <div className="pb-24 pt-32 md:pt-40">
      <SEO
        title="About"
        description="BGrowth builds interactive Workspaces — not courses — that help people turn ambition into action, in business, career, and life."
        keywords={['about bgrowth', 'bgrowth workspace', 'bgrowth mission', 'growth systems']}
        path="/about"
      />

      {/* Hero */}
      <section className="container-px mx-auto max-w-page text-center">
        <p className="eyebrow">About BGrowth</p>
        <h1 className="mx-auto mt-2 max-w-2xl font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
          We build outcomes, not content.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-navy/55">
          BGrowth exists to help people turn ambition into action — with tools they actually work from, not
          lessons they watch once.
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
              <SectionHeader eyebrow="Our Mission" title="Turn ambition into action, in every area of life." className="mb-4" />
              <p className="max-w-2xl text-[15px] leading-relaxed text-navy/55">
                Most people who want to grow — in their business, their career, their finances, or their life
                — aren’t short on effort. They’re short on structure. BGrowth exists to give them that
                structure inside Workspace™: clear, guided systems that replace guesswork with a repeatable
                process.
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
            title="Advice is everywhere. Structure isn’t."
            description="Anyone can find advice about reaching a goal. What's missing is a system that turns that advice into action — the actual steps, in order, ready to work through."
            className="max-w-2xl"
          />
        </div>
      </section>

      {/* The Growth System Method */}
      <section className="section-py">
        <div className="container-px mx-auto max-w-page">
          <SectionHeader eyebrow="The Method" title="The Growth System Method" className="mb-10" />
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

      {/* How Our Workspaces Work */}
      <section className="section-py bg-bg-soft">
        <div className="container-px mx-auto max-w-page">
          <SectionHeader
            eyebrow="How It Works"
            title="Software you work from, not a document you read."
            description="Every Workspace runs right in your browser. Complete it online, print it, or save a copy — nothing about it feels like a downloaded PDF."
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
              <SectionHeader eyebrow="Our Vision" title="Every meaningful goal, systemized." className="mb-4" />
              <p className="max-w-2xl text-[15px] leading-relaxed text-navy/55">
                We’re building toward a Workspace for every meaningful goal — starting a business, growing a
                career, mastering your finances, building better habits, learning something new, and everything
                after. Choose what you want to achieve, and the Workspace built for it should already be waiting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Systems Instead of Courses */}
      <section className="section-py bg-bg-soft">
        <div className="container-px mx-auto max-w-page">
          <SectionHeader eyebrow="Systems, Not Courses" title="Why we don’t build courses" className="mb-10" />
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
          <h2 className="font-display text-2xl font-bold text-navy">Ready to achieve something new?</h2>
          <p className="mt-3 text-[14.5px] text-navy/55">
            Explore interactive Workspaces built for what you want to achieve.
          </p>
          <Button to="/systems" className="mt-6" icon={<ArrowRight size={15} />}>
            Explore Workspaces
          </Button>
        </div>
      </section>
    </div>
  )
}
