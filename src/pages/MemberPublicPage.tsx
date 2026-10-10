import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import SEO from '../components/seo/SEO'
import MemberPageView from '../components/find/MemberPageView'
import { getPublishedMemberPage } from '../modules/find/memberPageService'
import type { MemberPage } from '../modules/find/types'

// /p/:slug — a member's public page (BGrowth Find™, Portal migration 0044).
// Rendered "bare" by AppLayout: the member's page, not BGrowth's, so no
// site menu or footer — only a small "Made with BGrowth" at the bottom.
export default function MemberPublicPage() {
  const { slug = '' } = useParams()
  const [page, setPage] = useState<MemberPage | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    setPage(undefined)
    getPublishedMemberPage(slug.toLowerCase())
      .then((p) => {
        if (!cancelled) setPage(p)
      })
      .catch(() => {
        if (!cancelled) setPage(null)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (page === null) return <Navigate to="/" replace />
  if (page === undefined) return <div className="min-h-screen bg-bg-soft" />

  return (
    <div className="min-h-screen bg-bg-soft">
      <SEO
        title={page.display_name}
        description={page.headline ?? `${page.display_name} on BGrowth`}
        path={`/p/${page.slug}`}
        ogImage={page.photo_url ?? undefined}
      />
      <MemberPageView page={page} />
    </div>
  )
}
