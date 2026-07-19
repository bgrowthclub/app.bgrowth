import {
  Target,
  Telescope,
  TrendingUp,
  Feather,
  BookOpen,
  RefreshCw,
  Gem,
  Unlock,
  Lightbulb,
  HeartHandshake,
  Compass,
  Rocket,
  Briefcase,
  ClipboardList,
  Sprout,
  ArrowRight,
  ArrowDown,
} from 'lucide-react'
import SEO from '../components/seo/SEO'
import SectionContainer from '../components/layout/SectionContainer'
import SectionHeader from '../components/ui/SectionHeader'
import MemberBanner from '../components/ui/MemberBanner'
import Button from '../components/ui/Button'
import FeatureGrid from '../components/ui/FeatureGrid'
import type { SystemBenefit } from '../types/system'

const VALUES = [
  { icon: TrendingUp, title: 'Growth Mindset', description: 'We treat every challenge as something to learn from, not something to avoid.' },
  { icon: Feather, title: 'Simplicity', description: 'Complexity is the enemy of action. We remove everything that doesn’t need to be there.' },
  { icon: BookOpen, title: 'Practical Learning', description: 'Knowledge only counts once it’s actually useful — that’s the only kind we build.' },
  { icon: RefreshCw, title: 'Continuous Improvement', description: 'Nothing we build is ever really finished. We keep improving it after it ships.' },
  { icon: Gem, title: 'Quality', description: 'We’d rather build fewer things well than many things half-finished.' },
  { icon: Unlock, title: 'Accessibility', description: 'Growth shouldn’t depend on where you started. We build for everyone willing to do the work.' },
  { icon: Lightbulb, title: 'Innovation', description: 'We look for better ways to do things, even when the old way still works.' },
  { icon: HeartHandshake, title: 'Community', description: 'Growth is easier — and more sustainable — when it happens alongside other people.' },
]

const JOURNEY_STAGES = [
  { icon: Compass, title: 'Discover', description: 'Find the opportunity that fits your goals, skills, and stage of life.' },
  { icon: BookOpen, title: 'Learn', description: 'Build real, practical knowledge you can put to work immediately.' },
  { icon: Rocket, title: 'Launch', description: 'Turn what you’ve learned into something real, one step at a time.' },
  { icon: Briefcase, title: 'Work', description: 'Operate with confidence using systems built for daily use.' },
  { icon: ClipboardList, title: 'Manage', description: 'Stay organized and keep every moving part under control.' },
  { icon: Sprout, title: 'Grow', description: 'Expand what’s working and take on the next opportunity.' },
]

const WHY_BGROWTH: SystemBenefit[] = [
  { title: 'Interactive Business Systems', description: 'Software you work from, not documents you read once and forget.' },
  { title: 'Professional Templates', description: 'Ready-to-use documents built by people who’ve done the work before.' },
  { title: 'Practical Learning', description: 'Knowledge built around real decisions, not theory you’ll never use.' },
  { title: 'AI-Powered Creation', description: 'Tools that help you build, plan, and decide faster — without doing the thinking for you.' },
  { title: 'Growing Marketplace', description: 'A widening catalog of systems, templates and resources across more professions every month.' },
  { title: 'Professional Community', description: 'Connect with people building and growing the same way you are.' },
]

