import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

// The QR code of a member's page (14/11/2026): to print on a business card,
// a shop window or a car. Drawn in the browser — nothing is stored — and the
// library is loaded only when someone opens it, so no page pays for it.
//
// The code always points at bgrowth.app, never at the address the member
// happens to be on (a preview, a test site): a printed code can't be fixed.
interface Props {
  open: boolean
  slug: string
  name: string
  labels: { title: string; hint: string; download: string; close: string; failed: string }
  onClose: () => void
}

const SITE = 'https://bgrowth.app'

export default function PageQrCode({ open, slug, name, labels, onClose }: Props) {
  const [image, setImage] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const url = `${SITE}/p/${encodeURIComponent(slug)}`

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setFailed(false)
    import('qrcode')
      // 1024 px with a quiet margin: sharp when printed, and the margin is
      // what lets a phone find the code on a busy background.
      .then((qr) => qr.toDataURL(url, { width: 1024, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#0b1b3a', light: '#ffffff' } }))
      .then((data) => {
        if (!cancelled) setImage(data)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [open, url])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const file = `${slug}-qr.png`

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="page-qr-title" className="relative w-full max-w-sm rounded-xl3 border border-navy/[0.06] bg-white p-6 text-center shadow-glow">
        <button type="button" onClick={onClose} title={labels.close} aria-label={labels.close} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-navy/45 hover:bg-bg-soft hover:text-navy">
          <X size={18} />
        </button>
        <h2 id="page-qr-title" className="font-display text-lg font-bold text-navy">
          {labels.title}
        </h2>
        <div className="mx-auto mt-4 grid aspect-square w-full max-w-[260px] place-items-center rounded-2xl border border-navy/[0.08] bg-white p-2">
          {image ? <img src={image} alt={url} className="h-full w-full" /> : failed ? <p className="text-[13px] text-red-500">{labels.failed}</p> : <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />}
        </div>
        <p className="mt-3 truncate text-[14px] font-semibold text-navy">{name}</p>
        <p className="truncate text-[12.5px] text-navy/50">bgrowth.app/p/{slug}</p>
        <p className="mt-3 text-[13px] leading-relaxed text-navy/60">{labels.hint}</p>
        <a
          href={image ?? undefined}
          download={file}
          aria-disabled={!image}
          className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[14px] font-semibold text-white hover:bg-primary/90 ${image ? '' : 'pointer-events-none opacity-50'}`}
        >
          <Download size={16} aria-hidden /> {labels.download}
        </a>
      </div>
    </div>
  )
}
