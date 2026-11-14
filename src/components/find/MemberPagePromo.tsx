import logo from '../../assets/logo.png'
import { usePageTexts } from '../../lib/usePageTexts'
import type { MemberPage } from '../../modules/find/types'

// The BGrowth mark at the bottom of every public member page.
//
// Two shapes, one component (redesigned 28/10/2026): when the invitation is
// written in Admin → Site → Page texts → Member pages, it shows as a wide
// pill — our logo and name on the left, the invitation on the right — and
// that pill is the brand mark, so the plain "Powered by BGrowth" line isn't
// repeated under it. With no invitation written, only that plain line shows,
// exactly as before.
//
// The pill is always BGrowth blue (--color-brand*), never the member's page
// color: it is our mark on someone else's page, and a theme must not repaint
// it. The invitation text is translatable on purpose; the name "BGrowth"
// isn't.
//
// Simplified 14/11/2026 (the owner's choice, after the Linkfly footer): just
// the pill — logo, name, "Try for free" — with no title above it and no
// sentence under it.
interface Props {
  language: MemberPage['language']
  /** In the editor's preview nothing here is clickable. */
  preview?: boolean
  /** The plain fallback line ("Made with BGrowth"), from the page labels. */
  madeWith: string
}

export default function MemberPagePromo({ language, preview = false, madeWith }: Props) {
  const t = usePageTexts()
  const lang = language === 'pt' ? 'pt' : 'en'
  const button = t.text(`pages.promo.${lang}.button`)
  const href = safeLink(t.text('pages.promo.link'))

  const plain = (
    <a
      href={preview ? '#' : '/'}
      onClick={preview ? (e) => e.preventDefault() : undefined}
      translate="no"
      className="notranslate inline-block text-[12.5px] font-medium text-navy/35 transition-colors hover:text-navy/60"
    >
      {madeWith}
    </a>
  )

  // No invitation written, or the editor's preview: just the brand line.
  if (preview || !button.trim()) return plain

  return (
    <div className="mx-auto w-full max-w-sm">
      <a
        href={href}
        className="group flex items-center gap-3 rounded-full px-3 py-2 shadow-softer transition-shadow hover:shadow-soft"
        style={{ backgroundColor: 'var(--color-brand-soft)' }}
      >
        <span
          className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full shadow-softer"
          style={{ backgroundColor: 'var(--color-brand)' }}
        >
          <img src={logo} alt="" className="h-full w-full scale-110 object-cover" />
        </span>
        <span translate="no" className="notranslate font-display text-[16px] font-bold tracking-tight" style={{ color: 'var(--color-brand)' }}>
          BGrowth
        </span>
        <span
          className="ml-auto pr-2 text-right text-[14.5px] font-semibold leading-tight"
          style={{ color: 'var(--color-brand)' }}
        >
          {button}
        </span>
      </a>
    </div>
  )
}

// A page of this site ("/…", not "//…") or an https address; anything else
// falls back to the built-in sign-up link.
function safeLink(value: string): string {
  const v = value.trim()
  if (v.startsWith('/') && !v.startsWith('//')) return v
  if (/^https:\/\/[^\s]+$/i.test(v)) return v
  return '/register?next=%2Fplatform%2Fmy-page'
}
