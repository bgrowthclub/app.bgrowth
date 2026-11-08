import { useEffect, useState } from 'react'
import { ExternalLink, Flag } from 'lucide-react'
import { CARD } from './styles'
import { adminService } from '../../modules/admin/adminService'
import type { AdminPageReport } from '../../modules/admin/types'

const REASONS: Record<string, string> = {
  scam: 'Looks like a scam',
  adult: 'Adult content',
  illegal: 'Illegal content',
  impersonation: 'Pretends to be someone else',
  'not-working': 'Something is broken',
  other: 'Something else',
}

// Pages visitors reported (08/11/2026). It shows only what is open: a
// handled report is history, and a list of work should not be a list of
// things already done.
//
// Dismissing a report is all this does. Taking a page down is a separate,
// heavier action that lives in Admin → Pages, on purpose: the person
// clearing reports should not be able to unpublish someone's page with the
// same reflex they use to say "this one's fine".
export default function MemberPageReports() {
  const [reports, setReports] = useState<AdminPageReport[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  const load = () =>
    adminService
      .listPageReports()
      .then((r) => setReports(r.reports ?? []))
      .catch(() => setReports([]))

  useEffect(() => {
    void load()
  }, [])

  if (reports.length === 0) return null

  return (
    <section className={`${CARD} mb-6 p-5`}>
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy">
        <Flag size={17} className="text-red-500" aria-hidden />
        Reported pages ({reports.length})
      </h2>
      <p className="mt-1 text-[13px] text-navy/55">Sent by visitors. Open the page, decide, then dismiss the report.</p>

      <ul className="mt-4 space-y-2">
        {reports.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-navy/[0.08] bg-bg-soft/50 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold text-navy">
                {REASONS[r.reason] ?? r.reason}
                {r.pageStatus !== 'published' && <span className="ml-2 text-[12px] font-semibold text-navy/40">(not online)</span>}
              </span>
              <span className="block truncate text-[12.5px] text-navy/55">
                {r.displayName || r.slug}
                {r.detail ? ` — ${r.detail}` : ''}
              </span>
            </span>
            <a
              href={`/p/${r.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:text-navy"
            >
              Open <ExternalLink size={13} aria-hidden />
            </a>
            <button
              type="button"
              disabled={busy === r.id}
              onClick={() => {
                setBusy(r.id)
                adminService
                  .dismissPageReport(r.id)
                  .then(load)
                  .catch(() => undefined)
                  .finally(() => setBusy(null))
              }}
              className="rounded-xl border border-navy/10 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-navy/70 hover:border-primary/40 hover:text-navy disabled:opacity-50"
            >
              Dismiss
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
