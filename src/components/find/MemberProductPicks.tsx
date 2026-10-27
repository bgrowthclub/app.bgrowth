import { useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import { BookOpen, Briefcase, Car, ExternalLink, Home, Laptop, Package, Plane, Search, Star, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { MEMBER_PAGE_LABELS } from '../../modules/find/memberPageService'
import { usePageTexts } from '../../lib/usePageTexts'
import type { MemberPage, MemberPageProduct, MemberPageProductCategory } from '../../modules/find/types'

export const PRODUCT_CATEGORY_ICONS: Record<MemberPageProductCategory, LucideIcon> = {
  car: Car,
  work: Briefcase,
  home: Home,
  tech: Laptop,
  travel: Plane,
  learning: BookOpen,
  finance: Wallet,
  other: Package,
}

interface Props {
  products: MemberPageProduct[]
  title?: string
  // The member's own words about their links (shown above the standard note).
  note?: string
  // The member switched the standard affiliate note off for their page.
  hideNote?: boolean
  // 'own' = the member's own catalog (Empresas): the standard affiliate note
  // never shows and the links aren't marked sponsored, because nobody else
  // is paying them. Default stays the affiliate showcase.
  kind?: 'affiliate' | 'own'
  language: MemberPage['language']
  preview?: boolean
  onLinkClick?: (target: string) => void
  // The look's section title class.
  headingClass?: string
}

// The product showcase, used by two models: Affiliate Picks (products the
// member recommends) and Empresas (the member's own catalog) — same cards,
// one difference, `kind`. Favorites first, then all of them with category
// filters and a search. Only what the member entered is shown (no prices,
// ratings or reviews); links open as typed. On an affiliate page they are
// marked sponsored and the standard note shows unless the member switched it
// off (Sprint 146); on an Empresas page neither applies.
export default function MemberProductPicks({ products, title, note, hideNote = false, kind = 'affiliate', language, preview = false, onLinkClick, headingClass }: Props) {
  const t = MEMBER_PAGE_LABELS[language] ?? MEMBER_PAGE_LABELS.en
  // The standard note, edited in Admin → Site → Page texts → Member pages.
  const standardNote = usePageTexts().text(`pages.affiliate.${language === 'pt' ? 'pt' : 'en'}.note`)
  const showStandard = kind === 'affiliate' && !hideNote && Boolean(standardNote.trim())
  const [category, setCategory] = useState<MemberPageProductCategory | 'all'>('all')
  const [query, setQuery] = useState('')
  const items = products.filter((p) => p.title.trim() && p.url.trim())
  const favorites = items.filter((p) => p.favorite)
  const used = (Object.keys(PRODUCT_CATEGORY_ICONS) as MemberPageProductCategory[]).filter((c) => items.some((p) => (p.category ?? 'other') === c))
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(
      (p) =>
        (category === 'all' || (p.category ?? 'other') === category) &&
        (!q || p.title.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)),
    )
  }, [items, category, query])

  const open = (p: MemberPageProduct) =>
    preview
      ? { href: '#', onClick: (e: MouseEvent) => e.preventDefault() }
      : { href: p.url.trim(), target: '_blank', rel: kind === 'own' ? 'noopener noreferrer' : 'sponsored nofollow noopener noreferrer', onClick: () => onLinkClick?.(`featured:${p.title}`) }

  const card = (p: MemberPageProduct, i: number, wide = false) => {
    const Icon = PRODUCT_CATEGORY_ICONS[p.category ?? 'other']
    return (
      <div key={p.title + i} className={`flex overflow-hidden rounded-2xl border border-navy/[0.08] bg-white shadow-softer ${wide ? 'flex-row sm:flex-col' : 'flex-col'}`}>
        <div className={`shrink-0 bg-bg-soft ${wide ? 'w-32 sm:w-full' : 'w-full'}`}>
          {p.image ? (
            <img src={p.image} alt={p.title} loading="lazy" className={`h-full w-full object-cover ${wide ? 'aspect-square sm:aspect-[4/3]' : 'aspect-[4/3]'}`} />
          ) : (
            <span className={`grid w-full place-items-center text-primary/40 ${wide ? 'aspect-square sm:aspect-[4/3]' : 'aspect-[4/3]'}`}>
              <Icon size={36} aria-hidden />
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
          <p className="font-semibold leading-snug text-navy">{p.title}</p>
          {p.description && <p className="mt-1 line-clamp-3 text-[13.5px] leading-relaxed text-navy/60">{p.description}</p>}
          <a
            {...open(p)}
            className="mt-auto inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-3 py-2.5 text-[13px] font-semibold sm:text-[14px] text-white transition-colors hover:bg-primary/90 [&:not(:first-child)]:mt-4"
          >
            {p.cta?.trim() || t.seeProduct} <ExternalLink size={14} aria-hidden />
          </a>
        </div>
      </div>
    )
  }

  if (!items.length) return null
  const h2 = headingClass ?? 'font-display text-2xl font-bold tracking-tight text-navy md:text-3xl'

  return (
    <div id="picks" className="scroll-mt-6">
      {favorites.length > 0 && (
        <div className="mb-12">
          <h2 className={`${h2} flex items-center gap-2`}>
            <Star size={22} className="fill-primary text-primary" aria-hidden /> {t.topPicks}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{favorites.map((p, i) => card(p, i, true))}</div>
        </div>
      )}

      <h2 className={h2}>{title || t.picks}</h2>
      {(used.length > 1 || items.length > 6) && (
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
          {used.length > 1 && (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible">
              {(['all', ...used] as const).map((c) => {
                const Icon = c === 'all' ? Star : PRODUCT_CATEGORY_ICONS[c]
                const active = category === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                      active ? 'border-primary bg-primary text-white' : 'border-navy/10 bg-white text-navy/70 hover:border-primary/40'
                    }`}
                  >
                    <Icon size={15} aria-hidden /> {c === 'all' ? t.allPicks : t.categories[c]}
                  </button>
                )
              })}
            </div>
          )}
          {items.length > 6 && (
            <label className="flex items-center gap-2 rounded-full border border-navy/10 bg-white px-3.5 py-2 md:ml-auto md:w-64">
              <Search size={15} className="text-navy/40" aria-hidden />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchPicks} className="w-full bg-transparent text-[13.5px] text-navy outline-none" />
            </label>
          )}
        </div>
      )}
      {shown.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{shown.map((p, i) => card(p, i))}</div>
      ) : (
        <p className="mt-6 text-[14px] text-navy/50">{t.noPicks}</p>
      )}

      {(showStandard || note?.trim()) && (
        <div className="mt-8 rounded-2xl bg-bg-soft px-5 py-4 text-[12.5px] leading-relaxed text-navy/55">
          {note?.trim() && <p className={`whitespace-pre-line text-navy/70 ${showStandard ? 'mb-1.5' : ''}`}>{note}</p>}
          {showStandard && <p>{standardNote}</p>}
        </div>
      )}
    </div>
  )
}
