import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Package } from 'lucide-react'
import SEO from '../components/seo/SEO'
import FAQPanel from '../components/runtime/FAQPanel'
import BundlePurchaseCard from '../components/systems/BundlePurchaseCard'
import { ICONS_BY_CATEGORY } from '../components/systems/categoryIcons'
import { bundlePath, loadBundleWithItems } from '../lib/publishedCatalog'
import { useIdentity } from '../modules/identity/IdentityContext'
import { useBundlePurchase } from '../modules/workspace/hooks/useBundlePurchase'
import { formatCents, savingsPercent, separatePriceCents, toCents } from '../modules/workspace/lib/bundlePrice'
import { studioProductNoun } from '../modules/workspace/lib/productNoun'
import type { Product } from '../modules/commerce/types/product'

const INCLUDED_ID = 'included'
const BUY_ID = 'get-the-bundle'

function ItemCover({ item, className = '' }: { item: Product; className?: string }) {
  const Icon = ICONS_BY_CATEGORY[item.industry ?? ''] ?? ICONS_BY_CATEGORY.Default
  return item.assets.thumbnail ? (
    <img src={item.assets.thumbnail} alt="" loading="lazy" className={`object-cover ${className}`} />
  ) : (
    <div className={`grid place-items-center bg-grad-primary text-white ${className}`}>
      <Icon size={40} strokeWidth={1.6} aria-hidden />
    </div>
  )
}

