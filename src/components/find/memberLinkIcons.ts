import { CalendarCheck, Globe, Instagram, Link2, Mail, MessageCircle, Music2, Phone, Youtube } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { MemberPageLinkType } from '../../modules/find/types'

// The icon of each kind of contact button on a member page.
export const MEMBER_LINK_ICONS: Record<MemberPageLinkType, LucideIcon> = {
  whatsapp: MessageCircle,
  phone: Phone,
  booking: CalendarCheck,
  email: Mail,
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
  website: Globe,
  other: Link2,
}
