import { ArrowRight } from 'lucide-react'
import { usePageTexts } from '../../lib/usePageTexts'
import type { MemberPage } from '../../modules/find/types'

// "Your business deserves a page of its own" — the invitation shown at the
// bottom of every public member page, right above "Powered by BGrowth".
// Its texts and link are edited in Admin → Site → Page texts → Member pages
// (portal.site_content "page-texts"), in English and Portuguese. Translatable
// on purpose (only the brand line below isn't). Not shown in editor previews.
export default function MemberPagePromo({ language }: { language: MemberPage['language'] }) {
  const t = usePageTexts()
  const lang = language === 'pt' ? 'pt' : 'en'
  const title = t.text(`pages.promo.${lang}.title`)
  const text = t.text(`pages.promo.${lang}.text`)
  const button = t.text(`pages.promo.${lang}.button`)
  const href = safeLink(t.text('pages.promo.link'))
  if (!title && !button) return null
  return (
    <div className="mx-auto mt-6 max-w-md rounded-2xl border border-navy/[0.08] bg-white/80 px-5 py-5 text-center">
      {title && <p className="font-display text-[16px] font-bold text-navy">{title}</p>}
      {text && <p className="mt-1 text-[13.5px] leading-relaxed text-navy/60">{text}</p>}
      {button && href && (
        <a href={href} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-navy/90">
          {button} <ArrowRight size={15} aria-hidden />
        </a>
      )}
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
