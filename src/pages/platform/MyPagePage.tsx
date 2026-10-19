import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import SectionHeader from '../../components/ui/SectionHeader'
import Button from '../../components/ui/Button'
import MemberPageStatsView from '../../components/find/MemberPageStatsView'
import MemberPageBuilder from '../../components/find/MemberPageBuilder'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { getMyMemberPageStats, myPageService } from '../../modules/find/memberPageService'
import type { MemberPage, MemberPageLevel, MemberPageStats } from '../../modules/find/types'

const TEXT = {
  en: { title: 'My Page', description: 'Your own page to show your work — and how many people visit it.', open: 'Open my page', edit: 'Edit', numbers: 'Numbers' },
  pt: { title: 'Minha página', description: 'Sua página para mostrar seu trabalho — e quantas pessoas a visitam.', open: 'Abrir minha página', edit: 'Editar', numbers: 'Números' },
}

// /platform/my-page — the member's own public page (BGrowth Find™).
// Subscribers whose plan includes a page build and edit it here (Sprint 127:
// Pro = a model as it is, Enterprise = everything + the numbers). A page the
// team made and linked to the member shows its numbers only.
export default function MyPagePage() {
  const { user } = useIdentity()
  const linked = user?.memberPage
  const [level, setLevel] = useState<MemberPageLevel | null>(user?.pageLevel ?? null)
  const [page, setPage] = useState<MemberPage | null | undefined>(undefined)
  const [tab, setTab] = useState<'edit' | 'numbers'>('edit')
  const [days, setDays] = useState(30)
  const [stats, setStats] = useState<MemberPageStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    myPageService
      .get()
      .then((r) => {
        setLevel(r.level)
        setPage(r.page)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Couldn’t load your page.')
        setPage(null)
      })
  }, [user])

  const teamPage = page ? !page.owner_managed : Boolean(linked)
  const statsPageId = page?.id ?? linked?.id
  const showNumbers = Boolean(statsPageId) && (teamPage || level === 'full')
  const canEdit = Boolean(level) && !teamPage
  const activeTab = canEdit ? tab : 'numbers'

  useEffect(() => {
    if (!statsPageId || !showNumbers || activeTab !== 'numbers') return
    let cancelled = false
    setStats(null)
    getMyMemberPageStats(statsPageId, days)
      .then((s) => !cancelled && setStats(s))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Couldn’t load the numbers.'))
    return () => {
      cancelled = true
    }
  }, [statsPageId, showNumbers, activeTab, days])

  if (!user) return null
  if (page === undefined) return <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
  if (!level && !page && !linked) return <Navigate to="/platform/membership" replace />

  const language = page?.language ?? linked?.language ?? 'en'
  const t = TEXT[language]
  const slug = page?.slug ?? linked?.slug
  return (
    <div className="mx-auto max-w-6xl">
      <SEO title={t.title} description={t.description} path="/platform/my-page" />
      <SectionHeader eyebrow={page?.display_name ?? linked?.displayName ?? user.displayName} title={t.title} description={t.description} className="mb-6" />
      {slug && page?.status !== 'draft' && (
        <a href={`/p/${encodeURIComponent(slug)}`} target="_blank" rel="noreferrer" className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:underline">
          bgrowth.app/p/{slug} <ExternalLink size={14} aria-hidden /> <span className="sr-only">{t.open}</span>
        </a>
      )}

      {!level && page?.owner_managed && (
        <div className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-700">
          Your plan no longer includes a page, so it’s off the site. It’s saved — choose a plan with a page to bring it back.{' '}
          <Button to="/platform/membership" variant="secondary" className="ml-2 !rounded-xl !px-3 !py-1.5 !text-[12.5px]">
            See plans
          </Button>
        </div>
      )}
      {teamPage && level && (
        <p className="mb-6 rounded-xl bg-bg-soft px-4 py-3 text-[13.5px] text-navy/60">Your page is managed by the BGrowth team — talk to us through Support to change it.</p>
      )}
      {notice && <p className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}
      {error && <p className="mb-6 text-[14px] text-red-500">{error}</p>}

      {canEdit && showNumbers && (
        <div className="mb-6 flex gap-2">
          {(['edit', 'numbers'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${tab === id ? 'bg-primary text-white' : 'bg-bg-soft text-navy/60 hover:text-navy'}`}
            >
              {t[id]}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'edit' && canEdit && level ? (
        <MemberPageBuilder
          key={page?.id ?? 'new'}
          mode={level}
          page={page}
          upload={(dataUrl) => myPageService.uploadImage(dataUrl)}
          onSave={async (draft) => {
            const saved = await myPageService.save(draft)
            setPage(saved)
            setNotice(saved.status === 'published' ? `Your page is live at bgrowth.app/p/${saved.slug}.` : 'Saved as a draft — publish it when you’re ready.')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      ) : showNumbers ? (
        <MemberPageStatsView stats={stats} days={days} onDays={setDays} language={language} error={null} />
      ) : null}
    </div>
  )
}
