import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../seo/SEO'
import PageContainer from '../layout/PageContainer'
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

// One legal page (Privacy, Terms, Refund). The built-in text lives in
// data/legal.ts; a version edited in Admin → Site (portal.site_content,
// key legal:<slug>) replaces it, with its own "last updated" date.
export default function LegalDocument({ document: builtIn }: Props) {
  const [edited, setEdited] = useState<{ content: LegalEditableContent; updated: string } | null>(null)

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
  return (
    <>
      <SEO title={document.title} description={document.summary} path={path} />
      <section className="section-py">
        <PageContainer width="narrow">
          <p className="eyebrow">Legal</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy md:text-4xl">{document.title}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-navy/60">{document.summary}</p>
          <p className="mt-2 text-[13px] text-navy/40">Last updated: {updated}</p>

          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Legal pages">
            {LEGAL_DOCUMENTS.map((d) => (
              <Link
                key={d.slug}
                to={PATHS[d.slug]}
                className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                  d.slug === document.slug ? 'bg-primary text-white' : 'bg-bg-soft text-navy/60 hover:text-navy'
                }`}
              >
                {d.title}
              </Link>
            ))}
          </nav>

          <div className="mt-10 space-y-8">
            {document.sections.map((section, i) => (
              <section key={`${i}-${section.heading}`}>
                <h2 className="font-display text-lg font-bold text-navy">
                  {i + 1}. {section.heading}
                </h2>
                {section.paragraphs?.map((p) => (
                  <p key={p} className="mt-2 text-[15px] leading-relaxed text-navy/70">
                    {p}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-navy/70">
                    {section.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-xl3 bg-bg-soft p-6 text-[14px] text-navy/65">
            Questions? Write to{' '}
            <a href={`mailto:${LEGAL_EMAIL}`} className="font-semibold text-primary hover:underline">
              {LEGAL_EMAIL}
            </a>{' '}
            or use our <Link to="/contact" className="font-semibold text-primary hover:underline">contact page</Link>.
          </div>
        </PageContainer>
      </section>
    </>
  )
}
