import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Award, BookOpen, CheckCircle2, ListChecks } from 'lucide-react'
import academyHero from '../assets/academy-hero.webp'
import SEO from '../components/seo/SEO'
import { seoPage } from '../data/seoPages'
import { fadeUp, viewportOnce } from '../lib/motion'
import { loadStudioWorkspaceProducts } from '../lib/publishedCatalog'
import { studioProductNoun } from '../modules/workspace/lib/productNoun'
import type { Product } from '../modules/commerce/types/product'

// BGrowth Academy™ — the public page (06/11/2026), from the owner's design.
//
// It replaces a link that dropped people on the catalog. What it says is
// what the Academy actually does TODAY — lessons you tick off, notes,
// self-checks and a verifiable certificate — because all of that shipped
// in the last week. Nothing here describes something unbuilt.
//
// The course list is the real catalog, not a picture of one: if no course
// is published, the section says so instead of showing an empty grid.
export default function AcademyPage() {
  const seo = seoPage('/academy')
  const [courses, setCourses] = useState<Product[] | null>(null)

  useEffect(() => {
    let cancelled = false
    loadStudioWorkspaceProducts()
      .then((products) => {
        if (!cancelled) setCourses(products.filter((p) => studioProductNoun(p) === 'Course'))
      })
      .catch(() => {
        if (!cancelled) setCourses([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <SEO title={seo.title} description={seo.description} path="/academy" />

      <section className="relative overflow-hidden bg-gradient-to-b from-primary/[0.06] via-bg to-bg">
        <div className="container-px mx-auto max-w-page pb-4 pt-24 text-center sm:pt-28">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-primary">
              Practical learning for real results
            </p>
            <h1 className="mx-auto mt-5 max-w-4xl font-display text-[38px] font-extrabold leading-[1.08] tracking-tight text-navy sm:text-[50px]">
              Learn the skills to build <span className="text-primary">what’s next.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-navy/60">
              Step-by-step courses with lessons you work through at your own pace, questions to check yourself, and a
              certificate you can show at the end.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/systems?type=course" className="btn-primary inline-flex items-center gap-2">
                See the courses
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link to="/register" className="text-[15px] font-semibold text-navy/70 transition-colors hover:text-navy">
                Create your free account
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-10"
          >
            <img
              src={academyHero}
              alt=""
              width={1476}
              height={650}
              fetchPriority="high"
              className="mx-auto w-full max-w-5xl [mask-image:linear-gradient(to_top,transparent,black_16%)]"
            />
          </motion.div>
        </div>
      </section>

      <section className="bg-bg pb-20 pt-10 md:pb-28 md:pt-12">
        <div className="container-px mx-auto max-w-page">
          <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={fadeUp} className="text-center">
            <p className="eyebrow">How a course works</p>
            <h2 className="mt-3 font-display text-[30px] font-extrabold tracking-tight text-navy sm:text-[36px]">
              Read it, try it, prove it.
            </h2>
          </motion.div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <motion.article
                key={step.title}
                initial="hidden"
                whileInView="show"
                viewport={viewportOnce}
                variants={fadeUp}
                custom={i}
                className="rounded-xl2 border border-navy/[0.07] bg-white px-6 py-7"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/[0.08]">
                  <step.icon size={19} className="text-primary" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-[18px] font-bold text-navy">{step.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-navy/60">{step.body}</p>
              </motion.article>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-[13.5px] leading-relaxed text-navy/45">
            A BGrowth Academy certificate records that you completed a course. It is not a professional license,
            certification or accreditation.
          </p>
        </div>
      </section>

      <section className="section-py bg-bg-soft">
        <div className="container-px mx-auto max-w-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Courses</p>
              <h2 className="mt-3 font-display text-[28px] font-extrabold tracking-tight text-navy sm:text-[34px]">
                What you can start today.
              </h2>
            </div>
            <Link to="/systems?type=course" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-primary hover:text-navy">
              See all
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>

          {courses === null ? (
            <p className="mt-8 text-[15px] text-navy/45">Loading the courses…</p>
          ) : courses.length === 0 ? (
            <p className="mt-8 text-[15px] text-navy/55">
              The first courses are being finished. Join the newsletter and we’ll tell you when they open.
            </p>
          ) : (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.slice(0, 6).map((course) => (
                <li key={course.id}>
                  <Link
                    to={`/product/${course.slug}`}
                    className="group flex h-full flex-col rounded-xl2 border border-navy/[0.07] bg-white p-5 transition-shadow hover:shadow-md"
                  >
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/[0.07] px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wide text-primary">
                      <BookOpen size={12} aria-hidden />
                      Course
                    </span>
                    <h3 className="mt-3 font-display text-[17px] font-bold leading-snug text-navy">{course.title}</h3>
                    {course.description && (
                      <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-navy/60">{course.description}</p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-primary">
                      Open
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}

const STEPS = [
  {
    icon: ListChecks,
    title: 'Work through the lessons',
    body: 'Modules and lessons you tick off as you go. It remembers where you stopped, so you can come back whenever you have time.',
  },
  {
    icon: CheckCircle2,
    title: 'Check yourself',
    body: 'Short questions inside the lessons tell you at once whether you got it right, and why. Nothing is graded and nothing blocks you.',
  },
  {
    icon: Award,
    title: 'Get your certificate',
    body: 'Finish the lessons and the questions and your certificate is ready, with a code anyone can check at bgrowth.app/verify.',
  },
]

