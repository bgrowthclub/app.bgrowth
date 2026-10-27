import { ArrowRight, BadgeCheck, Link2, MapPin, Quote } from 'lucide-react'
import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import { MEMBER_LINK_ICONS } from './memberLinkIcons'
import MemberProductPicks from './MemberProductPicks'
import MemberPageSignupForm from './MemberPageSignupForm'
import MemberPagePromo from './MemberPagePromo'
import { MEMBER_PAGE_LABELS, memberLinkHref, memberLinkLabel, videoEmbed } from '../../modules/find/memberPageService'
import { PAGE_BACKGROUNDS, PAGE_COLORS, blockLinks, pageBlocks } from '../../modules/find/memberPageTemplates'
import type { MemberPageSkin } from '../../modules/find/memberPageTemplates'
import type { MemberPage, MemberPageBlock, MemberPageHighlight, MemberPageLink } from '../../modules/find/types'

interface Props {
  page: Pick<MemberPage, 'display_name' | 'headline' | 'bio' | 'photo_url' | 'location' | 'services' | 'highlights' | 'links' | 'language'> &
    Partial<Pick<MemberPage, 'blocks' | 'theme' | 'slug'>>
  skin: MemberPageSkin
  preview?: boolean
  onLinkClick?: (target: string) => void
}

