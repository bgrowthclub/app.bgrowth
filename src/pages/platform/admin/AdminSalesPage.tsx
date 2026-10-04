import { useEffect, useMemo, useState } from 'react'
import { Download, Receipt } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import SearchBar from '../../../components/ui/SearchBar'
import EmptyState from '../../../components/ui/EmptyState'
import Pagination from '../../../components/ui/Pagination'
import Button from '../../../components/ui/Button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import MonthlyRevenueChart from '../../../components/admin/MonthlyRevenueChart'
import type { MonthPoint } from '../../../components/admin/MonthlyRevenueChart'
import AdminStatTile from '../../../components/admin/AdminStatTile'
import SalesOrderList, { saleStatus } from '../../../components/admin/SalesOrderList'
import { CARD, SMALL_BUTTON } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminSale, AdminSalesReport } from '../../../modules/admin/types'

const PAGE_SIZE = 20
const PERIODS = [3, 6, 12] as const
type Period = (typeof PERIODS)[number]

const SELECT =
  'rounded-xl2 border border-navy/10 bg-white px-4 py-3 text-[14px] text-navy shadow-softer outline-none focus:border-primary/30'

function money(cents: number, currency = 'usd', decimals = true) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(cents / 100)
}

const refundedOf = (s: AdminSale) => s.refunded ?? 0
const net = (s: AdminSale) => s.amount - refundedOf(s)
const sum = (list: AdminSale[], f: (s: AdminSale) => number) => list.reduce((n, s) => n + f(s), 0)

function monthStart(offset: number) {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() - offset, 1)
}

function between(list: AdminSale[], from: Date, to: Date) {
  return list.filter((s) => {
    const t = new Date(s.createdAt).getTime()
    return t >= from.getTime() && t < to.getTime()
  })
}

