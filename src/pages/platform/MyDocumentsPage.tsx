import { useEffect, useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import SectionHeader from '../../components/ui/SectionHeader'
import SearchBar from '../../components/ui/SearchBar'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import DocumentCard from '../../components/workspace/DocumentCard'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { listStudioDocuments } from '../../modules/workspace/services/studioDocuments'
import type { StudioDocumentGroup } from '../../modules/workspace/services/studioDocuments'
import { workspaceViewerPath } from '../../modules/workspace/config'

const SELECT =
  'rounded-xl2 border border-navy/10 bg-white px-4 py-3 text-[14px] text-navy shadow-softer outline-none focus:border-primary/30'

// Everything a member has filled in, across all their Workspaces — the
// Portal's "My Documents", grouped by Workspace.
export default function MyDocumentsPage() {
  const { user } = useIdentity()
  const [groups, setGroups] = useState<StudioDocumentGroup[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string>()
  const [query, setQuery] = useState('')
  const [workspace, setWorkspace] = useState('all')
  const [sort, setSort] = useState<'updated' | 'name'>('updated')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setStatus('loading')
    listStudioDocuments(user.id)
      .then((result) => {
        if (cancelled) return
        setGroups(result)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        console.error('[My Documents] Could not load documents:', err)
        setError(err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : String(err))
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return groups
      .filter((g) => workspace === 'all' || g.productSlug === workspace)
      .map((g) => ({
        ...g,
        documents: g.documents
          .filter((d) => !q || d.label.toLowerCase().includes(q) || g.productName.toLowerCase().includes(q))
          .sort((a, b) =>
            sort === 'name' ? a.label.localeCompare(b.label) : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
      }))
      .filter((g) => g.documents.length > 0)
  }, [groups, query, workspace, sort])

  const total = groups.reduce((n, g) => n + g.documents.length, 0)

  return (
    <div className="mx-auto max-w-6xl">
      <SEO title="My Documents" description="Everything you’ve created in your Workspaces." path="/platform/documents" />
      <SectionHeader
        eyebrow="Your Records"
        title="My Documents"
        description="Everything you’ve created using your Workspaces."
        className="mb-8"
      />

      {status === 'ready' && total > 0 && (
        <div className="mb-8 flex flex-col gap-3 md:flex-row">
          <div className="flex-1">
            <SearchBar value={query} onChange={setQuery} placeholder="Search documents…" />
          </div>
          <select value={workspace} onChange={(e) => setWorkspace(e.target.value)} className={SELECT} aria-label="Workspace">
            <option value="all">All Workspaces</option>
            {groups.map((g) => (
              <option key={g.productSlug} value={g.productSlug}>
                {g.productName}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as 'updated' | 'name')} className={SELECT} aria-label="Sort">
            <option value="updated">Last Updated</option>
            <option value="name">Name</option>
          </select>
        </div>
      )}

      {status === 'loading' ? (
        <p className="py-16 text-center text-[14px] text-navy/40">Loading your documents…</p>
      ) : status === 'error' ? (
        <EmptyState
          icon={FileText}
          title="We couldn’t load your documents."
          description={`Please refresh the page. If it keeps happening, send us this message: ${error ?? 'unknown error'}`}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={total === 0 ? 'No documents yet.' : 'No documents match your search.'}
          description={
            total === 0
              ? 'Open a Workspace and create a record — it will show up here.'
              : 'Try a different name or Workspace.'
          }
          action={total === 0 ? <Button to="/platform/my-systems">Go to My Workspaces</Button> : undefined}
        />
      ) : (
        <div className="space-y-10">
          {visible.map((group) => (
            <section key={group.productSlug}>
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="font-display text-lg font-bold text-navy">{group.productName}</h2>
                <span className="text-[13px] text-navy/45">
                  {group.documents.length} {group.documents.length === 1 ? 'document' : 'documents'}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.documents.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} to={workspaceViewerPath(group.productSlug, doc.id)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
