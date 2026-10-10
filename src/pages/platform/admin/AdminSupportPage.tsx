import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Headset, Settings2 } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import EmptyState from '../../../components/ui/EmptyState'
import SupportConversationList from '../../../components/support/SupportConversationList'
import SupportMessageList from '../../../components/support/SupportMessageList'
import SupportComposer from '../../../components/support/SupportComposer'
import SupportHoursForm from '../../../components/admin/SupportHoursForm'
import { CARD, LINK_BUTTON } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminSupportInbox, AdminSupportThread } from '../../../modules/admin/types'
import type { SupportHours } from '../../../modules/support/types'
import { describeSupportHours, isSupportOnline } from '../../../modules/support/hours'
import { usePoll } from '../../../modules/support/usePoll'
import { useIdentity } from '../../../modules/identity/IdentityContext'
import { isFullAdmin } from '../../../modules/admin/permissions'

function message(err: unknown) {
  return err instanceof Error ? err.message : String(err)
}

// Admin → Support: the team's inbox. Open conversations waiting for an
// answer come first; replies reach the member on the site and, when they
// aren't in the chat right now, by e-mail.
export default function AdminSupportPage() {
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('c')
  const tab = params.get('tab') === 'closed' ? 'closed' : 'open'
  // Support hours are changed by Admins only.
  const canEditHours = isFullAdmin(useIdentity().user)
  const [inbox, setInbox] = useState<AdminSupportInbox | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState<string>()
  const [thread, setThread] = useState<AdminSupportThread | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [editingHours, setEditingHours] = useState(false)
  const [hoursError, setHoursError] = useState<string | null>(null)
  const [online, setOnline] = useState(false)

  const loadInbox = useCallback(async () => {
    const next = await adminService.listSupport(tab)
    setInbox(next)
    setOnline(next.online)
  }, [tab])

  const loadThread = useCallback(async (id: string) => {
    setThread(await adminService.getSupportThread(id))
  }, [])

  useEffect(() => {
    setStatus('loading')
    loadInbox()
      .then(() => setStatus('ready'))
      .catch((err: unknown) => {
        setLoadError(message(err))
        setStatus('error')
      })
  }, [loadInbox])

  useEffect(() => {
    setThread(null)
    setError(null)
    setNotice(null)
    if (selectedId) loadThread(selectedId).catch((err: unknown) => setError(message(err)))
  }, [selectedId, loadThread])

  usePoll(() => inbox && setOnline(isSupportOnline(inbox.hours)), 60_000, Boolean(inbox))
  usePoll(() => void loadInbox().catch(() => undefined), 10_000, status === 'ready')
  usePoll(() => selectedId && void loadThread(selectedId).catch(() => undefined), 4_000, Boolean(selectedId))

  function select(id: string | null) {
    const next: Record<string, string> = {}
    if (tab === 'closed') next.tab = 'closed'
    if (id) next.c = id
    setParams(next)
  }

  async function reply(text: string) {
    if (!selectedId) return false
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const emailed = await adminService.replySupport(selectedId, text)
      if (emailed) setNotice('Reply sent — the member was also notified by e-mail.')
      await Promise.all([loadThread(selectedId), loadInbox()])
      return true
    } catch (err) {
      setError(message(err))
      return false
    } finally {
      setBusy(false)
    }
  }

  async function setConversationStatus(next: 'open' | 'closed') {
    if (!selectedId) return
    setBusy(true)
    setError(null)
    try {
      await adminService.setSupportStatus(selectedId, next)
      await Promise.all([loadThread(selectedId), loadInbox()])
    } catch (err) {
      setError(message(err))
    } finally {
      setBusy(false)
    }
  }

  async function saveHours(hours: SupportHours) {
    setBusy(true)
    setHoursError(null)
    try {
      await adminService.saveSupportHours(hours)
      await loadInbox()
      setEditingHours(false)
    } catch (err) {
      setHoursError(message(err))
    } finally {
      setBusy(false)
    }
  }

  const member = thread?.conversation.users
  const conversations = inbox?.conversations ?? []

  return (
    <div className="mx-auto max-w-6xl">
      <SEO title="Support · Admin" description="Support inbox." path="/platform/admin/support" />
      <SectionHeader
        eyebrow="Admin"
        title="Support"
        description="Talk to members: live chat during support hours, tickets outside them."
        className="mb-6"
      />

      {status === 'loading' && !inbox ? (
        <p className="py-16 text-center text-[14px] text-navy/40">Loading support…</p>
      ) : status === 'error' || !inbox ? (
        <EmptyState icon={Headset} title="We couldn’t load the support inbox." description={loadError} />
      ) : (
        <div className="space-y-5">
          <div className={`${CARD} p-4`}>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${
                  online ? 'bg-emerald-50 text-emerald-700' : 'bg-navy/[0.05] text-navy/55'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-navy/30'}`} />
                {online ? 'Online — live chat' : 'Offline — tickets'}
              </span>
              <p className="min-w-0 flex-1 text-[13px] text-navy/55">{describeSupportHours(inbox.hours)}</p>
              {canEditHours && !editingHours && (
                <button
                  type="button"
                  onClick={() => setEditingHours(true)}
                  className={`${LINK_BUTTON} inline-flex items-center gap-1.5 text-primary hover:bg-bg-soft`}
                >
                  <Settings2 size={14} /> Change hours
                </button>
              )}
            </div>
            {editingHours && (
              <div className="mt-4 border-t border-navy/[0.06] pt-4">
                <SupportHoursForm
                  hours={inbox.hours}
                  busy={busy}
                  error={hoursError}
                  onSave={saveHours}
                  onCancel={() => {
                    setEditingHours(false)
                    setHoursError(null)
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
            <aside className={`${CARD} h-fit overflow-hidden ${selectedId ? 'hidden lg:block' : ''}`}>
              <div className="flex border-b border-navy/[0.06] text-[13px] font-semibold">
                {(['open', 'closed'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setParams(t === 'closed' ? { tab: 'closed' } : {})}
                    className={`flex-1 px-4 py-3 transition-colors ${tab === t ? 'border-b-2 border-primary text-primary' : 'text-navy/50 hover:text-navy'}`}
                  >
                    {t === 'open' ? `Open${inbox.waiting ? ` · ${inbox.waiting} waiting` : ''}` : 'Closed'}
                  </button>
                ))}
              </div>
              {conversations.length === 0 ? (
                <p className="px-4 py-6 text-[13px] text-navy/45">
                  {tab === 'open' ? 'No open conversations. All caught up.' : 'No closed conversations yet.'}
                </p>
              ) : (
                <SupportConversationList
                  activeId={selectedId}
                  onSelect={select}
                  items={conversations.map((c) => ({
                    id: c.id,
                    title: c.users?.full_name || c.users?.email || 'Member',
                    subtitle: c.subject,
                    time: c.last_message_at,
                    badge: c.status === 'open' && c.last_sender === 'customer' ? 'Waiting' : undefined,
                    muted: c.status === 'closed',
                  }))}
                />
              )}
            </aside>

            <section className={`${CARD} flex min-h-[460px] flex-col p-5 ${selectedId ? '' : 'hidden lg:flex'}`}>
              {!selectedId ? (
                <p className="m-auto text-[14px] text-navy/45">Pick a conversation to answer.</p>
              ) : !thread ? (
                error ? <p className="text-[13px] text-red-500">{error}</p> : <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-navy/[0.06] pb-3">
                    <button
                      type="button"
                      onClick={() => select(null)}
                      aria-label="Back to inbox"
                      className="grid h-8 w-8 place-items-center rounded-full text-navy/50 hover:bg-bg-soft lg:hidden"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-display text-lg font-bold text-navy">{thread.conversation.subject}</h2>
                      <p className="truncate text-[12.5px] text-navy/50">
                        <Link to={`/platform/admin/members/${thread.conversation.user_id}`} className="hover:text-primary hover:underline">
                          {member?.full_name ? `${member.full_name} · ` : ''}
                          {member?.email ?? 'Member'}
                        </Link>
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConversationStatus(thread.conversation.status === 'open' ? 'closed' : 'open')}
                      className={`${LINK_BUTTON} border border-navy/10 text-navy/60 hover:bg-bg-soft`}
                    >
                      {thread.conversation.status === 'open' ? 'Close conversation' : 'Reopen'}
                    </button>
                  </div>
                  <div className="max-h-[55vh] flex-1 overflow-y-auto pr-1">
                    <SupportMessageList messages={thread.messages} mine="staff" />
                  </div>
                  <div className="mt-4 border-t border-navy/[0.06] pt-4">
                    {error && <p className="mb-2 text-[13px] text-red-500">{error}</p>}
                    {notice && <p className="mb-2 text-[13px] text-emerald-700">{notice}</p>}
                    <SupportComposer busy={busy} onSend={reply} placeholder="Write a reply…" />
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
