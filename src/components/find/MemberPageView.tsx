import { Globe, Instagram, Link2, Mail, MapPin, MessageCircle, Music2, Youtube } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { MEMBER_PAGE_LABELS, memberLinkHref, memberLinkLabel } from '../../modules/find/memberPageService'
import type { MemberPage, MemberPageLinkType } from '../../modules/find/types'

const ICONS: Record<MemberPageLinkType, LucideIcon> = {
  whatsapp: MessageCircle,
  email: Mail,
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
  website: Globe,
  other: Link2,
}

interface Props {
  page: Pick<MemberPage, 'display_name' | 'headline' | 'bio' | 'photo_url' | 'location' | 'services' | 'highlights' | 'links' | 'language'>
  // Admin preview: links don't navigate.
  preview?: boolean
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
// offer and how to reach them. Shared by /p/:slug and the Admin preview.
export default function MemberPageView({ page, preview = false }: Props) {
  const t = MEMBER_PAGE_LABELS[page.language] ?? MEMBER_PAGE_LABELS.en
  const [primary, ...others] = page.links
  const linkProps = (type: string, url: string) =>
    preview ? { href: '#', onClick: (e: React.MouseEvent) => e.preventDefault() } : { href: memberLinkHref(type, url), target: '_blank', rel: 'noreferrer' }

  return (
    <div className="mx-auto w-full max-w-xl px-5 py-12">
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

      {page.links.length > 0 && (
        <section aria-label={t.contact} className="mt-8 space-y-3">
          {primary && (
            <a
              {...linkProps(primary.type, primary.url)}
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
                    {...linkProps(link.type, link.url)}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-navy/10 bg-white px-4 py-3.5 text-[14.5px] font-semibold text-navy transition-colors hover:border-primary/30"
                  >
                    <Icon size={17} aria-hidden /> {memberLinkLabel(link, page.language)}
                  </a>
                )
              })}
            </div>
          )}
        </section>
      )}

      {page.highlights.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold text-navy">{t.highlights}</h2>
          <div className="mt-3 space-y-3">
            {page.highlights.map((h) => {
              const body = (
                <>
                  {h.image && <img src={h.image} alt="" className="h-40 w-full object-cover" />}
                  <div className="p-4">
                    <p className="font-semibold text-navy">{h.title}</p>
                    {h.description && <p className="mt-1 text-[14px] leading-relaxed text-navy/60">{h.description}</p>}
                  </div>
                </>
              )
              const cls = 'block overflow-hidden rounded-2xl border border-navy/[0.08] bg-white shadow-softer'
              return h.url ? (
                <a key={h.title} {...linkProps('website', h.url)} className={`${cls} transition-colors hover:border-primary/30`}>
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
      )}

      {page.services.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold text-navy">{t.services}</h2>
          <ul className="mt-3 divide-y divide-navy/[0.06] overflow-hidden rounded-2xl border border-navy/[0.08] bg-white">
            {page.services.map((s) => (
              <li key={s.title} className="flex items-start justify-between gap-4 px-4 py-3.5">
                <span>
                  <span className="block font-semibold text-navy">{s.title}</span>
                  {s.description && <span className="block text-[14px] text-navy/55">{s.description}</span>}
                </span>
                {s.price && <span className="shrink-0 font-semibold text-navy">{s.price}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {page.bio && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold text-navy">{t.about}</h2>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-navy/70">{page.bio}</p>
        </section>
      )}

      <footer className="mt-14 text-center">
        <a href={preview ? '#' : '/'} onClick={preview ? (e) => e.preventDefault() : undefined} className="text-[12.5px] font-medium text-navy/35 hover:text-navy/60">
          {t.madeWith}
        </a>
      </footer>
    </div>
  )
}
