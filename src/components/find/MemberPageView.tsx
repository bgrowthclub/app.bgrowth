import { ArrowRight, Link2, MapPin, Quote } from 'lucide-react'
import { MEMBER_LINK_ICONS } from './memberLinkIcons'
import MemberSiteView from './MemberSiteView'
import MemberProductPicks from './MemberProductPicks'
import MemberPageSignupForm from './MemberPageSignupForm'
import MemberPagePromo from './MemberPagePromo'
import type { CSSProperties } from 'react'
import { MEMBER_PAGE_LABELS, memberLinkHref, memberLinkLabel, videoEmbed } from '../../modules/find/memberPageService'
import { PAGE_BACKGROUNDS, PAGE_COLORS, pageBlocks, pageSkin } from '../../modules/find/memberPageTemplates'
import type { MemberPage, MemberPageBlock } from '../../modules/find/types'

const ICONS = MEMBER_LINK_ICONS

interface Props {
  page: Pick<MemberPage, 'display_name' | 'headline' | 'bio' | 'photo_url' | 'location' | 'services' | 'highlights' | 'links' | 'language'> &
    Partial<Pick<MemberPage, 'blocks' | 'theme' | 'template' | 'slug'>>
  // Admin preview: links don't navigate.
  preview?: boolean
  // Called when a visitor opens a contact button or featured item, with
  // 'link:<type>' or 'featured:<title>' — the page's click numbers.
  onLinkClick?: (target: string) => void
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

// A member's own page (BGrowth Find™): the person first, then what they
// offer and how to reach them. Shared by /p/:slug, the Admin preview and the
// subscriber's editor. Since Sprint 127 it draws the page's blocks in order
// (hidden and empty ones skipped) in the page's color; a page without blocks
// keeps the original layout (top, contacts, featured, services, about).
export default function MemberPageView({ page, preview = false, onLinkClick }: Props) {
  // The four models (Sprint 128) have their own full-width looks.
  const skin = pageSkin(page.template)
  if (skin) return <MemberSiteView page={page} skin={skin} preview={preview} onLinkClick={onLinkClick} />
  const t = MEMBER_PAGE_LABELS[page.language] ?? MEMBER_PAGE_LABELS.en
  const [primary, ...others] = page.links
  const linkProps = (type: string, url: string, target: string) =>
    preview
      ? { href: '#', onClick: (e: React.MouseEvent) => e.preventDefault() }
      : { href: memberLinkHref(type, url), target: '_blank', rel: 'noreferrer', onClick: () => onLinkClick?.(target) }

  const color = PAGE_COLORS.find((c) => c.id === page.theme?.color)
  const background = PAGE_BACKGROUNDS.find((c) => c.id === page.theme?.background)
  const style = {
    ...(color ? { '--color-primary-rgb': color.rgb, '--color-primary-accent-rgb': color.rgb, '--color-primary': `rgb(${color.rgb})`, '--color-primary-accent': `rgb(${color.rgb})` } : {}),
    ...(background ? { backgroundColor: background.hex } : {}),
  } as CSSProperties
  const cover = page.theme?.cover

  function renderBlock(block: MemberPageBlock) {
    const d = block.data ?? {}
    switch (block.type) {
      case 'hero':
        return (
      <header className="flex flex-col items-center text-center">
        {page.photo_url ? (
          <img src={page.photo_url} alt={page.display_name} className="h-28 w-28 rounded-full object-cover shadow-softer ring-4 ring-white" />
        ) : (
          <span className="grid h-28 w-28 place-items-center rounded-full bg-grad-primary font-display text-3xl font-bold text-white">
            {initials(page.display_name)}
          </span>
        )}
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-navy">{page.display_name}</h1>
        {page.headline && <p className="mt-2 text-[16px] leading-relaxed text-navy/65">{page.headline}</p>}
        {page.location && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[14px] text-navy/50">
            <MapPin size={15} aria-hidden /> {page.location}
          </p>
        )}
      </header>
        )
      case 'contact':
        return page.links.length > 0 ? (
        <section aria-label={t.contact} className="mt-8 space-y-3">
          {primary && (
            <a
              {...linkProps(primary.type, primary.url, `link:${primary.type}`)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-[16px] font-semibold text-white shadow-softer transition-colors hover:bg-primary/90"
            >
              {(() => {
                const Icon = ICONS[primary.type] ?? Link2
                return <Icon size={19} aria-hidden />
              })()}
              {memberLinkLabel(primary, page.language)}
            </a>
          )}
          {others.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {others.map((link) => {
                const Icon = ICONS[link.type] ?? Link2
                return (
                  <a
                    key={link.label + link.url}
                    {...linkProps(link.type, link.url, `link:${link.type}`)}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-navy/10 bg-white px-4 py-3.5 text-[14.5px] font-semibold text-navy transition-colors hover:border-primary/30"
                  >
                    <Icon size={17} aria-hidden /> {memberLinkLabel(link, page.language)}
                  </a>
                )
              })}
            </div>
          )}
        </section>
      ) : null
      case 'highlights':
        return page.highlights.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold text-navy">{t.highlights}</h2>
          <div className="mt-3 space-y-3">
            {page.highlights.map((h) => {
              const video = h.video ? videoEmbed(h.video) : null
              if (video) {
                // A video plays in place, so the card isn't a link itself.
                return (
                  <div key={h.title} className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-white shadow-softer">
                    <div className={`mx-auto bg-navy ${video.vertical ? 'aspect-[9/16] max-h-[560px] max-w-[315px]' : 'aspect-video w-full'}`}>
                      <iframe
                        src={video.src}
                        title={h.title}
                        className="h-full w-full"
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-navy">{h.title}</p>
                      {h.description && <p className="mt-1 text-[14px] leading-relaxed text-navy/60">{h.description}</p>}
                      {h.url && (
                        <a
                          {...linkProps('website', h.url, `featured:${h.title}`)}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-[14.5px] font-semibold text-white transition-colors hover:bg-primary/90"
                        >
                          {h.cta?.trim() || t.learnMore} <ArrowRight size={16} aria-hidden />
                        </a>
                      )}
                    </div>
                  </div>
                )
              }
              const body = (
                <>
                  {h.image && <img src={h.image} alt="" className="h-40 w-full object-cover" />}
                  <div className="p-4">
                    <p className="font-semibold text-navy">{h.title}</p>
                    {h.description && <p className="mt-1 text-[14px] leading-relaxed text-navy/60">{h.description}</p>}
                    {h.url && (
                      <span className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-[14.5px] font-semibold text-white">
                        {h.cta?.trim() || t.learnMore} <ArrowRight size={16} aria-hidden />
                      </span>
                    )}
                  </div>
                </>
              )
              const cls = 'block overflow-hidden rounded-2xl border border-navy/[0.08] bg-white shadow-softer'
              return h.url ? (
                <a key={h.title} {...linkProps('website', h.url, `featured:${h.title}`)} className={`${cls} transition-colors hover:border-primary/30`}>
                  {body}
                </a>
              ) : (
                <div key={h.title} className={cls}>
                  {body}
                </div>
              )
            })}
          </div>
        </section>
      ) : null
      case 'services':
        return page.services.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold text-navy">{t.services}</h2>
          <ul className="mt-3 divide-y divide-navy/[0.06] overflow-hidden rounded-2xl border border-navy/[0.08] bg-white">
            {page.services.map((s, i) => (
              <li key={s.title + i} className="flex items-start gap-3 px-4 py-3.5">
                {s.image && <img src={s.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />}
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-navy">{s.title}</span>
                  {s.description && <span className="block text-[14px] text-navy/55">{s.description}</span>}
                  {s.url && (
                    <a {...linkProps('website', s.url, `service:${s.title}`)} className="mt-1.5 inline-flex items-center gap-1 text-[13.5px] font-semibold text-primary hover:underline">
                      {s.cta?.trim() || t.learnMore} <ArrowRight size={14} aria-hidden />
                    </a>
                  )}
                </span>
                {s.price && <span className="shrink-0 font-semibold text-navy">{s.price}</span>}
              </li>
            ))}
          </ul>
        </section>
      ) : null
      case 'about':
        return page.bio ? (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold text-navy">{t.about}</h2>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-navy/70">{page.bio}</p>
        </section>
      ) : null
      case 'testimonials': {
        const items = (d.items ?? []).filter((i) => i.title.trim())
        if (!items.length) return null
        return (
          <section className="mt-10">
            {d.title && <h2 className="font-display text-lg font-bold text-navy">{d.title}</h2>}
            <div className="mt-3 space-y-3">
              {items.map((item, i) => (
                <figure key={i} className="rounded-2xl border border-navy/[0.08] bg-white p-4 shadow-softer">
                  <Quote size={18} className="text-primary" aria-hidden />
                  <blockquote className="mt-2 text-[15px] leading-relaxed text-navy/75">{item.title}</blockquote>
                  {item.body && <figcaption className="mt-2 text-[13px] font-semibold text-navy/50">— {item.body}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )
      }
      case 'gallery': {
        const images = (d.images ?? []).filter(Boolean)
        if (!images.length) return null
        return (
          <section className="mt-10">
            {d.title && <h2 className="font-display text-lg font-bold text-navy">{d.title}</h2>}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {images.map((src, i) => (
                <img key={i} src={src} alt="" loading="lazy" className="aspect-square w-full rounded-xl object-cover" />
              ))}
            </div>
          </section>
        )
      }
      case 'text':
      case 'area':
        if (!d.title?.trim() && !d.body?.trim()) return null
        return (
          <section className="mt-10">
            {d.title && (
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy">
                {block.type === 'area' && <MapPin size={18} className="text-primary" aria-hidden />}
                {d.title}
              </h2>
            )}
            {d.body && <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-navy/70">{d.body}</p>}
          </section>
        )
      case 'faq': {
        const items = (d.items ?? []).filter((i) => i.title.trim())
        if (!items.length) return null
        return (
          <section className="mt-10">
            {d.title && <h2 className="font-display text-lg font-bold text-navy">{d.title}</h2>}
            <div className="mt-3 divide-y divide-navy/[0.06] overflow-hidden rounded-2xl border border-navy/[0.08] bg-white">
              {items.map((item, i) => (
                <details key={i} className="group px-4 py-3.5">
                  <summary className="cursor-pointer list-none font-semibold text-navy">{item.title}</summary>
                  {item.body && <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-navy/60">{item.body}</p>}
                </details>
              ))}
            </div>
          </section>
        )
      }
      case 'signup':
        return (
          <section className="mt-10">
            <MemberPageSignupForm slug={page.slug} ownerName={page.display_name} title={d.title} body={d.body} button={d.button} language={page.language} preview={preview} headingClass="font-display text-xl font-bold text-navy" />
          </section>
        )
      case 'products':
        if (!(d.products ?? []).length) return null
        return (
          <section className="mt-10">
            <MemberProductPicks products={d.products ?? []} title={d.title} note={d.body} hideNote={d.hideNote === true} language={page.language} preview={preview} onLinkClick={onLinkClick} headingClass="font-display text-xl font-bold text-navy" />
          </section>
        )
      case 'cta': {
        if (!d.title?.trim() && !d.body?.trim()) return null
        return (
          <section className="mt-10 rounded-2xl bg-primary px-6 py-8 text-center text-white">
            {d.title && <h2 className="font-display text-xl font-bold">{d.title}</h2>}
            {d.body && <p className="mt-2 text-[15px] leading-relaxed text-white/85">{d.body}</p>}
            {primary && (
              <a
                {...linkProps(primary.type, primary.url, `link:${primary.type}`)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[15px] font-semibold text-primary transition-opacity hover:opacity-90"
              >
                {d.button?.trim() || memberLinkLabel(primary, page.language)} <ArrowRight size={16} aria-hidden />
              </a>
            )}
          </section>
        )
      }
      default:
        return null
    }
  }

  return (
    <div style={style} className="w-full">
      {cover && <div className="h-40 w-full bg-cover bg-center sm:h-52" style={{ backgroundImage: `url(${cover})` }} aria-hidden />}
      <div className={`mx-auto w-full max-w-xl px-5 ${cover ? 'pb-12' : 'py-12'}`}>
        {pageBlocks(page)
          .filter((block) => !block.hidden)
          .map((block) => {
            const node = renderBlock(block)
            return node ? (
              <div key={block.id} className={block.type === 'hero' && cover ? '-mt-14' : undefined}>
                {node}
              </div>
            ) : null
          })}

      <footer className="mt-14 text-center">
        {!preview && (
          <div className="mb-5">
            <MemberPagePromo language={page.language} />
          </div>
        )}
        <a
          href={preview ? '#' : '/'}
          onClick={preview ? (e) => e.preventDefault() : undefined}
          translate="no"
          className="notranslate text-[12.5px] font-medium text-navy/35 hover:text-navy/60"
        >
          {t.madeWith}
        </a>
      </footer>
      </div>
    </div>
  )
}
