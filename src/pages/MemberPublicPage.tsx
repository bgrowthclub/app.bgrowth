import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import SEO from '../components/seo/SEO'
import MemberPageView from '../components/find/MemberPageView'
import {
  getPublishedMemberPage,
  getMemberPageViewRules,
  isMemberPageIndexable,
  trackMemberPageCategory,
  trackMemberPageClick,
  trackMemberPageSearch,
  trackMemberPageView,
} from '../modules/find/memberPageService'
import type { MemberPageViewRules } from '../modules/find/memberPageService'
import type { MemberPage } from '../modules/find/types'
import { PAGE_BACKGROUNDS, pageUnderPlan } from '../modules/find/memberPageTemplates'

// /p/:slug — a member's public page (BGrowth Find™, Portal migration 0044).
// Rendered "bare" by AppLayout: the member's page, not BGrowth's, so no
// site menu or footer — only a small "Powered by BGrowth" at the bottom.
export default function MemberPublicPage() {
  const { slug = '' } = useParams()
  const [page, setPage] = useState<MemberPage | null | undefined>(undefined)
  // May search engines list it? Free and Starter pages stay out (08/11/2026).
  // undefined while the answer is in flight: nothing is written to the head
  // until it lands, so a page is never briefly marked the wrong way.
  const [indexable, setIndexable] = useState<boolean | undefined>(undefined)
  // Which model, and how much of it, the owner's plan allows today
  // (08/11/2026). undefined = still asking; null = no answer, draw the page
  // as stored.
  const [rules, setRules] = useState<MemberPageViewRules | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    setPage(undefined)
    getPublishedMemberPage(slug.toLowerCase())
      .then((p) => {
        if (cancelled) return
        setPage(p)
        // An old address redirects below; the new one counts the visit.
        if (p && p.slug === slug.toLowerCase()) trackMemberPageView(p.slug)
        if (p) {
          void getMemberPageViewRules(p.id).then((r) => {
            if (cancelled) return
            setRules(r)
            // 0082 answers both questions at once; the older call is the
            // fallback for a database that only has 0081.
            if (r) setIndexable(r.indexable)
            else void isMemberPageIndexable(p.id).then((ok: boolean) => !cancelled && setIndexable(ok))
          })
        }
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
  // Wait for the plan rules before drawing a page its owner manages: the
  // alternative is a flash of the full page before it is trimmed, which is
  // precisely the content their plan no longer includes (08/11/2026). A
  // team-made page is not governed by a plan and draws at once.
  if (page === undefined || (page.owner_managed && rules === undefined)) return <div className="min-h-screen bg-bg-soft" />
  if (page.slug !== slug.toLowerCase()) return <Navigate to={`/p/${page.slug}${window.location.search}`} replace />

  // The page as the owner's plan allows it today. Nothing was changed in
  // the database — put the plan back and the page comes back whole.
  const shown = pageUnderPlan(page, rules ?? null)

  // The page's own background tint fills the whole window (default: soft grey).
  const background = PAGE_BACKGROUNDS.find((c) => c.id === page.theme?.background)
  return (
    <div className="min-h-screen bg-bg-soft" style={background ? { backgroundColor: background.hex } : undefined}>
      <SEO
        title={page.display_name}
        description={page.headline ?? `${page.display_name} on BGrowth`}
        path={`/p/${page.slug}`}
        ogImage={page.photo_url ?? undefined}
        noIndex={indexable === false}
      />
      <MemberPageView
        page={shown}
        onLinkClick={(target) => trackMemberPageClick(page.slug, target)}
        onSearch={(query, found) => trackMemberPageSearch(page.slug, query, found)}
        onCategory={(category) => trackMemberPageCategory(page.slug, category)}
      />
    </div>
  )
}
