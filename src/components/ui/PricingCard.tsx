import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import Button from './Button'
import type { CheckoutSelection } from '../../types/checkout'

interface Props {
  selection: CheckoutSelection
}

export default function PricingCard({ selection }: Props) {
  const navigate = useNavigate()

  function handleBuyNow() {
    navigate('/checkout', { state: selection })
  }

  return (
    <div className="rounded-xl3 border border-navy/[0.06] bg-white p-6 shadow-glow">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold text-navy">${selection.price}</span>
        <span className="text-[13px] text-navy/40">one-time</span>
      </div>
      <Button type="button" onClick={handleBuyNow} icon={<ArrowRight size={16} />} className="mt-5 w-full">
        Get {selection.productName}
      </Button>
      <p className="mt-3 text-center text-[12px] text-navy/40">Instant access after checkout</p>

      <div className="mt-5 flex items-center gap-3 rounded-xl border border-primary/15 bg-bg-soft px-4 py-3">
        <Sparkles size={16} className="shrink-0 text-primary" />
        <p className="text-[12.5px] leading-snug text-navy/60">
          BGrowth Club members pay <span className="font-semibold text-primary">${selection.memberPrice}</span> —{' '}
          <span className="whitespace-nowrap">save ${selection.price - selection.memberPrice}</span>.
        </p>
      </div>
    </div>
  )
}
