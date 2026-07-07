import { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

interface Props {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({ icon: Icon = Inbox, title, description, action }: Props) {
  return (
    <div className="rounded-xl3 border border-navy/[0.06] bg-white p-12 text-center shadow-softer">
      <Icon size={28} className="mx-auto text-navy/20" strokeWidth={1.8} />
      <p className="mt-4 font-display text-lg font-bold text-navy">{title}</p>
      {description && <p className="mt-2 text-[14px] text-navy/50">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
