import { ReactNode } from 'react'
import { Check } from 'lucide-react'
import Button from './Button'

interface Props {
  name: string
  price: string
  priceNote?: string
  description: string
  features: string[]
  ctaLabel: string
  ctaTo?: string
  ctaHref?: string
  highlighted?: boolean
  badge?: ReactNode
}

export default function PricingTierCard({
  name,
  price,
  priceNote,
  description,
  features,
  ctaLabel,
  ctaTo,
  ctaHref,
  highlighted = false,
  badge,
}: Props) {
  return (
    <div
      className={`relative flex flex-col rounded-xl3 border p-7 ${
        highlighted
          ? 'border-primary/20 bg-white shadow-glow'
          : 'border-navy/[0.06] bg-white shadow-softer'
      }`}
    >
      {badge && <div className="absolute -top-3 left-7">{badge}</div>}

      <h3 className="font-display text-lg font-bold text-navy">{name}</h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy/50">{description}</p>

      <div className="mt-6 flex items-baseline gap-1.5">
        <span className="font-display text-3xl font-bold text-navy">{price}</span>
        {priceNote && <span className="text-[13px] text-navy/40">{priceNote}</span>}
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <Check size={15} className="mt-0.5 shrink-0 text-primary" strokeWidth={2.5} />
            <span className="text-[13.5px] text-navy/70">{f}</span>
          </li>
        ))}
      </ul>

      {ctaTo ? (
        <Button to={ctaTo} variant={highlighted ? 'primary' : 'secondary'} className="mt-8 w-full">
          {ctaLabel}
        </Button>
      ) : (
        <Button href={ctaHref ?? '#'} variant={highlighted ? 'primary' : 'secondary'} className="mt-8 w-full">
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}
