import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Check, Copy, ExternalLink, MessageCircle, Palette, Plus, Rocket, Share2, Sparkles } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import mypageHero from '../../assets/mypage-hero.webp'
import Button from '../../components/ui/Button'
import MemberPageStatsView from '../../components/find/MemberPageStatsView'
import MemberPageBuilder from '../../components/find/MemberPageBuilder'
import MemberPageSignupsList from '../../components/find/MemberPageSignupsList'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { getMyMemberPageStats, myPageService } from '../../modules/find/memberPageService'
import type { MemberPage, MemberPageLevel, MemberPageStats, MemberPageSummary } from '../../modules/find/types'

const TEXT = {
  en: { titleLead: 'My', titleAccent: 'Business', titleTail: 'Page', title: 'My Business Page', description: 'A simple professional page for your business — share it anywhere.', open: 'Open', edit: 'Edit', numbers: 'Numbers', contacts: 'Contacts', copy: 'Copy link', copied: 'Copied', share: 'Share', whatsapp: 'WhatsApp', live: 'Live', draft: 'Draft', draftAddress: 'Once you publish, it will be at', newPage: 'New page', allUsed: (n: number) => `${n} of ${n} pages used`, pending: 'In review', sentBack: 'Our team sent this back:' },
  pt: { titleLead: 'Minha', titleAccent: 'página', titleTail: 'de negócio', title: 'Minha página de negócio', description: 'Uma página profissional simples para o seu negócio — compartilhe onde quiser.', open: 'Abrir', edit: 'Editar', numbers: 'Números', contacts: 'Contatos', copy: 'Copiar link', copied: 'Copiado', share: 'Compartilhar', whatsapp: 'WhatsApp', live: 'No ar', draft: 'Rascunho', draftAddress: 'Quando você publicar, ela fica em', newPage: 'Nova página', allUsed: (n: number) => `${n} de ${n} páginas usadas`, pending: 'Em análise', sentBack: 'Nosso time devolveu esta página:' },
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


// The top of the screen (07/11/2026, the owner's design): who the page is
// for, what it is, and the three steps the job actually has. The steps are
// a map, not buttons — someone who just subscribed opened this and found
// forms, with no idea the work had a shape.
function PageHeader({
  name,
  t,
  language,
  status,
  slug,
  reviewNote,
}: {
  name: string
  t: (typeof TEXT)['en']
  language: MemberPage['language']
  // undefined = no page yet; 'draft' = saved but not online.
  status?: MemberPage['status']
  slug?: string
  // What the team said when it sent the page back (Portal migration 0079).
  reviewNote?: string | null
}) {
  const steps = STEPS[language]
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-navy/[0.07] bg-gradient-to-br from-primary/[0.08] to-white">
      <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.52fr)]">
        <div className="px-6 py-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.2em] text-primary">{name}</p>
            {/* Is it online or not (07/11/2026). Before this, a member with
                a draft saw no badge and no address at all, so there was
                nothing on the screen telling them their page wasn't live. */}
            {status === 'published' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden /> {t.live}
              </span>
            ) : status === 'pending' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-sky-700">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" aria-hidden /> {t.pending}
              </span>
            ) : status === 'draft' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden /> {t.draft}
              </span>
            ) : null}
          </div>
          <h1 className="mt-2 font-display text-[30px] font-extrabold leading-tight tracking-tight text-navy">
            {t.titleLead} <span className="text-primary">{t.titleAccent}</span> {t.titleTail}
          </h1>
          <p className="mt-2 text-[14.5px] text-navy/60">{t.description}</p>
          {reviewNote && status !== 'pending' && (
            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] leading-relaxed text-amber-900">
              <span className="font-bold">{t.sentBack}</span> {reviewNote}
            </p>
          )}
          {status === 'draft' && slug && (
            <p className="mt-2 text-[13.5px] text-navy/50">
              {t.draftAddress} <span className="font-semibold text-navy/70">bgrowth.app/p/{slug}</span>
            </p>
          )}

          <ol className="mt-5 flex flex-wrap gap-2">
            {steps.map((step, i) => (
              <li
                key={step.label}
                className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-2 text-[13px] font-semibold text-navy/70"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/[0.1]">
                  <step.icon size={13} className="text-primary" aria-hidden />
                </span>
                <span className="text-navy/35">{i + 1}.</span> {step.label}
              </li>
            ))}
          </ol>
        </div>

        <img
          src={mypageHero}
          alt=""
          width={782}
          height={382}
          className="hidden h-full w-full object-cover md:block [mask-image:linear-gradient(to_right,transparent,black_18%)]"
        />
      </div>
    </div>
  )
}

