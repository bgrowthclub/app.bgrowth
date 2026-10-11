import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import SectionHeader from '../../components/ui/SectionHeader'
import MemberPageStatsView from '../../components/find/MemberPageStatsView'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { getMyMemberPageStats } from '../../modules/find/memberPageService'
import type { MemberPageStats } from '../../modules/find/types'

const TEXT = {
  en: { title: 'My Page', description: 'How many people visit your page and what they click — updated as it happens.', open: 'Open my page' },
  pt: { title: 'Minha página', description: 'Quantas pessoas visitam sua página e onde clicam — atualizado na hora.', open: 'Abrir minha página' },
}

// /platform/my-page — the numbers of the member's own public page (BGrowth
// Find™). Shown only to a member the team linked a page to; editing the
// page here comes with Plans & Subscriptions.
export default function MyPagePage() {
  const { user } = useIdentity()
  const page = user?.memberPage
  const [days, setDays] = useState(30)
  const [stats, setStats] = useState<MemberPageStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!page) return
    let cancelled = false
    setStats(null)
    setError(null)
    getMyMemberPageStats(page.id, days)
      .then((s) => {
        if (!cancelled) setStats(s)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Couldn’t load the numbers.')
      })
    return () => {
      cancelled = true
    }
  }, [page, days])

  if (!page) return <Navigate to="/platform/dashboard" replace />
  const t = TEXT[page.language]

  return (
    <div className="mx-auto max-w-4xl">
      <SEO title={t.title} description={t.description} path="/platform/my-page" />
      <SectionHeader eyebrow={page.displayName} title={t.title} description={t.description} className="mb-6" />
      <a
        href={`/p/${encodeURIComponent(page.slug)}`}
        target="_blank"
        rel="noreferrer"
        className="mb-8 inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:underline"
      >
        bgrowth.app/p/{page.slug} <ExternalLink size={14} aria-hidden /> <span className="sr-only">{t.open}</span>
      </a>
      <MemberPageStatsView stats={stats} days={days} onDays={setDays} language={page.language} error={error} />
    </div>
  )
}
