import { Sparkles } from 'lucide-react'
import Badge from '../ui/Badge'

interface Props {
  tier?: string
}

// Static placeholder — there is no real membership/billing data yet (see
// CLAUDE.md: never add membership logic without explicit direction). Wraps
// the existing Badge primitive rather than introducing a new pill style.
//
// Narrow-viewport visibility is the caller's concern, not this component's —
// TopBar hides it below `sm` to avoid crowding a row of six other controls,
// but other contexts (e.g. WorkspaceHero, which has no such crowding) should
// always show it.
export default function MembershipBadge({ tier = 'Free Plan' }: Props) {
  return (
    <Badge variant="outline" icon={<Sparkles size={11} strokeWidth={2.5} />}>
      {tier}
    </Badge>
  )
}