// A bundle (Portal migration 0041): several products sold together. New look
// 20/11/2026 (the owner's design): the bundle's text, its products' own
// covers and the price card on top; each product with its cover, text,
// benefits and its own price; the FAQ when the team wrote one; a closing
// band. Everything comes from Admin → Bundles and from the products
// themselves — no member counts, made-up screenshots or "who it's for" text
// that nobody wrote.
export default function BundlePage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const { user } = useIdentity()
  const [data, setData] = useState<{ bundle: Product; items: Product[] } | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    setData(undefined)
    if (!slug) return
    loadBundleWithItems(slug)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  const bundle = data?.bundle
  const items = useMemo(() => data?.items ?? [], [data])
  const purchase = useBundlePurchase(bundle, items, user?.id, searchParams.get('checkout'))

  if (data === null || (data && data.items.length === 0)) return <Navigate to="/systems" replace />
  if (!data || !bundle) return null

  const priceCents = toCents(bundle.basePrice)
  const separate = separatePriceCents(items.map((i) => ({ priceCents: toCents(i.basePrice) })))
  const saving = savingsPercent(priceCents, separate)
  const owned = new Set(purchase.info?.ownedIds ?? [])
  const free = priceCents === 0
  const words = bundle.title.trim().split(/\s+/)
  const lastWord = words.length > 1 ? words.pop() : null
  const shown = items.slice(0, 3)

  return (
    <div className="bg-gradient-to-b from-blue-50/60 via-bg to-bg pt-28 md:pt-36">
      <SEO
        title={bundle.title}
        description={bundle.description}
        path={bundlePath(bundle.slug)}
        ogImage={bundle.assets.thumbnail ?? items.find((i) => i.assets.thumbnail)?.assets.thumbnail}
      />

      {/* Top: text, the products' covers, the price card */}
      <section className="container-px mx-auto max-w-page pb-14">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_20rem]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-primary/15 bg-white px-3 py-1 text-[12.5px] font-semibold text-primary">Bundle</span>
              <Link to="/systems" className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-navy/70 hover:text-navy">
                <ArrowLeft size={15} aria-hidden /> Back to Catalog
              </Link>
            </div>
            <h1 className="mt-6 font-display text-[36px] font-extrabold leading-[1.08] tracking-tight text-navy sm:text-[48px]">
              {words.join(' ')} {lastWord && <span className="text-primary">{lastWord}</span>}
            </h1>
            <p className="mt-5 max-w-xl whitespace-pre-line text-[16px] leading-relaxed text-navy/60">{bundle.longDescription ?? bundle.description}</p>
            <a href={`#${INCLUDED_ID}`} className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:underline">
              See the {items.length} {items.length === 1 ? 'product' : 'products'} inside{saving > 0 ? ` · save ${saving}%` : ''} <ArrowRight size={15} aria-hidden />
            </a>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative h-[300px] sm:h-[360px] lg:hidden xl:block"
            aria-hidden
          >
            {bundle.assets.thumbnail ? (
              <img src={bundle.assets.thumbnail} alt="" className="h-full w-full rounded-[24px] object-cover shadow-glow" />
            ) : (
              shown.map((item, i) => (
                <div
                  key={item.id}
                  className="absolute overflow-hidden rounded-[20px] border border-navy/[0.06] bg-white shadow-glow"
                  style={
                    shown.length === 1
                      ? { inset: 0 }
                      : { width: '76%', left: `${i * (24 / (shown.length - 1))}%`, top: `${i * (38 / (shown.length - 1))}%`, zIndex: i + 1 }
                  }
                >
                  <p className="truncate border-b border-navy/[0.06] px-4 py-2.5 font-display text-[15px] font-bold text-navy">{item.title}</p>
                  <ItemCover item={item} className={`w-full ${shown.length === 1 ? 'h-full' : 'h-32 sm:h-40'}`} />
                </div>
              ))
            )}
          </motion.div>

          <div id={BUY_ID} className="scroll-mt-28 lg:sticky lg:top-28">
            <BundlePurchaseCard
              priceCents={priceCents}
              separateCents={separate}
              savingPercent={saving}
              workspaceCount={items.length}
              status={purchase.loading ? 'loading' : 'ready'}
              signedIn={Boolean(user)}
              ownedCount={owned.size}
              amountDueCents={purchase.info?.amountDueCents ?? priceCents}
              ownsAll={Boolean(purchase.info?.ownsAll)}
              busy={purchase.busy}
              confirming={purchase.confirming}
              error={purchase.error}
              myWorkspacesTo={purchase.myWorkspacesTo}
              signInTo={`/login?next=${encodeURIComponent(bundlePath(bundle.slug))}`}
              onBuy={purchase.buy}
            />
          </div>
        </div>
      </section>

      {/* What's inside */}
      <section id={INCLUDED_ID} className="container-px mx-auto max-w-page scroll-mt-28 pb-14">
        <div className="flex items-center gap-5">
          <span className="h-px flex-1 bg-navy/10" />
          <h2 className="font-display text-[22px] font-bold text-navy">What’s inside</h2>
          <span className="h-px flex-1 bg-navy/10" />
        </div>
        <div className={`mt-8 grid grid-cols-1 gap-5 ${items.length > 1 ? 'lg:grid-cols-2' : ''}`}>
          {items.map((item) => {
            const Icon = ICONS_BY_CATEGORY[item.industry ?? ''] ?? ICONS_BY_CATEGORY.Default
            const benefits = item.benefits.filter((b) => b.title.trim()).slice(0, 3)
            return (
              <article key={item.id} className="flex flex-col gap-5 rounded-[24px] border border-navy/[0.07] bg-white p-3 shadow-softer sm:flex-row">
                <ItemCover item={item} className="h-48 w-full shrink-0 rounded-[18px] sm:h-auto sm:w-[38%]" />
                <div className="flex min-w-0 flex-1 flex-col px-2 pb-3 sm:py-3 sm:pr-3">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 text-primary">
                      <Icon size={20} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-primary/80">{studioProductNoun(item)}</p>
                      <h3 className="font-display text-[18px] font-bold leading-snug text-navy">{item.title}</h3>
                    </div>
                  </div>
                  <p className="mt-3 text-[14px] leading-relaxed text-navy/60">{item.description}</p>
                  {benefits.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {benefits.map((b) => (
                        <li key={b.title} className="flex items-start gap-2 text-[13.5px] text-navy/70">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden /> {b.title}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                    <Link to={`/product/${item.slug}`} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:underline">
                      View {studioProductNoun(item).toLowerCase()} <ArrowRight size={15} aria-hidden />
                    </Link>
                    {owned.has(item.id) ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[12.5px] font-semibold text-emerald-700">You already own this</span>
                    ) : (
                      <span className="rounded-full bg-bg-soft px-3 py-1 text-[12.5px] font-medium text-navy/60">
                        {item.basePrice === 0 ? 'Free on its own' : `On its own: ${formatCents(toCents(item.basePrice))}`}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* FAQ — only when the team wrote one */}
      {(bundle.faq?.length ?? 0) > 0 && (
        <section className="container-px mx-auto max-w-narrow pb-14">
          <FAQPanel items={bundle.faq ?? []} />
        </section>
      )}

      {/* Closing band */}
      <section className="container-px mx-auto max-w-page pb-24">
        <div className="flex flex-col items-start gap-5 rounded-[24px] border border-primary/10 bg-blue-50/70 p-6 sm:flex-row sm:items-center sm:p-8">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-primary shadow-softer">
            <Package size={24} aria-hidden />
          </span>
          <div className="flex-1">
            <p className="font-display text-[18px] font-bold text-navy">
              {items.length} {items.length === 1 ? 'product' : 'products'}, one {free ? 'free ' : ''}bundle
            </p>
            <p className="mt-1 text-[14px] text-navy/60">Each one opens on its own in My Workspaces.</p>
          </div>
          <div className="w-full sm:w-auto">
            <a
              href={`#${BUY_ID}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-[15px] font-semibold text-white shadow-soft transition-opacity hover:opacity-95"
            >
              {free ? 'Get the bundle free' : 'Get the bundle'} <ArrowRight size={17} aria-hidden />
            </a>
            {free && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-[12.5px] text-navy/50">
                <Lock size={13} aria-hidden /> No credit card required
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
