import { useCallback, useEffect, useMemo, useState } from 'react'
import { Mail, Megaphone } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import EmptyState from '../../../components/ui/EmptyState'
import Button from '../../../components/ui/Button'
import AdminStatTile from '../../../components/admin/AdminStatTile'
import NewsletterCampaignRow from '../../../components/admin/NewsletterCampaignRow'
import NewsletterCampaignForm from '../../../components/admin/NewsletterCampaignForm'
import { CARD, INPUT, SMALL_BUTTON } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminNewsletterCampaign, AdminNewsletterOverview, AdminProduct } from '../../../modules/admin/types'

// Admin → Newsletter: who's subscribed (by area), the e-mails sent and in
// draft, writing a new one, and announcing a newly published Workspace.
export default function AdminNewsletterPage() {
  const [overview, setOverview] = useState<AdminNewsletterOverview | null>(null)
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [error, setError] = useState<string | null>(null)
  // undefined = the list; null = a new e-mail; a campaign = editing it.
  const [open, setOpen] = useState<AdminNewsletterCampaign | null | undefined>(undefined)
  const [launchProduct, setLaunchProduct] = useState('')
  const [address, setAddress] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(() => {
    adminService
      .getNewsletter()
      .then((o) => {
        setOverview(o)
        setAddress(o.address)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn’t load the newsletter.'))
  }, [])

  useEffect(() => {
    load()
    adminService.listProducts().then(setProducts).catch(() => undefined)
  }, [load])

  const areaLabels = useMemo(() => Object.fromEntries((overview?.areas ?? []).map((a) => [a.id, a.label])), [overview])

  async function openCampaign(id: string) {
    setBusy('open')
    try {
      setOpen(await adminService.getNewsletterCampaign(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t open that e-mail.')
    } finally {
      setBusy(null)
    }
  }

  async function announce() {
    if (!launchProduct) return
    setBusy('launch')
    setError(null)
    try {
      const campaign = await adminService.createLaunchCampaign(launchProduct)
      load()
      setOpen(campaign)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t start the announcement.')
    } finally {
      setBusy(null)
    }
  }

  async function saveAddress() {
    setBusy('address')
    setNotice(null)
    try {
      setAddress(await adminService.saveNewsletterAddress(address))
      setNotice('Mailing address saved.')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save the address.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <SEO title="Newsletter · Admin" description="Newsletter and launch e-mails." path="/platform/admin/newsletter" />
      <SectionHeader
        eyebrow="Admin"
        title="Newsletter"
        description="Write e-mails with images, send them to subscribers by area, and announce new Workspaces."
        className="mb-8"
      />

      {open !== undefined ? (
        <NewsletterCampaignForm
          key={open?.id ?? 'new'}
          campaign={open}
          addressMissing={!overview?.address}
          onBack={() => setOpen(undefined)}
          onChanged={load}
        />
      ) : !overview ? (
        error ? (
          <EmptyState icon={Mail} title="We couldn’t load the newsletter." description={error} />
        ) : (
          <p className="py-16 text-center text-[14px] text-navy/40">Loading…</p>
        )
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <AdminStatTile label="Subscribers" value={String(overview.stats.subscribed)} hint={`${overview.stats.allTopics} want all topics`} />
            <AdminStatTile label="Waiting for confirmation" value={String(overview.stats.pending)} />
            <AdminStatTile label="Unsubscribed" value={String(overview.stats.unsubscribed)} />
          </div>

          <div className={`${CARD} p-6`}>
            <p className="text-[14px] font-semibold text-navy">Subscribers by area</p>
            <p className="mt-0.5 text-[12.5px] text-navy/45">Includes everyone who chose “All topics”.</p>
            <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {overview.areas.map((area) => (
                <li key={area.id} className="flex items-center justify-between gap-3 border-b border-navy/[0.05] py-1.5 text-[13.5px]">
                  <span className="text-navy/70">{area.label}</span>
                  <span className="font-semibold tabular-nums text-navy">{overview.stats.byArea[area.id] ?? 0}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className={`${CARD} flex flex-col gap-3 p-6`}>
              <p className="text-[14px] font-semibold text-navy">Write an e-mail</p>
              <p className="text-[13px] text-navy/55">News, tips, a monthly round-up — with images and links.</p>
              <Button type="button" onClick={() => setOpen(null)} className={`${SMALL_BUTTON} self-start`} icon={<Mail size={15} />}>
                New e-mail
              </Button>
            </div>
            <div className={`${CARD} flex flex-col gap-3 p-6`}>
              <p className="text-[14px] font-semibold text-navy">Announce a Workspace</p>
              <p className="text-[13px] text-navy/55">Starts a ready-to-edit e-mail with its cover, name and link, for the people interested in its area.</p>
              <div className="flex flex-wrap gap-2">
                <select
                  value={launchProduct}
                  onChange={(e) => setLaunchProduct(e.target.value)}
                  aria-label="Workspace to announce"
                  className={`${INPUT} min-w-0 flex-1`}
                >
                  <option value="">Choose a published Workspace…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="secondary" onClick={() => void announce()} disabled={!launchProduct || busy !== null} className={SMALL_BUTTON} icon={<Megaphone size={15} />}>
                  {busy === 'launch' ? 'Starting…' : 'Start'}
                </Button>
              </div>
            </div>
          </div>

          <div className={`${CARD} p-6`}>
            <label htmlFor="nl-address" className="text-[14px] font-semibold text-navy">Mailing address</label>
            <p className="mt-0.5 text-[12.5px] text-navy/45">
              Shown at the bottom of every e-mail — required by US law (CAN-SPAM). A P.O. box works. Sending is blocked until it’s filled in.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                id="nl-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="BGrowth · 123 Main St, Suite 100 · City, ST 00000 · USA"
                className={`${INPUT} min-w-0 flex-1`}
              />
              <Button type="button" variant="secondary" onClick={() => void saveAddress()} disabled={busy !== null || address === overview.address} className={SMALL_BUTTON}>
                {busy === 'address' ? 'Saving…' : 'Save'}
              </Button>
            </div>
            {!overview.address && <p className="mt-2 text-[13px] text-amber-700">Not set yet.</p>}
          </div>

          {notice && <p role="status" className="text-[14px] font-medium text-primary">{notice}</p>}
          {error && <p className="text-[14px] text-red-500">{error}</p>}

          <div>
            <h2 className="mb-3 font-display text-lg font-bold text-navy">E-mails</h2>
            {overview.campaigns.length === 0 ? (
              <EmptyState icon={Mail} title="No e-mails yet." description="Write one, or announce a Workspace." />
            ) : (
              <div className={`${CARD} divide-y divide-navy/[0.06] overflow-hidden`}>
                {overview.campaigns.map((c) => (
                  <NewsletterCampaignRow key={c.id} campaign={c} areaLabels={areaLabels} onOpen={() => void openCampaign(c.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
