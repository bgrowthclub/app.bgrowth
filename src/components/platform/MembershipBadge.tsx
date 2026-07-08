import { Sparkles } from 'lucide-react'
import Badge from '../ui/Badge'

interface Props {
  tier?: string
}

// Static placeholder — there is no real membership/billing data yet (see
// CLAUDE.md: never add membership logic without explicit direction). Wraps
// the existing Badge primitive rather than introducing a new pill style.
//
// Hidden below `sm` (640px): on a phone-width TopBar it's the one item with
// no shorter form to fall back to (unlike QuickActionButton/UserMenu, which
// keep an icon), and it was overflowing the viewport at 375px. The wrapping
// span carries only the responsive display classes so it doesn't fight
// Badge's own unconditional `inline-flex` in the compiled Tailwind output.
export default function MembershipBadge({ tier = 'Free Plan' }: Props) {
  return (
    <span className="hidden sm:inline-flex">
      <Badge variant="outline" icon={<Sparkles size={11} strokeWidth={2.5} />}>
        {tier}
      </Badge>
    </span>
  )
}
