import { Link } from 'react-router-dom'
import { LifeBuoy, FolderOpen, BookOpen, ArrowRight } from 'lucide-react'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Grid from '../components/layout/Grid'
import { ICONS_BY_CATEGORY } from '../components/systems/categoryIcons'
import { SYSTEMS } from '../data/systems'

// Placeholder purchased list — membership & purchase history are handled
// outside this project. This is mock data standing in for that source.
const PURCHASED_SLUGS = ['start-your-notary-business', 'daily-notary-operations']

export default function MySystems() {
  const purchased = SYSTEMS.filter((s) => PURCHASED_SLUGS.includes(s.slug))

  return (
    <section className="pt-36 pb-24 md:pt-44">
      <div className="container-px mx-auto max-w-page">
        <p className="eyebrow">Welcome back</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
          My Systems
        </h1>
        <p className="mt-3 max-w-lg text-[15px] text-navy/55">
          Continue any system below — everything runs right in your browser.
        </p>

        {purchased.length > 0 ? (
          <Grid cols={3} className="mt-10">
            {purchased.map((sys) => {
              const Icon = ICONS_BY_CATEGORY[sys.category] ?? ICONS_BY_CATEGORY.Default
              return (
                <div
                  key={sys.slug}
                  className="flex flex-col rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-softer"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
                    <Icon size={21} strokeWidth={2} />
                  </div>
                  <h3 className="mt-5 font-display text-[16px] font-bold text-navy">{sys.name}</h3>
                  <p className="mt-1.5 text-[13px] text-navy/45">{sys.category} · {sys.type}</p>

                  <Button to={`/system/${sys.slug}`} className="mt-6 w-full" icon={<ArrowRight size={15} />}>
                    Continue
                  </Button>

                  <div className="mt-3 flex gap-2">
                    <Link
                      to={`/product/${sys.slug}#resources`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-navy/10 px-3 py-2.5 text-[12.5px] font-semibold text-navy/60 hover:border-primary/20"
                    >
                      <BookOpen size={13} />
                      Resources
                    </Link>
                    <a
                      href="mailto:support@bgrowth.club"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-navy/10 px-3 py-2.5 text-[12.5px] font-semibold text-navy/60 hover:border-primary/20"
                    >
                      <LifeBuoy size={13} />
                      Support
                    </a>
                  </div>
                </div>
              )
            })}
          </Grid>
        ) : (
          <div className="mt-16">
            <EmptyState
              icon={FolderOpen}
              title="No systems yet."
              description="Browse the catalog to find your first Business System."
            />
          </div>
        )}

        <div className="mt-16 rounded-xl3 border border-navy/[0.06] bg-bg-soft p-8 text-center">
          <p className="font-display text-lg font-bold text-navy">Looking for more?</p>
          <p className="mt-1.5 text-[14px] text-navy/50">Explore the full catalog of Business Systems.</p>
          <Button to="/systems" variant="secondary" className="mt-5">
            Buy More Systems
          </Button>
        </div>
      </div>
    </section>
  )
}
