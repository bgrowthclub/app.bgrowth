import { useEffect, useState } from 'react'
import { History } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import EmptyState from '../../../components/ui/EmptyState'
import Button from '../../../components/ui/Button'
import FilterPill from '../../../components/ui/FilterPill'
import AdminActivityRow, { ACTIVITY_AREAS } from '../../../components/admin/AdminActivityRow'
import { CARD, INPUT, SMALL_BUTTON } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminActivityPage as ActivityData } from '../../../modules/admin/types'

// Admin → Activity: every change made in the Admin area — who did it, when,
// and to which member or product (Portal migration 0042). Read-only; the
// log can't be edited or deleted.
export default function AdminActivityPage() {
  const [area, setArea] = useState('')
  const [who, setWho] = useState('')
  const [data, setData] = useState<ActivityData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(null)
    adminService
      .listActivity({ area, admin: who })
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Couldn’t load the activity.')
      })
    return () => {
      cancelled = true
    }
  }, [area, who])

  async function more() {
    if (!data) return
    setLoadingMore(true)
    try {
      const next = await adminService.listActivity({ area, admin: who, page: data.page + 1 })
      setData({ ...next, entries: [...data.entries, ...next.entries] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t load more.')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <SEO title="Activity · Admin" description="Every change made in the Admin area." path="/platform/admin/activity" />
      <SectionHeader
        eyebrow="Admin"
        title="Activity"
        description="Every change made in the Admin area: who did it, when, and to which member or Workspace."
        className="mb-8"
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <FilterPill label="All" active={area === ''} onClick={() => setArea('')} />
        {ACTIVITY_AREAS.map((a) => (
          <FilterPill key={a.id} label={a.label} active={area === a.id} onClick={() => setArea(a.id)} />
        ))}
        {data && data.admins.length > 1 && (
          <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Person" className={`${INPUT} ml-auto !w-auto !py-2`}>
            <option value="">Everyone</option>
            {data.admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.email}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <p className="mb-4 text-[14px] text-red-500">{error}</p>}

      {!data ? (
        !error && <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
      ) : !data.ready ? (
        <EmptyState icon={History} title="Not recording yet." description="Run the database update (Portal migration 0042) to start the activity log." />
      ) : data.entries.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nothing here yet."
          description={area || who ? 'No changes match these filters.' : 'Changes made in the Admin area will show up here.'}
        />
      ) : (
        <>
          <div className={`${CARD} divide-y divide-navy/[0.06] overflow-hidden`}>
            {data.entries.map((entry) => (
              <AdminActivityRow key={entry.id} entry={entry} />
            ))}
          </div>
          {data.entries.length < data.total && (
            <div className="mt-4 text-center">
              <Button type="button" variant="secondary" onClick={() => void more()} disabled={loadingMore} className={SMALL_BUTTON}>
                {loadingMore ? 'Loading…' : 'Show more'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