// Percent change, or null when there's nothing to compare with.
function change(current: number, previous: number) {
  return previous > 0 ? ((current - previous) / previous) * 100 : null
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function downloadCsv(rows: AdminSale[]) {
  const header = ['Date', 'Customer', 'Workspace', 'Source', 'Amount', 'Refunded', 'Currency', 'Status', 'Stripe']
  const cell = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines = rows.map((s) =>
    [
      new Date(s.createdAt).toISOString(),
      s.email ?? '',
      s.productName ?? '',
      s.source === 'website' ? 'Website' : 'Portal',
      (s.amount / 100).toFixed(2),
      (refundedOf(s) / 100).toFixed(2),
      s.currency.toUpperCase(),
      saleStatus(s).label,
      s.stripeUrl ?? '',
    ]
      .map(cell)
      .join(','),
  )
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bgrowth-sales-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// Admin → Sales: every paid Stripe checkout (Website and Portal) of up to
// the last 12 months — filterable by period, source and Workspace, with
// headline numbers, net revenue per month, the orders and a CSV export.
export default function AdminSalesPage() {
  const [report, setReport] = useState<AdminSalesReport | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string>()
  const [period, setPeriod] = useState<Period>(12)
  const [source, setSource] = useState<'all' | 'website' | 'portal'>('all')
  const [product, setProduct] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const [reload, setReload] = useState(0)
  const [refundTarget, setRefundTarget] = useState<AdminSale | null>(null)
  const [refunding, setRefunding] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  async function confirmRefund() {
    if (!refundTarget) return
    setRefunding(true)
    setMessage(null)
    try {
      const result = await adminService.refundSale(refundTarget.id)
      setMessage({
        tone: 'ok',
        text: `Refunded ${money(result.refund.amount, refundTarget.currency)} to ${refundTarget.email ?? 'the customer'}.${
          result.accessEnded ? ' Their access to this Workspace has ended.' : ' End their access on the member’s record if needed.'
        }`,
      })
      setReload((n) => n + 1)
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : String(err) })
    } finally {
      setRefunding(false)
      setRefundTarget(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    let cancelled = false
    adminService
      .listSales()
      .then((next) => {
        if (cancelled) return
        setReport(next)
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
  }, [reload])

  const currency = report?.sales[0]?.currency ?? 'usd'

  const products = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of report?.sales ?? []) if (s.productSlug) map.set(s.productSlug, s.productName ?? s.productSlug)
    return Array.from(map, ([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [report])

  // Source + Workspace filters apply everywhere; the period picks the window.
  const scoped = useMemo(
    () =>
      (report?.sales ?? []).filter(
        (s) => (source === 'all' || s.source === source) && (product === 'all' || s.productSlug === product),
      ),
    [report, source, product],
  )

  const inPeriod = useMemo(() => between(scoped, monthStart(period - 1), monthStart(-1)), [scoped, period])

  const months: MonthPoint[] = useMemo(() => {
    const list: MonthPoint[] = []
    for (let i = period - 1; i >= 0; i--) {
      const d = monthStart(i)
      const rows = between(scoped, d, monthStart(i - 1))
      list.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        fullLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        amount: sum(rows, net),
        gross: sum(rows, (s) => s.amount),
        refunded: sum(rows, refundedOf),
        orders: rows.length,
      })
    }
    return list
  }, [scoped, period])

  const thisMonth = between(scoped, monthStart(0), monthStart(-1))
  const lastMonth = between(scoped, monthStart(1), monthStart(0))
  const monthBefore = between(scoped, monthStart(2), monthStart(1))
  // The previous equal-length window exists only inside the 12 months loaded.
  const previousPeriod = period <= 6 ? between(scoped, monthStart(2 * period - 1), monthStart(period - 1)) : null
  const periodGross = sum(inPeriod, (s) => s.amount)
  const periodRefunds = sum(inPeriod, refundedOf)
  const refundCount = inPeriod.filter((s) => refundedOf(s) > 0).length

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return inPeriod
    return inPeriod.filter((s) => (s.email ?? '').toLowerCase().includes(q) || (s.productName ?? '').toLowerCase().includes(q))
  }, [inPeriod, query])

  useEffect(() => setPage(1), [query, period, source, product])
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE)
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const whole = (cents: number) => money(cents, currency, false)

  return (
    <div className="mx-auto max-w-6xl">
      <SEO title="Sales · Admin" description="BGrowth sales." path="/platform/admin/sales" />
      <SectionHeader
        eyebrow="Admin"
        title="Sales"
        description="Paid orders and revenue across BGrowth — the Website and the Portal — straight from Stripe."
        className="mb-6"
      />

      {status === 'loading' ? (
        <p className="py-16 text-center text-[14px] text-navy/40">Loading sales from Stripe…</p>
      ) : status === 'error' || !report ? (
        <EmptyState icon={Receipt} title="We couldn’t load the sales." description={error} />
      ) : (
        <div className="space-y-8">
          {message && (
            <p
              className={`rounded-xl px-4 py-3 text-[13px] ${
                message.tone === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
              }`}
            >
              {message.text}
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <select value={period} onChange={(e) => setPeriod(Number(e.target.value) as Period)} className={SELECT} aria-label="Period">
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  Last {p} months
                </option>
              ))}
            </select>
            <select value={source} onChange={(e) => setSource(e.target.value as typeof source)} className={SELECT} aria-label="Source">
              <option value="all">All sources</option>
              <option value="website">Website</option>
              <option value="portal">Portal</option>
            </select>
            <select value={product} onChange={(e) => setProduct(e.target.value)} className={`${SELECT} sm:max-w-xs`} aria-label="Workspace">
              <option value="all">All Workspaces</option>
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="sm:ml-auto">
              <Button
                type="button"
                variant="secondary"
                icon={<Download size={15} />}
                onClick={() => downloadCsv(filtered)}
                disabled={filtered.length === 0}
                className={SMALL_BUTTON}
              >
                Export CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <AdminStatTile
              label="This month"
              value={money(sum(thisMonth, net), currency)}
              hint={plural(thisMonth.length, 'order')}
              change={change(sum(thisMonth, net), sum(lastMonth, net))}
            />
            <AdminStatTile
              label="Last month"
              value={money(sum(lastMonth, net), currency)}
              hint={plural(lastMonth.length, 'order')}
              change={change(sum(lastMonth, net), sum(monthBefore, net))}
            />
            <AdminStatTile
              label={`Last ${period} months`}
              value={money(sum(inPeriod, net), currency)}
              hint={plural(inPeriod.length, 'order')}
              change={previousPeriod ? change(sum(inPeriod, net), sum(previousPeriod, net)) : null}
            />
            <AdminStatTile
              label="Refunded"
              value={report.refundsAvailable ? money(periodRefunds, currency) : '—'}
              hint={
                !report.refundsAvailable
                  ? 'needs Stripe read access'
                  : refundCount === 0
                    ? 'no refunds'
                    : `${plural(refundCount, 'refund')} · ${Math.round((periodRefunds / Math.max(periodGross, 1)) * 100)}% of sales`
              }
            />
          </div>

          <section className={`${CARD} p-5`}>
            <h2 className="font-display text-lg font-bold text-navy">Net revenue per month</h2>
            <p className="mb-4 mt-0.5 text-[13px] text-navy/45">Paid sales minus refunds. Hover a month for the details.</p>
            <MonthlyRevenueChart months={months} formatMoney={whole} />
          </section>

          <section>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
              <h2 className="flex-1 font-display text-lg font-bold text-navy">
                Orders <span className="text-[14px] font-medium text-navy/40">({filtered.length})</span>
              </h2>
              <div className="md:w-80">
                <SearchBar value={query} onChange={setQuery} placeholder="Search e-mail or Workspace…" />
              </div>
            </div>

            {visible.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title={report.sales.length === 0 ? 'No paid sales yet.' : 'No orders match these filters.'}
                description={report.sales.length === 0 ? 'Paid purchases show up here as soon as Stripe confirms them.' : undefined}
              />
            ) : (
              <SalesOrderList sales={visible} formatMoney={(cents, cur) => money(cents, cur)} onRefund={setRefundTarget} />
            )}
            <div className="mt-6">
              <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            </div>
            <ConfirmDialog
              open={refundTarget !== null}
              tone="danger"
              title="Refund this order?"
              description={
                refundTarget && (
                  <>
                    <strong className="font-semibold text-navy">
                      {money(refundTarget.amount - (refundTarget.refunded ?? 0), refundTarget.currency)}
                    </strong>{' '}
                    goes back to {refundTarget.email ?? 'the customer'} for{' '}
                    <strong className="font-semibold text-navy">{refundTarget.productName ?? 'this Workspace'}</strong>, and
                    their access to it ends. Their documents are kept. This can’t be undone in Stripe.
                  </>
                )
              }
              confirmLabel="Refund"
              busy={refunding}
              onCancel={() => setRefundTarget(null)}
              onConfirm={confirmRefund}
            />
            {report.truncated && (
              <p className="mt-4 text-center text-[12px] text-navy/40">Showing the most recent 2,000 sales.</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
