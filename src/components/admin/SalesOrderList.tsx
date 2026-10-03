import { Link } from 'react-router-dom'
import { ExternalLink, MoreHorizontal, UserRound } from 'lucide-react'
import Popover from '../platform/Popover'
import type { AdminSale } from '../../modules/admin/types'
import { CARD, pillClass } from './styles'
import type { Tone } from './styles'

interface Props {
  sales: AdminSale[]
  formatMoney: (cents: number, currency: string) => string
}

export function saleStatus(sale: AdminSale): { label: string; tone: Tone } {
  const refunded = sale.refunded ?? 0
  if (refunded > 0 && refunded >= sale.amount) return { label: 'Refunded', tone: 'red' }
  if (refunded > 0) return { label: 'Partly refunded', tone: 'amber' }
  return { label: 'Paid', tone: 'green' }
}

function dateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function Actions({ sale }: { sale: AdminSale }) {
  if (!sale.stripeUrl && !sale.userId) return null
  return (
    <Popover
      panelClassName="w-48 py-1.5"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label="Order actions"
          className="grid h-8 w-8 place-items-center rounded-full text-navy/40 transition-colors hover:bg-bg-soft hover:text-navy"
        >
          <MoreHorizontal size={16} />
        </button>
      )}
    >
      {sale.userId && (
        <Link to={`/platform/admin/members/${sale.userId}`} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-navy/70 hover:bg-bg-soft hover:text-navy">
          <UserRound size={14} /> View member
        </Link>
      )}
      {sale.stripeUrl && (
        <a
          href={sale.stripeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-navy/70 hover:bg-bg-soft hover:text-navy"
        >
          <ExternalLink size={14} /> Open in Stripe
        </a>
      )}
    </Popover>
  )
}

function Customer({ sale }: { sale: AdminSale }) {
  const who = sale.email ?? 'Unknown customer'
  return sale.userId ? (
    <Link to={`/platform/admin/members/${sale.userId}`} className="hover:text-primary hover:underline">
      {who}
    </Link>
  ) : (
    <>{who}</>
  )
}

// The orders list on Admin → Sales: a table on wide screens, cards on
// phones (a 7-column table doesn't fit a phone).
export default function SalesOrderList({ sales, formatMoney }: Props) {
  return (
    <div className={CARD}>
      <table className="hidden w-full table-fixed text-left text-[13px] md:table">
        <colgroup>
          <col className="w-[140px]" />
          <col />
          <col />
          <col className="w-[92px]" />
          <col className="w-[96px]" />
          <col className="w-[132px]" />
          <col className="w-[52px]" />
        </colgroup>
        <thead>
          <tr className="border-b border-navy/[0.06] text-[11.5px] font-semibold uppercase tracking-wide text-navy/40">
            <th className="px-5 py-3">Date</th>
            <th className="px-3 py-3">Customer</th>
            <th className="px-3 py-3">Workspace</th>
            <th className="px-3 py-3">Source</th>
            <th className="px-3 py-3 text-right">Amount</th>
            <th className="px-3 py-3">Status</th>
            <th className="w-12 px-3 py-3" aria-label="Actions" />
          </tr>
        </thead>
        <tbody className="divide-y divide-navy/[0.06]">
          {sales.map((sale) => {
            const status = saleStatus(sale)
            return (
              <tr key={sale.id}>
                <td className="px-5 py-3">
                  <p className="text-navy/70">{new Date(sale.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-[11.5px] text-navy/40">{new Date(sale.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                </td>
                <td className="truncate px-3 py-3.5 text-navy/70">
                  <Customer sale={sale} />
                </td>
                <td className="truncate px-3 py-3.5 font-medium text-navy" title={sale.productName ?? undefined}>{sale.productName ?? 'Workspace'}</td>
                <td className="px-3 py-3.5">
                  <span className={pillClass(sale.source === 'website' ? 'blue' : 'gray')}>{sale.source === 'website' ? 'Website' : 'Portal'}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-right font-semibold text-navy">{formatMoney(sale.amount, sale.currency)}</td>
                <td className="px-3 py-3.5">
                  <span className={pillClass(status.tone)}>{status.label}</span>
                </td>
                <td className="px-3 py-2">
                  <Actions sale={sale} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="divide-y divide-navy/[0.06] md:hidden">
        {sales.map((sale) => {
          const status = saleStatus(sale)
          return (
            <div key={sale.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-navy">{sale.productName ?? 'Workspace'}</p>
                  <p className="truncate text-[12.5px] text-navy/50">
                    <Customer sale={sale} />
                  </p>
                  <p className="text-[12px] text-navy/40">{dateTime(sale.createdAt)}</p>
                </div>
                <Actions sale={sale} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={pillClass(sale.source === 'website' ? 'blue' : 'gray')}>{sale.source === 'website' ? 'Website' : 'Portal'}</span>
                <span className={pillClass(status.tone)}>{status.label}</span>
                <p className="ml-auto font-display text-[15px] font-bold text-navy">{formatMoney(sale.amount, sale.currency)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
