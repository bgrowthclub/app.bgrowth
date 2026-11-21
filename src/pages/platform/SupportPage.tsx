import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Headphones, LifeBuoy, Plus, Receipt, Sparkles } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import EmptyState from '../../components/ui/EmptyState'
import SupportRecentList, { splitSupportSubject } from '../../components/support/SupportRecentList'
import SupportMessageList from '../../components/support/SupportMessageList'
import SupportComposer from '../../components/support/SupportComposer'
import NewSupportConversation from '../../components/support/NewSupportConversation'
import { supportService } from '../../modules/support/supportService'
import { describeSupportHours, isSupportOnline } from '../../modules/support/hours'
import { usePoll } from '../../modules/support/usePoll'
import type { SupportState, SupportThread } from '../../modules/support/types'

const CARD = 'rounded-xl3 border border-navy/[0.06] bg-white shadow-softer'

function message(err: unknown) {
  return err instanceof Error ? err.message : String(err)
}

// Support Center — the member side: live chat during support hours, a
// ticket answered by e-mail outside them; one conversation either way.
// New look 21/11/2026 (the owner's design): recent conversations on the
// left, a new one (Topic, Subject, Message) or the open one on the right,
// and links to Knowledge, Purchases and Membership. Nothing invented: no
// reply-time figure, attachments, videos or community (on the site plan).
export default function SupportPage() {
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('c')
  // Came from a product's "Need help with this?" (01/11/2026): the new
  // conversation opens with that product as the subject.
  const about = params.get('about')?.trim().slice(0, 160) || null
  const [state, setState] = useState<SupportState | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState<string>()
  const [thread, setThread] = useState<SupportThread | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState(false)

  const loadState = useCallback(async () => {
    const next = await supportService.getState()
    setState(next)
    setOnline(next.online)
    return next
  }, [])

  const loadThread = useCallback(async (id: string) => {
    const next = await supportService.getConversation(id)
    setThread(next)
  }, [])

  useEffect(() => {
    loadState()
      .then(() => setStatus('ready'))
      .catch((err: unknown) => {
        setLoadError(message(err))
        setStatus('error')
      })
  }, [loadState])

  useEffect(() => {
    setThread(null)
    setError(null)
    if (selectedId) loadThread(selectedId).catch((err: unknown) => setError(message(err)))
  }, [selectedId, loadThread])

  // Opening/closing time passes while the page is open.
  usePoll(() => state && setOnline(isSupportOnline(state.hours)), 60_000, Boolean(state))
  usePoll(() => void loadState().catch(() => undefined), 20_000, status === 'ready')
  usePoll(() => selectedId && void loadThread(selectedId).catch(() => undefined), online ? 4_000 : 30_000, Boolean(selectedId))

  function open(id: string | null) {
    setParams(id ? { c: id } : {}, { replace: false })
  }

  async function start(subject: string, body: string) {
    setBusy(true)
    setError(null)
    try {
      const id = await supportService.startConversation(subject, body)
      await loadState()
      open(id)
    } catch (err) {
      setError(message(err))
    } finally {
      setBusy(false)
    }
  }

  async function send(text: string) {
    if (!selectedId) return false
    setBusy(true)
    setError(null)
    try {
      await supportService.sendMessage(selectedId, text)
      await Promise.all([loadThread(selectedId), loadState()])
      return true
    } catch (err) {
      setError(message(err))
      return false
    } finally {
      setBusy(false)
    }
  }

  const conversations = state?.conversations ?? []
  const showForm = !selectedId

  const helpCards = [
    { to: '/knowledge', icon: BookOpen, tone: 'bg-primary text-white', title: 'Knowledge base', text: 'Articles and guides to help you start, run and grow.', cta: 'Browse articles' },
    { to: '/platform/purchases', icon: Receipt, tone: 'bg-emerald-600 text-white', title: 'Your purchases', text: 'Orders, receipts and every access on your account.', cta: 'See purchases' },
    { to: '/platform/membership', icon: Sparkles, tone: 'bg-violet-600 text-white', title: 'Membership', text: 'Your plan, what it includes, and how to change it.', cta: 'See your plan' },
  ]

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <SEO title="Support" description="Talk to the BGrowth team." path="/platform/support" />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-primary">Help</p>
          <h1 className="mt-2 font-display text-[28px] font-bold leading-tight text-navy md:text-[36px]">Support &amp; Help Center</h1>
          <p className="mt-2 text-[14.5px] text-navy/55">Questions about your account or a Workspace? We’re here to help.</p>
        </div>
        {state && (
          <div className="text-right">
            <span
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[13px] font-semibold ${
                online ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-navy/10 bg-white text-navy/60'
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-navy/30'}`} aria-hidden />
              {online ? 'We’re online · live chat now' : 'Offline · we reply next business day'}
            </span>
            <p className="mt-1 text-[11.5px] text-navy/40">Hours: {describeSupportHours(state.hours)}</p>
          </div>
        )}
      </div>

      {status === 'loading' ? (
        <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
      ) : status === 'error' || !state ? (
        <div className="mt-6">
          <EmptyState icon={LifeBuoy} title="We couldn’t load Support." description={loadError} />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {/* Recent conversations — under the open conversation on phones */}
            <section className={`${CARD} flex flex-col p-5 sm:p-6 ${selectedId ? 'order-2 lg:order-1' : ''}`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-[20px] font-bold text-navy">Recent conversations</h2>
                {selectedId && (
                  <button type="button" onClick={() => open(null)} className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
                    <Plus size={14} /> New conversation
                  </button>
                )}
              </div>
              {conversations.length === 0 ? (
                <p className="mt-4 rounded-xl bg-bg-soft px-4 py-5 text-[13.5px] text-navy/55">No conversations yet. Start one on the right — we answer here.</p>
              ) : (
                <div className="mt-3 max-h-[440px] overflow-y-auto pr-1">
                  <SupportRecentList items={conversations} activeId={selectedId} onSelect={(id) => open(id)} />
                </div>
              )}
              <div className="mt-auto flex items-start gap-4 border-t border-navy/[0.06] pt-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-50 text-primary">
                  <Headphones size={22} aria-hidden />
                </span>
                <div>
                  <p className="text-[15px] font-bold text-navy">Can’t find what you need?</p>
                  <p className="mt-0.5 text-[13px] text-navy/55">Browse our articles and guides, or start a new conversation.</p>
                  <Link to="/knowledge" className="mt-1.5 inline-flex items-center gap-1 text-[13.5px] font-semibold text-primary hover:underline">
                    Browse Knowledge <ArrowRight size={14} aria-hidden />
                  </Link>
                </div>
              </div>
            </section>

            <section className={`${CARD} flex min-h-[420px] flex-col p-5 sm:p-6 ${selectedId ? 'order-1 lg:order-2' : ''}`}>
              {showForm ? (
                <NewSupportConversation busy={busy} error={error} onSubmit={start} defaultSubject={about ? `Help with ${about}` : undefined} />
              ) : thread ? (
                <>
                  <div className="mb-4 flex items-center gap-3 border-b border-navy/[0.06] pb-3">
                    <button
                      type="button"
                      onClick={() => open(null)}
                      aria-label="Back to a new conversation"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-navy/50 hover:bg-bg-soft"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-display text-lg font-bold text-navy">{splitSupportSubject(thread.conversation.subject).title}</h2>
                      {splitSupportSubject(thread.conversation.subject).topic && (
                        <p className="text-[12px] text-navy/45">{splitSupportSubject(thread.conversation.subject).topic}</p>
                      )}
                    </div>
                    {thread.conversation.status === 'closed' && (
                      <span className="rounded-full bg-navy/[0.05] px-2.5 py-1 text-[11px] font-semibold text-navy/50">Closed</span>
                    )}
                  </div>
                  <div className="max-h-[50vh] flex-1 overflow-y-auto pr-1">
                    <SupportMessageList messages={thread.messages} mine="customer" />
                  </div>
                  <div className="mt-4 border-t border-navy/[0.06] pt-4">
                    {thread.conversation.status === 'closed' && (
                      <p className="mb-2 text-[12.5px] text-navy/45">This conversation was closed. Writing again reopens it.</p>
                    )}
                    {error && <p className="mb-2 text-[13px] text-red-500">{error}</p>}
                    <SupportComposer
                      busy={busy}
                      onSend={send}
                      placeholder={online ? 'Write a message…' : 'Leave a message — we’ll answer on the next business day.'}
                    />
                  </div>
                </>
              ) : error ? (
                <p className="text-[13px] text-red-500">{error}</p>
              ) : (
                <p className="py-16 text-center text-[14px] text-navy/40">Loading conversation…</p>
              )}
            </section>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {helpCards.map(({ to, icon: Icon, tone, title, text, cta }) => (
              <Link key={to} to={to} className={`${CARD} group flex items-start gap-4 p-5 transition-colors hover:border-primary/20`}>
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${tone}`}>
                  <Icon size={21} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15.5px] font-bold text-navy">{title}</span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-navy/55">{text}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-[13.5px] font-semibold text-primary">
                    {cta} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
