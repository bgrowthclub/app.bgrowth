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
  const title = t.text(`pages.promo.${lang}.title`)
  const text = t.text(`pages.promo.${lang}.text`)
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
    <div className="mx-auto mt-2 w-full max-w-xl">
      {title.trim() && <p className="mb-2.5 text-[13px] font-semibold text-navy/55">{title}</p>}
      <a
        href={href}
        className="group flex items-center gap-3 rounded-full px-3 py-2.5 shadow-softer transition-shadow hover:shadow-soft sm:gap-4 sm:px-4 sm:py-3"
        style={{ backgroundColor: 'var(--color-brand-soft)' }}
      >
        <span
          className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full shadow-softer sm:h-11 sm:w-11"
          style={{ backgroundColor: 'var(--color-brand)' }}
        >
          <img src={logo} alt="" className="h-full w-full scale-110 object-cover" />
        </span>
        <span translate="no" className="notranslate font-display text-[17px] font-bold tracking-tight sm:text-[19px]" style={{ color: 'var(--color-brand)' }}>
          BGrowth
        </span>
        <span
          className="ml-auto pr-1 text-right text-[14px] font-semibold leading-tight sm:text-[16px]"
          style={{ color: 'var(--color-brand)' }}
        >
          {button}
        </span>
      </a>
      {text.trim() && <p className="mt-2.5 text-[12.5px] leading-relaxed text-navy/45">{text}</p>}
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
