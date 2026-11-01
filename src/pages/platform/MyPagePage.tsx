import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Check, Copy, ExternalLink, MessageCircle, Share2 } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import SectionHeader from '../../components/ui/SectionHeader'
import Button from '../../components/ui/Button'
import MemberPageStatsView from '../../components/find/MemberPageStatsView'
import MemberPageBuilder from '../../components/find/MemberPageBuilder'
import MemberPageSignupsList from '../../components/find/MemberPageSignupsList'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { getMyMemberPageStats, myPageService } from '../../modules/find/memberPageService'
import type { MemberPage, MemberPageLevel, MemberPageStats } from '../../modules/find/types'

const TEXT = {
  en: { title: 'My Business Page', description: 'A simple professional page for your business — share it anywhere.', open: 'Open', edit: 'Edit', numbers: 'Numbers', contacts: 'Contacts', copy: 'Copy link', copied: 'Copied', share: 'Share', whatsapp: 'WhatsApp' },
  pt: { title: 'Minha página de negócio', description: 'Uma página profissional simples para o seu negócio — compartilhe onde quiser.', open: 'Abrir', edit: 'Editar', numbers: 'Números', contacts: 'Contatos', copy: 'Copiar link', copied: 'Copiado', share: 'Compartilhar', whatsapp: 'WhatsApp' },
}

// The page's address with copy and share buttons.
function ShareBar({ slug, name, t }: { slug: string; name: string; t: (typeof TEXT)['en'] }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/p/${encodeURIComponent(slug)}`
  const btn = 'inline-flex items-center gap-1.5 rounded-xl border border-navy/10 bg-white px-3 py-2 text-[13px] font-semibold text-navy/70 hover:border-primary/40 hover:text-navy'
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-navy/[0.08] bg-white p-3">
      <a href={url} target="_blank" rel="noreferrer" className="mr-auto inline-flex min-w-0 items-center gap-1.5 truncate px-1 text-[14px] font-semibold text-primary hover:underline">
        bgrowth.app/p/{slug} <ExternalLink size={14} aria-hidden /> <span className="sr-only">{t.open}</span>
      </a>
      <button
        type="button"
        className={btn}
        onClick={() => {
          void navigator.clipboard?.writeText(url).then(() => {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 2000)
          })
        }}
      >
        {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? t.copied : t.copy}
      </button>
      <a href={`https://wa.me/?text=${encodeURIComponent(`${name} — ${url}`)}`} target="_blank" rel="noreferrer" className={btn}>
        <MessageCircle size={15} /> {t.whatsapp}
      </a>
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <button type="button" className={btn} onClick={() => void navigator.share({ title: name, url }).catch(() => undefined)}>
          <Share2 size={15} /> {t.share}
        </button>
      )}
    </div>
  )
}

// /platform/my-page — "My Business Page", the member's own public page (BGrowth Find™).
// Subscribers whose plan includes a page build and edit it here (Sprint 127:
// Pro = a model as it is, Enterprise = everything + the numbers). A page the
// team made and linked to the member shows its numbers only.
export default function MyPagePage() {
  const { user } = useIdentity()
  const linked = user?.memberPage
  const [level, setLevel] = useState<MemberPageLevel | null>(user?.pageLevel ?? null)
  const [page, setPage] = useState<MemberPage | null | undefined>(undefined)
  // The models the plan allows (null = all).
  const [templates, setTemplates] = useState<string[] | null>(null)
  // Off before launch: the editor is shown read-only with "Coming soon".
  const [selfService, setSelfService] = useState(false)
  // What visitors looked for (01/11/2026): their plan includes it, or the
  // team switched it on for this page.
  const [insights, setInsights] = useState(false)
  const [tab, setTab] = useState<'edit' | 'numbers' | 'contacts'>('edit')
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
        setTemplates(r.templates ?? null)
        setSelfService(r.selfService === true)
        setInsights(r.insights === true)
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
  // The e-mail list (Sprint 139): whole-page plans, team-made pages, or a
  // page the team switched it on for.
  const showContacts = Boolean(page) && (teamPage || level === 'full' || Boolean(page?.signup_granted))
  const tabs = ([canEdit && 'edit', showNumbers && 'numbers', showContacts && 'contacts'] as const).filter(Boolean) as ('edit' | 'numbers' | 'contacts')[]
  const activeTab = tabs.includes(tab) ? tab : tabs[0]

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
      {slug && page?.status !== 'draft' && <ShareBar slug={slug} name={page?.display_name ?? linked?.displayName ?? user.displayName} t={t} />}

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
      {canEdit && !selfService && (
        <p className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-700">
          <strong>Coming soon:</strong> building and publishing your own page opens at launch. For now the BGrowth team builds pages — talk to us through Support. You can look around the editor; nothing here can be changed or saved yet.
        </p>
      )}
      {notice && <p className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}
      {error && <p className="mb-6 text-[14px] text-red-500">{error}</p>}

      {tabs.length > 1 && (
        <div className="mb-6 flex gap-2">
          {tabs.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${activeTab === id ? 'bg-primary text-white' : 'bg-bg-soft text-navy/60 hover:text-navy'}`}
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
          allowedTemplates={templates}
          readOnly={!selfService}
          upload={(dataUrl) => myPageService.uploadImage(dataUrl)}
          onSave={async (draft) => {
            const saved = await myPageService.save(draft)
            setPage(saved)
            setNotice(saved.status === 'published' ? `Your page is live at bgrowth.app/p/${saved.slug}.` : 'Saved as a draft — publish it when you’re ready.')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      ) : activeTab === 'numbers' ? (
        <MemberPageStatsView stats={stats} days={days} onDays={setDays} language={language} error={null} insights={insights} />
      ) : activeTab === 'contacts' ? (
        <MemberPageSignupsList load={() => myPageService.signups()} remove={(id) => myPageService.removeSignup(id)} fileName={slug ?? 'page'} />
      ) : null}
    </div>
  )
}