export default function AboutPage() {
  return (
    <div className="pb-24 pt-32 md:pt-40">
      <SEO
        title="About"
        description="BGrowth exists to help people discover opportunities, learn valuable skills, launch businesses, work with confidence, manage efficiently, and keep growing."
        keywords={['about bgrowth', 'bgrowth mission', 'bgrowth values']}
        path="/about"
      />

      {/* Hero */}
      <section className="container-px mx-auto max-w-page text-center">
        <p className="eyebrow">About BGrowth</p>
        <h1 className="mx-auto mt-2 max-w-2xl font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
          More Than Products.
          <br />
          We Build Growth.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-navy/55">
          BGrowth exists to help people discover opportunities, learn valuable skills, launch businesses, work with
          confidence, manage efficiently, and continue growing throughout their journey.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button to="/systems">Explore Products</Button>
          <Button to="/pricing" variant="secondary">
            Join BGrowth Club
          </Button>
        </div>
      </section>

      {/* Our Mission */}
      <SectionContainer>
        <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-start">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
            <Target size={21} strokeWidth={2} aria-hidden="true" />
          </div>
          <div>
            <SectionHeader eyebrow="Our Mission" title="Remove the barriers between people and professional growth." className="mb-4" />
            <p className="max-w-2xl text-[15px] leading-relaxed text-navy/55">
              Most people aren’t short on ambition — they’re short on structure. BGrowth exists to close that gap
              with practical knowledge, real tools, guided systems, and genuine opportunities, so growth stops
              depending on who you know or where you started.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* Our Vision */}
      <SectionContainer background="soft">
        <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-start">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
            <Telescope size={21} strokeWidth={2} aria-hidden="true" />
          </div>
          <div>
            <SectionHeader eyebrow="Our Vision" title="One complete ecosystem for every stage of growth." className="mb-4" />
            <p className="max-w-2xl text-[15px] leading-relaxed text-navy/55">
              We’re building toward a single place where anyone can discover an opportunity, learn what it takes,
              launch with confidence, work and manage day to day, and keep growing — without switching tools,
              platforms, or plans every time they reach the next stage.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* Our Values */}
      <SectionContainer aria-label="Our Values">
        <SectionHeader eyebrow="Our Values" title="What guides how we build." className="mb-10" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value) => (
            <div key={value.title} className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-bg-soft text-primary">
                <value.icon size={17} strokeWidth={2} aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-[15px] font-bold text-navy">{value.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy/50">{value.description}</p>
            </div>
          ))}
        </div>
      </SectionContainer>

      {/* The BGrowth Journey */}
      <SectionContainer background="soft" aria-label="The BGrowth Journey">
        <SectionHeader
          eyebrow="The BGrowth Journey"
          title="One path, from first idea to lasting growth."
          description="Every product, system, and resource we build fits somewhere along this path."
          className="mb-10"
        />
        <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-start lg:gap-0">
          {JOURNEY_STAGES.map((stage, i) => (
            <div key={stage.title} className="flex items-stretch gap-2 lg:flex-1 lg:flex-col lg:items-stretch lg:gap-0">
              <div className="flex flex-1 flex-col items-center rounded-xl3 border border-navy/[0.06] bg-white p-6 text-center shadow-softer">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
                  <stage.icon size={19} strokeWidth={2} aria-hidden="true" />
                </div>
                <span className="mt-3 font-display text-[11px] font-bold text-navy/20">0{i + 1}</span>
                <h3 className="mt-1 font-display text-[15px] font-bold text-navy">{stage.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-navy/50">{stage.description}</p>
              </div>

              {i < JOURNEY_STAGES.length - 1 && (
                <div className="flex shrink-0 items-center justify-center lg:w-10 lg:py-0">
                  <ArrowDown size={16} className="text-primary/40 lg:hidden" aria-hidden="true" />
                  <ArrowRight size={16} className="hidden text-primary/40 lg:block" aria-hidden="true" />
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionContainer>

      {/* Why BGrowth */}
      <SectionContainer aria-label="Why BGrowth">
        <SectionHeader eyebrow="Why BGrowth" title="What makes BGrowth different." className="mb-10" />
        <FeatureGrid features={WHY_BGROWTH} />
      </SectionContainer>

      {/* Closing CTA */}
      <SectionContainer aria-label="Start Your Growth Journey">
        <MemberBanner
          eyebrow="BGrowth Club"
          title="Start Your Growth Journey Today"
          description="Whether you’re starting your first business, learning a new profession or improving your workflow, BGrowth is designed to help you move forward."
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button to="/systems">Explore Products</Button>
            <Button to="/pricing" variant="secondary">
              Join BGrowth Club
            </Button>
          </div>
        </MemberBanner>
      </SectionContainer>
    </div>
  )
}
