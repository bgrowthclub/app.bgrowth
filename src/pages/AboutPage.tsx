import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Compass,
  Globe,
  ListChecks,
  PlayCircle,
  Repeat,
  RefreshCw,
  Sparkles,
  Target,
  XCircle,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import SEO from '../components/seo/SEO'
import { seoPage } from '../data/seoPages'
import { fadeUp, viewportOnce } from '../lib/motion'
import { usePageTexts } from '../lib/usePageTexts'
// A stand-in until there is a real Workspace screenshot (the owner's choice,
// 19/11/2026: a picture of one of our own Workspaces, not a drawn mock-up).
import workspaceShot from '../assets/home-hero.webp'

// Paints the part of a title the owner marked (Admin → Site → Page texts,
// "Part of the title in …") in a color. If the part isn't found in the title
// as written, the title shows plain — nothing breaks.
function Highlight({ title, part, className }: { title: string; part: string; className: string }) {
  const at = part ? title.indexOf(part) : -1
  if (at < 0) return <>{title}</>
  return (
    <>
      {title.slice(0, at)}
      <span className={className}>{part}</span>
      {title.slice(at + part.length)}
    </>
  )
}

function Pill({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p
      className={`mx-auto w-fit rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
        dark ? 'border-white/15 bg-white/10 text-sky-200' : 'border-primary/15 bg-primary/[0.06] text-primary'
      }`}
    >
      {children}
    </p>
  )
}

const METHOD: { icon: LucideIcon; tone: string; link: string }[] = [
  { icon: Compass, tone: 'bg-blue-50 text-primary', link: 'text-primary' },
  { icon: ListChecks, tone: 'bg-violet-50 text-violet-600', link: 'text-violet-600' },
  { icon: RefreshCw, tone: 'bg-emerald-50 text-emerald-600', link: 'text-emerald-600' },
]
const CARDS: { icon: LucideIcon; tone: string }[] = [
  { icon: PlayCircle, tone: 'bg-blue-50 text-primary' },
  { icon: Zap, tone: 'bg-violet-50 text-violet-600' },
  { icon: Repeat, tone: 'bg-emerald-50 text-emerald-600' },
]
const CHIP_TONES = ['text-primary', 'text-emerald-600', 'text-violet-600']

