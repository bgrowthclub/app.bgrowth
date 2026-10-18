import { useEffect, useMemo, useState } from 'react'
import { Send } from 'lucide-react'
import Button from '../ui/Button'
import AdminStatTile from './AdminStatTile'
import { CARD, INPUT, SMALL_BUTTON, formatDate, pillClass } from './styles'
import type { Tone } from './styles'
import { adminService } from '../../modules/admin/adminService'
import type { AdminWixContact, AdminWixContactsOverview, WixContactGroup } from '../../modules/admin/types'

const GROUPS: { id: WixContactGroup | 'all'; label: string }[] = [
  { id: 'contact', label: 'Contacts' },
  { id: 'team', label: 'Team & tests' },
  { id: 'spam', label: 'Spam / sales pitches' },
  { id: 'all', label: 'All' },
]

const ORIGIN: Record<string, string> = {
  WIX_FORMS: 'Form',
  WIX_SITE_MEMBERS: 'Member sign-up',
  WIX_STORES: 'Store',
  WIX_BOOKINGS: 'Booking',
  WIX_CHAT: 'Chat',
  WIX_APP: 'Wix app',
  ADMIN: 'Added by hand',
  THIRD_PARTY: 'Other app',
}

const DEFAULT_SUBJECT = 'BGrowth has a new home'
const DEFAULT_MESSAGE = `Hi there,

You were in touch with us on our previous site (benterprises.biz). We've moved — BGrowth now lives at bgrowth.app, with practical guides, ready-to-use planners and tools to help you start, organize and grow your business and your life in the US.

Would you like to hear from us? Click the button below and we'll send you our newsletter with new guides and tools. If not, no worries: this is the only e-mail you'll get from us.

— The BGrowth team`

// Who can still be invited: never invited, didn't opt out on Wix, and not
// already on the newsletter or with an account here.
function canInvite(c: AdminWixContact) {
  return !c.invited_at && !c.unsubscribed_before && !c.subscribed && !c.member
}

function status(c: AdminWixContact): { label: string; tone: Tone } {
  if (c.accepted_at) return { label: `Accepted · ${formatDate(c.accepted_at)}`, tone: 'green' }
  if (c.subscribed) return { label: 'On the newsletter', tone: 'green' }
  if (c.member) return { label: 'Has an account', tone: 'green' }
  if (c.unsubscribed_before) return { label: 'Opted out on Wix', tone: 'red' }
  if (c.invited_at) return { label: `Invited · ${formatDate(c.invited_at)}`, tone: 'blue' }
  return { label: 'Not invited', tone: 'gray' }
}

