import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import SEO from '../components/seo/SEO'
import Badge from '../components/ui/Badge'
import SectionHeader from '../components/ui/SectionHeader'
import Grid from '../components/layout/Grid'
import FAQPanel from '../components/runtime/FAQPanel'
import BundleCover from '../components/systems/BundleCover'
import BundlePurchaseCard from '../components/systems/BundlePurchaseCard'
import StudioWorkspaceCard from '../components/systems/StudioWorkspaceCard'
import { bundlePath, loadBundleWithItems } from '../lib/publishedCatalog'
import { useIdentity } from '../modules/identity/IdentityContext'
import { useBundlePurchase } from '../modules/workspace/hooks/useBundlePurchase'
import { savingsPercent, separatePriceCents, toCents } from '../modules/workspace/lib/bundlePrice'
import type { Product } from '../modules/commerce/types/product'

const INCLUDED_ID = 'included'

// A bundle (Portal migration 0041): several Studio Workspaces sold
// together. Everything shown comes from what the team set in Admin →
// Bundles and from the Workspaces themselves; buying it unlocks each one.
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

  const buyBox = (className?: string) => (
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
      signInTo="/login"
      onBuy={purchase.buy}
      className={className}
    />
  )

  return (
    <div className="pt-32 md:pt-40">
      <SEO
        title={bundle.title}
        description={bundle.description}
        path={bundlePath(bundle.slug)}
        ogImage={bundle.assets.thumbnail ?? items.find((i) => i.assets.thumbnail)?.assets.thumbnail}
      />

      {/* Hero */}
      <section className="container-px mx-auto max-w-page pb-16">
        <Link to="/systems" className="text-[13px] font-semibold text-primary">
          ← Back to Business Systems
        </Link>

        <div className="mt-6 grid gap-14 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {bundle.industry && <Badge>{bundle.industry}</Badge>}
              <Badge variant="outline">Bundle</Badge>
            </div>
            <h1 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-navy md:text-4xl">
              {bundle.title}
            </h1>
            <p className="mt-4 max-w-lg whitespace-pre-line text-[16px] leading-relaxed text-navy/55">
              {bundle.longDescription ?? bundle.description}
            </p>
            <a href={`#${INCLUDED_ID}`} className="mt-6 inline-block text-[13px] font-semibold text-primary hover:underline">
              {items.length} Workspaces included{saving > 0 ? ` · save ${saving}%` : ''}
            </a>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="overflow-hidden rounded-xl3 border border-navy/[0.06] bg-white shadow-glow"
            >
              <BundleCover bundle={bundle} items={items} className="h-64 w-full" />
            </motion.div>
            {buyBox('lg:sticky lg:top-[100px]')}
          </div>
        </div>
      </section>

      {/* What's inside */}
      <section id={INCLUDED_ID} className="section-py bg-bg-soft">
        <div className="container-px mx-auto max-w-page">
          <SectionHeader
            eyebrow="What's Inside"
            title={`${items.length} ${items.length === 1 ? 'Workspace' : 'Workspaces'} included`}
            className="mb-10"
          />
          <Grid cols={3}>
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-2">
                <StudioWorkspaceCard product={item} />
                {owned.has(item.id) && (
                  <p className="flex items-center gap-1.5 px-1 text-[12.5px] font-semibold text-emerald-600">
                    <CheckCircle2 size={14} /> You already own this
                  </p>
                )}
              </div>
            ))}
          </Grid>
        </div>
      </section>

      {/* FAQ — only when the team wrote one */}
      {(bundle.faq?.length ?? 0) > 0 && (
        <section className="section-py">
          <div className="container-px mx-auto max-w-narrow">
            <FAQPanel items={bundle.faq ?? []} />
          </div>
        </section>
      )}

      {/* Purchase */}
      <section className="pb-28 pt-20">
        <div className="container-px mx-auto max-w-narrow">{buyBox()}</div>
      </section>
    </div>
  )
}
