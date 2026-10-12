import { useState } from 'react'
import { Download, ExternalLink, FileText, Image as ImageIcon, Loader2 } from 'lucide-react'
import { CARD } from './styles'
import { getDownloadLink } from '../../modules/workspace/services/downloadService'
import type { DownloadContent } from '../../modules/workspace/types/portal'

interface Props {
  productId: string
  content: DownloadContent
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// A Download the member owns (Sprint 86): how to use it, its files (each
// downloaded through a short private link) and its Canva links.
export default function DownloadRunner({ productId, content }: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function download(fileId: string) {
    setBusy(fileId)
    setError(null)
    try {
      window.location.assign(await getDownloadLink(productId, fileId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      {content.instructions.trim() && (
        <section className={`${CARD} p-6`}>
          <h2 className="font-display text-lg font-bold text-navy">How to use</h2>
          <p className="mt-3 whitespace-pre-wrap text-[14.5px] leading-relaxed text-navy/70">{content.instructions}</p>
        </section>
      )}

      <section className={`${CARD} p-6`}>
        <h2 className="font-display text-lg font-bold text-navy">{content.files.length === 1 ? 'Your file' : 'Your files'}</h2>
        <ul className="mt-4 space-y-2">
          {content.files.map((f) => {
            const Icon = f.mimeType.startsWith('image/') ? ImageIcon : FileText
            return (
              <li key={f.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-bg-soft px-4 py-3">
                <Icon className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-semibold text-navy">{f.name}</p>
                  <p className="text-[12px] text-navy/45">{formatSize(f.sizeBytes)}</p>
                </div>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void download(f.id)}
                  className="btn-primary inline-flex items-center gap-1.5 !px-4 !py-2 text-[13.5px] disabled:opacity-60"
                >
                  {busy === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download
                </button>
              </li>
            )
          })}
        </ul>
        {error && <p className="mt-3 text-[13px] text-red-500">{error}</p>}
      </section>

      {content.links.length > 0 && (
        <section className={`${CARD} p-6`}>
          <h2 className="font-display text-lg font-bold text-navy">Canva links</h2>
          <p className="mt-1 text-[13px] text-navy/50">Opens in Canva, where you can make your own editable copy (a free Canva account works).</p>
          <ul className="mt-4 space-y-2">
            {content.links.map((l) => (
              <li key={l.url}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl bg-bg-soft px-4 py-3 text-[14.5px] font-semibold text-primary hover:bg-primary/5"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{l.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
