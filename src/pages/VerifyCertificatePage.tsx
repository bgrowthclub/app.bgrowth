import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BadgeCheck, Search, ShieldAlert } from 'lucide-react'
import { certificateService } from '../modules/academy/certificateService'
import type { CertificateKind } from '../modules/academy/types'

interface Found {
  code: string
  student_name: string
  course_name: string
  kind: CertificateKind
  hours: number | null
  issued_at: string
  revoked: boolean
}

const KIND_LABEL: Record<CertificateKind, string> = {
  completion: 'Certificate of Completion',
  achievement: 'Certificate of Achievement',
  participation: 'Certificate of Participation',
}

// Checking a BGrowth Academy™ certificate (02/11/2026), at /verify/:code.
//
// Whoever opens this got the code FROM the certificate, which already shows
// the holder's name — so showing it here reveals nothing new, and hiding it
// would make the check useless, since confirming the name is the whole point.
// What must not be guessable is the code itself, which is random and long;
// the page is noindex so these never end up in a search engine.
export default function VerifyCertificatePage() {
  const { code: fromUrl } = useParams<{ code: string }>()
  const [code, setCode] = useState(fromUrl ?? '')
  const [state, setState] = useState<'idle' | 'checking' | 'done'>('idle')
  const [found, setFound] = useState<Found | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const tag = document.createElement('meta')
    tag.setAttribute('name', 'robots')
    tag.setAttribute('content', 'noindex, nofollow')
    document.head.appendChild(tag)
    document.title = 'Verify a certificate · BGrowth Academy'
    return () => {
      tag.remove()
    }
  }, [])

  async function check(value: string) {
    const trimmed = value.trim().toUpperCase()
    if (!trimmed) return
    setState('checking')
    setError(null)
    try {
      setFound((await certificateService.verify(trimmed)) as Found | null)
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t check this certificate right now.')
      setState('idle')
    }
  }

  useEffect(() => {
    if (fromUrl) void check(fromUrl)
    // Only on the first render with a code in the address.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromUrl])

  return (
    <main className="container-px mx-auto max-w-narrow py-16">
      <h1 className="font-display text-3xl font-bold text-navy">Verify a certificate</h1>
      <p className="mt-2 text-[15px] text-navy/60">
        Type the certificate ID printed on a BGrowth Academy certificate to check that it is real.
      </p>

      <form
        className="mt-6 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void check(code)
        }}
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="BG-XXXXXXXX"
          aria-label="Certificate ID"
          className="min-w-0 flex-1 rounded-xl border border-navy/[0.12] bg-white px-4 py-3 text-[15px] uppercase tracking-wide text-navy outline-none focus:border-primary/50"
        />
        <button
          type="submit"
          disabled={state === 'checking' || !code.trim()}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-40"
        >
          <Search size={17} aria-hidden />
          {state === 'checking' ? 'Checking…' : 'Check'}
        </button>
      </form>

      {error && <p className="mt-4 text-[14px] text-red-500">{error}</p>}

      {state === 'done' && !found && (
        <div className="glass-card mt-8 px-6 py-7">
          <p className="flex items-center gap-2 text-[15px] font-bold text-navy">
            <ShieldAlert size={19} className="text-red-500" aria-hidden />
            No certificate with that ID
          </p>
          <p className="mt-2 text-[14.5px] leading-relaxed text-navy/60">
            Check the ID for a typo. If it is right, BGrowth Academy did not issue this certificate.
          </p>
        </div>
      )}

      {state === 'done' && found && (
        <div className="glass-card mt-8 px-6 py-7">
          <p className={`flex items-center gap-2 text-[15px] font-bold ${found.revoked ? 'text-red-600' : 'text-emerald-700'}`}>
            {found.revoked ? <ShieldAlert size={19} aria-hidden /> : <BadgeCheck size={19} aria-hidden />}
            {found.revoked ? 'This certificate was withdrawn' : 'This certificate is valid'}
          </p>

          <dl className="mt-5 space-y-3.5">
            <Row label="Issued to" value={found.student_name} />
            <Row label="Course" value={found.course_name} />
            <Row label={KIND_LABEL[found.kind] ? 'Certificate' : 'Type'} value={KIND_LABEL[found.kind] ?? found.kind} />
            {found.hours ? <Row label="Hours" value={`${found.hours}`} /> : null}
            <Row label="Issued on" value={new Date(found.issued_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
            <Row label="Certificate ID" value={found.code} />
          </dl>

          <p className="mt-6 border-t border-navy/[0.07] pt-4 text-[12.5px] leading-relaxed text-navy/45">
            A BGrowth Academy certificate records that someone completed a course. It is not a professional license,
            certification or accreditation, and it does not authorize the holder to practise any regulated profession.
          </p>
        </div>
      )}
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3">
      <dt className="w-32 shrink-0 text-[12px] font-semibold uppercase tracking-wide text-navy/40">{label}</dt>
      <dd className="min-w-0 flex-1 text-[15px] font-semibold text-navy">{value}</dd>
    </div>
  )
}
