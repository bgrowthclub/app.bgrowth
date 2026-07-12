import { useLocation, Navigate, Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import SEO from '../components/seo/SEO'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { ICONS_BY_CATEGORY } from '../components/systems/categoryIcons'
import { WORKSPACE_CATEGORIES } from '../data/workspaceCategories'
import type { CheckoutSelection } from '../types/checkout'

function isCheckoutSelection(value: unknown): value is CheckoutSelection {
  return !!value && typeof value === 'object' && 'productId' in value && 'productSlug' in value
}

// Temporary Checkout screen — the first step of the purchase flow
// integration. It only prepares the navigation architecture (PricingCard →
// here) and lays out an order summary; it does not process any payment.
// See handleContinueToPayment below for where BGrowth's future Wix
// Checkout integration plugs in.
export default function CheckoutPage() {
  const location = useLocation()
  const selection = isCheckoutSelection(location.state) ? location.state : null

  if (!selection) return <Navigate to="/systems" replace />

  const Icon = ICONS_BY_CATEGORY[selection.category] ?? ICONS_BY_CATEGORY.Default
  const workspace = WORKSPACE_CATEGORIES.find((w) => w.slug === selection.workspaceId)

  function handleContinueToPayment() {
    // Future:
    // Redirect to Wix Checkout
  }

  return (
    <div className="pb-28 pt-32 md:pt-40">
      <SEO
        title="Checkout"
        description="Review your order before continuing to payment."
        path="/checkout"
      />

      <div className="container-px mx-auto max-w-narrow">
        <Link to={`/product/${selection.productSlug}`} className="text-[13px] font-semibold text-primary">
          ← Back to Product
        </Link>

        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">
          Checkout
        </h1>
        <p className="mt-2 text-[15px] text-navy/55">Review your order before continuing to payment.</p>

        <Card padding="lg" className="mt-8">
          <div className="flex items-start gap-5">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-grad-primary text-white shadow-soft">
              <Icon size={26} strokeWidth={2} />
            </div>
            <div className="flex-1">
              {workspace && <Badge>{workspace.name} Workspace™</Badge>}
              <h2 className="mt-2 font-display text-xl font-bold text-navy">{selection.productName}</h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy/50">{selection.shortDescription}</p>
            </div>
          </div>

          <div className="mt-7 space-y-3 border-t border-navy/[0.06] pt-6">
            <p className="eyebrow">Order Summary</p>
            <div className="flex items-center justify-between text-[14px]">
              <span className="text-navy/60">{selection.productName}</span>
              <span className="font-semibold text-navy">${selection.price}</span>
            </div>
            {selection.memberPrice < selection.price && (
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-navy/40">BGrowth Club member price</span>
                <span className="font-medium text-primary">${selection.memberPrice}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-navy/[0.06] pt-3 text-[15px]">
              <span className="font-semibold text-navy">Total</span>
              <span className="font-display text-lg font-bold text-navy">${selection.price}</span>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={handleContinueToPayment} icon={<ArrowRight size={16} />} className="flex-1">
              Continue to Payment
            </Button>
            <Button to={`/product/${selection.productSlug}`} variant="secondary" className="flex-1">
              Back to Product
            </Button>
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[12px] text-navy/40">
            <ShieldCheck size={13} className="text-primary" />
            Secure checkout — payment powered by Wix, coming soon
          </p>
        </Card>
      </div>
    </div>
  )
}
