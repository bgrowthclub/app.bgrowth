import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Receipt } from 'lucide-react'
import SEO from '../../../components/seo/SEO'
import SectionHeader from '../../../components/ui/SectionHeader'
import SearchBar from '../../../components/ui/SearchBar'
import EmptyState from '../../../components/ui/EmptyState'
import Pagination from '../../../components/ui/Pagination'
import MonthlyRevenueChart from '../../../components/admin/MonthlyRevenueChart'
import type { MonthPoint } from '../../../components/admin/MonthlyRevenueChart'
import { CARD, formatDate, pillClass } from '../../../components/admin/styles'
import { adminService } from '../../../modules/admin/adminService'
import type { AdminSale, AdminSalesReport } from '../../../modules/admin/types'

const PAGE_SIZE = 20

function money(cents: number, currency = 'usd', decimals = true) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(cents / 100)
}

const net = (s: AdminSale) => s.amount - (s.refunded ?? 0)

function monthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Admin → Sales: every paid Stripe checkout of the last 12 months (Website
// and Portal), the month's revenue at a glance, and a searchable list.
export default function AdminSalesPage() {
  const [report, setReport] = useState<AdminSalesReport | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string>()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

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
  }, [])

  const currency = report?.sales[0]?.currency ?? 'usd'

  const months: MonthPoint[] = useMemo(() => {
    if (!report) return []
    const now = new Date()
    const list: MonthPoint[] = []
    for (let i = report.months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      list.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        fullLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        amount: 0,
        orders: 0,
      })
    }
    const byKey = new Map(list.map((m) => [m.key, m]))
    for (const sale of report.sales) {
      const m = byKey.get(monthKey(sale.createdAt))
      if (!m) continue
      m.amount += net(sale)
      m.orders += 1
    }
    return list
  }, [report])

  const thisMonth = months[months.length - 1]
  const lastMonth = months[months.length - 2]
  const year = months.reduce((n, m) => n + m.amount, 0)
  const refunds = report?.sales.reduce((n, s) => n + (s.refunded ?? 0), 0) ?? 0

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = report?.sales ?? []
    if (!q) return list
    return list.filter((s) => (s.email ?? '').toLowerCase().includes(q) || (s.productName ?? '').toLowerCase().includes(q))
  }, [report, query])

  useEffect(() => setPage(1), [query])
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE)
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const whole = (cents: number) => money(cents, currency, false)

  return (
    <div className="mx-auto max-w-6xl">
      <SEO title="Sales · Admin" description="BGrowth sales." path="/platform/admin/sales" />
      <SectionHeader
        eyebrow="Admin"
        title="Sales"
        description="Every paid purchase from the last 12 months — on the Website and on the Portal — straight from Stripe."
        className="mb-8"
      />

      {status === 'loading' ? (
        <p className="py-16 text-center text-[14px] text-navy/40">Loading sales from Stripe…</p>
      ) : status === 'error' || !report ? (
        <EmptyState icon={Receipt} title="We couldn’t load the sales." description={error} />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'This month', value: money(thisMonth.amount, currency), hint: `${thisMonth.orders} ${thisMonth.orders === 1 ? 'order' : 'orders'}` },
              { label: 'Last month', value: money(lastMonth.amount, currency), hint: `${lastMonth.orders} ${lastMonth.orders === 1 ? 'order' : 'orders'}` },
              { label: 'Last 12 months', value: money(year, currency), hint: `${report.sales.length} ${report.sales.length === 1 ? 'order' : 'orders'}` },
              {
                label: 'Refunded',
                value: report.refundsAvailable ? money(refunds, currency) : '—',
                hint: report.refundsAvailable ? 'last 12 months' : 'needs Stripe read access',
              },
            ].map((tile) => (
              <div key={tile.label} className={`${CARD} p-5`}>
                <p className="text-[12px] font-medium text-navy/45">{tile.label}</p>
                <p className="mt-1.5 font-display text-2xl font-bold text-navy">{tile.value}</p>
                <p className="mt-0.5 text-[12px] text-navy/40">{tile.hint}</p>
              </div>
            ))}
          </div>

          <section className={`${CARD} p-5`}>
            <h2 className="mb-4 font-display text-lg font-bold text-navy">Net revenue per month</h2>
            <MonthlyRevenueChart months={months} formatMoney={whole} />
          </section>

          <section>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
              <h2 className="flex-1 font-display text-lg font-bold text-navy">Orders</h2>
              <div className="md:w-80">
                <SearchBar value={query} onChange={setQuery} placeholder="Search e-mail or Workspace…" />
              </div>
            </div>

            {visible.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title={report.sales.length === 0 ? 'No paid sales yet.' : 'No orders match your search.'}
                description={report.sales.length === 0 ? 'Paid purchases show up here as soon as Stripe confirms them.' : undefined}
              />
            ) : (
              <div className={`${CARD} divide-y divide-navy/[0.06] overflow-hidden`}>
                {visible.map((sale) => (
                  <SaleRow key={sale.id} sale={sale} />
                ))}
              </div>
            )}
            <div className="mt-6">
              <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            </div>
            {report.truncated && (
              <p className="mt-4 text-center text-[12px] text-navy/40">Showing the most recent 2,000 sales.</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function SaleRow({ sale }: { sale: AdminSale }) {
  const refunded = sale.refunded ?? 0
  const full = refunded > 0 && refunded >= sale.amount
  const who = sale.email ?? 'Unknown customer'
  return (
    <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-navy">{sale.productName ?? 'Workspace'}</p>
        <p className="truncate text-[12.5px] text-navy/50">
          {sale.userId ? (
            <Link to={`/platform/admin/members/${sale.userId}`} className="hover:text-primary hover:underline">
              {who}
            </Link>
          ) : (
            who
          )}{' '}
          · {formatDate(sale.createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-2 sm:shrink-0">
      <span className={pillClass(sale.source === 'website' ? 'blue' : 'gray')}>{sale.source === 'website' ? 'Website' : 'Portal'}</span>
      {refunded > 0 && <span className={pillClass('red')}>{full ? 'Refunded' : `Refunded ${money(refunded, sale.currency)}`}</span>}
      <p className={`ml-auto w-24 text-right font-display text-[15px] font-bold ${full ? 'text-navy/35 line-through' : 'text-navy'}`}>
        {money(sale.amount, sale.currency)}
      </p>
      </div>
    </div>
  )
}
