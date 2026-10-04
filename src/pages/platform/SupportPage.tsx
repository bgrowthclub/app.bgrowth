import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, LifeBuoy, Plus } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import SectionHeader from '../../components/ui/SectionHeader'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import SupportStatusBanner from '../../components/support/SupportStatusBanner'
import SupportConversationList from '../../components/support/SupportConversationList'
import SupportMessageList from '../../components/support/SupportMessageList'
import SupportComposer from '../../components/support/SupportComposer'
import NewSupportConversation from '../../components/support/NewSupportConversation'
import { supportService } from '../../modules/support/supportService'
import { isSupportOnline } from '../../modules/support/hours'
import { usePoll } from '../../modules/support/usePoll'
import type { SupportState, SupportThread } from '../../modules/support/types'

const CARD = 'rounded-xl3 border border-navy/[0.06] bg-white shadow-softer'

function message(err: unknown) {
  return err instanceof Error ? err.message : String(err)
}

// Support Center — the member side: live chat during support hours, a
// ticket answered by e-mail outside them; one conversation either way.
export default function SupportPage() {
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('c')
  const [state, setState] = useState<SupportState | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState<string>()
  const [thread, setThread] = useState<SupportThread | null>(null)
  const [composing, setComposing] = useState(false)
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
    setComposing(false)
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
  const showDetail = composing || Boolean(selectedId) || conversations.length === 0

  return (
    <div className="mx-auto max-w-6xl">
      <SEO title="Support" description="Talk to the BGrowth team." path="/platform/support" />
      <SectionHeader eyebrow="Help" title="Support" description="Questions about your account or a Workspace? Talk to the BGrowth team." className="mb-6" />

      {status === 'loading' ? (
        <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
      ) : status === 'error' || !state ? (
        <EmptyState icon={LifeBuoy} title="We couldn’t load Support." description={loadError} />
      ) : (
        <div className="space-y-5">
          <SupportStatusBanner online={online} hours={state.hours} />

          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            {/* Conversations — hidden on phones while one is open */}
            <aside className={`${CARD} h-fit overflow-hidden ${showDetail ? 'hidden lg:block' : ''}`}>
              <div className="flex items-center justify-between border-b border-navy/[0.06] px-4 py-3">
                <p className="text-[13px] font-semibold text-navy">Your conversations</p>
                <button
                  type="button"
                  onClick={() => {
                    setParams({})
                    setComposing(true)
                  }}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] font-semibold text-primary hover:bg-bg-soft"
                >
                  <Plus size={14} /> New
                </button>
              </div>
              {conversations.length === 0 ? (
                <p className="px-4 py-6 text-[13px] text-navy/45">No conversations yet.</p>
              ) : (
                <SupportConversationList
                  activeId={selectedId}
                  onSelect={open}
                  items={conversations.map((c) => ({
                    id: c.id,
                    title: c.subject,
                    subtitle: c.status === 'closed' ? 'Closed' : c.last_sender === 'staff' ? 'BGrowth replied' : 'Waiting for our reply',
                    time: c.last_message_at,
                    badge: c.unread ? 'New reply' : undefined,
                    muted: c.status === 'closed',
                  }))}
                />
              )}
            </aside>

            <section className={`${CARD} flex min-h-[420px] flex-col p-5 ${showDetail ? '' : 'hidden lg:flex'}`}>
              {composing || (!selectedId && conversations.length === 0) ? (
                <NewSupportConversation
                  busy={busy}
                  error={error}
                  onSubmit={start}
                  onCancel={conversations.length > 0 ? () => setComposing(false) : undefined}
                />
              ) : selectedId ? (
                thread ? (
                  <>
                    <div className="mb-4 flex items-center gap-3 border-b border-navy/[0.06] pb-3">
                      <button
                        type="button"
                        onClick={() => open(null)}
                        aria-label="Back to conversations"
                        className="grid h-8 w-8 place-items-center rounded-full text-navy/50 hover:bg-bg-soft lg:hidden"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <h2 className="min-w-0 flex-1 truncate font-display text-lg font-bold text-navy">{thread.conversation.subject}</h2>
                      {thread.conversation.status === 'closed' && (
                        <span className="rounded-full bg-navy/[0.05] px-2.5 py-1 text-[11px] font-semibold text-navy/50">Closed</span>
                      )}
                    </div>
                    <div className="max-h-[55vh] flex-1 overflow-y-auto pr-1">
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
                )
              ) : (
                <div className="m-auto text-center">
                  <p className="text-[14px] text-navy/50">Pick a conversation, or start a new one.</p>
                  <Button type="button" onClick={() => setComposing(true)} icon={<Plus size={15} />} className="mt-4 !rounded-xl !px-4 !py-2.5 !text-[13px]">
                    New conversation
                  </Button>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
