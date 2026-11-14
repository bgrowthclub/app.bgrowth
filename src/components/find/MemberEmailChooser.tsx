import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Copy, Mail, X } from 'lucide-react'
import type { MemberPage } from '../../modules/find/types'

// The e-mail button on a computer (14/11/2026, the owner's decision).
// A mailto: link opens the computer's mail PROGRAM, which most people never
// set up — they read e-mail in Gmail or Outlook in the browser — so the click
// did nothing, or opened a program they don't use. On a computer this asks
// where to write instead: Gmail, Outlook, the mail program, or copy the
// address. A phone always has a mail app, so there the link opens it directly.
//
// It listens for clicks on any mailto: link of the page, so every e-mail
// button — header, top, contact, final call, floating — behaves the same
// without each one knowing about it. The click still reaches the button's
// own handler, so the page's numbers keep counting it.

const LABELS = {
  en: { title: 'Send an e-mail to', gmail: 'Open in Gmail', outlook: 'Open in Outlook', app: 'Use my e-mail app', copy: 'Copy address', copied: 'Copied', close: 'Close' },
  pt: { title: 'Enviar um e-mail para', gmail: 'Abrir no Gmail', outlook: 'Abrir no Outlook', app: 'Usar meu app de e-mail', copy: 'Copiar endereço', copied: 'Copiado', close: 'Fechar' },
}

// A computer: a precise pointer (mouse or trackpad) and no touch screen.
function onComputer() {
  try {
    return window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(any-pointer: coarse)').matches
  } catch {
    return false
  }
}

export default function MemberEmailChooser({ language }: { language: MemberPage['language'] }) {
  const t = LABELS[language === 'pt' ? 'pt' : 'en']
  const [address, setAddress] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = (e.target as Element | null)?.closest?.('a[href^="mailto:"]') as HTMLAnchorElement | null
      if (!link || !onComputer()) return
      const raw = link.getAttribute('href')?.slice('mailto:'.length).split('?')[0] ?? ''
      let to = raw
      try {
        to = decodeURIComponent(raw)
      } catch {
        // keep it as written
      }
      if (!to) return
      e.preventDefault()
      setCopied(false)
      setAddress(to)
    }
    // Capture: runs before the page's own handlers, which still run after it.
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  useEffect(() => {
    if (!address) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAddress(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [address])

  if (!address) return null
  const to = encodeURIComponent(address)
  const option = 'flex w-full items-center gap-3 rounded-xl border border-navy/10 bg-white px-4 py-3 text-left text-[15px] font-semibold text-navy transition-colors hover:border-primary/40 hover:bg-bg-soft'

  return createPortal(
    <div className="no-print fixed inset-0 z-50 grid place-items-center bg-navy/40 p-5" onClick={() => setAddress(null)}>
      <div role="dialog" aria-modal="true" aria-label={t.title} className="w-full max-w-sm rounded-2xl bg-white p-6 text-navy shadow-glow" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-navy/55">{t.title}</p>
            <p className="mt-0.5 break-all font-display text-[17px] font-bold">{address}</p>
          </div>
          <button type="button" onClick={() => setAddress(null)} aria-label={t.close} title={t.close} className="rounded-lg p-1.5 text-navy/50 hover:bg-bg-soft hover:text-navy">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 grid gap-2">
          <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${to}`} target="_blank" rel="noreferrer" onClick={() => setAddress(null)} className={option}>
            <Mail size={18} className="text-primary" aria-hidden /> {t.gmail}
          </a>
          <a href={`https://outlook.live.com/mail/0/deeplink/compose?to=${to}`} target="_blank" rel="noreferrer" onClick={() => setAddress(null)} className={option}>
            <Mail size={18} className="text-primary" aria-hidden /> {t.outlook}
          </a>
          <button
            type="button"
            onClick={() => {
              setAddress(null)
              window.location.href = `mailto:${address}`
            }}
            className={option}
          >
            <Mail size={18} className="text-navy/50" aria-hidden /> {t.app}
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(address).then(
                () => setCopied(true),
                () => setCopied(false),
              )
            }}
            className={option}
          >
            {copied ? <Check size={18} className="text-green-600" aria-hidden /> : <Copy size={18} className="text-navy/50" aria-hidden />} {copied ? t.copied : t.copy}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
