import { useState } from 'react'
import { reportMemberPage } from '../../modules/find/memberPageService'

// "Report this page" at the foot of a public member page (08/11/2026).
//
// Whatever the team reviews before publishing, the person who finds the bad
// page is the one who lands on it. This is the way in — deliberately quiet,
// because it is for the rare visitor who needs it, not a button that makes
// an honest page look suspect.
//
// Nothing about the reporter is sent: no name, no e-mail. Asking who is
// complaining is mostly a reason not to complain.
export default function ReportPageLink({ slug, language, preview = false }: { slug: string; language: 'en' | 'pt'; preview?: boolean }) {
  const t = TEXT[language === 'pt' ? 'pt' : 'en']
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  if (preview) return null

  if (sent) return <p className="mt-3 text-center text-[12px] text-navy/40">{t.thanks}</p>

  if (!open) {
    return (
      <p className="mt-3 text-center">
        <button type="button" onClick={() => setOpen(true)} className="text-[11.5px] text-navy/25 underline-offset-2 transition-colors hover:text-navy/50 hover:underline">
          {t.report}
        </button>
      </p>
    )
  }

  return (
    <div className="mx-auto mt-3 w-full max-w-sm rounded-xl border border-navy/10 bg-white p-4 text-left">
      <p className="text-[13px] font-semibold text-navy">{t.title}</p>
      <div className="mt-2 space-y-1.5">
        {REASONS.map((r) => (
          <label key={r.id} className="flex items-center gap-2 text-[13px] text-navy/70">
            <input type="radio" name="report-reason" className="h-3.5 w-3.5 accent-primary" checked={reason === r.id} onChange={() => setReason(r.id)} />
            {r[language === 'pt' ? 'pt' : 'en']}
          </label>
        ))}
      </div>
      <textarea
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder={t.detail}
        aria-label={t.detail}
        className="mt-2 w-full rounded-lg border border-navy/10 px-3 py-2 text-[13px] text-navy focus:border-primary/40 focus:outline-none"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          disabled={!reason || busy}
          onClick={() => {
            setBusy(true)
            // A report that fails is still a thank-you: the visitor did
            // their part, and a red error here only teaches them not to
            // bother next time. The failure is logged on the server.
            reportMemberPage(slug, reason, detail)
              .catch(() => undefined)
              .finally(() => {
                setBusy(false)
                setSent(true)
              })
          }}
          className="rounded-lg bg-navy px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-40"
        >
          {busy ? t.sending : t.send}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[12.5px] font-semibold text-navy/45 hover:text-navy">
          {t.cancel}
        </button>
      </div>
    </div>
  )
}

const REASONS = [
  { id: 'scam', en: 'It looks like a scam', pt: 'Parece golpe' },
  { id: 'adult', en: 'Adult content', pt: 'Conteúdo adulto' },
  { id: 'illegal', en: 'Illegal content', pt: 'Conteúdo ilegal' },
  { id: 'impersonation', en: 'It pretends to be someone else', pt: 'Se passa por outra pessoa' },
  { id: 'not-working', en: 'Something is broken', pt: 'Alguma coisa está quebrada' },
  { id: 'other', en: 'Something else', pt: 'Outro motivo' },
]

const TEXT = {
  en: {
    report: 'Report this page',
    title: 'What’s wrong with this page?',
    detail: 'Anything else we should know (optional)',
    send: 'Send',
    sending: 'Sending…',
    cancel: 'Cancel',
    thanks: 'Thank you — our team will look at it.',
  },
  pt: {
    report: 'Denunciar esta página',
    title: 'O que há de errado nesta página?',
    detail: 'Mais alguma coisa que a gente deva saber (opcional)',
    send: 'Enviar',
    sending: 'Enviando…',
    cancel: 'Cancelar',
    thanks: 'Obrigado — nosso time vai olhar.',
  },
}