const STEPS = {
  en: [
    { icon: Sparkles, label: 'Choose a model' },
    { icon: Palette, label: 'Make it yours' },
    { icon: Rocket, label: 'Publish & share' },
  ],
  pt: [
    { icon: Sparkles, label: 'Escolha um modelo' },
    { icon: Palette, label: 'Deixe com a sua cara' },
    { icon: Rocket, label: 'Publique e compartilhe' },
  ],
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
  // Several pages per member (07/11/2026): the list, how many the plan and
  // the team's grant allow, and which one is open. `creating` is the state
  // between pressing "New page" and the first save, when there is no id yet.
  const [pages, setPages] = useState<MemberPageSummary[]>([])
  const [allowance, setAllowance] = useState(1)
  // How many contact buttons the plan shows (null = no limit).
  const [linkLimit, setLinkLimit] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
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
        setPages(r.pages ?? (r.page ? [{ id: r.page.id, slug: r.page.slug, display_name: r.page.display_name, status: r.page.status }] : []))
        setAllowance(typeof r.allowance === 'number' ? r.allowance : 1)
        setLinkLimit(typeof r.linkLimit === 'number' ? r.linkLimit : null)
        setPage(r.page)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Couldn’t load your page.')
        setPage(null)
      })
  }, [user])

  const openPage = (id: string) => {
    setCreating(false)
    setPage(undefined)
    setError(null)
    setNotice(null)
    myPageService
      .get(id)
      .then((r) => {
        setInsights(r.insights === true)
        setPage(r.page)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Couldn’t load that page.')
        setPage(null)
      })
  }

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
      <PageHeader name={page?.display_name ?? linked?.displayName ?? user.displayName} t={t} language={language} status={page?.status} slug={slug} reviewNote={page?.review_note ?? null} />
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

      {/* The member's pages (07/11/2026). It only appears when there is
          something to choose between — one page and one allowed is the
          case nearly everyone is in, and a switcher there would be noise. */}
      {canEdit && (pages.length > 1 || allowance > 1) && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {pages.map((p) => {
            const open = !creating && page?.id === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => openPage(p.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                  open ? 'bg-primary text-white' : 'bg-bg-soft text-navy/65 hover:text-navy'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    p.status === 'published' ? 'bg-emerald-500' : p.status === 'pending' ? 'bg-sky-500' : 'bg-amber-500'
                  }`}
                  aria-hidden
                />
                {p.display_name || p.slug}
              </button>
            )
          })}
          {pages.length < allowance ? (
            <button
              type="button"
              onClick={() => {
                setCreating(true)
                setPage(null)
                setNotice(null)
                setError(null)
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                creating ? 'bg-primary text-white' : 'border border-dashed border-navy/20 text-navy/55 hover:border-primary/40 hover:text-navy'
              }`}
            >
              <Plus size={14} aria-hidden /> {t.newPage}
            </button>
          ) : (
            <span className="text-[12.5px] text-navy/40">{t.allUsed(allowance)}</span>
          )}
        </div>
      )}

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
          maxLinks={linkLimit}
          readOnly={!selfService}
          upload={(dataUrl) => myPageService.uploadImage(dataUrl)}
          onSave={async (draft) => {
            const saved = await myPageService.save(draft, creating ? undefined : page?.id)
            setCreating(false)
            setPage(saved)
            setPages((list) => {
              const line = { id: saved.id, slug: saved.slug, display_name: saved.display_name, status: saved.status }
              return list.some((p) => p.id === saved.id) ? list.map((p) => (p.id === saved.id ? line : p)) : [...list, line]
            })
            setNotice(
              saved.status === 'published'
                ? `Your page is live at bgrowth.app/p/${saved.slug}.`
                : saved.status === 'pending'
                  ? 'Sent to our team. We look at every free page before it goes online — you’ll get an e-mail when it’s done, usually within a day.'
                  : 'Saved as a draft — publish it when you’re ready.',
            )
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
