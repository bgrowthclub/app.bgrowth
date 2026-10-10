import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import MemberPageStatsView from '../find/MemberPageStatsView'
import { CARD } from './styles'
import { adminService } from '../../modules/admin/adminService'
import type { MemberPage, MemberPageStats } from '../../modules/find/types'

// Admin → Pages: one page's numbers, the same view its owner sees in My Page.
export default function AdminMemberPageStats({ page, onClose }: { page: MemberPage; onClose: () => void }) {
  const [days, setDays] = useState(30)
  const [stats, setStats] = useState<MemberPageStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setStats(null)
    setError(null)
    adminService
      .getMemberPageStats(page.id, days)
      .then((s) => {
        if (!cancelled) setStats(s)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Couldn’t load the numbers.')
      })
    return () => {
      cancelled = true
    }
  }, [page.id, days])

  return (
    <div className={`${CARD} p-6`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-navy">Numbers · {page.display_name}</h2>
          <p className="mt-0.5 text-[13px] text-navy/45">
            bgrowth.app/p/{page.slug}
            {page.owner_email ? ` · the owner (${page.owner_email}) sees this in My Page` : ' · no owner linked yet'}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-navy/40 hover:bg-bg-soft hover:text-navy">
          <X size={18} />
        </button>
      </div>
      <MemberPageStatsView stats={stats} days={days} onDays={setDays} language="en" error={error} />
    </div>
  )
}
