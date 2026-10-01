import { ArrowRight, Check, ExternalLink } from 'lucide-react'
import Button from '../ui/Button'
import type { Product } from '../../modules/commerce/types/product'

interface Props {
  product: Product
  owned: boolean
  openTo: string
  getHref: string
  className?: string
}

const QUICK_SUMMARY = [
  'Interactive Workspace™ you fill in online',
  'Save as many records as you need',
  'Print or download as PDF',
  'Works on desktop, tablet and mobile',
]

// The buy box for a Workspace published from BGrowth Studio — a sibling of
// PurchaseCard (CLAUDE.md §6). Until checkout moves into this site, buying
// happens on BGrowth Portal with the same account; once bought, the
// Workspace opens here ("Open Workspace"). The page decides `owned` and
// the two destinations — this card only presents them.
export default function StudioPurchaseCard({ product, owned, openTo, getHref, className = '' }: Props) {
  const free = product.basePrice === 0
  const amount = Number.isInteger(product.basePrice) ? product.basePrice : product.basePrice.toFixed(2)

  return (
    <div className={`rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-glow ${className}`}>
      {owned ? (
        <>
          <p className="text-[13px] font-semibold text-primary">You own this Workspace</p>
          <Button to={openTo} icon={<ArrowRight size={16} />} className="mt-4 w-full">
            Open Workspace
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-navy">{free ? 'Free' : `$${amount}`}</span>
            {!free && <span className="text-[13px] text-navy/40">one-time</span>}
          </div>
          <Button href={getHref} icon={<ExternalLink size={16} />} className="mt-5 w-full">
            {free ? 'Get It Free' : 'Get Workspace'}
          </Button>
          <p className="mt-3 text-center text-[12px] leading-relaxed text-navy/45">
            {free ? 'Claim it' : 'Checkout'} on BGrowth Portal with your BGrowth account. Once it&rsquo;s yours, it
            opens right here in My Workspaces.
          </p>
        </>
      )}

      <ul className="mt-6 space-y-2.5">
        {QUICK_SUMMARY.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-[13px] text-navy/60">
            <Check size={14} className="shrink-0 text-primary" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
