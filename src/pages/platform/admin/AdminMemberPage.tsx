import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, KeyRound, Plus, UserRound } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import AdminLicenseRow from '../../../components/admin/AdminLicenseRow'
import AdminGrantRow from '../../../components/admin/AdminGrantRow'
import GiveAccessForm from '../../../components/admin/GiveAccessForm'
import type { GiveAccessValues } from '../../../components/admin/GiveAccessForm'
import { CARD, SMALL_BUTTON, formatDate, pillClass } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminMemberDetail, AdminProduct } from '../../../modules/admin/types'

function message(err: unknown) {
  return err instanceof Error ? err.message : String(err)
}

// Admin → one member: who they are, what they bought or are trialing, and
// the access an admin gave them — with the actions to change any of it.
export default function AdminMemberPage() {
  const { id } = useParams()
  const [detail, setDetail] = useState<AdminMemberDetail | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const [products, setProducts] = useState<AdminProduct[]>([])
  const [giving, setGiving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    const next = await adminService.getMember(id)
    setDetail(next)
  }, [id])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    load()
      .then(() => !cancelled && setStatus('ready'))
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadError(message(err))
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [load])

  useEffect(() => {
    if (!giving || products.length) return
    adminService
      .listProducts()
      .then(setProducts)
      .catch((err: unknown) => setFormError(message(err)))
  }, [giving, products.length])

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setActionError(null)
    try {
      await action()
      await load()
    } catch (err) {
      setActionError(message(err))
    } finally {
      setBusy(false)
    }
  }

  async function give(values: GiveAccessValues) {
    if (!id) return
    setBusy(true)
    setFormError(null)
    try {
      if (values.kind === 'purchase') {
        await adminService.giveLicense(id, values.productId)
      } else {
        const result = await adminService.createGrant({
          userId: id,
          scope: values.scope,
          productId: values.scope === 'specific' ? values.productId : undefined,
          expiresAt: values.expiresAt,
          note: values.note || undefined,
          confirmWarning: warning !== null,
        })
        if ('requiresConfirmation' in result) {
          setWarning(result.warning)
          return
        }
      }
      setWarning(null)
      setGiving(false)
      await load()
    } catch (err) {
      setFormError(message(err))
    } finally {
      setBusy(false)
    }
  }

  if (!id) return <Navigate to="/platform/admin/members" replace />

  const back = (
    <Link to="/platform/admin/members" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-navy/50 hover:text-navy">
      <ArrowLeft size={15} /> All members
    </Link>
  )

  if (status === 'loading' && !detail) {
    return (
      <div className="mx-auto max-w-4xl">
        {back}
        <p className="py-16 text-center text-[14px] text-navy/40">Loading member…</p>
      </div>
    )
  }

  if (status === 'error' || !detail) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        {back}
        <EmptyState icon={UserRound} title="We couldn’t load this member." description={loadError} />
      </div>
    )
  }

  const { member, licenses, grants, documents } = detail
  const name = member.fullName?.trim() || member.email.split('@')[0]

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <SEO title={`${name} · Admin`} description="Member record." path={`/platform/admin/members/${member.id}`} />
      {back}

      <section className={`${CARD} flex flex-col gap-5 p-6 sm:flex-row sm:items-center`}>
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-bg-soft font-display text-xl font-bold uppercase text-primary">
          {name.charAt(0)}
        </div>
        <div className="min-w-0 w-full sm:flex-1">
          <h1 className="truncate font-display text-2xl font-bold text-navy">{name}</h1>
          <p className="truncate text-[14px] text-navy/55">{member.email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={pillClass(member.emailConfirmed ? 'green' : 'amber')}>
              {member.emailConfirmed ? 'Email confirmed' : 'Email not confirmed'}
            </span>
            <span className={pillClass(member.hasUsedTrial ? 'gray' : 'blue')}>
              {member.hasUsedTrial ? 'Free trial used' : 'Free trial available'}
            </span>
          </div>
        </div>
        <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-1 text-[12.5px]">
          <dt className="text-navy/40">Joined</dt>
          <dd className="font-medium text-navy/70">{formatDate(member.createdAt)}</dd>
          <dt className="text-navy/40">Last sign-in</dt>
          <dd className="font-medium text-navy/70">{member.lastSignInAt ? formatDate(member.lastSignInAt) : 'Never'}</dd>
        </dl>
      </section>

      {actionError && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">{actionError}</p>}

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-navy">Purchases &amp; trials</h2>
        </div>
        {licenses.length === 0 ? (
          <p className={`${CARD} px-5 py-6 text-[13.5px] text-navy/45`}>No purchases or trials yet.</p>
        ) : (
          <div className={`${CARD} divide-y divide-navy/[0.06]`}>
            {licenses.map((license) => (
              <AdminLicenseRow
                key={license.id}
                license={license}
                documents={documents[license.product_id] ?? 0}
                busy={busy}
                onExtend={(expiresAt) => run(() => adminService.updateLicense(license.id, 'extend', expiresAt))}
                onEnd={() => run(() => adminService.updateLicense(license.id, 'end'))}
                onRestore={() => run(() => adminService.updateLicense(license.id, 'restore'))}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-navy">Manual access</h2>
          {!giving && (
            <Button
              type="button"
              variant="secondary"
              icon={<Plus size={15} />}
              onClick={() => {
                setGiving(true)
                setFormError(null)
                setWarning(null)
              }}
              className={SMALL_BUTTON}
            >
              Give access
            </Button>
          )}
        </div>

        {giving && (
          <div className="mb-4">
            <GiveAccessForm
              products={products}
              busy={busy}
              error={formError}
              warning={warning}
              onSubmit={give}
              onCancel={() => {
                setGiving(false)
                setWarning(null)
              }}
            />
          </div>
        )}

        {grants.length === 0 ? (
          !giving && (
            <p className={`${CARD} flex items-center gap-2 px-5 py-6 text-[13.5px] text-navy/45`}>
              <KeyRound size={15} /> No manual access given.
            </p>
          )
        ) : (
          <div className={`${CARD} divide-y divide-navy/[0.06]`}>
            {grants.map((grant) => (
              <AdminGrantRow key={grant.id} grant={grant} busy={busy} onRevoke={() => run(() => adminService.revokeGrant(grant.id))} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
