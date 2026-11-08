import { useState } from 'react'
import { ExternalLink, ShieldCheck } from 'lucide-react'
import Button from '../ui/Button'
import { CARD, INPUT, SMALL_BUTTON } from './styles'
import { adminService } from '../../modules/admin/adminService'
import type { MemberPage } from '../../modules/find/types'

// Free members' pages waiting to go public (08/11/2026, Portal migration
// 0079). A free account is disposable and whatever it publishes sits on
// bgrowth.app, so the team looks first. Paying members publish straight away.
//
// It is its own block above the list, not more buttons on the row: a queue
// is work to clear, and work to clear should be the first thing on screen,
// not hidden among sixty pages sorted by date.
export default function MemberPageReviewQueue({ pages, onDone }: { pages: MemberPage[]; onDone: () => void }) {
  const [note, setNote] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (pages.length === 0) return null

  const decide = (page: MemberPage, action: 'approve' | 'return') => {
    const text = (note[page.id] ?? '').trim()
    if (action === 'return' && !text) {
      setError('Tell them what to change — the note is all they see.')
      return
    }
    setBusy(page.id)
    setError(null)
    adminService
      .reviewMemberPage(page.id, action, text)
      .then(() => onDone())
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Couldn’t save that.'))
      .finally(() => setBusy(null))
  }

  return (
    <section className={`${CARD} mb-6 p-5`}>
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy">
        <ShieldCheck size={18} className="text-primary" aria-hidden />
        Waiting for you ({pages.length})
      </h2>
      <p className="mt-1 text-[13px] text-navy/55">
        Free members’ pages don’t go online until someone here looks at them. Open the page, read it, then decide.
      </p>

      {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">{error}</p>}

      <ul className="mt-4 space-y-3">
        {pages.map((page) => (
          <li key={page.id} className="rounded-xl border border-navy/[0.08] bg-bg-soft/50 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-display text-[15px] font-bold text-navy">{page.display_name}</span>
              <a
                href={`/p/${page.slug}?preview=1`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:text-navy"
              >
                Open it <ExternalLink size={13} aria-hidden />
              </a>
            </div>
            {page.headline && <p className="mt-0.5 text-[13px] text-navy/55">{page.headline}</p>}
            <p className="mt-0.5 text-[12.5px] text-navy/40">
              bgrowth.app/p/{page.slug}
              {page.owner_email ? ` · ${page.owner_email}` : ''}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                className={`${INPUT} min-w-[220px] flex-1`}
                value={note[page.id] ?? ''}
                onChange={(e) => setNote((n) => ({ ...n, [page.id]: e.target.value }))}
                maxLength={500}
                placeholder="If you send it back: what should they change?"
                aria-label="Note to the member"
              />
              <Button type="button" onClick={() => decide(page, 'approve')} disabled={busy === page.id} className={SMALL_BUTTON}>
                {busy === page.id ? 'Saving…' : 'Approve'}
              </Button>
              <button
                type="button"
                onClick={() => decide(page, 'return')}
                disabled={busy === page.id}
                className="rounded-xl border border-navy/10 bg-white px-3.5 py-2 text-[13px] font-semibold text-navy/70 transition-colors hover:border-primary/40 hover:text-navy disabled:opacity-50"
              >
                Send back
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
