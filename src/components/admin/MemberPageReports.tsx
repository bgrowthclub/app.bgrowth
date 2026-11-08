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
// Three ways out, at two speeds (the owner's decision, 08/11/2026):
//   · Take it down — clear-cut things (adult, illegal, an obvious scam).
//     Off the web now, owner told immediately after, with the reason.
//   · Ask the owner — arguable things. The page stays up and the question
//     goes to them; their reply is where it gets settled.
//   · Dismiss — nothing happened, so nobody is told.
//
// Both actions REQUIRE a reason, and both write to the owner. That is the
// guard against a quiet takedown: the deliberate sentence someone has to
// type is also the sentence the member reads.
export default function MemberPageReports() {
  const [reports, setReports] = useState<AdminPageReport[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const load = () =>
    adminService
      .listPageReports()
      .then((r) => setReports(r.reports ?? []))
      .catch(() => setReports([]))

  useEffect(() => {
    void load()
  }, [])

  // Taking a page down and asking about it share one path: both need a
  // reason, and both tell the owner. Dismissing is the only one that says
  // nothing to anybody, because nothing happened.
  const act = async (r: AdminPageReport, action: 'suspend' | 'ask') => {
    const text = (note[r.id] ?? '').trim()
    if (!text) {
      setError('Write what the owner should read — it is all they get.')
      return
    }
    setBusy(r.id)
    setError(null)
    setDone(null)
    try {
      const { told } = await adminService.actOnReportedPage(r.pageId, action, text)
      await adminService.dismissPageReport(r.id)
      setDone(
        told
          ? action === 'suspend'
            ? 'Page taken down and the owner told.'
            : 'The owner has been asked; their page is still online.'
          : 'Done — but we couldn’t reach the owner (no account behind this page).',
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t do that.')
    } finally {
      setBusy(null)
    }
  }

  if (reports.length === 0) return null

  return (
    <section className={`${CARD} mb-6 p-5`}>
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy">
        <Flag size={17} className="text-red-500" aria-hidden />
        Reported pages ({reports.length})
      </h2>
      <p className="mt-1 text-[13px] text-navy/55">
        Sent by visitors. Open the page and decide: take it down now for anything clear-cut, or ask the owner when it
        is arguable. Either way they are told — a page that vanishes with no word comes back as an angry ticket.
      </p>
      {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">{error}</p>}
      {done && <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-700">{done}</p>}

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
            <input
              className="w-full rounded-xl border border-navy/10 px-3 py-1.5 text-[12.5px] text-navy focus:border-primary/40 focus:outline-none sm:w-auto sm:min-w-[200px] sm:flex-1"
              value={note[r.id] ?? ''}
              onChange={(e) => setNote((n) => ({ ...n, [r.id]: e.target.value }))}
              maxLength={1000}
              placeholder="What do you want to tell the owner?"
              aria-label="Message to the owner"
            />
            <button
              type="button"
              disabled={busy === r.id}
              onClick={() => void act(r, 'ask')}
              className="rounded-xl border border-navy/10 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-navy/70 hover:border-primary/40 hover:text-navy disabled:opacity-50"
            >
              Ask the owner
            </button>
            <button
              type="button"
              disabled={busy === r.id}
              onClick={() => void act(r, 'suspend')}
              className="rounded-xl bg-red-600 px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Take it down
            </button>
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
              className="text-[12.5px] font-semibold text-navy/45 hover:text-navy disabled:opacity-50"
            >
              Dismiss
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
