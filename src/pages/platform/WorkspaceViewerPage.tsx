import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Lock } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import Button from '../../components/ui/Button'
import DocumentWorkspaceRenderer from '../../components/workspace/DocumentWorkspaceRenderer'
import CalculatorRunner from '../../components/calculator/CalculatorRunner'
import RecordSwitcher from '../../components/workspace/RecordSwitcher'
import RecordsPanel from '../../components/workspace/RecordsPanel'
import NewRecordDialog from '../../components/workspace/NewRecordDialog'
import ReviewPrompt from '../../components/reviews/ReviewPrompt'
import { CARD } from '../../components/workspace/styles'
import { useIdentity } from '../../modules/identity/IdentityContext'
import { useStudioWorkspace } from '../../modules/workspace/hooks/useStudioWorkspace'
import { useProductReviews } from '../../modules/workspace/hooks/useProductReviews'
import { studioWorkspaceService } from '../../modules/workspace/services/studioWorkspaceService'
import { workspaceViewerPath } from '../../modules/workspace/config'
import type { WorkspaceData } from '../../modules/workspace/types/content'
import { isCalculatorConfig } from '../../modules/calculator/types'
import type { CalculatorSavedData } from '../../modules/calculator/types'

// Opens a Studio-published Workspace — or, since Sprint 78, a Studio
// calculator (content_type 'calculator', same records and access rules) —
// inside the customer area — the same
// Workspace a member works through on the Portal (same account, same saved
// records). Without ?instance= it's a blank, unsaved copy; "New record"
// creates a named, saved one.
export default function WorkspaceViewerPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const instanceId = searchParams.get('instance')
  const navigate = useNavigate()
  const { user } = useIdentity()
  const ws = useStudioWorkspace(slug, user?.id)
  // The member's own review (written here or on the product page / Portal).
  const reviews = useProductReviews(
    ws.hasAccess ? ws.product?.id : undefined,
    user ? { id: user.id, displayName: user.displayName } : null,
    false,
  )

  const [naming, setNaming] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // "Recently opened" on the member's license — once per visit.
  const recordedRef = useRef(false)
  useEffect(() => {
    // Skipped when the Portal database has no last_opened_at column yet.
    if (ws.hasAccess && ws.license && 'last_opened_at' in ws.license && !recordedRef.current) {
      recordedRef.current = true
      void studioWorkspaceService.recordOpened(ws.license.id).catch(() => undefined)
    }
  }, [ws.hasAccess, ws.license])

  if (!slug) return <Navigate to="/platform/my-systems" replace />
  if (ws.status === 'loading') return <p className="py-20 text-center text-[14px] text-navy/40">Loading Workspace…</p>
  if (ws.status === 'not-found') return <Navigate to="/platform/my-systems" replace />

  if (ws.status === 'error' || !ws.product) {
    return (
      <div className={`${CARD} mx-auto mt-10 max-w-lg p-8 text-center`}>
        <p className="font-display text-lg font-bold text-navy">Couldn&rsquo;t load this Workspace.</p>
        <p className="mt-2 text-[14px] text-navy/50">Check your connection and try again.</p>
        {ws.error && (
          <p className="mt-4 break-words rounded-xl bg-bg-soft px-4 py-3 text-left text-[12px] text-navy/60">
            Details: {ws.error}
          </p>
        )}
        <Button type="button" onClick={ws.retry} className="mt-6">
          Try Again
        </Button>
      </div>
    )
  }

  const product = ws.product
  // A saved record goes back to My Documents (where records live); the
  // blank copy goes back to My Workspaces.
  const back = instanceId
    ? { to: '/platform/documents', label: 'My Documents' }
    : { to: '/platform/my-systems', label: 'My Workspaces' }
  const backLink = (
    <Link to={back.to} className="no-print inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
      <ArrowLeft className="h-4 w-4" />
      {back.label}
    </Link>
  )

  if (!ws.hasAccess) {
    const noun = product.content_type === 'calculator' ? 'Calculator' : 'Workspace'
    return (
      <div className="mx-auto max-w-2xl">
        <SEO title={product.name} description={product.short_description} path={`/platform/workspace/${slug}`} />
        {backLink}
        <div className={`${CARD} mt-6 p-10 text-center`}>
          <Lock className="mx-auto h-8 w-8 text-navy/30" />
          <h1 className="mt-4 font-display text-2xl font-bold text-navy">{product.name}</h1>
          <p className="mt-2 text-[14px] text-navy/55">
            {ws.accessState === 'expired'
              ? `Your access to this ${noun} has ended.`
              : `You don’t have access to this ${noun} yet.`}
          </p>
          <Button to={`/product/${product.slug}`} className="mt-6">
            See {noun}
          </Button>
        </div>
      </div>
    )
  }

  const instance = instanceId ? ws.records.find((r) => r.id === instanceId) : undefined
  // A stale or someone else's record id — back to the blank copy.
  if (instanceId && !instance) return <Navigate to={workspaceViewerPath(product.slug)} replace />

  const recordPath = (id?: string) => workspaceViewerPath(product.slug, id)

  async function handleCreate(label: string) {
    if (!user) return
    setCreating(true)
    setCreateError(null)
    try {
      const created = await studioWorkspaceService.createInstance(user.id, product.id, label)
      await ws.reloadRecords()
      setNaming(false)
      navigate(recordPath(created.id))
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Couldn’t create the record. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  async function handleSave(data: WorkspaceData) {
    if (!instance) return
    await studioWorkspaceService.saveInstanceData(instance.id, data)
    void ws.reloadRecords()
  }

  return (
    <div className="mx-auto max-w-5xl">
      <SEO title={product.name} description={product.short_description} path={`/platform/workspace/${slug}`} />

      <div className="no-print flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {backLink}
          <h1 className="mt-2 break-words font-display text-2xl font-bold text-navy md:text-3xl">{product.name}</h1>
          <p className="mt-1 text-[13px] text-navy/45">
            {instance ? `Record: ${instance.label}` : 'Blank copy — create a record to save your answers.'}
          </p>
        </div>
        <RecordSwitcher
          records={ws.records}
          currentId={instance?.id ?? null}
          recordPath={recordPath}
          onNew={() => setNaming(true)}
        />
      </div>

      {!instance && (
        <div className="mt-6">
          <RecordsPanel records={ws.records} recordPath={recordPath} onNew={() => setNaming(true)} />
          <div className="mt-4">
            <ReviewPrompt workspaceName={product.name} reviews={reviews} />
          </div>
        </div>
      )}

      <div className="mt-8">
        {product.content_type === 'calculator' && isCalculatorConfig(product.content) ? (
          <CalculatorRunner
            key={instance?.id ?? 'blank'}
            config={product.content}
            initialData={instance?.data as Partial<CalculatorSavedData> | undefined}
            onSave={instance ? (data) => handleSave(data as unknown as WorkspaceData) : undefined}
          />
        ) : product.content ? (
          <DocumentWorkspaceRenderer
            key={instance?.id ?? 'blank'}
            content={product.content}
            initialData={instance?.data as WorkspaceData | undefined}
            onSave={instance ? handleSave : undefined}
            instanceLabel={instance?.label}
            back={back}
          />
        ) : (
          <div className={`${CARD} flex min-h-[40vh] flex-col items-center justify-center gap-3 p-12 text-center`}>
            <h2 className="font-display text-2xl font-bold text-navy">Content coming soon</h2>
            <p className="max-w-md text-sm text-navy/50">This Workspace hasn&rsquo;t been published with its content yet.</p>
          </div>
        )}
      </div>

      <NewRecordDialog
        open={naming}
        submitting={creating}
        error={createError}
        onSubmit={handleCreate}
        onCancel={() => setNaming(false)}
      />
    </div>
  )
}
