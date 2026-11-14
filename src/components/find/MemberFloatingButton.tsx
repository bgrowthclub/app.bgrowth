import type { MemberPage, MemberPageLink } from '../../modules/find/types'
import { memberLinkLabel, pageButtonProps } from '../../modules/find/memberPageService'
import { blockLinks, pageBlocks } from '../../modules/find/memberPageTemplates'
import { MEMBER_LINK_ICONS } from './memberLinkIcons'

// The button that stays in the corner while visitors scroll (14/11/2026).
// Off unless the member turns it on, and they choose which of the page's own
// buttons it opens (`theme.floating` = 'contact:<type>'). A button that no
// longer exists, or no longer works, draws nothing.
//
// It sits outside the page's colored wrapper, so it doesn't take the page's
// color: WhatsApp keeps WhatsApp green, which visitors recognize, and every
// other button is navy, readable on any background.
interface Props {
  // The view's own page shape: a preview may not have an id or a status yet.
  page: Pick<MemberPage, 'links' | 'language'> & Partial<Pick<MemberPage, 'slug' | 'blocks' | 'theme'>>
  preview?: boolean
  onLinkClick?: (target: string) => void
}

export default function MemberFloatingButton({ page, preview = false, onLinkClick }: Props) {
  const chosen = page.theme?.floating
  if (!chosen?.startsWith('contact:')) return null
  const links: MemberPageLink[] = [
    ...page.links,
    ...pageBlocks(page).flatMap((b) => (b.type === 'contact' && !b.hidden ? blockLinks(page, b) : [])),
  ]
  const target = pageButtonProps(chosen, links, page.slug ?? '')
  const link = links.find((l) => l.type === chosen.slice('contact:'.length))
  if (!target || !link) return null

  const Icon = MEMBER_LINK_ICONS[link.type]
  const green = link.type === 'whatsapp' || link.type === 'whatsapp_group'
  return (
    <a
      href={preview ? '#' : target.href}
      target={preview ? undefined : target.target}
      rel={preview ? undefined : target.rel}
      onClick={(e) => {
        if (preview) {
          e.preventDefault()
          return
        }
        onLinkClick?.(`link:${link.type}`)
      }}
      className={`no-print fixed bottom-5 right-5 z-40 inline-flex max-w-[calc(100vw-2.5rem)] items-center gap-2 rounded-full px-5 py-3.5 text-[15px] font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5 ${
        green ? 'bg-whatsapp' : 'bg-navy'
      }`}
    >
      <Icon size={19} aria-hidden /> <span className="truncate">{memberLinkLabel(link, page.language)}</span>
    </a>
  )
}
