import { useParams, Navigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, PiggyBank, HeartPulse, GraduationCap, Home as HomeIcon, ArrowRight, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import SEO from '../components/seo/SEO'
import Button from '../components/ui/Button'
import { getCategoryPreview } from '../data/categoryPreviews'
import { fadeUp, viewportOnce } from '../lib/motion'

const ICONS: Record<string, LucideIcon> = {
  career: Building2,
  finance: PiggyBank,
  health: HeartPulse,
  learning: GraduationCap,
  lifestyle: HomeIcon,
}

// The honest landing spot for a Life World that doesn't have a live catalog
// yet — reached via each "Preview →" card on the homepage (see
// components/sections/LifeWorlds.tsx). Explains what's coming instead of
// pretending it already exists, and never links to a fake system.
export default function CategoryPreviewPage() {
  const { category } = useParams<{ category: string }>()
  const preview = category ? getCategoryPreview(category) : undefined

  if (!preview) return <Navigate to="/systems" replace />

  const Icon = ICONS[preview.slug] ?? Sparkles

  return (
    <div className="pt-32 md:pt-40">
      <SEO
        title={`${preview.name} — Coming to BGrowth`}
        description={preview.purpose}
        path={`/preview/${preview.slug}`}
      />

      <section className="container-px mx-auto max-w-narrow pb-20 text-center">
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
            <Icon size={28} strokeWidth={2} />
          </div>
          <p className="eyebrow mt-6">Coming to BGrowth</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
            {preview.name}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-navy/55">
            {preview.purpose}
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="show"
          className="mt-10 rounded-xl3 border border-navy/[0.06] bg-white p-8 text-left shadow-softer"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
            Growth Systems™ planned for this World
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {preview.exampleSystems.map((name) => (
              <span
                key={name}
                className="rounded-full bg-bg-soft px-4 py-2 text-[13px] font-medium text-navy/70"
              >
                {name}
              </span>
            ))}
          </div>
          <p className="mt-6 text-[13.5px] leading-relaxed text-navy/45">
            None of these exist inside Workspace yet — this World is still being built. As soon
            as a Growth System launches here, it'll appear in your Workspace and inside{' '}
            <Link to="/systems" className="font-semibold text-primary">
              Business Systems™
            </Link>{' '}
            the same way today's catalog does.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} custom={2} initial="hidden" animate="show" className="mt-10">
          <p className="text-[14px] text-navy/50">
            Check back as the BGrowth ecosystem grows, or explore what's already live today.
          </p>
          <div className="mt-5 flex justify-center">
            <Button to="/systems" icon={<ArrowRight size={16} />}>
              Explore What's Live Today
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
