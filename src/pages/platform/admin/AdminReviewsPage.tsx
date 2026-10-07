import { useEffect, useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import EmptyState from '../../../components/ui/EmptyState'
import Button from '../../../components/ui/Button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import AdminStatTile from '../../../components/admin/AdminStatTile'
import AdminReviewRow from '../../../components/admin/AdminReviewRow'
import { CARD, INPUT, SMALL_BUTTON } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminReview } from '../../../modules/admin/types'

const PAGE = 30
const DAY = 24 * 60 * 60 * 1000

const average = (list: AdminReview[]) => (list.length ? list.reduce((n, r) => n + r.rating, 0) / list.length : 0)

// Admin → Reviews: every member review of every Workspace (the same ones
// the Portal and the product pages show), filtered by Workspace or stars,
// with removing one that breaks the rules.
export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState('')
  const [stars, setStars] = useState(0)
  const [visible, setVisible] = useState(PAGE)
  const [removing, setRemoving] = useState<AdminReview | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    adminService
      .listReviews()
      .then(setReviews)
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the reviews.'))
  }, [])

  const products = useMemo(() => {
    const byId = new Map<string, string>()
    for (const r of reviews ?? []) byId.set(r.product_id, r.product_name)
    return [...byId].sort((a, b) => a[1].localeCompare(b[1]))
  }, [reviews])

  const filtered = useMemo(
    () => (reviews ?? []).filter((r) => (!product || r.product_id === product) && (!stars || r.rating === stars)),
    [reviews, product, stars],
  )

  async function confirmRemove() {
    if (!removing) return
    setBusy(true)
    setError(null)
    try {
      await adminService.removeReview(removing.id)
      setReviews((list) => (list ?? []).filter((r) => r.id !== removing.id))
      setRemoving(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t remove the review.')
      setRemoving(null)
    } finally {
      setBusy(false)
    }
  }

  const all = reviews ?? []
  const recent = all.filter((r) => Date.now() - new Date(r.created_at).getTime() < 30 * DAY)

  return (
    <div className="mx-auto max-w-5xl">
      <SEO title="Reviews · Admin" description="Members’ reviews of Workspaces." path="/platform/admin/reviews" />
      <SectionHeader
        eyebrow="Admin"
        title="Reviews"
        description="What members say about each Workspace — the same reviews shown on the product pages and in the Portal."
        className="mb-8"
      />

      {!reviews ? (
        error ? (
          <EmptyState icon={Star} title="We couldn’t load the reviews." description={error} />
        ) : (
          <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
        )
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <AdminStatTile label="Reviews" value={String(all.length)} />
            <AdminStatTile label="Average rating" value={all.length ? `${average(all).toFixed(1)} ★` : '—'} />
            <AdminStatTile label="Last 30 days" value={String(recent.length)} hint={recent.length ? `${average(recent).toFixed(1)} ★ average` : undefined} />
          </div>

          <div className="flex flex-wrap gap-2">
            <select value={product} onChange={(e) => { setProduct(e.target.value); setVisible(PAGE) }} aria-label="Workspace" className={`${INPUT} !w-auto min-w-0 flex-1`}>
              <option value="">All Workspaces</option>
              {products.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <select value={stars} onChange={(e) => { setStars(Number(e.target.value)); setVisible(PAGE) }} aria-label="Stars" className={`${INPUT} !w-auto`}>
              <option value={0}>All ratings</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-[14px] text-red-500">{error}</p>}

          {filtered.length === 0 ? (
            <EmptyState
              icon={Star}
              title={all.length ? 'No reviews match.' : 'No reviews yet.'}
              description={all.length ? 'Try another Workspace or rating.' : 'Members can review a Workspace they have, on its page or inside it.'}
            />
          ) : (
            <>
              <div className={`${CARD} divide-y divide-navy/[0.06] overflow-hidden`}>
                {filtered.slice(0, visible).map((r) => (
                  <AdminReviewRow key={r.id} review={r} onRemove={() => setRemoving(r)} />
                ))}
              </div>
              {filtered.length > visible && (
                <div className="text-center">
                  <Button type="button" variant="secondary" onClick={() => setVisible((n) => n + PAGE)} className={SMALL_BUTTON}>
                    Show more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={removing !== null}
        title="Remove this review?"
        description={removing ? `“${removing.title}” by ${removing.display_name} will disappear from the site and the Portal. This can’t be undone.` : undefined}
        confirmLabel="Remove review"
        tone="danger"
        busy={busy}
        onConfirm={() => void confirmRemove()}
        onCancel={() => setRemoving(null)}
      />
    </div>
  )
}