// Admin → Newsletter → Wix contacts (Portal migration 0056): the people who
// were in touch with the old Wix site. They never agreed to our e-mails, so
// they get ONE invite; only who clicks "Yes, keep me posted" joins.
export default function WixContactsPanel() {
  const [data, setData] = useState<AdminWixContactsOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [group, setGroup] = useState<WixContactGroup | 'all'>('contact')
  const [picked, setPicked] = useState<string[]>([])
  const [subject, setSubject] = useState(DEFAULT_SUBJECT)
  const [message, setMessage] = useState(DEFAULT_MESSAGE)
  const [busy, setBusy] = useState<string | null>(null)

  function load() {
    adminService
      .getWixContacts()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the contacts.'))
  }

  useEffect(load, [])

  const contacts = data?.contacts ?? []
  const visible = useMemo(() => contacts.filter((c) => group === 'all' || c.grp === group), [contacts, group])
  const invitable = visible.filter(canInvite)
  const counts = {
    contacts: contacts.filter((c) => c.grp === 'contact').length,
    invited: contacts.filter((c) => c.invited_at).length,
    accepted: contacts.filter((c) => c.accepted_at || c.subscribed || c.member).length,
  }

  function toggle(id: string) {
    setPicked((list) => (list.includes(id) ? list.filter((p) => p !== id) : [...list, id]))
  }

  async function setGroupOf(c: AdminWixContact, grp: WixContactGroup) {
    setError(null)
    try {
      await adminService.setWixContactGroup(c.id, grp)
      setData((d) => (d ? { ...d, contacts: d.contacts.map((x) => (x.id === c.id ? { ...x, grp } : x)) } : d))
      setPicked((list) => list.filter((p) => p !== c.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t change it.')
    }
  }

  async function sendTest() {
    setBusy('test')
    setError(null)
    setNotice(null)
    try {
      setNotice(`Test sent to ${await adminService.sendWixInviteTest(subject, message)}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t send the test.')
    } finally {
      setBusy(null)
    }
  }

  async function sendInvites() {
    if (!window.confirm(`Send the one-time invite to ${picked.length} contact(s)? Each person gets it only once.`)) return
    setBusy('send')
    setError(null)
    setNotice(null)
    try {
      const r = await adminService.sendWixInvites(picked, subject, message)
      setNotice(`Invite sent to ${r.sent} contact(s).${r.skipped ? ` ${r.skipped} skipped (already invited or opted out).` : ''}`)
      setPicked([])
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t send the invites.')
    } finally {
      setBusy(null)
    }
  }

  if (!data) {
    return error ? <p className="text-[14px] text-red-500">{error}</p> : <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
  }
  if (!data.ready) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-700">
        Run the database update (Portal migration 0056) and then the Wix contacts file to use this tab.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <details className={`${CARD} px-5 py-3 text-[13.5px] text-navy/70`}>
        <summary className="cursor-pointer font-semibold text-navy">How it works</summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>These are the people who were in touch with the old Wix site (contact forms, members, store, chat…). They are not subscribers or members here.</li>
          <li>
            They never agreed to receive our e-mails, so each person can get <strong>one invite</strong> only. Who clicks “Yes, keep me posted” joins the
            newsletter (status “Accepted”); the others are not e-mailed again.
          </li>
          <li>
            Each contact is in a group: <strong>Contacts</strong> (real people to invite), <strong>Team &amp; tests</strong> (us, our test accounts) or{' '}
            <strong>Spam / sales pitches</strong> (offers and fake “Wix support” messages sent through the contact form). The groups were suggested
            automatically — change any of them in the list.
          </li>
          <li>Tick who should get the invite, check the text, send yourself a test, then send. Best after the site opens.</li>
          <li>People who opted out on Wix, already have an account or already get the newsletter can’t be ticked.</li>
          <li>Every send is listed in Admin → Activity.</li>
        </ul>
      </details>

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStatTile label="Contacts to consider" value={String(counts.contacts)} hint={`${contacts.length} in total`} />
        <AdminStatTile label="Invited" value={String(counts.invited)} />
        <AdminStatTile label="Joined" value={String(counts.accepted)} hint="Accepted, subscribed or with an account" />
      </div>

      <div className="flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGroup(g.id)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
              g.id === group ? 'bg-primary text-white' : 'bg-bg-soft text-navy/60 hover:text-navy'
            }`}
          >
            {g.label} ({g.id === 'all' ? contacts.length : contacts.filter((c) => c.grp === g.id).length})
          </button>
        ))}
      </div>

      <div className={`${CARD} overflow-hidden`}>
        <div className="flex items-center justify-between gap-3 border-b border-navy/[0.06] px-5 py-3 text-[13px]">
          <label className="flex items-center gap-2 font-semibold text-navy">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              disabled={invitable.length === 0}
              checked={invitable.length > 0 && invitable.every((c) => picked.includes(c.id))}
              onChange={(e) =>
                setPicked((list) =>
                  e.target.checked ? [...new Set([...list, ...invitable.map((c) => c.id)])] : list.filter((id) => !invitable.some((c) => c.id === id)),
                )
              }
            />
            Tick all that can be invited ({invitable.length})
          </label>
          <span className="text-navy/45">{picked.length} ticked</span>
        </div>
        {visible.length === 0 ? (
          <p className="p-6 text-[13.5px] text-navy/40">No contacts in this group.</p>
        ) : (
          <ul className="divide-y divide-navy/[0.06]">
            {visible.map((c) => {
              const st = status(c)
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    disabled={!canInvite(c)}
                    checked={picked.includes(c.id)}
                    onChange={() => toggle(c.id)}
                    aria-label={`Invite ${c.email}`}
                  />
                  <div className="min-w-[200px] flex-1">
                    <p className="text-[13.5px] font-semibold text-navy">{c.name || c.email}</p>
                    <p className="text-[12px] text-navy/45">
                      {c.name ? `${c.email} · ` : ''}
                      {ORIGIN[c.origin ?? ''] ?? c.origin ?? 'Wix'} · {formatDate(c.external_created_at)}
                      {c.was_member ? ' · was a member' : ''}
                      {c.had_free_plan ? ' · Notary free plan' : ''}
                    </p>
                  </div>
                  <span className={pillClass(st.tone)}>{st.label}</span>
                  <select
                    value={c.grp}
                    onChange={(e) => void setGroupOf(c, e.target.value as WixContactGroup)}
                    aria-label="Group"
                    className="rounded-lg border border-navy/10 bg-white px-2 py-1 text-[12.5px] text-navy"
                  >
                    <option value="contact">Contact</option>
                    <option value="team">Team / test</option>
                    <option value="spam">Spam</option>
                  </select>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className={`${CARD} space-y-4 p-6`}>
        <div>
          <p className="text-[14px] font-semibold text-navy">The invite</p>
          <p className="mt-0.5 text-[12.5px] text-navy/45">
            The e-mail adds a “Yes, keep me posted” button, a link to create a free account, and the mailing address at the bottom. Leave a blank
            line between paragraphs.
          </p>
        </div>
        <label className="block">
          <span className="text-[13px] font-semibold text-navy">Subject</span>
          <input className={`${INPUT} mt-1`} value={subject} maxLength={150} onChange={(e) => setSubject(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-[13px] font-semibold text-navy">Message</span>
          <textarea className={`${INPUT} mt-1 leading-relaxed`} rows={10} value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>
        {!data.address && <p className="text-[13px] text-amber-700">Add the mailing address on the Newsletter tab first — it’s required to send.</p>}
        {notice && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-700">{notice}</p>}
        {error && <p className="text-[13.5px] text-red-500">{error}</p>}
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" disabled={busy !== null} onClick={() => void sendTest()} className={SMALL_BUTTON}>
            {busy === 'test' ? 'Sending…' : 'Send me a test'}
          </Button>
          <Button type="button" disabled={busy !== null || picked.length === 0} onClick={() => void sendInvites()} className={SMALL_BUTTON} icon={<Send size={15} />}>
            {busy === 'send' ? 'Sending…' : `Send invite to ${picked.length}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
