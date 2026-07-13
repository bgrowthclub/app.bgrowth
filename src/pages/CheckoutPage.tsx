import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Navigate, Link } from 'react-router-dom'
import { ArrowRight, Check, CheckCircle2, ShieldCheck } from 'lucide-react'
import SEO from '../components/seo/SEO'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import SectionHeader from '../components/ui/SectionHeader'
import FeatureGrid from '../components/ui/FeatureGrid'
import { ICONS_BY_CATEGORY } from '../components/systems/categoryIcons'
import { WORKSPACE_CATEGORIES } from '../data/workspaceCategories'
import { isCheckoutSelection } from '../lib/checkout'
import { productService } from '../modules/commerce/services/ProductService'
import { resolveProductSystem } from '../lib/publishedCatalog'
import type { SystemBenefit } from '../types/system'
import type { Product } from '../modules/commerce/types/product'

// Generic Workspace™ experience benefits, shown on every Checkout regardless
// of which system was purchased — distinct from a system's own
// `whatsIncluded` (already shown in full on the Product page). Not sourced
// from data/systems.ts on purpose.
const WHATS_INCLUDED = [
  'Interactive Workspace™',
  'Guided Checklists',
  'Notes Sections',
  'Printable PDF Export',
  'Lifetime Updates',
]

const WHY_YOULL_LOVE_IT: SystemBenefit[] = [
  { title: 'Stay Organized', description: 'Keep every appointment, task and note in one place.' },
  { title: 'Save Time', description: 'Follow proven workflows instead of starting from scratch.' },
  { title: 'Work With Confidence', description: 'Never miss important steps again.' },
]

// Text-only, monochrome placeholders — no real payment-network logos are
// rendered anywhere in this static MVP.
const PAYMENT_METHODS = ['Visa', 'Mastercard', 'American Express', 'PayPal', 'Apple Pay', 'Google Pay']

const TRUST_ITEMS = [
  'Secure payment processing',
  'Instant digital access',
  'Lifetime updates included',
  'Access on desktop, tablet and mobile',
]

