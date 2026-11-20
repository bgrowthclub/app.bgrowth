import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, Bell, Check, Compass, Sparkles } from 'lucide-react'
import SEO from '../components/seo/SEO'
import CatalogProductCard from '../components/systems/CatalogProductCard'
import SignupInterests from '../components/newsletter/SignupInterests'
import { lifeWorldLook } from '../components/systems/lifeWorldLook'
import { WORKSPACE_CATEGORIES } from '../data/workspaceCategories'
import { getCategoryPreview } from '../data/categoryPreviews'
import { loadStudioWorkspaceProducts } from '../lib/publishedCatalog'
import { categoryCatalogPath, lifeWorldPath } from '../lib/useWorkspaceCategories'
import { useNewsletterSignup } from '../modules/newsletter/useNewsletterSignup'
import type { Product } from '../modules/commerce/types/product'

const UPDATES_ID = 'updates'
const SHOWN = 6

// One Life World (/workspaces/:slug, 20/11/2026, the owner's design — one
// page for all six): the worlds as chips, a dark top in the world's color,
// what is live in it now (the published products of its Areas), what is
// planned (data/categoryPreviews.ts — names only, no dates or features we
// haven't built), why it matters, and an e-mail sign-up for news (source
// world-<slug>, so the team sees which world people asked about). No made-up
// testimonials, progress figures or "updated today".
export default function LifeWorldPage() {
  const { slug } = useParams<{ slug: string }>()
  const world = WORKSPACE_CATEGORIES.find((w) => w.slug === slug)
  const preview = slug ? getCategoryPreview(slug) : undefined
  const signup = useNewsletterSignup(`world-${slug ?? ''}`)
  const [products, setProducts] = useState<Product[] | null>(null)

  useEffect(() => {
    if (!world) return
    let cancelled = false
    setProducts(null)
    loadStudioWorkspaceProducts()
      .then((all) => {
        if (!cancelled) setProducts(all.filter((p) => (world.areas as string[]).includes(p.category)))
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
    return () => {
      cancelled = true
    }
  }, [world])

  if (!world) return <Navigate to="/workspaces" replace />

  const look = lifeWorldLook(world.slug)
  const Icon = world.icon
  const live = products?.length ?? 0

  return (
    <div className="bg-bg pb-24 pt-28 md:pt-36">
      <SEO title={`${world.name} — Life Worlds`} description={world.description} path={lifeWorldPath(world)} />

      <div className="container-px mx-auto max-w-page">
        <p className="text-[13.5px] text-navy/50">
          <Link to="/workspaces" className="hover:text-navy">
            Life Worlds
          </Link>{' '}
          <span aria-hidden>/</span> <span className="font-semibold text-navy">{world.name}</span>
        </p>

        <nav aria-label="Life Worlds" className="-mx-1 mt-4 overflow-x-auto px-1 pb-1">
          <div className="flex min-w-max gap-2">
            {WORKSPACE_CATEGORIES.map((w) => {
              const WIcon = w.icon
              const current = w.slug === world.slug
              return (
                <Link
                  key={w.slug}
                  to={lifeWorldPath(w)}
                  aria-current={current ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[13.5px] font-semibold transition-colors ${
                    current ? 'border-primary/30 bg-blue-50 text-primary' : 'border-navy/10 bg-white text-navy/60 hover:text-navy'
                  }`}
                >
                  <WIcon size={16} aria-hidden /> {w.name}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Top */}
        <section className={`relative mt-5 overflow-hidden rounded-[28px] bg-gradient-to-br ${look.band} p-7 text-white sm:p-10`}>
          <div
            className="pointer-events-none absolute -right-10 bottom-0 h-40 w-64 opacity-30"
            style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1.5px, transparent 1.5px)', backgroundSize: '14px 14px' }}
            aria-hidden
          />
          <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center">
            <span className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 sm:h-32 sm:w-32">
              <Icon size={48} strokeWidth={1.6} aria-hidden />
            </span>
            <div>
              <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold">
                {products === null ? 'Life World' : live > 0 ? `${live} ${live === 1 ? 'product' : 'products'} live` : 'Building now'}
              </span>
              <h1 className="mt-3 font-display text-[40px] font-extrabold leading-tight tracking-tight sm:text-[52px]">{world.name}</h1>
              <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-white/80">{world.description}</p>
            </div>
          </div>
        </section>

        {/* Live now */}
        {live > 0 && products && (
          <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-[24px] font-bold text-navy">Available now</h2>
                <p className="mt-1 text-[14.5px] text-navy/55">Ready to open in your Workspace today.</p>
              </div>
              <Link to={categoryCatalogPath(world)} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:underline">
                See all in the catalog <ArrowRight size={15} aria-hidden />
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.slice(0, SHOWN).map((p) => (
                <CatalogProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Planned */}
        {preview && preview.exampleSystems.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-[24px] font-bold text-navy">What is coming</h2>
            <p className="mt-1 text-[14.5px] text-navy/55">Growth Systems™ we plan for this world. No dates yet — we announce each one when it opens.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {preview.exampleSystems.map((name) => (
                <div key={name} className="flex flex-col rounded-[22px] border border-navy/[0.07] bg-white p-4 shadow-softer sm:p-5">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl ${look.circle} ${look.icon}`}>
                    <Sparkles size={22} aria-hidden />
                  </span>
                  <p className="mt-4 flex-1 font-display text-[15px] font-bold text-navy sm:text-[17px]">{name}</p>
                  <p className="mt-1 text-[12.5px] font-semibold uppercase tracking-wide text-navy/40">Planned</p>
                  <a
                    href={`#${UPDATES_ID}`}
                    className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-navy/10 px-4 py-2.5 text-[13.5px] font-semibold text-primary transition-colors hover:border-primary/30"
                  >
                    <Bell size={15} aria-hidden /> Notify me
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Why + updates */}
        <section className={`mt-12 grid grid-cols-1 gap-5 ${preview ? 'lg:grid-cols-2' : ''}`}>
          {preview && (
          <div className="rounded-[24px] border border-navy/[0.07] bg-white p-7 shadow-softer">
            <span className={`grid h-12 w-12 place-items-center rounded-2xl ${look.circle} ${look.icon}`}>
              <Compass size={22} aria-hidden />
            </span>
            <h2 className="mt-4 font-display text-[20px] font-bold text-navy">Why this world</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-navy/65">{preview.purpose}</p>
            <Link to="/workspaces" className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:underline">
              See every Life World <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
          )}

          <div id={UPDATES_ID} className="scroll-mt-28 rounded-[24px] border border-primary/10 bg-blue-50/70 p-7">
            <h2 className="font-display text-[20px] font-bold text-navy">Get updates on {world.name}</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-navy/60">Be the first to know when new products open in this world.</p>
            {signup.done ? (
              <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-[14px] font-semibold text-emerald-700">
                <Check size={17} aria-hidden /> {signup.message}
              </p>
            ) : (
              <form onSubmit={signup.submit} className="mt-5 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  required
                  value={signup.email}
                  onChange={(e) => signup.setEmail(e.target.value)}
                  placeholder="you@email.com"
                  aria-label="E-mail address"
                  className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-[14px] text-navy placeholder:text-navy/30 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10"
                />
                <button
                  type="submit"
                  disabled={signup.state === 'sending'}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-[14px] font-semibold text-white shadow-soft transition-opacity hover:opacity-95 disabled:opacity-60"
                >
                  {signup.state === 'sending' ? 'One moment…' : 'Notify me'} <Bell size={15} aria-hidden />
                </button>
              </form>
            )}
            {signup.state === 'error' && signup.message && <p className="mt-2 text-[13px] text-red-500">{signup.message}</p>}
            {signup.token && (
              <div className="mt-3">
                <SignupInterests token={signup.token} />
              </div>
            )}
            <p className="mt-3 text-[12.5px] text-navy/45">We respect your privacy. Unsubscribe anytime.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
