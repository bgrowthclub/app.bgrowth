import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import Button from './Button'
import { buildCheckoutSelection } from '../../lib/checkout'
import type { Product } from '../../modules/commerce/types/product'

interface Props {
  product: Product
  workspaceId: string
  previewTargetId: string
  className?: string
}

const QUICK_SUMMARY = [
  'Instant access',
  'Lifetime access',
  'Interactive Workspace™',
  'Future updates included',
  'Access on desktop, tablet and mobile',
]

// The Product Page Hero's purchase entry point (see ProductPage). A sibling
// to PricingCard, not a variant of it — this card carries a secondary
// "Preview" CTA and a quick-summary checklist that PricingCard (the page's
// bottom buy box) doesn't, so it earns its own component instead of a
// branchy prop added to PricingCard.
export default function PurchaseCard({ product, workspaceId, previewTargetId, className = '' }: Props) {
  const navigate = useNavigate()

  function handleBuyNow() {
    navigate('/checkout', { state: buildCheckoutSelection(product, workspaceId) })
  }

  return (
    <div className={`rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-glow ${className}`}>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold text-navy">${product.basePrice}</span>
        <span className="text-[13px] text-navy/40">one-time</span>
      </div>

      <Button type="button" onClick={handleBuyNow} icon={<ArrowRight size={16} />} className="mt-5 w-full">
        Get Workspace
      </Button>

      <Button to={`#${previewTargetId}`} variant="secondary" className="mt-3 w-full">
        Preview Workspace
      </Button>

      <ul className="mt-6 space-y-2.5">
        {QUICK_SUMMARY.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-[13px] text-navy/60">
            <Check size={14} className="shrink-0 text-primary" />
            {item}
          </li>
        ))}
      </ul>

      <p className="mt-5 text-center text-[11.5px] text-navy/35">Secure checkout powered by BGrowth.</p>
    </div>
  )
}
