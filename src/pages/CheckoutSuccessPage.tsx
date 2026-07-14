import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { ArrowRight, BookOpen, Check, CheckCircle2, LifeBuoy, Loader2 } from 'lucide-react'
import SEO from '../components/seo/SEO'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { ICONS_BY_CATEGORY } from '../components/systems/categoryIcons'
import { WORKSPACE_CATEGORIES } from '../data/workspaceCategories'
import { productService } from '../modules/commerce/services/ProductService'
import { accessService } from '../modules/commerce/client/accessService'
import { resolveProductSystem } from '../lib/publishedCatalog'
import { useIdentity } from '../modules/identity/mock/MockIdentityProvider'
import type { Product } from '../modules/commerce/types/product'

const TIMELINE_STEPS = [
  { title: 'Purchase Completed', status: 'complete' as const },
  { title: 'Workspace Added To Your Library', status: 'complete' as const },
  { title: 'Start Your First Workspace', status: 'upcoming' as const, label: 'Ready' },
]

// How long to poll AccessService for the webhook's grant before giving up
// and showing a "still finalizing" fallback — see the polling effect
// below.
const ACCESS_POLL_ATTEMPTS = 8
const ACCESS_POLL_INTERVAL_MS = 1500

// The final step of the purchase flow's navigation architecture — reached
// by a real, full-page redirect from Stripe Checkout, not client-side
// router navigation, so this page reads productId/workspaceId from the
// URL query string (set in CheckoutPage's successUrl) rather than
// router-state (which a full-page redirect never carries). Stripe's
// webhook (see api/webhooks/stripe.ts) grants access asynchronously —
// often before this page even finishes loading, but not guaranteed — so
// this page polls AccessService briefly rather than assuming access
// already exists the instant the redirect lands.
export default function CheckoutSuccessPage() {
  const navigate = useNavigate()
  const { user } = useIdentity()
  const [searchParams] = useSearchParams()
  const productId = searchParams.get('productId')
  const workspaceId = searchParams.get('workspaceId')
  const [product, setProduct] = useState<Product | null | undefined>(undefined)
  const [accessGranted, setAccessGranted] = useState(false)
  const [pollTimedOut, setPollTimedOut] = useState(false)

  useEffect(() => {
    if (!productId) return
    let cancelled = false
    setProduct(undefined)
    productService.getProductById(productId).then((result) => {
      if (!cancelled) setProduct(result ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [productId])

  useEffect(() => {
    if (!productId || !user) return
    let cancelled = false
    let attempt = 0

    async function poll() {
      const hasAccess = await accessService.hasAccess(user!.id, productId!)
      if (cancelled) return
      if (hasAccess) {
        setAccessGranted(true)
        return
      }
      attempt += 1
      if (attempt >= ACCESS_POLL_ATTEMPTS) {
        setPollTimedOut(true)
        return
      }
      setTimeout(poll, ACCESS_POLL_INTERVAL_MS)
    }

    poll()
    return () => {
      cancelled = true
    }
  }, [productId, user])

  if (!productId || !workspaceId || product === null) return <Navigate to="/systems" replace />
  if (product === undefined || !user) return null

  const system = resolveProductSystem(product)
  const Icon = ICONS_BY_CATEGORY[system?.category ?? ''] ?? ICONS_BY_CATEGORY.Default
  const workspace = WORKSPACE_CATEGORIES.find((w) => w.slug === workspaceId)
  const purchaseDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  function handleOpenWorkspace() {
    if (system) navigate(`/system/${system.slug}`)
  }

  function handleGoToMyProducts() {
    navigate('/platform/my-systems')
  }

  return (
    <div className="pb-28 pt-32 md:pt-40">
      <SEO
        title="Purchase Successful"
        description="Your Workspace purchase was completed successfully."
        path="/checkout/success"
      />

      <div className="container-px mx-auto max-w-narrow text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-grad-primary shadow-glow">
          <CheckCircle2 size={40} strokeWidth={2} className="text-white" />
        </div>

        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
          Workspace Purchased Successfully!
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-navy/55">
          Your new Workspace is now available in your account. You can start using it immediately.
        </p>

        {!accessGranted && !pollTimedOut && (
          <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2.5 rounded-xl border border-primary/15 bg-bg-soft px-4 py-3">
            <Loader2 size={16} className="shrink-0 animate-spin text-primary" />
            <p className="text-[12.5px] font-medium text-navy/60">Finalizing your purchase…</p>
          </div>
        )}
        {pollTimedOut && !accessGranted && (
          <div className="mx-auto mt-6 max-w-md rounded-xl border border-primary/15 bg-bg-soft px-4 py-3">
            <p className="text-[12.5px] font-medium text-navy/60">
              Your payment was received and is still being finalized — check My Workspaces in a moment if it isn't
              showing up here yet.
            </p>
          </div>
        )}

        {/* Purchase Summary */}
        <Card padding="lg" className="mt-10 text-left">
          <div className="flex items-start gap-5">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
              <Icon size={26} strokeWidth={2} />
            </div>
            <div className="flex-1">
              {workspace && <Badge>{workspace.name} Workspace™</Badge>}
              <h2 className="mt-2 font-display text-lg font-bold text-navy">{product.title}</h2>
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-navy/[0.06] pt-5">
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-navy/50">Purchase Date</span>
              <span className="font-medium text-navy">{purchaseDate}</span>
            </div>
          </div>
        </Card>

        {/* CTAs */}
        <div className="mt-8 space-y-3">
          <Button
            type="button"
            onClick={handleOpenWorkspace}
            disabled={!accessGranted}
            icon={<ArrowRight size={16} />}
            className="w-full"
          >
            Open Workspace
          </Button>
          <Button type="button" onClick={handleGoToMyProducts} variant="secondary" className="w-full">
            Go to My Products
          </Button>
          <Button to="/workspaces" variant="ghost" className="w-full">
            Continue Shopping
          </Button>
        </div>

        {/* What Happens Next */}
        <Card padding="lg" className="mt-10 text-left">
          <p className="eyebrow">What Happens Next</p>
          <ol className="mt-5 space-y-5">
            {TIMELINE_STEPS.map((step, i) => (
              <li key={step.title} className="flex items-start gap-4">
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                    step.status === 'complete' ? 'bg-grad-primary text-white' : 'border-2 border-primary/20 text-primary'
                  }`}
                >
                  {step.status === 'complete' ? <Check size={15} /> : i + 1}
                </div>
                <div className="flex flex-1 items-center justify-between gap-3 pt-1.5">
                  <span className="text-[14px] font-medium text-navy">{step.title}</span>
                  {step.status === 'complete' ? (
                    <Check size={16} className="shrink-0 text-primary" />
                  ) : (
                    <span className="shrink-0 rounded-full bg-bg-soft px-3 py-1 text-[11px] font-semibold text-primary">
                      {step.label}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Card>

        {/* Help */}
        <div className="mt-10">
          <p className="text-[13px] font-semibold text-navy/60">Need help?</p>
          {/* No public Support/Help Center route exists in App.tsx yet
              (only the gated /platform/support) — left inert rather than
              linking to a page that doesn't exist, per CLAUDE.md's routing
              rules. Wire these once a public support surface is built. */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span className="inline-flex cursor-default items-center gap-1.5 text-[13px] font-semibold text-navy/40">
              <LifeBuoy size={14} />
              Contact Support
            </span>
            <span className="inline-flex cursor-default items-center gap-1.5 text-[13px] font-semibold text-navy/40">
              <BookOpen size={14} />
              Visit Help Center
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
