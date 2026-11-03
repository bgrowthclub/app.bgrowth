import { useState } from 'react'
import { Award, Printer } from 'lucide-react'
import CertificateDocument from './CertificateDocument'
import { certificateService } from '../../modules/academy/certificateService'
import type { CertificateRow } from '../../modules/academy/certificateService'

// The certificate at the end of a course (02/11/2026).
//
// The page never decides whether the course is finished — it asks the
// server, which reads the course and the student's own record. A browser
// that could say "I finished" would be handing itself a certificate.
export default function CourseCertificate({ productId }: { productId: string }) {
  const [certificate, setCertificate] = useState<CertificateRow | null>(null)
  const [left, setLeft] = useState<{ lessons: number; questions: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function claim() {
    setBusy(true)
    setError(null)
    try {
      const result = await certificateService.claim(productId)
      if (result.certificate) {
        setCertificate(result.certificate)
        setLeft(null)
      } else {
        setLeft({ lessons: result.lessonsLeft ?? 0, questions: result.questionsLeft ?? 0 })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t get your certificate right now.')
    } finally {
      setBusy(false)
    }
  }

  if (certificate) {
    return (
      <section className="mt-6">
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14.5px] font-semibold text-navy">Your certificate</p>
          <button type="button" onClick={() => window.print()} className="btn-secondary inline-flex items-center gap-2">
            <Printer size={16} aria-hidden />
            Print or save as PDF
          </button>
        </div>
        <CertificateDocument
          data={{
            code: certificate.code,
            studentName: certificate.student_name,
            courseName: certificate.course_name,
            kind: certificate.kind,
            hours: certificate.hours,
            issuedAt: certificate.issued_at,
            revoked: Boolean(certificate.revoked_at),
          }}
        />
      </section>
    )
  }

  return (
    <section className="no-print mt-6 rounded-xl2 border border-navy/[0.08] bg-bg-soft px-5 py-5">
      <p className="flex items-center gap-2 text-[15px] font-bold text-navy">
        <Award size={18} className="text-primary" aria-hidden />
        Certificate
      </p>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy/60">
        Tick every lesson and answer every question — right or wrong, nothing here is graded — and your certificate is
        ready. It carries your name as it is in your profile.
      </p>

      {left && (left.lessons > 0 || left.questions > 0) && (
        <p className="mt-3 text-[13.5px] font-semibold text-navy">
          Still to go:{' '}
          {[
            left.lessons ? `${left.lessons} ${left.lessons === 1 ? 'lesson' : 'lessons'}` : '',
            left.questions ? `${left.questions} ${left.questions === 1 ? 'question' : 'questions'}` : '',
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
      {error && <p className="mt-3 text-[13.5px] text-red-500">{error}</p>}

      <button type="button" onClick={() => void claim()} disabled={busy} className="btn-primary mt-4 disabled:opacity-40">
        {busy ? 'Checking…' : 'Get my certificate'}
      </button>
    </section>
  )
}
