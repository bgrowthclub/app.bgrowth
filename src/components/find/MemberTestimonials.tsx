import { ExternalLink, Quote, Star } from 'lucide-react'
import MemberLinkIcon from './MemberLinkIcon'
import type { MemberPageBlockData } from '../../modules/find/types'

// The testimonials section of a member page (19/11/2026, the owner's design —
// "this part was very ugly"). It follows the look the owner chose: the card
// and title classes come from the page. Each card: the quote mark, stars when
// given, a bold headline when given, the words, then the name (initials) and
// the service. Where the reviews live (Google, Yelp…) shows as a badge with
// its rating — ONLY beside its own link, so a visitor can check it — and as a
// button at the end. No "verified client", no "most praised", no claims of
// ours: everything here is what the owner wrote.
const L = {
  en: { reviews: 'reviews', more: 'See more reviews on', at: 'Reviews' },
  pt: { reviews: 'avaliações', more: 'Ver mais avaliações no', at: 'Avaliações' },
}

const SITES: [RegExp, string][] = [
  [/(^|\.)google\.|g\.page|goo\.gl/, 'Google'],
  [/(^|\.)yelp\./, 'Yelp'],
  [/(^|\.)facebook\.|fb\.com/, 'Facebook'],
  [/(^|\.)trustpilot\./, 'Trustpilot'],
  [/(^|\.)thumbtack\./, 'Thumbtack'],
  [/(^|\.)angi\.|angieslist\./, 'Angi'],
  [/(^|\.)nextdoor\./, 'Nextdoor'],
  [/(^|\.)bbb\.org/, 'BBB'],
]

function siteName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return SITES.find(([re]) => re.test(host))?.[1] ?? host
  } catch {
    return url
  }
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

function Stars({ n, size = 15 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(n) ? 'fill-amber-400 text-amber-400' : 'text-navy/15'} aria-hidden />
      ))}
    </span>
  )
}

interface Props {
  data: MemberPageBlockData
  language: 'en' | 'pt'
  /** The page look's card and title classes. */
  cardClass: string
  titleClass: string
  /** One column (the narrow looks and the one-column models). */
  narrow?: boolean
  preview?: boolean
  onLinkClick?: (target: string) => void
}

export default function MemberTestimonials({ data, language, cardClass, titleClass, narrow, preview, onLinkClick }: Props) {
  // Counted like the page's other buttons ("reviews:Google"); inert in the editor's preview.
  const click = (url: string) => (e: React.MouseEvent) => {
    if (preview) e.preventDefault()
    else onLinkClick?.(`reviews:${siteName(url)}`)
  }
  const t = L[language] ?? L.en
  const items = (data.items ?? []).filter((i) => i.title.trim())
  const reviews = data.reviews ?? []
  if (!items.length && !reviews.length) return null
  // Two per row at most (19/11/2026, the owner's choice): wider cards read better.
  const cols = narrow || items.length === 1 ? '' : 'md:grid-cols-2'

  return (
    <div>
      <div className="text-center">
        {data.title && <h2 className={titleClass}>{data.title}</h2>}
        {data.body && <p className="mx-auto mt-3 max-w-2xl text-[15.5px] leading-relaxed text-navy/60">{data.body}</p>}
        {reviews.some((r) => r.rating) && (
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            {reviews
              .filter((r) => r.rating)
              .map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={click(r.url)}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-navy/10 bg-white px-4 py-2 text-[13.5px] shadow-softer transition-colors hover:border-primary/30"
                >
                  <MemberLinkIcon link={{ type: 'website', url: r.url }} size={16} />
                  <span className="font-semibold text-navy">{siteName(r.url)}</span>
                  <span className="h-4 w-px bg-navy/10" aria-hidden />
                  <span className="font-bold text-amber-500">{r.rating!.toFixed(1)}</span>
                  <Stars n={r.rating!} size={13} />
                  {r.count ? (
                    <span className="text-navy/50">
                      ({r.count.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')} {t.reviews})
                    </span>
                  ) : null}
                </a>
              ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className={`mt-9 grid gap-5 ${cols} ${narrow || items.length === 1 ? 'mx-auto max-w-2xl' : 'mx-auto max-w-5xl'}`}>
          {items.map((item, i) => (
            <figure key={i} className={`${cardClass} flex flex-col p-6 sm:p-7`}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Quote size={18} aria-hidden />
              </span>
              {item.stars ? (
                <p className="mt-4 flex items-center gap-2">
                  <Stars n={item.stars} />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-navy/40">{item.stars}.0</span>
                </p>
              ) : null}
              {item.headline && <p className="mt-3 font-display text-[17px] font-bold leading-snug text-navy">“{item.headline}”</p>}
              <blockquote className="mt-3 flex-1 whitespace-pre-line text-[15px] leading-relaxed text-navy/70">{item.title}</blockquote>
              {(item.body || item.tag) && (
                <figcaption className="mt-5 flex items-center gap-3 border-t border-navy/[0.07] pt-4">
                  {item.body && (
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-[13px] font-bold text-white" aria-hidden>
                      {initials(item.body)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-navy">{item.body}</span>
                  {item.tag && <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-[11.5px] font-semibold text-primary">{item.tag}</span>}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}

      {reviews.length > 0 && (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {reviews.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={click(r.url)}
              className="inline-flex items-center gap-2 rounded-xl border border-navy/10 bg-white px-5 py-2.5 text-[14px] font-semibold text-primary shadow-softer transition-colors hover:border-primary/30"
            >
              <MemberLinkIcon link={{ type: 'website', url: r.url }} size={16} />
              {t.more} {siteName(r.url)}
              <ExternalLink size={14} aria-hidden />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
