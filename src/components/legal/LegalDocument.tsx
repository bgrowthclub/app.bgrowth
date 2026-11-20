import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, FileDown, FileText, HelpCircle, Info, LifeBuoy, Link2, Lock, ReceiptText, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import SEO from '../seo/SEO'
import { LEGAL_DOCUMENTS, LEGAL_EMAIL, LEGAL_UPDATED } from '../../data/legal'
import type { LegalDocumentData, LegalEditableContent } from '../../data/legal'
import { getSiteContent } from '../../modules/site/siteService'

interface Props {
  document: LegalDocumentData
}

const PATHS: Record<LegalDocumentData['slug'], string> = {
  privacy: '/privacy',
  terms: '/terms',
  'refund-policy': '/refund-policy',
}

// The tabs' order and icons (the owner's design): Terms first.
const TABS: { slug: LegalDocumentData['slug']; icon: LucideIcon; short: string }[] = [
  { slug: 'terms', icon: FileText, short: 'Terms' },
  { slug: 'privacy', icon: Lock, short: 'Privacy' },
  { slug: 'refund-policy', icon: ReceiptText, short: 'Refunds' },
]

function sectionId(index: number, heading: string): string {
  const words = heading
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${index + 1}-${words || 'section'}`
}

// The Legal Hub (20/11/2026, the owner's design): one layout for Terms,
// Privacy and Refund, each still at its own address. Tabs across the three,
// "On this page" built from the section headings, Download PDF (the
// browser's print) and Copy link. The built-in text lives in data/legal.ts;
// a version edited in Admin → Site (portal.site_content, key legal:<slug>)
// replaces it, with its own "last updated" date — nothing else is dated.
export default function LegalDocument({ document: builtIn }: Props) {
  const [edited, setEdited] = useState<{ content: LegalEditableContent; updated: string } | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setEdited(null)
    getSiteContent<LegalEditableContent>(`legal:${builtIn.slug}`).then((row) => {
      if (!cancelled && row?.value?.sections?.length) setEdited({ content: row.value, updated: row.updated_at })
    })
    return () => {
      cancelled = true
    }
  }, [builtIn.slug])

  const document: LegalDocumentData = edited ? { ...builtIn, ...edited.content } : builtIn
  const updated = edited
    ? new Date(edited.updated).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : LEGAL_UPDATED
  const path = PATHS[document.slug]
  const sections = document.sections.map((s, i) => ({ ...s, id: sectionId(i, s.heading) }))
  const sectionKey = sections.map((s) => s.id).join('|')

  // Highlights the section being read in "On this page".
  useEffect(() => {
    const ids = sectionKey ? sectionKey.split('|') : []
    setActive(ids[0] ?? null)
    if (typeof IntersectionObserver === 'undefined' || !ids.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-120px 0px -60% 0px' },
    )
    ids.forEach((id) => {
      const el = window.document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sectionKey])

  // A link to a section (/terms#5-…) lands there once the text is drawn.
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1))
    if (hash) window.document.getElementById(hash)?.scrollIntoView()
  }, [sectionKey])

  async function copyLink(id?: string) {
    const url = `${window.location.origin}${path}${id ? `#${id}` : ''}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(id ?? 'page')
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  const actionClass =
    'flex w-full items-center gap-3 rounded-xl border border-navy/10 bg-white px-4 py-3 text-[14px] font-medium text-navy/80 transition-colors hover:border-primary/30 hover:text-navy'

  const actions = (
    <>
      <button type="button" onClick={() => window.print()} className={actionClass}>
        <FileDown size={18} className="text-navy/60" aria-hidden /> Download PDF
      </button>
      <button type="button" onClick={() => copyLink()} className={actionClass}>
        {copied === 'page' ? <Check size={18} className="text-emerald-600" aria-hidden /> : <Link2 size={18} className="text-navy/60" aria-hidden />}
        {copied === 'page' ? 'Link copied' : 'Copy link'}
      </button>
    </>
  )

  return (
    <>
      <SEO title={document.title} description={document.summary} path={path} />

      <div className="border-b border-navy/[0.06] bg-white/70 pt-24 md:pt-28 print:hidden">
        <div className="container-px mx-auto flex max-w-page flex-col gap-3 py-3 lg:flex-row lg:items-center lg:gap-10">
          <p className="flex shrink-0 items-center gap-2 font-display text-[17px] font-bold text-navy lg:w-56">
            <ShieldCheck size={20} className="text-navy/70" aria-hidden /> Legal Hub
          </p>
          <nav aria-label="Legal pages" className="-mx-1 flex overflow-x-auto px-1">
            <div className="flex min-w-max rounded-xl border border-navy/10 bg-white">
              {TABS.map(({ slug, icon: Icon, short }) => {
                const d = LEGAL_DOCUMENTS.find((x) => x.slug === slug)
                if (!d) return null
                const current = slug === document.slug
                return (
                  <Link
                    key={slug}
                    to={PATHS[slug]}
                    aria-current={current ? 'page' : undefined}
                    className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[14px] font-semibold transition-colors sm:px-7 ${
                      current ? 'border-primary text-primary' : 'border-transparent text-navy/60 hover:text-navy'
                    } ${slug !== 'terms' ? 'border-l border-l-navy/10' : ''}`}
                  >
                    <Icon size={16} aria-hidden /> <span className="sm:hidden">{short}</span>
                    <span className="hidden sm:inline">{d.title}</span>
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>
      </div>

      <div className="container-px mx-auto grid max-w-page grid-cols-1 gap-10 pb-16 pt-8 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_14rem]">
        <aside className="hidden lg:block print:hidden">
          <div className="sticky top-28">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-navy/45">On this page</p>
            <ol className="mt-4 space-y-1 border-l border-navy/[0.08]">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`-ml-px block border-l-2 py-1.5 pl-4 text-[13.5px] leading-snug transition-colors ${
                      active === s.id ? 'border-primary font-semibold text-primary' : 'border-transparent text-navy/60 hover:text-navy'
                    }`}
                  >
                    {i + 1}. {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <article className="min-w-0">
          <p className="text-[13.5px] text-navy/50 print:hidden">
            <span className="text-primary">Legal</span> <span aria-hidden>/</span> {document.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-[34px] font-bold tracking-tight text-navy md:text-[44px]">{document.title}</h1>
            <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[12.5px] font-medium text-primary">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden /> Current version · Last updated {updated}
            </p>
          </div>

          <div className="mt-5 flex gap-3 xl:hidden print:hidden">{actions}</div>

          <div className="mt-6 flex gap-3 rounded-2xl bg-blue-50/70 p-5">
            <Info size={20} className="mt-0.5 shrink-0 text-primary/70" aria-hidden />
            <p className="text-[14.5px] leading-relaxed text-navy/75">{document.summary}</p>
          </div>

          <div className="mt-4">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28 border-t border-navy/[0.07] py-7 first:border-t-0">
                <h2 className="group flex items-center gap-2 font-display text-[21px] font-bold text-navy">
                  {i + 1}. {s.heading}
                  <button
                    type="button"
                    onClick={() => copyLink(s.id)}
                    title="Copy a link to this section"
                    aria-label={`Copy a link to “${s.heading}”`}
                    className="text-primary/60 transition-colors hover:text-primary print:hidden"
                  >
                    {copied === s.id ? <Check size={16} /> : <Link2 size={16} />}
                  </button>
                </h2>
                {s.paragraphs?.map((p) => (
                  <p key={p} className="mt-3 text-[15px] leading-relaxed text-navy/70">
                    {p}
                  </p>
                ))}
                {s.bullets && (
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-navy/70">
                    {s.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <p className="mt-2 text-[13px] text-navy/45">
            Questions? Write to{' '}
            <a href={`mailto:${LEGAL_EMAIL}`} className="font-semibold text-primary hover:underline">
              {LEGAL_EMAIL}
            </a>
            .
          </p>
        </article>

        <aside className="hidden xl:block print:hidden">
          <div className="sticky top-28">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-navy/45">Actions</p>
            <div className="mt-4 flex flex-col gap-3">{actions}</div>
            <div className="mt-8 border-t border-navy/[0.08] pt-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-navy/45">Need help?</p>
              <Link to="/contact" className="mt-4 flex gap-3">
                <LifeBuoy size={20} className="mt-0.5 shrink-0 text-navy/70" aria-hidden />
                <span>
                  <span className="block text-[14px] font-semibold text-primary hover:underline">Contact us</span>
                  <span className="mt-1 block text-[12.5px] leading-relaxed text-navy/55">
                    We’re happy to answer any question about this page.
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <section className="border-t border-navy/[0.06] bg-blue-50/60 print:hidden">
        <div className="container-px mx-auto flex max-w-page flex-col items-start gap-5 py-8 sm:flex-row sm:items-center">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <HelpCircle size={26} aria-hidden />
          </span>
          <div className="flex-1">
            <h2 className="font-display text-[18px] font-bold text-navy">Questions about this page?</h2>
            <p className="mt-1 text-[14px] text-navy/60">We’re happy to help you understand how it applies to you.</p>
          </div>
          <Link to="/contact" className="rounded-xl bg-primary px-6 py-3 text-[15px] font-semibold text-white shadow-soft transition-opacity hover:opacity-95">
            Contact us
          </Link>
        </div>
      </section>
    </>
  )
}
