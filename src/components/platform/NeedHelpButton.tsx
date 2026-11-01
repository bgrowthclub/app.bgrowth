import { Link } from 'react-router-dom'
import { LifeBuoy } from 'lucide-react'

interface Props {
  // What the member is looking at, used as the ticket's subject so the team
  // knows which product it is about without asking.
  about?: string
  className?: string
}

// "Need help?" inside a product (01/11/2026): a member who is stuck is stuck
// here, not in the side menu. It opens the Support Center with the subject
// already filled in — the team's first question ("which Workspace?") is
// answered before they ask it.
//
// Deliberately quiet: this sits at the end of a product, next to the review,
// and must never compete with the product itself. Not printed.
export default function NeedHelpButton({ about, className = '' }: Props) {
  const to = about ? `/platform/support?about=${encodeURIComponent(about.slice(0, 160))}` : '/platform/support'
  return (
    <div className={`no-print flex justify-center ${className}`}>
      <Link
        to={to}
        className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-white px-4 py-2 text-[13px] font-semibold text-navy/70 shadow-softer transition-colors hover:border-primary/30 hover:text-navy"
      >
        <LifeBuoy size={15} aria-hidden />
        Need help with this?
      </Link>
    </div>
  )
}
