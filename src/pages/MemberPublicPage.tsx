import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import SEO from '../components/seo/SEO'
import MemberPageView from '../components/find/MemberPageView'
import { getPublishedMemberPage, trackMemberPageClick, trackMemberPageView } from '../modules/find/memberPageService'
import type { MemberPage } from '../modules/find/types'

// /p/:slug — a member's public page (BGrowth Find™, Portal migration 0044).
// Rendered "bare" by AppLayout: the member's page, not BGrowth's, so no
// site menu or footer — only a small "Powered by BGrowth" at the bottom.
export default function MemberPublicPage() {
  const { slug = '' } = useParams()
  const [page, setPage] = useState<MemberPage | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    setPage(undefined)
    getPublishedMemberPage(slug.toLowerCase())
      .then((p) => {
        if (cancelled) return
        setPage(p)
        // An old address redirects below; the new one counts the visit.
        if (p && p.slug === slug.toLowerCase()) trackMemberPageView(p.slug)
      })
      .catch(() => {
        if (!cancelled) setPage(null)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  // Not published (draft, removed, or the owner's plan has no page): say so
  // here instead of sending the visitor to the home page.
  if (page === null)
    return (
      <div className="grid min-h-screen place-items-center bg-bg-soft px-5 text-center">
        <SEO title="Page not available" description="This page isn’t available." path={`/p/${slug}`} />
        <div>
          <p className="font-display text-xl font-bold text-navy">This page isn’t available.</p>
          <p className="mt-2 text-[14px] text-navy/55">Esta página não está disponível.</p>
          <a href="/" translate="no" className="notranslate mt-6 inline-block text-[13px] font-medium text-navy/40 hover:text-navy/70">
            Powered by BGrowth
          </a>
        </div>
      </div>
    )
  if (page === undefined) return <div className="min-h-screen bg-bg-soft" />
  if (page.slug !== slug.toLowerCase()) return <Navigate to={`/p/${page.slug}${window.location.search}`} replace />

  return (
    <div className="min-h-screen bg-bg-soft">
      <SEO
        title={page.display_name}
        description={page.headline ?? `${page.display_name} on BGrowth`}
        path={`/p/${page.slug}`}
        ogImage={page.photo_url ?? undefined}
      />
      <MemberPageView page={page} onLinkClick={(target) => trackMemberPageClick(page.slug, target)} />
    </div>
  )
}
