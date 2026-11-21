import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ChevronRight, Clock, FilePlus2, FileText, Play, Plus, Search } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import Pagination from '../../components/ui/Pagination'
import NewRecordDialog from '../../components/workspace/NewRecordDialog'
import { CARD } from '../../components/workspace/styles'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { useStudioWorkspace } from '../../modules/workspace/hooks/useStudioWorkspace'
import { computeWorkspaceProgress } from '../../modules/workspace/hooks/useWorkspaceProgress'
import { studioWorkspaceService } from '../../modules/workspace/services/studioWorkspaceService'
import { workspaceViewerPath } from '../../modules/workspace/config'
import type { WorkspaceContent, WorkspaceData } from '../../modules/workspace/types/content'
import { timeAgo } from '../../lib/timeAgo'

type Status = 'all' | 'progress' | 'completed'
type Period = 'all' | '7' | '30'
const PAGE_SIZE = 10

const date = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
const initials = (label: string) =>
  label
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '•'

// A Workspace's saved records (21/11/2026, the owner's design): counted
// totals, search, status (from each record's real progress — 100% =
// Completed) and period filters, and one row per record with its progress and
// last activity. Opened from the Workspace's "Records" button. Nothing here
// that doesn't exist: no signatures, tasks, imports, or rename/delete.
export default function WorkspaceRecordsPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useIdentity()
  const ws = useStudioWorkspace(slug, user?.id)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>('all')
  const [period, setPeriod] = useState<Period>('all')
  const [page, setPage] = useState(1)
  const [naming, setNaming] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const content = ws.product?.content as WorkspaceContent | undefined
  const rows = useMemo(() => {
    const list = ws.records.map((r) => {
      const percent = content?.sections ? computeWorkspaceProgress(content, (r.data ?? {}) as WorkspaceData).percent : 0
      return { record: r, percent, completed: percent >= 100 }
    })
    return list.sort((a, b) => b.record.updated_at.localeCompare(a.record.updated_at))
  }, [ws.records, content])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const since = period === 'all' ? 0 : Date.now() - Number(period) * 86400000
    return rows.filter(
      (r) =>
        (!q || r.record.label.toLowerCase().includes(q)) &&
        (status === 'all' || (status === 'completed' ? r.completed : !r.completed)) &&
        new Date(r.record.updated_at).getTime() >= since,
    )
  }, [rows, query, status, period])

  if (!slug) return <Navigate to="/platform/my-systems" replace />
  if (ws.status === 'loading') return <div className="min-h-screen" aria-busy="true" />
  if (ws.status !== 'ready' || !ws.product) return <Navigate to={workspaceViewerPath(slug)} replace />
  if (!ws.hasAccess || ws.product.content_type === 'calculator') return <Navigate to={workspaceViewerPath(slug)} replace />

  const product = ws.product
  const inProgress = rows.filter((r) => !r.completed).length
  const completed = rows.length - inProgress
  const last = rows[0]
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const filtering = query.trim() !== '' || status !== 'all' || period !== 'all'

  async function handleCreate(label: string) {
    if (!user) return
    setCreating(true)
    setCreateError(null)
    try {
      const created = await studioWorkspaceService.createInstance(user.id, product.id, label)
      await ws.reloadRecords()
      setNaming(false)
      navigate(workspaceViewerPath(product.slug, created.id))
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Couldn’t create the record. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const stat = (icon: React.ReactNode, tone: string, label: string, value: number, note: string, onClick?: () => void) => (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`${CARD} flex items-center gap-4 p-3.5 text-left sm:p-5 transition-colors enabled:hover:border-primary/20`}
    >
      <span className={`hidden h-12 w-12 shrink-0 place-items-center rounded-2xl sm:grid ${tone}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] text-navy/55 sm:text-[13px]">{label}</span>
        <span className="mt-0.5 flex items-baseline gap-2">
          <span className="font-display text-[26px] font-bold leading-none text-navy">{value}</span>
          <span className="hidden text-[12.5px] text-navy/45 sm:inline">{note}</span>
        </span>
      </span>
      {onClick && <ChevronRight className="hidden h-4 w-4 shrink-0 text-navy/30 sm:block" aria-hidden />}
    </button>
  )

  const select = 'rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-[13.5px] font-semibold text-navy focus:border-primary/40 focus:outline-none'

  return (
    <div className="mx-auto max-w-[1320px] pb-16">
      <SEO title={`${product.name} — Records`} description={product.short_description} path={`/platform/workspace/${slug}/records`} />

      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-navy/45">
        <Link to="/platform/my-systems" className="font-medium hover:text-primary">
          My Workspaces
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-navy/25" aria-hidden />
        <Link to={workspaceViewerPath(product.slug)} className="font-medium hover:text-primary">
          {product.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-navy/25" aria-hidden />
        <span className="font-semibold text-navy/70">Records</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-3 font-display text-[26px] font-bold text-navy md:text-[32px]">
            <span className="break-words">{product.name}</span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-[15px] font-bold text-primary">{rows.length}</span>
          </h1>
          <p className="mt-1 text-[14px] text-navy/55">Your saved records — one for each client or job.</p>
        </div>
        <button
          type="button"
          onClick={() => setNaming(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-[14px] font-semibold text-white shadow-soft transition-opacity hover:opacity-95"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New record
        </button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-4">
        {stat(<FileText className="h-6 w-6" />, 'bg-blue-50 text-primary', 'All records', rows.length, 'saved', rows.length ? () => setStatus('all') : undefined)}
        {stat(<Clock className="h-6 w-6" />, 'bg-amber-50 text-amber-600', 'In progress', inProgress, 'not finished', inProgress ? () => setStatus('progress') : undefined)}
        {stat(<CheckCircle2 className="h-6 w-6" />, 'bg-emerald-50 text-emerald-600', 'Completed', completed, 'at 100%', completed ? () => setStatus('completed') : undefined)}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="flex min-w-0 flex-1 basis-60 items-center gap-2 rounded-xl border border-navy/10 bg-white px-3.5 focus-within:border-primary/40">
              <Search className="h-4 w-4 shrink-0 text-navy/35" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                placeholder="Search records by name…"
                aria-label="Search records"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-[14px] text-navy placeholder:text-navy/35 focus:outline-none"
              />
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as Status)
                setPage(1)
              }}
              aria-label="Status"
              className={select}
            >
              <option value="all">All statuses</option>
              <option value="progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value as Period)
                setPage(1)
              }}
              aria-label="Last activity"
              className={select}
            >
              <option value="all">Any time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
            {filtering && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setStatus('all')
                  setPeriod('all')
                  setPage(1)
                }}
                className="px-2 text-[13px] font-semibold text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className={`${CARD} mt-4 overflow-hidden`}>
            {shown.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="font-display text-[17px] font-bold text-navy">{rows.length ? 'No records match.' : 'No records yet.'}</p>
                <p className="mt-1 text-[13.5px] text-navy/55">
                  {rows.length ? 'Try another word or clear the filters.' : 'Start your first one — for example, with your client’s name.'}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden grid-cols-[minmax(0,2.2fr)_1fr_1.3fr_1.3fr_auto] gap-4 border-b border-navy/[0.06] px-5 py-3 text-[12.5px] font-semibold text-navy/50 md:grid">
                  <span>Record</span>
                  <span>Status</span>
                  <span>Progress</span>
                  <span>Last activity</span>
                  <span className="w-16" />
                </div>
                <ul className="divide-y divide-navy/[0.06]">
                  {shown.map(({ record, percent, completed: done }) => (
                    <li key={record.id}>
                      <Link
                        to={workspaceViewerPath(product.slug, record.id)}
                        className="group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-5 py-3.5 transition-colors hover:bg-bg-soft md:grid-cols-[minmax(0,2.2fr)_1fr_1.3fr_1.3fr_auto] md:gap-4"
                      >
                        <span className="flex min-w-0 items-center gap-3 max-md:contents">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 text-[13px] font-bold text-primary">
                            {initials(record.label)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[14.5px] font-semibold text-navy">{record.label}</span>
                            <span className="block text-[12px] text-navy/45">Created {date(record.created_at)}</span>
                          </span>
                        </span>
                        <span className="max-md:col-start-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                              done ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-primary'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-primary'}`} aria-hidden />
                            {done ? 'Completed' : 'In progress'}
                          </span>
                        </span>
                        <span className="flex items-center gap-2.5 max-md:col-start-2">
                          <span className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-navy/[0.08]">
                            <span className={`block h-full rounded-full ${done ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${percent}%` }} />
                          </span>
                          <span className="text-[12.5px] font-semibold text-navy/60">{percent}%</span>
                        </span>
                        <span className="text-[13px] text-navy/60 max-md:col-start-2">
                          {date(record.updated_at)} <span className="text-navy/40">· {time(record.updated_at)}</span>
                        </span>
                        <span className="hidden w-16 items-center justify-end gap-1 text-[13px] font-semibold text-primary md:flex">
                          Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-navy/[0.06] px-5 py-3.5">
                  <p className="text-[12.5px] text-navy/50">
                    Showing {(current - 1) * PAGE_SIZE + 1} to {(current - 1) * PAGE_SIZE + shown.length} of {filtered.length}{' '}
                    {filtered.length === 1 ? 'record' : 'records'}
                  </p>
                  <Pagination page={current} pageCount={pageCount} onChange={setPage} />
                </div>
              </>
            )}
          </div>
        </div>

        <aside className="space-y-4 self-start">
          <section className={`${CARD} p-5`}>
            <h2 className="font-display text-[16px] font-bold text-navy">Quick actions</h2>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
              {last && (
                <Link
                  to={workspaceViewerPath(product.slug, last.record.id)}
                  className="group flex items-center gap-3 rounded-xl border border-navy/[0.08] p-3 transition-colors hover:border-primary/25 hover:bg-bg-soft"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-white">
                    <Play className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-navy">Resume last record</span>
                    <span className="block truncate text-[12px] text-navy/50">
                      {last.record.label} · {timeAgo(last.record.updated_at)}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-navy/30" aria-hidden />
                </Link>
              )}
              <Link
                to={workspaceViewerPath(product.slug)}
                className="group flex items-center gap-3 rounded-xl border border-navy/[0.08] p-3 transition-colors hover:border-primary/25 hover:bg-bg-soft"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-primary">
                  <FilePlus2 className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold text-navy">Open a blank copy</span>
                  <span className="block text-[12px] text-navy/50">Look through it without saving</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-navy/30" aria-hidden />
              </Link>
            </div>
          </section>
        </aside>
      </div>

      <NewRecordDialog open={naming} submitting={creating} error={createError} onSubmit={handleCreate} onCancel={() => setNaming(false)} />
    </div>
  )
}