// About (redesigned 19/11/2026, the owner's design): the same story as
// before — problem and mission, the method, how a Workspace works, courses
// that end in tools, the vision and a closing band. Every text is a page
// text (data/pageTexts.ts), editable in Admin → Site → Page texts; the
// layout, icons and colors stay here. Nothing on it is a number we made up.
export default function AboutPage() {
  const t = usePageTexts()
  const reveal = { variants: fadeUp, initial: 'hidden', whileInView: 'show', viewport: viewportOnce } as const

  return (
    <div>
      <SEO
        title={seoPage('/about').title}
        description={seoPage('/about').description}
        keywords={['about bgrowth', 'bgrowth workspace', 'bgrowth mission', 'growth systems']}
        path="/about"
      />

      {/* Top */}
      <section className="border-b border-navy/[0.06] bg-grad-radial-soft pb-16 pt-32 md:pb-24 md:pt-40">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="container-px mx-auto max-w-3xl text-center">
          <Pill>
            <Sparkles size={12} className="mr-1.5 inline" aria-hidden /> {t.text('about.hero.eyebrow')}
          </Pill>
          <h1 className="mt-6 font-display text-[36px] font-extrabold leading-[1.1] tracking-tight text-navy sm:text-[52px]">
            <Highlight title={t.text('about.hero.title')} part={t.text('about.hero.highlight')} className="text-primary" />
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-navy/60 sm:text-[18px]">{t.text('about.hero.text')}</p>
          {t.items('about.hero.chips').length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              {t.items('about.hero.chips').map((chip, i) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 rounded-full border border-navy/[0.08] bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-navy/70 shadow-softer"
                >
                  <CheckCircle2 size={14} className={CHIP_TONES[i % CHIP_TONES.length]} aria-hidden /> {chip}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* The problem × our mission */}
      <section className="container-px mx-auto max-w-page py-16 md:py-24">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div {...reveal} className="flex flex-col rounded-[28px] border border-navy/[0.07] bg-bg-soft p-7 sm:p-9">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <AlertCircle size={20} aria-hidden />
            </span>
            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">{t.text('about.why.eyebrow')}</p>
            <h2 className="mt-2 font-display text-[26px] font-bold leading-tight text-navy sm:text-[30px]">
              <Highlight title={t.text('about.why.title')} part={t.text('about.why.highlight')} className="block text-amber-700" />
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-navy/60">{t.text('about.why.text')}</p>
            {t.items('about.why.cycle').length > 0 && (
              <div className="mt-auto pt-6">
                <div className="flex gap-3 rounded-2xl border border-navy/[0.07] bg-white p-4">
                  <XCircle size={17} className="mt-0.5 shrink-0 text-rose-500" aria-hidden />
                  <div>
                    <p className="text-[13.5px] font-bold text-navy">{t.text('about.why.cycleTitle')}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-navy/55">{t.items('about.why.cycle').join(' → ')}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div {...reveal} className="flex flex-col rounded-[28px] bg-grad-primary p-7 text-white shadow-glow sm:p-9">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15">
              <Target size={20} aria-hidden />
            </span>
            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">{t.text('about.mission.eyebrow')}</p>
            <h2 className="mt-2 font-display text-[26px] font-bold leading-tight sm:text-[30px]">{t.text('about.mission.title')}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/80">{t.text('about.mission.text')}</p>
            {t.items('about.mission.way').length > 0 && (
              <div className="mt-auto pt-6">
                <div className="flex gap-3 rounded-2xl border border-white/20 bg-white/10 p-4">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-white" aria-hidden />
                  <div>
                    <p className="text-[13.5px] font-bold">{t.text('about.mission.wayTitle')}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-white/75">{t.items('about.mission.way').join(' → ')}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* The method */}
      <section className="bg-bg-soft py-16 md:py-24">
        <div className="container-px mx-auto max-w-page">
          <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
            <Pill>{t.text('about.method.eyebrow')}</Pill>
            <h2 className="mt-4 font-display text-[28px] font-bold tracking-tight text-navy sm:text-[36px]">{t.text('about.method.title')}</h2>
            <p className="mt-3 text-[16px] leading-relaxed text-navy/60">{t.text('about.method.text')}</p>
          </motion.div>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {METHOD.map(({ icon: Icon, tone, link }, i) => (
              <motion.div key={i} {...reveal} className="flex flex-col rounded-[22px] border border-navy/[0.07] bg-white p-6 shadow-softer sm:p-7">
                <div className="flex items-start justify-between">
                  <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}>
                    <Icon size={20} aria-hidden />
                  </span>
                  <span className="font-mono text-[12px] font-bold text-navy/25">0{i + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-[20px] font-bold text-navy">{t.text(`about.method.step${i + 1}.title`)}</h3>
                <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-navy/60">{t.text(`about.method.step${i + 1}.text`)}</p>
                {t.text(`about.method.step${i + 1}.tag`) && (
                  <p className={`mt-5 border-t border-navy/[0.07] pt-4 text-[12.5px] font-bold ${link}`}>{t.text(`about.method.step${i + 1}.tag`)}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="container-px mx-auto max-w-page scroll-mt-28 py-16 md:py-24">
        <motion.div
          {...reveal}
          className="relative grid grid-cols-1 items-center gap-10 overflow-hidden rounded-[32px] bg-navy px-6 py-12 text-white shadow-glow sm:px-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/30 blur-3xl" aria-hidden />
          <div className="relative">
            <p className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-200">
              {t.text('about.how.eyebrow')}
            </p>
            <h2 className="mt-5 font-display text-[30px] font-bold leading-tight sm:text-[40px]">
              <Highlight title={t.text('about.how.title')} part={t.text('about.how.highlight')} className="block text-sky-300" />
            </h2>
            <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-white/70">{t.text('about.how.text')}</p>
            <ul className="mt-7 space-y-3">
              {t.items('about.how.points').map((point) => {
                const [title, ...rest] = point.split(' — ')
                const detail = rest.join(' — ')
                return (
                  <li key={point} className="flex gap-3 text-[14.5px] leading-relaxed text-white/75">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/40 text-sky-200">
                      <Check size={12} strokeWidth={3} aria-hidden />
                    </span>
                    <span>
                      {detail ? (
                        <>
                          <strong className="font-semibold text-white">{title}:</strong> {detail}
                        </>
                      ) : (
                        point
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 shadow-glow">
            <img src={workspaceShot} alt="" loading="lazy" className="w-full rounded-xl" />
          </div>
        </motion.div>
      </section>

      {/* Courses that end in tools */}
      <section className="bg-bg-soft py-16 md:py-24">
        <div className="container-px mx-auto max-w-page">
          <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
            <Pill>{t.text('about.systems.eyebrow')}</Pill>
            <h2 className="mt-4 font-display text-[28px] font-bold tracking-tight text-navy sm:text-[36px]">{t.text('about.systems.title')}</h2>
            <p className="mt-3 text-[16px] leading-relaxed text-navy/60">{t.text('about.systems.text')}</p>
          </motion.div>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {CARDS.map(({ icon: Icon, tone }, i) => (
              <motion.div key={i} {...reveal} className="flex flex-col rounded-[22px] border border-navy/[0.07] bg-white p-6 shadow-softer sm:p-7">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}>
                  <Icon size={20} aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-[19px] font-bold text-navy">{t.text(`about.systems.card${i + 1}.title`)}</h3>
                <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-navy/60">{t.text(`about.systems.card${i + 1}.text`)}</p>
                {t.text(`about.systems.card${i + 1}.tag`) && (
                  <p className="mt-5 border-t border-navy/[0.07] pt-4 text-[12.5px] font-medium text-navy/40">{t.text(`about.systems.card${i + 1}.tag`)}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="container-px mx-auto max-w-3xl py-16 text-center md:py-24">
        <motion.div {...reveal}>
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-primary">
            <Globe size={24} aria-hidden />
          </span>
          <div className="mt-6">
            <Pill>{t.text('about.vision.eyebrow')}</Pill>
          </div>
          <h2 className="mt-5 font-display text-[32px] font-bold leading-tight tracking-tight text-navy sm:text-[44px]">
            <Highlight title={t.text('about.vision.title')} part={t.text('about.vision.highlight')} className="block text-primary" />
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-navy/60">{t.text('about.vision.text')}</p>
        </motion.div>
      </section>

      {/* Closing band */}
      <section className="bg-navy py-16 text-center text-white md:py-24">
        <motion.div {...reveal} className="container-px mx-auto max-w-2xl">
          <Pill dark>{t.text('about.cta.eyebrow')}</Pill>
          <h2 className="mt-5 font-display text-[32px] font-bold leading-tight sm:text-[44px]">
            <Highlight title={t.text('about.cta.title')} part={t.text('about.cta.highlight')} className="block text-sky-300" />
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-white/70">{t.text('about.cta.text')}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/systems?type=workspace" className="btn-primary inline-flex items-center gap-2">
              {t.text('about.cta.button')} <ArrowRight size={17} aria-hidden />
            </Link>
            <Link
              to="/systems"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-white/15"
            >
              {t.text('about.cta.secondary')}
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
