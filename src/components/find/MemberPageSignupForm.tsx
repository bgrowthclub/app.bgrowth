import { useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, Mail } from 'lucide-react'
import { getCaptchaToken } from '../../lib/captcha'
import { MEMBER_PAGE_LABELS, joinMemberPageList } from '../../modules/find/memberPageService'
import type { MemberPage } from '../../modules/find/types'

interface Props {
  slug?: string
  ownerName: string
  title?: string
  body?: string
  button?: string
  language: MemberPage['language']
  // In the editor's preview nothing is sent.
  preview?: boolean
  headingClass?: string
}

const FIELD = 'w-full rounded-xl border border-navy/10 bg-white px-3.5 py-2.5 text-[14.5px] text-navy outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15'

// "Get updates" on a member page (Sprint 139): the visitor leaves their
// e-mail (name and WhatsApp optional) for the page's owner, with consent.
export default function MemberPageSignupForm({ slug, ownerName, title, body, button, language, preview = false, headingClass }: Props) {
  const t = MEMBER_PAGE_LABELS[language] ?? MEMBER_PAGE_LABELS.en
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [consent, setConsent] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (preview || !slug) return
    setError(null)
    setState('sending')
    try {
      const captchaToken = await getCaptchaToken('page_signup')
      await joinMemberPageList({ slug, email: email.trim(), name: name.trim(), whatsapp: whatsapp.trim(), captchaToken })
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Try again.')
      setState('idle')
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-navy/[0.08] bg-white p-6 text-center shadow-softer md:p-8">
      <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        <Mail size={22} aria-hidden />
      </span>
      <h2 className={headingClass ?? 'font-display text-2xl font-bold tracking-tight text-navy'}>{title?.trim() || t.signupTitle}</h2>
      {body?.trim() && <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-navy/65">{body}</p>}

      {state === 'done' ? (
        <p className="mt-6 inline-flex items-center gap-2 font-semibold text-emerald-600">
          <CheckCircle2 size={18} aria-hidden /> {t.signupDone}
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3 text-left">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.signupEmail} aria-label={t.signupEmail} className={FIELD} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder={t.signupName} aria-label={t.signupName} className={FIELD} />
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} maxLength={40} placeholder={t.signupWhatsapp} aria-label={t.signupWhatsapp} className={FIELD} />
          </div>
          <label className="flex items-start gap-2 text-[13px] text-navy/65">
            <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[rgb(var(--color-primary-rgb))]" />
            <span>
              {t.signupConsent} {ownerName}.
            </span>
          </label>
          {error && <p className="text-[13px] text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={state === 'sending' || preview}
            className="w-full rounded-xl bg-primary px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-70"
          >
            {state === 'sending' ? '…' : button?.trim() || t.signupButton}
          </button>
          <p className="text-center text-[11.5px] text-navy/40">{t.signupNote}</p>
        </form>
      )}
    </div>
  )
}
