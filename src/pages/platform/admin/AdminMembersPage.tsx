import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import SearchBar from '../../../components/ui/SearchBar'
import EmptyState from '../../../components/ui/EmptyState'
import Pagination from '../../../components/ui/Pagination'
import AdminMemberRow from '../../../components/admin/AdminMemberRow'
import { CARD } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminMemberPage } from '../../../modules/admin/types'

// Admin → Members: every account on BGrowth (shared with the Portal),
// newest first, searchable by name or e-mail.
export default function AdminMembersPage() {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<AdminMemberPage | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string>()

  // Search after the admin stops typing, from page 1.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(query.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(t)
  }, [query])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    adminService
      .listMembers(search, page)
      .then((next) => {
        if (cancelled) return
        setResult(next)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [search, page])

  const pageCount = result ? Math.ceil(result.total / result.pageSize) : 0

  return (
    <div className="mx-auto max-w-6xl">
      <SEO title="Members · Admin" description="BGrowth members." path="/platform/admin/members" />
      <SectionHeader
        eyebrow="Admin"
        title="Members"
        description="Every BGrowth account — what they bought, their trials and the access you’ve given them."
        className="mb-8"
      />

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex-1">
          <SearchBar value={query} onChange={setQuery} placeholder="Search by name or e-mail…" />
        </div>
        {result && (
          <p className="text-[13px] text-navy/45">
            {result.total} {result.total === 1 ? 'member' : 'members'}
          </p>
        )}
      </div>

      {status === 'error' ? (
        <EmptyState icon={Users} title="We couldn’t load the members." description={error} />
      ) : status === 'loading' && !result ? (
        <p className="py-16 text-center text-[14px] text-navy/40">Loading members…</p>
      ) : result && result.members.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No members match your search.' : 'No members yet.'}
          description={search ? 'Try part of the name or e-mail.' : undefined}
        />
      ) : (
        result && (
          <>
            <div className={`${CARD} divide-y divide-navy/[0.06] overflow-hidden ${status === 'loading' ? 'opacity-60' : ''}`}>
              {result.members.map((member) => (
                <AdminMemberRow key={member.id} member={member} />
              ))}
            </div>
            <div className="mt-6">
              <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            </div>
          </>
        )
      )}
    </div>
  )
}
