import { useState } from 'react'
import { Link2 } from 'lucide-react'
import { MEMBER_LINK_ICONS } from './memberLinkIcons'
import type { MemberPageLink } from '../../modules/find/types'

// A contact button's icon: the linked site's own icon when there is one
// (14/11/2026, the owner's choice, after Linkfly) — WhatsApp, Instagram,
// TikTok, YouTube, or the site a "website"/"other"/booking button opens, such
// as a Shopee store. Phone, e-mail and "Save contact" keep our own icon, and
// so does any site whose icon can't be found.
//
// The icon is the site's own favicon, fetched by our server
// (api/ingles.ts?action=favicon), so a visitor's browser never calls a third
// party for it; it sits on a small white circle so it reads on any button
// color.

const SITE_OF: Partial<Record<MemberPageLink['type'], string>> = {
  whatsapp: 'whatsapp.com',
  whatsapp_group: 'whatsapp.com',
  instagram: 'instagram.com',
  tiktok: 'tiktok.com',
  youtube: 'youtube.com',
}
const OWN_ADDRESS: MemberPageLink['type'][] = ['website', 'other', 'booking']

function siteHost(link: Pick<MemberPageLink, 'type' | 'url'>): string | null {
  const known = SITE_OF[link.type]
  if (known) return known
  if (!OWN_ADDRESS.includes(link.type)) return null
  try {
    const host = new URL(link.url.trim()).hostname.toLowerCase()
    return /^[a-z0-9.-]+\.[a-z]{2,63}$/.test(host) ? host : null
  } catch {
    return null
  }
}

export default function MemberLinkIcon({ link, size = 17 }: { link: Pick<MemberPageLink, 'type' | 'url'>; size?: number }) {
  const [failed, setFailed] = useState(false)
  const host = siteHost(link)
  if (!host || failed) {
    const Icon = MEMBER_LINK_ICONS[link.type] ?? Link2
    return <Icon size={size} className="shrink-0" aria-hidden />
  }
  return (
    <span className="grid shrink-0 place-items-center rounded-full bg-white" style={{ width: size + 9, height: size + 9 }} aria-hidden>
      <img
        src={`/api/ingles?action=favicon&host=${encodeURIComponent(host)}`}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        className="rounded-[3px] object-contain"
        style={{ width: size, height: size }}
      />
    </span>
  )
}