// How each look dresses the same sections.
const LOOK: Record<MemberPageSkin, { page: string; band: string; h2: string; card: string; wide: string }> = {
  professional: {
    page: 'bg-white text-navy',
    band: 'bg-bg-soft',
    h2: 'font-display text-2xl font-bold tracking-tight text-navy md:text-3xl',
    card: 'rounded-xl border border-navy/10 bg-white',
    wide: 'max-w-5xl',
  },
  local: {
    page: 'bg-white text-navy',
    band: 'bg-bg-soft',
    h2: 'font-display text-2xl font-bold tracking-tight text-navy md:text-3xl',
    card: 'rounded-2xl border border-navy/[0.08] bg-white shadow-softer',
    wide: 'max-w-6xl',
  },
  creative: {
    page: 'bg-[color:var(--color-paper)] text-navy',
    band: 'bg-[color:var(--color-paper)]',
    h2: 'font-display text-3xl font-bold uppercase tracking-tight text-navy md:text-5xl',
    card: 'border-t border-navy/15',
    wide: 'max-w-6xl',
  },
  affiliate: {
    page: 'bg-white text-navy',
    band: 'bg-white',
    h2: 'font-display text-2xl font-bold tracking-tight text-navy md:text-3xl',
    card: 'rounded-2xl border border-navy/[0.08] bg-white shadow-softer',
    wide: 'max-w-6xl',
  },
  // Empresas: the same card-first look as the affiliate showcase.
  business: {
    page: 'bg-white text-navy',
    band: 'bg-bg-soft',
    h2: 'font-display text-2xl font-bold tracking-tight text-navy md:text-3xl',
    card: 'rounded-2xl border border-navy/[0.08] bg-white shadow-softer',
    wide: 'max-w-6xl',
  },
  personal: {
    page: 'bg-white text-navy',
    band: 'bg-primary/[0.06]',
    h2: 'font-display text-2xl font-bold tracking-tight text-navy md:text-4xl',
    card: 'rounded-3xl bg-white shadow-softer',
    wide: 'max-w-5xl',
  },
  // Link Page: one narrow column, phone first.
  links: {
    page: 'bg-bg-soft text-navy',
    band: '',
    h2: 'text-center font-display text-xl font-bold tracking-tight text-navy',
    card: 'rounded-2xl bg-white shadow-softer',
    wide: 'max-w-xl',
  },
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

// A member's page in one of the four looks (Sprint 128: Professional, Local
// Services, Creative Portfolio, Personal Brand) — the same fields and
// blocks, laid out as a small professional website, phone first.
export default function MemberSiteView({ page, skin, preview = false, onLinkClick }: Props) {
  const t = MEMBER_PAGE_LABELS[page.language] ?? MEMBER_PAGE_LABELS.en
  const look = LOOK[skin]
  const color = PAGE_COLORS.find((c) => c.id === page.theme?.color)
  // The page's own background tint (any plan); none = the look's default.
  const background = PAGE_BACKGROUNDS.find((c) => c.id === page.theme?.background)
  const style = {
    ...(color ? { '--color-primary-rgb': color.rgb, '--color-primary-accent-rgb': color.rgb, '--color-primary': `rgb(${color.rgb})`, '--color-primary-accent': `rgb(${color.rgb})` } : {}),
    ...(background ? { backgroundColor: background.hex } : {}),
  } as CSSProperties
  const [primary, secondary] = page.links
  const blocks = pageBlocks(page).filter((b) => !b.hidden)

  const linkProps = (type: string, url: string, target: string) =>
    preview
      ? { href: '#', onClick: (e: MouseEvent) => e.preventDefault() }
      : { href: memberLinkHref(type, url), target: '_blank', rel: 'noreferrer', onClick: () => onLinkClick?.(target) }

  const button = (link: MemberPageLink, kind: 'solid' | 'outline' | 'light', label?: string) => {
    const Icon = MEMBER_LINK_ICONS[link.type] ?? Link2
    const cls =
      kind === 'solid'
        ? 'bg-primary text-white hover:bg-primary/90'
        : kind === 'light'
          ? 'bg-white text-primary hover:opacity-90'
          : skin === 'local'
            ? 'border border-navy/15 bg-white text-navy hover:border-primary/40'
            : 'border border-navy/15 bg-white/70 text-navy hover:border-primary/40'
    return (
      <a
        key={link.type + link.url}
        {...linkProps(link.type, link.url, `link:${link.type}`)}
        className={`inline-flex items-center justify-center gap-2 px-5 py-3 text-[15px] font-semibold transition-colors ${skin === 'creative' ? 'rounded-none uppercase tracking-wide' : 'rounded-xl'} ${cls}`}
      >
        <Icon size={17} aria-hidden /> {label ?? memberLinkLabel(link, page.language)}
      </a>
    )
  }

  // With a chosen background the alternate bands become a light shade of it.
  const bandClass = background ? 'bg-navy/[0.025]' : look.band
  const section = (key: string, children: ReactNode, band = false) => (
    <section key={key} className={band && bandClass ? bandClass : undefined}>
      <div className={`mx-auto ${look.wide} px-5 ${skin === 'links' ? 'py-6' : 'py-14 md:py-20'}`}>{children}</div>
    </section>
  )

  const photo = (cls: string) =>
    page.photo_url ? (
      <img src={page.photo_url} alt={page.display_name} className={`object-cover ${cls}`} />
    ) : (
      <span className={`grid place-items-center bg-grad-primary font-display text-5xl font-bold text-white ${cls}`}>{initials(page.display_name)}</span>
    )

  function hero() {
    const name = page.display_name
    const headline = page.headline
    const location = page.location && (
      <p className="inline-flex items-center gap-1.5 text-[14px] opacity-70">
        <MapPin size={15} aria-hidden /> {page.location}
      </p>
    )
    const buttons = (light = false) =>
      primary ? (
        <div className="mt-7 flex flex-wrap gap-3">
          {button(primary, light ? 'solid' : 'solid')}
          {secondary && button(secondary, 'outline')}
        </div>
      ) : null

    if (skin === 'local') {
      const bg = page.theme?.cover || page.photo_url
      return (
        <section key="hero" className="relative overflow-hidden bg-navy text-white">
          {bg && <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${bg})` }} aria-hidden />}
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-navy/30" aria-hidden />
          <div className={`relative mx-auto grid ${look.wide} gap-10 px-5 py-16 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-center md:py-24`}>
            <div>
              {location}
              <h1 className="mt-3 font-display text-4xl font-bold leading-tight md:text-6xl">{headline || name}</h1>
              {headline && <p className="mt-4 text-[17px] text-white/80">{name}</p>}
              {buttons(true)}
            </div>
            {page.links.length > 0 && (
              <div className="rounded-2xl bg-white p-6 text-navy shadow-softer">
                <p className="font-display text-xl font-bold">{t.contact}</p>
                <div className="mt-4 grid gap-2">{page.links.slice(0, 5).map((l, i) => button(l, i === 0 ? 'solid' : 'outline'))}</div>
              </div>
            )}
          </div>
        </section>
      )
    }

    if (skin === 'creative') {
      return (
        <section key="hero">
          <div className={`mx-auto ${look.wide} px-5 pb-10 pt-14 md:pt-20`}>
            <div className="grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-end">
              <h1 className="font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight md:text-8xl">{name}</h1>
              <div className="space-y-3 text-[13px] font-semibold uppercase tracking-wide text-navy/70 md:text-right">
                {headline && <p>{headline}</p>}
                {location}
              </div>
            </div>
            {page.photo_url && <img src={page.photo_url} alt={name} className="mt-10 aspect-[16/9] w-full object-cover" />}
            {buttons()}
          </div>
        </section>
      )
    }

    if (skin === 'affiliate' || skin === 'business') {
      const heroData = blocks.find((b) => b.type === 'hero')?.data ?? {}
      const art = page.theme?.cover || page.photo_url
      return (
        <div key="hero">
          <header className="border-b border-navy/[0.06] bg-white">
            <div className={`mx-auto flex ${look.wide} items-center gap-3 px-5 py-3`}>
              {photo('h-10 w-10 shrink-0 rounded-full !text-sm')}
              <div className="min-w-0">
                <p className="truncate font-display text-[15px] font-bold leading-tight">{name}</p>
                {page.location && <p className="truncate text-[12px] text-navy/55">{page.location}</p>}
              </div>
            </div>
          </header>
          <section className="relative overflow-hidden bg-gradient-to-br from-primary/[0.08] via-white to-primary/[0.04]">
            {art && (
              <div className="absolute inset-y-0 right-0 hidden w-1/2 md:block" aria-hidden>
                <img src={art} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/30 to-transparent" />
              </div>
            )}
            {art && (
              <div className="relative h-48 md:hidden" aria-hidden>
                <img src={art} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
              </div>
            )}
            <div className={`relative mx-auto ${look.wide} px-5 pb-12 pt-6 md:py-20`}>
              <div className="md:max-w-[52%]">
                {heroData.title && <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-primary">{heroData.title}</p>}
                <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">{headline || name}</h1>
                {heroData.body && <p className="mt-4 text-[16.5px] leading-relaxed text-navy/70">{heroData.body}</p>}
                <a
                  href="#picks"
                  onClick={(e) => {
                    e.preventDefault()
                    ;(e.currentTarget.ownerDocument.getElementById('picks') ?? null)?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-[15px] font-semibold text-white hover:bg-primary/90"
                >
                  {heroData.button || t.seePicks} <ArrowRight size={17} aria-hidden />
                </a>
              </div>
            </div>
          </section>
        </div>
      )
    }

    if (skin === 'links') {
      return (
        <section key="hero">
          <div className={`mx-auto ${look.wide} px-5 pb-2 pt-12 text-center md:pt-16`}>
            {photo('mx-auto h-28 w-28 rounded-full border-4 border-white shadow-softer !text-3xl')}
            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight md:text-4xl">{name}</h1>
            {headline && <p className="mt-2 text-[16.5px] leading-relaxed text-navy/65">{headline}</p>}
            {page.location && <div className="mt-2 flex justify-center">{location}</div>}
          </div>
        </section>
      )
    }

    if (skin === 'personal') {
      return (
        <section key="hero">
          <div className={`mx-auto grid ${look.wide} gap-10 px-5 py-14 md:grid-cols-2 md:items-center md:py-20`}>
            <div>
              {location}
              <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">{headline || name}</h1>
              {headline && <p className="mt-4 text-[17px] text-navy/60">{name}</p>}
              {buttons()}
            </div>
            <div className="rounded-[2rem] bg-gradient-to-br from-primary/25 to-primary/5 p-3">{photo('aspect-[4/5] w-full rounded-[1.6rem]')}</div>
          </div>
        </section>
      )
    }

    // professional
    return (
      <section key="hero" className="border-b border-navy/[0.06]">
        <div className={`mx-auto grid ${look.wide} gap-12 px-5 py-14 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center md:py-24`}>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-primary">{page.location || ' '}</p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">{name}</h1>
            {headline && <p className="mt-4 text-[19px] leading-relaxed text-navy/65">{headline}</p>}
            {buttons()}
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -right-3 -top-3 h-full w-full rounded-xl bg-primary/15" aria-hidden />
            {photo('relative aspect-square w-full rounded-xl')}
          </div>
        </div>
      </section>
    )
  }

  function highlightCard(h: MemberPageHighlight, i: number) {
    const video = h.video ? videoEmbed(h.video) : null
    const media = video ? (
      <div className={`mx-auto bg-navy ${video.vertical ? 'aspect-[9/16] max-h-[560px] w-full max-w-[315px]' : 'aspect-video w-full'}`}>
        <iframe src={video.src} title={h.title} className="h-full w-full" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" />
      </div>
    ) : h.image ? (
      <img src={h.image} alt="" className={`w-full object-cover ${skin === 'creative' ? 'aspect-[4/3]' : 'aspect-video'}`} />
    ) : null
    return (
      <div key={h.title + i} className={`flex h-full flex-col overflow-hidden ${skin === 'creative' ? '' : look.card}`}>
        {media}
        <div className={`flex flex-1 flex-col ${skin === 'creative' ? 'pt-3' : 'p-5'}`}>
          <p className={`font-semibold text-navy ${skin === 'creative' ? 'text-[13px] uppercase tracking-wide' : 'text-[17px]'}`}>{h.title}</p>
          {h.description && <p className="mt-1 text-[14.5px] leading-relaxed text-navy/60">{h.description}</p>}
          {h.url && (
            // mt-auto: in a row of cards, every button lines up at the bottom.
            <a {...linkProps('website', h.url, `featured:${h.title}`)} className="mt-auto inline-flex items-center gap-1.5 self-start pt-3 text-[14.5px] font-semibold text-primary hover:underline">
              {h.cta?.trim() || t.learnMore} <ArrowRight size={16} aria-hidden />
            </a>
          )}
        </div>
      </div>
    )
  }

  function render(block: MemberPageBlock, index: number) {
    const d = block.data ?? {}
    const band = index % 2 === 1
    switch (block.type) {
      case 'hero':
        return hero()
      case 'contact': {
        // This block's own buttons, so a page can carry several blocks of
        // them, wherever the member put them (27/10/2026).
        const links = blockLinks(page, block)
        if (!links.length) return null
        // Link Page: one full-width button per link, in the order chosen.
        if (skin === 'links') {
          return section(
            block.id,
            <div className="flex flex-col gap-3">
              {links.map((l) => {
                const Icon = MEMBER_LINK_ICONS[l.type] ?? Link2
                return (
                  <a
                    key={l.type + l.url}
                    {...linkProps(l.type, l.url, `link:${l.type}`)}
                    className="flex min-h-[52px] items-center gap-3 rounded-2xl bg-primary px-5 py-3 text-[15.5px] font-semibold text-white shadow-softer transition-colors hover:bg-primary/90"
                  >
                    <Icon size={19} className="shrink-0" aria-hidden />
                    <span className="flex-1 text-center">{memberLinkLabel(l, page.language)}</span>
                    <span className="w-[19px] shrink-0" aria-hidden />
                  </a>
                )
              })}
            </div>,
          )
        }
        return section(
          block.id,
          <div className="text-center">
            <h2 className={look.h2}>{t.contact}</h2>
            <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">{links.map((l, i) => button(l, i === 0 ? 'solid' : 'outline'))}</div>
          </div>,
          band,
        )
      }
      case 'highlights':
        if (!page.highlights.length) return null
        return section(
          block.id,
          <>
            <h2 className={look.h2}>{t.highlights}</h2>
            <div className={`mt-8 grid gap-6 ${page.highlights.length > 1 ? 'md:grid-cols-2' : 'mx-auto max-w-2xl'}`}>{page.highlights.map(highlightCard)}</div>
          </>,
          band,
        )
      case 'services':
        if (!page.services.length) return null
        return section(
          block.id,
          <>
            <h2 className={look.h2}>{t.services}</h2>
            {skin === 'creative' ? (
              <ul className="mt-8">
                {page.services.map((s, i) => (
                  <li key={s.title} className="grid grid-cols-[3rem_minmax(0,1fr)_auto] gap-4 border-t border-navy/15 py-5">
                    <span className="font-display text-xl font-bold text-navy/30">{String(i + 1).padStart(2, '0')}</span>
                    <span>
                      {s.image && <img src={s.image} alt="" className="mb-3 aspect-video w-full max-w-xs rounded-lg object-cover" />}
                      <span className="block font-semibold uppercase tracking-wide">{s.title}</span>
                      {s.description && <span className="mt-1 block text-[14px] text-navy/60">{s.description}</span>}
                      {s.url && (
                        <a {...linkProps('website', s.url, `service:${s.title}`)} className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-primary hover:underline">
                          {s.cta?.trim() || t.learnMore} <ArrowRight size={14} aria-hidden />
                        </a>
                      )}
                    </span>
                    {s.price && <span className="font-semibold">{s.price}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <div className={`mt-8 grid gap-4 ${skin === 'professional' ? 'md:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                {page.services.map((s, i) => (
                  // Same height in a row; each card's own button sits at the bottom
                  // and opens that service's own address.
                  <div key={s.title + i} className={`flex h-full flex-col overflow-hidden ${look.card} ${skin === 'personal' && i === 1 ? 'bg-gradient-to-br from-primary/20 to-primary/5' : ''}`}>
                    {s.image && <img src={s.image} alt="" className="aspect-video w-full object-cover" />}
                    <div className="flex flex-1 flex-col p-6">
                      {skin === 'local' && <span className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-primary/10 font-display font-bold text-primary">{i + 1}</span>}
                      <p className="text-[17px] font-semibold text-navy">{s.title}</p>
                      {s.description && <p className="mt-2 text-[14.5px] leading-relaxed text-navy/60">{s.description}</p>}
                      {s.price && <p className="mt-4 font-display text-lg font-bold text-primary">{s.price}</p>}
                      {s.url && (
                        <div className="mt-auto pt-5">
                          <a
                            {...linkProps('website', s.url, `service:${s.title}`)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-[14.5px] font-semibold text-white transition-colors hover:bg-primary/90"
                          >
                            {s.cta?.trim() || t.learnMore} <ArrowRight size={16} aria-hidden />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>,
          band,
        )
      case 'about':
      case 'text': {
        const title = block.type === 'about' ? d.title || t.about : d.title
        const body = block.type === 'about' ? page.bio : d.body
        if (!body?.trim() && !title?.trim()) return null
        if (block.type === 'about' && !page.bio) return null
        return section(
          block.id,
          <div
            className={`grid ${
              skin === 'links'
                ? 'gap-3 rounded-2xl bg-white p-6 text-center shadow-softer'
                : `gap-8 ${skin === 'personal' && block.type === 'about' && page.photo_url ? 'md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-center' : 'md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]'}`
            }`}
          >
            {skin === 'personal' && block.type === 'about' && page.photo_url ? photo('hidden aspect-square w-full rounded-3xl md:grid') : title ? <h2 className={look.h2}>{title}</h2> : <span />}
            <div>
              {skin === 'personal' && block.type === 'about' && page.photo_url && title && <h2 className={`${look.h2} mb-4`}>{title}</h2>}
              {body && <p className="whitespace-pre-line text-[16px] leading-relaxed text-navy/70">{body}</p>}
            </div>
          </div>,
          band,
        )
      }
      case 'testimonials': {
        const items = (d.items ?? []).filter((i) => i.title.trim())
        if (!items.length) return null
        return section(
          block.id,
          <>
            {d.title && <h2 className={`${look.h2} ${skin === 'creative' ? '' : 'text-center'}`}>{d.title}</h2>}
            <div className={`mt-8 grid gap-4 ${items.length > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : 'mx-auto max-w-2xl'}`}>
              {items.map((item, i) => (
                <figure key={i} className={`${look.card} p-6`}>
                  <Quote size={20} className="text-primary" aria-hidden />
                  <blockquote className="mt-3 text-[15.5px] leading-relaxed text-navy/75">{item.title}</blockquote>
                  {item.body && <figcaption className="mt-3 text-[13.5px] font-semibold text-navy/55">— {item.body}</figcaption>}
                </figure>
              ))}
            </div>
          </>,
          band,
        )
      }
      case 'gallery': {
        const images = (d.images ?? []).filter(Boolean)
        if (!images.length) return null
        return section(
          block.id,
          <>
            {d.title && <h2 className={look.h2}>{d.title}</h2>}
            <div className={`mt-8 grid grid-cols-2 gap-3 ${skin === 'creative' ? 'md:grid-cols-2 md:gap-6' : 'md:grid-cols-3'}`}>
              {images.map((src, i) => (
                <img key={i} src={src} alt="" loading="lazy" className={`w-full object-cover ${skin === 'creative' ? (i % 3 === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-[4/3]') : 'aspect-square rounded-xl'}`} />
              ))}
            </div>
          </>,
          band,
        )
      }
      case 'area': {
        if (!d.title?.trim() && !d.body?.trim()) return null
        const places = (d.body ?? '').split(/\s*[·,;\n]\s*/).filter(Boolean)
        return section(
          block.id,
          <div className="text-center">
            {d.title && <h2 className={look.h2}>{d.title}</h2>}
            <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
              {places.map((p) => (
                <span key={p} className="inline-flex items-center gap-1.5 rounded-full border border-navy/10 bg-white px-4 py-2 text-[14px] font-medium text-navy/75">
                  <MapPin size={14} className="text-primary" aria-hidden /> {p}
                </span>
              ))}
            </div>
          </div>,
          band,
        )
      }
      case 'faq': {
        const items = (d.items ?? []).filter((i) => i.title.trim())
        if (!items.length) return null
        return section(
          block.id,
          <div className="mx-auto max-w-3xl">
            {d.title && <h2 className={`${look.h2} text-center`}>{d.title}</h2>}
            <div className="mt-8 divide-y divide-navy/[0.08] overflow-hidden rounded-2xl border border-navy/[0.08] bg-white">
              {items.map((item, i) => (
                <details key={i} className="px-5 py-4">
                  <summary className="cursor-pointer list-none font-semibold text-navy">{item.title}</summary>
                  {item.body && <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed text-navy/60">{item.body}</p>}
                </details>
              ))}
            </div>
          </div>,
          band,
        )
      }
      case 'credentials': {
        const items = (d.items ?? []).filter((i) => i.title.trim())
        if (!items.length) return null
        return section(
          block.id,
          <>
            <h2 className={look.h2}>{d.title || t.credentials}</h2>
            <ul className="mt-8 grid gap-3 md:grid-cols-2">
              {items.map((item, i) => (
                <li key={i} className={`${look.card} flex gap-3 p-5`}>
                  <BadgeCheck size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                  <span>
                    <span className="block font-semibold text-navy">{item.title}</span>
                    {item.body && <span className="mt-1 block text-[14px] text-navy/60">{item.body}</span>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[12.5px] text-navy/45">{t.credentialsNote}</p>
          </>,
          band,
        )
      }
      case 'signup':
        return section(
          block.id,
          <MemberPageSignupForm slug={page.slug} ownerName={page.display_name} title={d.title} body={d.body} button={d.button} language={page.language} preview={preview} headingClass={look.h2} />,
          band,
        )
      case 'products':
        if (!(d.products ?? []).length) return null
        return section(
          block.id,
          <MemberProductPicks products={d.products ?? []} title={d.title} note={d.body} hideNote={d.hideNote === true} kind={skin === 'business' ? 'own' : 'affiliate'} language={page.language} preview={preview} onLinkClick={onLinkClick} headingClass={look.h2} />,
        )
      case 'cta': {
        if (!d.title?.trim() && !d.body?.trim()) return null
        return (
          <section key={block.id}>
            <div className={`mx-auto ${look.wide} px-5 py-14`}>
              <div
                className={`px-6 py-12 text-center md:px-12 md:py-16 ${
                  skin === 'personal'
                    ? 'rounded-[2rem] bg-gradient-to-br from-primary/25 to-primary/5 text-navy'
                    : skin === 'creative'
                      ? 'border-y border-navy/20 text-navy'
                      : `${skin === 'local' ? 'rounded-2xl' : 'rounded-xl'} bg-primary text-white`
                }`}
              >
                {d.title && <h2 className={`font-display text-3xl font-bold tracking-tight md:text-4xl ${skin === 'creative' ? 'uppercase' : ''}`}>{d.title}</h2>}
                {d.body && <p className={`mx-auto mt-3 max-w-xl text-[16px] leading-relaxed ${skin === 'personal' || skin === 'creative' ? 'text-navy/65' : 'text-white/85'}`}>{d.body}</p>}
                {primary && <div className="mt-7 flex justify-center">{button(primary, skin === 'personal' || skin === 'creative' ? 'solid' : 'light', d.button?.trim() || undefined)}</div>}
              </div>
            </div>
          </section>
        )
      }
      default:
        return null
    }
  }

  return (
    <div style={style} className={`min-h-full w-full ${look.page}`}>
      {blocks.map((block, i) => render(block, i))}
      <footer className="border-t border-navy/[0.06]">
        <div className={`mx-auto ${look.wide} px-5 py-8 text-center`}>
          <p className="text-[12px] text-navy/40">{t.disclaimer}</p>
          {!preview && <MemberPagePromo language={page.language} />}
          <a
            href={preview ? '#' : '/'}
            onClick={preview ? (e) => e.preventDefault() : undefined}
            translate="no"
            className="notranslate mt-2 inline-block text-[12.5px] font-medium text-navy/35 hover:text-navy/60"
          >
            {t.madeWith}
          </a>
        </div>
      </footer>
    </div>
  )
}