// Checkout — the second step of the purchase flow integration. Lays out a
// production-ready order summary; it does not process any payment. See
// handleContinueToPayment below for where this page will call the
// Commerce Engine (src/modules/commerce/CommerceEngine.ts) — the only
// layer ever allowed to talk to a payment provider; this page must never
// call Stripe/PayPal/etc. directly. Loads the product it's selling
// through ProductService — the navigation state only carries a
// productId, never a duplicated snapshot of price/title/etc (see
// types/checkout.ts).
export default function CheckoutPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const selection = isCheckoutSelection(location.state) ? location.state : null
  const [product, setProduct] = useState<Product | null | undefined>(undefined)

  useEffect(() => {
    if (!selection) return
    let cancelled = false
    setProduct(undefined)
    productService.getProductById(selection.productId).then((result) => {
      if (!cancelled) setProduct(result ?? null)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection?.productId])

  if (!selection || product === null) return <Navigate to="/systems" replace />
  if (product === undefined) return null

  const system = resolveProductSystem(product)
  const Icon = ICONS_BY_CATEGORY[system?.category ?? ''] ?? ICONS_BY_CATEGORY.Default
  const workspace = WORKSPACE_CATEGORIES.find((w) => w.slug === selection.workspaceId)
  const priceLabel = product.basePrice.toFixed(2)

  function handleContinueToPayment() {
    // Future: call CommerceEngine.orders.createOrder(...) then
    // CommerceEngine.paymentManager.createCheckout(product.paymentProfileId, ...)
    // and redirect to the returned checkoutUrl. This page never calls a
    // payment provider (Stripe, PayPal, ...) or PaymentManager directly.
  }

  return (
    <div className="pb-28 pt-32 md:pt-40">
      <SEO title="Checkout" description="Review your order before continuing to payment." path="/checkout" />

      <div className="container-px mx-auto max-w-page">
        <Link to={`/product/${product.slug}`} className="text-[13px] font-semibold text-primary">
          ← Back to Product
        </Link>

        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">Checkout</h1>
        <p className="mt-2 text-[15px] text-navy/55">Review your order before continuing to payment.</p>

        <div className="mt-10 grid gap-12 lg:grid-cols-[13fr_7fr] lg:items-start lg:gap-16">
          {/* Left column — product information */}
          <div className="space-y-12">
            <div>
              <div className="flex h-56 items-center justify-center rounded-xl3 bg-grad-primary shadow-glow sm:h-64">
                <Icon size={64} strokeWidth={1.5} className="text-white/90" />
              </div>
              <div className="mt-6">
                {workspace && <Badge>{workspace.name} Workspace™</Badge>}
                <h2 className="mt-3 font-display text-2xl font-bold text-navy">{product.title}</h2>
                <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-navy/55">{product.description}</p>
              </div>
            </div>

            <div>
              <SectionHeader title="What's Included" className="mb-6" />
              <ul className="space-y-3">
                {WHATS_INCLUDED.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-navy/[0.06] bg-white px-4 py-3.5 shadow-softer"
                  >
                    <CheckCircle2 size={16} className="shrink-0 text-primary" />
                    <span className="text-[14px] text-navy/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <SectionHeader title="Why you'll love it" className="mb-6" />
              <FeatureGrid features={WHY_YOULL_LOVE_IT} />
            </div>
          </div>

          {/* Right column — Order Summary */}
          <Card padding="lg">
            <p className="eyebrow">Order Summary</p>

            <div className="mt-4 space-y-3 border-b border-navy/[0.06] pb-5">
              <div className="flex items-start justify-between gap-4 text-[14px]">
                <span className="shrink-0 text-navy/50">Product</span>
                <span className="text-right font-semibold text-navy">{product.title}</span>
              </div>
              <div className="flex items-center justify-between text-[14px]">
                <span className="text-navy/50">Price</span>
                <span className="font-semibold text-navy">${priceLabel}</span>
              </div>
            </div>

            <div className="space-y-3 border-b border-navy/[0.06] py-5">
              <div className="flex items-center justify-between text-[13.5px]">
                <span className="text-navy/50">Subtotal</span>
                <span className="text-navy/70">${priceLabel}</span>
              </div>
              <div className="flex items-center justify-between text-[13.5px]">
                <span className="text-navy/50">Taxes</span>
                <span className="text-navy/40">Calculated at payment</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-5">
              <span className="font-semibold text-navy">Total</span>
              <span className="font-display text-2xl font-bold text-navy">${priceLabel}</span>
            </div>

            <div className="border-t border-navy/[0.06] pt-5">
              <label htmlFor="coupon" className="text-[12.5px] font-semibold text-navy/60">
                Coupon Code
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="coupon"
                  type="text"
                  placeholder="Enter coupon code"
                  className="w-full min-w-0 rounded-xl border border-navy/10 bg-bg-soft px-3.5 py-2.5 text-[13.5px] text-navy placeholder:text-navy/30 focus:border-primary/30 focus:outline-none"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-[13px] font-semibold text-navy/70 transition-colors duration-200 hover:border-primary/20"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-primary/15 bg-bg-soft px-4 py-3">
              <ShieldCheck size={16} className="shrink-0 text-primary" />
              <p className="text-[12.5px] font-medium text-navy/60">30-Day Satisfaction Guarantee</p>
            </div>

            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/35">Secure Checkout</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {PAYMENT_METHODS.map((method) => (
                  <span
                    key={method}
                    className="rounded-lg border border-navy/10 bg-bg-soft px-2.5 py-1.5 text-[10.5px] font-semibold text-navy/40"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-7 space-y-3">
              <Button
                type="button"
                onClick={handleContinueToPayment}
                icon={<ArrowRight size={16} />}
                className="w-full"
              >
                Continue to Secure Checkout
              </Button>
              <Button type="button" onClick={() => navigate(-1)} variant="secondary" className="w-full">
                Back to Product
              </Button>
            </div>

            <ul className="mt-6 space-y-2 border-t border-navy/[0.06] pt-5">
              {TRUST_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-[12.5px] text-navy/55">
                  <Check size={13} className="shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
