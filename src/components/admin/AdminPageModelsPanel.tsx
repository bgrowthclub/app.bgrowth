import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Button from '../ui/Button'
import { CARD, INPUT, SMALL_BUTTON, LINK_BUTTON, formatDate, pillClass } from './styles'
import { adminService } from '../../modules/admin/adminService'
import type { AdminPageTemplates } from '../../modules/admin/types'
import { memberPageTemplates } from '../../modules/find/memberPageTemplates'

// Admin → Pages → Page models (14/11/2026, the owner's decision): how many
// pages use each model, and retiring one. A retired model gets an end date
// and a replacement: nobody can pick it from then on, its pages keep working,
// and on the end date the daily job moves every page still on it to the
// replacement (texts, buttons and photos stay). "Tell the owners" sends each
// owner a message in their Support conversation, which also e-mails them.

const DEFAULT_MESSAGE = (from: string, to: string, date: string) =>
  `Hi! The “${from}” model of your BGrowth page is being retired. On ${date} your page will move to the “${to}” model on its own — your texts, buttons and photos stay as they are. If you prefer another model, you can switch any time before that in My Business Page.

Olá! O modelo “${from}” da sua página BGrowth vai ser descontinuado. Em ${date} sua página passa sozinha para o modelo “${to}” — seus textos, botões e fotos continuam iguais. Se preferir outro modelo, você pode trocar antes disso em My Business Page.`

const nameOf = (id: string) => memberPageTemplates('en').find((t) => t.id === id)?.name.en ?? id
const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)

