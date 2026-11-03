import logo from '../../assets/logo.png'
import type { CertificateKind } from '../../modules/academy/types'

export interface CertificateData {
  code: string
  studentName: string
  courseName: string
  kind: CertificateKind
  hours?: number | null
  issuedAt: string
  revoked?: boolean
}

// BGrowth Academy™ — the certificate itself (02/11/2026).
//
// One design for the three kinds: the same mark, type and layout, with only
// the title, one line of body text and the accent colour changing. A
// certificate that doesn't look like the brand weakens the thing it is
// trying to prove, so this uses BGrowth's real logo and blue — not a
// made-up crest.
//
// It is an A4 landscape sheet, printed by the browser (the same way the
// Runtime saves a PDF). The CSS lives here rather than in Tailwind classes
// because the sheet must keep its exact proportions on paper, where the
// utility classes' responsive behaviour would work against it.

const KIND: Record<CertificateKind, { title: string; body: string; accent: string; dateLabel: string }> = {
  completion: {
    title: 'Certificate of Completion',
    body: 'for completing the course',
    accent: 'var(--color-primary)',
    dateLabel: 'Date of completion',
  },
  achievement: {
    title: 'Certificate of Achievement',
    body: 'for completing the course and passing its assessment',
    accent: '#B8860B',
    dateLabel: 'Date of completion',
  },
  participation: {
    title: 'Certificate of Participation',
    body: 'for taking part in',
    accent: '#0A7D7D',
    dateLabel: 'Date of participation',
  },
}

function longDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function CertificateDocument({ data }: { data: CertificateData }) {
  const look = KIND[data.kind] ?? KIND.completion
  const verifyUrl = `bgrowth.app/verify/${data.code}`

  return (
    <div className="bg-certificate" style={{ ['--cert-accent' as string]: look.accent }}>
      <style>{CSS}</style>
      <div className="cert-sheet">
        <span className="cert-sweep cert-sweep-tl2" />
        <span className="cert-sweep cert-sweep-tl" />
        <span className="cert-sweep cert-sweep-br" />
        <span className="cert-sweep cert-sweep-br2" />
        <span className="cert-frame" />

        <div className="cert-inner">
          <div className="cert-block">
            <div className="cert-brand">
              <img src={logo} alt="" />
              <div className="cert-wordmark">
                <b>BGrowth</b>
                <span>ACADEMY</span>
              </div>
            </div>
            <h1>{look.title}</h1>
            <span className="cert-rule" />
          </div>

          <div className="cert-block">
            <p className="cert-lead">This certificate is presented to</p>
            <p className="cert-name">{data.studentName}</p>
            <span className="cert-nameline" />
            <p className="cert-body">{look.body}</p>
            <p className="cert-course">{data.courseName}</p>
            {data.hours ? <p className="cert-hours">{data.hours} hours</p> : null}
          </div>

          <div className="cert-block">
            <div className="cert-feet">
              <div className="cert-foot">
                <div className="cert-value">{longDate(data.issuedAt)}</div>
                <span className="cert-line" />
                <div className="cert-label">{look.dateLabel}</div>
              </div>
              <div className="cert-seal">
                <b>BG</b>
                <span>ACADEMY</span>
              </div>
              <div className="cert-foot">
                <div className="cert-value">BGrowth Academy</div>
                <span className="cert-line" />
                <div className="cert-label">Issued by</div>
              </div>
            </div>

            <div className="cert-verify">
              <div className="cert-id">Certificate ID {data.code}</div>
              <div className="cert-url">Verify at {verifyUrl}</div>
            </div>
            <p className="cert-note">
              This certificate records the completion of a BGrowth Academy course. It is not a professional license,
              certification or accreditation, and it does not authorize the holder to practise any regulated profession.
            </p>
            {data.revoked && <p className="cert-revoked">This certificate has been withdrawn.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

const CSS = `
.bg-certificate { display: flex; justify-content: center; }
.bg-certificate .cert-sheet {
  width: 1123px; height: 794px; position: relative; overflow: hidden; flex: none;
  background: #FDFCF9; color: var(--color-navy);
  font-family: var(--font-body);
  display: flex; flex-direction: column; align-items: center;
  padding: 52px 72px 34px;
}
.bg-certificate .cert-sweep { position: absolute; border-radius: 50%; }
.bg-certificate .cert-sweep-tl { top: -330px; left: -230px; width: 520px; height: 520px; background: var(--cert-accent); opacity: .10; }
.bg-certificate .cert-sweep-tl2 { top: -360px; left: -300px; width: 470px; height: 470px; background: var(--color-navy); opacity: .9; }
.bg-certificate .cert-sweep-br { bottom: -360px; right: -300px; width: 470px; height: 470px; background: var(--color-navy); opacity: .9; }
.bg-certificate .cert-sweep-br2 { bottom: -330px; right: -230px; width: 520px; height: 520px; background: var(--cert-accent); opacity: .10; }
.bg-certificate .cert-frame { position: absolute; inset: 22px; border: 1px solid rgba(10,27,77,.18); }
.bg-certificate .cert-frame::after { content: ''; position: absolute; inset: 7px; border: 3px solid var(--cert-accent); opacity: .22; }

.bg-certificate .cert-inner { position: relative; z-index: 2; display: flex; flex-direction: column;
  align-items: center; justify-content: space-between; height: 100%; width: 100%; }
.bg-certificate .cert-block { display: flex; flex-direction: column; align-items: center; width: 100%; }
.bg-certificate .cert-brand { display: flex; align-items: center; gap: 14px; }
.bg-certificate .cert-brand img { width: 52px; height: 52px; border-radius: 12px; }
.bg-certificate .cert-wordmark { text-align: center; }
.bg-certificate .cert-wordmark b { display: block; font-family: var(--font-display); font-size: 30px; font-weight: 800;
  letter-spacing: -.02em; line-height: 1; color: var(--color-navy); }
.bg-certificate .cert-wordmark span { display: block; margin-top: 3px; font-size: 11px; font-weight: 600;
  letter-spacing: .42em; text-indent: .42em; color: var(--cert-accent); }

.bg-certificate h1 { margin: 26px 0 0; font-family: var(--font-display); font-size: 34px; font-weight: 800;
  letter-spacing: .14em; text-transform: uppercase; color: var(--color-navy); text-align: center; }
.bg-certificate .cert-rule { margin-top: 14px; width: 120px; height: 3px; background: var(--cert-accent); opacity: .85; }

.bg-certificate .cert-lead { margin: 0; font-size: 15px; color: rgba(10,27,77,.6); }
.bg-certificate .cert-name { margin: 10px 0 0; font-family: var(--font-display); font-size: 48px; font-weight: 700;
  letter-spacing: -.01em; line-height: 1.1; text-align: center; max-width: 820px; }
.bg-certificate .cert-nameline { margin-top: 16px; width: 560px; height: 1px; background: rgba(10,27,77,.22); }
.bg-certificate .cert-body { margin: 18px 0 0; font-size: 15px; color: rgba(10,27,77,.6); }
.bg-certificate .cert-course { margin: 8px 0 0; font-family: var(--font-display); font-size: 25px; font-weight: 700;
  text-align: center; max-width: 820px; line-height: 1.25; }
.bg-certificate .cert-hours { margin: 10px 0 0; font-size: 13px; color: rgba(10,27,77,.5); }

.bg-certificate .cert-feet { width: 100%; display: flex; align-items: flex-end; justify-content: space-between; gap: 40px; }
.bg-certificate .cert-foot { width: 260px; text-align: center; }
.bg-certificate .cert-value { font-size: 15px; font-weight: 600; padding-bottom: 8px; }
.bg-certificate .cert-line { display: block; height: 1px; background: rgba(10,27,77,.25); }
.bg-certificate .cert-label { margin-top: 7px; font-size: 11px; letter-spacing: .13em; text-transform: uppercase; color: rgba(10,27,77,.45); }
.bg-certificate .cert-seal { width: 92px; height: 92px; border-radius: 50%; border: 2px solid var(--cert-accent);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  color: var(--cert-accent); margin-bottom: 6px; flex: none; }
.bg-certificate .cert-seal b { font-family: var(--font-display); font-size: 19px; font-weight: 800; letter-spacing: -.02em; }
.bg-certificate .cert-seal span { font-size: 7.5px; font-weight: 600; letter-spacing: .18em; }

.bg-certificate .cert-verify { margin-top: 22px; text-align: center; }
.bg-certificate .cert-id { font-size: 12.5px; font-weight: 600; letter-spacing: .04em; }
.bg-certificate .cert-url { margin-top: 3px; font-size: 11.5px; color: rgba(10,27,77,.5); }
.bg-certificate .cert-note { margin: 10px 0 0; max-width: 780px; text-align: center; font-size: 9.5px;
  line-height: 1.5; color: rgba(10,27,77,.42); }
.bg-certificate .cert-revoked { margin: 8px 0 0; font-size: 13px; font-weight: 700; color: #DC2626; }

/* On a phone the sheet is scaled down rather than reflowed: a certificate
   that rearranges itself is no longer the document it certifies. */
@media (max-width: 1200px) {
  .bg-certificate { overflow-x: auto; }
}

@media print {
  @page { size: A4 landscape; margin: 0; }
  .bg-certificate .cert-sheet { width: 297mm; height: 210mm; padding: 14mm 18mm 9mm; }
  .bg-certificate .cert-sheet, .bg-certificate .cert-sweep, .bg-certificate .cert-seal {
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
}
`
