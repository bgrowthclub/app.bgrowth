import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import EmptyState from '../../../components/ui/EmptyState'
import FilterPill from '../../../components/ui/FilterPill'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminSiteSearches, AdminSiteSearchTerm } from '../../../modules/admin/types'

// Admin → Catalog → Searches (01/11/2026): what visitors type in the catalog
// search. The counting has run since Sprint 97 (portal.site_search_stats) and
// nothing ever read it — this is the first screen for it, and the first data
// source for the future Product Discovery in Studio's Content Engine.
//
// The list that matters is "found nothing": a term with no match is someone
// asking for a product we don't have yet.
const CARD = 'rounded-xl3 border border-navy/[0.06] bg-white shadow-softer'
const PERIODS = [7, 30, 90] as const

function TermList({ title, hint, terms, empty }: { title: string; hint?: string; terms: AdminSiteSearchTerm[]; empty: string }) {
  const max = Math.max(1, ...terms.map((t) => t.count))
  return (
    <div className={`${CARD} p-5`}>
      <p className="text-[13px] font-semibold text-navy/60">{title}</p>
      {hint && <p className="mt-1 text-[12.5px] text-navy/40">{hint}</p>}
      {terms.length === 0 ? (
        <p className="mt-3 text-[14px] text-navy/45">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {terms.map((t) => (
            <li key={t.query}>
              <div className="flex items-baseline justify-between gap-3 text-[14px]">
                <span className="truncate text-navy">{t.query}</span>
                <span className="shrink-0 font-semibold text-navy">{t.count.toLocaleString('en-US')}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-bg-soft">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(t.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function AdminSearchesPage() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<AdminSiteSearches | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(null)
    adminService
      .getSiteSearches(days)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Couldn’t load the searches.'))
    return () => {
      cancelled = true
    }
  }, [days])

  const maxDay = Math.max(1, ...(data?.perDay ?? []).map((d) => d.count))

  return (
    <div className="space-y-6">
      <SEO title="Searches" description="What visitors look for in the catalog." path="/platform/admin/searches" />

      <div>
        <p className="eyebrow">Catalog</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy">Searches</h1>
        <p className="mt-3 max-w-xl text-[15px] text-navy/55">
          What visitors typed in the catalog search. The terms that found nothing are products someone wanted and we don’t have yet.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <FilterPill key={p} label={`${p} days`} active={days === p} onClick={() => setDays(p)} />
        ))}
      </div>

      {error ? (
        <p className="text-[14px] text-red-500">{error}</p>
      ) : !data ? (
        <p className="py-10 text-center text-[14px] text-navy/40">…</p>
      ) : !data.ready ? (
        <EmptyState icon={Search} title="Searches" description="The numbers start once the database update (Portal migration 0052) runs." />
      ) : data.searches === 0 ? (
        <EmptyState icon={Search} title="No searches yet" description="Nobody has used the catalog search in this period." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              { label: 'Searches', value: data.searches },
              { label: 'Different terms', value: data.found.length + data.empty.length },
              { label: 'Terms with no match', value: data.empty.length },
            ].map((tile) => (
              <div key={tile.label} className={`${CARD} p-4`}>
                <p className="text-[12.5px] font-semibold text-navy/50">{tile.label}</p>
                <p className="mt-1 font-display text-3xl font-bold text-navy">{tile.value.toLocaleString('en-US')}</p>
              </div>
            ))}
          </div>

          <div className={`${CARD} p-5`}>
            <p className="text-[13px] font-semibold text-navy/60">Searches per day</p>
            <div className="mt-4 flex h-28 items-end gap-[2px]" role="img" aria-label="Searches per day">
              {data.perDay.map((d) => (
                <div key={d.day} className="flex h-full flex-1 items-end" title={`${d.day}: ${d.count}`}>
                  <div className="w-full rounded-t bg-primary/80" style={{ height: `${Math.max(6, (d.count / maxDay) * 100)}%` }} />
                </div>
              ))}
            </div>
          </div>

          <TermList
            title="Found nothing"
            hint="Each of these is a visitor asking for something the catalog doesn’t have."
            terms={data.empty}
            empty="Every search found something."
          />
          <TermList title="Found something" terms={data.found} empty="No searches with results in this period." />

          <p className="text-[12.5px] text-navy/40">
            Only daily totals per term are kept — nothing about who searched. A term that looked like an e-mail or carried a long number was
            never stored.
          </p>
        </>
      )}
    </div>
  )
}