export default function AdminPageModelsPanel() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<AdminPageTemplates | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')
  // The model being archived or told, and the form's values.
  const [archiving, setArchiving] = useState<string | null>(null)
  const [endsAt, setEndsAt] = useState('')
  const [replaceWith, setReplaceWith] = useState('')
  const [telling, setTelling] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [showPages, setShowPages] = useState<string | null>(null)

  const load = () =>
    adminService
      .getPageTemplates()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load the models.'))

  useEffect(() => {
    if (open && !data) void load()
  }, [open])

  async function run(key: string, fn: () => Promise<string>) {
    setBusy(key)
    setError('')
    setNotice('')
    try {
      setNotice(await fn())
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy('')
    }
  }

  const archive = data?.archive ?? {}
  const live = memberPageTemplates('en').filter((t) => !archive[t.id] || archive[t.id].finishedAt)

  return (
    <div className={`${CARD} p-5`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <span>
          <span className="block font-display text-[16px] font-bold text-navy">Page models</span>
          <span className="block text-[13px] text-navy/50">How many pages use each model, and retiring a model on a date you choose.</span>
        </span>
        {open ? <ChevronUp size={18} className="text-navy/40" /> : <ChevronDown size={18} className="text-navy/40" />}
      </button>

      {open && (
        <div className="mt-5 space-y-3">
          {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}
          {error && <p className="text-[13.5px] text-red-500">{error}</p>}
          {!data && !error && <p className="text-[13.5px] text-navy/40">Loading…</p>}

          {data &&
            memberPageTemplates('en').map((t) => {
              const pages = data.usage[t.id] ?? []
              const entry = archive[t.id]
              const owners = pages.filter((p) => p.hasOwner).length
              return (
                <div key={t.id} className="rounded-xl border border-navy/[0.08] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-navy">{t.name.en}</p>
                    {!entry ? (
                      <span className={pillClass('green')}>Active</span>
                    ) : entry.finishedAt ? (
                      <span className={pillClass('gray')}>Retired {formatDate(entry.finishedAt)} · {entry.moved ?? 0} moved to {nameOf(entry.replaceWith)}</span>
                    ) : (
                      <span className={pillClass('amber')}>Retiring · on {formatDate(`${entry.endsAt}T12:00:00`)} pages move to {nameOf(entry.replaceWith)}</span>
                    )}
                    <button type="button" onClick={() => setShowPages(showPages === t.id ? null : t.id)} className={`${LINK_BUTTON} text-primary hover:bg-bg-soft`}>
                      {pages.length === 1 ? '1 page' : `${pages.length} pages`}
                    </button>
                    <span className="ml-auto flex flex-wrap gap-1">
                      {!entry && (
                        <button
                          type="button"
                          onClick={() => {
                            setArchiving(t.id)
                            setEndsAt(tomorrow())
                            setReplaceWith(live.find((x) => x.id !== t.id)?.id ?? '')
                          }}
                          className={`${LINK_BUTTON} text-navy/60 hover:bg-bg-soft`}
                        >
                          Archive
                        </button>
                      )}
                      {entry && !entry.finishedAt && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setTelling(t.id)
                              setMessage(DEFAULT_MESSAGE(t.name.en, nameOf(entry.replaceWith), formatDate(`${entry.endsAt}T12:00:00`)))
                            }}
                            className={`${LINK_BUTTON} text-primary hover:bg-bg-soft`}
                          >
                            {entry.notifiedAt ? 'Tell the owners again' : 'Tell the owners'}
                          </button>
                          <button
                            type="button"
                            disabled={busy !== ''}
                            onClick={() => void run(`undo-${t.id}`, async () => (await adminService.unarchivePageTemplate(t.id), `“${t.name.en}” is active again.`))}
                            className={`${LINK_BUTTON} text-navy/60 hover:bg-bg-soft`}
                          >
                            Undo
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                  {entry?.notifiedAt && !entry.finishedAt && <p className="mt-1 text-[12.5px] text-navy/45">Owners told on {formatDate(entry.notifiedAt)}.</p>}

                  {showPages === t.id && (
                    <ul className="mt-3 space-y-1 text-[13px] text-navy/70">
                      {pages.length === 0 && <li className="text-navy/40">No page uses this model.</li>}
                      {pages.map((p) => (
                        <li key={p.id}>
                          {p.name} · bgrowth.app/p/{p.slug} · {p.status}
                          {!p.hasOwner && <span className="text-navy/40"> · no account (made by the team)</span>}
                        </li>
                      ))}
                    </ul>
                  )}

                  {archiving === t.id && (
                    <div className="mt-4 space-y-3 rounded-xl bg-bg-soft p-4">
                      <p className="text-[13px] text-navy/65">
                        From now on nobody can choose “{t.name.en}”. Its {pages.length === 1 ? 'page keeps' : `${pages.length} pages keep`} working until the end date, then move on their own to the model you pick — texts, buttons and photos stay.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-[12.5px] font-semibold text-navy/60">
                          End date
                          <input type="date" min={tomorrow()} value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={`${INPUT} mt-1`} />
                        </label>
                        <label className="text-[12.5px] font-semibold text-navy/60">
                          Move the pages to
                          <select value={replaceWith} onChange={(e) => setReplaceWith(e.target.value)} className={`${INPUT} mt-1`}>
                            {live
                              .filter((x) => x.id !== t.id)
                              .map((x) => (
                                <option key={x.id} value={x.id}>
                                  {x.name.en}
                                </option>
                              ))}
                          </select>
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={busy !== '' || !endsAt || !replaceWith}
                          onClick={() =>
                            void run(`archive-${t.id}`, async () => {
                              await adminService.archivePageTemplate(t.id, endsAt, replaceWith)
                              setArchiving(null)
                              return `“${t.name.en}” is archived. Next: tell the owners.`
                            })
                          }
                          className={SMALL_BUTTON}
                        >
                          Archive “{t.name.en}”
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setArchiving(null)} className={SMALL_BUTTON}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {telling === t.id && entry && (
                    <div className="mt-4 space-y-3 rounded-xl bg-bg-soft p-4">
                      <p className="text-[13px] text-navy/65">
                        Goes to each owner as a message in their Support conversation, and by e-mail. {owners === 1 ? '1 owner' : `${owners} owners`} will get it
                        {pages.length > owners ? `; ${pages.length - owners} page${pages.length - owners === 1 ? ' has' : 's have'} no account to tell` : ''}.
                      </p>
                      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} maxLength={4000} className={INPUT} aria-label="Message to the owners" />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={busy !== '' || !message.trim() || owners === 0}
                          onClick={() =>
                            void run(`tell-${t.id}`, async () => {
                              const r = await adminService.notifyPageTemplateOwners(t.id, message)
                              setTelling(null)
                              return `Sent to ${r.sent} ${r.sent === 1 ? 'owner' : 'owners'}${r.noOwner ? ` (${r.noOwner} page${r.noOwner === 1 ? '' : 's'} without an account)` : ''}.`
                            })
                          }
                          className={SMALL_BUTTON}
                        >
                          Send
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setTelling(null)} className={SMALL_BUTTON}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
