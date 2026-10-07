import { Suspense, lazy, useEffect, useState } from 'react'
import { ArrowLeft, Eye, Send, TestTube2, Trash2 } from 'lucide-react'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import InterestPicker from '../newsletter/InterestPicker'
import { CARD, INPUT, SMALL_BUTTON, formatDate, pillClass } from './styles'
import { adminService } from '../../modules/admin/adminService'
import type { AdminNewsletterCampaign } from '../../modules/admin/types'
import type { GrowthCategoryId } from '../../types/growth'

// The editor (TipTap) loads only here, so visitors never download it.
const NewsletterEditor = lazy(() => import('./NewsletterEditor'))

interface Props {
  // Null = a brand-new e-mail.
  campaign: AdminNewsletterCampaign | null
  addressMissing: boolean
  onBack: () => void
  // After save/send/delete, so the list stays current.
  onChanged: () => void
}

// Writing one newsletter e-mail: subject, audience by area, body with
// images, preview, a test to yourself, then the real send.
export default function NewsletterCampaignForm({ campaign, addressMissing, onBack, onChanged }: Props) {
  const [id, setId] = useState(campaign?.id)
  const [status, setStatus] = useState(campaign?.status ?? 'draft')
  const [subject, setSubject] = useState(campaign?.subject ?? '')
  const [preheader, setPreheader] = useState(campaign?.preheader ?? '')
  const [bodyHtml, setBodyHtml] = useState(campaign?.body_html ?? '')
  const [areas, setAreas] = useState<GrowthCategoryId[]>(campaign?.audience_areas ?? [])
  const [audience, setAudience] = useState<number | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState<null | 'save' | 'preview' | 'test' | 'send' | 'delete'>(null)
  const [confirm, setConfirm] = useState<null | 'send' | 'delete'>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sent = status !== 'draft'

  useEffect(() => {
    let cancelled = false
    setAudience(null)
    adminService
      .countNewsletterAudience(areas)
      .then((n) => !cancelled && setAudience(n))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [areas])

  // Sent e-mails open straight on their preview.
  useEffect(() => {
    if (sent) void showPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function run<T>(kind: NonNullable<typeof busy>, task: () => Promise<T>, done?: (result: T) => string) {
    setBusy(kind)
    setError(null)
    setNotice(null)
    try {
      const result = await task()
      if (done) setNotice(done(result))
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      return undefined
    } finally {
      setBusy(null)
    }
  }

  async function save(quiet = false) {
    const saved = await run(
      'save',
      () => adminService.saveNewsletterCampaign({ id, subject, preheader, bodyHtml, audienceAreas: areas }),
      quiet ? undefined : () => 'Draft saved.',
    )
    if (saved) {
      setId(saved.id)
      onChanged()
    }
    return saved
  }

  async function showPreview() {
    const html = await run('preview', () => adminService.previewNewsletter({ subject, preheader, bodyHtml }))
    if (html) setPreview(html)
  }

  async function sendTest() {
    const saved = await save(true)
    if (!saved) return
    await run('test', () => adminService.sendNewsletterTest(saved.id), (to) => `Test sent to ${to}. Check your inbox.`)
  }

  async function sendNow() {
    const saved = await save(true)
    if (!saved) return setConfirm(null)
    const count = await run('send', () => adminService.sendNewsletter(saved.id), (n) => `Sent to ${n} subscriber${n === 1 ? '' : 's'}.`)
    setConfirm(null)
    if (count !== undefined) {
      setStatus('sent')
      onChanged()
    }
  }

  async function remove() {
    if (!id) return onBack()
    const ok = await run('delete', () => adminService.deleteNewsletterCampaign(id))
    setConfirm(null)
    if (ok !== undefined) {
      onChanged()
      onBack()
    }
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
        <ArrowLeft size={16} />
        All e-mails
      </button>

      {sent && campaign && (
        <div className={`${CARD} flex flex-wrap items-center gap-3 p-5`}>
          <span className={pillClass('green')}>Sent</span>
          <p className="text-[14px] text-navy/70">
            Sent to {campaign.sent_count} subscriber{campaign.sent_count === 1 ? '' : 's'} on {formatDate(campaign.sent_at)}. Sent e-mails can’t be edited.
          </p>
        </div>
      )}

      <div className={`${CARD} space-y-5 p-6`}>
        <div>
          <label htmlFor="nl-subject" className="text-[13px] font-semibold text-navy">Subject</label>
          <input id="nl-subject" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={sent} maxLength={200} placeholder="New on BGrowth: …" className={`${INPUT} mt-1.5`} />
        </div>
        <div>
          <label htmlFor="nl-preheader" className="text-[13px] font-semibold text-navy">
            Preview text <span className="font-normal text-navy/45">— the line shown after the subject in the inbox</span>
          </label>
          <input id="nl-preheader" value={preheader} onChange={(e) => setPreheader(e.target.value)} disabled={sent} maxLength={200} className={`${INPUT} mt-1.5`} />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-navy">Who gets it</p>
          <p className="mb-3 mt-0.5 text-[12.5px] text-navy/45">
            Subscribers interested in these areas (and everyone who picked “All topics”). “All topics” here = every subscriber.
          </p>
          <InterestPicker value={areas} onChange={setAreas} disabled={sent} />
          <p className="mt-3 text-[13px] font-medium text-navy/70">
            {audience === null ? 'Counting…' : `Goes to ${audience} subscriber${audience === 1 ? '' : 's'}.`}
          </p>
        </div>
      </div>

      <Suspense fallback={<div className={`${CARD} p-6 text-[14px] text-navy/40`}>Loading editor…</div>}>
        <NewsletterEditor value={bodyHtml} onChange={setBodyHtml} readOnly={sent} />
      </Suspense>

      {!sent && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={() => void save()} disabled={busy !== null} className={SMALL_BUTTON}>
            {busy === 'save' ? 'Saving…' : 'Save draft'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => void showPreview()} disabled={busy !== null} className={SMALL_BUTTON} icon={<Eye size={15} />}>
            Preview
          </Button>
          <Button type="button" variant="secondary" onClick={() => void sendTest()} disabled={busy !== null || addressMissing} className={SMALL_BUTTON} icon={<TestTube2 size={15} />}>
            {busy === 'test' ? 'Sending test…' : 'Send test to me'}
          </Button>
          <Button type="button" onClick={() => setConfirm('send')} disabled={busy !== null || addressMissing || !audience} className={SMALL_BUTTON} icon={<Send size={15} />}>
            Send…
          </Button>
          <button type="button" onClick={() => setConfirm('delete')} disabled={busy !== null} className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-navy/45 hover:text-red-600">
            <Trash2 size={15} />
            Delete draft
          </button>
        </div>
      )}
      {addressMissing && !sent && (
        <p className="text-[13px] text-amber-700">Add the mailing address on the Newsletter page before testing or sending (US law requires it in every e-mail).</p>
      )}
      {notice && <p role="status" className="text-[14px] font-medium text-primary">{notice}</p>}
      {error && <p className="text-[14px] text-red-500">{error}</p>}

      {preview && (
        <div className={`${CARD} overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-navy/[0.06] px-5 py-3">
            <p className="text-[13px] font-semibold text-navy">Preview</p>
            {!sent && (
              <button type="button" onClick={() => setPreview(null)} className="text-[12.5px] font-medium text-navy/45 hover:text-navy">
                Close
              </button>
            )}
          </div>
          <iframe title="E-mail preview" sandbox="" srcDoc={preview} className="h-[720px] w-full bg-bg-soft" />
        </div>
      )}

      <ConfirmDialog
        open={confirm === 'send'}
        title={`Send to ${audience ?? 0} subscriber${audience === 1 ? '' : 's'}?`}
        description="The e-mail goes out right away and can’t be undone or edited afterwards. Send yourself a test first if you haven’t."
        confirmLabel="Send now"
        busy={busy === 'send'}
        onConfirm={() => void sendNow()}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete this draft?"
        confirmLabel="Delete"
        tone="danger"
        busy={busy === 'delete'}
        onConfirm={() => void remove()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
